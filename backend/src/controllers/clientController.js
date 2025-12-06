const { Client } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ClientController {
  async getAll(req, res, next) {
    try {
      const { search } = req.query;
      const where = {};

      if (search) {
        where[Op.or] = [
          { companyName: { [Op.iLike]: `%${search}%` } },
          { contactPerson: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const clients = await Client.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      res.json({ items: clients });
    } catch (error) {
      logger.error('Get clients error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      res.json(client);
    } catch (error) {
      logger.error('Get client error:', error);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const client = await Client.create(req.body);
      res.status(201).json(client);
    } catch (error) {
      logger.error('Create client error:', error);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      await client.update(req.body);
      res.json(client);
    } catch (error) {
      logger.error('Update client error:', error);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      await client.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Delete client error:', error);
      next(error);
    }
  }
}

module.exports = new ClientController();

