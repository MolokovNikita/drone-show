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

function loadErrorHandler() {
  const handlerPath = require.resolve('./errorHandler');
  const loggerPath = require.resolve('../utils/logger');
  const originalLogger = require.cache[loggerPath];
  require.cache[loggerPath] = {
    id: loggerPath, filename: loggerPath, loaded: true,
    exports: { error: () => {}, warn: () => {}, info: () => {} }
  };
  delete require.cache[handlerPath];
  const handler = require('./errorHandler');
  if (originalLogger) require.cache[loggerPath] = originalLogger;
  else delete require.cache[loggerPath];
  return handler;
}

test('errorHandler: uses err.status as HTTP status code', () => {
  const handler = loadErrorHandler();
  const req = { path: '/test', method: 'GET' };
  const res = makeRes();
  const err = new Error('Not found');
  err.status = 404;
  handler(err, req, res, () => {});
  assert.equal(res._status, 404);
  assert.equal(res._body.error, 'Not found');
});

test('errorHandler: falls back to 500 when no status on error', () => {
  const handler = loadErrorHandler();
  const req = { path: '/test', method: 'GET' };
  const res = makeRes();
  const err = new Error('Internal failure');
  handler(err, req, res, () => {});
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Internal failure');
});

test('errorHandler: falls back to default message when err.message is missing', () => {
  const handler = loadErrorHandler();
  const req = { path: '/test', method: 'GET' };
  const res = makeRes();
  const err = { status: 500, stack: 's' }; // no message
  handler(err, req, res, () => {});
  assert.equal(res._status, 500);
  assert.equal(res._body.error, 'Internal server error');
});

test('errorHandler: uses err.statusCode when err.status absent', () => {
  const handler = loadErrorHandler();
  const req = { path: '/test', method: 'GET' };
  const res = makeRes();
  const err = new Error('Conflict');
  err.statusCode = 409;
  handler(err, req, res, () => {});
  assert.equal(res._status, 409);
});

test('errorHandler: includes stack trace in development mode', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    const handler = loadErrorHandler();
    const req = { path: '/test', method: 'GET' };
    const res = makeRes();
    const err = new Error('Dev error');
    handler(err, req, res, () => {});
    assert.ok(res._body.stack !== undefined);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});

test('errorHandler: does not include stack trace in production', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const handler = loadErrorHandler();
    const req = { path: '/test', method: 'GET' };
    const res = makeRes();
    const err = new Error('Prod error');
    handler(err, req, res, () => {});
    assert.equal(res._body.stack, undefined);
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});
