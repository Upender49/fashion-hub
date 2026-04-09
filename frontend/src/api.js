import axios from 'axios';

// Ensure the frontend hits the backend when served directly or using an absolute URL
const API_BASE = 'https://fashion-hub-1-cdmi.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
