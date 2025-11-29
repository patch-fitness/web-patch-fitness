const express = require('express');
const membershipController = require('../controllers/membershipController');

const router = express.Router();

router.get('/', membershipController.getMemberships);
router.get('/:id', membershipController.getMembershipById);
router.post('/', membershipController.createMembership);
router.put('/:id', membershipController.updateMembership);
router.delete('/:id', membershipController.deleteMembership);

module.exports = router;

