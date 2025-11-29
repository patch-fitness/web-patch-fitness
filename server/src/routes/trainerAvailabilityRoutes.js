const express = require('express');
const router = express.Router();
const {
  getAvailableTrainers,
  getTrainerScheduleOverview,
  autoExpireSubscriptions
} = require('../controllers/trainerAvailabilityController');

/**
 * @route   GET /api/trainer-availability/available
 * @desc    Get available trainers for a specific schedule type
 * @query   scheduleType (required): '2-4-6' or '3-5-7'
 * @query   gymId (required): gym ID
 * @access  Private
 */
router.get('/available', getAvailableTrainers);

/**
 * @route   GET /api/trainer-availability/overview
 * @desc    Get overview of all trainers with their schedule assignments
 * @query   gymId (required): gym ID
 * @access  Private
 */
router.get('/overview', getTrainerScheduleOverview);

/**
 * @route   POST /api/trainer-availability/auto-expire
 * @desc    Auto-expire subscriptions past their end date (for cron job)
 * @access  Private/Admin
 */
router.post('/auto-expire', autoExpireSubscriptions);

module.exports = router;

