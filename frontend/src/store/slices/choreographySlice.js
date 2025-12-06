import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchChoreographies = createAsyncThunk('choreographies/fetchAll', async (params = {}) => {
  console.log('🎭 [ChoreographySlice] Загружаю хореографии с параметрами:', params);
  const response = await api.get('/choreographies', { params });
  console.log('✅ [ChoreographySlice] Хореографии загружены:', response.data?.items?.length || response.data?.length || 0);
  return response.data;
});

export const fetchChoreographyById = createAsyncThunk('choreographies/fetchById', async (id) => {
  console.log('🎭 [ChoreographySlice] Загружаю хореографию по ID:', id);
  const response = await api.get(`/choreographies/${id}`);
  console.log('✅ [ChoreographySlice] Хореография загружена:', response.data?.choreographyId || response.data?.id);
  if (response.data?.flightPaths) {
    console.log('  🛤️ Flight paths в хореографии:', response.data.flightPaths.length);
  }
  return response.data;
});

export const createChoreography = createAsyncThunk('choreographies/create', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/choreographies', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error);
  }
});

export const updateChoreography = createAsyncThunk('choreographies/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/choreographies/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error);
  }
});

export const deleteChoreography = createAsyncThunk('choreographies/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/choreographies/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error);
  }
});

const choreographySlice = createSlice({
  name: 'choreographies',
  initialState: {
    items: [],
    current: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrent: (state, action) => {
      state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChoreographies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChoreographies.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload.items || action.payload || [];
        state.items = items;
        console.log('✅ [ChoreographySlice] Хореографии сохранены в Redux:', items.length);
        if (items.length > 0) {
          console.log('📋 [ChoreographySlice] Детали сохраненных хореографий:', items.map(c => ({
            choreographyId: c.choreographyId,
            showId: c.showId,
            name: c.choreographyName
          })));
        }
      })
      .addCase(fetchChoreographies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchChoreographyById.fulfilled, (state, action) => {
        state.current = action.payload;
        console.log('✅ [ChoreographySlice] Текущая хореография установлена:', action.payload?.choreographyId || action.payload?.id);
        if (action.payload?.flightPaths) {
          console.log('  🛤️ Flight paths в текущей хореографии:', action.payload.flightPaths.length);
        }
      })
      .addCase(createChoreography.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateChoreography.fulfilled, (state, action) => {
        const index = state.items.findIndex((c) => c.choreographyId === action.payload.choreographyId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.current?.choreographyId === action.payload.choreographyId) {
          state.current = action.payload;
        }
      })
      .addCase(deleteChoreography.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.choreographyId !== action.payload);
        if (state.current?.choreographyId === action.payload) {
          state.current = null;
        }
      });
  },
});

export const { setCurrent } = choreographySlice.actions;
export default choreographySlice.reducer;

