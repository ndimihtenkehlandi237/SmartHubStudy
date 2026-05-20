import API from './api';

// ── TOKEN AND USER STORAGE ──
const saveToken = (token) => {
  localStorage.setItem('token', token);
};

const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getToken = () => localStorage.getItem('token');

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ── CHECK IF USER IS LOGGED IN ──
export const isLoggedIn = () => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return false;

  // Check token expiry
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    if (Date.now() > expiry) {
      logout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// ── REGISTER ──
export const registerUser = async (formData) => {
  const response = await API.post('/api/auth/register', {
    fullName: formData.fullName,
    email: formData.email,
    password: formData.password,
    university: formData.university,
  });
  saveToken(response.data.token);
  saveUser(response.data.user);
  return response.data;
};

// ── LOGIN ──
export const loginUser = async (email, password) => {
  const response = await API.post('/api/auth/login', { email, password });
  saveToken(response.data.token);
  saveUser(response.data.user);
  return response.data;
};