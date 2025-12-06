const telemetryServer = require('./telemetryServer');

// Start WebSocket server
telemetryServer.start();

module.exports = telemetryServer;

