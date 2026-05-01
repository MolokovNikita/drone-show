const test = require('node:test');
const assert = require('node:assert/strict');

function loadFreshDb({ nodeEnv }) {
  const dbPath = require.resolve('./db');
  const sequelizePath = require.resolve('sequelize');
  const configPath = require.resolve('../config/config');

  const origDb = require.cache[dbPath];
  const origSequelize = require.cache[sequelizePath];
  const origConfig = require.cache[configPath];
  const origEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = nodeEnv;

  const ctorCalls = [];
  require.cache[sequelizePath] = {
    id: sequelizePath,
    filename: sequelizePath,
    loaded: true,
    exports: {
      Sequelize: function Sequelize(name, user, password, options) {
        ctorCalls.push({ name, user, password, options });
        return { options };
      }
    }
  };

  require.cache[configPath] = {
    id: configPath,
    filename: configPath,
    loaded: true,
    exports: {
      db: {
        name: 'db',
        user: 'u',
        password: 'p',
        host: 'h',
        port: 5432
      }
    }
  };

  delete require.cache[dbPath];
  const sequelize = require('./db');

  // restore cache/env
  if (origDb) require.cache[dbPath] = origDb;
  else delete require.cache[dbPath];
  if (origSequelize) require.cache[sequelizePath] = origSequelize;
  else delete require.cache[sequelizePath];
  if (origConfig) require.cache[configPath] = origConfig;
  else delete require.cache[configPath];
  process.env.NODE_ENV = origEnv;

  return { sequelize, ctorCalls };
}

test('db uses console.log logging in development', () => {
  const { ctorCalls } = loadFreshDb({ nodeEnv: 'development' });
  assert.equal(ctorCalls.length, 1);
  assert.equal(ctorCalls[0].options.logging, console.log);
});

test('db disables logging outside development', () => {
  const { ctorCalls } = loadFreshDb({ nodeEnv: 'production' });
  assert.equal(ctorCalls.length, 1);
  assert.equal(ctorCalls[0].options.logging, false);
});

