const express = require('express');
const clientController = require('../controllers/clientController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, clientController.getAll);
router.get('/:id', authenticate, clientController.getById);
router.post('/', authenticate, clientController.create);
router.put('/:id', authenticate, clientController.update);
router.delete('/:id', authenticate, clientController.delete);

module.exports = router;

