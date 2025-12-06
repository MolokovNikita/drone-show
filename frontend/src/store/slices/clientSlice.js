import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchClients = createAsyncThunk('clients/fetchAll', async (params = {}) => {
  const response = await api.get('/clients', { params });
  return response.data;
});

const clientSlice = createSlice({
  name: 'clients',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.items = action.payload.items || action.payload || [];
      });
  },
});

export default clientSlice.reducer;

