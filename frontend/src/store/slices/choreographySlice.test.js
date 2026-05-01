import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, {
  setCurrent,
  fetchChoreographies,
  fetchChoreographyById,
  createChoreography,
  updateChoreography,
  deleteChoreography
} from './choreographySlice.js';
import api from '../../services/api.js';

test('choreographySlice: setCurrent sets current choreography', () => {
  const before = { items: [], current: null, loading: false, error: null };
  const after = reducer(before, setCurrent({ choreographyId: 1 }));
  assert.deepEqual(after.current, { choreographyId: 1 });
});

test('choreographySlice: fetchChoreographies.fulfilled stores items', async () => {
  const originalGet = api.get;
  const originalLog = console.log;
  try {
    console.log = () => {};
    api.get = async () => ({ data: { items: [{ choreographyId: 1 }] } });
    const store = configureStore({ reducer: { choreographies: reducer } });
    const action = await store.dispatch(fetchChoreographies());
    assert.equal(action.type, 'choreographies/fetchAll/fulfilled');
    assert.deepEqual(store.getState().choreographies.items, [{ choreographyId: 1 }]);
  } finally {
    api.get = originalGet;
    console.log = originalLog;
  }
});

test('choreographySlice: fetchChoreographies.pending/rejected toggles loading and sets error', () => {
  const before = { items: [], current: null, loading: false, error: null };
  const pendingState = reducer(before, fetchChoreographies.pending('req', {}));
  assert.equal(pendingState.loading, true);
  const rejectedState = reducer(pendingState, fetchChoreographies.rejected(new Error('boom'), 'req', {}));
  assert.equal(rejectedState.loading, false);
  assert.equal(rejectedState.error, 'boom');
});

test('choreographySlice: fetchChoreographyById.fulfilled sets current', async () => {
  const originalGet = api.get;
  const originalLog = console.log;
  try {
    console.log = () => {};
    api.get = async () => ({ data: { choreographyId: 2, flightPaths: [] } });
    const store = configureStore({ reducer: { choreographies: reducer } });
    const action = await store.dispatch(fetchChoreographyById(2));
    assert.equal(action.type, 'choreographies/fetchById/fulfilled');
    assert.equal(store.getState().choreographies.current.choreographyId, 2);
  } finally {
    api.get = originalGet;
    console.log = originalLog;
  }
});

test('choreographySlice: create/update/delete fulfilled mutate items/current', async () => {
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    api.post = async () => ({ data: { choreographyId: 1, choreographyName: 'A' } });
    api.put = async () => ({ data: { choreographyId: 1, choreographyName: 'B' } });
    api.delete = async () => ({ data: {} });

    const store = configureStore({ reducer: { choreographies: reducer } });
    await store.dispatch(createChoreography({}));
    store.dispatch(setCurrent({ choreographyId: 1, choreographyName: 'A' }));
    await store.dispatch(updateChoreography({ id: 1, data: {} }));
    assert.equal(store.getState().choreographies.items[0].choreographyName, 'B');
    assert.equal(store.getState().choreographies.current.choreographyName, 'B');

    await store.dispatch(deleteChoreography(1));
    assert.equal(store.getState().choreographies.items.length, 0);
    assert.equal(store.getState().choreographies.current, null);
  } finally {
    api.post = originalPost;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});

test('choreographySlice thunks: create/update/delete rejectWithValue on api error', async () => {
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    api.post = async () => { throw { response: { data: { error: 'E1' } } }; };
    api.put = async () => { throw { response: { data: { error: 'E2' } } }; };
    api.delete = async () => { throw { response: { data: { error: 'E3' } } }; };

    const store = configureStore({ reducer: { choreographies: reducer } });
    const a1 = await store.dispatch(createChoreography({}));
    const a2 = await store.dispatch(updateChoreography({ id: 1, data: {} }));
    const a3 = await store.dispatch(deleteChoreography(1));
    assert.equal(a1.type, 'choreographies/create/rejected');
    assert.equal(a2.type, 'choreographies/update/rejected');
    assert.equal(a3.type, 'choreographies/delete/rejected');
  } finally {
    api.post = originalPost;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});

