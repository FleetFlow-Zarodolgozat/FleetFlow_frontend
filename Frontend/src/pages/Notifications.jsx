
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Pagination, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/Trips.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 10,
  });
  const totalPages = Math.max(1, Math.ceil((pagination.totalCount || 0) / pagination.pageSize));



  const fetchNotifications = async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notifications', {
        params: {
          page: pageToLoad,
          pageSize: pagination.pageSize,
        },
      });
      const payload = response.data || [];
      setNotifications(Array.isArray(payload) ? payload : []);
      setPagination(prev => ({
        ...prev,
        totalCount: Array.isArray(payload) ? payload.length : 0,
        page: pageToLoad
      }));
    } catch (err) {
      setError('Hiba történt az értesítések lekérésekor!');
    } finally {
      setLoading(false);
    }
  };
  const handleMarkAllAsRead = async () => {
      if (!window.confirm('Biztosan megjelölöd az összes értesítést olvasottként?')) return;
      setError('');
      try {
        await api.patch('/notifications/read');
        await fetchNotifications(pagination.page);
      } catch (err) {
        let msg = 'Hiba történt a művelet során!';
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
  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Biztosan törlöd ezt az értesítést?')) return;
    setError('');
    try {
      await api.delete(`/notifications/${id}`);
      await fetchNotifications(pagination.page);
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

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const buildPagination = () => {
    const items = [];
    const current = pagination.page;
    for (let i = 1; i <= totalPages; i += 1) {
      if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
        items.push(
          <Pagination.Item key={i} active={i === current} onClick={() => fetchNotifications(i)}>
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
    <div className="trips-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container className="py-2">
          <Row className="g-3 mb-3 align-items-center justify-content-between">
            <Col md={8}>
              <h1 className="fuel-logs-title mb-1">Notifications</h1>
            </Col>
            <Col md={4} className="d-flex justify-content-end">
              <Button
                variant="primary"
                size="sm"
                style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff', borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.15)' }}
                onMouseOver={e => { e.currentTarget.style.background = '#1746a2'; e.currentTarget.style.borderColor = '#1746a2'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb'; }}
                className="mb-1 d-flex align-items-center justify-content-center trips-new-btn"
                onClick={handleMarkAllAsRead}
                title="Mark All As Read"
                aria-label="Mark All As Read"
              >
                <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" fill="none" />
                  <path d="M8 12.5l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col md={12} lg={12} style={{ width: '100%', maxWidth: '100%' }}>
              <Card className="border-0 rounded-4" style={{ width: '100%', maxWidth: '100%', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>
                <Card.Header className="bg-white rounded-top-4 d-flex align-items-center justify-content-between gap-2 border-bottom" style={{ minHeight: 60 }}>
                  <span className="fw-semibold">My Notifications</span>
                  <Badge bg="primary">Total: {pagination.totalCount}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="py-5 text-center">
                      <Spinner animation="border" role="status" />
                    </div>
                  ) : error ? (
                    <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
                  ) : notifications.length === 0 ? (
                    <div className="py-5 text-center text-muted">No notifications found.</div>
                  ) : (
                    <div className="p-3">
                      <div className="trip-list">
                        {notifications.map(notification => (
                          <Card key={notification.id} className="trip-card border-0 shadow-sm position-relative" style={{ width: '100%', maxWidth: '100%', marginBottom: '2.5rem', boxShadow: '0 8px 24px 0 rgba(37,99,235,0.25) !important' }}>
                            <Card.Body className="p-3 p-md-4 position-relative">
                              <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.05em', color: notification.isRead ? '#2563eb' : '#dc2626', letterSpacing: '0.5px' }}>
                                  {notification.isRead ? 'Read' : 'Unread'}
                                </span>
                              </div>
                              <div className="trip-accent mb-3" style={{ height: '4px', width: '100%', background: notification.isRead ? '#2563eb' : '#dc2626', borderRadius: '2px' }}></div>
                              <div className="d-flex align-items-center gap-3 mb-3">
                                <div style={{ minWidth: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                  </svg>
                                </div>
                                <div className="d-flex align-items-center gap-2 min-w-0" style={{ flex: 1 }}>
                                  <span className="trip-value" style={{ marginLeft: 0, textAlign: 'left', color: '#2563eb', fontWeight: 600, fontSize: '1.1em' }}>
                                    {notification.title || 'Notification'}
                                  </span>
                                </div>
                              </div>
                              <div className="trip-divider mb-3"></div>
                              <div className="trip-details mb-2">
                                <Badge bg="info">{notification.type || 'INFO'}</Badge>
                                <div className="mt-2" style={{ fontWeight: 500 }}>{notification.message || notification.content || ''}</div>
                              </div>
                              <div style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
                                <small style={{ color: '#333', fontWeight: 500 }}>
                                  {(() => {
                                    const dateVal = notification.DateTime || notification.date || notification.createdAt || notification.timestamp;
                                    return dateVal ? new Date(dateVal).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                                  })()}
                                </small>
                              </div>
                              <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  title="Törlés"
                                  style={{ borderRadius: '50%', width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => handleDeleteNotification(notification.id)}
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
                    <Pagination.Prev disabled={pagination.page <= 1 || loading} onClick={() => fetchNotifications(pagination.page - 1)} />
                    {buildPagination()}
                    <Pagination.Next disabled={pagination.page >= totalPages || loading} onClick={() => fetchNotifications(pagination.page + 1)} />
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

export default Notifications;
