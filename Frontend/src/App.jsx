import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SetPassword from './pages/SetPassword';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import HelpCenter from './pages/HelpCenter';
import DriverDashboard from './pages/DriverDashboard';
import FuelLogs from './pages/FuelLogs';
import { authService } from './services/authService';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Home Route - redirects based on auth status
const HomeRoute = () => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

// Admin Dashboard placeholder
const AdminDashboard = () => {
  const user = authService.getCurrentUser();
  
  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <p>Üdvözöllek, {user?.name || user?.email}!</p>
      <button onClick={handleLogout}>Kijelentkezés</button>
    </div>
  );
};

// Dashboard router - redirects based on user role
const DashboardRouter = () => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  
  return isAdmin ? <AdminDashboard /> : <DriverDashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile/set-password" element={<SetPassword />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/fuel-logs"
          element={
            <ProtectedRoute>
              <FuelLogs />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<HomeRoute />} />
      </Routes>
    </Router>
  );
}

export default App;
