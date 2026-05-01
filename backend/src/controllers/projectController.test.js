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
  const ctrlPath = require.resolve('./projectController');
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
  const controller = require('./projectController');

  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return controller;
}

test('ProjectController.getAll: returns list of projects', async () => {
  const fakeProjects = [{ projectId: 1, projectName: 'Alpha' }];
  const controller = loadController({
    Project: { findAll: async () => fakeProjects },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body.items, fakeProjects);
});

test('ProjectController.getAll: applies status/clientId/search filters', async () => {
  const { Op } = require('sequelize');
  let capturedWhere = null;
  const controller = loadController({
    Project: { findAll: async ({ where }) => { capturedWhere = where; return []; } },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { query: { status: 'active', clientId: '3', search: 'alpha' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(capturedWhere.status, 'active');
  assert.equal(capturedWhere.clientId, '3');
  assert.ok(capturedWhere[Op.or]);
});

test('ProjectController.getAll: passes error to next on db failure', async () => {
  const controller = loadController({
    Project: { findAll: async () => { throw new Error('DB error'); } },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { query: {} };
  const res = makeRes();
  let nextError = null;
  await controller.getAll(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ProjectController.getById: returns project when found', async () => {
  const fakeProject = { projectId: 1, projectName: 'Alpha' };
  const controller = loadController({
    Project: { findByPk: async () => fakeProject },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeProject);
});

test('ProjectController.getById: returns 404 when project not found', async () => {
  const controller = loadController({
    Project: { findByPk: async () => null },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Project not found');
});

test('ProjectController.getById: passes error to next on db failure', async () => {
  const controller = loadController({
    Project: { findByPk: async () => { throw new Error('DB'); } },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.getById(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ProjectController.create: creates project and returns 201', async () => {
  const created = { projectId: 7, projectName: 'Beta' };
  let findByPkCount = 0;
  const controller = loadController({
    Project: {
      create: async () => ({ projectId: 7 }),
      findByPk: async () => { findByPkCount++; return created; }
    },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { body: { projectName: 'Beta' }, user: { userId: 1 } };
  const res = makeRes();
  await controller.create(req, res, () => {});
  assert.equal(res._status, 201);
  assert.deepEqual(res._body, created);
});

test('ProjectController.create: passes error to next on db failure', async () => {
  const controller = loadController({
    Project: { create: async () => { throw new Error('DB'); } },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { body: {}, user: { userId: 1 } };
  const res = makeRes();
  let nextError = null;
  await controller.create(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ProjectController.create: includes created_by from req.user', async () => {
  let capturedData = null;
  const controller = loadController({
    Project: {
      create: async (data) => { capturedData = data; return { projectId: 1 }; },
      findByPk: async () => ({ projectId: 1 })
    },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { body: { projectName: 'Test' }, user: { userId: 42 } };
  const res = makeRes();
  await controller.create(req, res, () => {});
  assert.equal(capturedData.created_by, 42);
});

test('ProjectController.update: updates project and returns it', async () => {
  const fakeProject = { projectId: 1, projectName: 'Old', update: async () => {} };
  const updated = { projectId: 1, projectName: 'New' };
  let findByPkCount = 0;
  const controller = loadController({
    Project: {
      findByPk: async () => {
        findByPkCount++;
        return findByPkCount === 1 ? fakeProject : updated;
      }
    },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '1' }, body: { projectName: 'New' } };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 200);
});

test('ProjectController.update: returns 404 when project not found', async () => {
  const controller = loadController({
    Project: { findByPk: async () => null },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '999' }, body: {} };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Project not found');
});

test('ProjectController.update: passes error to next on db failure', async () => {
  const controller = loadController({
    Project: { findByPk: async () => { throw new Error('DB'); } },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '1' }, body: {} };
  const res = makeRes();
  let nextError = null;
  await controller.update(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ProjectController.delete: deletes project and returns 204', async () => {
  const fakeProject = { projectId: 1, destroy: async () => {} };
  const controller = loadController({
    Project: { findByPk: async () => fakeProject },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 204);
});

test('ProjectController.delete: returns 404 when project not found', async () => {
  const controller = loadController({
    Project: { findByPk: async () => null },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Project not found');
});

test('ProjectController.delete: passes error to next on db failure', async () => {
  const controller = loadController({
    Project: { findByPk: async () => { throw new Error('DB'); } },
    Client: {},
    User: {},
    Show: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.delete(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});
