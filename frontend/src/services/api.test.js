import test from 'node:test';
import assert from 'node:assert/strict';

function installLocalStorageMock(seed = {}) {
  const store = new Map(Object.entries(seed).map(([k, v]) => [k, String(v)]));
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
  return { store, restore: () => { globalThis.localStorage = original; } };
}

function installWindowMock() {
  const original = globalThis.window;
  globalThis.window = { location: { href: '' } };
  return () => { globalThis.window = original; };
}

test('api baseURL falls back to default when env is absent', async () => {
  const originalEnv = process.env.VITE_API_URL;
  delete process.env.VITE_API_URL;

  const mod = await import('./api.js');
  const api = mod.default;

  try {
    assert.ok(api.defaults.baseURL);
    assert.equal(api.defaults.baseURL, 'http://localhost:3001/api');
  } finally {
    if (originalEnv === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = originalEnv;
  }
});

test('api request interceptor attaches Authorization when accessToken exists', async () => {
  const { restore } = installLocalStorageMock({ accessToken: 'abc' });
  try {
    const mod = await import('./api.js');
    const api = mod.default;

    const handler = api.interceptors.request.handlers[0].fulfilled;
    const cfg = { headers: {} };
    const out = handler(cfg);
    assert.equal(out.headers.Authorization, 'Bearer abc');
  } finally {
    restore();
  }
});

test('api request interceptor leaves headers untouched when no accessToken', async () => {
  const { restore } = installLocalStorageMock();
  try {
    const mod = await import('./api.js');
    const api = mod.default;

    const handler = api.interceptors.request.handlers[0].fulfilled;
    const cfg = { headers: {} };
    const out = handler(cfg);
    assert.equal(out.headers.Authorization, undefined);
  } finally {
    restore();
  }
});

test('api request interceptor propagates error', async () => {
  const mod = await import('./api.js');
  const api = mod.default;
  const rejected = api.interceptors.request.handlers[0].rejected;
  const err = new Error('x');
  await assert.rejects(() => rejected(err), /x/);
});

test('api response interceptor refreshes token on 401 once and retries request', async () => {
  const { restore } = installLocalStorageMock({ refreshToken: 'rt' });
  const restoreWindow = installWindowMock();
  const axios = (await import('axios')).default;
  const originalPost = axios.post;
  try {
    axios.post = async () => ({ data: { tokens: { accessToken: 'newA' } } });

    const mod = await import('./api.js');
    const api = mod.default;

    // ensure retry doesn't hit network
    api.defaults.adapter = async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    });

    const rejected = api.interceptors.response.handlers[0].rejected;
    const error = {
      message: 'Unauthorized',
      config: { headers: {} },
      response: { status: 401, data: {} }
    };

    const resp = await rejected(error);
    assert.equal(globalThis.localStorage.getItem('accessToken'), 'newA');
    assert.equal(resp.status, 200);
  } finally {
    axios.post = originalPost;
    restoreWindow();
    restore();
  }
});

test('api response interceptor redirects to /login when refresh fails', async () => {
  const { restore } = installLocalStorageMock({ accessToken: 'a', refreshToken: 'rt' });
  const restoreWindow = installWindowMock();
  const axios = (await import('axios')).default;
  const originalPost = axios.post;
  try {
    axios.post = async () => { throw new Error('refresh failed'); };

    const mod = await import('./api.js');
    const api = mod.default;
    const rejected = api.interceptors.response.handlers[0].rejected;
    const error = {
      config: { headers: {} },
      response: { status: 401, data: {} }
    };

    await assert.rejects(() => rejected(error), /refresh failed/);
    assert.equal(globalThis.localStorage.getItem('accessToken'), null);
    assert.equal(globalThis.localStorage.getItem('refreshToken'), null);
    assert.equal(globalThis.window.location.href, '/login');
  } finally {
    axios.post = originalPost;
    restoreWindow();
    restore();
  }
});

test('api response interceptor formats non-401 errors', async () => {
  const mod = await import('./api.js');
  const api = mod.default;
  const rejected = api.interceptors.response.handlers[0].rejected;
  const error = {
    message: 'Bad',
    config: { _retry: true },
    response: { status: 500, data: { error: 'E', errors: ['a'] } }
  };
  try {
    await rejected(error);
    assert.fail('expected reject');
  } catch (e) {
    assert.equal(e.status, 500);
    assert.equal(e.error, 'E');
    assert.deepEqual(e.errors, ['a']);
  }
});

