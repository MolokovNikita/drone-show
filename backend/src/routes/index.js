const express = require('express');
const authRoutes = require('./authRoutes');
const droneRoutes = require('./droneRoutes');
const showRoutes = require('./showRoutes');
const projectRoutes = require('./projectRoutes');
const telemetryRoutes = require('./telemetryRoutes');
const alertRoutes = require('./alertRoutes');
const clientRoutes = require('./clientRoutes');
const choreographyRoutes = require('./choreographyRoutes');
const flightPathRoutes = require('./flightPathRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/drones', droneRoutes);
router.use('/shows', showRoutes);
router.use('/projects', projectRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/alerts', alertRoutes);
router.use('/clients', clientRoutes);
router.use('/choreographies', choreographyRoutes);
router.use('/flight-paths', flightPathRoutes);

module.exports = router;
