import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Pagination, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/Trips.css';
import Footer from '../components/Footer';

const Trips = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 10,
  });
  const totalPages = Math.max(1, Math.ceil((pagination.totalCount || 0) / pagination.pageSize));



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
    setError('');
    try {
      await api.patch(`/trips/delete/${id}`);
      await fetchTrips(pagination.page);
    } catch (err) {
      let msg = 'Hiba történt a törlés során!';
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'string') msg = data;
        else if (data.message) msg = data.message;
        else if (data.detail) msg = data.detail;
        else if (data.errors) msg = Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
        else if (err.response.statusText) msg = err.response.statusText;
        else msg = JSON.stringify(data);
      }
      setError(msg);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="trips-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
                className="mb-3 d-flex align-items-center gap-2 trips-new-btn"
                onClick={() => navigate('/add-new-trip')}
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
                  <span className="fw-semibold">My Trips</span>
                  <Badge bg="primary">Total: {pagination.totalCount}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="py-5 text-center">
                      <Spinner animation="border" role="status" />
                    </div>
                  ) : trips.length === 0 ? (
                    <div className="py-5 text-center text-muted">No trips found.</div>
                  ) : (
                    <div className="p-3">
                      <div className="trip-list">
                        {trips.map(trip => (
                          <Card key={trip.Id || trip.id} className="trip-card-new border-0" style={{ width: '100%', maxWidth: '100%', marginBottom: '1.5rem' }}>
                            <Card.Body className="p-0">
                              <div className="trip-card-header">
                                <div className="trip-route-section">
                                  <div className="route-icon-wrapper">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="3" />
                                      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                                      <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                                    </svg>
                                  </div>
                                  <div className="route-text">
                                    <span className="route-from">{trip.StartLocation || trip.startLocation}</span>
                                    <span className="route-arrow">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                      </svg>
                                    </span>
                                    <span className="route-to">{trip.EndLocation || trip.endLocation}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="delete-trip-btn"
                                  title="Törlés"
                                  onClick={() => handleDeleteTrip(trip.Id || trip.id)}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                </Button>
                              </div>
                              <div className="trip-stats-grid">
                                <div className="stat-item">
                                  <div className="stat-icon date-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="4" width="18" height="18" rx="2" />
                                      <path d="M16 2v4M8 2v4M3 10h18" />
                                    </svg>
                                  </div>
                                  <div className="stat-content">
                                    <span className="stat-label">Date</span>
                                    <span className="stat-value">{formatDate(trip.StartTime || trip.startTime)}</span>
                                  </div>
                                </div>
                                <div className="stat-item">
                                  <div className="stat-icon distance-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                  </div>
                                  <div className="stat-content">
                                    <span className="stat-label">Distance</span>
                                    <span className="stat-value distance-value">{(trip.DistanceKm || trip.distanceKm)?.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || 'N/A'} km</span>
                                  </div>
                                </div>
                                <div className="stat-item">
                                  <div className="stat-icon plate-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="8" width="18" height="10" rx="2" />
                                      <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                                      <circle cx="7.5" cy="13" r="1.5" />
                                      <circle cx="16.5" cy="13" r="1.5" />
                                    </svg>
                                  </div>
                                  <div className="stat-content">
                                    <span className="stat-label">Plate</span>
                                    <span className="stat-value plate-value">{trip.LicensePlate || trip.licensePlate}</span>
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
        <Footer/>
      </main>
    </div>
  );
};

export default Trips;
