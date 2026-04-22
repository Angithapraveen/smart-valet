const pool = require('../config/database');
const { generateValetId, getNextAvailableKeySlot } = require('../utils/valetUtils');
const whatsappService = require('../services/whatsappService');

const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
};

const handleWebhook = async (req, res) => {
    try {
        const body = req.body;
        console.log('Received webhook payload:', JSON.stringify(body, null, 2));

        if (body.object) {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
                const message = body.entry[0].changes[0].value.messages[0];
                const from = message.from; // Phone number
                const msgText = message.text ? message.text.body : '';
                const userName = body.entry[0].changes[0].value.contacts[0].profile.name;

                console.log(`Processing message from ${from} (${userName}): ${msgText}`);

                await processIncomingMessage(from, msgText, userName);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.sendStatus(500);
    }
};

const processIncomingMessage = async (from, text, userName) => {
    text = text.trim();

    // 1. Check for Parking Request
    // Format: Your car is parked at MCV-XXX by driver DRV-XXX
    if (text.toLowerCase().includes('parked')) {
        // Updated regex to handle "Premises: " and "Driver: " labels
        const locationMatch = text.match(/Premises:\s*([\w-]+)/i) || text.match(/MCV-([\w-]+)/i);
        const driverMatch = text.match(/Driver:\s*([\w-]+)/i) || text.match(/DRV-([\w-]+)/i);

        if (!locationMatch || !driverMatch) {
            await whatsappService.sendErrorMessage(from, "Could not find Location ID or Driver ID in the message. Please ensure it follows the correct format.");
            return;
        }

        const locationId = locationMatch[1] || locationMatch[0];
        const driverId = driverMatch[1] || driverMatch[0];

        const carNumberMatch = text.match(/Vehicle:\s*([A-Z0-9-]+)/i) || text.match(/Car No:\s*([A-Z0-9-]+)/i);
        const carNumber = carNumberMatch ? carNumberMatch[1] : null;

        await handleParkingRequest(from, userName, locationId, driverId, carNumber);
    } 
    // 2. Check for Return Request: RETURN <valet_id>
    else if (text.toUpperCase().startsWith('RETURN')) {
        const parts = text.split(' ');
        if (parts.length < 2) {
            await whatsappService.sendErrorMessage(from, "Please provide the Valet ID. Format: RETURN <valet_id>");
            return;
        }
        const valetId = parts[1].trim();
        await handleReturnRequest(from, valetId);
    } 
    // 3. Check for Rating: 1-5
    else if (/^[1-5]$/.test(text)) {
        const rating = parseInt(text);
        await handleFeedback(from, rating);
    } 
    else {
        // Unknown command
        await whatsappService.sendMessage(from, "Welcome to Smart Valet! 🚗\n\nTo request your car, send: RETURN <your_valet_id>");
    }
};

const handleParkingRequest = async (phone, name, locationId, driverId, carNumber = null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify Location and Driver Mapping
        const mappingQuery = `
            SELECT la.id 
            FROM LOCATION_ACCESS la
            JOIN USERS u ON la.user_id = u.user_id
            WHERE u.user_id = $1 AND la.location_id = $2
        `;
        const mappingRes = await client.query(mappingQuery, [driverId, locationId]);

        if (mappingRes.rows.length === 0) {
            await client.query('ROLLBACK');
            await whatsappService.sendErrorMessage(phone, "Invalid Driver-Location mapping. Please ensure the driver is assigned to this location.");
            return;
        }

        // Generate Valet ID and Key Slot
        const valetId = await generateValetId(locationId);
        const keySlot = await getNextAvailableKeySlot(client, locationId);

        // Fetch Location Name for response
        const locRes = await client.query('SELECT location_name FROM LOCATIONS WHERE location_id = $1', [locationId]);
        const locationName = locRes.rows[0].location_name;

        // Insert Transaction
        const insertQuery = `
            INSERT INTO VALET_TRANSACTIONS 
            (valet_id, location_id, parked_driver_id, customer_name, phone_number, car_number, status, parked_time, key_slot)
            VALUES ($1, $2, $3, $4, $5, $6, 'PARKED', NOW(), $7)
            RETURNING *
        `;
        const params = [
            valetId,    // $1
            locationId, // $2
            driverId,   // $3
            name,       // $4
            phone,      // $5
            carNumber,  // $6
            keySlot     // $7
        ];
        console.log(`[WH-Parking-Debug] ValetID: ${valetId}, Slot: ${keySlot}`);
        const resTxn = await client.query(insertQuery, params);
        if (resTxn.rows[0].key_slot === null) {
            console.error('[WH-Parking-Error] Key Slot not stored!');
        }

        await client.query('COMMIT');

        // Send confirmation
        await whatsappService.sendParkingConfirmation(phone, valetId, locationName);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in handleParkingRequest:', error);
        await whatsappService.sendErrorMessage(phone, "Something went wrong while processing your parking request.");
    } finally {
        client.release();
    }
};

const handleReturnRequest = async (phone, valetId) => {
    try {
        // 1. Fetch the transaction details first to perform manual checks
        const checkQuery = `
            SELECT phone_number, status 
            FROM VALET_TRANSACTIONS 
            WHERE valet_id = $1
        `;
        const checkResult = await pool.query(checkQuery, [valetId]);

        if (checkResult.rows.length === 0) {
            await whatsappService.sendMessage(phone, `⚠️ *Invalid Valet ID:* The ID *${valetId}* was not found in our system. Please check the ID on your digital ticket and try again.`);
            return;
        }

        const txn = checkResult.rows[0];

        // 2. Security Check: Compare phone numbers
        // We trim and compare to handle potential whitespace variations
        // (Note: In a production environment, you might want to handle country code variations as well)
        if (txn.phone_number !== phone) {
            console.warn(`[Security-Alert] Return request for ${valetId} from unauthorized number: ${phone}. Expected: ${txn.phone_number}`);
            await whatsappService.sendMessage(phone, `🚫 *Unauthorized Request:* This phone number is not registered for Valet ID: *${valetId}*. \n\nOnly the number used during parking can request a return. Please use the registered phone number.`);
            return;
        }

        // 3. Status Check: Must be PARKED to request return
        if (txn.status !== 'PARKED') {
            let statusMsg = "Your car is already being processed.";
            if (txn.status === 'READY') statusMsg = "Your car is already waiting for you at the exit!";
            if (txn.status === 'RETURNED') statusMsg = "This vehicle has already been returned.";
            
            await whatsappService.sendMessage(phone, `ℹ️ *Status Update:* ${statusMsg}`);
            return;
        }

        // 4. All checks passed: Update status to RETURN_REQUESTED
        const updateQuery = `
            UPDATE VALET_TRANSACTIONS 
            SET status = 'RETURN_REQUESTED', return_requested_time = NOW()
            WHERE valet_id = $1
            RETURNING *
        `;
        await pool.query(updateQuery, [valetId]);

        await whatsappService.sendMessage(phone, `✅ *Request Confirmed:* Your return request for Valet ID: *${valetId}* has been received. Our team has been notified and is bringing your car to the exit! 🏎️💨`);

    } catch (error) {
        console.error('Error in handleReturnRequest:', error);
        await whatsappService.sendErrorMessage(phone, "We encountered an error processing your return request. Please try again or contact onsite staff.");
    }
};

const handleFeedback = async (phone, rating) => {
    try {
        // Find the most recent RETURNED transaction for this phone number
        const txnQuery = `
            SELECT valet_id 
            FROM VALET_TRANSACTIONS 
            WHERE phone_number = $1 AND status = 'RETURNED'
            ORDER BY returned_time DESC 
            LIMIT 1
        `;
        const txnRes = await pool.query(txnQuery, [phone]);

        if (txnRes.rows.length === 0) {
            await whatsappService.sendMessage(phone, "No recently completed trips found to rate.");
            return;
        }

        const valetId = txnRes.rows[0].valet_id;

        // Check if feedback already exists for this valet_id
        const fbCheck = await pool.query('SELECT feedback_id FROM FEEDBACK WHERE valet_id = $1', [valetId]);
        if (fbCheck.rows.length > 0) {
            await whatsappService.sendMessage(phone, "You have already provided feedback for this trip. Thank you!");
            return;
        }

        // Insert Feedback
        await pool.query('INSERT INTO FEEDBACK (valet_id, rating) VALUES ($1, $2)', [valetId, rating]);

        await whatsappService.sendMessage(phone, "Thank you for your rating! We appreciate your feedback. ⭐");
    } catch (error) {
        console.error('Error in handleFeedback:', error);
        await whatsappService.sendErrorMessage(phone, "Failed to save feedback.");
    }
};

module.exports = {
    verifyWebhook,
    handleWebhook
};
