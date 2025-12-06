const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const LEDModule = sequelize.define('LEDModule', {
  ledModuleId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'led_module_id'
  },
  droneId: {
    type: DataTypes.INTEGER,
    field: 'drone_id',
    references: {
      model: 'drones',
      key: 'drone_id'
    }
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  rgbCapability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'rgb_capability'
  },
  brightnessLevel: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    },
    field: 'brightness_level'
  },
  status: {
    type: DataTypes.ENUM('working', 'faulty', 'replaced')
  },
  installedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'installed_at'
  }
}, {
  tableName: 'led_modules',
  timestamps: false,
  underscored: false
});

module.exports = LEDModule;
