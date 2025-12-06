const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Flight = sequelize.define('Flight', {
  flightId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'flight_id'
  },
  showId: {
    type: DataTypes.INTEGER,
    field: 'show_id',
    references: {
      model: 'shows',
      key: 'show_id'
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
  pilotId: {
    type: DataTypes.INTEGER,
    field: 'pilot_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  flightDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'flight_date'
  },
  takeoffTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'takeoff_time'
  },
  landingTime: {
    type: DataTypes.DATE,
    field: 'landing_time'
  },
  flightDurationMinutes: {
    type: DataTypes.DECIMAL(6, 2),
    field: 'flight_duration_minutes'
  },
  batteryUsed: {
    type: DataTypes.INTEGER,
    field: 'battery_used',
    references: {
      model: 'batteries',
      key: 'battery_id'
    }
  },
  status: {
    type: DataTypes.ENUM('successful', 'aborted', 'emergency_landing', 'failed')
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'flights',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Flight;

