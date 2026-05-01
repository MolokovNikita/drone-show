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

function loadFreshAuth({ jwtVerifyResult, userFindResult } = {}) {
  const authPath = require.resolve('./auth');
  const jwtPath = require.resolve('jsonwebtoken');
  const configPath = require.resolve('../config/config');
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');

  const origJwt = require.cache[jwtPath];
  const origConfig = require.cache[configPath];
  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];

  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {}, info: () => {} }
  };
  require.cache[configPath] = {
    id: configPath, filename: configPath, loaded: true,
    exports: { jwt: { secret: 'test-secret' } }
  };
  require.cache[jwtPath] = {
    id: jwtPath, filename: jwtPath, loaded: true,
    exports: {
      verify: (_token, _secret) => {
        if (jwtVerifyResult instanceof Error) throw jwtVerifyResult;
        return jwtVerifyResult || { userId: 1 };
      }
    }
  };
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
      User: {
        findByPk: async () => userFindResult
      },
      Role: {}
    }
  };

  delete require.cache[authPath];
  const auth = require('./auth');

  if (origJwt) require.cache[jwtPath] = origJwt; else delete require.cache[jwtPath];
  if (origConfig) require.cache[configPath] = origConfig; else delete require.cache[configPath];
  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return auth;
}

test('authenticate: returns 401 when no Authorization header', async () => {
  const { authenticate } = loadFreshAuth();
  const req = { headers: {} };
  const res = makeRes();
  await authenticate(req, res, () => {});
  assert.equal(res._status, 401);
  assert.equal(res._body.error, 'Authentication required');
});

test('authenticate: returns 401 when token verification throws', async () => {
  const { authenticate } = loadFreshAuth({ jwtVerifyResult: new Error('bad token') });
  const req = { headers: { authorization: 'Bearer badtoken' } };
  const res = makeRes();
  await authenticate(req, res, () => {});
  assert.equal(res._status, 401);
  assert.equal(res._body.error, 'Invalid token');
});

test('authenticate: returns 401 when user not found', async () => {
  const { authenticate } = loadFreshAuth({ jwtVerifyResult: { userId: 99 }, userFindResult: null });
  const req = { headers: { authorization: 'Bearer validtoken' } };
  const res = makeRes();
  await authenticate(req, res, () => {});
  assert.equal(res._status, 401);
  assert.equal(res._body.error, 'Invalid or inactive user');
});

test('authenticate: returns 401 when user is inactive', async () => {
  const { authenticate } = loadFreshAuth({
    jwtVerifyResult: { userId: 1 },
    userFindResult: { userId: 1, isActive: false }
  });
  const req = { headers: { authorization: 'Bearer validtoken' } };
  const res = makeRes();
  await authenticate(req, res, () => {});
  assert.equal(res._status, 401);
  assert.equal(res._body.error, 'Invalid or inactive user');
});

test('authenticate: sets req.user and calls next when token is valid', async () => {
  const fakeUser = { userId: 1, isActive: true, role: { roleName: 'admin' } };
  const { authenticate } = loadFreshAuth({
    jwtVerifyResult: { userId: 1 },
    userFindResult: fakeUser
  });
  const req = { headers: { authorization: 'Bearer validtoken' } };
  const res = makeRes();
  let nextCalled = false;
  await authenticate(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
  assert.deepEqual(req.user, fakeUser);
});

test('authorize: returns 401 when req.user is missing', async () => {
  const { authorize } = loadFreshAuth();
  const middleware = authorize('admin');
  const req = {};
  const res = makeRes();
  await middleware(req, res, () => {});
  assert.equal(res._status, 401);
  assert.equal(res._body.error, 'Authentication required');
});

test('authorize: returns 403 when user role is not in allowed list', async () => {
  const { authorize } = loadFreshAuth();
  const middleware = authorize('admin');
  const req = { user: { role: { roleName: 'operator' } } };
  const res = makeRes();
  await middleware(req, res, () => {});
  assert.equal(res._status, 403);
  assert.equal(res._body.error, 'Insufficient permissions');
});

test('authorize: calls next when user role is allowed', async () => {
  const { authorize } = loadFreshAuth();
  const middleware = authorize('admin', 'manager');
  const req = { user: { role: { roleName: 'admin' } } };
  const res = makeRes();
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  assert.ok(nextCalled);
});
