import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import CustomModal from '../components/CustomModal';
import '../styles/AdminFuelLogDetails.css';

const AdminFuelLogDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const log = location.state?.log || {};

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  // Receipt image
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [downloadSuccessModalOpen, setDownloadSuccessModalOpen] = useState(false);

  // Driver profile image
  const [driverImgUrl, setDriverImgUrl] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!downloadSuccessModalOpen) return;
    const timeoutId = setTimeout(() => setDownloadSuccessModalOpen(false), 2000);
    return () => clearTimeout(timeoutId);
  }, [downloadSuccessModalOpen]);
  useEffect(() => {
    const receiptId = log.receiptFileId ?? log.ReceiptFileId;
    if (!receiptId) return;
    let objectUrl = null;
    setReceiptLoading(true);
    setReceiptError(false);
    const fetch = async () => {
      try {
        const res = await api.get(`/files/${receiptId}`, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        setReceiptUrl(objectUrl);
      } catch {
        setReceiptError(true);
      } finally {
        setReceiptLoading(false);
      }
    };
    fetch();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [log.receiptFileId, log.ReceiptFileId]);
  useEffect(() => {
    const imgId = log.profileImgFileId ?? log.ProfileImgFileId;
    if (!imgId) return;
    let objectUrl = null;
    const fetch = async () => {
      try {
        const res = await api.get(`/files/${imgId}`, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        setDriverImgUrl(objectUrl);
      } catch {
        // silently ignore
      }
    };
    fetch();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [log.profileImgFileId, log.ProfileImgFileId]);

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('hu-HU', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleDownloadReceipt = () => {
    if (!receiptUrl) return;
    const a = document.createElement('a');
    a.href = receiptUrl;
    a.download = `receipt-fuelog-${id}.jpg`;
    a.click();
    setDownloadSuccessModalOpen(true);
  };

  const id          = log.id ?? log.Id ?? '—';
  const date        = formatDateTime(log.date ?? log.Date);
  const plate       = log.licensePlate ?? log.LicensePlate ?? '—';
  const liters      = parseFloat(log.liters ?? log.Liters) || 0;
  const cost        = log.totalCostCur ?? log.TotalCostCur ?? '—';
  const station     = log.stationName ?? log.StationName ?? '—';
  const email       = log.userEmail ?? log.UserEmail ?? '—';
  const isDeleted   = log.isDeleted ?? log.IsDeleted ?? false;
  const receiptId   = log.receiptFileId ?? log.ReceiptFileId;
  const initials    = email !== '—' ? email.charAt(0).toUpperCase() : '?';

  return (
    <div className="afld-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="afld-main">
        <div className="afld-page">

          <CustomModal
            isOpen={downloadSuccessModalOpen}
            onClose={() => setDownloadSuccessModalOpen(false)}
            title="Success"
          >
            <p className="mb-0">Successfully downloaded.</p>
          </CustomModal>

          {/* ── Top bar ───────────────────────────────── */}
          <div className="afld-topbar">
            <button className="afld-back-btn" onClick={() => navigate(-1)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>

            <div className="afld-title-group">
              <h1 className="afld-title">Fuel Log #{id}</h1>
              {isDeleted && (
                <span className="afld-deleted-badge">Deleted</span>
              )}
            </div>
          </div>

          <div className="afld-layout">

            {/* ── LEFT: Receipt image ──────────────────── */}
            <div className="afld-receipt-col">
              <div className="afld-section-card afld-receipt-card">
                <div className="afld-card-header afld-card-header--receipt">
                  <div className="afld-card-header-left">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="7" x2="15" y2="7" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="11" x2="15" y2="11" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="9" y1="15" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Receipt / Voucher
                  </div>
                  {receiptUrl && (
                    <button className="afld-download-btn" onClick={handleDownloadReceipt}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Download
                    </button>
                  )}
                </div>

                <div className="afld-receipt-frame">
                  {receiptLoading ? (
                    <div className="afld-receipt-placeholder">
                      <Spinner animation="border" />
                    </div>
                  ) : receiptError || !receiptId ? (
                    <div className="afld-receipt-placeholder afld-receipt-placeholder--empty">
                      <svg width="56" height="56" fill="none" stroke="#cbd5e1" strokeWidth="1.4" viewBox="0 0 24 24">
                        <rect x="5" y="2" width="14" height="20" rx="2" />
                        <line x1="9" y1="7" x2="15" y2="7" strokeLinecap="round" />
                        <line x1="9" y1="11" x2="15" y2="11" strokeLinecap="round" />
                        <line x1="9" y1="15" x2="12" y2="15" strokeLinecap="round" />
                      </svg>
                      <span>No receipt uploaded</span>
                    </div>
                  ) : (
                    <>
                      <button
                        className="afld-receipt-img-btn"
                        onClick={() => setLightboxOpen(true)}
                        title="Click to enlarge"
                      >
                        <img
                          src={receiptUrl}
                          alt="Receipt"
                          className="afld-receipt-img"
                        />
                        <div className="afld-receipt-zoom-overlay">
                          <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
                            <line x1="11" y1="8" x2="11" y2="14" strokeLinecap="round" />
                            <line x1="8" y1="11" x2="14" y2="11" strokeLinecap="round" />
                          </svg>
                          Enlarge
                        </div>
                      </button>

                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Details ───────────────────────── */}
            <div className="afld-details-col">

              {/* Driver card */}
              <div className="afld-section-card">
                <div className="afld-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Driver
                </div>
                <div className="afld-driver-row">
                  <div className="afld-driver-avatar">
                    {driverImgUrl ? (
                      <img src={driverImgUrl} alt={email} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="afld-driver-info">
                    <span className="afld-driver-email">{email}</span>
                    <span className="afld-plate-badge">{plate}</span>
                  </div>
                </div>
              </div>

              {/* Fuel details */}
              <div className="afld-section-card">
                <div className="afld-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Fuel Log Details
                </div>
                <dl className="afld-detail-list">
                  <div className="afld-detail-row">
                    <dt>Log ID</dt>
                    <dd className="afld-muted">#{id}</dd>
                  </div>
                  <div className="afld-detail-row">
                    <dt>Date</dt>
                    <dd>{date}</dd>
                  </div>
                  <div className="afld-detail-row">
                    <dt>Quantity</dt>
                    <dd className="afld-highlight">{liters.toFixed(2)} L</dd>
                  </div>
                  <div className="afld-detail-row">
                    <dt>Total Cost</dt>
                    <dd className="afld-highlight afld-highlight--cost">{cost}</dd>
                  </div>
                  <div className="afld-detail-row">
                    <dt>Station Name</dt>
                    <dd>{station !== '—' ? station : <span className="afld-na">Not provided</span>}</dd>
                  </div>
                  <div className="afld-detail-row">
                    <dt>License Plate</dt>
                    <dd><span className="afld-plate-badge">{plate}</span></dd>
                  </div>
                  <div className="afld-detail-row">
                    <dt>Status</dt>
                    <dd>
                      {isDeleted
                        ? <span className="afld-status afld-status--deleted">Deleted</span>
                        : <span className="afld-status afld-status--active">Active</span>
                      }
                    </dd>
                  </div>
                </dl>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ── Lightbox ──────────────────────────────────── */}
      {lightboxOpen && receiptUrl && (
        <div
          className="afld-lightbox"
          onClick={() => setLightboxOpen(false)}
        >
          <button className="afld-lightbox-close" onClick={() => setLightboxOpen(false)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
          <img
            src={receiptUrl}
            alt="Receipt enlarged"
            className="afld-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminFuelLogDetails;
