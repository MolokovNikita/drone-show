import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, {
  fetchShows,
  fetchShowById,
  createShow,
  updateShow,
  deleteShow,
  generateShowWithAI
} from './showSlice.js';
import api from '../../services/api.js';

function makeStore() {
  return configureStore({
    reducer: { shows: reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false
      })
  });
}

test('showSlice: generateShowWithAI.fulfilled pushes payload.show', async () => {
  const originalPost = api.post;
  const originalLog = console.log;
  try {
    console.log = () => {};
    api.post = async () => ({ data: { show: { showId: 7, showName: 'S' } } });

    const store = makeStore();
    const action = await store.dispatch(generateShowWithAI({ prompt: 'x' }));

    assert.equal(action.type, 'shows/generateWithAI/fulfilled');
    assert.deepEqual(store.getState().shows.items, [{ showId: 7, showName: 'S' }]);
    assert.equal(store.getState().shows.loading, false);
  } finally {
    api.post = originalPost;
    console.log = originalLog;
  }
});

test('showSlice: fetchShows pending/rejected and fulfilled stores items', async () => {
  const originalGet = api.get;
  const originalLog = console.log;
  try {
    console.log = () => {};
    const store = makeStore();
    store.dispatch(fetchShows.pending('req', {}));
    assert.equal(store.getState().shows.loading, true);

    api.get = async () => ({ data: { items: [{ showId: 1 }] } });
    await store.dispatch(fetchShows());
    assert.equal(store.getState().shows.loading, false);
    assert.deepEqual(store.getState().shows.items, [{ showId: 1 }]);

    api.get = async () => { throw new Error('boom'); };
    const act = await store.dispatch(fetchShows());
    assert.equal(act.type, 'shows/fetchAll/rejected');
    assert.equal(store.getState().shows.error, 'boom');
  } finally {
    api.get = originalGet;
    console.log = originalLog;
  }
});

test('showSlice: fetchShowById/create/update/delete fulfilled', async () => {
  const originalGet = api.get;
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    const store = makeStore();

    api.get = async () => ({ data: { showId: 1, showName: 'S' } });
    await store.dispatch(fetchShowById(1));
    assert.equal(store.getState().shows.current.showId, 1);

    api.post = async () => ({ data: { showId: 2 } });
    await store.dispatch(createShow({}));
    assert.equal(store.getState().shows.items.length, 1);

    api.put = async () => ({ data: { showId: 2, showName: 'X' } });
    await store.dispatch(updateShow({ id: 2, data: {} }));
    assert.equal(store.getState().shows.items[0].showName, 'X');

    api.delete = async () => ({ data: {} });
    await store.dispatch(deleteShow(2));
    assert.equal(store.getState().shows.items.length, 0);
  } finally {
    api.get = originalGet;
    api.post = originalPost;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});

test('showSlice: generateShowWithAI pending/rejected and fulfilled without show', async () => {
  const originalPost = api.post;
  const originalLog = console.log;
  try {
    console.log = () => {};
    const store = makeStore();
    store.dispatch(generateShowWithAI.pending('req', {}));
    assert.equal(store.getState().shows.loading, true);

    api.post = async () => ({ data: { userView: {} } });
    const ok = await store.dispatch(generateShowWithAI({}));
    assert.equal(ok.type, 'shows/generateWithAI/fulfilled');
    assert.equal(store.getState().shows.loading, false);
    assert.equal(store.getState().shows.items.length, 0);

    api.post = async () => { throw new Error('ai'); };
    const bad = await store.dispatch(generateShowWithAI({}));
    assert.equal(bad.type, 'shows/generateWithAI/rejected');
    // thunk uses rejectWithValue, reducer reads action.error.message ('Rejected')
    assert.equal(store.getState().shows.error, 'Rejected');
  } finally {
    api.post = originalPost;
    console.log = originalLog;
  }
});

test('showSlice thunks: create/update/delete rejectWithValue on api error', async () => {
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    api.post = async () => { throw { data: { error: 'E' } }; };
    api.put = async () => { throw { data: { error: 'E' } }; };
    api.delete = async () => { throw { data: { error: 'E' } }; };
    const store = makeStore();
    assert.equal((await store.dispatch(createShow({}))).type, 'shows/create/rejected');
    assert.equal((await store.dispatch(updateShow({ id: 1, data: {} }))).type, 'shows/update/rejected');
    assert.equal((await store.dispatch(deleteShow(1))).type, 'shows/delete/rejected');
  } finally {
    api.post = originalPost;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});
