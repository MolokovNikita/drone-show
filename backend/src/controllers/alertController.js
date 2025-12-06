const { SafetyAlert, Drone, Flight, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AlertController {
  async getAll(req, res, next) {
    try {
      const { resolved, severity, droneId, flightId } = req.query;
      const where = {};

      if (resolved !== undefined) {
        where.resolved = resolved === 'true';
      }

      if (severity) {
        where.severity = severity;
      }

      if (droneId) {
        where.droneId = droneId;
      }

      if (flightId) {
        where.flightId = flightId;
      }

      const alerts = await SafetyAlert.findAll({
        where,
        include: [
          { model: Drone, as: 'drone', attributes: ['droneId', 'serialNumber', 'model'] },
          { model: Flight, as: 'flight', attributes: ['flightId', 'flightDate'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 100
      });

      res.json(alerts);
    } catch (error) {
      logger.error('Get alerts error:', error);
      next(error);
    }
  }

  async acknowledge(req, res, next) {
    try {
      const alert = await SafetyAlert.findByPk(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      await alert.update({
        resolved: true,
        resolutionTime: new Date()
      });

      const updated = await SafetyAlert.findByPk(alert.alertId, {
        include: [
          { model: Drone, as: 'drone' },
          { model: Flight, as: 'flight' }
        ]
      });

      res.json(updated);
    } catch (error) {
      logger.error('Acknowledge alert error:', error);
      next(error);
    }
  }

  async resolve(req, res, next) {
    try {
      const alert = await SafetyAlert.findByPk(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      await alert.update({
        resolved: true,
        resolutionTime: new Date()
      });

      res.json(alert);
    } catch (error) {
      logger.error('Resolve alert error:', error);
      next(error);
    }
  }
}

module.exports = new AlertController();

