const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const ProjectFile = sequelize.define('ProjectFile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  showId: {
    type: DataTypes.INTEGER,
    field: 'show_id',
    references: {
      model: 'shows',
      key: 'id'
    }
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'file_path'
  },
  fileType: {
    type: DataTypes.STRING(50),
    field: 'file_type'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    field: 'file_size'
  },
  mimeType: {
    type: DataTypes.STRING(100),
    field: 'mime_type'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    field: 'uploaded_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'project_files',
  timestamps: true,
  underscored: false
});

module.exports = ProjectFile;

