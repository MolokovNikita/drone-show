const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const sequelize = require('./utils/db');
const createDatabaseIfNotExists = require('./utils/createDatabase');
require('./websocket'); // Start WebSocket server

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Drone Light Show Management API',
      version: '1.0.0',
      description: 'API documentation for Drone Light Show Management System'
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`${req.method} ${req.path}`, {
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query
    });
  }
  next();
});

// Rate limiting - более мягкие лимиты для разработки
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in development, 100 in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});
app.use('/api/', limiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Создаем базу данных если её нет
    await createDatabaseIfNotExists();

    // Небольшая задержка для завершения создания БД и выполнения DDL
    await new Promise(resolve => setTimeout(resolve, 2000));

    await sequelize.authenticate();
    logger.info('Database connection established');

    // Sync models (use migrations in production)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');

      // Ensure default roles exist
      const { Role } = require('./models');
      const roles = [
        { roleName: 'admin', permissionsJson: { all: true }, description: 'Administrator with full access' },
        { roleName: 'manager', permissionsJson: { projects: true, shows: true, drones: true, users: true }, description: 'Manager with management access' },
        { roleName: 'operator', permissionsJson: { shows: true, drones: true, telemetry: true }, description: 'Operator with operational access' },
        { roleName: 'pilot', permissionsJson: { drones: true, telemetry: true, flights: true }, description: 'Pilot with flight access' },
        { roleName: 'designer', permissionsJson: { projects: true, shows: true, choreographies: true }, description: 'Designer with design access' },
      ];

      for (const roleData of roles) {
        await Role.findOrCreate({
          where: { roleName: roleData.roleName },
          defaults: roleData
        });
      }
      logger.info('Default roles ensured');

      // Seed demo data if database is empty (only users table)
      const { User } = require('./models');
      const userCount = await User.count();
      if (userCount <= 5) { // Only seed if we have default users or less
        try {
          const seedDemoData = require('./scripts/seedDemoData');
          await seedDemoData();
          logger.info('Demo data seeded automatically');
        } catch (error) {
          logger.warn('Could not seed demo data automatically:', error.message);
        }
      }
    }

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`API documentation available at http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

