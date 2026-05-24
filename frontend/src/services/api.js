import axios from 'axios';
import { getToken, logout } from './authService';

// ── PERFORMANCE: Single axios instance — no recreation on each call ──
const API = axios.create({
  baseURL: 'https://smarthubstudy-1.onrender.com',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── SECURITY: Auto-attach JWT token to every request ──
API.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ── SECURITY: Auto handle 401 unauthorized — log user out ──
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;