const express = require('express');
const trainerController = require('../controllers/trainerController');
const avatarUpload = require('../middlewares/upload');

const router = express.Router();

router.get('/', trainerController.getTrainers);
router.get('/:id', trainerController.getTrainerById);
router.post('/', avatarUpload.single('avatar'), trainerController.createTrainer);
router.put('/:id', avatarUpload.single('avatar'), trainerController.updateTrainer);
router.delete('/:id', trainerController.deleteTrainer);

module.exports = router;

