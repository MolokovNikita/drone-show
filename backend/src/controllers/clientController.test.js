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

function loadController(clientModel) {
  const ctrlPath = require.resolve('./clientController');
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
    exports: { Client: clientModel }
  };

  delete require.cache[ctrlPath];
  const controller = require('./clientController');

  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return controller;
}

test('ClientController.getAll: returns list of clients', async () => {
  const fakeClients = [{ clientId: 1, companyName: 'Acme' }];
  const controller = loadController({ findAll: async () => fakeClients });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.deepEqual(res._body.items, fakeClients);
});

test('ClientController.getAll: applies search filter', async () => {
  const { Op } = require('sequelize');
  let capturedWhere = null;
  const controller = loadController({
    findAll: async ({ where }) => { capturedWhere = where; return []; }
  });
  const req = { query: { search: 'acme' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.ok(capturedWhere[Op.or]);
  assert.equal(capturedWhere[Op.or].length, 3);
});

test('ClientController.getAll: passes error to next on db failure', async () => {
  const controller = loadController({ findAll: async () => { throw new Error('DB down'); } });
  const req = { query: {} };
  const res = makeRes();
  let nextError = null;
  await controller.getAll(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ClientController.getById: returns client when found', async () => {
  const fakeClient = { clientId: 1, companyName: 'Acme' };
  const controller = loadController({ findByPk: async () => fakeClient });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeClient);
});

test('ClientController.getById: returns 404 when client not found', async () => {
  const controller = loadController({ findByPk: async () => null });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Client not found');
});

test('ClientController.getById: passes error to next on db failure', async () => {
  const controller = loadController({ findByPk: async () => { throw new Error('DB'); } });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.getById(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ClientController.create: creates client and returns 201', async () => {
  const newClient = { clientId: 5, companyName: 'NewCo' };
  const controller = loadController({ create: async () => newClient });
  const req = { body: { companyName: 'NewCo' } };
  const res = makeRes();
  await controller.create(req, res, () => {});
  assert.equal(res._status, 201);
  assert.deepEqual(res._body, newClient);
});

test('ClientController.create: passes error to next on db failure', async () => {
  const controller = loadController({ create: async () => { throw new Error('DB'); } });
  const req = { body: {} };
  const res = makeRes();
  let nextError = null;
  await controller.create(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ClientController.update: updates client and returns it', async () => {
  const fakeClient = {
    clientId: 1,
    companyName: 'Acme',
    update: async function(data) { Object.assign(this, data); }
  };
  const controller = loadController({ findByPk: async () => fakeClient });
  const req = { params: { id: '1' }, body: { companyName: 'Acme Updated' } };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 200);
  assert.equal(res._body.companyName, 'Acme Updated');
});

test('ClientController.update: returns 404 when client not found', async () => {
  const controller = loadController({ findByPk: async () => null });
  const req = { params: { id: '999' }, body: {} };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Client not found');
});

test('ClientController.update: passes error to next on db failure', async () => {
  const controller = loadController({ findByPk: async () => { throw new Error('DB'); } });
  const req = { params: { id: '1' }, body: {} };
  const res = makeRes();
  let nextError = null;
  await controller.update(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ClientController.delete: deletes client and returns 204', async () => {
  const fakeClient = { clientId: 1, destroy: async () => {} };
  const controller = loadController({ findByPk: async () => fakeClient });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 204);
});

test('ClientController.delete: returns 404 when client not found', async () => {
  const controller = loadController({ findByPk: async () => null });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Client not found');
});

test('ClientController.delete: passes error to next on db failure', async () => {
  const controller = loadController({ findByPk: async () => { throw new Error('DB'); } });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.delete(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});
