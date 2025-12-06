const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Drone = sequelize.define('Drone', {
  droneId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'drone_id'
  },
  serialNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'serial_number'
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  manufacturer: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'purchase_date'
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'retired', 'damaged')
  },
  currentFlightHours: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'current_flight_hours'
  },
  maxFlightHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'max_flight_hours'
  },
  batteryId: {
    type: DataTypes.INTEGER,
    field: 'battery_id',
    references: {
      model: 'batteries',
      key: 'battery_id'
    }
  },
  lastMaintenanceDate: {
    type: DataTypes.DATEONLY,
    field: 'last_maintenance_date'
  },
  nextMaintenanceDate: {
    type: DataTypes.DATEONLY,
    field: 'next_maintenance_date'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'drones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

module.exports = Drone;
