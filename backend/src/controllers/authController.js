const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Registration validation errors:', errors.array());
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.array() 
        });
      }

      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Login validation errors:', errors.array());
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.json(result);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const tokens = await authService.refreshToken(refreshToken);
      res.json(tokens);
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await require('../models').User.findByPk(req.user.userId, {
        include: [{ model: require('../models').Role, as: 'role' }],
        attributes: { exclude: ['passwordHash'] }
      });
      res.json({ user });
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();

