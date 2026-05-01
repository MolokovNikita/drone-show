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

function loadController({ validationErrors = [], authService = {}, userFindResult = null } = {}) {
  const ctrlPath = require.resolve('./authController');
  const validatorPath = require.resolve('express-validator');
  const servicePath = require.resolve('../services/authService');
  const loggerPath = require.resolve('../utils/logger');
  const modelsPath = require.resolve('../models');

  const origValidator = require.cache[validatorPath];
  const origService = require.cache[servicePath];
  const origLogger = require.cache[loggerPath];
  const origModels = require.cache[modelsPath];

  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {}, info: () => {} }
  };
  require.cache[validatorPath] = {
    id: validatorPath, filename: validatorPath, loaded: true,
    exports: {
      validationResult: () => ({
        isEmpty: () => validationErrors.length === 0,
        array: () => validationErrors
      })
    }
  };
  require.cache[servicePath] = {
    id: servicePath, filename: servicePath, loaded: true,
    exports: authService
  };
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
      User: { findByPk: async () => userFindResult },
      Role: {}
    }
  };

  delete require.cache[ctrlPath];
  const controller = require('./authController');

  if (origValidator) require.cache[validatorPath] = origValidator; else delete require.cache[validatorPath];
  if (origService) require.cache[servicePath] = origService; else delete require.cache[servicePath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];
  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];

  return controller;
}

test('AuthController.register: returns 400 when validation fails', async () => {
  const controller = loadController({ validationErrors: [{ msg: 'Required' }] });
  const req = { body: {} };
  const res = makeRes();
  await controller.register(req, res, () => {});
  assert.equal(res._status, 400);
  assert.equal(res._body.error, 'Validation failed');
});

test('AuthController.register: returns 201 on successful registration', async () => {
  const controller = loadController({
    authService: { register: async () => ({ user: { userId: 1 }, tokens: {} }) }
  });
  const req = { body: { username: 'alice', password: 'pw' } };
  const res = makeRes();
  await controller.register(req, res, () => {});
  assert.equal(res._status, 201);
  assert.ok(res._body.user);
});

test('AuthController.register: returns 400 when service throws', async () => {
  const controller = loadController({
    authService: { register: async () => { throw new Error('Username taken'); } }
  });
  const req = { body: { username: 'alice', password: 'pw' } };
  const res = makeRes();
  await controller.register(req, res, () => {});
  assert.equal(res._status, 400);
  assert.equal(res._body.error, 'Username taken');
});

test('AuthController.login: returns 400 when validation fails', async () => {
  const controller = loadController({ validationErrors: [{ msg: 'Required' }] });
  const req = { body: {} };
  const res = makeRes();
  await controller.login(req, res, () => {});
  assert.equal(res._status, 400);
  assert.equal(res._body.error, 'Validation failed');
});

test('AuthController.login: returns 200 with user and tokens on success', async () => {
  const controller = loadController({
    authService: {
      login: async () => ({
        user: { userId: 1, username: 'alice' },
        tokens: { accessToken: 'at', refreshToken: 'rt' }
      })
    }
  });
  const req = { body: { username: 'alice', password: 'pw' } };
  const res = makeRes();
  await controller.login(req, res, () => {});
  assert.equal(res._status, 200);
  assert.equal(res._body.user.username, 'alice');
  assert.ok(res._body.tokens.accessToken);
});

test('AuthController.login: returns 401 when service throws', async () => {
  const controller = loadController({
    authService: { login: async () => { throw new Error('Invalid credentials'); } }
  });
  const req = { body: { username: 'x', password: 'y' } };
  const res = makeRes();
  await controller.login(req, res, () => {});
  assert.equal(res._status, 401);
  assert.equal(res._body.error, 'Invalid credentials');
});

test('AuthController.refreshToken: returns 400 when no token provided', async () => {
  const controller = loadController();
  const req = { body: {} };
  const res = makeRes();
  await controller.refreshToken(req, res, () => {});
  assert.equal(res._status, 400);
  assert.equal(res._body.error, 'Refresh token required');
});

test('AuthController.refreshToken: returns new tokens on success', async () => {
  const controller = loadController({
    authService: { refreshToken: async () => ({ accessToken: 'new-at', refreshToken: 'new-rt' }) }
  });
  const req = { body: { refreshToken: 'valid-rt' } };
  const res = makeRes();
  await controller.refreshToken(req, res, () => {});
  assert.equal(res._status, 200);
  assert.equal(res._body.accessToken, 'new-at');
});

test('AuthController.refreshToken: returns 401 when service throws', async () => {
  const controller = loadController({
    authService: { refreshToken: async () => { throw new Error('Token expired'); } }
  });
  const req = { body: { refreshToken: 'expired' } };
  const res = makeRes();
  await controller.refreshToken(req, res, () => {});
  assert.equal(res._status, 401);
  assert.equal(res._body.error, 'Token expired');
});

test('AuthController.getProfile: returns user profile', async () => {
  const fakeUser = { userId: 1, username: 'alice', role: { roleName: 'admin' } };
  // getProfile calls require('../models') at runtime, so the mock must stay active during the call
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');
  const validatorPath = require.resolve('express-validator');
  const servicePath = require.resolve('../services/authService');
  const ctrlPath = require.resolve('./authController');

  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];
  const origValidator = require.cache[validatorPath];
  const origService = require.cache[servicePath];

  try {
    require.cache[loggerPath] = { id: loggerPath, filename: loggerPath, loaded: true, exports: { error: () => {}, warn: () => {} } };
    require.cache[validatorPath] = { id: validatorPath, filename: validatorPath, loaded: true, exports: { validationResult: () => ({ isEmpty: () => true }) } };
    require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: {} };
    require.cache[modelsPath] = {
      id: modelsPath, filename: modelsPath, loaded: true,
      exports: { User: { findByPk: async () => fakeUser }, Role: {} }
    };

    delete require.cache[ctrlPath];
    const controller = require('./authController');

    const req = { user: { userId: 1 } };
    const res = makeRes();
    // Keep models mock active while the method runs
    await controller.getProfile(req, res, () => {});
    assert.equal(res._status, 200);
    assert.deepEqual(res._body.user, fakeUser);
  } finally {
    if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
    if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];
    if (origValidator) require.cache[validatorPath] = origValidator; else delete require.cache[validatorPath];
    if (origService) require.cache[servicePath] = origService; else delete require.cache[servicePath];
  }
});

test('AuthController.getProfile: passes error to next when db fails', async () => {
  const ctrlPath = require.resolve('./authController');
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');
  const validatorPath = require.resolve('express-validator');
  const servicePath = require.resolve('../services/authService');

  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];
  const origValidator = require.cache[validatorPath];
  const origService = require.cache[servicePath];

  require.cache[loggerPath] = { id: loggerPath, filename: loggerPath, loaded: true, exports: { error: () => {} } };
  require.cache[validatorPath] = { id: validatorPath, filename: validatorPath, loaded: true, exports: { validationResult: () => ({ isEmpty: () => true }) } };
  require.cache[servicePath] = { id: servicePath, filename: servicePath, loaded: true, exports: {} };
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: {
      User: { findByPk: async () => { throw new Error('DB error'); } },
      Role: {}
    }
  };

  try {
    delete require.cache[ctrlPath];
    const controller = require('./authController');
    const req = { user: { userId: 1 } };
    const res = makeRes();
    let nextError = null;
    await controller.getProfile(req, res, (err) => { nextError = err; });
    assert.ok(nextError instanceof Error);
    assert.equal(nextError.message, 'DB error');
  } finally {
    if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
    if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];
    if (origValidator) require.cache[validatorPath] = origValidator; else delete require.cache[validatorPath];
    if (origService) require.cache[servicePath] = origService; else delete require.cache[servicePath];
  }
});
