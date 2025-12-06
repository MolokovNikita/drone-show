import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchFlightPaths = createAsyncThunk('flightPaths/fetchAll', async (params = {}) => {
  console.log('🛤️ [FlightPathSlice] Загружаю flight paths с параметрами:', params);
  const response = await api.get('/flight-paths', { params });
  console.log('✅ [FlightPathSlice] Flight paths загружены:', response.data?.items?.length || response.data?.length || 0);
  return response.data;
});

export const createFlightPath = createAsyncThunk('flightPaths/create', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/flight-paths', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error);
  }
});

export const updateFlightPath = createAsyncThunk('flightPaths/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/flight-paths/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error);
  }
});

export const deleteFlightPath = createAsyncThunk('flightPaths/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/flight-paths/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error);
  }
});

export const bulkUpdateFlightPaths = createAsyncThunk('flightPaths/bulkUpdate', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/flight-paths/bulk', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error);
  }
});

const flightPathSlice = createSlice({
  name: 'flightPaths',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlightPaths.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFlightPaths.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload.items || action.payload || [];
        console.log('✅ [FlightPathSlice] Flight paths сохранены в Redux:', items.length);
        if (items.length > 0) {
          console.log('📋 [FlightPathSlice] Первые 3 пути:', items.slice(0, 3).map(fp => ({
            pathId: fp.pathId || fp.path_id,
            droneId: fp.droneId || fp.drone_id,
            choreographyId: fp.choreographyId || fp.choreography_id
          })));
        }
        state.items = items;
      })
      .addCase(fetchFlightPaths.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createFlightPath.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateFlightPath.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.pathId === action.payload.pathId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteFlightPath.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.pathId !== action.payload);
      })
      .addCase(bulkUpdateFlightPaths.fulfilled, (state, action) => {
        state.items = action.payload.items || action.payload || [];
      });
  },
});

export default flightPathSlice.reducer;

