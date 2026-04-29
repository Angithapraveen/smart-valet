const subscriptionService = require('../services/subscriptionService');

/**
 * Middleware to check if a location has an active subscription
 */
const checkSubscription = async (req, res, next) => {
    const locationId = req.body.location_id || req.query.location_id || req.params.location_id;

    if (!locationId) {
        return res.status(400).json({
            success: false,
            message: 'Location ID is required for subscription check.'
        });
    }

    try {
        const subscription = await subscriptionService.checkParkingLimit(locationId);

        if (!subscription) {
            return res.status(403).json({
                success: false,
                code: 'NO_SUBSCRIPTION',
                message: 'No active subscription found for this location.'
            });
        }

        if (subscription.remaining_transactions <= 0) {
            return res.status(403).json({
                success: false,
                code: 'LIMIT_REACHED',
                message: 'Transaction limit reached. Please upgrade your plan.'
            });
        }

        req.subscription_id = subscription.subscription_id;
        next();
    } catch (error) {
        console.error('Subscription Guard Block:', error.message);
        return res.status(403).json({
            success: false,
            message: "No active subscription. Please contact manager or owner."
        });
    }
};

module.exports = { checkSubscription };
