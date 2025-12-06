const express = require('express');
const droneController = require('../controllers/droneController');
const { authenticate, authorize } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/audit');

const router = express.Router();

router.get('/', authenticate, droneController.getAll);
router.get('/:id', authenticate, droneController.getById);
router.post('/', authenticate, auditLog('CREATE_DRONE', 'drone'), droneController.create);
router.put('/:id', authenticate, auditLog('UPDATE_DRONE', 'drone'), droneController.update);
router.delete('/:id', authenticate, authorize('admin'), auditLog('DELETE_DRONE', 'drone'), droneController.delete);

module.exports = router;

