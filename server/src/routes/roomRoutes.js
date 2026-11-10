const express = require('express');
const roomController = require('../controllers/roomController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/', requireAuth, roomController.createRoom);
router.get('/:code', roomController.getByRoomCode);
router.post('/:code/question', roomController.createQuestion);
router.get('/:code/question', roomController.getQuestions);
router.get('/:code/top-questions', roomController.generateTopQuestions);

module.exports = router;
