const express = require('express');
const ptSessionController = require('../controllers/ptSessionController');

const router = express.Router();

// Mark session as completed (tự động tạo expense)
router.post('/complete', ptSessionController.markSessionCompleted);

// Mark session as cancelled (tự động hủy expense)
router.post('/cancel', ptSessionController.markSessionCancelled);

// Get sessions for a subscription
router.get('/subscription/:subscriptionId', ptSessionController.getSubscriptionSessions);

// Get session count for a subscription
router.get('/subscription/:subscriptionId/count', ptSessionController.getSubscriptionSessionCount);

// Get trainer session stats
router.get('/trainer/stats', ptSessionController.getTrainerSessionStats);

module.exports = router;

