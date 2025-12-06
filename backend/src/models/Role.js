const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Role = sequelize.define('Role', {
  roleId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'role_id'
  },
  roleName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'role_name'
  },
  permissionsJson: {
    type: DataTypes.JSONB,
    field: 'permissions_json'
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Role;
