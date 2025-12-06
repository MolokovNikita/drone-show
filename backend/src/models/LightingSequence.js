const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const LightingSequence = sequelize.define('LightingSequence', {
  sequenceId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'sequence_id'
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
  rgbValuesJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'rgb_values_json'
  },
  brightnessLevel: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    },
    field: 'brightness_level'
  },
  effectType: {
    type: DataTypes.STRING(50),
    field: 'effect_type'
  }
}, {
  tableName: 'lighting_sequences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: false
});

module.exports = LightingSequence;

