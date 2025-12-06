const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Telemetry = sequelize.define('Telemetry', {
  telemetryId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'telemetry_id'
  },
  droneId: {
    type: DataTypes.INTEGER,
    field: 'drone_id',
    references: {
      model: 'drones',
      key: 'drone_id'
    }
  },
  flightId: {
    type: DataTypes.INTEGER,
    field: 'flight_id',
    references: {
      model: 'flights',
      key: 'flight_id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  altitude: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false
  },
  batteryLevel: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    },
    field: 'battery_level'
  },
  gpsSignalStrength: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    },
    field: 'gps_signal_strength'
  },
  connectionStatus: {
    type: DataTypes.ENUM('connected', 'weak', 'disconnected'),
    field: 'connection_status'
  },
  speed: {
    type: DataTypes.DECIMAL(5, 2)
  },
  heading: {
    type: DataTypes.DECIMAL(5, 2)
  }
}, {
  tableName: 'telemetry',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Telemetry;
