import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/clients', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || error);
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/clients', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || error);
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/clients/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.data || error);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/clients/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.data || error);
    }
  }
);

const clientSlice = createSlice({
  name: 'clients',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || action.payload || [];
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.error.message;
      })
      .addCase(createClient.pending, (state) => {
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.error = action.payload?.error || action.error.message;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.clientId === action.payload.clientId);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.error = action.payload?.error || action.error.message;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.clientId !== action.payload);
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.error = action.payload?.error || action.error.message;
      });
  },
});

export const { clearError } = clientSlice.actions;
export default clientSlice.reducer;
