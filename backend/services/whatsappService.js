const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const pool = require('../config/database');

class WhatsAppService {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                handleSIGINT: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-extensions'
                ],
                // On Windows, sometimes the executable path needs to be specified if not found, 
                // but usually puppeteer handles it. 
                // headless: 'new' is the default and best for newer puppeteer versions
            }
        });
        this.isInitialized = false;
        this.isInitializing = false;
    }

    async initialize(retryCount = 0) {
        if (this.isInitialized || (this.isInitializing && retryCount === 0)) return;
        
        this.isInitializing = true;
        console.log(`[WhatsApp-Service] Initializing WhatsApp Client (Attempt ${retryCount + 1})...`);

        // ... rest of event listeners stay the same but we only attach them ONCE ...
        if (retryCount === 0) {
            this.attachEventListeners();
        }

        try {
            await this.client.initialize();
        } catch (error) {
            this.isInitializing = false;
            console.error(`[WhatsApp-Service] Initialization Error (Attempt ${retryCount + 1}):`, error.message);
            
            if (retryCount < 2) {
                console.log('[WhatsApp-Service] Retrying initialization in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.initialize(retryCount + 1);
            } else {
                console.error('[WhatsApp-Service] Max initialization retries reached. Please check network/session.');
            }
        }
    }

    attachEventListeners() {
        this.client.on('qr', (qr) => {
            console.log('[WhatsApp-Service] QR Code Received! Scan now:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsApp-Service] Authenticated successfully!');
        });

        this.client.on('auth_failure', (err) => {
            console.error('[WhatsApp-Service] Authentication failure:', err);
        });

        this.client.on('ready', () => {
            console.log('[WhatsApp-Service] WhatsApp Client is ready and connected!');
            this.isInitialized = true;
            this.isInitializing = false;
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log('[WhatsApp-Service] Loading...', percent, '%', message);
        });

        this.client.on('change_state', (state) => {
            console.log('[WhatsApp-Service] State changed:', state);
        });

        this.client.on('disconnected', (reason) => {
            console.warn('[WhatsApp-Service] Client was disconnected:', reason);
            this.isInitialized = false;
            this.isInitializing = false;
        });

        // Re-enabling internal listener as it is the primary handler for confirmations
        this.client.on('message', async (msg) => {
            console.log(`[WhatsApp-Service] Incoming message from ${msg.from}: ${msg.body}`);
            try {
                await this.handleIncomingMessage(msg);
            } catch (error) {
                console.error('[WhatsApp-Service] Error handling message:', error);
            }
        });
    }


    async isStaffNumber(phoneNumber) {
        try {
            const cleanNumber = phoneNumber.replace(/\D/g, '');
            // Check for various formats: 10 digits, 12 digits (with 91), etc.
            let tenDigits = cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber;
            
            const staffQuery = `
                SELECT rm.role_name 
                FROM USERS u
                JOIN ROLE_MASTER rm ON u.role_id = rm.role_id
                WHERE (u.phone_number = $1 OR u.phone_number = $2 OR u.phone_number = $3)
                AND rm.role_name IN ('MANAGER', 'DRIVER')
                AND u.status = TRUE
            `;
            const res = await pool.query(staffQuery, [cleanNumber, tenDigits, '91' + tenDigits]);
            return res.rows.length > 0;
        } catch (error) {
            console.error('[WhatsApp-Service] Error checking staff status:', error);
            return false;
        }
    }

    async handleIncomingMessage(msg) {
        const body = msg.body.trim();
        const from = msg.from; // phone number
        
        // 0. Check if sender is Staff (Manager/Driver) - If so, ignore them
        const isStaff = await this.isStaffNumber(from);
        if (isStaff) {
            console.log(`[WhatsApp-Service] Ignoring incoming message from staff: ${from}`);
            return;
        }

        const contact = await msg.getContact();
        const userName = contact.pushname || 'Customer';

        console.log(`Message from ${from} (${userName}): ${body}`);

        // 1. Check for Parking Request
        if (body.includes('Parking request')) {
            await this.handleParkingRequest(msg, body, from, userName);
            return;
        }

        // 2. Check for Return Request: "RETURN <valet_id>"
        if (body.toUpperCase().startsWith('RETURN')) {
            await this.handleReturnRequest(msg, body);
            return;
        }

        // 3. Check for Feedback: 1-5 rating
        const rating = parseInt(body);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
            await this.handleFeedback(msg, rating);
            return;
        }
    }

    async handleParkingRequest(msg, body, from, userName) {
        // ... (existing logic)
        const locationMatch = body.match(/Premises:\s*([\w-]+)/i);
        const driverMatch = body.match(/Driver:\s*([\w-]+)/i);

        if (!locationMatch || !driverMatch) {
            await msg.reply('Invalid format. Please include both Premises (Location ID) and Driver (Driver ID).');
            return;
        }

        const locationId = locationMatch[1].trim().toUpperCase();
        const driverId = driverMatch[1].trim().toUpperCase();
        
        console.log(`[WhatsApp-Service] Processing Parking Request - Location: ${locationId}, Driver: ${driverId}`);
        
        // Extract vehicle details
        const carNumberMatch = body.match(/Car No:\s*([A-Z0-9-]+)/i) || body.match(/Vehicle No:\s*([A-Z0-9-]+)/i);
        const carNumber = carNumberMatch ? carNumberMatch[1] : null;
        
        const carModelMatch = body.match(/Vehicle:\s*([^\n\r]+)/i) || body.match(/Model:\s*([^\n\r]+)/i);
        const carModel = carModelMatch ? carModelMatch[1].trim() : 'Unknown';

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const validationQuery = `
                SELECT l.location_name FROM LOCATION_ACCESS la
                JOIN LOCATIONS l ON la.location_id = l.location_id
                WHERE UPPER(la.location_id) = $1 AND UPPER(la.user_id) = $2
            `;
            const validResult = await client.query(validationQuery, [locationId, driverId]);
            let locationName = 'Valet Parking';
            if (validResult.rows.length > 0) {
                locationName = validResult.rows[0].location_name;
            } else {
                // Fallback: Fetch location name directly if mapping check failed
                const locRes = await client.query('SELECT location_name FROM LOCATIONS WHERE UPPER(location_id) = $1', [locationId]);
                if (locRes.rows.length > 0) {
                    locationName = locRes.rows[0].location_name;
                }
            }
            const { generateValetId, getNextAvailableKeySlot } = require('../utils/valetUtils');
            const valetId = await generateValetId(locationId);
            const senderId = from;

            // Get Key Slot
            const { slot: keySlot, isOverCapacity } = await getNextAvailableKeySlot(client, locationId);
            
            console.log(`[WhatsApp-Service] Prepared Insert: ValetId=${valetId}, Loc=${locationId}, Driver=${driverId}, Slot=${keySlot}`);
            
            const insertResult = await client.query(
                `INSERT INTO VALET_TRANSACTIONS 
                (valet_id, location_id, parked_driver_id, customer_name, phone_number, car_model, car_number, status, parked_time, key_slot)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'PARKED', NOW(), $8)
                RETURNING *`,
                [valetId, locationId, driverId, userName, senderId, carModel, carNumber, keySlot]
            );

            let transaction = insertResult.rows[0];
            let blockAssigned = false;

            // --- Auto-Block Assignment Logic (Matching valetController) ---
            const blocksResult = await client.query(
                'SELECT block_id FROM BLOCKS WHERE location_id = $1 AND status = TRUE AND valid_from <= CURRENT_DATE AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)',
                [locationId]
            );

            // If exactly one active block exists, auto-assign it
            if (blocksResult.rows.length === 1) {
                const targetBlockId = blocksResult.rows[0].block_id;

                const slotQuery = `
                    SELECT block_entry_id 
                    FROM BLOCK_ENTRIES 
                    WHERE block_id = $1 AND status = 'AVAILABLE'
                    ORDER BY block_entry_id ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                `;
                const slotResult = await client.query(slotQuery, [targetBlockId]);

                if (slotResult.rows.length > 0) {
                    const blockEntryId = slotResult.rows[0].block_entry_id;

                    await client.query(
                        "UPDATE BLOCK_ENTRIES SET status = 'OCCUPIED' WHERE block_entry_id = $1",
                        [blockEntryId]
                    );

                    const updateTxn = await client.query(
                        "UPDATE VALET_TRANSACTIONS SET block_entry_id = $1 WHERE valet_id = $2 RETURNING *",
                        [blockEntryId, valetId]
                    );
                    transaction = updateTxn.rows[0];
                    blockAssigned = true;
                    console.log(`[WhatsApp-Service] Auto-assigned block entry ${blockEntryId} for Valet ${valetId}`);
                }
            }

            await client.query('COMMIT');

            // Send confirmation with Location Name and standard text instructions
            console.log(`[WhatsApp-Service] Success! Valet ${valetId} stored internal slot ${keySlot}. Block Assigned: ${blockAssigned}`);
            
            let confirmationMsg = `✅ *Car Parked Successfully*\n\n` +
                `🎫 *Valet ID:* ${valetId}\n` +
                `📍 *Location:* ${locationName}\n\n` +
                `Your car is safely stored. When you're ready to leave, just send the message below:\n\n` +
                `*Tap to request car:* \nRETURN ${valetId} 🚗💨`;


            await this.sendMessage(from, confirmationMsg);

        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('Parking Request Error:', error);
            await msg.reply('Internal error processing parking request.');
        } finally {
            if (client) client.release();
        }
    }

    async handleReturnRequest(msg, body) {
        const parts = body.split(/\s+/);
        if (parts.length < 2) {
            await msg.reply('Please provide the Valet ID. Format: RETURN <valet_id>');
            return;
        }

        const valetId = parts[1].trim();

        try {
            const result = await pool.query(
                `UPDATE VALET_TRANSACTIONS 
                 SET status = 'RETURN_REQUESTED', return_requested_time = NOW()
                 WHERE valet_id = $1 AND status = 'PARKED'
                 RETURNING *`,
                [valetId]
            );

            if (result.rows.length === 0) {
                // If update failed, check why (maybe it's already being processed)
                const checkRes = await pool.query('SELECT status FROM VALET_TRANSACTIONS WHERE valet_id = $1', [valetId]);
                
                if (checkRes.rows.length === 0) {
                    await msg.reply(`⚠️ *ID Not Found:* The Valet ID *${valetId}* was not found. Please verify the ID on your ticket.`);
                } else {
                    const status = checkRes.rows[0].status;
                    let statusMsg = "Your car is already being processed.";
                    
                    if (status === 'RETURN_REQUESTED' || status === 'ON_THE_WAY') {
                        statusMsg = "⏳ *In Progress:* Your return request is already being processed. Our driver is bringing your car! 🏎️💨";
                    } else if (status === 'READY') {
                        statusMsg = "📍 *Ready:* Your car is already waiting for you at the exit pickup area!";
                    } else if (status === 'RETURNED') {
                        statusMsg = "✅ *Completed:* This vehicle has already been returned to you.";
                    }
                    
                    await msg.reply(`ℹ️ *Status Update:* ${statusMsg}`);
                }
                return;
            }

            await msg.reply(`✅ *Return request received* for ticket ${valetId}.\n\nOur professional driver is already on the way to retrieve your vehicle! 🏎️🏃‍♂️`);
        } catch (error) {
            console.error('Return Request Error:', error);
            await msg.reply('Internal error processing return request.');
        }
    }

    async handleFeedback(msg, rating) {
        // Need to find the last RETURNED transaction for this phone number
        const from = msg.from;
        try {
            const lastTxnQuery = `
                SELECT valet_id FROM VALET_TRANSACTIONS 
                WHERE phone_number = $1 AND status = 'RETURNED'
                ORDER BY returned_time DESC LIMIT 1
            `;
            const txnResult = await pool.query(lastTxnQuery, [from]);

            if (txnResult.rows.length === 0) {
                // Check if they just got the car back or have any history
                await msg.reply('Thank you for the rating!');
                return;
            }

            const valetId = txnResult.rows[0].valet_id;

            // Check if feedback already exists
            const checkQuery = 'SELECT 1 FROM FEEDBACK WHERE valet_id = $1';
            const checkResult = await pool.query(checkQuery, [valetId]);

            if (checkResult.rows.length > 0) {
                console.log(`[WhatsApp-Service] Feedback already exists for Valet ID: ${valetId}`);
                await msg.reply('Thank you! We have already recorded your feedback for your recent trip. 😊');
                return;
            }

            await pool.query(
                'INSERT INTO FEEDBACK (valet_id, rating) VALUES ($1, $2)',
                [valetId, rating]
            );

            await msg.reply(`Thank you for your ${rating}-star rating! We hope to serve you again.`);
        } catch (error) {
            console.error('Feedback Error:', error);
        }
    }

    async sendParkingConfirmation(to, valetId, locationName) {
        const message = `✅ *Car Parked Successfully*\n\n` +
            `🎫 *Valet ID:* ${valetId}\n` +
            `📍 *Location:* ${locationName}\n\n` +
            `Your car is safely stored. When you're ready to leave, just send the message below:\n\n` +
            `*Tap to request car:* \nRETURN ${valetId} 🚗💨`;

        await this.sendMessage(to, message);
    }

    async sendErrorMessage(to, errMsg) {
        const message = `⚠️ *Action Required*\n\n${errMsg}`;
        await this.sendMessage(to, message);
    }

    async sendFeedbackButtons(to, valetId) {
        const message = `✨ *Your car has been returned!*\nSafe travels! 🛣️👋\n\n` +
            `Thank you for choosing Smart Valet! we'd love to hear about your experience. 🌟\n\n` +
            `*How would you rate our service?*\n` +
            `Please reply with a number (1 to 5):\n\n` +
            `5 - ⭐⭐⭐⭐⭐ (Excellent)\n` +
            `4 - ⭐⭐⭐⭐ (Very Good)\n` +
            `3 - ⭐⭐⭐ (Good)\n` +
            `2 - ⭐⭐ (Fair)\n` +
            `1 - ⭐ (Poor)`;

        await this.sendMessage(to, message);
    }

    async sendMessage(to, message) {
        if (!this.isInitialized) {
            console.warn(`[WhatsApp-Service] Attempted to send message before initialization. Target: ${to}`);
            return;
        }

        // Anti-Staff Guard: Skip if recipient is a Manager or Driver
        const isStaff = await this.isStaffNumber(to);
        if (isStaff) {
            console.log(`[WhatsApp-Service] Blocking outgoing message to staff number: ${to}`);
            return;
        }

        try {
            let chatId;
            
            if (to.includes('@')) {
                chatId = to;
            } else {
                let cleanNumber = to.replace(/\D/g, '');
                if (cleanNumber.length === 10) {
                    cleanNumber = '91' + cleanNumber;
                }

                const numberId = await this.client.getNumberId(cleanNumber);
                if (numberId) {
                    chatId = numberId._serialized;
                    console.log(`[WhatsApp-Service] Resolved ID for ${to}: ${chatId}`);
                } else {
                    // Fallback attempt: sometimes formatted number works better for registration check
                    const isRegistered = await this.client.isRegisteredUser(cleanNumber);
                    if (isRegistered) {
                        // Try again now that we checked registration
                        const retryId = await this.client.getNumberId(cleanNumber);
                        chatId = retryId ? retryId._serialized : `${cleanNumber}@c.us`;
                    } else {
                        chatId = `${cleanNumber}@c.us`;
                    }
                    console.warn(`[WhatsApp-Service] Resolution fallback for ${to}: ${chatId}`);
                }
            }

            console.log(`[WhatsApp-Service] Attempting to send message to: ${chatId}`);
            
            // Fix for "No LID for user": Get the contact first, then send
            // This forces WhatsApp Web to resolve the LID internally in Puppeteer
            await this.client.getContactById(chatId);
            await this.client.sendMessage(chatId, message);
            
            console.log(`[WhatsApp-Service] Message sent successfully to: ${chatId}`);
        } catch (error) {
            console.error(`[WhatsApp-Service] Failed to send message to ${to}:`, error);
            
            // Last ditch effort: direct send if contact method failed
            if (error.message.includes('No LID')) {
                console.log(`[WhatsApp-Service] LID Error detected. Attempting direct fallback send...`);
                try {
                    // Sometimes a raw send works even if the resolved one fails
                    await this.client.sendMessage(to.includes('@') ? to : `${to.replace(/\D/g, '')}@c.us`, message);
                } catch (innerError) {
                    console.error(`[WhatsApp-Service] Final fallback failed:`, innerError.message);
                }
            }
        }
    }
}

module.exports = new WhatsAppService();
