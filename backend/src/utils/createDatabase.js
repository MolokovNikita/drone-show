const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('./logger');

async function createDatabaseIfNotExists() {
  // Подключаемся к postgres БД для создания новой БД
  const adminSequelize = new Sequelize(
    'postgres',
    config.db.user,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    await adminSequelize.authenticate();
    logger.info('Connected to PostgreSQL server');

    // Проверяем, существует ли база данных
    const [results] = await adminSequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${config.db.name}'`
    );

    let dbJustCreated = false;
    if (results.length === 0) {
      logger.info(`Creating database ${config.db.name}...`);
      await adminSequelize.query(`CREATE DATABASE "${config.db.name}"`);
      logger.info(`Database ${config.db.name} created successfully`);
      dbJustCreated = true;
    } else {
      logger.info(`Database ${config.db.name} already exists`);
    }

    await adminSequelize.close();

    // Если БД только что создана, выполняем DDL скрипт
    if (dbJustCreated) {
      await executeDDLScript();
      await executeSeedScript();
    } else {
      // Проверяем и выполняем seed скрипт если ролей нет
      await ensureRolesExist();
    }

    return true;
  } catch (error) {
    logger.error('Error creating database:', error.message);
    await adminSequelize.close();
    return false;
  }
}

async function executeDDLScript() {
  const ddlPath = path.join(__dirname, '../../database/ddl.sql');
  
  if (!fs.existsSync(ddlPath)) {
    logger.warn(`DDL script not found at ${ddlPath}, skipping...`);
    return;
  }

  const ddlSequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    await ddlSequelize.authenticate();
    logger.info('Executing DDL script...');
    
    const ddlScript = fs.readFileSync(ddlPath, 'utf8');
    // Разделяем скрипт на отдельные команды
    const commands = ddlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.length > 10) { // Пропускаем очень короткие команды
        try {
          await ddlSequelize.query(command);
        } catch (err) {
          // Игнорируем ошибки типа "already exists"
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            logger.warn(`DDL command warning: ${err.message}`);
          }
        }
      }
    }

    logger.info('DDL script executed successfully');
    await ddlSequelize.close();
  } catch (error) {
    logger.error('Error executing DDL script:', error.message);
    await ddlSequelize.close();
  }
}

async function executeSeedScript() {
  const seedPath = path.join(__dirname, '../../database/seed.sql');
  
  if (!fs.existsSync(seedPath)) {
    logger.warn(`Seed script not found at ${seedPath}, skipping...`);
    return;
  }

  const seedSequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    await seedSequelize.authenticate();
    logger.info('Executing seed script...');
    
    const seedScript = fs.readFileSync(seedPath, 'utf8');
    const seedCommands = seedScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of seedCommands) {
      if (command.length > 10) {
        try {
          await seedSequelize.query(command);
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate') && !err.message.includes('ON CONFLICT')) {
            logger.warn(`Seed command warning: ${err.message}`);
          }
        }
      }
    }
    
    logger.info('Seed script executed successfully');
    await seedSequelize.close();
  } catch (error) {
    logger.error('Error executing seed script:', error.message);
    await seedSequelize.close();
  }
}

async function ensureRolesExist() {
  const { Role } = require('../models');
  const sequelize = require('./db');
  
  try {
    await sequelize.authenticate();
    
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
  } catch (error) {
    logger.warn('Could not ensure roles (this is ok if they already exist):', error.message);
  }
}

module.exports = createDatabaseIfNotExists;
