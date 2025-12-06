const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Choreography = sequelize.define('Choreography', {
  choreographyId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'choreography_id'
  },
  showId: {
    type: DataTypes.INTEGER,
    field: 'show_id',
    references: {
      model: 'shows',
      key: 'show_id'
    }
  },
  choreographyName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'choreography_name'
  },
  designerId: {
    type: DataTypes.INTEGER,
    field: 'designer_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  designFilePath: {
    type: DataTypes.TEXT,
    field: 'design_file_path'
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_seconds'
  },
  droneCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'drone_count'
  },
  sceneOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'scene_order'
  },
  status: {
    type: DataTypes.ENUM('draft', 'review', 'approved', 'rejected')
  }
}, {
  tableName: 'choreographies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

module.exports = Choreography;
