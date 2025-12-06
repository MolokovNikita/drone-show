const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Client = sequelize.define('Client', {
  clientId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'client_id'
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'company_name'
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'contact_person'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'clients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Client;
