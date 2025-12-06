const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, alertController.getAll);
router.post('/:id/resolve', authenticate, alertController.resolve);

module.exports = router;

