const test = require('node:test');
const assert = require('node:assert/strict');

function makeRes() {
  const res = {};
  res._status = 200;
  res._body = null;
  res.status = (code) => { res._status = code; return res; };
  res.json = function (body) { res._body = body; return res; };
  return res;
}

function loadAuditMiddleware(auditLogCreate) {
  const auditPath = require.resolve('./audit');
  const modelsPath = require.resolve('../models');
  const origModels = require.cache[modelsPath];

  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
      AuditLog: { create: auditLogCreate || (async () => {}) }
    }
  };

  delete require.cache[auditPath];
  const { auditLog } = require('./audit');

  if (origModels) require.cache[modelsPath] = origModels;
  else delete require.cache[modelsPath];

  return auditLog;
}

test('auditLog middleware: calls next immediately', async () => {
  const auditLog = loadAuditMiddleware();
  const middleware = auditLog('CREATE', 'Drone');
  const req = { method: 'POST', path: '/drones', params: {}, body: {}, ip: '127.0.0.1', get: () => 'test-agent' };
  const res = makeRes();
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
});

test('auditLog middleware: wraps res.json and still returns original result', async () => {
  const auditLog = loadAuditMiddleware();
  const middleware = auditLog('UPDATE', 'Drone');
  const req = { method: 'PUT', path: '/drones/1', params: { id: '1' }, body: { model: 'X' }, ip: '127.0.0.1', get: () => '' };
  const res = makeRes();
  middleware(req, res, () => {});
  const returnVal = res.json({ droneId: 1 });
  assert.equal(res._body.droneId, 1);
  assert.ok(returnVal !== undefined);
});

test('auditLog middleware: records entity id from req.params.id', async () => {
  const creates = [];
  const auditLog = loadAuditMiddleware(async (data) => creates.push(data));
  const middleware = auditLog('DELETE', 'Drone');
  const req = { method: 'DELETE', path: '/drones/5', params: { id: '5' }, body: {}, ip: '10.0.0.1', get: () => 'ua' };
  const res = makeRes();
  middleware(req, res, () => {});
  res.json({});
  // Wait for setImmediate to fire
  await new Promise((r) => setImmediate(r));
  assert.equal(creates.length, 1);
  assert.equal(creates[0].entityId, '5');
  assert.equal(creates[0].action, 'DELETE');
  assert.equal(creates[0].entityType, 'Drone');
});

test('auditLog middleware: swallows AuditLog.create errors', async () => {
  const originalError = console.error;
  const auditLog = loadAuditMiddleware(async () => {
    throw new Error('db down');
  });
  const middleware = auditLog('CREATE', 'Drone');
  const req = { method: 'POST', path: '/drones', params: {}, body: { id: 1 }, ip: '127.0.0.1', get: () => 'ua' };
  const res = makeRes();
  try {
    console.error = () => {};
    middleware(req, res, () => {});
    res.json({ ok: true });
    // Wait for setImmediate to fire (catch branch in middleware)
    await new Promise((r) => setImmediate(r));
    assert.equal(res._body.ok, true);
  } finally {
    console.error = originalError;
  }
});

test('auditLog middleware: uses defaults for action/entityId/ip and sets old/new values', async () => {
  const creates = [];
  const auditLog = loadAuditMiddleware(async (data) => creates.push(data));
  const middleware = auditLog(null, 'Client'); // action default branch
  const req = {
    method: 'PATCH',
    path: '/clients',
    params: {}, // entityId should come from body.id
    body: { id: 'abc', companyName: 'X' },
    ip: '', // force fallback to connection.remoteAddress
    connection: { remoteAddress: '10.0.0.9' },
    get: () => undefined
  };
  const res = makeRes();
  middleware(req, res, () => {});
  res.json({ ok: true });
  await new Promise((r) => setImmediate(r));

  assert.equal(creates.length, 1);
  assert.equal(creates[0].action, 'PATCH /clients');
  assert.equal(creates[0].entityId, 'abc');
  assert.equal(creates[0].ipAddress, '10.0.0.9');
  assert.deepEqual(creates[0].oldValues, req.body);
  assert.deepEqual(creates[0].newValues, req.body);
});

test('auditLog middleware: GET request stores null old/new values', async () => {
  const creates = [];
  const auditLog = loadAuditMiddleware(async (data) => creates.push(data));
  const middleware = auditLog('READ', 'Client');
  const req = {
    method: 'GET',
    path: '/clients/1',
    params: { id: '1' },
    body: { id: 'should-not-use' },
    ip: '127.0.0.1',
    connection: { remoteAddress: 'x' },
    get: () => 'ua'
  };
  const res = makeRes();
  middleware(req, res, () => {});
  res.json({});
  await new Promise((r) => setImmediate(r));

  assert.equal(creates.length, 1);
  assert.equal(creates[0].oldValues, null);
  assert.equal(creates[0].newValues, null);
});
