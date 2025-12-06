const { Telemetry, Drone, Flight } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class TelemetryController {
  async getAll(req, res, next) {
    try {
      const { droneId, flightId, startDate, endDate, limit = 1000 } = req.query;
      const where = {};

      if (droneId) {
        where.droneId = droneId;
      }

      if (flightId) {
        where.flightId = flightId;
      }

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.timestamp[Op.lte] = new Date(endDate);
        }
      }

      const telemetry = await Telemetry.findAll({
        where,
        include: [
          { model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] },
          { model: Flight, as: 'flight', attributes: ['flightId', 'flightDate'] }
        ],
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit)
      });

      res.json(telemetry);
    } catch (error) {
      logger.error('Get telemetry error:', error);
      next(error);
    }
  }

  async getLatest(req, res, next) {
    try {
      const { droneId } = req.params;
      const telemetry = await Telemetry.findOne({
        where: { droneId },
        include: [
          { model: Drone, as: 'drone' },
          { model: Flight, as: 'flight' }
        ],
        order: [['timestamp', 'DESC']]
      });

      if (!telemetry) {
        return res.status(404).json({ error: 'No telemetry data found' });
      }

      res.json(telemetry);
    } catch (error) {
      logger.error('Get latest telemetry error:', error);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const telemetry = await Telemetry.create({
        ...req.body,
        timestamp: req.body.timestamp || new Date()
      });
      res.status(201).json(telemetry);
    } catch (error) {
      logger.error('Create telemetry error:', error);
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const { droneId, flightId } = req.query;
      const where = {};

      if (droneId) {
        where.droneId = droneId;
      }

      if (flightId) {
        where.flightId = flightId;
      }

      const stats = await Telemetry.findAll({
        where,
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('battery_level')), 'avgBattery'],
          [require('sequelize').fn('AVG', require('sequelize').col('gps_signal_strength')), 'avgSignal'],
          [require('sequelize').fn('MAX', require('sequelize').col('altitude')), 'maxAltitude'],
          [require('sequelize').fn('MAX', require('sequelize').col('speed')), 'maxSpeed'],
          [require('sequelize').fn('COUNT', require('sequelize').col('telemetry_id')), 'count']
        ],
        raw: true
      });

      res.json(stats[0] || {});
    } catch (error) {
      logger.error('Get telemetry stats error:', error);
      next(error);
    }
  }
}

module.exports = new TelemetryController();

