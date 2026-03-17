import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { authService } from '../services/authService';
import '../styles/DriverDashboard.css';
import { Spinner, Button } from 'react-bootstrap';

const Trips = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({
    id: user?.id || 0,
    fullName: '',
    email: user?.email || '',
    role: user?.role || 'DRIVER',
  });
  const [profileImageError, setProfileImageError] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileResponse = await api.get('/profile/mine');
        const profileData = profileResponse.data;
        setProfile({
          id: profileData.id || profileData.Id || user?.id || 0,
          fullName: profileData.fullName || profileData.FullName || '',
          email: profileData.email || profileData.Email || user?.email || '',
          role: profileData.role || profileData.Role || user?.role || 'DRIVER',
        });
      } catch (profileErr) {
        // Silent fail
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!profile.id) return;
      try {
        const response = await api.get(`/files/thumbnail/${profile.id}`, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(response.data);
        setProfileImageUrl(imageUrl);
        setProfileImageError(false);
      } catch (profileImageErr) {
        setProfileImageError(true);
      }
    };
    fetchProfileImage();
    return () => {
      if (profileImageUrl) URL.revokeObjectURL(profileImageUrl);
    };
  }, [profile.id]);

  const getDisplayName = () => {
    if (profile.fullName) return profile.fullName;
    const emailPrefix = profile.email?.split('@')[0] || user?.email?.split('@')[0] || 'Driver';
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };
  const getInitials = () => {
    if (profile.fullName) {
      const names = profile.fullName.split(' ');
      if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      return profile.fullName.charAt(0).toUpperCase();
    }
    return (profile.email || user?.email || 'D').charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/trips/mine', { params: { page: 1, pageSize: 10 } });
        setTrips(response.data.data || []);
      } catch (err) {
        setError('Hiba történt az utazások lekérésekor!');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Biztosan törlöd ezt az utazást?')) return;
    // TODO: Implement delete endpoint if available
    alert('Törlés funkció még nincs implementálva.');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
  };

  return (
    <div className="driver-dashboard">
      {!sidebarOpen && (
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="28" height="28" fill="none" stroke="#ffffff" strokeWidth="3" viewBox="0 0 24 24">
            <polyline points="9,6 15,12 9,18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
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
          <Link to="/dashboard" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </Link>
          <Link to="/fuel-logs" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Fuel Logs
          </Link>
          <Link to="/trips" className="nav-item active">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Trips
          </Link>
          <Link to="/service-requests" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Service Requests
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
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
            <button className="action-btn" title="Logout" aria-label="Logout" onClick={handleLogout}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16,17 21,12 16,7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="shadow-lg border-0 rounded-4">
                <Card.Header className="bg-white rounded-top-4 d-flex align-items-center gap-2 border-bottom" style={{minHeight: 60}}>
                  <svg width="32" height="32" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="fs-5 fw-semibold text-primary">Trips</span>
                </Card.Header>
                <Card.Body className="p-4">
                  {loading ? (
                    <div className="py-5 text-center">
                      <Spinner animation="border" role="status" />
                    </div>
                  ) : error ? (
                    <div className="py-5 text-center text-danger">{error}</div>
                  ) : trips.length === 0 ? (
                    <div className="py-5 text-center text-muted">Nincs utazás.</div>
                  ) : (
                    <div className="trip-list">
                      {trips.map(trip => (
                        <Card key={trip.Id || trip.id} className="fuel-log-card border-0 shadow-sm">
                          <Card.Body className="p-3 p-md-4">
                            <div className="fuel-log-accent mb-3" />
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                              <div className="d-flex align-items-center gap-2 min-w-0">
                                <span className="fuel-log-calendar-icon">
                                  <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                                <span className="fuel-log-date fw-semibold">{formatDate(trip.StartTime)}</span>
                              </div>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Törlés"
                                style={{ borderRadius: '50%', width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => handleDeleteTrip(trip.Id || trip.id)}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </Button>
                            </div>
                            <div className="fuel-log-divider mb-3" />
                            <div className="fuel-log-details">
                              <div className="fuel-log-detail-row lcp-row">
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563eb" style={{marginRight: 2}}><path d="M12 2C12 2 5 11 5 16a7 7 0 0 0 14 0c0-5-7-14-7-14z"/><path d="M12 21a5 5 0 0 1-5-5c0-3.07 4.13-9.14 5-10.32C14.87 6.86 19 12.93 19 16a5 5 0 0 1-5 5z" fill="#2563eb"/></svg>
                                  <span className="fuel-log-label">From</span>
                                  <span className="fuel-log-value text-warning-emphasis ms-2">{trip.StartLocation}</span>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#22c55e" style={{marginRight: 2}}><path d="M3 20L8 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 20L16 4" strokeLinecap="round" strokeLinejoin="round"/><line x1="10" y1="16" x2="14" y2="16" strokeLinecap="round" strokeLinejoin="round"/><line x1="10.5" y1="12" x2="13.5" y2="12" strokeLinecap="round" strokeLinejoin="round"/><line x1="11" y1="8" x2="13" y2="8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  <span className="fuel-log-label">Distance</span>
                                  <span className="fuel-log-value text-success ms-2">{trip.DistanceKm?.toLocaleString('hu-HU',{minimumFractionDigits:1,maximumFractionDigits:1}) || 'N/A'} km</span>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fb923c" style={{marginRight: 2}}>
                                    <rect x="4" y="10" width="16" height="6" rx="2" />
                                    <circle cx="7" cy="18" r="1.5" />
                                    <circle cx="17" cy="18" r="1.5" />
                                  </svg>
                                  <span className="fuel-log-label">Plate</span>
                                  <span className="fuel-log-value text-primary ms-2">{trip.LicensePlate}</span>
                                </div>
                              </div>
                              <div className="fuel-log-detail-row" style={{gap: '0.5rem', justifyContent: 'flex-start'}}>
                                <span style={{display: 'flex', alignItems: 'center', color: '#2563eb'}}>
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}>
                                    <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.25 10.25 8.25 10.92a1 1 0 0 0 1.5 0C13.75 21.25 21 16.25 21 11c0-4.97-4.03-9-9-9zm0 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                                    <circle cx="12" cy="11" r="2" fill="#2563eb" />
                                  </svg>
                                  <span
                                    className="fuel-log-value"
                                    style={{
                                      marginLeft: 0,
                                      textAlign: 'left',
                                      color: '#2563eb',
                                      fontWeight: 600,
                                      fontSize: '1.1em',
                                    }}
                                  >
                                    {trip.StartLocation} &rarr; {trip.EndLocation}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default Trips;
