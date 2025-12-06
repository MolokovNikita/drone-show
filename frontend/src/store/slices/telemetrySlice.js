import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTelemetry = createAsyncThunk('telemetry/fetchAll', async (params = {}) => {
  const response = await api.get('/telemetry', { params });
  return response.data;
});

export const fetchLatestTelemetry = createAsyncThunk('telemetry/fetchLatest', async (droneId) => {
  const response = await api.get(`/telemetry/latest/${droneId}`);
  return response.data;
});

const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState: {
    items: [],
    latest: {},
    loading: false,
  },
  reducers: {
    addTelemetryData: (state, action) => {
      state.items.unshift(action.payload);
      if (action.payload.droneId) {
        state.latest[action.payload.droneId] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTelemetry.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(fetchLatestTelemetry.fulfilled, (state, action) => {
        if (action.payload.droneId) {
          state.latest[action.payload.droneId] = action.payload;
        }
      });
  },
});

export const { addTelemetryData } = telemetrySlice.actions;
export default telemetrySlice.reducer;

