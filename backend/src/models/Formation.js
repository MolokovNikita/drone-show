const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Formation = sequelize.define('Formation', {
  formationId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'formation_id'
  },
  choreographyId: {
    type: DataTypes.INTEGER,
    field: 'choreography_id',
    references: {
      model: 'choreographies',
      key: 'choreography_id'
    }
  },
  formationName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'formation_name'
  },
  formationType: {
    type: DataTypes.ENUM('2D', '3D', 'logo', 'text', 'animation'),
    field: 'formation_type'
  },
  timestampStart: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    field: 'timestamp_start'
  },
  timestampEnd: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    field: 'timestamp_end'
  },
  coordinatesJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'coordinates_json'
  },
  droneCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'drone_count'
  }
}, {
  tableName: 'formations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = Formation;
