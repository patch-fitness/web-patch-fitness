const express = require('express');
const gymController = require('../controllers/gymController');

const router = express.Router();

router.get('/', gymController.getGyms);
router.get('/:id', gymController.getGymById);
router.post('/', gymController.createGym);
router.put('/:id', gymController.updateGym);
router.delete('/:id', gymController.deleteGym);

module.exports = router;

