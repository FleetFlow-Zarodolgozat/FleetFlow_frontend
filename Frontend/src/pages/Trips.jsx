import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Pagination, Badge, Alert } from 'react-bootstrap';
import api from '../services/api';
import { authService } from '../services/authService';
import '../styles/Trips.css';
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
  const [pagination, setPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 10,
  });
  const totalPages = Math.max(1, Math.ceil((pagination.totalCount || 0) / pagination.pageSize));

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

  const fetchTrips = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/trips/mine', {
        params: {
          page: pageToLoad,
          pageSize: pagination.pageSize,
        },
      });
      const payload = response.data || {};
      setTrips(Array.isArray(payload.data) ? payload.data : []);
      setPagination({
        totalCount: payload.totalCount || 0,
        page: payload.page || pageToLoad,
        pageSize: payload.pageSize || pagination.pageSize,
      });
    } catch (err) {
      setError('Hiba történt az utazások lekérésekor!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips(1);
  }, []);
  const buildPagination = () => {
    const items = [];
    const current = pagination.page;
    for (let i = 1; i <= totalPages; i += 1) {
      if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
        items.push(
          <Pagination.Item key={i} active={i === current} onClick={() => fetchTrips(i)}>
            {i}
          </Pagination.Item>
        );
      } else if (i === current - 2 || i === current + 2) {
        items.push(<Pagination.Ellipsis key={`ellipsis-${i}`} disabled />);
      }
    }
    return items;
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Biztosan törlöd ezt az utazást?')) return;
    // TODO: Implement delete endpoint if available
    alert('Törlés funkció még nincs implementálva.');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="trips-dashboard">
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
        <Container className="py-2">
          <Row className="g-3 mb-3 align-items-center">
            <Col md={8}>
              <h1 className="fuel-logs-title mb-1">Trips</h1>
              <p className="text-muted mb-0">Your own trips ordered by latest date.</p>
            </Col>
            <Col md={4} className="d-flex gap-2 justify-content-md-end">
              <Button
                variant="primary"
                style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff', fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.15)', transition: 'background 0.2s, border-color 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = '#1746a2'; e.currentTarget.style.borderColor = '#1746a2'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; }}
                className="mb-3 d-flex align-items-center gap-2"
                onClick={() => navigate('/add-fuel-log')}
              >
                <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                New
              </Button>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col md={12} lg={12} style={{ width: '100%', maxWidth: '100%' }}>
              <Card className="border-0 rounded-4" style={{ width: '100%', maxWidth: '100%', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>
                <Card.Header className="bg-white rounded-top-4 d-flex align-items-center justify-content-between gap-2 border-bottom" style={{ minHeight: 60 }}>
                  <span className="fs-5 fw-semibold">My Trips</span>
                  <Badge bg="primary">Total: {pagination.totalCount}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="py-5 text-center">
                      <Spinner animation="border" role="status" />
                    </div>
                  ) : error ? (
                    <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
                  ) : trips.length === 0 ? (
                    <div className="py-5 text-center text-muted">No trips found.</div>
                  ) : (
                    <div className="p-3">
                      <div className="trip-list">
                        {trips.map(trip => (
                          <Card key={trip.Id || trip.id} className="trip-card border-0 shadow-sm" style={{ width: '100%', maxWidth: '100%', marginBottom: '2.5rem', boxShadow: '0 8px 24px 0 rgba(37,99,235,0.25) !important' }}>
                            <Card.Body className="p-3 p-md-4">
                              <div className="trip-accent mb-3" style={{ height: '4px', width: '100%', background: '#2563eb', borderRadius: '2px' }}></div>
                              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                <div className="d-flex align-items-center gap-2 min-w-0">
                                  {/* Route icon */}
                                  <span style={{ display: 'flex', alignItems: 'center', color: '#2563eb' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                                      <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.25 10.25 8.25 10.92a1 1 0 0 0 1.5 0C13.75 21.25 21 16.25 21 11c0-4.97-4.03-9-9-9zm0 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                                      <circle cx="12" cy="11" r="2" fill="#2563eb" />
                                    </svg>
                                    <span
                                      className="trip-value"
                                      style={{ marginLeft: 0, textAlign: 'left', color: '#2563eb', fontWeight: 600, fontSize: '1.1em' }}
                                    >
                                      {(trip.StartLocation || trip.startLocation) + ' → ' + (trip.EndLocation || trip.endLocation)}
                                    </span>
                                  </span>
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
                              <div className="trip-divider mb-3"></div>
                              <div className="trip-details">
                                <div className="trip-detail-row trip-date-row lcp-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', width: '100%', flexWrap: 'nowrap', padding: '0.5rem 0', overflowX: 'auto' }}>
                                  {/* Date */}
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, verticalAlign: 'middle' }}>
                                    <span className="trip-calendar-icon" style={{ flexShrink: 0, marginLeft: 5, padding: 0, background: 'none', display: 'flex', alignItems: 'center', height: '24px' }}>
                                      <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}>
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </span>
                                    <span className="trip-label" style={{ marginLeft: 5, fontWeight: 500, display: 'flex', alignItems: 'center', height: '24px' }}>Date</span>
                                    <span className="trip-value ms-2" style={{ marginLeft: 0, color: '#2563eb', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: '24px' }}>{formatDate(trip.StartTime || trip.startTime)}</span>
                                  </div>
                                  {/* Distance */}
                                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'visible', whiteSpace: 'normal', verticalAlign: 'middle' }}>
                                    <span className="trip-distance-icon" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', height: '24px' }}>
                                      <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}>
                                        <path d="M3 20L8 4" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M21 20L16 4" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="10" y1="16" x2="14" y2="16" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="10.5" y1="12" x2="13.5" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="11" y1="8" x2="13" y2="8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </span>
                                    <span className="trip-label" style={{ marginLeft: 5, fontWeight: 500, display: 'flex', alignItems: 'center', height: '24px' }}>Distance</span>
                                    <span className="trip-value text-success ms-2" style={{ marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: '24px' }}>{(trip.DistanceKm || trip.distanceKm)?.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || 'N/A'} km</span>
                                  </div>
                                  {/* Plate */}
                                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'visible', whiteSpace: 'normal', verticalAlign: 'middle' }}>
                                    <span className="trip-plate-icon" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', height: '24px' }}>
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 2, display: 'block' }}>
                                        <rect x="4" y="10" width="16" height="6" rx="2" fill="#fb923c" />
                                        <rect x="7" y="6" width="10" height="5" rx="2" fill="#fdba74" />
                                        <rect x="9" y="8" width="6" height="2" rx="1" fill="#fff" />
                                        <circle cx="7" cy="18" r="1.5" fill="#fb923c" />
                                        <circle cx="17" cy="18" r="1.5" fill="#fb923c" />
                                        <rect x="6" y="16" width="2" height="2" rx="1" fill="#fdba74" />
                                        <rect x="16" y="16" width="2" height="2" rx="1" fill="#fdba74" />
                                        <rect x="10.5" y="13" width="3" height="1.5" rx="0.75" fill="#fff" />
                                      </svg>
                                    </span>
                                    <span className="trip-label" style={{ marginLeft: 4, fontWeight: 500, display: 'flex', alignItems: 'center', height: '24px' }}>Plate</span>
                                    <span className="trip-value ms-2" style={{ marginLeft: 8, marginRight: 4, color: '#fb923c', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', height: '24px' }}>{trip.LicensePlate || trip.licensePlate}</span>
                                  </div>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <small className="text-muted">
                    Page {pagination.page} / {totalPages}
                  </small>
                  <Pagination className="mb-0">
                    <Pagination.Prev disabled={pagination.page <= 1 || loading} onClick={() => fetchTrips(pagination.page - 1)} />
                    {buildPagination()}
                    <Pagination.Next disabled={pagination.page >= totalPages || loading} onClick={() => fetchTrips(pagination.page + 1)} />
                  </Pagination>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default Trips;
