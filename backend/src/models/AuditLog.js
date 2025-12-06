const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    field: 'entity_type'
  },
  entityId: {
    type: DataTypes.INTEGER,
    field: 'entity_id'
  },
  oldValues: {
    type: DataTypes.JSONB,
    field: 'old_values'
  },
  newValues: {
    type: DataTypes.JSONB,
    field: 'new_values'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  underscored: false
});

module.exports = AuditLog;

