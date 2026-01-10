import axios from 'axios';

const getApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  // In production, VITE_API_URL must be set (configured in Vercel)
  // For development, fallback to localhost
  if (!envApiUrl) {
    if (import.meta.env.DEV) {
      return 'http://localhost:5000/api';
    }
    // Production without VITE_API_URL - this should not happen
    // Use current origin as fallback (won't work if backend is on different domain)
    console.error('VITE_API_URL is not set in production!');
    return '/api';
  }
  
  // Remove /api suffix if present, then add it back for consistency
  const baseUrl = envApiUrl.replace(/\/api$/, '');
  return `${baseUrl}/api`;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

