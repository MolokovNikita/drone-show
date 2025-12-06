const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const MaintenanceLog = sequelize.define('MaintenanceLog', {
  maintenanceId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'maintenance_id'
  },
  droneId: {
    type: DataTypes.INTEGER,
    field: 'drone_id',
    references: {
      model: 'drones',
      key: 'drone_id'
    }
  },
  maintenanceType: {
    type: DataTypes.ENUM('routine', 'repair', 'upgrade', 'inspection'),
    field: 'maintenance_type'
  },
  performedBy: {
    type: DataTypes.INTEGER,
    field: 'performed_by',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  maintenanceDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'maintenance_date'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  nextMaintenanceDate: {
    type: DataTypes.DATEONLY,
    field: 'next_maintenance_date'
  }
}, {
  tableName: 'maintenance_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = MaintenanceLog;
