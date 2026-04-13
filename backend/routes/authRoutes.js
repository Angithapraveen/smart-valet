const express = require('express');
const router = express.Router();
const { login, getCurrentUser, updateProfile, toggleLocationStatus } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/update-profile', authenticate, updateProfile);
router.put('/location-status', authenticate, toggleLocationStatus);

module.exports = router;
