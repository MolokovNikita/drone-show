import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDrones = createAsyncThunk('drones/fetchAll', async (params = {}) => {
  console.log('🚁 [DroneSlice] Загружаю дроны с параметрами:', params);
  const response = await api.get('/drones', { params });
  console.log('✅ [DroneSlice] Дроны загружены:', response.data?.items?.length || response.data?.length || 0);
  return response.data;
});

export const fetchDroneById = createAsyncThunk('drones/fetchById', async (id) => {
  const response = await api.get(`/drones/${id}`);
  return response.data;
});

export const createDrone = createAsyncThunk('drones/create', async (droneData) => {
  const response = await api.post('/drones', droneData);
  return response.data;
});

export const updateDrone = createAsyncThunk('drones/update', async ({ id, data }) => {
  const response = await api.put(`/drones/${id}`, data);
  return response.data;
});

export const deleteDrone = createAsyncThunk('drones/delete', async (id) => {
  await api.delete(`/drones/${id}`);
  return id;
});

const droneSlice = createSlice({
  name: 'drones',
  initialState: {
    items: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrones.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDrones.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload.items || action.payload || [];
        state.items = items;
        console.log('✅ [DroneSlice] Дроны сохранены в Redux:', items.length);
      })
      .addCase(fetchDrones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchDroneById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createDrone.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateDrone.fulfilled, (state, action) => {
        const index = state.items.findIndex((d) => d.droneId === action.payload.droneId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteDrone.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.droneId !== action.payload);
      });
  },
});

export default droneSlice.reducer;

