import axios from 'axios';

const API = axios.create({
  baseURL: 'https://smarthubstudy-1.onrender.com',
});

export default API;