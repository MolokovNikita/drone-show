const test = require('node:test');
const assert = require('node:assert/strict');

function makeRes() {
  const res = {};
  res._status = 200;
  res._body = null;
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

function loadController(telemetryModel, droneModel = {}, flightModel = {}) {
  const ctrlPath = require.resolve('./telemetryController');
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');

  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];

  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {} }
  };
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: { Telemetry: telemetryModel, Drone: droneModel, Flight: flightModel }
  };

  delete require.cache[ctrlPath];
  const controller = require('./telemetryController');

  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return controller;
}

test('TelemetryController.getAll: returns list of telemetry records', async () => {
  const fakeData = [{ telemetryId: 1, droneId: 1, altitude: 50 }];
  const controller = loadController({ findAll: async () => fakeData });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeData);
});

test('TelemetryController.getAll: applies droneId filter when provided', async () => {
  let capturedWhere = null;
  const controller = loadController({
    findAll: async ({ where }) => { capturedWhere = where; return []; }
  });
  const req = { query: { droneId: '5' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(capturedWhere.droneId, '5');
});

test('TelemetryController.getAll: applies flightId filter when provided', async () => {
  let capturedWhere = null;
  const controller = loadController({
    findAll: async ({ where }) => { capturedWhere = where; return []; }
  });
  const req = { query: { flightId: '2' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(capturedWhere.flightId, '2');
});

test('TelemetryController.getAll: applies date range filter', async () => {
  let capturedWhere = null;
  const controller = loadController({
    findAll: async ({ where }) => { capturedWhere = where; return []; }
  });
  const req = { query: { startDate: '2024-01-01', endDate: '2024-01-31' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.ok(capturedWhere.timestamp);
});

test('TelemetryController.getAll: applies startDate-only filter', async () => {
  const { Op } = require('sequelize');
  let capturedWhere = null;
  const controller = loadController({
    findAll: async ({ where }) => { capturedWhere = where; return []; }
  });
  const req = { query: { startDate: '2024-01-01' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.ok(capturedWhere.timestamp[Op.gte] instanceof Date);
});

test('TelemetryController.getAll: applies endDate-only filter and limit', async () => {
  const { Op } = require('sequelize');
  let capturedLimit = null;
  let capturedWhere = null;
  const controller = loadController({
    findAll: async ({ where, limit }) => { capturedWhere = where; capturedLimit = limit; return []; }
  });
  const req = { query: { endDate: '2024-01-02', limit: '10' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.ok(capturedWhere.timestamp[Op.lte] instanceof Date);
  assert.equal(capturedLimit, 10);
});

test('TelemetryController.getAll: passes error to next on db failure', async () => {
  const controller = loadController({ findAll: async () => { throw new Error('DB error'); } });
  const req = { query: {} };
  const res = makeRes();
  let nextError = null;
  await controller.getAll(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('TelemetryController.getLatest: returns latest telemetry for drone', async () => {
  const fakeEntry = { telemetryId: 99, droneId: 3, altitude: 100 };
  const controller = loadController({ findOne: async () => fakeEntry });
  const req = { params: { droneId: '3' } };
  const res = makeRes();
  await controller.getLatest(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeEntry);
});

test('TelemetryController.getLatest: returns 404 when no data found', async () => {
  const controller = loadController({ findOne: async () => null });
  const req = { params: { droneId: '99' } };
  const res = makeRes();
  await controller.getLatest(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'No telemetry data found');
});

test('TelemetryController.getLatest: passes error to next on db failure', async () => {
  const controller = loadController({ findOne: async () => { throw new Error('DB'); } });
  const req = { params: { droneId: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.getLatest(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('TelemetryController.create: creates telemetry record and returns 201', async () => {
  const newRecord = { telemetryId: 50, droneId: 1, altitude: 75 };
  const controller = loadController({ create: async () => newRecord });
  const req = { body: { droneId: 1, altitude: 75 } };
  const res = makeRes();
  await controller.create(req, res, () => {});
  assert.equal(res._status, 201);
  assert.deepEqual(res._body, newRecord);
});

test('TelemetryController.create: sets timestamp automatically when not provided', async () => {
  let createdData = null;
  const controller = loadController({
    create: async (data) => { createdData = data; return data; }
  });
  const req = { body: { droneId: 1, altitude: 50 } };
  const res = makeRes();
  await controller.create(req, res, () => {});
  assert.ok(createdData.timestamp instanceof Date);
});

test('TelemetryController.create: passes error to next on db failure', async () => {
  const controller = loadController({ create: async () => { throw new Error('DB'); } });
  const req = { body: { droneId: 1 } };
  const res = makeRes();
  let nextError = null;
  await controller.create(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('TelemetryController.getStats: returns aggregated statistics', async () => {
  const fakeStats = { avgBattery: '85.5', maxAltitude: '120', count: '10' };
  const controller = loadController({ findAll: async () => [fakeStats] });
  const req = { query: {} };
  const res = makeRes();
  await controller.getStats(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeStats);
});

test('TelemetryController.getStats: returns empty object when no data', async () => {
  const controller = loadController({ findAll: async () => [] });
  const req = { query: {} };
  const res = makeRes();
  await controller.getStats(req, res, () => {});
  assert.deepEqual(res._body, {});
});

test('TelemetryController.getStats: applies droneId/flightId filters', async () => {
  let capturedWhere = null;
  const controller = loadController({
    findAll: async ({ where }) => { capturedWhere = where; return [{}]; }
  });
  const req = { query: { droneId: '1', flightId: '2' } };
  const res = makeRes();
  await controller.getStats(req, res, () => {});
  assert.deepEqual(capturedWhere, { droneId: '1', flightId: '2' });
});

test('TelemetryController.getStats: passes error to next on db failure', async () => {
  const controller = loadController({ findAll: async () => { throw new Error('DB'); } });
  const req = { query: {} };
  const res = makeRes();
  let nextError = null;
  await controller.getStats(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});
