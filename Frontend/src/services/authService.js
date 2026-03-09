import api from './api';

export const authService = {
  // Login
  async login(email, password) {
    console.log('Attempting login to:', api.defaults.baseURL + '/login');
    try {
      const response = await api.post('/login', { email, password });
      console.log('Login response:', response.data);
      
      // Handle different response formats (camelCase or PascalCase)
      const token = response.data.token || response.data.Token;
      const user = response.data.user || response.data.User;
      
      if (token) {
        localStorage.setItem('authToken', token);
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Forgot Password - request password reset email
  async forgotPassword(email) {
    const response = await api.post('/profile/forgot-password', { email });
    return response.data;
  },

  // Set Password - set new password with token (for new users and password reset)
  async setPassword(token, password, confirmPassword) {
    const response = await api.post('/profile/set-password', { 
      token, 
      password, 
      confirmPassword 
    });
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
