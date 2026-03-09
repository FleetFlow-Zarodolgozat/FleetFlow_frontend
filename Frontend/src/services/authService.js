import api from './api';

export const authService = {
  // Login
  async login(email, password) {
    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Register
  async register(userData) {
    const response = await api.post('/register', userData);
    return response.data;
  },

  // Forgot Password
  async forgotPassword(email) {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
};
