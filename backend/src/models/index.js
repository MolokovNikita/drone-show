const sequelize = require('../utils/db');
const Role = require('./Role');
const User = require('./User');
const Battery = require('./Battery');
const Drone = require('./Drone');
const LEDModule = require('./LEDModule');
const MaintenanceLog = require('./MaintenanceLog');
const Client = require('./Client');
const Project = require('./Project');
const Show = require('./Show');
const Choreography = require('./Choreography');
const FlightPath = require('./FlightPath');
const Formation = require('./Formation');
const LightingSequence = require('./LightingSequence');
const Flight = require('./Flight');
const Telemetry = require('./Telemetry');
const SafetyAlert = require('./SafetyAlert');
const Certification = require('./Certification');
const Geofence = require('./Geofence');
const AuditLog = require('./AuditLog');
const DroneAssignment = require('./DroneAssignment');

// Define associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

Battery.hasMany(Drone, { foreignKey: 'battery_id', as: 'drones' });
Drone.belongsTo(Battery, { foreignKey: 'battery_id', as: 'battery' });

Drone.hasMany(LEDModule, { foreignKey: 'drone_id', as: 'ledModules' });
LEDModule.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

Drone.hasMany(MaintenanceLog, { foreignKey: 'drone_id', as: 'maintenanceLogs' });
MaintenanceLog.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

User.hasMany(MaintenanceLog, { foreignKey: 'performed_by', as: 'maintenanceLogs' });
MaintenanceLog.belongsTo(User, { foreignKey: 'performed_by', as: 'performer' });

Client.hasMany(Project, { foreignKey: 'client_id', as: 'projects' });
Project.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

User.hasMany(Project, { foreignKey: 'created_by', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Project.hasMany(Show, { foreignKey: 'project_id', as: 'shows' });
Show.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

Show.hasMany(Choreography, { foreignKey: 'show_id', as: 'choreographies' });
Choreography.belongsTo(Show, { foreignKey: 'show_id', as: 'show' });

User.hasMany(Choreography, { foreignKey: 'designer_id', as: 'choreographies' });
Choreography.belongsTo(User, { foreignKey: 'designer_id', as: 'designer' });

Choreography.hasMany(FlightPath, { foreignKey: 'choreography_id', as: 'flightPaths' });
FlightPath.belongsTo(Choreography, { foreignKey: 'choreography_id', as: 'choreography' });

Drone.hasMany(FlightPath, { foreignKey: 'drone_id', as: 'flightPaths' });
FlightPath.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

Choreography.hasMany(Formation, { foreignKey: 'choreography_id', as: 'formations' });
Formation.belongsTo(Choreography, { foreignKey: 'choreography_id', as: 'choreography' });

Choreography.hasMany(LightingSequence, { foreignKey: 'choreography_id', as: 'lightingSequences' });
LightingSequence.belongsTo(Choreography, { foreignKey: 'choreography_id', as: 'choreography' });

Drone.hasMany(LightingSequence, { foreignKey: 'drone_id', as: 'lightingSequences' });
LightingSequence.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

Show.hasMany(Flight, { foreignKey: 'show_id', as: 'flights' });
Flight.belongsTo(Show, { foreignKey: 'show_id', as: 'show' });

Drone.hasMany(Flight, { foreignKey: 'drone_id', as: 'flights' });
Flight.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

User.hasMany(Flight, { foreignKey: 'pilot_id', as: 'flights' });
Flight.belongsTo(User, { foreignKey: 'pilot_id', as: 'pilot' });

Battery.hasMany(Flight, { foreignKey: 'battery_used', as: 'flights' });
Flight.belongsTo(Battery, { foreignKey: 'battery_used', as: 'batteryRef' });

Flight.hasMany(Telemetry, { foreignKey: 'flight_id', as: 'telemetry' });
Telemetry.belongsTo(Flight, { foreignKey: 'flight_id', as: 'flight' });

Drone.hasMany(Telemetry, { foreignKey: 'drone_id', as: 'telemetry' });
Telemetry.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

Flight.hasMany(SafetyAlert, { foreignKey: 'flight_id', as: 'safetyAlerts' });
SafetyAlert.belongsTo(Flight, { foreignKey: 'flight_id', as: 'flight' });

Drone.hasMany(SafetyAlert, { foreignKey: 'drone_id', as: 'safetyAlerts' });
SafetyAlert.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

User.hasMany(Certification, { foreignKey: 'user_id', as: 'certifications' });
Certification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Show.hasMany(Geofence, { foreignKey: 'show_id', as: 'geofences' });
Geofence.belongsTo(Show, { foreignKey: 'show_id', as: 'show' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Show.hasMany(DroneAssignment, { foreignKey: 'show_id', as: 'droneAssignments' });
DroneAssignment.belongsTo(Show, { foreignKey: 'show_id', as: 'show' });

Drone.hasMany(DroneAssignment, { foreignKey: 'drone_id', as: 'droneAssignments' });
DroneAssignment.belongsTo(Drone, { foreignKey: 'drone_id', as: 'drone' });

User.hasMany(DroneAssignment, { foreignKey: 'assigned_by', as: 'droneAssignments' });
DroneAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

module.exports = {
  sequelize,
  Role,
  User,
  Battery,
  Drone,
  LEDModule,
  MaintenanceLog,
  Client,
  Project,
  Show,
  Choreography,
  FlightPath,
  Formation,
  LightingSequence,
  Flight,
  Telemetry,
  SafetyAlert,
  Certification,
  Geofence,
  AuditLog,
  DroneAssignment
};
