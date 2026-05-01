import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, { fetchDrones, fetchDroneById, createDrone, updateDrone, deleteDrone } from './droneSlice.js';
import api from '../../services/api.js';

test('droneSlice: fetchDrones.fulfilled stores items (payload.items)', async () => {
  const originalGet = api.get;
  const originalLog = console.log;
  try {
    console.log = () => {};
    api.get = async () => ({ data: { items: [{ droneId: 1 }] } });

    const store = configureStore({ reducer: { drones: reducer } });
    const action = await store.dispatch(fetchDrones());

    assert.equal(action.type, 'drones/fetchAll/fulfilled');
    assert.deepEqual(store.getState().drones.items, [{ droneId: 1 }]);
    assert.equal(store.getState().drones.loading, false);
  } finally {
    api.get = originalGet;
    console.log = originalLog;
  }
});

test('droneSlice: fetchDrones pending/rejected and payload array', async () => {
  const originalGet = api.get;
  const originalLog = console.log;
  try {
    console.log = () => {};
    const before = { items: [], current: null, loading: false, error: null };
    const pending = reducer(before, fetchDrones.pending('req', {}));
    assert.equal(pending.loading, true);

    api.get = async () => ({ data: [{ droneId: 2 }] });
    const store = configureStore({ reducer: { drones: reducer } });
    await store.dispatch(fetchDrones());
    assert.deepEqual(store.getState().drones.items, [{ droneId: 2 }]);

    api.get = async () => { throw new Error('no'); };
    const act = await store.dispatch(fetchDrones());
    assert.equal(act.type, 'drones/fetchAll/rejected');
    assert.equal(store.getState().drones.error, 'no');
  } finally {
    api.get = originalGet;
    console.log = originalLog;
  }
});

test('droneSlice: fetchDroneById/create/update/delete fulfilled', async () => {
  const originalGet = api.get;
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    const store = configureStore({ reducer: { drones: reducer } });
    api.get = async () => ({ data: { droneId: 1 } });
    await store.dispatch(fetchDroneById(1));
    assert.equal(store.getState().drones.current.droneId, 1);

    api.post = async () => ({ data: { droneId: 2 } });
    await store.dispatch(createDrone({}));
    assert.equal(store.getState().drones.items.length, 1);

    api.put = async () => ({ data: { droneId: 2, model: 'X' } });
    await store.dispatch(updateDrone({ id: 2, data: {} }));
    assert.equal(store.getState().drones.items[0].model, 'X');

    api.delete = async () => ({ data: {} });
    await store.dispatch(deleteDrone(2));
    assert.equal(store.getState().drones.items.length, 0);
  } finally {
    api.get = originalGet;
    api.post = originalPost;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});
