import axios from 'axios';

const API = axios.create({
  baseURL: 'https://smarthubstudy-1.onrender.com',
  timeout: 10000,
});

API.interceptors.response.use(
  r => r,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;