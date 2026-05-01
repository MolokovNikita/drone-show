import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, { addTelemetryData, fetchTelemetry, fetchLatestTelemetry } from './telemetrySlice.js';
import api from '../../services/api.js';

test('telemetrySlice: addTelemetryData unshifts items and updates latest', () => {
  const before = { items: [], latest: {}, loading: false };
  const after = reducer(before, addTelemetryData({ droneId: 5, value: 1 }));
  assert.equal(after.items.length, 1);
  assert.deepEqual(after.latest[5], { droneId: 5, value: 1 });
});

test('telemetrySlice: fetchLatestTelemetry.fulfilled updates latest[droneId]', async () => {
  const originalGet = api.get;
  try {
    api.get = async () => ({ data: { droneId: 3, altitude: 10 } });
    const store = configureStore({ reducer: { telemetry: reducer } });
    const action = await store.dispatch(fetchLatestTelemetry(3));
    assert.equal(action.type, 'telemetry/fetchLatest/fulfilled');
    assert.deepEqual(store.getState().telemetry.latest[3], { droneId: 3, altitude: 10 });
  } finally {
    api.get = originalGet;
  }
});

test('telemetrySlice: addTelemetryData does not update latest when droneId missing', () => {
  const before = { items: [], latest: {}, loading: false };
  const after = reducer(before, addTelemetryData({ value: 1 }));
  assert.equal(after.items.length, 1);
  assert.deepEqual(after.latest, {});
});

test('telemetrySlice: fetchTelemetry.fulfilled replaces items', async () => {
  const originalGet = api.get;
  try {
    api.get = async () => ({ data: [{ telemetryId: 1 }] });
    const store = configureStore({ reducer: { telemetry: reducer } });
    const action = await store.dispatch(fetchTelemetry());
    assert.equal(action.type, 'telemetry/fetchAll/fulfilled');
    assert.deepEqual(store.getState().telemetry.items, [{ telemetryId: 1 }]);
  } finally {
    api.get = originalGet;
  }
});

test('telemetrySlice: fetchLatestTelemetry.fulfilled does nothing when payload has no droneId', () => {
  const before = { items: [], latest: {}, loading: false };
  const after = reducer(before, fetchLatestTelemetry.fulfilled({ altitude: 1 }, 'req', 1));
  assert.deepEqual(after.latest, {});
});

