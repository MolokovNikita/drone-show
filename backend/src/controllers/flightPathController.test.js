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

function loadController(modelsMock) {
  const ctrlPath = require.resolve('./flightPathController');
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
    exports: modelsMock
  };

  delete require.cache[ctrlPath];
  const controller = require('./flightPathController');

  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return controller;
}

const baseModels = { Choreography: {}, Drone: {} };

test('FlightPathController.getAll: returns list of flight paths', async () => {
  const fakePaths = [{ pathId: 1, choreographyId: 1 }];
  const controller = loadController({
    ...baseModels,
    FlightPath: { findAll: async () => fakePaths }
  });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res);
  assert.equal(res._status, 200);
  assert.deepEqual(res._body.items, fakePaths);
});

test('FlightPathController.getAll: filters by choreographyId', async () => {
  let capturedWhere = null;
  const controller = loadController({
    ...baseModels,
    FlightPath: { findAll: async ({ where }) => { capturedWhere = where; return []; } }
  });
  const req = { query: { choreographyId: '4' } };
  const res = makeRes();
  await controller.getAll(req, res);
  assert.equal(capturedWhere.choreographyId, 4);
});

test('FlightPathController.getAll: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { findAll: async () => { throw new Error('DB'); } }
  });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to fetch flight paths');
});

test('FlightPathController.getById: returns flight path when found', async () => {
  const fakePath = { pathId: 1, choreographyId: 1 };
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => fakePath }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res);
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakePath);
});

test('FlightPathController.getById: returns 404 when not found', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => null }
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.getById(req, res);
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Flight path not found');
});

test('FlightPathController.getById: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => { throw new Error('DB'); } }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to fetch flight path');
});

test('FlightPathController.create: creates flight path with parsed JSON fields', async () => {
  const created = { pathId: 10 };
  let findByPkCount = 0;
  const controller = loadController({
    ...baseModels,
    FlightPath: {
      create: async () => ({ pathId: 10 }),
      findByPk: async () => { findByPkCount++; return created; }
    }
  });
  const req = {
    body: {
      choreographyId: 1,
      droneId: 2,
      pathDataJson: '{"points":[]}',
      startPosition: '{"x":0,"y":0,"z":0}',
      endPosition: '{"x":10,"y":0,"z":5}',
      maxAltitude: 50
    }
  };
  const res = makeRes();
  await controller.create(req, res);
  assert.equal(res._status, 201);
  assert.deepEqual(res._body, created);
});

test('FlightPathController.create: returns 400 for invalid JSON in pathDataJson', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { create: async () => {} }
  });
  const req = {
    body: {
      choreographyId: 1,
      droneId: 2,
      pathDataJson: 'not-valid-json'
    }
  };
  const res = makeRes();
  await controller.create(req, res);
  assert.equal(res._status, 400);
  assert.equal(res._body.error, 'Invalid pathDataJson format');
});

test('FlightPathController.create: returns 400 for invalid JSON in startPosition', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { create: async () => {} }
  });
  const req = {
    body: {
      choreographyId: 1,
      droneId: 2,
      pathDataJson: '{}',
      startPosition: 'bad-json'
    }
  };
  const res = makeRes();
  await controller.create(req, res);
  assert.equal(res._status, 400);
  assert.equal(res._body.error, 'Invalid startPosition format');
});

test('FlightPathController.create: returns 400 for invalid JSON in endPosition', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { create: async () => {} }
  });
  const req = {
    body: {
      choreographyId: 1,
      droneId: 2,
      pathDataJson: '{}',
      startPosition: '{"x":0}',
      endPosition: 'bad-json'
    }
  };
  const res = makeRes();
  await controller.create(req, res);
  assert.equal(res._status, 400);
  assert.equal(res._body.error, 'Invalid endPosition format');
});

test('FlightPathController.create: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { create: async () => { throw new Error('DB'); } }
  });
  const req = { body: { choreographyId: 1, droneId: 1, pathDataJson: {}, startPosition: {}, endPosition: {} } };
  const res = makeRes();
  await controller.create(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to create flight path');
  assert.ok(res._body.details);
});

test('FlightPathController.update: updates flight path and returns it', async () => {
  const fakePath = { pathId: 1, update: async () => {} };
  const updated = { pathId: 1, maxAltitude: 100 };
  let findByPkCount = 0;
  const controller = loadController({
    ...baseModels,
    FlightPath: {
      findByPk: async () => {
        findByPkCount++;
        return findByPkCount === 1 ? fakePath : updated;
      }
    }
  });
  const req = { params: { id: '1' }, body: { maxAltitude: 100 } };
  const res = makeRes();
  await controller.update(req, res);
  assert.equal(res._status, 200);
});

test('FlightPathController.update: parses JSON fields when provided as strings', async () => {
  let updatedWith = null;
  const fakePath = { pathId: 1, update: async (data) => { updatedWith = data; } };
  const updated = { pathId: 1 };
  let findByPkCount = 0;
  const controller = loadController({
    ...baseModels,
    FlightPath: {
      findByPk: async () => {
        findByPkCount++;
        return findByPkCount === 1 ? fakePath : updated;
      }
    }
  });
  const req = {
    params: { id: '1' },
    body: {
      pathDataJson: '{"points":[1]}',
      startPosition: '{"x":0,"y":0,"z":0}',
      endPosition: '{"x":1,"y":1,"z":1}',
      collisionCheckStatus: 'ok'
    }
  };
  const res = makeRes();
  await controller.update(req, res);
  assert.equal(res._status, 200);
  assert.deepEqual(updatedWith.pathDataJson, { points: [1] });
});

test('FlightPathController.update: returns 500 when JSON.parse throws', async () => {
  const fakePath = { pathId: 1, update: async () => {} };
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => fakePath }
  });
  const req = { params: { id: '1' }, body: { pathDataJson: 'not-json' } };
  const res = makeRes();
  await controller.update(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to update flight path');
});

test('FlightPathController.update: returns 404 when not found', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => null }
  });
  const req = { params: { id: '999' }, body: {} };
  const res = makeRes();
  await controller.update(req, res);
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Flight path not found');
});

test('FlightPathController.delete: deletes flight path and returns success', async () => {
  const fakePath = { pathId: 1, destroy: async () => {} };
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => fakePath }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res);
  assert.equal(res._status, 200);
  assert.ok(res._body.message);
});

test('FlightPathController.delete: returns 404 when not found', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => null }
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.delete(req, res);
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Flight path not found');
});

test('FlightPathController.delete: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { findByPk: async () => { throw new Error('DB'); } }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to delete flight path');
});

test('FlightPathController.bulkUpdate: replaces all flight paths for a choreography', async () => {
  const createdPaths = [{ pathId: 1 }, { pathId: 2 }];
  let destroyCalled = false;
  const controller = loadController({
    ...baseModels,
    FlightPath: {
      destroy: async () => { destroyCalled = true; },
      create: async (data) => data,
      findAll: async () => createdPaths
    }
  });
  const req = {
    body: {
      choreographyId: 1,
      flightPaths: [
        { droneId: 1, pathDataJson: {}, startPosition: {}, endPosition: {}, maxAltitude: 30 },
        { droneId: 2, pathDataJson: {}, startPosition: {}, endPosition: {}, maxAltitude: 40 }
      ]
    }
  };
  const res = makeRes();
  await controller.bulkUpdate(req, res);
  assert.ok(destroyCalled);
  assert.equal(res._status, 200);
  assert.deepEqual(res._body.items, createdPaths);
});

test('FlightPathController.bulkUpdate: parses JSON strings and applies default collisionCheckStatus', async () => {
  const created = [];
  const controller = loadController({
    ...baseModels,
    FlightPath: {
      destroy: async () => {},
      create: async (data) => { created.push(data); return data; },
      findAll: async () => []
    }
  });
  const req = {
    body: {
      choreographyId: 1,
      flightPaths: [
        { droneId: 1, pathDataJson: '{"p":[]}', startPosition: '{"x":0}', endPosition: '{"x":1}', maxAltitude: 10 }
      ]
    }
  };
  const res = makeRes();
  await controller.bulkUpdate(req, res);
  assert.equal(created[0].collisionCheckStatus, 'pending');
  assert.deepEqual(created[0].pathDataJson, { p: [] });
});

test('FlightPathController.bulkUpdate: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    FlightPath: { destroy: async () => { throw new Error('DB'); } }
  });
  const req = { body: { choreographyId: 1, flightPaths: [] } };
  const res = makeRes();
  await controller.bulkUpdate(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to bulk update flight paths');
});
