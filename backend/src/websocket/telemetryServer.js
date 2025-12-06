const WebSocket = require('ws');
const { Telemetry, SafetyAlert, Drone } = require('../models');
const logger = require('../utils/logger');
const config = require('../config/config');

class TelemetryServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  start(port = config.wsPort) {
    this.wss = new WebSocket.Server({ port });

    this.wss.on('connection', (ws, req) => {
      logger.info(`New WebSocket connection from ${req.socket.remoteAddress}`);
      this.clients.add(ws);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleTelemetry(data, ws);
        } catch (error) {
          logger.error('Error processing telemetry message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    logger.info(`WebSocket server started on port ${port}`);
  }

  async handleTelemetry(data, ws) {
    try {
      // Validate required fields
      if (!data.droneId || !data.timestamp) {
        throw new Error('Missing required fields: droneId, timestamp');
      }

      // Save telemetry to database
      const telemetry = await Telemetry.create({
        droneId: data.droneId,
        flightId: data.flightId || null,
        timestamp: new Date(data.timestamp),
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        speed: data.speed,
        batteryLevel: data.batteryLevel || data.batteryPercentage,
        gpsSignalStrength: data.gpsSignalStrength || data.signalStrength,
        connectionStatus: data.connectionStatus || 'connected',
        heading: data.heading
      });

      // Check for alerts
      await this.checkAlerts(telemetry);

      // Broadcast to all connected clients
      this.broadcast(telemetry);

      // Send acknowledgment
      ws.send(JSON.stringify({
        success: true,
        telemetryId: telemetry.telemetryId
      }));
    } catch (error) {
      logger.error('Error handling telemetry:', error);
      ws.send(JSON.stringify({
        error: error.message
      }));
    }
  }

  async checkAlerts(telemetry) {
    const alerts = [];

    // Low battery alert
    if (telemetry.batteryLevel < 20) {
      alerts.push({
        droneId: telemetry.droneId,
        flightId: telemetry.flightId,
        alertType: 'low_battery',
        severity: telemetry.batteryLevel < 10 ? 'critical' : 'warning',
        alertTime: telemetry.timestamp,
        notes: `Low battery: ${telemetry.batteryLevel}%`
      });
    }

    // Low signal alert
    if (telemetry.gpsSignalStrength < 30) {
      alerts.push({
        droneId: telemetry.droneId,
        flightId: telemetry.flightId,
        alertType: 'connection_loss',
        severity: telemetry.gpsSignalStrength < 15 ? 'critical' : 'warning',
        alertTime: telemetry.timestamp,
        notes: `Low GPS signal strength: ${telemetry.gpsSignalStrength}%`
      });
    }

    // Connection status alert
    if (telemetry.connectionStatus === 'disconnected') {
      alerts.push({
        droneId: telemetry.droneId,
        flightId: telemetry.flightId,
        alertType: 'connection_loss',
        severity: 'critical',
        alertTime: telemetry.timestamp,
        notes: 'Drone connection lost'
      });
    }

    // Create alerts
    const { SafetyAlert } = require('../models');
    for (const alertData of alerts) {
      await SafetyAlert.create(alertData);
    }

    // Broadcast alerts if any
    if (alerts.length > 0) {
      this.broadcast({ type: 'alerts', data: alerts });
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket server stopped');
    }
  }
}

module.exports = new TelemetryServer();

