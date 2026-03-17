// Delete fuel log handler
const handleDeleteFuelLog = async (id) => {
    if (!window.confirm('Biztosan törlöd ezt a tankolást?')) return;
    try {
      await api.delete(`/fuellogs/${id}`);
      await fetchFuelLogs(pagination.page);
    } catch (err) {
      alert('Hiba történt a törlés során!');
      if (err.response) {
        alert('Részletes hiba: ' + (err.response.data?.message || JSON.stringify(err.response.data)));
        console.log('Delete error:', err.response);
      } else {
        console.log('Delete error:', err);
      }
    }
  };
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Pagination, Row, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { authService } from '../services/authService';
import '../styles/DriverDashboard.css';
import '../styles/FuelLogs.css';

const FuelLogs = () => {
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
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 10,
  });

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((pagination.totalCount || 0) / pagination.pageSize));
  }, [pagination.totalCount, pagination.pageSize]);

  const fetchFuelLogs = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/fuellogs/mine', {
        params: {
          page: pageToLoad,
          pageSize: pagination.pageSize,
        },
      });

      const payload = response.data || {};
      setFuelLogs(Array.isArray(payload.data) ? payload.data : []);
      setPagination({
        totalCount: payload.totalCount || 0,
        page: payload.page || pageToLoad,
        pageSize: payload.pageSize || pagination.pageSize,
      });
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'Could not load fuel logs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
        console.log('Could not fetch profile:', profileErr.message);
      }
    };

    fetchProfile();
    fetchFuelLogs(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!profile.id) {
        return;
      }

      try {
        const response = await api.get(`/files/thumbnail/${profile.id}`, {
          responseType: 'blob',
        });
        const imageUrl = URL.createObjectURL(response.data);
        setProfileImageUrl(imageUrl);
        setProfileImageError(false);
      } catch (profileImageErr) {
        console.log('Could not fetch profile image:', profileImageErr.message);
        setProfileImageError(true);
      }
    };

    fetchProfileImage();

    return () => {
      if (profileImageUrl) {
        URL.revokeObjectURL(profileImageUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getDisplayName = () => {
    if (profile.fullName) {
      return profile.fullName;
    }
    const emailPrefix = profile.email?.split('@')[0] || user?.email?.split('@')[0] || 'Driver';
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
    return (profile.email || user?.email || 'D').charAt(0).toUpperCase();
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const buildPagination = () => {
    const items = [];
    const current = pagination.page;

    for (let i = 1; i <= totalPages; i += 1) {
      if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
        items.push(
          <Pagination.Item key={i} active={i === current} onClick={() => fetchFuelLogs(i)}>
            {i}
          </Pagination.Item>
        );
      } else if (i === current - 2 || i === current + 2) {
        items.push(<Pagination.Ellipsis key={`ellipsis-${i}`} disabled />);
      }
    }

    return items;
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
          <Link to="/fuel-logs" className="nav-item active">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Fuel Logs
          </Link>
          <Link to="/trips" className="nav-item">
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
                <img
                  src={profileImageUrl}
                  alt={getDisplayName()}
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
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
        <Container fluid className="fuel-logs-page py-2 px-0">
          <Row className="g-3 mb-3 align-items-center">
            <Col md={8}>
              <h1 className="fuel-logs-title mb-1">Fuel Logs</h1>
              <p className="text-muted mb-0">Your own fuel purchases ordered by latest date.</p>
            </Col>
            <Col md={4} className="d-flex gap-2 justify-content-md-end">
<Button className="new-fuel-btn" onClick={() => navigate('/add-fuel-log')}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                New
              </Button>
            </Col>
          </Row>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-semibold">My Fuel Logs</span>
              <Badge bg="primary">Total: {pagination.totalCount}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="py-5 text-center">
                  <Spinner animation="border" role="status" />
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
              ) : fuelLogs.length === 0 ? (
                <div className="py-5 text-center text-muted">No fuel logs found.</div>
              ) : (
                <div className="p-3">
                  <div className="fuel-log-list">
                    {fuelLogs.map((log) => (
                      <Card key={log.id || log.Id} className="fuel-log-card border-0 shadow-sm">
                          <Card.Body className="p-3 p-md-4">
                            <div className="fuel-log-accent mb-3" />

                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                              <div className="d-flex align-items-center gap-2 min-w-0">
                                <span className="fuel-log-calendar-icon">
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                                <span className="fuel-log-date fw-semibold">{formatDateTime(log.date || log.Date)}</span>
                              </div>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Törlés"
                                style={{ borderRadius: '50%', width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => handleDeleteFuelLog(log.id || log.Id)}
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
                                  {/* Filled orange drop icon */}
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fb923c" style={{marginRight: 2}}><path d="M12 2C12 2 5 11 5 16a7 7 0 0 0 14 0c0-5-7-14-7-14z"/><path d="M12 21a5 5 0 0 1-5-5c0-3.07 4.13-9.14 5-10.32C14.87 6.86 19 12.93 19 16a5 5 0 0 1-5 5z" fill="#fb923c"/></svg>
                                  <span className="fuel-log-label">Liters</span>
                                  <span className="fuel-log-value text-warning-emphasis ms-2">{log.liters || log.Liters || 0} L</span>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 2}}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><line x1="12" y1="1" x2="12" y2="23"/></svg>
                                  <span className="fuel-log-label">Cost</span>
                                  <span className="fuel-log-value text-success ms-2">{log.totalCostCur || log.TotalCostCur || 'N/A'}</span>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                  {/* Front-facing car icon */}
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight: 2}}>
                                    <rect x="4" y="10" width="16" height="6" rx="2" fill="#2563eb"/>
                                    <rect x="7" y="6" width="10" height="5" rx="2" fill="#60a5fa"/>
                                    <rect x="9" y="8" width="6" height="2" rx="1" fill="#fff"/>
                                    <circle cx="7" cy="18" r="1.5" fill="#2563eb"/>
                                    <circle cx="17" cy="18" r="1.5" fill="#2563eb"/>
                                    <rect x="6" y="16" width="2" height="2" rx="1" fill="#60a5fa"/>
                                    <rect x="16" y="16" width="2" height="2" rx="1" fill="#60a5fa"/>
                                    <rect x="10.5" y="13" width="3" height="1.5" rx="0.75" fill="#fff"/>
                                  </svg>
                                  <span className="fuel-log-label">Plate</span>
                                  <span className="fuel-log-value text-primary ms-2">{log.licensePlate || log.LicensePlate || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="fuel-log-detail-row" style={{gap: '0.5rem', justifyContent: 'flex-start'}}>
                                <span style={{display: 'flex', alignItems: 'center', color: '#fb923c'}}>
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}>
                                    <rect x="3" y="11" width="18" height="5" rx="2"/>
                                    <circle cx="7.5" cy="17" r="1.5" fill="#fb923c"/>
                                    <circle cx="16.5" cy="17" r="1.5" fill="#fb923c"/>
                                    <path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/>
                                  </svg>
                                  <span
                                    className="fuel-log-value"
                                    style={{
                                      marginLeft: 0,
                                      textAlign: 'left',
                                      color: '#fb923c',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {log.stationName || log.StationName || 'N/A'}
                                  </span>
                                </span>
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
                <Pagination.Prev disabled={pagination.page <= 1 || loading} onClick={() => fetchFuelLogs(pagination.page - 1)} />
                {buildPagination()}
                <Pagination.Next disabled={pagination.page >= totalPages || loading} onClick={() => fetchFuelLogs(pagination.page + 1)} />
              </Pagination>
            </Card.Footer>
          </Card>
        </Container>
      </main>
    </div>
  );
};

export default FuelLogs;
