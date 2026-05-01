const test = require('node:test');
const assert = require('node:assert/strict');

function makeRes() {
  const res = {};
  res._status = 200;
  res._body = null;
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  res.send = () => res;
  return res;
}

function loadController(modelsMock) {
  const ctrlPath = require.resolve('./droneController');
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');
  const seqPath = require.resolve('sequelize');

  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];
  const origSeq = require.cache[seqPath];

  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {}, info: () => {} }
  };
  // Provide a minimal Op stub so the controller can use { Op } without crashing
  if (!origSeq) {
    require.cache[seqPath] = {
      id: seqPath, filename: seqPath, loaded: true,
      exports: require('sequelize')
    };
  }
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: modelsMock
  };

  delete require.cache[ctrlPath];
  const controller = require('./droneController');

  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return controller;
}

test('DroneController.getAll: returns list of drones', async () => {
  const fakeDrones = [{ droneId: 1, serialNumber: 'SN001' }];
  const controller = loadController({
    Drone: { findAll: async () => fakeDrones },
    Battery: {},
    LEDModule: {}
  });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body.items, fakeDrones);
});

test('DroneController.getAll: applies status and search filters', async () => {
  const { Op } = require('sequelize');
  let capturedWhere = null;
  const controller = loadController({
    Drone: {
      findAll: async ({ where }) => { capturedWhere = where; return []; }
    },
    Battery: {},
    LEDModule: {}
  });
  const req = { query: { status: 'active', search: 'SN' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(capturedWhere.status, 'active');
  assert.ok(capturedWhere[Op.or]);
  assert.equal(capturedWhere[Op.or].length, 2);
});

test('DroneController.getAll: passes error to next on db failure', async () => {
  const controller = loadController({
    Drone: { findAll: async () => { throw new Error('DB error'); } },
    Battery: {},
    LEDModule: {}
  });
  const req = { query: {} };
  const res = makeRes();
  let nextError = null;
  await controller.getAll(req, res, (err) => { nextError = err; });
  assert.ok(nextError instanceof Error);
});

test('DroneController.getById: returns drone when found', async () => {
  const fakeDrone = { droneId: 1, serialNumber: 'SN001' };
  const controller = loadController({
    Drone: { findByPk: async () => fakeDrone },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeDrone);
});

test('DroneController.getById: returns 404 when drone not found', async () => {
  const controller = loadController({
    Drone: { findByPk: async () => null },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Drone not found');
});

test('DroneController.getById: passes error to next on db failure', async () => {
  const controller = loadController({
    Drone: { findByPk: async () => { throw new Error('DB'); } },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.getById(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('DroneController.create: creates drone and returns 201', async () => {
  const created = { droneId: 10, serialNumber: 'NEW001' };
  const controller = loadController({
    Drone: {
      create: async () => ({ droneId: 10 }),
      findByPk: async () => created
    },
    Battery: {},
    LEDModule: {}
  });
  const req = { body: { serialNumber: 'NEW001', model: 'X1' } };
  const res = makeRes();
  await controller.create(req, res, () => {});
  assert.equal(res._status, 201);
  assert.deepEqual(res._body, created);
});

test('DroneController.create: passes error to next on db failure', async () => {
  const controller = loadController({
    Drone: { create: async () => { throw new Error('DB'); } },
    Battery: {},
    LEDModule: {}
  });
  const req = { body: {} };
  const res = makeRes();
  let nextError = null;
  await controller.create(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('DroneController.update: updates and returns drone', async () => {
  const updated = { droneId: 1, serialNumber: 'SN001', model: 'X2' };
  const fakeDrone = {
    droneId: 1,
    update: async () => {},
  };
  const controller = loadController({
    Drone: {
      findByPk: async (id) => {
        if (id === 1 || id === '1') return fakeDrone;
        return updated;
      }
    },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '1' }, body: { model: 'X2' } };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 200);
});

test('DroneController.update: returns 404 when drone not found', async () => {
  const controller = loadController({
    Drone: { findByPk: async () => null },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '999' }, body: {} };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Drone not found');
});

test('DroneController.update: passes error to next on db failure', async () => {
  const controller = loadController({
    Drone: { findByPk: async () => { throw new Error('DB'); } },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '1' }, body: {} };
  const res = makeRes();
  let nextError = null;
  await controller.update(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('DroneController.delete: deletes drone and returns 204', async () => {
  const fakeDrone = { droneId: 1, destroy: async () => {} };
  const controller = loadController({
    Drone: { findByPk: async () => fakeDrone },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 204);
});

test('DroneController.delete: returns 404 when drone not found', async () => {
  const controller = loadController({
    Drone: { findByPk: async () => null },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Drone not found');
});

test('DroneController.delete: passes error to next on db failure', async () => {
  const controller = loadController({
    Drone: { findByPk: async () => { throw new Error('DB'); } },
    Battery: {},
    LEDModule: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.delete(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});
