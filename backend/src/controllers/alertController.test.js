const test = require('node:test');
const assert = require('node:assert/strict');

function makeRes() {
  // Упрощённый мок объекта res (Express):
  // сохраняем status и body, чтобы потом проверять их в assert-ах.
  const res = {};
  res._status = 200;
  res._body = null;
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

function loadController(modelsMock) {
  // Подгружаем контроллер так, чтобы он использовал подставные модели (modelsMock),
  // а не реальные Sequelize модели/БД. Это делает тесты именно unit-тестами.
  const ctrlPath = require.resolve('./alertController');
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');

  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];

  // Глушим логгер, чтобы тесты не спамили в консоль
  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {} }
  };
  // Подменяем ../models на наш мок
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: modelsMock
  };

  delete require.cache[ctrlPath];
  const controller = require('./alertController');

  // Возвращаем исходные зависимости обратно (изоляция тестов)
  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];

  return controller;
}

test('AlertController.getAll: returns list of alerts', async () => {
  // Проверяем happy-path: контроллер должен вернуть список алертов в res.json
  const fakeAlerts = [{ alertId: 1, severity: 'high', resolved: false }];
  const controller = loadController({
    SafetyAlert: { findAll: async () => fakeAlerts },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeAlerts);
});

test('AlertController.getAll: filters by resolved=true', async () => {
  // Проверяем, что query-параметр resolved преобразуется в boolean и попадает в where
  let capturedWhere = null;
  const controller = loadController({
    SafetyAlert: {
      findAll: async ({ where }) => { capturedWhere = where; return []; }
    },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { query: { resolved: 'true' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(capturedWhere.resolved, true);
});

test('AlertController.getAll: filters by severity/droneId/flightId', async () => {
  // Проверяем остальные фильтры: severity, droneId, flightId
  let capturedWhere = null;
  const controller = loadController({
    SafetyAlert: {
      findAll: async ({ where }) => { capturedWhere = where; return []; }
    },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { query: { severity: 'high', droneId: '10', flightId: '7' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.deepEqual(capturedWhere, { severity: 'high', droneId: '10', flightId: '7' });
});

test('AlertController.getAll: passes error to next on db failure', async () => {
  // Если модель бросает ошибку, контроллер должен пробросить её в next(error)
  const controller = loadController({
    SafetyAlert: { findAll: async () => { throw new Error('DB error'); } },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { query: {} };
  const res = makeRes();
  let nextError = null;
  await controller.getAll(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('AlertController.acknowledge: sets resolved=true and returns updated alert', async () => {
  // acknowledge:
  // 1) находим алерт
  // 2) обновляем resolved + resolutionTime
  // 3) повторно читаем алерт (с include) и отдаём его в res.json
  const updated = { alertId: 1, resolved: true, resolutionTime: new Date() };
  let updateCalled = false;
  const fakeAlert = {
    alertId: 1,
    update: async () => { updateCalled = true; }
  };
  let findByPkCall = 0;
  const controller = loadController({
    SafetyAlert: {
      findByPk: async () => {
        findByPkCall++;
        return findByPkCall === 1 ? fakeAlert : updated;
      }
    },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.acknowledge(req, res, () => {});
  assert.ok(updateCalled);
  assert.equal(res._status, 200);
  assert.equal(res._body.resolved, true);
});

test('AlertController.acknowledge: returns 404 when alert not found', async () => {
  // Если алерт не найден — возвращаем 404 и сообщение об ошибке
  const controller = loadController({
    SafetyAlert: { findByPk: async () => null },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.acknowledge(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Alert not found');
});

test('AlertController.acknowledge: passes error to next on db failure', async () => {
  // Ошибка чтения/обновления из БД должна попасть в next
  const controller = loadController({
    SafetyAlert: { findByPk: async () => { throw new Error('DB'); } },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.acknowledge(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('AlertController.resolve: resolves alert and returns it', async () => {
  // resolve похож на acknowledge, но возвращает тот же объект alert после update
  let updateData = null;
  const fakeAlert = {
    alertId: 2,
    resolved: false,
    update: async (data) => { updateData = data; Object.assign(fakeAlert, data); }
  };
  const controller = loadController({
    SafetyAlert: { findByPk: async () => fakeAlert },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { params: { id: '2' } };
  const res = makeRes();
  await controller.resolve(req, res, () => {});
  assert.equal(res._status, 200);
  assert.equal(updateData.resolved, true);
  assert.ok(updateData.resolutionTime instanceof Date);
});

test('AlertController.resolve: returns 404 when alert not found', async () => {
  // Если алерт не найден — 404
  const controller = loadController({
    SafetyAlert: { findByPk: async () => null },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.resolve(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Alert not found');
});

test('AlertController.resolve: passes error to next on db failure', async () => {
  // Если findByPk падает — пробрасываем в next(error)
  const controller = loadController({
    SafetyAlert: { findByPk: async () => { throw new Error('DB'); } },
    Drone: {},
    Flight: {},
    User: {}
  });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.resolve(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});
