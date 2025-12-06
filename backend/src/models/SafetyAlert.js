const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const SafetyAlert = sequelize.define('SafetyAlert', {
  alertId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'alert_id'
  },
  flightId: {
    type: DataTypes.INTEGER,
    field: 'flight_id',
    references: {
      model: 'flights',
      key: 'flight_id'
    }
  },
  droneId: {
    type: DataTypes.INTEGER,
    field: 'drone_id',
    references: {
      model: 'drones',
      key: 'drone_id'
    }
  },
  alertType: {
    type: DataTypes.ENUM('low_battery', 'connection_loss', 'collision_warning', 'geofence_breach', 'hardware_failure'),
    field: 'alert_type'
  },
  alertTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'alert_time'
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical')
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolutionTime: {
    type: DataTypes.DATE,
    field: 'resolution_time'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'safety_alerts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = SafetyAlert;

