import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, { login, register, getProfile, logout, clearError } from './authSlice.js';
import api from '../../services/api.js';

function installLocalStorageMock() {
  const store = new Map();
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
  return () => {
    globalThis.localStorage = original;
  };
}

test('authSlice: login.fulfilled sets user and tokens', async () => {
  const restoreLocalStorage = installLocalStorageMock();
  const originalPost = api.post;
  try {
    api.post = async () => ({
      data: {
        user: { userId: 1, username: 'u' },
        tokens: { accessToken: 'a', refreshToken: 'r' }
      }
    });

    const store = configureStore({ reducer: { auth: reducer } });
    const action = await store.dispatch(login({ username: 'u', password: 'p' }));

    assert.equal(action.type, 'auth/login/fulfilled');
    const state = store.getState().auth;
    assert.equal(state.isAuthenticated, true);
    assert.deepEqual(state.user, { userId: 1, username: 'u' });
    assert.equal(globalThis.localStorage.getItem('accessToken'), 'a');
    assert.equal(globalThis.localStorage.getItem('refreshToken'), 'r');
  } finally {
    api.post = originalPost;
    restoreLocalStorage();
  }
});

test('authSlice: logout clears auth state and removes tokens', () => {
  const restoreLocalStorage = installLocalStorageMock();
  try {
    globalThis.localStorage.setItem('accessToken', 'a');
    globalThis.localStorage.setItem('refreshToken', 'r');

    const before = { user: { userId: 1 }, isAuthenticated: true, loading: false, error: null };
    const after = reducer(before, logout());
    assert.equal(after.user, null);
    assert.equal(after.isAuthenticated, false);
    assert.equal(globalThis.localStorage.getItem('accessToken'), null);
    assert.equal(globalThis.localStorage.getItem('refreshToken'), null);
  } finally {
    restoreLocalStorage();
  }
});

test('authSlice: clearError sets error to null', () => {
  const before = { user: null, isAuthenticated: false, loading: false, error: 'x' };
  const after = reducer(before, clearError());
  assert.equal(after.error, null);
});

test('authSlice: login.pending sets loading and clears error', () => {
  const before = { user: null, isAuthenticated: false, loading: false, error: 'x' };
  const after = reducer(before, login.pending('req', { username: 'u' }));
  assert.equal(after.loading, true);
  assert.equal(after.error, null);
});

test('authSlice: login.rejected uses payload when provided', () => {
  const before = { user: null, isAuthenticated: false, loading: true, error: null };
  const after = reducer(before, login.rejected(new Error('e'), 'req', {}, { error: 'Bad creds' }));
  assert.equal(after.loading, false);
  assert.equal(after.error, 'Bad creds');
});

test('authSlice: login.rejected uses action.error when no payload', () => {
  const before = { user: null, isAuthenticated: false, loading: true, error: null };
  const after = reducer(before, login.rejected(new Error('boom'), 'req', {}));
  assert.equal(after.loading, false);
  assert.equal(after.error, 'boom');
});

test('authSlice: register.fulfilled sets user and tokens', async () => {
  const restoreLocalStorage = installLocalStorageMock();
  const originalPost = api.post;
  try {
    api.post = async () => ({
      data: {
        user: { userId: 2, username: 'r' },
        tokens: { accessToken: 'a2', refreshToken: 'r2' }
      }
    });
    const store = configureStore({ reducer: { auth: reducer } });
    const action = await store.dispatch(register({ username: 'r' }));
    assert.equal(action.type, 'auth/register/fulfilled');
    assert.equal(store.getState().auth.isAuthenticated, true);
    assert.equal(globalThis.localStorage.getItem('accessToken'), 'a2');
  } finally {
    api.post = originalPost;
    restoreLocalStorage();
  }
});

test('authSlice: register thunk rejects with payload on api error', async () => {
  const restoreLocalStorage = installLocalStorageMock();
  const originalPost = api.post;
  try {
    api.post = async () => {
      const err = { data: { error: 'RegFail', errors: ['e1'] } };
      throw err;
    };
    const store = configureStore({ reducer: { auth: reducer } });
    const action = await store.dispatch(register({ username: 'x' }));
    assert.equal(action.type, 'auth/register/rejected');
    assert.deepEqual(store.getState().auth.error, { error: 'RegFail', errors: ['e1'] });
  } finally {
    api.post = originalPost;
    restoreLocalStorage();
  }
});

test('authSlice: register.rejected stores structured error when payload present', () => {
  const before = { user: null, isAuthenticated: false, loading: true, error: null };
  const after = reducer(before, register.rejected(new Error('e'), 'req', {}, { error: 'Reg', errors: ['x'] }));
  assert.equal(after.loading, false);
  assert.deepEqual(after.error, { error: 'Reg', errors: ['x'] });
});

test('authSlice: register.rejected stores string when no payload', () => {
  const before = { user: null, isAuthenticated: false, loading: true, error: null };
  const after = reducer(before, register.rejected(new Error('oops'), 'req', {}));
  assert.equal(after.loading, false);
  assert.equal(after.error, 'oops');
});

test('authSlice: getProfile.fulfilled sets user and isAuthenticated', async () => {
  const originalGet = api.get;
  try {
    api.get = async () => ({ data: { user: { userId: 3, username: 'p' } } });
    const store = configureStore({ reducer: { auth: reducer } });
    const action = await store.dispatch(getProfile());
    assert.equal(action.type, 'auth/getProfile/fulfilled');
    assert.equal(store.getState().auth.user.username, 'p');
    assert.equal(store.getState().auth.isAuthenticated, true);
  } finally {
    api.get = originalGet;
  }
});

test('authSlice: login thunk rejects with payload on api error', async () => {
  const restoreLocalStorage = installLocalStorageMock();
  const originalPost = api.post;
  try {
    api.post = async () => {
      const err = { data: { error: 'Nope' } };
      throw err;
    };
    const store = configureStore({ reducer: { auth: reducer } });
    const action = await store.dispatch(login({ username: 'u', password: 'p' }));
    assert.equal(action.type, 'auth/login/rejected');
    assert.equal(store.getState().auth.error, 'Nope');
  } finally {
    api.post = originalPost;
    restoreLocalStorage();
  }
});

