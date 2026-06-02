import API from './api';

export const getToken = () => {
  try { return localStorage.getItem('token'); }
  catch { return null; }
};

export const getUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const saveToken = t => localStorage.setItem('token', t);
export const saveUser = u => localStorage.setItem('user', JSON.stringify(u));

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isLoggedIn = () => {
  try {
    const token = getToken();
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (Date.now() > payload.exp * 1000) { logout(); return false; }
    return true;
  } catch {
    return false;
  }
};

export const loginUser = async (email, password) => {
  const res = await API.post('/api/auth/login', { email, password });
  saveToken(res.data.token);
  saveUser(res.data.user);
  return res.data;
};

export const registerUser = async (data) => {
  const res = await API.post('/api/auth/register', data);
  saveToken(res.data.token);
  saveUser(res.data.user);
  return res.data;
};