import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, {
  fetchFlightPaths,
  createFlightPath,
  updateFlightPath,
  deleteFlightPath,
  bulkUpdateFlightPaths
} from './flightPathSlice.js';
import api from '../../services/api.js';

test('flightPathSlice: bulkUpdateFlightPaths.fulfilled replaces items from payload.items', async () => {
  const originalPost = api.post;
  const originalLog = console.log;
  try {
    console.log = () => {};
    api.post = async () => ({ data: { items: [{ pathId: 1 }, { pathId: 2 }] } });
    const store = configureStore({ reducer: { flightPaths: reducer } });
    const action = await store.dispatch(bulkUpdateFlightPaths({ any: true }));
    assert.equal(action.type, 'flightPaths/bulkUpdate/fulfilled');
    assert.deepEqual(store.getState().flightPaths.items, [{ pathId: 1 }, { pathId: 2 }]);
  } finally {
    api.post = originalPost;
    console.log = originalLog;
  }
});

test('flightPathSlice: fetchFlightPaths pending/fulfilled/rejected', async () => {
  const originalGet = api.get;
  const originalLog = console.log;
  try {
    console.log = () => {};
    const store = configureStore({ reducer: { flightPaths: reducer } });
    store.dispatch(fetchFlightPaths.pending('req', {}));
    assert.equal(store.getState().flightPaths.loading, true);

    api.get = async () => ({ data: { items: [{ pathId: 1 }] } });
    const ok = await store.dispatch(fetchFlightPaths());
    assert.equal(ok.type, 'flightPaths/fetchAll/fulfilled');
    assert.equal(store.getState().flightPaths.loading, false);
    assert.deepEqual(store.getState().flightPaths.items, [{ pathId: 1 }]);

    api.get = async () => { throw new Error('boom'); };
    const bad = await store.dispatch(fetchFlightPaths());
    assert.equal(bad.type, 'flightPaths/fetchAll/rejected');
    assert.equal(store.getState().flightPaths.error, 'boom');
  } finally {
    api.get = originalGet;
    console.log = originalLog;
  }
});

test('flightPathSlice: create/update/delete fulfilled branches', async () => {
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    const store = configureStore({ reducer: { flightPaths: reducer } });
    api.post = async () => ({ data: { pathId: 1 } });
    await store.dispatch(createFlightPath({}));
    assert.equal(store.getState().flightPaths.items.length, 1);

    // update existing
    api.put = async () => ({ data: { pathId: 1, maxAltitude: 10 } });
    await store.dispatch(updateFlightPath({ id: 1, data: {} }));
    assert.equal(store.getState().flightPaths.items[0].maxAltitude, 10);

    // update missing pathId (index -1 branch)
    await store.dispatch(updateFlightPath.fulfilled({ pathId: 999, maxAltitude: 1 }, 'req', { id: 999, data: {} }));

    api.delete = async () => ({ data: {} });
    await store.dispatch(deleteFlightPath(1));
    assert.equal(store.getState().flightPaths.items.length, 0);
  } finally {
    api.post = originalPost;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});

test('flightPathSlice thunks: create/update/delete/bulk rejectWithValue', async () => {
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    api.post = async () => { throw { response: { data: { error: 'E' } } }; };
    api.put = async () => { throw { response: { data: { error: 'E' } } }; };
    api.delete = async () => { throw { response: { data: { error: 'E' } } }; };
    const store = configureStore({ reducer: { flightPaths: reducer } });
    assert.equal((await store.dispatch(createFlightPath({}))).type, 'flightPaths/create/rejected');
    assert.equal((await store.dispatch(updateFlightPath({ id: 1, data: {} }))).type, 'flightPaths/update/rejected');
    assert.equal((await store.dispatch(deleteFlightPath(1))).type, 'flightPaths/delete/rejected');
    assert.equal((await store.dispatch(bulkUpdateFlightPaths({}))).type, 'flightPaths/bulkUpdate/rejected');
  } finally {
    api.post = originalPost;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});

