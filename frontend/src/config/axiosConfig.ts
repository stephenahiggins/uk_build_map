import axios from 'axios';
import useTokenStore from '../store/tokenStore';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = useTokenStore.getState().token; // Retrieve the token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error response indicates an expired JWT
    if (
      error.response &&
      error.response.data &&
      error.response.data.error === 'jwt expired'
    ) {
      // Clear token from store and localStorage (if used)
      if (useTokenStore.getState().logout) {
        useTokenStore.getState().logout();
      }
      localStorage.removeItem('token'); // Adjust if your token uses a different key

      // Optionally, show a message
      alert('Session expired. Please log in again.');

      // Redirect to login page
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
