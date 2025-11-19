import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
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
      localStorage.removeItem('authToken');
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
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
}

export async function apiRegister(payload) {
  const res = await api.post('/api/auth/register', payload);
  return res.data;
}