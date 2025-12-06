const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/audit');

const router = express.Router();

router.get('/', authenticate, projectController.getAll);
router.get('/:id', authenticate, projectController.getById);
router.post('/', authenticate, auditLog('CREATE_PROJECT', 'project'), projectController.create);
router.put('/:id', authenticate, auditLog('UPDATE_PROJECT', 'project'), projectController.update);
router.delete('/:id', authenticate, auditLog('DELETE_PROJECT', 'project'), projectController.delete);

module.exports = router;

