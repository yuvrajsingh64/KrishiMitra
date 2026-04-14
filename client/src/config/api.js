import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request if available
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('userInfo');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) { /* ignore */ }
  }
  return config;
});

export { API_URL };
export default api;
