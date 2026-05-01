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
  const ctrlPath = require.resolve('./choreographyController');
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');

  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];

  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {}, info: () => {} }
  };
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: modelsMock
  };

  delete require.cache[ctrlPath];
  const controller = require('./choreographyController');

  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return controller;
}

const baseModels = { Show: {}, User: {}, Drone: {}, FlightPath: {}, Formation: {}, LightingSequence: {} };

test('ChoreographyController.getAll: returns list of choreographies', async () => {
  const fakeList = [{ choreographyId: 1, choreographyName: 'Scene 1' }];
  const controller = loadController({
    ...baseModels,
    Choreography: { findAll: async () => fakeList }
  });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res);
  assert.equal(res._status, 200);
  assert.deepEqual(res._body.items, fakeList);
});

test('ChoreographyController.getAll: filters by showId', async () => {
  let capturedWhere = null;
  const controller = loadController({
    ...baseModels,
    Choreography: { findAll: async ({ where }) => { capturedWhere = where; return []; } }
  });
  const req = { query: { showId: '3' } };
  const res = makeRes();
  await controller.getAll(req, res);
  assert.equal(capturedWhere.showId, 3);
});

test('ChoreographyController.getAll: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { findAll: async () => { throw new Error('DB error'); } }
  });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res);
  assert.equal(res._status, 500);
});

test('ChoreographyController.getById: returns choreography when found', async () => {
  const fakeChoreo = { choreographyId: 1, choreographyName: 'Scene 1' };
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => fakeChoreo }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res);
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeChoreo);
});

test('ChoreographyController.getById: returns 404 when not found', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => null }
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.getById(req, res);
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Choreography not found');
});

test('ChoreographyController.getById: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => { throw new Error('DB'); } }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to fetch choreography');
});

test('ChoreographyController.create: creates choreography and returns 201', async () => {
  const created = { choreographyId: 5, choreographyName: 'New Scene' };
  let findByPkCount = 0;
  const controller = loadController({
    ...baseModels,
    Choreography: {
      create: async () => ({ choreographyId: 5 }),
      findByPk: async () => { findByPkCount++; return created; }
    }
  });
  const req = {
    body: { showId: 1, choreographyName: 'New Scene', durationSeconds: 120 },
    user: { userId: 1 }
  };
  const res = makeRes();
  await controller.create(req, res);
  assert.equal(res._status, 201);
  assert.deepEqual(res._body, created);
});

test('ChoreographyController.create: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { create: async () => { throw new Error('DB'); } }
  });
  const req = { body: { showId: 1, choreographyName: 'X' }, user: { userId: 1 } };
  const res = makeRes();
  await controller.create(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to create choreography');
});

test('ChoreographyController.update: updates choreography and returns it', async () => {
  const fakeChoreo = {
    choreographyId: 1,
    choreographyName: 'Old',
    update: async () => {}
  };
  const updated = { choreographyId: 1, choreographyName: 'New' };
  let findByPkCount = 0;
  const controller = loadController({
    ...baseModels,
    Choreography: {
      findByPk: async () => {
        findByPkCount++;
        return findByPkCount === 1 ? fakeChoreo : updated;
      }
    }
  });
  const req = { params: { id: '1' }, body: { choreographyName: 'New' } };
  const res = makeRes();
  await controller.update(req, res);
  assert.equal(res._status, 200);
});

test('ChoreographyController.update: returns 404 when not found', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => null }
  });
  const req = { params: { id: '999' }, body: {} };
  const res = makeRes();
  await controller.update(req, res);
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Choreography not found');
});

test('ChoreographyController.update: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => { throw new Error('DB'); } }
  });
  const req = { params: { id: '1' }, body: {} };
  const res = makeRes();
  await controller.update(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to update choreography');
});

test('ChoreographyController.delete: deletes choreography and returns success message', async () => {
  const fakeChoreo = { choreographyId: 1, destroy: async () => {} };
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => fakeChoreo }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res);
  assert.equal(res._status, 200);
  assert.ok(res._body.message);
});

test('ChoreographyController.delete: returns 404 when not found', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => null }
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.delete(req, res);
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Choreography not found');
});

test('ChoreographyController.delete: returns 500 on db error', async () => {
  const controller = loadController({
    ...baseModels,
    Choreography: { findByPk: async () => { throw new Error('DB'); } }
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res);
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Failed to delete choreography');
});
