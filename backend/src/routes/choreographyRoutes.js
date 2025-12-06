const express = require('express');
const router = express.Router();
const choreographyController = require('../controllers/choreographyController');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all choreographies
router.get('/', authenticate, choreographyController.getAll);

// Get choreography by ID
router.get('/:id', authenticate, choreographyController.getById);

// Create choreography
router.post('/', authenticate, authorize('admin', 'manager', 'designer'), choreographyController.create);

// Update choreography
router.put('/:id', authenticate, authorize('admin', 'manager', 'designer'), choreographyController.update);

// Delete choreography
router.delete('/:id', authenticate, authorize('admin', 'manager'), choreographyController.delete);

module.exports = router;

