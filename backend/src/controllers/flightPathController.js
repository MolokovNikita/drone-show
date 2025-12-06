const { FlightPath, Choreography, Drone } = require('../models');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Get all flight paths for a choreography
exports.getAll = async (req, res) => {
  try {
    const { choreographyId } = req.query;
    const where = {};
    if (choreographyId) where.choreographyId = parseInt(choreographyId);

    const flightPaths = await FlightPath.findAll({
      where,
      include: [
        { model: Choreography, as: 'choreography', attributes: ['choreographyId', 'choreographyName'] },
        { model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] },
      ],
      order: [[Sequelize.literal('created_at'), 'ASC']],
    });

    res.json({ items: flightPaths });
  } catch (error) {
    logger.error('Error fetching flight paths:', error);
    res.status(500).json({ error: 'Failed to fetch flight paths' });
  }
};

// Get flight path by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const flightPath = await FlightPath.findByPk(id, {
      include: [
        { model: Choreography, as: 'choreography', attributes: ['choreographyId', 'choreographyName'] },
        { model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] },
      ],
    });

    if (!flightPath) {
      return res.status(404).json({ error: 'Flight path not found' });
    }

    res.json(flightPath);
  } catch (error) {
    logger.error('Error fetching flight path:', error);
    res.status(500).json({ error: 'Failed to fetch flight path' });
  }
};

// Create flight path
exports.create = async (req, res) => {
  try {
    const {
      choreographyId,
      droneId,
      pathDataJson,
      startPosition,
      endPosition,
      maxAltitude,
      collisionCheckStatus = 'pending',
    } = req.body;

    // Validate JSON fields
    if (typeof pathDataJson === 'string') {
      try {
        JSON.parse(pathDataJson);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid pathDataJson format' });
      }
    }

    if (typeof startPosition === 'string') {
      try {
        JSON.parse(startPosition);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid startPosition format' });
      }
    }

    if (typeof endPosition === 'string') {
      try {
        JSON.parse(endPosition);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid endPosition format' });
      }
    }

    const flightPath = await FlightPath.create({
      choreographyId,
      droneId,
      pathDataJson: typeof pathDataJson === 'string' ? JSON.parse(pathDataJson) : pathDataJson,
      startPosition: typeof startPosition === 'string' ? JSON.parse(startPosition) : startPosition,
      endPosition: typeof endPosition === 'string' ? JSON.parse(endPosition) : endPosition,
      maxAltitude,
      collisionCheckStatus,
    });

    const created = await FlightPath.findByPk(flightPath.pathId, {
      include: [
        { model: Choreography, as: 'choreography', attributes: ['choreographyId', 'choreographyName'] },
        { model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] },
      ],
    });

    res.status(201).json(created);
  } catch (error) {
    logger.error('Error creating flight path:', error);
    res.status(500).json({ error: 'Failed to create flight path', details: error.message });
  }
};

// Update flight path
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { pathDataJson, startPosition, endPosition, maxAltitude, collisionCheckStatus } = req.body;

    const flightPath = await FlightPath.findByPk(id);
    if (!flightPath) {
      return res.status(404).json({ error: 'Flight path not found' });
    }

    const updateData = {};
    if (pathDataJson !== undefined) {
      updateData.pathDataJson = typeof pathDataJson === 'string' ? JSON.parse(pathDataJson) : pathDataJson;
    }
    if (startPosition !== undefined) {
      updateData.startPosition = typeof startPosition === 'string' ? JSON.parse(startPosition) : startPosition;
    }
    if (endPosition !== undefined) {
      updateData.endPosition = typeof endPosition === 'string' ? JSON.parse(endPosition) : endPosition;
    }
    if (maxAltitude !== undefined) updateData.maxAltitude = maxAltitude;
    if (collisionCheckStatus !== undefined) updateData.collisionCheckStatus = collisionCheckStatus;

    await flightPath.update(updateData);

    const updated = await FlightPath.findByPk(id, {
      include: [
        { model: Choreography, as: 'choreography', attributes: ['choreographyId', 'choreographyName'] },
        { model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] },
      ],
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error updating flight path:', error);
    res.status(500).json({ error: 'Failed to update flight path', details: error.message });
  }
};

// Delete flight path
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const flightPath = await FlightPath.findByPk(id);
    if (!flightPath) {
      return res.status(404).json({ error: 'Flight path not found' });
    }

    await flightPath.destroy();
    res.json({ message: 'Flight path deleted successfully' });
  } catch (error) {
    logger.error('Error deleting flight path:', error);
    res.status(500).json({ error: 'Failed to delete flight path' });
  }
};

// Bulk create/update flight paths for a choreography
exports.bulkUpdate = async (req, res) => {
  try {
    const { choreographyId, flightPaths } = req.body;

    // Delete existing flight paths for this choreography
    await FlightPath.destroy({ where: { choreographyId } });

    // Create new flight paths
    const created = [];
    for (const path of flightPaths) {
      const flightPath = await FlightPath.create({
        choreographyId,
        droneId: path.droneId,
        pathDataJson: typeof path.pathDataJson === 'string' ? JSON.parse(path.pathDataJson) : path.pathDataJson,
        startPosition: typeof path.startPosition === 'string' ? JSON.parse(path.startPosition) : path.startPosition,
        endPosition: typeof path.endPosition === 'string' ? JSON.parse(path.endPosition) : path.endPosition,
        maxAltitude: path.maxAltitude,
        collisionCheckStatus: path.collisionCheckStatus || 'pending',
      });
      created.push(flightPath);
    }

    const result = await FlightPath.findAll({
      where: { choreographyId },
      include: [
        { model: Choreography, as: 'choreography', attributes: ['choreographyId', 'choreographyName'] },
        { model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] },
      ],
    });

    res.json({ items: result });
  } catch (error) {
    logger.error('Error bulk updating flight paths:', error);
    res.status(500).json({ error: 'Failed to bulk update flight paths', details: error.message });
  }
};

