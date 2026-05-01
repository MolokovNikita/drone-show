const test = require('node:test');
const assert = require('node:assert/strict');

test('AuthService.generateTokens builds payload and signs both tokens', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const jwtPath = require.resolve('jsonwebtoken');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalJwt = require.cache[jwtPath];

  try {
    // Mock modules before requiring service under test
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: { User: {}, Role: {} }
    };
    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: {
        jwt: {
          secret: 'access-secret',
          refreshSecret: 'refresh-secret',
          expiresIn: '1h',
          refreshExpiresIn: '7d'
        }
      }
    };

    const signCalls = [];
    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: {
        sign(payload, secret, options) {
          signCalls.push({ payload, secret, options });
          return `${secret}.${payload.userId}.${options.expiresIn}`;
        }
      }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    const tokens = authService.generateTokens({
      userId: 42,
      username: 'alice',
      email: 'a@example.com',
      role: { roleName: 'admin' }
    });

    assert.deepEqual(tokens, {
      accessToken: 'access-secret.42.1h',
      refreshToken: 'refresh-secret.42.7d'
    });

    assert.equal(signCalls.length, 2);
    assert.deepEqual(signCalls[0], {
      payload: {
        userId: 42,
        username: 'alice',
        email: 'a@example.com',
        role: 'admin'
      },
      secret: 'access-secret',
      options: { expiresIn: '1h' }
    });
    assert.deepEqual(signCalls[1], {
      payload: {
        userId: 42,
        username: 'alice',
        email: 'a@example.com',
        role: 'admin'
      },
      secret: 'refresh-secret',
      options: { expiresIn: '7d' }
    });
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
  }
});

test('AuthService.login returns user and tokens when credentials are valid', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const bcryptPath = require.resolve('bcrypt');
  const jwtPath = require.resolve('jsonwebtoken');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalBcrypt = require.cache[bcryptPath];
  const originalJwt = require.cache[jwtPath];

  try {
    const fakeUser = {
      userId: 1,
      username: 'alice',
      email: 'a@example.com',
      fullName: 'Alice',
      isActive: true,
      passwordHash: 'hash',
      role: { roleName: 'admin' }
    };

    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: {
        User: {
          findOne: async () => fakeUser
        },
        Role: {}
      }
    };

    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: {
        jwt: {
          secret: 'access-secret',
          refreshSecret: 'refresh-secret',
          expiresIn: '1h',
          refreshExpiresIn: '7d'
        }
      }
    };

    require.cache[bcryptPath] = {
      id: bcryptPath,
      filename: bcryptPath,
      loaded: true,
      exports: {
        compare: async () => true
      }
    };

    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: {
        sign: () => 'token'
      }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    const res = await authService.login('alice', 'pw');
    assert.deepEqual(res.user, {
      userId: 1,
      username: 'alice',
      email: 'a@example.com',
      fullName: 'Alice',
      role: { roleName: 'admin' }
    });
    assert.deepEqual(res.tokens, { accessToken: 'token', refreshToken: 'token' });
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalBcrypt) require.cache[bcryptPath] = originalBcrypt;
    else delete require.cache[bcryptPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
  }
});

test('AuthService.login throws when user is missing or inactive', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const bcryptPath = require.resolve('bcrypt');
  const jwtPath = require.resolve('jsonwebtoken');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalBcrypt = require.cache[bcryptPath];
  const originalJwt = require.cache[jwtPath];

  try {
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: {
        User: { findOne: async () => null },
        Role: {}
      }
    };
    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: { jwt: { secret: 's', refreshSecret: 'rs', expiresIn: '1h', refreshExpiresIn: '7d' } }
    };
    require.cache[bcryptPath] = {
      id: bcryptPath,
      filename: bcryptPath,
      loaded: true,
      exports: { compare: async () => true }
    };
    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: { sign: () => 't', verify: () => ({ userId: 1 }) }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    await assert.rejects(() => authService.login('missing', 'pw'), /Invalid credentials/);

    // inactive user branch
    require.cache[modelsPath].exports.User.findOne = async () => ({
      userId: 1,
      username: 'u',
      email: 'e',
      fullName: 'n',
      isActive: false,
      passwordHash: 'hash',
      role: { roleName: 'admin' }
    });
    await assert.rejects(() => authService.login('u', 'pw'), /Invalid credentials/);
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalBcrypt) require.cache[bcryptPath] = originalBcrypt;
    else delete require.cache[bcryptPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
  }
});

test('AuthService.login throws when password is invalid', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const bcryptPath = require.resolve('bcrypt');
  const jwtPath = require.resolve('jsonwebtoken');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalBcrypt = require.cache[bcryptPath];
  const originalJwt = require.cache[jwtPath];

  try {
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: {
        User: {
          findOne: async () => ({
            userId: 1,
            username: 'alice',
            email: 'a@example.com',
            fullName: 'Alice',
            isActive: true,
            passwordHash: 'hash',
            role: { roleName: 'admin' }
          })
        },
        Role: {}
      }
    };
    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: { jwt: { secret: 's', refreshSecret: 'rs', expiresIn: '1h', refreshExpiresIn: '7d' } }
    };
    require.cache[bcryptPath] = {
      id: bcryptPath,
      filename: bcryptPath,
      loaded: true,
      exports: { compare: async () => false }
    };
    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: { sign: () => 't', verify: () => ({ userId: 1 }) }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    await assert.rejects(() => authService.login('alice', 'wrong'), /Invalid credentials/);
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalBcrypt) require.cache[bcryptPath] = originalBcrypt;
    else delete require.cache[bcryptPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
  }
});

test('AuthService.refreshToken returns new tokens when refresh token is valid', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const jwtPath = require.resolve('jsonwebtoken');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalJwt = require.cache[jwtPath];

  try {
    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: { jwt: { secret: 'access-secret', refreshSecret: 'refresh-secret', expiresIn: '1h', refreshExpiresIn: '7d' } }
    };

    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: {
        User: {
          findByPk: async () => ({
            userId: 7,
            username: 'bob',
            email: 'b@example.com',
            isActive: true,
            role: { roleName: 'operator' }
          })
        },
        Role: {}
      }
    };

    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: {
        verify: () => ({ userId: 7 }),
        sign: () => 'token'
      }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    const tokens = await authService.refreshToken('rt');
    assert.deepEqual(tokens, { accessToken: 'token', refreshToken: 'token' });
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
  }
});

test('AuthService.refreshToken throws Invalid refresh token when token verification fails', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const jwtPath = require.resolve('jsonwebtoken');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalJwt = require.cache[jwtPath];

  try {
    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: { jwt: { secret: 's', refreshSecret: 'refresh-secret', expiresIn: '1h', refreshExpiresIn: '7d' } }
    };
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: { User: { findByPk: async () => null }, Role: {} }
    };
    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: { verify: () => { throw new Error('bad'); }, sign: () => 't' }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    await assert.rejects(() => authService.refreshToken('bad'), /Invalid refresh token/);
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
  }
});

test('AuthService.refreshToken throws when user is missing or inactive', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const jwtPath = require.resolve('jsonwebtoken');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalJwt = require.cache[jwtPath];

  try {
    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: { jwt: { secret: 's', refreshSecret: 'refresh-secret', expiresIn: '1h', refreshExpiresIn: '7d' } }
    };
    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: { verify: () => ({ userId: 1 }), sign: () => 't' }
    };

    // user missing
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: { User: { findByPk: async () => null }, Role: {} }
    };
    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');
    await assert.rejects(() => authService.refreshToken('rt'), /Invalid refresh token/);

    // inactive user
    require.cache[modelsPath].exports.User.findByPk = async () => ({ userId: 1, isActive: false, role: { roleName: 'admin' } });
    await assert.rejects(() => authService.refreshToken('rt'), /Invalid refresh token/);
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
  }
});

test('AuthService.register creates user with default operator role and returns tokens', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const bcryptPath = require.resolve('bcrypt');
  const jwtPath = require.resolve('jsonwebtoken');
  const sequelizePath = require.resolve('sequelize');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalBcrypt = require.cache[bcryptPath];
  const originalJwt = require.cache[jwtPath];
  const originalSeq = require.cache[sequelizePath];

  try {
    // Minimal sequelize Op stub for [Op.or]
    require.cache[sequelizePath] = {
      id: sequelizePath,
      filename: sequelizePath,
      loaded: true,
      exports: { Op: { or: 'or' } }
    };

    let createdUserData = null;
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: {
        User: {
          findOne: async () => null,
          create: async (data) => { createdUserData = data; return { userId: 1 }; },
          findByPk: async () => ({
            userId: 1,
            username: createdUserData.username,
            email: createdUserData.email,
            fullName: createdUserData.fullName,
            role: { roleName: 'operator' }
          })
        },
        Role: {
          findOne: async ({ where }) => (where && where.roleName === 'operator' ? { roleId: 2 } : null)
        }
      }
    };

    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: { jwt: { secret: 's', refreshSecret: 'rs', expiresIn: '1h', refreshExpiresIn: '7d' } }
    };
    require.cache[bcryptPath] = {
      id: bcryptPath,
      filename: bcryptPath,
      loaded: true,
      exports: { hash: async () => 'hash' }
    };
    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: { sign: () => 'token' }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    const res = await authService.register({
      username: 'u',
      email: 'e@example.com',
      password: 'pw',
      fullName: 'Name',
      phone: '123'
    });
    assert.equal(createdUserData.roleId, 2);
    assert.equal(res.user.username, 'u');
    assert.deepEqual(res.tokens, { accessToken: 'token', refreshToken: 'token' });
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalBcrypt) require.cache[bcryptPath] = originalBcrypt;
    else delete require.cache[bcryptPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
    if (originalSeq) require.cache[sequelizePath] = originalSeq;
    else delete require.cache[sequelizePath];
  }
});

test('AuthService.register uses provided roleId and throws when user already exists', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const bcryptPath = require.resolve('bcrypt');
  const jwtPath = require.resolve('jsonwebtoken');
  const sequelizePath = require.resolve('sequelize');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalBcrypt = require.cache[bcryptPath];
  const originalJwt = require.cache[jwtPath];
  const originalSeq = require.cache[sequelizePath];

  try {
    require.cache[sequelizePath] = {
      id: sequelizePath,
      filename: sequelizePath,
      loaded: true,
      exports: { Op: { or: 'or' } }
    };
    require.cache[configPath] = {
      id: configPath,
      filename: configPath,
      loaded: true,
      exports: { jwt: { secret: 's', refreshSecret: 'rs', expiresIn: '1h', refreshExpiresIn: '7d' } }
    };
    require.cache[bcryptPath] = {
      id: bcryptPath,
      filename: bcryptPath,
      loaded: true,
      exports: { hash: async () => 'hash' }
    };
    require.cache[jwtPath] = {
      id: jwtPath,
      filename: jwtPath,
      loaded: true,
      exports: { sign: () => 'token' }
    };

    // existing user branch
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: {
        User: { findOne: async () => ({ userId: 9 }) },
        Role: {}
      }
    };
    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');
    await assert.rejects(() => authService.register({ username: 'u', email: 'e', password: 'p' }), /already exists/);

    // provided roleId branch (no Role.findOne needed)
    let createdUserData = null;
    require.cache[modelsPath].exports.User.findOne = async () => null;
    require.cache[modelsPath].exports.User.create = async (data) => { createdUserData = data; return { userId: 1 }; };
    require.cache[modelsPath].exports.User.findByPk = async () => ({
      userId: 1,
      username: 'u',
      email: 'e',
      fullName: null,
      role: { roleName: 'admin' }
    });

    const res = await authService.register({ username: 'u', email: 'e', password: 'p', roleId: 5 });
    assert.equal(createdUserData.roleId, 5);
    assert.ok(res.tokens.accessToken);
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels;
    else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig;
    else delete require.cache[configPath];
    if (originalBcrypt) require.cache[bcryptPath] = originalBcrypt;
    else delete require.cache[bcryptPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt;
    else delete require.cache[jwtPath];
    if (originalSeq) require.cache[sequelizePath] = originalSeq;
    else delete require.cache[sequelizePath];
  }
});

test('AuthService.register falls back to any existing role when operator role missing', async () => {
  const modelsPath = require.resolve('../models');
  const configPath = require.resolve('../config/config');
  const bcryptPath = require.resolve('bcrypt');
  const jwtPath = require.resolve('jsonwebtoken');
  const sequelizePath = require.resolve('sequelize');

  const originalModels = require.cache[modelsPath];
  const originalConfig = require.cache[configPath];
  const originalBcrypt = require.cache[bcryptPath];
  const originalJwt = require.cache[jwtPath];
  const originalSeq = require.cache[sequelizePath];

  try {
    require.cache[sequelizePath] = { id: sequelizePath, filename: sequelizePath, loaded: true, exports: { Op: { or: 'or' } } };
    require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: { jwt: { secret: 's', refreshSecret: 'rs', expiresIn: '1h', refreshExpiresIn: '7d' } } };
    require.cache[bcryptPath] = { id: bcryptPath, filename: bcryptPath, loaded: true, exports: { hash: async () => 'hash' } };
    require.cache[jwtPath] = { id: jwtPath, filename: jwtPath, loaded: true, exports: { sign: () => 'token' } };

    let createdUserData = null;
    require.cache[modelsPath] = {
      id: modelsPath,
      filename: modelsPath,
      loaded: true,
      exports: {
        User: {
          findOne: async () => null,
          create: async (data) => { createdUserData = data; return { userId: 1 }; },
          findByPk: async () => ({ userId: 1, username: 'u', email: 'e', fullName: null, role: { roleName: 'operator' } })
        },
        Role: {
          findOne: async (arg) => {
            // first call: operator role not found
            if (arg && arg.where && arg.where.roleName === 'operator') return null;
            // second call: anyRole
            return { roleId: 9 };
          }
        }
      }
    };

    const servicePath = require.resolve('./authService');
    delete require.cache[servicePath];
    const authService = require('./authService');

    await authService.register({ username: 'u', email: 'e', password: 'p' });
    assert.equal(createdUserData.roleId, 9);
  } finally {
    if (originalModels) require.cache[modelsPath] = originalModels; else delete require.cache[modelsPath];
    if (originalConfig) require.cache[configPath] = originalConfig; else delete require.cache[configPath];
    if (originalBcrypt) require.cache[bcryptPath] = originalBcrypt; else delete require.cache[bcryptPath];
    if (originalJwt) require.cache[jwtPath] = originalJwt; else delete require.cache[jwtPath];
    if (originalSeq) require.cache[sequelizePath] = originalSeq; else delete require.cache[sequelizePath];
  }
});

