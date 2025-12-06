const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  droneId: {
    type: DataTypes.INTEGER,
    field: 'drone_id',
    references: {
      model: 'drones',
      key: 'id'
    }
  },
  showId: {
    type: DataTypes.INTEGER,
    field: 'show_id',
    references: {
      model: 'shows',
      key: 'id'
    }
  },
  alertType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'alert_type'
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
    defaultValue: 'info'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'acknowledged', 'resolved', 'dismissed'),
    defaultValue: 'active'
  },
  acknowledgedBy: {
    type: DataTypes.INTEGER,
    field: 'acknowledged_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    field: 'acknowledged_at'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    field: 'resolved_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  underscored: false
});

module.exports = Alert;

