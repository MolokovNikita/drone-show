const { Project, Client, User, Show } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ProjectController {
  async getAll(req, res, next) {
    try {
      const { status, clientId, search } = req.query;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (clientId) {
        where.clientId = clientId;
      }

      if (search) {
        where[Op.or] = [
          { projectName: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const projects = await Project.findAll({
        where,
        include: [
          { model: Client, as: 'client' },
          { model: Show, as: 'shows' }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({ items: projects });
    } catch (error) {
      logger.error('Get projects error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const project = await Project.findByPk(req.params.id, {
        include: [
          { model: Client, as: 'client' },
          { model: Show, as: 'shows' }
        ]
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      logger.error('Get project error:', error);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const project = await Project.create({
        ...req.body,
        created_by: req.user?.userId
      });
      const created = await Project.findByPk(project.projectId, {
        include: [
          { model: Client, as: 'client' }
        ]
      });
      res.status(201).json(created);
    } catch (error) {
      logger.error('Create project error:', error);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const project = await Project.findByPk(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await project.update(req.body);
      const updated = await Project.findByPk(project.projectId, {
        include: [
          { model: Client, as: 'client' }
        ]
      });
      res.json(updated);
    } catch (error) {
      logger.error('Update project error:', error);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const project = await Project.findByPk(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await project.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Delete project error:', error);
      next(error);
    }
  }
}

module.exports = new ProjectController();
