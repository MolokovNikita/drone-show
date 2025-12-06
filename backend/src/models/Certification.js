const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Certification = sequelize.define('Certification', {
  certificationId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'certification_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  certificationType: {
    type: DataTypes.ENUM('pilot_license', 'drone_registration', 'insurance', 'safety_training'),
    field: 'certification_type'
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'issue_date'
  },
  expirationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'expiration_date'
  },
  documentPath: {
    type: DataTypes.TEXT,
    field: 'document_path'
  },
  status: {
    type: DataTypes.ENUM('valid', 'expired', 'revoked')
  }
}, {
  tableName: 'certifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Certification;

