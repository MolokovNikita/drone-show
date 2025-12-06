const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const FlightPath = sequelize.define('FlightPath', {
  pathId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'path_id'
  },
  choreographyId: {
    type: DataTypes.INTEGER,
    field: 'choreography_id',
    references: {
      model: 'choreographies',
      key: 'choreography_id'
    }
  },
  droneId: {
    type: DataTypes.INTEGER,
    field: 'drone_id',
    references: {
      model: 'drones',
      key: 'drone_id'
    }
  },
  pathDataJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'path_data_json'
  },
  startPosition: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'start_position'
  },
  endPosition: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'end_position'
  },
  maxAltitude: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    field: 'max_altitude'
  },
  collisionCheckStatus: {
    type: DataTypes.ENUM('pending', 'passed', 'failed'),
    field: 'collision_check_status'
  }
}, {
  tableName: 'flight_paths',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = FlightPath;
