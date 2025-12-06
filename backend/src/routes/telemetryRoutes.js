const express = require('express');
const telemetryController = require('../controllers/telemetryController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, telemetryController.getAll);
router.get('/stats', authenticate, telemetryController.getStats);
router.get('/latest/:droneId', authenticate, telemetryController.getLatest);
router.post('/', authenticate, telemetryController.create);

module.exports = router;

