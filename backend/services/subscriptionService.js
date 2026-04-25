const pool = require('../config/database');

/**
 * Subscription Service
 * Handles all logic related to usage control and plans
 */
class SubscriptionService {
    /**
     * Create a new payment plan
     */
    async createPlan(planData) {
        const { plan_name, total_transactions, duration_months, price, status, start_date, end_date } = planData;
        const query = `
            INSERT INTO PAYMENT_PLANS (plan_name, total_transactions, duration_months, price, status, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await pool.query(query, [
            plan_name, 
            total_transactions, 
            duration_months, 
            price, 
            status || 'draft',
            start_date || null,
            end_date || null
        ]);
        return result.rows[0];
    }

    /**
     * Update plan status (Active/Inactive)
     */
    async updatePlanStatus(planId, status) {
        const query = 'UPDATE PAYMENT_PLANS SET status = $1 WHERE plan_id = $2 RETURNING *';
        const result = await pool.query(query, [status, planId]);
        return result.rows[0];
    }

    /**
     * Update a payment plan
     */
    async updatePlan(planId, planData) {
        const { plan_name, total_transactions, duration_months, price, status, start_date, end_date } = planData;
        const query = `
            UPDATE PAYMENT_PLANS 
            SET plan_name = $1, total_transactions = $2, duration_months = $3, price = $4, status = $5, start_date = $6, end_date = $7
            WHERE plan_id = $8
            RETURNING *
        `;
        const result = await pool.query(query, [
            plan_name, 
            total_transactions, 
            duration_months, 
            price, 
            status,
            start_date || null,
            end_date || null,
            planId
        ]);
        return result.rows[0];
    }

    /**
     * Assign a plan to a location
     * @param {string} locationId 
     * @param {number} planId 
     */
    async assignPlan(locationId, planId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Fetch Plan Details
            const planResult = await client.query(
                'SELECT * FROM PAYMENT_PLANS WHERE plan_id = $1',
                [planId]
            );

            if (planResult.rows.length === 0) {
                throw new Error('Invalid plan ID');
            }

            const plan = planResult.rows[0];

            // 2. Calculate end_date
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(startDate.getMonth() + plan.duration_months);

            // 3. Deactivate any existing active subscriptions for this location
            await client.query(
                "UPDATE LOCATION_SUBSCRIPTIONS SET status = 'EXPIRED' WHERE location_id = $1 AND status = 'ACTIVE'",
                [locationId]
            );

            // 4. Create New Subscription
            const insertQuery = `
                INSERT INTO LOCATION_SUBSCRIPTIONS 
                (location_id, plan_id, start_date, end_date, status, remaining_transactions)
                VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
                RETURNING *
            `;
            const values = [locationId, planId, startDate, endDate, plan.total_transactions];
            const result = await client.query(insertQuery, values);
            const subscription = result.rows[0];

            // 5. Add to Payment History
            await client.query(
                `INSERT INTO PAYMENT_HISTORY (location_id, subscription_id, amount, status)
                 VALUES ($1, $2, $3, 'COMPLETED')`,
                [locationId, subscription.subscription_id, plan.price]
            );

            await client.query('COMMIT');
            return subscription;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Check if a location has remaining transactions and is not expired
     * @param {string} locationId 
     * @returns {Object} { canProceed: boolean, message: string }
     */
    async checkParkingLimit(locationId) {
        // 1. Fetch active subscription
        const query = `
            SELECT s.*, p.plan_name, p.total_transactions as plan_limit
            FROM LOCATION_SUBSCRIPTIONS s
            JOIN PAYMENT_PLANS p ON s.plan_id = p.plan_id
            WHERE s.location_id = $1 AND s.status = 'ACTIVE'
            LIMIT 1
        `;
        const result = await pool.query(query, [locationId]);

        if (result.rows.length === 0) {
            throw new Error('No active subscription found for this location.');
        }

        const subscription = result.rows[0];
        const currentDate = new Date();

        // 2. Check Expiration
        if (currentDate > new Date(subscription.end_date)) {
            // Update status to EXPIRED
            await pool.query(
                "UPDATE LOCATION_SUBSCRIPTIONS SET status = 'EXPIRED' WHERE subscription_id = $1",
                [subscription.subscription_id]
            );
            throw new Error('Subscription has expired.');
        }

        // 3. Check Remaining Transactions
        if (subscription.remaining_transactions <= 0) {
            throw new Error('Transaction limit reached for the current plan.');
        }

        // 4. Reminder Logic (Logging)
        const remaining = subscription.remaining_transactions;
        const milestones = [100, 50, 10];
        
        if (milestones.includes(remaining)) {
            console.log(`[SUBSCRIPTION-REMINDER] Location ${locationId}: Only ${remaining} transactions remaining.`);
            // Future: Integrate WhatsApp/Email here
        }

        return {
            success: true,
            subscription_id: subscription.subscription_id,
            remaining: subscription.remaining_transactions
        };
    }

    /**
     * Decrement remaining transactions for a subscription
     * @param {number} subscriptionId 
     */
    async decrementUsage(subscriptionId) {
        await pool.query(
            'UPDATE LOCATION_SUBSCRIPTIONS SET remaining_transactions = remaining_transactions - 1 WHERE subscription_id = $1',
            [subscriptionId]
        );
    }

    /**
     * Get all available plans
     */
    async getPlans() {
        // Auto-expire plans where end_date has passed
        await pool.query(`
            UPDATE PAYMENT_PLANS 
            SET status = 'expired' 
            WHERE status != 'expired' 
            AND end_date IS NOT NULL 
            AND end_date < NOW()
        `);

        const result = await pool.query('SELECT * FROM PAYMENT_PLANS ORDER BY created_at DESC');
        return result.rows;
    }

    /**
     * Get current subscription for a location
     */
    async getLocationSubscription(locationId) {
        const query = `
            SELECT s.*, p.plan_name, p.total_transactions as plan_limit, p.duration_months
            FROM LOCATION_SUBSCRIPTIONS s
            JOIN PAYMENT_PLANS p ON s.plan_id = p.plan_id
            WHERE s.location_id = $1
            ORDER BY s.created_at DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [locationId]);
        return result.rows[0] || null;
    }

    /**
     * Get current subscription for a location with usage details
     */
    async getDetailedLocationSubscription(locationId) {
        const sub = await this.getLocationSubscription(locationId);
        if (!sub) return null;

        // Count used transactions within the subscription period
        const usageQuery = `
            SELECT COUNT(*) FROM VALET_TRANSACTIONS
            WHERE location_id = $1
            AND created_at BETWEEN $2 AND $3
        `;
        const usageResult = await pool.query(usageQuery, [locationId, sub.start_date, sub.end_date]);
        const usedCount = parseInt(usageResult.rows[0].count);

        return {
            ...sub,
            used_transactions: usedCount,
            calculated_remaining: sub.plan_limit - usedCount
        };
    }

    /**
     * Get all subscriptions (Admin)
     */
    async getAllSubscriptions() {
        const query = `
            SELECT s.*, p.plan_name, l.location_name
            FROM LOCATION_SUBSCRIPTIONS s
            JOIN PAYMENT_PLANS p ON s.plan_id = p.plan_id
            JOIN LOCATIONS l ON s.location_id = l.location_id
            ORDER BY s.created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Get all payments (Admin)
     */
    async getAllPayments() {
        const query = `
            SELECT ph.*, l.location_name
            FROM PAYMENT_HISTORY ph
            JOIN LOCATIONS l ON ph.location_id = l.location_id
            ORDER BY ph.created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Get subscription history for a location
     */
    async getLocationSubscriptionHistory(locationId) {
        const query = `
            SELECT s.*, p.plan_name
            FROM LOCATION_SUBSCRIPTIONS s
            JOIN PAYMENT_PLANS p ON s.plan_id = p.plan_id
            WHERE s.location_id = $1
            ORDER BY s.created_at DESC
        `;
        const result = await pool.query(query, [locationId]);
        return result.rows;
    }

    /**
     * Delete a payment plan
     * @param {number} planId 
     */
    async deletePlan(planId) {
        // Check if plan is currently assigned to any active location
        const checkQuery = "SELECT 1 FROM LOCATION_SUBSCRIPTIONS WHERE plan_id = $1 AND status = 'ACTIVE' LIMIT 1";
        const checkResult = await pool.query(checkQuery, [planId]);
        
        if (checkResult.rows.length > 0) {
            throw new Error('Cannot delete plan: It is currently assigned to active locations.');
        }

        // Proceed to delete
        await pool.query('DELETE FROM PAYMENT_PLANS WHERE plan_id = $1', [planId]);
    }
}

module.exports = new SubscriptionService();
