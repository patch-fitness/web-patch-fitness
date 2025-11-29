const express = require('express');
const memberController = require('../controllers/memberController');
const avatarUpload = require('../middlewares/upload');

const router = express.Router();

router.get('/', memberController.getMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', avatarUpload.single('avatar'), memberController.createMember);
router.put('/:id', avatarUpload.single('avatar'), memberController.updateMember);
router.delete('/:id', memberController.deleteMember);

module.exports = router;

