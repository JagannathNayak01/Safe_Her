import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'http://localhost:5000/api',
  withCredentials: true,   // send & receive httpOnly cookies automatically
});

// No token injection needed — the browser sends the httpOnly cookie automatically.

// Handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Cookie expired / invalid — clear UI flag and redirect to login
      localStorage.removeItem('safeher_logged_in');
      localStorage.removeItem('userName');
      localStorage.removeItem('userAvatar');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
