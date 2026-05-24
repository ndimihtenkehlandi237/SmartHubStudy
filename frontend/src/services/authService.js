import API from './api';

// ── SECURITY: Token helpers ──
export const saveToken = token => localStorage.setItem('token', token);
export const saveUser = user => localStorage.setItem('user', JSON.stringify(user));
export const getToken = () => localStorage.getItem('token');

export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    // Corrupted data — clear it
    localStorage.removeItem('user');
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('language');
};

// ── SECURITY: Check if token is valid and not expired ──
export const isLoggedIn = () => {
  try {
    const token = getToken();
    const user = getUser();
    if (!token || !user) return false;

    // Decode JWT payload without library
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryMs = payload.exp * 1000;

    if (Date.now() > expiryMs) {
      // Token expired — clean up
      logout();
      return false;
    }

    return true;
  } catch {
    logout();
    return false;
  }
};

// ── REGISTER ──
export const registerUser = async formData => {
  const response = await API.post('/api/auth/register', {
    fullName: formData.fullName,
    email: formData.email,
    password: formData.password,
    university: formData.university,
    language: formData.language || 'en',
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