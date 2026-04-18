
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Pagination, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/ServiceRequests.css';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';
import CustomModal from '../components/CustomModal';

const ServiceRequests = () => {
    // Státusz -> stat kártya kategória (összesítéshez).
    const getStatusBadgeVariant = (status) => {
        const s = status?.toUpperCase() || '';
        if (s === 'REQUESTED') return 'pending';
        if (s === 'DRIVER_COST' || s === 'APPROVED') return 'in-progress';
        if (s === 'CLOSED') return 'completed';
        if (s === 'REJECTED') return 'rejected';
        return 'default';
    };

    const getStatusColor = (status) => {
        const s = status?.toUpperCase() || '';
        if (s === 'REQUESTED') return 'status-requested';
        if (s === 'APPROVED') return 'status-approved';
        if (s === 'REJECTED') return 'status-rejected';
        if (s === 'CLOSED') return 'status-closed';
        if (s === 'DRIVER_COST') return 'status-driver-cost';
        return 'status-default';
    };

    // Dátumformázás egységesen a táblához és mobil kártyákhoz.
    const formatDateTimeFull = (value) => {
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
    const { t } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [serviceRequests, setServiceRequests] = useState([]);
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

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil((pagination.totalCount || 0) / pagination.pageSize));
    }, [pagination.totalCount, pagination.pageSize]);

    // Különböző backend hibaszerkezetek egységes szöveggé alakítása.
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

    const fetchServiceRequests = async (pageToLoad = 1) => {
        setLoading(true);
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
            openErrorModal(t('common.errorTitle'), message);
            setServiceRequests([]);
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

    const handleDeleteServiceRequest = async (id) => {
        openConfirmModal({
            title: t('sr.modal.cancelTitle'),
            message: t('sr.modal.cancelMessage'),
            confirmLabel: t('sr.modal.cancelConfirm'),
            cancelLabel: t('sr.modal.keep'),
            confirmVariant: 'danger',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await api.delete(`/service-requests/cancel/${id}`);
                    await fetchServiceRequests(pagination.page);
                } catch (err) {
                    openErrorModal(t('sr.modal.cancelFailedTitle'), getApiErrorMessage(err, t('sr.modal.cancelFailedMessage')));
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    return (
        <div className="driver-dashboard">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="main-content">
                <div className="service-requests-page">
                    {/* Header Section */}
                    <div className="sr-header-section">
                        <div className="sr-header-content">
                            <div>
                                <h1 className="sr-page-title">{t('sr.title')}</h1>
                                <p className="sr-page-subtitle">{t('sr.subtitle')}</p>
                            </div>
                            <Button className="new-request-btn d-flex align-items-center gap-2" onClick={() => navigate('/add-service-request')}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v8M8 12h8" />
                                </svg>
                                <span>{t('sr.btn.addNew')}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="sr-stats-row">
                        <Card className="sr-stat-card">
                            <div className="sr-stat-icon-wrapper pending">
                                <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="sr-stat-info">
                                <span className="sr-stat-value">
                                    {serviceRequests.filter(r => getStatusBadgeVariant(r.status) === 'pending').length}
                                </span>
                                <span className="sr-stat-label">{t('sr.stat.pending')}</span>
                            </div>
                        </Card>
                        <Card className="sr-stat-card">
                            <div className="sr-stat-icon-wrapper progress">
                                <svg width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="sr-stat-info">
                                <span className="sr-stat-value">
                                    {serviceRequests.filter(r => getStatusBadgeVariant(r.status) === 'in-progress').length}
                                </span>
                                <span className="sr-stat-label">{t('sr.stat.inProgress')}</span>
                            </div>
                        </Card>
                        <Card className="sr-stat-card">
                            <div className="sr-stat-icon-wrapper completed">
                                <svg width="24" height="24" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="sr-stat-info">
                                <span className="sr-stat-value">
                                    {serviceRequests.filter(r => getStatusBadgeVariant(r.status) === 'closed').length}
                                </span>
                                <span className="sr-stat-label">{t('sr.stat.closed')}</span>
                            </div>
                        </Card>
                        <Card className="sr-stat-card">
                            <div className="sr-stat-icon-wrapper rejected">
                                <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="sr-stat-info">
                                <span className="sr-stat-value">
                                    {serviceRequests.filter(r => getStatusBadgeVariant(r.status) === 'rejected').length}
                                </span>
                                <span className="sr-stat-label">{t('sr.stat.rejected')}</span>
                            </div>
                        </Card>
                    </div>

                    {/* Service Requests Table */}
                    <Card className="sr-table-card">
                        <Card.Header className="sr-table-header">
                            <span className="sr-table-title">{t('sr.card.title')}</span>
                            <span className="sr-total-badge">{t('sr.total')}: {pagination.totalCount}</span>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="sr-loading">
                                    <Spinner animation="border" role="status" />
                                    <span>{t('sr.loading')}</span>
                                </div>
                            ) : serviceRequests.length === 0 ? (
                                <div className="sr-empty">
                                    <svg width="64" height="64" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p>{t('sr.empty')}</p>
                                    <Button variant="outline-primary" onClick={() => navigate('/add-service-request')}>
                                        {t('sr.addFirst')}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="sr-desktop-table">
                                        <div className="table-responsive">
                                            <table className="sr-table">
                                                <thead>
                                                    <tr>
                                                        <th className="sr-table-col-title">{t('sr.th.title')}</th>
                                                        <th className="sr-table-col-vehicle">{t('sr.th.vehicle')}</th>
                                                        <th className="sr-table-col-scheduled">{t('sr.th.scheduled')}</th>
                                                        <th className="sr-table-col-cost">{t('sr.th.driverCost')}</th>
                                                        <th className="sr-table-col-status">{t('sr.th.status')}</th>
                                                        <th className="sr-table-col-actions">{t('sr.th.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {serviceRequests.map((request) => (
                                                        <tr key={request.id || request.Id} className="sr-table-row">
                                                            <td className="sr-table-cell">
                                                                <div className="sr-cell-title">
                                                                    <svg width="18" height="18" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                                                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                    <span>{request.title}</span>
                                                                </div>
                                                            </td>
                                                            <td className="sr-table-cell">
                                                                <span className="sr-cell-vehicle">{request.licensePlate}</span>
                                                            </td>
                                                            <td className="sr-table-cell">
                                                                <span className="sr-cell-date">{formatDateTimeFull(request.scheduledStart)}</span>
                                                            </td>
                                                            <td className="sr-table-cell">
                                                                <span className="sr-cell-cost">{request.driverReportCost || request.driverReportCost === 0 ? request.driverReportCost : '0'} Ft</span>
                                                            </td>
                                                            <td className="sr-table-cell">
                                                                <span className={`sr-status-badge ${getStatusColor(request.status)}`}>
                                                                    {request.status}
                                                                </span>
                                                            </td>
                                                            <td className="sr-table-cell">
                                                                <div className="sr-cell-actions">
                                                                    <Button
                                                                        className="sr-details-btn"
                                                                        onClick={() => navigate('/service-request-details', { state: { request } })}
                                                                        title="View Details"
                                                                    >
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                                                                        </svg>
                                                                    </Button>
                                                                    <Button
                                                                        className="sr-delete-btn"
                                                                        variant="outline-danger"
                                                                        onClick={() => handleDeleteServiceRequest(request.id || request.Id)}
                                                                        title="Cancel request"
                                                                    >
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="3,6 5,6 21,6" strokeLinecap="round" strokeLinejoin="round" />
                                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                                                                        </svg>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="sr-mobile-cards">
                                        {serviceRequests.map((request) => (
                                            <Card key={request.id || request.Id} className="sr-mobile-card">
                                                <Card.Body>
                                                    <div className="sr-mobile-card-header">
                                                        <div className="sr-mobile-card-title">
                                                            <svg width="16" height="16" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            <span>{request.title}</span>
                                                        </div>
                                                        <span className={`sr-status-badge ${getStatusColor(request.status)}`}>
                                                            {request.status}
                                                        </span>
                                                    </div>
                                                    <div className="sr-mobile-card-body">
                                                        {request.licensePlate && (
                                                            <div className="sr-mobile-row">
                                                                <span className="sr-mobile-label">{t('sr.mobile.vehicle')}</span>
                                                                <span className="sr-mobile-value">{request.licensePlate}</span>
                                                            </div>
                                                        )}
                                                        <div className="sr-mobile-row">
                                                            <span className="sr-mobile-label">{t('sr.mobile.scheduled')}</span>
                                                            <span className="sr-mobile-value">{formatDateTimeFull(request.scheduledStart)}</span>
                                                        </div>
                                                        <div className="sr-mobile-row">
                                                            <span className="sr-mobile-label">{t('sr.mobile.driverCost')}</span>
                                                            <span className="sr-mobile-value sr-mobile-cost">{request.driverReportCost || request.driverReportCost === 0 ? request.driverReportCost : '0'} Ft</span>
                                                        </div>
                                                    </div>
                                                    <div className="sr-mobile-card-actions">
                                                        <Button
                                                            className="sr-mobile-details-btn"
                                                            onClick={() => navigate('/service-request-details', { state: { request } })}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                            {t('sr.mobile.viewDetails')}
                                                        </Button>
                                                        <Button
                                                            className="sr-mobile-delete-btn"
                                                            onClick={() => handleDeleteServiceRequest(request.id || request.Id)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3,6 5,6 21,6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                            {t('sr.mobile.cancel')}
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                        {serviceRequests.length > 0 && (
                            <Card.Footer className="sr-pagination-footer">
                                <span className="sr-page-info">
                                    {t('sr.page', { current: pagination.page, total: totalPages })}
                                </span>
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
                        )}
                    </Card>
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
                </div>
            </main>
        </div>
    );
};

export default ServiceRequests;
