import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, { clearError, fetchClients, createClient, updateClient, deleteClient } from './clientSlice.js';
import api from '../../services/api.js';

test('clientSlice reducer: clearError resets error to null', () => {
  const initial = { items: [], loading: false, error: 'boom' };
  const next = reducer(initial, clearError());
  assert.equal(next.error, null);
});

test('fetchClients thunk: fulfilled populates items and toggles loading', async () => {
  const originalGet = api.get;
  try {
    api.get = async () => ({ data: { items: [{ clientId: 1, name: 'A' }] } });

    const store = configureStore({ reducer: { clients: reducer } });
    const action = await store.dispatch(fetchClients());

    assert.equal(action.type, 'clients/fetchAll/fulfilled');
    const state = store.getState().clients;
    assert.equal(state.loading, false);
    assert.deepEqual(state.items, [{ clientId: 1, name: 'A' }]);
  } finally {
    api.get = originalGet;
  }
});

test('fetchClients thunk: rejected sets error from payload.error when present', async () => {
  const originalGet = api.get;
  try {
    api.get = async () => {
      const err = new Error('Request failed');
      err.data = { error: 'Bad request' };
      throw err;
    };

    const store = configureStore({ reducer: { clients: reducer } });
    const action = await store.dispatch(fetchClients());

    assert.equal(action.type, 'clients/fetchAll/rejected');
    const state = store.getState().clients;
    assert.equal(state.loading, false);
    assert.equal(state.error, 'Bad request');
  } finally {
    api.get = originalGet;
  }
});

test('clientSlice: createClient pending clears error; fulfilled unshifts; rejected sets error', async () => {
  const originalPost = api.post;
  try {
    const store = configureStore({ reducer: { clients: reducer } });
    store.dispatch(createClient.pending('req', {}));
    assert.equal(store.getState().clients.error, null);

    api.post = async () => ({ data: { clientId: 1 } });
    const ok = await store.dispatch(createClient({}));
    assert.equal(ok.type, 'clients/create/fulfilled');
    assert.deepEqual(store.getState().clients.items[0], { clientId: 1 });

    api.post = async () => { throw { data: { error: 'Bad' } }; };
    const bad = await store.dispatch(createClient({}));
    assert.equal(bad.type, 'clients/create/rejected');
    assert.equal(store.getState().clients.error, 'Bad');
  } finally {
    api.post = originalPost;
  }
});

test('clientSlice: updateClient fulfilled updates existing; rejected sets error', async () => {
  const originalPut = api.put;
  try {
    const store = configureStore({ reducer: { clients: reducer } });
    store.dispatch(createClient.fulfilled({ clientId: 1, name: 'A' }, 'req', {}));
    api.put = async () => ({ data: { clientId: 1, name: 'B' } });
    const ok = await store.dispatch(updateClient({ id: 1, data: {} }));
    assert.equal(ok.type, 'clients/update/fulfilled');
    assert.equal(store.getState().clients.items[0].name, 'B');

    api.put = async () => { throw { data: { error: 'Nope' } }; };
    const bad = await store.dispatch(updateClient({ id: 1, data: {} }));
    assert.equal(bad.type, 'clients/update/rejected');
    assert.equal(store.getState().clients.error, 'Nope');
  } finally {
    api.put = originalPut;
  }
});

test('clientSlice: deleteClient fulfilled removes; rejected sets error', async () => {
  const originalDelete = api.delete;
  try {
    const store = configureStore({ reducer: { clients: reducer } });
    store.dispatch(createClient.fulfilled({ clientId: 1 }, 'req', {}));
    api.delete = async () => ({ data: {} });
    const ok = await store.dispatch(deleteClient(1));
    assert.equal(ok.type, 'clients/delete/fulfilled');
    assert.equal(store.getState().clients.items.length, 0);

    api.delete = async () => { throw { data: { error: 'DelFail' } }; };
    const bad = await store.dispatch(deleteClient(1));
    assert.equal(bad.type, 'clients/delete/rejected');
    assert.equal(store.getState().clients.error, 'DelFail');
  } finally {
    api.delete = originalDelete;
  }
});
