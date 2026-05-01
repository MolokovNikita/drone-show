import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchShows = createAsyncThunk('shows/fetchAll', async (params = {}) => {
  console.log('📺 [ShowSlice] Загружаю шоу с параметрами:', params);
  const response = await api.get('/shows', { params });
  console.log('✅ [ShowSlice] Шоу загружены:', response.data?.items?.length || response.data?.length || 0);
  return response.data;
});

export const fetchShowById = createAsyncThunk('shows/fetchById', async (id) => {
  const response = await api.get(`/shows/${id}`);
  return response.data;
});

export const createShow = createAsyncThunk('shows/create', async (showData, { rejectWithValue }) => {
  try {
    const response = await api.post('/shows', showData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

export const updateShow = createAsyncThunk('shows/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/shows/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

export const deleteShow = createAsyncThunk('shows/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/shows/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

export const generateShowWithAI = createAsyncThunk('shows/generateWithAI', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/shows/generate', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

const showSlice = createSlice({
  name: 'shows',
  initialState: {
    items: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShows.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShows.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload.items || action.payload || [];
        state.items = items;
        console.log('✅ [ShowSlice] Шоу сохранены в Redux:', items.length);
      })
      .addCase(fetchShows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchShowById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createShow.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateShow.fulfilled, (state, action) => {
        const index = state.items.findIndex((s) => s.showId === action.payload.showId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteShow.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.showId !== action.payload);
      })
      .addCase(generateShowWithAI.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateShowWithAI.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.show) {
          state.items.push(action.payload.show);
        }
      })
      .addCase(generateShowWithAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default showSlice.reducer;
