import axios from 'axios';

const saveToken = (token) => localStorage.setItem('token', token);
const saveUser = (user) => localStorage.setItem('user', JSON.stringify(user));

export const getToken = () => localStorage.getItem('token');
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const registerUser = async (formData) => {
  const response = await axios.post('/api/auth/register', {
    fullName: formData.fullName,
    email: formData.email,
    password: formData.password,
    university: formData.university,
  });
  saveToken(response.data.token);
  saveUser(response.data.user);
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await axios.post('/api/auth/login', { email, password });
  saveToken(response.data.token);
  saveUser(response.data.user);
  return response.data;
};