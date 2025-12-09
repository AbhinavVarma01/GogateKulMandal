import axios from 'axios';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || '').trim() || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      sessionStorage.removeItem('authToken');
      try {
        const current = window.location?.pathname || '/';
        if (current !== '/login') {
          window.location.replace('/login');
        }
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default api;

export async function apiLogin(email, password) {
  try {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  } catch (error) {
    console.error('Login request failed:', error);
    throw error;
  }
}

export async function apiRegister(payload) {
  try {
    const res = await api.post('/api/auth/register', payload);
    return res.data;
  } catch (error) {
    console.error('Registration request failed:', error);
    throw error;
  }
}
