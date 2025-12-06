import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAlerts = createAsyncThunk('alerts/fetchAll', async (params = {}) => {
  const response = await api.get('/alerts', { params });
  return response.data;
});

export const acknowledgeAlert = createAsyncThunk('alerts/acknowledge', async (id) => {
  const response = await api.post(`/alerts/${id}/acknowledge`);
  return response.data;
});

const alertSlice = createSlice({
  name: 'alerts',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {
    addAlert: (state, action) => {
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const index = state.items.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { addAlert } = alertSlice.actions;
export default alertSlice.reducer;

