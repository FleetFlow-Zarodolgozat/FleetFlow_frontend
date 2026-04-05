import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/AdminServiceRequestDetails.css';

const STATUS_LABELS = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DRIVER_COST: 'Cost Reported',
  CLOSED: 'Closed',
};

const AdminServiceRequestDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const request = location.state?.request || {};

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  // Invoice image
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Driver profile image
  const [driverImgUrl, setDriverImgUrl] = useState(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(request.status ?? request.Status ?? '—');
  const [approveMode, setApproveMode] = useState(false);
  const [approveDate, setApproveDate] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch invoice image
  useEffect(() => {
    const invoiceId = request.invoiceFileId ?? request.InvoiceFileId;
    if (!invoiceId) return;
    let objectUrl = null;
    setInvoiceLoading(true);
    setInvoiceError(false);
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/files/${invoiceId}`, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        setInvoiceUrl(objectUrl);
      } catch {
        setInvoiceError(true);
      } finally {
        setInvoiceLoading(false);
      }
    };
    fetchInvoice();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [request.invoiceFileId, request.InvoiceFileId]);

  // Fetch driver profile image
  useEffect(() => {
    const imgId = request.profileImgFileId ?? request.ProfileImgFileId;
    if (!imgId) return;
    let objectUrl = null;
    const fetchImg = async () => {
      try {
        const res = await api.get(`/files/${imgId}`, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        setDriverImgUrl(objectUrl);
      } catch {
        // silently ignore
      }
    };
    fetchImg();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [request.profileImgFileId, request.ProfileImgFileId]);

  const formatDateTime = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('hu-HU', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusClass = (s) => {
    switch (s) {
      case 'REQUESTED':   return 'asrd-status--requested';
      case 'APPROVED':    return 'asrd-status--approved';
      case 'REJECTED':    return 'asrd-status--rejected';
      case 'DRIVER_COST': return 'asrd-status--driver-cost';
      case 'CLOSED':      return 'asrd-status--closed';
      default:            return 'asrd-status--default';
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoiceUrl) return;
    const a = document.createElement('a');
    a.href = invoiceUrl;
    a.download = `invoice-service-request-${id}.jpg`;
    a.click();
  };

  const handleApprove = async () => {
    if (!approveDate) {
      setActionError('Please select a scheduled date.');
      return;
    }
    if (!serviceLocation.trim()) {
      setActionError('Please enter a service location.');
      return;
    }
    setActionLoading('approve');
    setActionError(null);
    setActionSuccess(null);
    try {
      const dto = { ScheduledStart: new Date(approveDate).toISOString(), ServiceLocation: serviceLocation };
      await api.patch(`/service-requests/approve/${request.id ?? request.Id}`, dto);
      setCurrentStatus('APPROVED');
      setActionSuccess('Request approved successfully.');
      setApproveMode(false);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.Message ?? 'Failed to approve the request.';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(action);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.patch(`/service-requests/${action}/${request.id ?? request.Id}`, null);
      const nextStatus = { reject: 'REJECTED', close: 'CLOSED' }[action];
      if (nextStatus) setCurrentStatus(nextStatus);
      const label = action === 'reject' ? 'rejected' : 'closed';
      setActionSuccess(`Request ${label} successfully.`);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.Message ?? `Failed to ${action} the request.`;
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const id             = request.id ?? request.Id ?? '—';
  const title          = request.title ?? request.Title ?? '—';
  const description    = request.description ?? request.Description;
  const status          = currentStatus;
  const scheduledStart = formatDateTime(request.scheduledStart ?? request.ScheduledStart);
  const closedAt       = formatDateTime(request.closedAt ?? request.ClosedAt);
  const plate          = request.licensePlate ?? request.LicensePlate ?? '—';
  const email          = request.userEmail ?? request.UserEmail ?? '—';
  const cost           = request.driverReportCost ?? request.DriverReportCost;
  const invoiceId      = request.invoiceFileId ?? request.InvoiceFileId;
  const initials       = email !== '—' ? email.charAt(0).toUpperCase() : '?';

  return (
    <div className="asrd-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="asrd-main">
        <div className="asrd-page">

          {/* ── Top bar ───────────────────────────────── */}
          <div className="asrd-topbar">
            <button className="asrd-back-btn" onClick={() => navigate(-1)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>

            <div className="asrd-title-group">
              <h1 className="asrd-title">Service Request #{id}</h1>
              <span className={`asrd-status-badge ${getStatusClass(status)}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>
          </div>

          <div className={`asrd-layout${!invoiceId ? ' asrd-layout--single' : ''}`}>

            {/* ── LEFT: Invoice image (hidden when no invoice) ─── */}
            {invoiceId && (
            <div className="asrd-invoice-col">
              <div className="asrd-section-card asrd-invoice-card">
                <div className="asrd-card-header asrd-card-header--invoice">
                  <div className="asrd-card-header-left">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="7" x2="15" y2="7" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="11" x2="15" y2="11" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="15" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Invoice / Receipt
                  </div>
                  {invoiceUrl && (
                    <button className="asrd-download-btn" onClick={handleDownloadInvoice}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Download
                    </button>
                  )}
                </div>

                <div className="asrd-invoice-frame">
                  {invoiceLoading ? (
                    <div className="asrd-invoice-placeholder">
                      <Spinner animation="border" />
                    </div>
                  ) : invoiceError || !invoiceId ? (
                    <div className="asrd-invoice-placeholder asrd-invoice-placeholder--empty">
                      <svg width="56" height="56" fill="none" stroke="#cbd5e1" strokeWidth="1.4" viewBox="0 0 24 24">
                        <rect x="5" y="2" width="14" height="20" rx="2" />
                        <line x1="9" y1="7" x2="15" y2="7" strokeLinecap="round" />
                        <line x1="9" y1="11" x2="15" y2="11" strokeLinecap="round" />
                        <line x1="9" y1="15" x2="12" y2="15" strokeLinecap="round" />
                      </svg>
                      <span>No invoice uploaded</span>
                    </div>
                  ) : (
                    <button
                      className="asrd-invoice-img-btn"
                      onClick={() => setLightboxOpen(true)}
                      title="Click to enlarge"
                    >
                      <img src={invoiceUrl} alt="Invoice" className="asrd-invoice-img" />
                      <div className="asrd-invoice-zoom-overlay">
                        <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
                          <line x1="11" y1="8" x2="11" y2="14" strokeLinecap="round" />
                          <line x1="8" y1="11" x2="14" y2="11" strokeLinecap="round" />
                        </svg>
                        Enlarge
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* ── RIGHT: Details cards ─────────────────── */}
            <div className="asrd-details-col">

              {/* Driver card */}
              <div className="asrd-section-card">
                <div className="asrd-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Driver
                </div>
                <div className="asrd-driver-row">
                  <div className="asrd-driver-avatar">
                    {driverImgUrl ? (
                      <img src={driverImgUrl} alt={email} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="asrd-driver-info">
                    <span className="asrd-driver-email">{email}</span>
                    <span className="asrd-plate-badge">{plate}</span>
                  </div>
                </div>
              </div>

              {/* Request details card */}
              <div className="asrd-section-card">
                <div className="asrd-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="9" y1="13" x2="15" y2="13" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="9" y1="17" x2="12" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Request Details
                </div>
                <dl className="asrd-detail-list">
                  <div className="asrd-detail-row">
                    <dt>Title</dt>
                    <dd>{title}</dd>
                  </div>
                  <div className="asrd-detail-row">
                    <dt>Scheduled Date</dt>
                    <dd>{scheduledStart ?? <span className="asrd-na">Not set</span>}</dd>
                  </div>
                  <div className="asrd-detail-row">
                    <dt>Closed At</dt>
                    <dd>{closedAt ?? <span className="asrd-na">Not closed</span>}</dd>
                  </div>
                  <div className="asrd-detail-row">
                    <dt>Reported Cost</dt>
                    <dd>
                      {cost != null
                        ? <span className="asrd-highlight asrd-highlight--cost">{Number(cost).toLocaleString('hu-HU')} Ft</span>
                        : <span className="asrd-na">Not reported</span>
                      }
                    </dd>
                  </div>
                  <div className="asrd-detail-row">
                    <dt>Vehicle</dt>
                    <dd><span className="asrd-plate-badge">{plate}</span></dd>
                  </div>
                  <div className="asrd-detail-row">
                    <dt>Request ID</dt>
                    <dd className="asrd-muted">#{id}</dd>
                  </div>
                  <div className="asrd-detail-row">
                    <dt>Status</dt>
                    <dd>
                      <span className={`asrd-status-badge ${getStatusClass(status)}`}>
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </dd>
                  </div>
                </dl>
                {(description && description !== '—') && (
                  <div className="asrd-detail-description">
                    <div className="asrd-detail-description-label">Description</div>
                    <div className="asrd-detail-description-text">{description}</div>
                  </div>
                )}
              </div>

              {/* Actions card */}
              {status !== 'APPROVED' && status !== 'REJECTED' && (
              <div className="asrd-section-card">
                <div className="asrd-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Actions
                </div>
                <div className="asrd-actions-body">
                  {actionError && (
                    <div className="asrd-action-alert asrd-action-alert--error">{actionError}</div>
                  )}
                  {actionSuccess && (
                    <div className="asrd-action-alert asrd-action-alert--success">{actionSuccess}</div>
                  )}

                  {status === 'REQUESTED' && (
                    <>
                      {!approveMode ? (
                        <>
                          <button
                            className="asrd-action-btn asrd-action-btn--approve"
                            onClick={() => { setApproveMode(true); setActionError(null); setApproveDate(''); setServiceLocation(''); }}
                            disabled={actionLoading !== null}
                          >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Approve
                          </button>
                          <button
                            className="asrd-action-btn asrd-action-btn--reject"
                            onClick={() => handleAction('reject')}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === 'reject'
                              ? <Spinner animation="border" size="sm" />
                              : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" /></svg>
                            }
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="asrd-approve-form">
                          <label className="asrd-approve-label">Schedule service date:</label>
                          <input
                            type="datetime-local"
                            className="asrd-approve-datepicker"
                            value={approveDate}
                            onChange={e => setApproveDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          <label className="asrd-approve-label">Service Location:</label>
                          <input
                            type="text"
                            className="asrd-approve-location"
                            value={serviceLocation}
                            onChange={e => setServiceLocation(e.target.value)}
                            placeholder="e.g., Main Service Center, Street Address, etc."
                          />
                          <div className="asrd-approve-actions">
                            <button
                              className="asrd-action-btn asrd-action-btn--cancel-approve"
                              onClick={() => { setApproveMode(false); setApproveDate(''); setServiceLocation(''); setActionError(null); }}
                              disabled={actionLoading !== null}
                            >
                              Cancel
                            </button>
                            <button
                              className="asrd-action-btn asrd-action-btn--save"
                              onClick={handleApprove}
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === 'approve'
                                ? <Spinner animation="border" size="sm" />
                                : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              }
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {status === 'APPROVED' && (
                    <button
                      className="asrd-action-btn asrd-action-btn--reject"
                      onClick={() => handleAction('reject')}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'reject'
                        ? <Spinner animation="border" size="sm" />
                        : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" /></svg>
                      }
                      Reject
                    </button>
                  )}
                  {status === 'DRIVER_COST' && (
                    <button
                      className="asrd-action-btn asrd-action-btn--close"
                      onClick={() => handleAction('close')}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'close'
                        ? <Spinner animation="border" size="sm" />
                        : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      }
                      Close Request
                    </button>
                  )}
                  {(status === 'CLOSED' || status === 'REJECTED') && (
                    <p className="asrd-no-actions">No actions available for this status.</p>
                  )}
                </div>
              </div>
              )}

            </div>{/* /details-col */}
          </div>{/* /layout */}
        </div>

        <Footer />
      </main>

      {/* ── Lightbox ──────────────────────────────────── */}
      {lightboxOpen && invoiceUrl && (
        <div className="asrd-lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="asrd-lightbox-close" onClick={() => setLightboxOpen(false)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
          <img
            src={invoiceUrl}
            alt="Invoice enlarged"
            className="asrd-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminServiceRequestDetails;
