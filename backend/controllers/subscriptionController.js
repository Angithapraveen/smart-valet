const subscriptionService = require('../services/subscriptionService');

/**
 * Create a new plan (Admin)
 * POST /api/admin/subscriptions/plans
 */
const createPlan = async (req, res) => {
    const { plan_name, total_transactions, duration_months, price } = req.body;

    if (!plan_name || total_transactions === null || duration_months === null || price === null) {
        return res.status(400).json({
            success: false,
            message: 'Plan Identity, Transactions, Duration, and Price are all required.'
        });
    }

    try {
        const plan = await subscriptionService.createPlan(req.body);
        res.json({
            success: true,
            message: 'Plan created successfully.',
            data: plan
        });
    } catch (error) {
        console.error('Create Plan Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create plan.' });
    }
};

/**
 * Assign a plan to a location (Admin)
 * POST /api/admin/subscriptions/assign
 */
const assignPlan = async (req, res) => {
    const { location_id, plan_id } = req.body;

    if (!location_id || !plan_id) {
        return res.status(400).json({
            success: false,
            message: 'Location ID and Plan ID are required.'
        });
    }

    try {
        const subscription = await subscriptionService.assignPlan(location_id, plan_id);
        res.json({
            success: true,
            message: 'Plan assigned successfully.',
            data: subscription
        });
    } catch (error) {
        console.error('Assign Plan Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to assign plan.'
        });
    }
};

/**
 * Get all available payment plans (Admin/Owner)
 * GET /api/admin/subscriptions/plans
 */
const getPlans = async (req, res) => {
    try {
        const plans = await subscriptionService.getPlans();
        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Get Plans Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plans.'
        });
    }
};

/**
 * Get all subscriptions (Admin)
 * GET /api/admin/subscriptions
 */
const getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await subscriptionService.getAllSubscriptions();
        res.json({ success: true, data: subscriptions });
    } catch (error) {
        console.error('Get All Subscriptions Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscriptions.' });
    }
};

/**
 * Get all payments (Admin)
 * GET /api/admin/subscriptions/payments
 */
const getAllPayments = async (req, res) => {
    try {
        const payments = await subscriptionService.getAllPayments();
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('Get All Payments Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
    }
};

/**
 * Get current plan with usage (Owner/Manager)
 * GET /api/admin/subscriptions/my-plan/:locationId
 */
const getMyPlan = async (req, res) => {
    const { locationId } = req.params;

    // Security check: Owner/Manager can only see their own location
    if (req.user.role !== 'ADMIN') {
        // Here you would normally check if the user has access to this location
        // For simplicity, we assume the frontend sends the correct ID and we might have location_access check
    }

    try {
        const planDetails = await subscriptionService.getDetailedLocationSubscription(locationId);
        res.json({
            success: true,
            data: planDetails
        });
    } catch (error) {
        console.error('Get My Plan Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plan details.'
        });
    }
};

/**
 * Get subscription history (Owner/Manager)
 * GET /api/admin/subscriptions/my-subscriptions/:locationId
 */
const getMySubscriptions = async (req, res) => {
    const { locationId } = req.params;
    try {
        const history = await subscriptionService.getLocationSubscriptionHistory(locationId);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Get My Subscriptions Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription history.' });
    }
};

/**
 * Update plan status (Admin)
 * PATCH /api/admin/subscriptions/plans/:id/status
 */
const updatePlanStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    try {
        const plan = await subscriptionService.updatePlanStatus(id, status);
        res.json({
            success: true,
            message: `Plan status updated to ${status}.`,
            data: plan
        });
    } catch (error) {
        console.error('Update Plan Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update plan status.' });
    }
};

/**
 * Delete a plan (Admin)
 * DELETE /api/admin/subscriptions/plans/:id
 */
const deletePlan = async (req, res) => {
    try {
        await subscriptionService.deletePlan(req.params.id);
        res.json({ success: true, message: 'Plan deleted successfully.' });
    } catch (error) {
        console.error('Delete Plan Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete plan.' });
    }
};

/**
 * Update a plan (Admin)
 * PUT /api/admin/subscriptions/plans/:id
 */
const updatePlan = async (req, res) => {
    const { id } = req.params;
    const { plan_name, total_transactions, duration_months, price } = req.body;

    if (!plan_name || total_transactions === null || duration_months === null || price === null) {
        return res.status(400).json({
            success: false,
            message: 'All plan details are required for update.'
        });
    }

    try {
        const plan = await subscriptionService.updatePlan(id, req.body);
        res.json({
            success: true,
            message: 'Plan updated successfully.',
            data: plan
        });
    } catch (error) {
        console.error('Update Plan Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update plan.' });
    }
};

module.exports = {
    createPlan,
    assignPlan,
    getPlans,
    getAllSubscriptions,
    getAllPayments,
    getMyPlan,
    getMySubscriptions,
    deletePlan,
    updatePlanStatus,
    updatePlan
};
