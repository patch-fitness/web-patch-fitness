const express = require('express');
const financeController = require('../controllers/financeController');

const router = express.Router();

// Đặt các route cụ thể trước để tránh conflict
router.post('/cleanup-pt-expenses', financeController.cleanupInvalidPTExpenses);
router.post('/calculate-pt-salaries', financeController.calculatePTSalaries);
router.get('/dashboard', financeController.getFinanceDashboard);
router.get('/transactions', financeController.getTransactionList);
router.get('/export', financeController.getExportData);

module.exports = router;

