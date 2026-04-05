import api from './api';

export const authService = {
  // Login
  async login(email, password) {
    try {
      // Backend expects PascalCase: Email, Password
      const response = await api.post('/login', { Email: email, Password: password });
      
      // Backend returns JWT token directly as string, not as { token: "..." }
      const token = typeof response.data === 'string' ? response.data : (response.data.token || response.data.Token);
      
      if (token) {
        localStorage.setItem('authToken', token);
        
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
          role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
          id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        };
        localStorage.setItem('user', JSON.stringify(user));
        
        // Restore dark mode preference from previous session
        const darkModePreference = localStorage.getItem('fleetflow_darkModePreference');
        if (darkModePreference === 'true') {
          localStorage.setItem('fleetflow_darkMode', 'true');
          document.body.classList.add('dark-mode');
        } else {
          localStorage.removeItem('fleetflow_darkMode');
          document.body.classList.remove('dark-mode');
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
    // Save dark mode preference before clearing
    const isDarkMode = localStorage.getItem('fleetflow_darkMode') === 'true';
    if (isDarkMode) {
      localStorage.setItem('fleetflow_darkModePreference', 'true');
    } else {
      localStorage.removeItem('fleetflow_darkModePreference');
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('fleetflow_darkMode');
    document.body.classList.remove('dark-mode');
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
