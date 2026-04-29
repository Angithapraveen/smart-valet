const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAccess');

// Admin only routes
router.post('/plans', authenticate, requireRole('ADMIN'), subscriptionController.createPlan);
router.get('/plans', authenticate, subscriptionController.getPlans);
router.post('/assign', authenticate, requireRole('ADMIN'), subscriptionController.assignPlan);
router.get('/', authenticate, requireRole('ADMIN'), subscriptionController.getAllSubscriptions);
router.delete('/plans/:id', authenticate, requireRole('ADMIN'), subscriptionController.deletePlan);
router.put('/plans/:id', authenticate, requireRole('ADMIN'), subscriptionController.updatePlan);
router.patch('/plans/:id/status', authenticate, requireRole('ADMIN'), subscriptionController.updatePlanStatus);
router.get('/payments', authenticate, requireRole('ADMIN'), subscriptionController.getAllPayments);

// Owner/Manager routes
router.get('/my-plan/:locationId', authenticate, subscriptionController.getMyPlan);
router.get('/my-subscriptions/:locationId', authenticate, subscriptionController.getMySubscriptions);
router.post('/initiate-payment', authenticate, subscriptionController.initiatePayment);
router.post('/payment-status', authenticate, subscriptionController.updatePaymentStatus);

module.exports = router;
