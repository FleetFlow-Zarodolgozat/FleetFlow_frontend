
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Pagination, Row, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/FuelLogs.css';
import Footer from '../components/Footer';


const FuelLogs = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const totalPages = Math.max(1, Math.ceil((pagination.totalCount || 0) / (pagination.pageSize || 10)));

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

  // Fetch fuel logs from API
  const fetchFuelLogs = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/fuellogs/mine', {
        params: {
          page: pageToLoad,
          pageSize: pagination.pageSize || 10,
        },
      });
      const payload = response.data || {};
      setFuelLogs(Array.isArray(payload.data) ? payload.data : []);
      setPagination({
        totalCount: payload.totalCount || 0,
        page: payload.page || pageToLoad,
        pageSize: payload.pageSize || pagination.pageSize || 10,
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
    fetchFuelLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Delete fuel log handler
  const handleDeleteFuelLog = async (id) => {
    if (!window.confirm('Biztosan törlöd ezt a tankolást?')) return;
    try {
      await api.patch(`/fuellogs/delete/${id}`);
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


  return (
    <div className="driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
                  <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
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
                      <Card key={log.id || log.Id} className="fuel-log-card-new border-0" style={{ width: '100%', maxWidth: '100%', marginBottom: '1.5rem' }}>
                        <Card.Body className="p-0">
                          <div className="fuel-log-card-header">
                            <div className="fuel-log-date-section">
                              <div className="date-icon-wrapper">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" />
                                  <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                              </div>
                              <span className="fuel-log-date-text">{formatDateTime(log.date || log.Date)}</span>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="delete-fuel-log-btn"
                              title="Törlés"
                              onClick={() => handleDeleteFuelLog(log.id || log.Id)}
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
                          <div className="fuel-log-stats-grid">
                            <div className="fuel-stat-item">
                              <div className="fuel-stat-icon liters-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C12 2 5 11 5 16a7 7 0 0 0 14 0c0-5-7-14-7-14z" />
                                </svg>
                              </div>
                              <div className="fuel-stat-content">
                                <span className="fuel-stat-label">Liters</span>
                                <span className="fuel-stat-value liters-value">{log.liters || log.Liters || 0} L</span>
                              </div>
                            </div>
                            <div className="fuel-stat-item">
                              <div className="fuel-stat-icon cost-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                                  <path d="M12 18V6" />
                                </svg>
                              </div>
                              <div className="fuel-stat-content">
                                <span className="fuel-stat-label">Cost</span>
                                <span className="fuel-stat-value cost-value">{log.totalCostCur || log.TotalCostCur || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="fuel-stat-item">
                              <div className="fuel-stat-icon plate-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="8" width="18" height="10" rx="2" />
                                  <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                                  <circle cx="7.5" cy="13" r="1.5" />
                                  <circle cx="16.5" cy="13" r="1.5" />
                                </svg>
                              </div>
                              <div className="fuel-stat-content">
                                <span className="fuel-stat-label">Plate</span>
                                <span className="fuel-stat-value plate-value">{log.licensePlate || log.LicensePlate || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="fuel-log-station-section">
                            <div className="station-icon-wrapper">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="5" rx="2" />
                                <circle cx="7.5" cy="17" r="1.5" />
                                <circle cx="16.5" cy="17" r="1.5" />
                                <path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
                              </svg>
                            </div>
                            <span className="station-name-text">{log.stationName || log.StationName || 'N/A'}</span>
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
        <Footer/>
      </main>
    </div>
  );
};

export default FuelLogs;
