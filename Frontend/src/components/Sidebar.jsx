import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import api from '../services/api';

const Sidebar = ({ sidebarOpen, setSidebarOpen, notificationRefresh }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [profile, setProfile] = useState({
    id: user?.id || 0,
    fullName: '',
    email: user?.email || '',
    role: user?.role || 'DRIVER',
  });
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);

  // Fetch profile data (and image) on mount and when notificationRefresh changes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/mine');
        const d = response.data;
        setProfile({
          id: d.id || d.Id || user?.id || 0,
          fullName: d.fullName || d.FullName || '',
          email: d.email || d.Email || user?.email || '',
          role: d.role || d.Role || user?.role || 'DRIVER',
        });
      } catch (error) {
        console.log('Sidebar: could not fetch profile:', error.message);
      }
    };
    fetchProfile();
  }, [notificationRefresh]);

  // Fetch profile image when profile.id or notificationRefresh changes
  useEffect(() => {
    if (!profile.id) return;
    let objectUrl = null;
    const fetchImage = async () => {
      try {
        const response = await api.get(`/files/thumbnail/${profile.id}`, {
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(response.data);
        setProfileImageUrl(objectUrl);
        setProfileImageError(false);
      } catch (error) {
        console.log('Sidebar: could not fetch profile image:', error.message);
        setProfileImageError(true);
      }
    };
    fetchImage();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile.id, notificationRefresh]);
  // Fetch profile image
  useEffect(() => {
    if (!profile.id) return;

    let objectUrl = null;

    const fetchImage = async () => {
      try {
        const response = await api.get(`/files/thumbnail/${profile.id}`, {
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(response.data);
        setProfileImageUrl(objectUrl);
        setProfileImageError(false);
      } catch (error) {
        console.log('Sidebar: could not fetch profile image:', error.message);
        setProfileImageError(true);
      }
    };

    fetchImage();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile.id]);

  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  const getDisplayName = () => {
    if (profile.fullName) return profile.fullName;
    const emailPrefix = profile.email?.split('@')[0] || 'Driver';
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  const getInitials = () => {
    if (profile.fullName) {
      const names = profile.fullName.split(' ');
      if (names.length >= 2) {
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
      }
      return profile.fullName.charAt(0).toUpperCase();
    }
    return profile.email?.charAt(0)?.toUpperCase() || 'D';
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Notifications: fetch when sidebar opens and mark unread state
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);

  // Always fetch notifications on mount, every 60s, and when notificationRefresh changes
  useEffect(() => {
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const list = res?.data || [];
        const unread = list.some(n => {
          if (n == null) return false;
          if (typeof n.read === 'boolean') return !n.read;
          if (typeof n.isRead === 'boolean') return !n.isRead;
          if (typeof n.status === 'string') return n.status.toLowerCase() === 'unread';
          return false;
        });
        if (!cancelled) setHasUnreadNotification(unread);
      } catch {
        if (!cancelled) setHasUnreadNotification(false);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [notificationRefresh]);

  return (
    <>
      {!sidebarOpen && (
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <span className="mobile-menu-btn__bar"></span>
          <span className="mobile-menu-btn__bar"></span>
          <span className="mobile-menu-btn__bar"></span>
        </button>
      )}

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/fleetflow_logo.png" alt="FleetFlow Logo" className="logo-image" />
            <div className="sidebar-brand">
              <span className="brand-name">FleetFlow</span>
              <span className="brand-tagline">Fleet Management</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {profile.role === 'ADMIN' ? (
            <>
              <Link to="/dashboard" className={`nav-item${location.pathname === '/dashboard' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Dashboard
              </Link>
              <Link to="/drivers" className={`nav-item${location.pathname === '/drivers' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.5 21a7.5 7.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Drivers
              </Link>
              <Link to="/vehicles" className={`nav-item${location.pathname === '/vehicles' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="6" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="7.5" cy="17.5" r="1.5"/>
                  <circle cx="16.5" cy="17.5" r="1.5"/>
                </svg>
                Vehicles
              </Link>
              <Link to="/admin-fuel-logs" className={`nav-item${location.pathname === '/admin-fuel-logs' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Fuel Logs
              </Link>
              <Link to="/admin-trips" className={`nav-item${location.pathname === '/admin-trips' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Trips
              </Link>
              <Link to="/admin-service-requests" className={`nav-item${location.pathname === '/admin-service-requests' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Service Requests
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className={`nav-item${location.pathname === '/dashboard' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Dashboard
              </Link>
              <Link to="/fuel-logs" className={`nav-item${location.pathname === '/fuel-logs' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Fuel Logs
              </Link>
              <Link to="/trips" className={`nav-item${location.pathname === '/trips' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Trips
              </Link>
              <Link to="/service-requests" className={`nav-item${location.pathname === '/service-requests' ? ' active' : ''}`}> 
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Service Requests
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile-settings')}>
            <div className="user-avatar">
              {!profileImageError && profileImageUrl ? (
                <img src={profileImageUrl} alt={getDisplayName()} />
              ) : (
                getInitials()
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{getDisplayName()}</p>
              <p className="user-role">{profile.role}</p>
            </div>
          </div>
          <div className="sidebar-actions">
            <button
              className="action-btn"
              title="Notifications"
              aria-label="Notifications"
              style={{ position: 'relative' }}
              onClick={() => navigate('/notifications')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 16v-5a6 6 0 0 0-12 0v5a2 2 0 0 1-2 2h16a2 2 0 0 1-2-2z" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {hasUnreadNotification && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'red',
                    border: '3px solid white',
                    boxShadow: '0 0 0 2px #fb923c',
                    zIndex: 2,
                  }}
                  title="Unread notifications"
                />
              )}
            </button>
            <button
              className="action-btn"
              title="Logout"
              aria-label="Logout"
              onClick={handleLogout}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
