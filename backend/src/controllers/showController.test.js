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

function loadController({ showModel = {}, projectModel = {}, userModel = {}, aiServiceMock = {} } = {}) {
  const ctrlPath = require.resolve('./showController');
  const modelsPath = require.resolve('../models');
  const loggerPath = require.resolve('../utils/logger');
  const aiPath = require.resolve('../services/aiService');

  const origModels = require.cache[modelsPath];
  const origLogger = require.cache[loggerPath];
  const origAi = require.cache[aiPath];

  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {}, info: () => {} }
  };
  require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true,
    exports: { Show: showModel, Project: projectModel, User: userModel }
  };
  require.cache[aiPath] = {
    id: aiPath, filename: aiPath, loaded: true,
    exports: aiServiceMock
  };

  delete require.cache[ctrlPath];
  const controller = require('./showController');

  if (origModels) require.cache[modelsPath] = origModels; else delete require.cache[modelsPath];
  if (origLogger) require.cache[loggerPath] = origLogger; else delete require.cache[loggerPath];
  if (origAi) require.cache[aiPath] = origAi; else delete require.cache[aiPath];

  return controller;
}

test('ShowController.getAll: returns list of shows', async () => {
  const fakeShows = [{ showId: 1, showName: 'Night Sky' }];
  const controller = loadController({ showModel: { findAll: async () => fakeShows } });
  const req = { query: {} };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body.items, fakeShows);
});

test('ShowController.getAll: applies status/projectId/search filters', async () => {
  const { Op } = require('sequelize');
  let capturedWhere = null;
  const controller = loadController({
    showModel: { findAll: async ({ where }) => { capturedWhere = where; return []; } }
  });
  const req = { query: { status: 'scheduled', projectId: '2', search: 'park' } };
  const res = makeRes();
  await controller.getAll(req, res, () => {});
  assert.equal(capturedWhere.status, 'scheduled');
  assert.equal(capturedWhere.projectId, '2');
  assert.ok(capturedWhere[Op.or]);
});

test('ShowController.getAll: passes error to next on db failure', async () => {
  const controller = loadController({ showModel: { findAll: async () => { throw new Error('DB error'); } } });
  const req = { query: {} };
  const res = makeRes();
  let nextError = null;
  await controller.getAll(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ShowController.getById: returns show when found', async () => {
  const fakeShow = { showId: 1, showName: 'Night Sky' };
  const controller = loadController({ showModel: { findByPk: async () => fakeShow } });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 200);
  assert.deepEqual(res._body, fakeShow);
});

test('ShowController.getById: returns 404 when show not found', async () => {
  const controller = loadController({ showModel: { findByPk: async () => null } });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.getById(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Show not found');
});

test('ShowController.getById: passes error to next on db failure', async () => {
  const controller = loadController({ showModel: { findByPk: async () => { throw new Error('DB'); } } });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.getById(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ShowController.create: creates show and returns 201', async () => {
  const created = { showId: 10, showName: 'Fireworks' };
  let findByPkCallCount = 0;
  const controller = loadController({
    showModel: {
      create: async () => ({ showId: 10 }),
      findByPk: async () => { findByPkCallCount++; return created; }
    }
  });
  const req = { body: { showName: 'Fireworks' } };
  const res = makeRes();
  await controller.create(req, res, () => {});
  assert.equal(res._status, 201);
  assert.deepEqual(res._body, created);
});

test('ShowController.create: passes error to next on db failure', async () => {
  const controller = loadController({ showModel: { create: async () => { throw new Error('DB'); } } });
  const req = { body: {} };
  const res = makeRes();
  let nextError = null;
  await controller.create(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ShowController.update: updates show and returns it', async () => {
  const fakeShow = { showId: 1, showName: 'Old Name', update: async () => {} };
  const updatedShow = { showId: 1, showName: 'New Name' };
  let findByPkCallCount = 0;
  const controller = loadController({
    showModel: {
      findByPk: async () => {
        findByPkCallCount++;
        return findByPkCallCount === 1 ? fakeShow : updatedShow;
      }
    }
  });
  const req = { params: { id: '1' }, body: { showName: 'New Name' } };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 200);
});

test('ShowController.update: returns 404 when show not found', async () => {
  const controller = loadController({ showModel: { findByPk: async () => null } });
  const req = { params: { id: '999' }, body: {} };
  const res = makeRes();
  await controller.update(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Show not found');
});

test('ShowController.update: passes error to next on db failure', async () => {
  const controller = loadController({ showModel: { findByPk: async () => { throw new Error('DB'); } } });
  const req = { params: { id: '1' }, body: {} };
  const res = makeRes();
  let nextError = null;
  await controller.update(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ShowController.delete: deletes show and returns 204', async () => {
  const fakeShow = { showId: 1, destroy: async () => {} };
  const controller = loadController({ showModel: { findByPk: async () => fakeShow } });
  const req = { params: { id: '1' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 204);
});

test('ShowController.delete: returns 404 when show not found', async () => {
  const controller = loadController({ showModel: { findByPk: async () => null } });
  const req = { params: { id: '999' } };
  const res = makeRes();
  await controller.delete(req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Show not found');
});

test('ShowController.delete: passes error to next on db failure', async () => {
  const controller = loadController({ showModel: { findByPk: async () => { throw new Error('DB'); } } });
  const req = { params: { id: '1' } };
  const res = makeRes();
  let nextError = null;
  await controller.delete(req, res, (e) => { nextError = e; });
  assert.ok(nextError instanceof Error);
});

test('ShowController.generateWithAI: returns AI response without creating show when create=false', async () => {
  const aiResponse = {
    userView: { showName: 'AI Show', description: 'desc' },
    systemData: { choreographyIdeas: [{ droneCount: 10 }] }
  };
  const controller = loadController({
    aiServiceMock: { generateShow: async () => aiResponse }
  });
  const req = { body: { prompt: 'Make a great show', create: false } };
  const res = makeRes();
  const originalLog = console.log;
  console.log = () => {};
  try {
    await controller.generateWithAI(req, res, () => {});
  } finally {
    console.log = originalLog;
  }
  assert.equal(res._status, 200);
  assert.equal(res._body.show, null);
  assert.deepEqual(res._body.userView, aiResponse.userView);
  assert.deepEqual(res._body.systemData, aiResponse.systemData);
});

test('ShowController.generateWithAI: returns 400 when create=true but systemData missing required fields', async () => {
  const aiResponse = {
    userView: { showName: 'AI Show' },
    systemData: { choreographyIdeas: [] } // missing showName and venue
  };
  const controller = loadController({
    aiServiceMock: { generateShow: async () => aiResponse }
  });
  const req = { body: { prompt: 'test', create: true } };
  const res = makeRes();
  const originalLog = console.log;
  console.log = () => {};
  try {
    await controller.generateWithAI(req, res, () => {});
  } finally {
    console.log = originalLog;
  }
  assert.equal(res._status, 400);
  assert.ok(res._body.error);
});

test('ShowController.generateWithAI: creates show when create=true and systemData valid', async () => {
  const aiResponse = {
    userView: { showName: 'AI', venue: 'V' },
    systemData: { showName: 'AI', venue: 'V', durationSeconds: 60, notes: 'n', choreographyIdeas: [] }
  };
  let createdData = null;
  const controller = loadController({
    aiServiceMock: { generateShow: async () => aiResponse },
    showModel: {
      create: async (data) => { createdData = data; return { showId: 5 }; },
      findByPk: async () => ({ showId: 5 })
    }
  });
  const req = { body: { prompt: 'p', projectId: 1, create: true, showDate: '2026-01-01', showTime: '21:00:00' } };
  const res = makeRes();
  const originalLog = console.log;
  console.log = () => {};
  try {
    await controller.generateWithAI(req, res, () => {});
  } finally {
    console.log = originalLog;
  }
  assert.equal(res._status, 200);
  assert.equal(createdData.showName, 'AI');
  assert.equal(createdData.projectId, 1);
});

test('ShowController.generateWithAI: applies defaults when showDate/showTime/projectId missing and choreographyIdeas absent', async () => {
  const aiResponse = {
    userView: { showName: 'AI', venue: 'V' },
    systemData: { showName: 'AI', venue: 'V' } // durationSeconds/notes/choreographyIdeas omitted
  };
  let createdData = null;
  const controller = loadController({
    aiServiceMock: { generateShow: async () => aiResponse },
    showModel: {
      create: async (data) => { createdData = data; return { showId: 5 }; },
      findByPk: async () => ({ showId: 5 })
    }
  });
  const req = { body: { prompt: 'p', create: true } };
  const res = makeRes();
  const originalLog = console.log;
  console.log = () => {};
  try {
    await controller.generateWithAI(req, res, () => {});
  } finally {
    console.log = originalLog;
  }
  assert.equal(res._status, 200);
  assert.equal(createdData.durationSeconds, 300);
  assert.equal(createdData.notes, '');
  assert.equal(createdData.projectId, null);
  assert.ok(typeof createdData.showDate === 'string');
  assert.equal(createdData.showTime, '20:00:00');
  assert.deepEqual(res._body.choreographyIdeas, []);
});

test('ShowController.generateWithAI: passes error to next when ai service throws', async () => {
  const controller = loadController({
    aiServiceMock: { generateShow: async () => { throw new Error('AI down'); } }
  });
  const req = { body: { prompt: 'p', create: false } };
  const res = makeRes();
  let nextError = null;
  const originalLog = console.log;
  console.log = () => {};
  try {
    await controller.generateWithAI(req, res, (e) => { nextError = e; });
  } finally {
    console.log = originalLog;
  }
  assert.ok(nextError instanceof Error);
});
