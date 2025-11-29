const express = require('express');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

router.get('/', expenseController.getExpenses);
router.get('/stats', expenseController.getExpenseStats);
router.get('/pt-commission-settings', expenseController.getPTCommissionSettings);
router.put('/pt-commission-settings', expenseController.updatePTCommissionSettings);
router.delete('/pt-commission-settings/:id', expenseController.deletePTCommissionSettings);
router.get('/:id', expenseController.getExpenseById);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

