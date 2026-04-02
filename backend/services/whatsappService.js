const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const pool = require('../config/database');

class WhatsAppService {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                handleSIGINT: false,
                args: ['--no-sandbox']
            }
        });
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('[WhatsApp-Service] Initializing WhatsApp Client...');

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
        });

        this.client.on('message', async (msg) => {
            console.log(`[WhatsApp-Service] Incoming message from ${msg.from}: ${msg.body}`);
            try {
                await this.handleIncomingMessage(msg);
            } catch (error) {
                console.error('[WhatsApp-Service] Error handling message:', error);
            }
        });

        try {
            await this.client.initialize();
        } catch (error) {
            console.error('[WhatsApp-Service] Critical Initialization Error:', error);
        }
    }

    async handleIncomingMessage(msg) {
        const body = msg.body.trim();
        const from = msg.from; // phone number
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
        const locationMatch = body.match(/Premises:\s*([^\n\r]+)/i);
        const driverMatch = body.match(/Driver:\s*([^\n\r]+)/i);

        if (!locationMatch || !driverMatch) {
            await msg.reply('Invalid format. Please include both Premises (Location ID) and Driver (Driver ID).');
            return;
        }

        const locationId = locationMatch[1].trim();
        const driverId = driverMatch[1].trim();
        const carNumberMatch = body.match(/Vehicle:\s*([A-Z0-9-]+)/i) || body.match(/Car No:\s*([A-Z0-9-]+)/i);
        const carNumber = carNumberMatch ? carNumberMatch[1] : null;


        try {
            const validationQuery = `
                SELECT l.location_name FROM LOCATION_ACCESS la
                JOIN LOCATIONS l ON la.location_id = l.location_id
                WHERE la.location_id = $1 AND la.user_id = $2
            `;
            const validResult = await pool.query(validationQuery, [locationId, driverId]);

            if (validResult.rows.length === 0) {
                await msg.reply('Invalid Location or Driver pairing.');
                return;
            }

            const locationName = validResult.rows[0].location_name;
            const valetController = require('../controllers/valetController');
            const valetId = await valetController.generateValetId(locationId);
            const senderId = from;

            // Get Key Slot
            const { getNextAvailableKeySlot } = require('../utils/valetUtils');
            let keySlot = await getNextAvailableKeySlot(pool, locationId);
            if (!keySlot) {
                console.warn('[WhatsApp-Service] Key slot generation returned null, defaulting to 1');
                keySlot = 1; 
            }

            console.log(`[WhatsApp-Service] Prepared Insert: ValetId=${valetId}, Loc=${locationId}, Driver=${driverId}, Slot=${keySlot}`);
            
            await pool.query(
                `INSERT INTO VALET_TRANSACTIONS 
                (valet_id, location_id, parked_driver_id, customer_name, phone_number, car_number, status, parked_time, key_slot)
                VALUES ($1, $2, $3, $4, $5, $6, 'PARKED', NOW(), $7)`,
                [valetId, locationId, driverId, userName, senderId, carNumber, keySlot]
            );

            // Send confirmation with Location Name and standard text instructions
            console.log(`[WhatsApp-Service] Success! Valet ${valetId} stored internal slot ${keySlot}`);
            
            const confirmationMsg = `✅ *Car Parked Successfully*\n\n` +
                `🎫 *Valet ID:* ${valetId}\n` +
                `📍 *Location:* ${locationName}\n\n` +
                `Your car is safely stored. When you're ready to leave, just send the message below:\n\n` +
                `*Tap to request car:* \nRETURN ${valetId} 🚗💨`;

            await this.client.sendMessage(from, confirmationMsg);

        } catch (error) {
            console.error('Parking Request Error:', error);
            await msg.reply('Internal error processing parking request.');
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
                await msg.reply(`Could not find a parked car with Valet ID: ${valetId}`);
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
                await msg.reply('Thank you! We already received your feedback for your recent trip.');
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

        try {
            // Ensure the address is correctly formatted for WhatsApp
            let chatId = to;

            // Only append @c.us if there is NO domain suffix already (@c.us or @lid)
            if (!chatId.includes('@')) {
                // Remove all non-digits
                let cleanNumber = chatId.replace(/\D/g, '');
                
                // If 10 digits, assume India (91)
                if (cleanNumber.length === 10) {
                    cleanNumber = '91' + cleanNumber;
                }
                
                chatId = `${cleanNumber}@c.us`;
            }

            console.log(`[WhatsApp-Service] Attempting to send message to: ${chatId}`);
            await this.client.sendMessage(chatId, message);
            console.log(`[WhatsApp-Service] Message sent successfully to: ${chatId}`);
        } catch (error) {
            console.error(`[WhatsApp-Service] Failed to send message to ${to}:`, error);
        }
    }
}

module.exports = new WhatsAppService();
