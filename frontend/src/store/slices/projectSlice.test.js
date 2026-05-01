import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, { fetchProjects, fetchProjectById, createProject, updateProject, deleteProject } from './projectSlice.js';
import api from '../../services/api.js';

test('projectSlice: createProject.fulfilled appends new project', async () => {
  const originalPost = api.post;
  try {
    api.post = async () => ({ data: { projectId: 10, name: 'P' } });

    const store = configureStore({ reducer: { projects: reducer } });
    const action = await store.dispatch(createProject({ name: 'P' }));

    assert.equal(action.type, 'projects/create/fulfilled');
    assert.deepEqual(store.getState().projects.items, [{ projectId: 10, name: 'P' }]);
  } finally {
    api.post = originalPost;
  }
});

test('projectSlice: fetchProjects pending/fulfilled/rejected', async () => {
  const originalGet = api.get;
  try {
    const store = configureStore({ reducer: { projects: reducer } });
    store.dispatch(fetchProjects.pending('req', {}));
    assert.equal(store.getState().projects.loading, true);

    api.get = async () => ({ data: { items: [{ projectId: 1 }] } });
    await store.dispatch(fetchProjects());
    assert.deepEqual(store.getState().projects.items, [{ projectId: 1 }]);

    api.get = async () => { throw new Error('boom'); };
    const act = await store.dispatch(fetchProjects());
    assert.equal(act.type, 'projects/fetchAll/rejected');
    assert.equal(store.getState().projects.error, 'boom');
  } finally {
    api.get = originalGet;
  }
});

test('projectSlice: fetchProjectById/update/delete fulfilled and rejectWithValue paths', async () => {
  const originalGet = api.get;
  const originalPut = api.put;
  const originalDelete = api.delete;
  try {
    const store = configureStore({ reducer: { projects: reducer } });
    api.get = async () => ({ data: { projectId: 2 } });
    await store.dispatch(fetchProjectById(2));
    assert.equal(store.getState().projects.current.projectId, 2);

    store.dispatch(createProject.fulfilled({ projectId: 2, name: 'A' }, 'req', {}));
    api.put = async () => ({ data: { projectId: 2, name: 'B' } });
    await store.dispatch(updateProject({ id: 2, data: {} }));
    assert.equal(store.getState().projects.items[0].name, 'B');

    api.delete = async () => ({ data: {} });
    await store.dispatch(deleteProject(2));
    assert.equal(store.getState().projects.items.length, 0);

    // rejectWithValue branches (thunk catch)
    api.put = async () => { throw { data: { error: 'E' } }; };
    api.delete = async () => { throw { data: { error: 'E' } }; };
    assert.equal((await store.dispatch(updateProject({ id: 2, data: {} }))).type, 'projects/update/rejected');
    assert.equal((await store.dispatch(deleteProject(2))).type, 'projects/delete/rejected');
  } finally {
    api.get = originalGet;
    api.put = originalPut;
    api.delete = originalDelete;
  }
});

test('projectSlice: createProject rejectWithValue on api error', async () => {
  const originalPost = api.post;
  try {
    api.post = async () => { throw { data: { error: 'E' } }; };
    const store = configureStore({ reducer: { projects: reducer } });
    const act = await store.dispatch(createProject({}));
    assert.equal(act.type, 'projects/create/rejected');
  } finally {
    api.post = originalPost;
  }
});
