import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Pagination, Row, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { authService } from '../services/authService';
import '../styles/DriverDashboard.css';
import '../styles/ServiceRequests.css';

const ServiceRequests = () => {
    const formatDateTime = (value) => {
      if (!value) return 'N/A';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };
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
  const [serviceRequests, setServiceRequests] = useState([]);
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

  const fetchServiceRequests = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/service-requests/mine', {
        params: {
          page: pageToLoad,
          pageSize: pagination.pageSize,
        },
      });
      const payload = response.data || {};
      setServiceRequests(Array.isArray(payload.data) ? payload.data : []);
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
          : apiMessage?.message || apiMessage?.Message || 'Could not load service requests.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests(pagination.page);
    // eslint-disable-next-line
  }, [pagination.pageSize]);

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
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
          <Link to="/trips" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Trips
          </Link>
          <Link to="/service-requests" className="nav-item active">
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
                <img src={profileImageUrl} alt={profile.fullName || profile.email} />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{profile.fullName || profile.email}</p>
              <p className="user-role">{profile.role}</p>
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="action-btn" title="Logout" aria-label="Logout" onClick={() => authService.logout()}>
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
        <Container fluid className="service-requests-page py-2 px-0">
          <Row className="g-3 mb-3 align-items-center">
            <Col md={8}>
              <h1 className="service-requests-title mb-1">Service Requests</h1>
              <p className="text-muted mb-0">Your own service requests ordered by latest date.</p>
            </Col>
          </Row>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-semibold">My Service Requests</span>
              <Badge bg="primary">Total: {pagination.totalCount}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="py-5 text-center">
                  <Spinner animation="border" role="status" />
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
              ) : serviceRequests.length === 0 ? (
                <div className="py-5 text-center text-muted">No service requests found.</div>
              ) : (
                <div className="p-3">
                  <div className="service-request-list">
                    {serviceRequests.map((request) => (
                      <Card key={request.id || request.Id} className="service-request-card border-0">
                        <Card.Body className="p-3 p-md-4">
                          <div className="service-request-divider-purple mb-3" />
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                            <div className="d-flex align-items-center gap-2 min-w-0">
                              <span className="service-request-title fw-semibold">{request.title}</span>

                            </div>
                            <Badge bg={request.status === 'Completed' ? 'success' : 'warning'}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="service-request-divider mb-3" />
                          <div className="service-request-details">
                            <div className="service-request-detail-row srp-row">
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="service-request-calendar-icon">
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                                <span className="service-request-label">Scheduled</span>
                                <span className="service-request-value ms-2">{formatDateTime(request.scheduledStart)}</span>
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="service-request-label">Cost</span>
                                <span className="service-request-value ms-2">{request.driverReportCost}</span>
                              </div>
                            </div>
                            <div className="service-request-detail-row" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
                              <span style={{ display: 'flex', alignItems: 'center', color: '#fb923c' }}>
                                <span className="service-request-label">Description</span>
                                <span className="service-request-value ms-2">{request.description}</span>
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
                <Pagination.Prev disabled={pagination.page <= 1 || loading} onClick={() => handlePageChange(pagination.page - 1)} />
                {[...Array(totalPages)].map((_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={pagination.page === idx + 1}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next disabled={pagination.page >= totalPages || loading} onClick={() => handlePageChange(pagination.page + 1)} />
              </Pagination>
            </Card.Footer>
          </Card>
        </Container>
      </main>
    </div>
  );
};

export default ServiceRequests;
