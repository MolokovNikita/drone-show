const bcrypt = require('bcrypt');
const { 
  Role, 
  User, 
  Client, 
  Project, 
  Show, 
  Battery, 
  Drone, 
  LEDModule,
  Choreography,
  Flight,
  Telemetry
} = require('../models');
const sequelize = require('../utils/db');
const logger = require('../utils/logger');

async function seedDemoData() {
  try {
    logger.info('Starting demo data seeding...');

    // 1. Ensure roles exist
    const roles = await Promise.all([
      Role.findOrCreate({ where: { roleName: 'admin' }, defaults: { permissionsJson: { all: true }, description: 'Administrator' } }),
      Role.findOrCreate({ where: { roleName: 'manager' }, defaults: { permissionsJson: { projects: true, shows: true, drones: true }, description: 'Manager' } }),
      Role.findOrCreate({ where: { roleName: 'operator' }, defaults: { permissionsJson: { shows: true, drones: true, telemetry: true }, description: 'Operator' } }),
      Role.findOrCreate({ where: { roleName: 'pilot' }, defaults: { permissionsJson: { drones: true, telemetry: true, flights: true }, description: 'Pilot' } }),
      Role.findOrCreate({ where: { roleName: 'designer' }, defaults: { permissionsJson: { projects: true, shows: true, choreographies: true }, description: 'Designer' } }),
    ]);

    const adminRole = roles[0][0];
    const managerRole = roles[1][0];
    const operatorRole = roles[2][0];
    const pilotRole = roles[3][0];
    const designerRole = roles[4][0];

    logger.info('Roles created/verified');

    // 2. Create demo users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = await Promise.all([
      User.findOrCreate({
        where: { username: 'admin' },
        defaults: {
          username: 'admin',
          email: 'admin@drone-show.com',
          passwordHash,
          fullName: 'Admin User',
          phone: '+1-555-0100',
          roleId: adminRole.roleId,
          isActive: true
        }
      }),
      User.findOrCreate({
        where: { username: 'manager' },
        defaults: {
          username: 'manager',
          email: 'manager@drone-show.com',
          passwordHash,
          fullName: 'Manager User',
          phone: '+1-555-0101',
          roleId: managerRole.roleId,
          isActive: true
        }
      }),
      User.findOrCreate({
        where: { username: 'operator' },
        defaults: {
          username: 'operator',
          email: 'operator@drone-show.com',
          passwordHash,
          fullName: 'Operator User',
          phone: '+1-555-0102',
          roleId: operatorRole.roleId,
          isActive: true
        }
      }),
      User.findOrCreate({
        where: { username: 'pilot' },
        defaults: {
          username: 'pilot',
          email: 'pilot@drone-show.com',
          passwordHash,
          fullName: 'Pilot User',
          phone: '+1-555-0103',
          roleId: pilotRole.roleId,
          isActive: true
        }
      }),
      User.findOrCreate({
        where: { username: 'designer' },
        defaults: {
          username: 'designer',
          email: 'designer@drone-show.com',
          passwordHash,
          fullName: 'Designer User',
          phone: '+1-555-0104',
          roleId: designerRole.roleId,
          isActive: true
        }
      }),
    ]);

    const adminUser = users[0][0];
    const managerUser = users[1][0];
    const operatorUser = users[2][0];
    const pilotUser = users[3][0];
    const designerUser = users[4][0];

    logger.info('Users created/verified');

    // 3. Create demo clients
    const clients = await Promise.all([
      Client.findOrCreate({
        where: { companyName: 'TechCorp Events' },
        defaults: {
          companyName: 'TechCorp Events',
          contactPerson: 'John Smith',
          email: 'john.smith@techcorp.com',
          phone: '+1-555-1000',
          address: '123 Business Ave, New York, NY 10001',
          notes: 'Major corporate client, prefers evening shows'
        }
      }),
      Client.findOrCreate({
        where: { companyName: 'City Festival Committee' },
        defaults: {
          companyName: 'City Festival Committee',
          contactPerson: 'Sarah Johnson',
          email: 'sarah.j@cityfest.com',
          phone: '+1-555-1001',
          address: 'City Hall, Main Street, Los Angeles, CA 90001',
          notes: 'Annual city festival, requires large-scale shows'
        }
      }),
      Client.findOrCreate({
        where: { companyName: 'Music Festival Inc' },
        defaults: {
          companyName: 'Music Festival Inc',
          contactPerson: 'Mike Davis',
          email: 'mike.d@musicfest.com',
          phone: '+1-555-1002',
          address: '456 Entertainment Blvd, Miami, FL 33101',
          notes: 'Music festival organizer, needs synchronized shows'
        }
      }),
    ]);

    const client1 = clients[0][0];
    const client2 = clients[1][0];
    const client3 = clients[2][0];

    logger.info('Clients created/verified');

    // 4. Create demo batteries
    const batteries = [];
    for (let i = 1; i <= 20; i++) {
      const battery = await Battery.findOrCreate({
        where: { serialNumber: `BAT-${String(i).padStart(4, '0')}` },
        defaults: {
          serialNumber: `BAT-${String(i).padStart(4, '0')}`,
          model: 'LiPo 6S 5000mAh',
          capacityMah: 5000,
          voltage: 22.2,
          chargeCycles: Math.floor(Math.random() * 100),
          maxChargeCycles: 300,
          healthStatus: i % 3 === 0 ? 'degraded' : 'good',
          purchaseDate: new Date(2023, 0, 1 + i).toISOString().split('T')[0],
          lastChargedAt: new Date()
        }
      });
      batteries.push(battery[0]);
    }

    logger.info('Batteries created/verified');

    // 5. Create demo drones
    const drones = [];
    for (let i = 1; i <= 15; i++) {
      const drone = await Drone.findOrCreate({
        where: { serialNumber: `DRONE-${String(i).padStart(4, '0')}` },
        defaults: {
          serialNumber: `DRONE-${String(i).padStart(4, '0')}`,
          model: `Model X${i % 3 + 1}`,
          manufacturer: 'DroneTech Pro',
          purchaseDate: new Date(2023, 3, 1 + i).toISOString().split('T')[0],
          status: i % 4 === 0 ? 'maintenance' : 'active',
          currentFlightHours: Math.random() * 50,
          maxFlightHours: 1000,
          batteryId: batteries[i % batteries.length].batteryId,
          lastMaintenanceDate: '2024-01-01',
          nextMaintenanceDate: '2024-04-01',
          notes: `Drone #${i} - Standard configuration`
        }
      });
      drones.push(drone[0]);

      // Create LED module for each drone
      await LEDModule.findOrCreate({
        where: { droneId: drone[0].droneId },
        defaults: {
          droneId: drone[0].droneId,
          model: 'LED-RGB-Pro',
          rgbCapability: true,
          brightnessLevel: 100,
          status: 'working'
        }
      });
    }

    logger.info('Drones created/verified');

    // 6. Create demo projects
    const projects = await Promise.all([
      Project.findOrCreate({
        where: { projectName: 'Summer Music Festival 2024' },
        defaults: {
          projectName: 'Summer Music Festival 2024',
          clientId: client3.clientId,
          createdBy: managerUser.userId,
          status: 'approved',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          budget: 50000,
          location: 'Miami Beach, FL',
          description: 'Large-scale drone light show for summer music festival'
        }
      }),
      Project.findOrCreate({
        where: { projectName: 'Corporate Product Launch' },
        defaults: {
          projectName: 'Corporate Product Launch',
          clientId: client1.clientId,
          createdBy: managerUser.userId,
          status: 'design',
          startDate: '2024-03-01',
          endDate: '2024-04-30',
          budget: 30000,
          location: 'New York, NY',
          description: 'Product launch event with synchronized drone show'
        }
      }),
      Project.findOrCreate({
        where: { projectName: 'City Anniversary Celebration' },
        defaults: {
          projectName: 'City Anniversary Celebration',
          clientId: client2.clientId,
          createdBy: managerUser.userId,
          status: 'testing',
          startDate: '2024-05-01',
          endDate: '2024-06-30',
          budget: 40000,
          location: 'Los Angeles, CA',
          description: 'City anniversary celebration with historical theme'
        }
      }),
    ]);

    const project1 = projects[0][0];
    const project2 = projects[1][0];
    const project3 = projects[2][0];

    logger.info('Projects created/verified');

    // 7. Create demo shows
    const shows = await Promise.all([
      Show.findOrCreate({
        where: { showName: 'Opening Night Spectacular' },
        defaults: {
          showName: 'Opening Night Spectacular',
          projectId: project1.projectId,
          showDate: '2024-07-15',
          showTime: '20:00:00',
          venue: 'Miami Beach Amphitheater',
          weatherConditions: 'Clear, 75°F',
          crowdSize: 5000,
          durationSeconds: 600,
          musicFilePath: '/music/opening-night.mp3',
          status: 'scheduled',
          notes: 'Opening show of the festival'
        }
      }),
      Show.findOrCreate({
        where: { showName: 'Product Reveal Show' },
        defaults: {
          showName: 'Product Reveal Show',
          projectId: project2.projectId,
          showDate: '2024-04-20',
          showTime: '19:30:00',
          venue: 'TechCorp Headquarters',
          weatherConditions: 'Partly cloudy, 68°F',
          crowdSize: 500,
          durationSeconds: 300,
          musicFilePath: '/music/product-launch.mp3',
          status: 'scheduled',
          notes: 'Main product reveal event'
        }
      }),
      Show.findOrCreate({
        where: { showName: 'Anniversary Grand Finale' },
        defaults: {
          showName: 'Anniversary Grand Finale',
          projectId: project3.projectId,
          showDate: '2024-06-10',
          showTime: '21:00:00',
          venue: 'City Center Plaza',
          weatherConditions: 'Clear, 72°F',
          crowdSize: 10000,
          durationSeconds: 900,
          musicFilePath: '/music/anniversary-finale.mp3',
          status: 'in_progress',
          notes: 'Grand finale celebration show'
        }
      }),
    ]);

    const show1 = shows[0][0];
    const show2 = shows[1][0];
    const show3 = shows[2][0];

    logger.info('Shows created/verified');

    // 8. Create demo choreographies
    const choreographies = await Promise.all([
      Choreography.findOrCreate({
        where: { choreographyName: 'Opening Sequence' },
        defaults: {
          choreographyName: 'Opening Sequence',
          showId: show1.showId,
          designerId: designerUser.userId,
          durationSeconds: 120,
          droneCount: 50,
          sceneOrder: 1,
          status: 'approved'
        }
      }),
      Choreography.findOrCreate({
        where: { choreographyName: 'Logo Formation' },
        defaults: {
          choreographyName: 'Logo Formation',
          showId: show2.showId,
          designerId: designerUser.userId,
          durationSeconds: 60,
          droneCount: 30,
          sceneOrder: 1,
          status: 'approved'
        }
      }),
    ]);

    logger.info('Choreographies created/verified');

    // 9. Create demo flights
    const flights = [];
    const flightDate = new Date(2024, 6, 15);
    for (let i = 0; i < 10; i++) {
      const takeoffTime = new Date(flightDate);
      takeoffTime.setHours(20, 0, i * 10, 0);
      const landingTime = new Date(flightDate);
      landingTime.setHours(20, 10, i * 10, 0);
      
      const flight = await Flight.create({
        showId: show1.showId,
        droneId: drones[i % drones.length].droneId,
        pilotId: pilotUser.userId,
        flightDate: flightDate.toISOString().split('T')[0],
        takeoffTime: takeoffTime,
        landingTime: landingTime,
        flightDurationMinutes: 10,
        batteryUsed: batteries[i % batteries.length].batteryId,
        status: 'successful',
        notes: `Flight #${i + 1} for opening show`
      });
      flights.push(flight);
    }

    logger.info('Flights created/verified');

    // 10. Create demo telemetry data
    for (const flight of flights.slice(0, 5)) {
      for (let i = 0; i < 10; i++) {
        await Telemetry.create({
          droneId: flight.droneId,
          flightId: flight.flightId,
          timestamp: new Date(flight.takeoffTime.getTime() + i * 60000),
          latitude: 25.7617 + (Math.random() - 0.5) * 0.01,
          longitude: -80.1918 + (Math.random() - 0.5) * 0.01,
          altitude: 50 + Math.random() * 50,
          batteryLevel: 100 - i * 2,
          gpsSignalStrength: 80 + Math.random() * 20,
          connectionStatus: 'connected',
          speed: 5 + Math.random() * 5,
          heading: Math.random() * 360
        });
      }
    }

    logger.info('Telemetry data created/verified');

    logger.info('✅ Demo data seeding completed successfully!');
    logger.info('\n📋 Demo Accounts:');
    logger.info('  Admin:    username=admin,    password=password123');
    logger.info('  Manager:  username=manager,  password=password123');
    logger.info('  Operator: username=operator,  password=password123');
    logger.info('  Pilot:    username=pilot,    password=password123');
    logger.info('  Designer: username=designer,  password=password123');

  } catch (error) {
    logger.error('Error seeding demo data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      logger.info('Database connected');
      return seedDemoData();
    })
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDemoData;

