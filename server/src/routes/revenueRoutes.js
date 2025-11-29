const express = require('express');
const revenueController = require('../controllers/revenueController');

const router = express.Router();

router.get('/', revenueController.getRevenues);
router.get('/stats', revenueController.getRevenueStats);
router.get('/:id', revenueController.getRevenueById);
router.post('/', revenueController.createRevenue);
router.put('/:id', revenueController.updateRevenue);
router.delete('/:id', revenueController.deleteRevenue);

module.exports = router;

