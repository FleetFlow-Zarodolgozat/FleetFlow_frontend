import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Pagination, Row, Spinner } from 'react-bootstrap';
import api from '../services/api';
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

  // Trips state for consumption calculation
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  // Fetch trips for consumption calculation
  useEffect(() => {
    const fetchTrips = async () => {
      setTripsLoading(true);
      try {
        const response = await api.get('/trips/mine', { params: { page: 1, pageSize: 1000 } });
        const payload = response.data || {};
        setTrips(Array.isArray(payload.data) ? payload.data : []);
      } catch {
      } finally {
        setTripsLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // Calculate stats based on fuelLogs
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  let totalSpent = 0;
  let lastMonthSpent = 0;

  fuelLogs.forEach(log => {
    // Parse date
    const dateObj = new Date(log.date || log.Date);
    const costStr = log.totalCostCur || log.TotalCostCur || '0';
    const cost = parseFloat(costStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

    if (!isNaN(cost)) {
      // This month
      if (dateObj.getMonth() === thisMonth && dateObj.getFullYear() === thisYear) {
        totalSpent += cost;
      }
      // Last month
      if (dateObj.getMonth() === lastMonth && dateObj.getFullYear() === lastMonthYear) {
        lastMonthSpent += cost;
      }
    }

  });

  // Calculate stats
  const spentChange = lastMonthSpent === 0 ? 0 : Math.round(((totalSpent - lastMonthSpent) / lastMonthSpent) * 100);

  // Calculate days since last refuel
  let daysSinceLastRefuel = 'N/A';
  if (fuelLogs.length > 0) {
    // Find the latest log date
    const latestLog = fuelLogs.reduce((latest, log) => {
      const dateObj = new Date(log.date || log.Date);
      return (!latest || dateObj > latest) ? dateObj : latest;
    }, null);
    if (latestLog && !isNaN(latestLog.getTime())) {
      const diffMs = now - latestLog;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      daysSinceLastRefuel = diffDays === 0 ? 'Today' : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
  }

  // Calculate average consumption (L/100km) from trips and fuelLogs
  let avgConsumption = 'N/A';
  if (trips.length > 0 && fuelLogs.length > 0) {
    // Sum total distance from trips
    const totalTripDistance = trips.reduce((sum, trip) => {
      const d = parseFloat(trip.DistanceKm || trip.distanceKm || 0);
      return sum + (isNaN(d) ? 0 : d);
    }, 0);
    // Sum total liters from fuel logs
    const totalFuel = fuelLogs.reduce((sum, log) => {
      const l = parseFloat(log.liters || log.Liters || 0);
      return sum + (isNaN(l) ? 0 : l);
    }, 0);
    if (totalTripDistance > 0 && totalFuel > 0) {
      avgConsumption = `${((totalFuel / totalTripDistance) * 100).toFixed(1)} L/100km`;
    }
  }

  const stats = {
    totalSpent: `${Math.round(totalSpent)} Ft`,
    totalSpentChange: `${Math.abs(spentChange)}%${spentChange < 0 ? '' : ''}`,
    daysSinceLastRefuel,
    avgConsumption,
  };

  const formatDateTime = (value) => {
    if (!value) return { date: 'N/A', time: '' };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { date: 'N/A', time: '' };
    return {
      date: date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
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
    if (!window.confirm('Are you sure you want to delete this fuel log?')) return;
    try {
      await api.patch(`/fuellogs/delete/${id}`);
      await fetchFuelLogs(pagination.page);
    } catch (err) {
      const msg = err?.response?.data;
      alert(typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to delete fuel log.');
    }
  };

  const displayedCount = fuelLogs.length;
  const totalCount = pagination.totalCount || 0;

  return (
    <div className="driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="main-content">
        <Container fluid className="fuel-logs-page">
          {/* Header section */}
          <div className="fuel-logs-header">
            <div>
              <h1 className="fuel-logs-title mb-1">My Fuel Logs</h1>
              <p className="fuel-logs-subtitle text-muted mb-0">
                Review your historical fuel consumption and add new entries.
              </p>
            </div>
            <Button className="add-new-fuel-log-btn" onClick={() => navigate('/add-fuel-log')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>Add New Fuel Log</span>
            </Button>
          </div>

          {/* Main table card */}
          <Card className="fuel-logs-table-card mb-4">
            <Card.Header className="fuel-logs-table-header">
              <span className="fuel-logs-table-title">My Fuel Logs</span>
              <span className="fuel-logs-total-badge">Total: {totalCount}</span>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="py-5 text-center">
                  <Spinner animation="border" role="status" />
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
              ) : fuelLogs.length === 0 ? (
                <div className="sr-empty">
                  <svg width="64" height="64" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p>No fuel logs recorded yet</p>
                  <Button variant="outline-primary" onClick={() => navigate('/add-fuel-log')}>
                    Add your first fuel log
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="desktop-table" style={{ overflowX: 'auto' }}>
                    <table className="fuel-logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th className="fuel-log-header">DATE</th>
                          <th className="fuel-log-header" style={{ textAlign: 'center' }}>VEHICLE</th>
                          <th className="fuel-log-header">LOCATION</th>
                          <th className="fuel-log-header">LITERS</th>
                          <th className="fuel-log-header">TOTAL COST</th>
                          <th className="fuel-log-header">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fuelLogs.map((log) => {
                          const formatted = formatDateTime(log.date || log.Date);
                          return (
                            <tr key={log.id || log.Id} className="fuel-log-row">
                              <td className="fuel-log-cell date-cell">
                                <div className="date-main">{formatted.date || 'N/A'}</div>
                                {formatted.time && <div className="date-time">{formatted.time}</div>}
                              </td>
                              <td className="fuel-log-cell vehicle-cell">
                                <div className="vehicle-wrapper">
                                  <span className="vehicle-plate">
                                    {log.licensePlate || log.LicensePlate || 'N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="fuel-log-cell location-cell">
                                {log.stationName || log.StationName || 'N/A'}
                              </td>
                              <td className="fuel-log-cell liters-cell">
                                {log.liters || log.Liters || 0} L
                              </td>
                              <td className="fuel-log-cell cost-cell">
                                {(log.totalCostCur || log.TotalCostCur || '0.00')}
                              </td>
                              <td className="fuel-log-cell actions-cell">
                                <Button
                                  variant="outline-danger"
                                  className="delete-btn"
                                  title="Delete"
                                  onClick={() => handleDeleteFuelLog(log.id || log.Id)}
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
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="mobile-cards">
                    {fuelLogs.map((log) => {
                      const formatted = formatDateTime(log.date || log.Date);
                      return (
                        <Card key={log.id || log.Id} className="fuel-log-mobile-card mb-3">
                          <Card.Body>
                            <div className="mobile-card-header">
                              <div className="mobile-date">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" />
                                  <path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                <span>{formatted.date || 'N/A'} {formatted.time && <span className="mobile-time">{formatted.time}</span>}</span>
                              </div>
                              <Button
                                variant="link"
                                className="mobile-delete-btn"
                                onClick={() => handleDeleteFuelLog(log.id || log.Id)}
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
                              <div className="mobile-row">
                                <span className="mobile-label">
                                  Vehicle
                                </span>
                                <span className="mobile-value">
                                  <span className="mobile-plate">
                                    {log.licensePlate || log.LicensePlate || 'N/A'}
                                  </span>
                                </span>
                              </div>
                              <div className="mobile-row">
                                <span className="mobile-label">
                                  Location
                                </span>
                                <span className="mobile-value">{log.stationName || log.StationName || 'N/A'}</span>
                              </div>
                              <div className="mobile-row">
                                <span className="mobile-label">
                                  Liters
                                </span>
                                <span className="mobile-value">{log.liters || log.Liters || 0} L</span>
                              </div>
                              <div className="mobile-row">
                                <span className="mobile-label">
                                  Total Cost
                                </span>
                                <span className="mobile-value cost-value">
                                  {(log.totalCostCur || log.TotalCostCur || '€0.00').replace(/€/g, '')}
                                </span>
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
            {fuelLogs.length > 0 && (
              <Card.Footer className="fuel-logs-pagination-footer">
                <span className="fuel-logs-page-info">
                  Showing {displayedCount} of {totalCount} entries
                </span>
                <Pagination className="mb-0 fuel-logs-pagination">
                  <Pagination.Prev
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => fetchFuelLogs(pagination.page - 1)}
                  />
                  {buildPagination()}
                  <Pagination.Next
                    disabled={pagination.page >= totalPages || loading}
                    onClick={() => fetchFuelLogs(pagination.page + 1)}
                  />
                </Pagination>
              </Card.Footer>
            )}
          </Card>

          {/* Stats cards */}
          <Row className="g-3 stats-row">
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">Total Spent (This Month)</div>
                  <div className="stats-value">{stats.totalSpent}</div>
                  <div className={`stats-change ${spentChange < 0 ? 'negative' : 'positive'} mt-auto`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 18l-9.5-9.5-5 5L1 6" />
                      <path d="M17 18h6v6" />
                    </svg>
                    {stats.totalSpentChange} {spentChange < 0 ? 'less' : 'more'} than last month
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">Last Refuel</div>
                  <div className="stats-value efficiency-value">{stats.daysSinceLastRefuel}</div>
                  <div className="stats-subtext mt-auto">since your last fuel log</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">Avg. Consumption</div>
                  <div className="stats-value service-value">{tripsLoading ? '...' : stats.avgConsumption}</div>
                  <div className="stats-subtext mt-auto">based on your trips</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer/>
      </main>
    </div>
  );
};

export default FuelLogs;
