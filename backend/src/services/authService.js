const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Role } = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');

class AuthService {
  async register(userData) {
    const { username, email, password, fullName, phone, roleId } = userData;

    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }]
      } 
    });
    if (existingUser) {
      throw new Error('User with this username or email already exists');
    }

    // Find default role (operator) if roleId not provided
    let defaultRoleId = null;
    if (!roleId) {
      const defaultRole = await Role.findOne({ where: { roleName: 'operator' } });
      if (defaultRole) {
        defaultRoleId = defaultRole.roleId;
      } else {
        // If no roles exist, try to find any role or set to null
        const anyRole = await Role.findOne();
        if (anyRole) {
          defaultRoleId = anyRole.roleId;
        }
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      passwordHash,
      fullName,
      phone,
      roleId: roleId || defaultRoleId // Use provided roleId or default
    });

    const userWithRole = await User.findByPk(user.userId, {
      include: [{ model: Role, as: 'role' }]
    });

    return {
      user: {
        userId: userWithRole.userId,
        username: userWithRole.username,
        email: userWithRole.email,
        fullName: userWithRole.fullName,
        role: userWithRole.role
      },
      tokens: this.generateTokens(userWithRole)
    };
  }

  async login(username, password) {
    const loginValue = (username || '').trim();
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: loginValue },
          { email: loginValue }
        ]
      },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return {
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      tokens: this.generateTokens(user)
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await User.findByPk(decoded.userId, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  generateTokens(user) {
    const payload = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role?.roleName
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();

