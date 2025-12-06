const { Drone, Battery, LEDModule } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DroneController {
  async getAll(req, res, next) {
    try {
      const { status, search } = req.query;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where[Op.or] = [
          { serialNumber: { [Op.iLike]: `%${search}%` } },
          { model: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const drones = await Drone.findAll({
        where,
        include: [
          { model: Battery, as: 'battery' }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({ items: drones });
    } catch (error) {
      logger.error('Get drones error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const drone = await Drone.findByPk(req.params.id, {
        include: [
          { model: Battery, as: 'battery' }
        ]
      });

      if (!drone) {
        return res.status(404).json({ error: 'Drone not found' });
      }

      res.json(drone);
    } catch (error) {
      logger.error('Get drone error:', error);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const drone = await Drone.create(req.body);
      const created = await Drone.findByPk(drone.droneId, {
        include: [
          { model: Battery, as: 'battery' }
        ]
      });
      res.status(201).json(created);
    } catch (error) {
      logger.error('Create drone error:', error);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const drone = await Drone.findByPk(req.params.id);
      if (!drone) {
        return res.status(404).json({ error: 'Drone not found' });
      }

      await drone.update(req.body);
      const updated = await Drone.findByPk(drone.droneId, {
        include: [
          { model: Battery, as: 'battery' }
        ]
      });
      res.json(updated);
    } catch (error) {
      logger.error('Update drone error:', error);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const drone = await Drone.findByPk(req.params.id);
      if (!drone) {
        return res.status(404).json({ error: 'Drone not found' });
      }

      await drone.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Delete drone error:', error);
      next(error);
    }
  }
}

module.exports = new DroneController();
