import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Pagination, Spinner, Button } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/Trips.css';
import Footer from '../components/Footer';
import CustomModal from '../components/CustomModal';

const Trips = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: '',
    confirmVariant: '',
    onConfirm: null,
  });
  const [errorModal, setErrorModal] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    page: 1,
    pageSize: 10,
  });
  const totalPages = Math.max(1, Math.ceil((pagination.totalCount || 0) / pagination.pageSize));

  const getApiErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.Message) return data.Message;
    if (data?.detail) return data.detail;
    if (data?.errors) return Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
    if (err?.response?.statusText) return err.response.statusText;
    return fallback;
  };

  const openConfirmModal = ({ title, message, confirmLabel, cancelLabel, confirmVariant, onConfirm }) => {
    setConfirmModal({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      confirmVariant,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
  };

  const handleConfirmAction = async () => {
    const action = confirmModal.onConfirm;
    closeConfirmModal();
    if (typeof action === 'function') {
      await action();
    }
  };

  const openErrorModal = (title, message) => {
    setErrorModal({ open: true, title, message });
  };

  const closeErrorModal = () => {
    setErrorModal((prev) => ({ ...prev, open: false }));
  };

  // Statisztikák számítása az aktuális oldali adatokból.
  const stats = {
    totalTrips: pagination.totalCount,
    totalDistance: trips.reduce((sum, trip) => sum + (trip.DistanceKm || trip.distanceKm || 0), 0),
    avgDistance: trips.length > 0 ? trips.reduce((sum, trip) => sum + (trip.DistanceKm || trip.distanceKm || 0), 0) / trips.length : 0,
  };

  const fetchTrips = async (pageToLoad = 1) => {
    setLoading(true);
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
      openErrorModal(t('common.errorTitle'), 'An error occurred while fetching trips.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips(1);
  }, []);

  // Lapozó generálása: széleken és az aktuális környezetében mutatjuk az oldalakat.
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
    openConfirmModal({
      title: t('trips.modal.deleteTitle'),
      message: t('trips.modal.deleteMessage'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.patch(`/trips/delete/${id}`);
          await fetchTrips(pagination.page);
        } catch (err) {
          openErrorModal(t('trips.modal.deleteFailedTitle'), getApiErrorMessage(err, t('trips.modal.deleteFailedMessage')));
        }
      },
    });
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

  const formatDuration = (ts) => {
    if (!ts) return '—';
    if (typeof ts === 'string') {
      const parts = ts.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
      }
    }
    return '—';
  };

  const displayedCount = trips.length;
  const totalCount = pagination.totalCount || 0;

  return (
    <div className="trips-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container fluid className="trips-page">
          {/* Header section */}
          <div className="trips-header mb-4">
            <div>
              <h1 className="trips-title mb-1">{t('trips.title')}</h1>
              <p className="trips-subtitle text-muted mb-0">
                {t('trips.subtitle')}
              </p>
            </div>
            <Button className="add-new-trip-btn" onClick={() => navigate('/add-new-trip')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>{t('trips.btn.addNew')}</span>
            </Button>
          </div>

          {/* Main table card */}
          <Card className="trips-table-card mb-4">
            <Card.Header className="trips-table-header">
              <span className="trips-table-title">{t('trips.card.title')}</span>
              <span className="trips-total-badge">{t('trips.total')}: {totalCount}</span>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="py-5 text-center">
                  <Spinner animation="border" role="status" />
                </div>
              ) : trips.length === 0 ? (
                <div className="sr-empty">
                  <svg width="64" height="64" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p>{t('trips.empty')}</p>
                  <Button variant="outline-primary" onClick={() => navigate('/add-new-trip')}>
                    {t('trips.addFirst')}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="desktop-table">
                    <table className="trips-table">
                      <thead>
                        <tr>
                          <th className="trip-header">{t('trips.th.date')}</th>
                          <th className="trip-header">{t('trips.th.vehicle')}</th>
                          <th className="trip-header">{t('trips.th.route')}</th>
                          <th className="trip-header">{t('trips.th.distance')}</th>
                          <th className="trip-header">{t('trips.th.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trips.map((trip) => {
                          const formatted = formatDate(trip.StartTime || trip.startTime);
                          return (
                            <tr key={trip.Id || trip.id} className="trip-row">
                              <td className="trip-cell date-cell">
                                <div className="trip-date-block">
                                  <div className="date-main">{formatted.date}</div>
                                  {formatted.time && <div className="date-time">{formatted.time}</div>}
                                  {(trip.Long || trip.long) && <div className="date-duration">{formatDuration(trip.Long || trip.long)}</div>}
                                </div>
                              </td>
                              <td className="trip-cell vehicle-cell">
                                <div className="vehicle-wrapper">
                                  <span className="trip-plate">{trip.LicensePlate || trip.licensePlate || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="trip-cell route-cell">
                                <div className="route-wrapper">
                                  <span className="route-from">{trip.StartLocation || trip.startLocation || 'N/A'}</span>
                                  <span className="route-divider">↓</span>
                                  <span className="route-to">{trip.EndLocation || trip.endLocation || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="trip-cell distance-cell">
                                <span className="distance-value">{formatDistance(trip.DistanceKm || trip.distanceKm)}</span>
                              </td>
                              <td className="trip-cell actions-cell trip-actions-cell">
                                <Button
                                  variant="outline-danger"
                                  className="delete-btn trip-delete-btn"
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
                    </table>
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
                                  {t('trips.mobile.route')}
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
                                  {t('trips.mobile.distance')}
                                </span>
                                <span className="mobile-value distance-value">{formatDistance(trip.DistanceKm || trip.distanceKm)}</span>
                              </div>
                              <div className="mobile-row">
                                <span className="mobile-label">
                                  {t('trips.mobile.vehicle')}
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
              <Card.Footer className="trips-pagination-footer">
                <span className="trips-page-info">
                  {t('trips.showing', { count: displayedCount, total: totalCount })}
                </span>
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
              </Card.Footer>
            )}
          </Card>

          {/* Stats cards */}
          <Row className="g-3 stats-row">
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">{t('trips.stat.totalTrips')}</div>
                  <div className="stats-value">{stats.totalTrips}</div>
                  <div className="stats-subtext mt-auto">{t('trips.stat.allTime')}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">{t('trips.stat.totalDistance')}</div>
                  <div className="stats-value distance-value">{stats.totalDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div>
                  <div className="stats-subtext mt-auto">{t('trips.stat.cumulative')}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Card className="stats-card border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="stats-label">{t('trips.stat.avgDistance')}</div>
                  <div className="stats-value">{stats.avgDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div>
                  <div className="stats-subtext mt-auto">{t('trips.stat.perTrip')}</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />

        <CustomModal
          isOpen={confirmModal.open}
          onClose={closeConfirmModal}
          title={confirmModal.title}
          primaryAction={{
            label: confirmModal.confirmLabel,
            onClick: handleConfirmAction,
            variant: confirmModal.confirmVariant,
          }}
          secondaryAction={{
            label: confirmModal.cancelLabel,
            onClick: closeConfirmModal,
          }}
        >
          <p className="mb-0">{confirmModal.message}</p>
        </CustomModal>

        <CustomModal
          isOpen={errorModal.open}
          onClose={closeErrorModal}
          title={errorModal.title}
          primaryAction={{
            label: t('common.ok'),
            onClick: closeErrorModal,
          }}
        >
          <p className="mb-0">{errorModal.message}</p>
        </CustomModal>
      </main>
    </div>
  );
};

export default Trips;
