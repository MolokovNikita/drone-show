const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Geofence = sequelize.define('Geofence', {
  geofenceId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'geofence_id'
  },
  showId: {
    type: DataTypes.INTEGER,
    field: 'show_id',
    references: {
      model: 'shows',
      key: 'show_id'
    }
  },
  coordinatesJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'coordinates_json'
  },
  maxAltitude: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    field: 'max_altitude'
  },
  crowdLineDistance: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    field: 'crowd_line_distance'
  }
}, {
  tableName: 'geofences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Geofence;

