const express = require('express');
const showController = require('../controllers/showController');
const { authenticate } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/audit');

const router = express.Router();

router.get('/', authenticate, showController.getAll);
router.get('/:id', authenticate, showController.getById);
router.post('/', authenticate, auditLog('CREATE_SHOW', 'show'), showController.create);
router.post('/generate', authenticate, auditLog('GENERATE_SHOW_AI', 'show'), showController.generateWithAI);
router.put('/:id', authenticate, auditLog('UPDATE_SHOW', 'show'), showController.update);
router.delete('/:id', authenticate, auditLog('DELETE_SHOW', 'show'), showController.delete);

module.exports = router;

