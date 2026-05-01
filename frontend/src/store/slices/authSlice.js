import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const login = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('accessToken', response.data.tokens.accessToken);
    localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    localStorage.setItem('accessToken', response.data.tokens.accessToken);
    localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.data || error);
  }
});

export const getProfile = createAsyncThunk('auth/getProfile', async () => {
  const response = await api.get('/auth/profile');
  return response.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: typeof localStorage !== 'undefined' && !!localStorage.getItem('accessToken'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        // Parse error response
        if (action.payload) {
          state.error = action.payload.error || action.payload.message || 'Login failed';
        } else {
          state.error = action.error.message || 'Login failed';
        }
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        // Parse error response
        if (action.payload) {
          state.error = {
            error: action.payload.error || 'Registration failed',
            errors: action.payload.errors || []
          };
        } else {
          state.error = action.error.message || 'Registration failed';
        }
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

