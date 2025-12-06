const { Choreography, FlightPath, Formation, LightingSequence, Show, User, Drone } = require('../models');
const logger = require('../utils/logger');

// Get all choreographies for a show
exports.getAll = async (req, res) => {
  try {
    const { showId } = req.query;
    logger.info(`[ChoreographyController] getAll - showId from query: ${showId} (type: ${typeof showId})`);
    const where = {};
    if (showId) {
      // Convert showId to number for proper filtering
      const showIdNum = parseInt(showId);
      where.showId = showIdNum;
      logger.info(`[ChoreographyController] getAll - filtering by showId: ${showIdNum}`);
    }

    const choreographies = await Choreography.findAll({
      where,
      include: [
        { model: Show, as: 'show', attributes: ['showId', 'showName'] },
        { model: User, as: 'designer', attributes: ['userId', 'fullName', 'username'] },
        {
          model: FlightPath,
          as: 'flightPaths',
          include: [{ model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] }],
        },
        { model: Formation, as: 'formations' },
        { model: LightingSequence, as: 'lightingSequences' },
      ],
      order: [['sceneOrder', 'ASC']],
    });

    logger.info(`[ChoreographyController] getAll - found ${choreographies.length} choreographies`);
    if (choreographies.length > 0) {
      logger.info(`[ChoreographyController] getAll - choreographies:`, choreographies.map(c => ({
        choreographyId: c.choreographyId,
        showId: c.showId,
        name: c.choreographyName
      })));
    }

    res.json({ items: choreographies });
  } catch (error) {
    logger.error('Error fetching choreographies:', error);
    res.status(500).json({ error: 'Failed to fetch choreographies' });
  }
};

// Get choreography by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const choreography = await Choreography.findByPk(id, {
      include: [
        { model: Show, as: 'show', attributes: ['showId', 'showName'] },
        { model: User, as: 'designer', attributes: ['userId', 'fullName', 'username'] },
        {
          model: FlightPath,
          as: 'flightPaths',
          include: [{ model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] }],
        },
        { model: Formation, as: 'formations' },
        { model: LightingSequence, as: 'lightingSequences' },
      ],
    });

    if (!choreography) {
      return res.status(404).json({ error: 'Choreography not found' });
    }

    res.json(choreography);
  } catch (error) {
    logger.error('Error fetching choreography:', error);
    res.status(500).json({ error: 'Failed to fetch choreography' });
  }
};

// Create choreography
exports.create = async (req, res) => {
  try {
    const {
      showId,
      choreographyName,
      designerId,
      designFilePath,
      durationSeconds,
      droneCount,
      sceneOrder,
      status = 'draft',
    } = req.body;

    const choreography = await Choreography.create({
      showId,
      choreographyName,
      designerId: designerId || req.user.userId,
      designFilePath,
      durationSeconds,
      droneCount,
      sceneOrder,
      status,
    });

    const created = await Choreography.findByPk(choreography.choreographyId, {
      include: [
        { model: Show, as: 'show', attributes: ['showId', 'showName'] },
        { model: User, as: 'designer', attributes: ['userId', 'fullName', 'username'] },
      ],
    });

    res.status(201).json(created);
  } catch (error) {
    logger.error('Error creating choreography:', error);
    res.status(500).json({ error: 'Failed to create choreography' });
  }
};

// Update choreography
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      choreographyName,
      designerId,
      designFilePath,
      durationSeconds,
      droneCount,
      sceneOrder,
      status,
    } = req.body;

    const choreography = await Choreography.findByPk(id);
    if (!choreography) {
      return res.status(404).json({ error: 'Choreography not found' });
    }

    await choreography.update({
      choreographyName,
      designerId,
      designFilePath,
      durationSeconds,
      droneCount,
      sceneOrder,
      status,
    });

    const updated = await Choreography.findByPk(id, {
      include: [
        { model: Show, as: 'show', attributes: ['showId', 'showName'] },
        { model: User, as: 'designer', attributes: ['userId', 'fullName', 'username'] },
      ],
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error updating choreography:', error);
    res.status(500).json({ error: 'Failed to update choreography' });
  }
};

// Delete choreography
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const choreography = await Choreography.findByPk(id);
    if (!choreography) {
      return res.status(404).json({ error: 'Choreography not found' });
    }

    await choreography.destroy();
    res.json({ message: 'Choreography deleted successfully' });
  } catch (error) {
    logger.error('Error deleting choreography:', error);
    res.status(500).json({ error: 'Failed to delete choreography' });
  }
};

