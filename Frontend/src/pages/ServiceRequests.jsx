
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Pagination, Row, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/ServiceRequests.css';
import Footer from '../components/Footer';

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    const handleDeleteServiceRequest = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this service request?')) return;
        setLoading(true);
        setError('');
        try {
            await api.delete(`/service-requests/cancel/${id}`);
            fetchServiceRequests(pagination.page);
        } catch (err) {
            const apiMessage = err?.response?.data;
            const message =
                typeof apiMessage === 'string'
                    ? apiMessage
                    : apiMessage?.message || apiMessage?.Message || 'Could not cancel service request.';
            setError(message);
        } finally {
            setLoading(false);
        }
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
                                <h1 className="sr-page-title">Service Requests</h1>
                                <p className="sr-page-subtitle">Manage and track your vehicle service requests</p>
                            </div>
                            <Button className="new-request-btn d-flex align-items-center gap-2" onClick={() => navigate('/add-service-request')}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v8M8 12h8" />
                                </svg>
                                <span>Add New Request</span>
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
                                <span className="sr-stat-label">Pending</span>
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
                                <span className="sr-stat-label">In Progress</span>
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
                                <span className="sr-stat-label">Closed</span>
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
                                <span className="sr-stat-label">Rejected</span>
                            </div>
                        </Card>
                    </div>

                    {/* Service Requests Table */}
                    <Card className="sr-table-card">
                        <Card.Header className="sr-table-header">
                            <span className="sr-table-title">My Service Requests</span>
                            <span className="sr-total-badge">Total: {pagination.totalCount}</span>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="sr-loading">
                                    <Spinner animation="border" role="status" />
                                    <span>Loading service requests...</span>
                                </div>
                            ) : error ? (
                                <Alert variant="danger" className="m-3">{error}</Alert>
                            ) : serviceRequests.length === 0 ? (
                                <div className="sr-empty">
                                    <svg width="64" height="64" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p>No service requests found</p>
                                    <Button variant="outline-primary" onClick={() => navigate('/add-service-request')}>
                                        Create your first request
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
                                                        <th className="sr-table-col-title">Title</th>
                                                        <th className="sr-table-col-vehicle">Vehicle</th>
                                                        <th className="sr-table-col-scheduled">Scheduled</th>
                                                        <th className="sr-table-col-cost">Driver Cost</th>
                                                        <th className="sr-table-col-status">Status</th>
                                                        <th className="sr-table-col-actions">Actions</th>
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
                                                                <span className="sr-mobile-label">Vehicle</span>
                                                                <span className="sr-mobile-value">{request.licensePlate}</span>
                                                            </div>
                                                        )}
                                                        <div className="sr-mobile-row">
                                                            <span className="sr-mobile-label">Scheduled</span>
                                                            <span className="sr-mobile-value">{formatDateTimeFull(request.scheduledStart)}</span>
                                                        </div>
                                                        <div className="sr-mobile-row">
                                                            <span className="sr-mobile-label">Driver Cost</span>
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
                                                            View Details
                                                        </Button>
                                                        <Button
                                                            className="sr-mobile-delete-btn"
                                                            onClick={() => handleDeleteServiceRequest(request.id || request.Id)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3,6 5,6 21,6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                            Cancel
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
                                    Page {pagination.page} of {totalPages}
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
                </div>
            </main>
        </div>
    );
};

export default ServiceRequests;
