const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Show = sequelize.define('Show', {
  showId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'show_id'
  },
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'project_id'
    }
  },
  showName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'show_name'
  },
  showDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'show_date'
  },
  showTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'show_time'
  },
  venue: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  weatherConditions: {
    type: DataTypes.STRING(100),
    field: 'weather_conditions'
  },
  crowdSize: {
    type: DataTypes.INTEGER,
    field: 'crowd_size'
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_seconds'
  },
  musicFilePath: {
    type: DataTypes.TEXT,
    field: 'music_file_path'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled')
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'shows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

module.exports = Show;
