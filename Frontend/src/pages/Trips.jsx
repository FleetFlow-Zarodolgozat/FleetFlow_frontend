import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Pagination, Badge, Alert, Spinner, Button, Table } from 'react-bootstrap';
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

  // Stats calculation
  const stats = {
    totalTrips: pagination.totalCount,
    totalDistance: trips.reduce((sum, trip) => sum + (trip.DistanceKm || trip.distanceKm || 0), 0),
    avgDistance: trips.length > 0 ? trips.reduce((sum, trip) => sum + (trip.DistanceKm || trip.distanceKm || 0), 0) / trips.length : 0,
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
    if (!dateStr) return { date: 'N/A', time: '' };
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return { date: 'N/A', time: '' };
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
  };

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined || isNaN(distance)) return 'N/A';
    return `${Number(distance).toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  };

  const displayedCount = trips.length;
  const totalCount = pagination.totalCount || 0;

  return (
    <div className="trips-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container fluid className="trips-page py-4 px-4">
          {/* Header section */}
          <div className="trips-header mb-4">
            <div>
              <h1 className="trips-title mb-1">My Trips</h1>
              <p className="trips-subtitle text-muted mb-0">
                Track and manage your journey history.
              </p>
            </div>
            <Button className="add-new-trip-btn" onClick={() => navigate('/add-new-trip')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>Add New Trip</span>
            </Button>
          </div>

          {/* Main table card */}
          <Card className="trips-table-card shadow-sm border-0 mb-4">
            <Card.Body className="p-0">
              {loading ? (
                <div className="py-5 text-center">
                  <Spinner animation="border" role="status" />
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
              ) : trips.length === 0 ? (
                <div className="py-5 text-center text-muted">
                  <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No trips recorded yet.</div>
                  <Button variant="primary" onClick={() => navigate('/add-new-trip')}>
                    Add your first trip
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="table-responsive desktop-table">
                    <Table className="trips-table mb-0" hover responsive>
                      <thead>
                        <tr>
                          <th className="trip-header">DATE</th>
                          <th className="trip-header">ROUTE</th>
                          <th className="trip-header">DISTANCE</th>
                          <th className="trip-header">VEHICLE</th>
                          <th className="trip-header">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trips.map((trip) => {
                          const formatted = formatDate(trip.StartTime || trip.startTime);
                          return (
                            <tr key={trip.Id || trip.id} className="trip-row">
                              <td className="trip-cell date-cell">
                                <div className="date-main">{formatted.date}</div>
                                {formatted.time && <div className="date-time">{formatted.time}</div>}
                              </td>
                              <td className="trip-cell route-cell">
                                <div className="route-wrapper">
                                  <span className="route-from">{trip.StartLocation || trip.startLocation || 'N/A'}</span>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="route-arrow">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                  <span className="route-to">{trip.EndLocation || trip.endLocation || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="trip-cell distance-cell">
                                <span className="distance-value">{formatDistance(trip.DistanceKm || trip.distanceKm)}</span>
                              </td>
                              <td className="trip-cell vehicle-cell">
                                <div className="vehicle-wrapper">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="vehicle-icon">
                                    <rect x="3" y="8" width="18" height="10" rx="2" />
                                    <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                                    <circle cx="7.5" cy="13" r="1.5" />
                                    <circle cx="16.5" cy="13" r="1.5" />
                                  </svg>
                                  <span className="vehicle-name">{trip.LicensePlate || trip.licensePlate || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="trip-cell actions-cell">
                                <Button
                                  variant="link"
                                  className="delete-btn"
                                  title="Delete"
                                  onClick={() => handleDeleteTrip(trip.Id || trip.id)}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="mobile-cards">
                    {trips.map((trip) => {
                      const formatted = formatDate(trip.StartTime || trip.startTime);
                      return (
                        <Card key={trip.Id || trip.id} className="trip-mobile-card mb-3">
                          <Card.Body>
                            <div className="mobile-card-header">
                              <div className="mobile-date">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" />
                                  <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                <span>{formatted.date} {formatted.time && <span className="mobile-time">{formatted.time}</span>}</span>
                              </div>
                              <Button
                                variant="link"
                                className="mobile-delete-btn"
                                onClick={() => handleDeleteTrip(trip.Id || trip.id)}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </Button>
                            </div>
                            <div className="mobile-card-body">
                              <div className="mobile-row route-row">
                                <span className="mobile-label">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                                  </svg>
                                  Route
                                </span>
                                <div className="mobile-route">
                                  <span className="mobile-from">{trip.StartLocation || trip.startLocation || 'N/A'}</span>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                  <span className="mobile-to">{trip.EndLocation || trip.endLocation || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="mobile-row">
                                <span className="mobile-label">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                  Distance
                                </span>
                                <span className="mobile-value distance-value">{formatDistance(trip.DistanceKm || trip.distanceKm)}</span>
                              </div>
                              <div className="mobile-row">
                                <span className="mobile-label">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="8" width="18" height="10" rx="2" />
                                    <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  Vehicle
                                </span>
                                <span className="mobile-value">{trip.LicensePlate || trip.licensePlate || 'N/A'}</span>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </Card.Body>
            {trips.length > 0 && (
              <Card.Footer className="bg-white border-0 py-3 px-4">
                <Row className="align-items-center">
                  <Col xs={12} md={6} className="text-muted text-center text-md-start mb-2 mb-md-0">
                    Showing {displayedCount} of {totalCount} entries
                  </Col>
                  <Col xs={12} md={6} className="d-flex justify-content-center justify-content-md-end">
                    <Pagination className="mb-0 trips-pagination">
                      <Pagination.Prev
                        disabled={pagination.page <= 1 || loading}
                        onClick={() => fetchTrips(pagination.page - 1)}
                      />
                      {buildPagination()}
                      <Pagination.Next
                        disabled={pagination.page >= totalPages || loading}
                        onClick={() => fetchTrips(pagination.page + 1)}
                      />
                    </Pagination>
                  </Col>
                </Row>
              </Card.Footer>
            )}
          </Card>

          {/* Stats cards */}
          <Row className="g-3 stats-row">
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">Total Trips</div>
                  <div className="stats-value">{stats.totalTrips}</div>
                  <div className="stats-subtext mt-auto">all time journeys</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">Total Distance</div>
                  <div className="stats-value distance-value">{stats.totalDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div>
                  <div className="stats-subtext mt-auto">cumulative distance</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">Avg. Distance</div>
                  <div className="stats-value">{stats.avgDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div>
                  <div className="stats-subtext mt-auto">per trip</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />
      </main>
    </div>
  );
};

export default Trips;
