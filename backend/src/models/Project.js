const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Project = sequelize.define('Project', {
  projectId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'project_id'
  },
  projectName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'project_name'
  },
  clientId: {
    type: DataTypes.INTEGER,
    field: 'client_id',
    references: {
      model: 'clients',
      key: 'client_id'
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  status: {
    type: DataTypes.ENUM('planning', 'design', 'testing', 'approved', 'completed', 'cancelled')
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date'
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2)
  },
  location: {
    type: DataTypes.TEXT
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

module.exports = Project;
