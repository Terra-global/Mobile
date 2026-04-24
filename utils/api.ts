import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Automatic switcher: Uses Local IP for development, Render for production
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.126.36.245:4000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
