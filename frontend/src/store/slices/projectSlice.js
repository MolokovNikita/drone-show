import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params = {}) => {
  const response = await api.get('/projects', { params });
  return response.data;
});

export const fetchProjectById = createAsyncThunk('projects/fetchById', async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
});

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/projects/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload || [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.projectId === action.payload.projectId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.projectId !== action.payload);
      });
  },
});

export default projectSlice.reducer;
