const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const WeatherLog = sequelize.define('WeatherLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  showId: {
    type: DataTypes.INTEGER,
    field: 'show_id',
    references: {
      model: 'shows',
      key: 'id'
    }
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'recorded_at'
  },
  temperature: {
    type: DataTypes.DECIMAL(5, 2)
  },
  humidity: {
    type: DataTypes.DECIMAL(5, 2)
  },
  windSpeed: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'wind_speed'
  },
  windDirection: {
    type: DataTypes.INTEGER,
    field: 'wind_direction'
  },
  pressure: {
    type: DataTypes.DECIMAL(7, 2)
  },
  visibility: {
    type: DataTypes.DECIMAL(6, 2)
  },
  conditions: {
    type: DataTypes.STRING(100)
  },
  precipitation: {
    type: DataTypes.DECIMAL(5, 2)
  },
  cloudCover: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    },
    field: 'cloud_cover'
  },
  weatherData: {
    type: DataTypes.JSONB,
    field: 'weather_data'
  }
}, {
  tableName: 'weather_logs',
  timestamps: true,
  underscored: false
});

module.exports = WeatherLog;

