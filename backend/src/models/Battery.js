const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Battery = sequelize.define('Battery', {
  batteryId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'battery_id'
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
  capacityMah: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'capacity_mah'
  },
  voltage: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  },
  chargeCycles: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'charge_cycles'
  },
  maxChargeCycles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_charge_cycles'
  },
  healthStatus: {
    type: DataTypes.ENUM('good', 'degraded', 'poor', 'replace'),
    field: 'health_status'
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'purchase_date'
  },
  lastChargedAt: {
    type: DataTypes.DATE,
    field: 'last_charged_at'
  }
}, {
  tableName: 'batteries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Battery;
