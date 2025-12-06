const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const DroneAssignment = sequelize.define('DroneAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    field: 'assigned_by',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  status: {
    type: DataTypes.ENUM('assigned', 'confirmed', 'in_flight', 'completed', 'cancelled'),
    defaultValue: 'assigned'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'drone_assignments',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['show_id', 'drone_id']
    }
  ]
});

module.exports = DroneAssignment;

