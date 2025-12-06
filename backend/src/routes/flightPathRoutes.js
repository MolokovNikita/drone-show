const express = require('express');
const router = express.Router();
const flightPathController = require('../controllers/flightPathController');
const { authenticate, authorize } = require('../middlewares/auth');

// Get all flight paths
router.get('/', authenticate, flightPathController.getAll);

// Get flight path by ID
router.get('/:id', authenticate, flightPathController.getById);

// Create flight path
router.post('/', authenticate, authorize('admin', 'manager', 'designer'), flightPathController.create);

// Update flight path
router.put('/:id', authenticate, authorize('admin', 'manager', 'designer'), flightPathController.update);

// Delete flight path
router.delete('/:id', authenticate, authorize('admin', 'manager', 'designer'), flightPathController.delete);

// Bulk update flight paths for a choreography
router.post('/bulk', authenticate, authorize('admin', 'manager', 'designer'), flightPathController.bulkUpdate);

module.exports = router;

