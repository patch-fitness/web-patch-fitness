const express = require('express');
const equipmentController = require('../controllers/equipmentController');
const avatarUpload = require('../middlewares/upload');

const router = express.Router();

router.get('/', equipmentController.getEquipment);
router.get('/:id', equipmentController.getEquipmentById);
router.post('/', avatarUpload.single('image'), equipmentController.createEquipment);
router.put('/:id', avatarUpload.single('image'), equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;

