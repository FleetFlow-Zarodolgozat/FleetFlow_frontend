import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SetPassword from './pages/SetPassword';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import HelpCenter from './pages/HelpCenter';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import FuelLogs from './pages/FuelLogs';
import AddFuelLog from './pages/AddFuelLog';
import AddServiceRequest from './pages/AddServiceRequest';
import Trips from './pages/Trips';
import AddNewTrip from './pages/AddNewTrip';
import ServiceRequests from './pages/ServiceRequests';
import ServiceRequestDetails from './pages/ServiceRequestDetails';
import ProfileSettings from './pages/ProfileSettings';
import Drivers from './pages/Drivers';
import EditDriver from './pages/EditDriver';
import AddDriver from './pages/AddDriver';
import Vehicles from './pages/Vehicles';
import AdminFuelLogs from './pages/AdminFuelLogs';
import AdminFuelLogDetails from './pages/AdminFuelLogDetails';
import AdminTrips from './pages/AdminTrips';
import AdminTripDetails from './pages/AdminTripDetails';
import AdminServiceRequests from './pages/AdminServiceRequests';
import AdminServiceRequestDetails from './pages/AdminServiceRequestDetails';
import EditVehicle from './pages/EditVehicle';
import AddVehicle from './pages/AddVehicle';
import { authService } from './services/authService';
import './App.css';
import './styles/dark-mode.css';

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

// Dashboard router - redirects based on user role
const DashboardRouter = () => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.role && user.role.toLowerCase() === 'admin';
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
  <Route path="/add-fuel-log" element={<ProtectedRoute><AddFuelLog /></ProtectedRoute>} />
  <Route path="/add-service-request" element={<ProtectedRoute><AddServiceRequest /></ProtectedRoute>} />
        <Route path="/add-new-trip" element={
          <ProtectedRoute>
            <AddNewTrip />
          </ProtectedRoute>
        } />
        <Route path="/trips" element={
          <ProtectedRoute>
            <Trips />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/service-requests" element={
          <ProtectedRoute>
            <ServiceRequests />
          </ProtectedRoute>
        } />
        <Route path="/service-request-details" element={
          <ProtectedRoute>
            <ServiceRequestDetails />
          </ProtectedRoute>
        } />
        <Route path="/profile-settings" element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        } />
        <Route path="/drivers" element={
          <ProtectedRoute>
            <Drivers />
          </ProtectedRoute>
        } />
        <Route path="/drivers/:id/edit" element={
          <ProtectedRoute>
            <EditDriver />
          </ProtectedRoute>
        } />
        <Route path="/add-driver" element={
          <ProtectedRoute>
            <AddDriver />
          </ProtectedRoute>
        } />
        <Route path="/vehicles" element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        } />
        <Route path="/vehicles/:id/edit" element={
          <ProtectedRoute>
            <EditVehicle />
          </ProtectedRoute>
        } />
        <Route path="/add-vehicle" element={
          <ProtectedRoute>
            <AddVehicle />
          </ProtectedRoute>
        } />
        <Route path="/admin-fuel-logs" element={
          <ProtectedRoute>
            <AdminFuelLogs />
          </ProtectedRoute>
        } />
        <Route path="/admin-fuel-log-details" element={
          <ProtectedRoute>
            <AdminFuelLogDetails />
          </ProtectedRoute>
        } />
        <Route path="/admin-trips" element={
          <ProtectedRoute>
            <AdminTrips />
          </ProtectedRoute>
        } />
        <Route path="/admin-trip-details" element={
          <ProtectedRoute>
            <AdminTripDetails />
          </ProtectedRoute>
        } />
        <Route path="/admin-service-requests" element={
          <ProtectedRoute>
            <AdminServiceRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin-service-request-details" element={
          <ProtectedRoute>
            <AdminServiceRequestDetails />
          </ProtectedRoute>
        } />
        <Route path="/" element={<HomeRoute />} />
      </Routes>
    </Router>
  );
}

export default App;
