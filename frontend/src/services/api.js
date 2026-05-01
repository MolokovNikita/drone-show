import axios from 'axios';

const baseURL =
  (import.meta?.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
  'http://localhost:3001/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken }
        );

        // Backward-compatible parsing: support both { tokens } and flat token payload
        const tokens = response.data.tokens || response.data;
        const accessToken = tokens?.accessToken;
        const nextRefreshToken = tokens?.refreshToken;

        if (!accessToken) {
          throw new Error('Refresh response does not contain access token');
        }

        localStorage.setItem('accessToken', accessToken);
        if (nextRefreshToken) {
          localStorage.setItem('refreshToken', nextRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Format error response for better handling
    const errorResponse = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      error: error.response?.data?.error,
      errors: error.response?.data?.errors
    };

    return Promise.reject(errorResponse);
  }
);

export default api;

