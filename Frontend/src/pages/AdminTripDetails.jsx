import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/AdminTripDetails.css';

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#16a34a', '#ea580c', '#8b5cf6',
];

const getColorForEmail = (email) => {
  if (!email) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getDriverInitials = (email) => {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  return name.charAt(0).toUpperCase();
};

const AdminTripDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const trip = location.state?.trip || {};

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [driverImgUrl, setDriverImgUrl] = useState(null);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const imgId = trip.profileImgFileId ?? trip.ProfileImgFileId;
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
  }, [trip.profileImgFileId, trip.ProfileImgFileId]);

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
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

  const id          = trip.id ?? trip.Id ?? '—';
  const startTime   = formatDateTime(trip.startTime ?? trip.StartTime);

  const computeEndTime = () => {
    const rawEnd = trip.endTime ?? trip.EndTime;
    if (rawEnd) {
      const d = new Date(rawEnd);
      if (!isNaN(d.getTime())) return formatDateTime(rawEnd);
    }
    // Calculate from startTime + duration
    const rawStart = trip.startTime ?? trip.StartTime;
    const rawDur = trip.long ?? trip.Long;
    if (!rawStart || !rawDur) return 'N/A';
    const start = new Date(rawStart);
    if (isNaN(start.getTime())) return 'N/A';
    if (typeof rawDur === 'string') {
      const parts = rawDur.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
        const ms = ((h * 60 + m) * 60 + s) * 1000;
        return formatDateTime(new Date(start.getTime() + ms).toISOString());
      }
    }
    return 'N/A';
  };

  const endTime     = computeEndTime();
  const duration    = formatDuration(trip.long ?? trip.Long);
  const plate       = trip.licensePlate ?? trip.LicensePlate ?? '—';
  const email       = trip.userEmail ?? trip.UserEmail ?? '—';
  const origin      = trip.startLocation ?? trip.StartLocation ?? '—';
  const destination = trip.endLocation ?? trip.EndLocation ?? '—';
  const distance    = parseFloat(trip.distanceKm ?? trip.DistanceKm) || 0;
  const notes       = trip.notes ?? trip.Notes ?? '';
  const isDeleted   = trip.isDeleted ?? trip.IsDeleted ?? false;
  const avatarColor = getColorForEmail(email);

  return (
    <div className="atd-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="atd-main">
        <div className="atd-page">

          {/* ── Top bar ───────────────────────────────── */}
          <div className="atd-topbar">
            <button className="atd-back-btn" onClick={() => navigate(-1)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <div className="atd-title-group">
              <h1 className="atd-title">Trip #{id}</h1>
              {isDeleted && <span className="atd-deleted-badge">Deleted</span>}
            </div>
          </div>

          {/* ── Route Banner ──────────────────────────── */}
          <div className="atd-route-banner">
            <div className="atd-route-point">
              <span className="atd-route-dot atd-route-dot--origin" />
              <div className="atd-route-info">
                <span className="atd-route-label">Departure</span>
                <span className="atd-route-value">{origin}</span>
              </div>
            </div>
            <div className="atd-route-line">
              <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
                <line x1="0" y1="8" x2="32" y2="8" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>
                <polyline points="28,3 36,8 28,13" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <span className="atd-route-distance">{distance.toFixed(1)} km</span>
            </div>
            <div className="atd-route-point">
              <span className="atd-route-dot atd-route-dot--dest" />
              <div className="atd-route-info">
                <span className="atd-route-label">Arrival</span>
                <span className="atd-route-value">{destination}</span>
              </div>
            </div>
          </div>

          <div className="atd-layout">

            {/* ── LEFT: Driver ──────────────────────────── */}
            <div className="atd-left-col">

              {/* Driver card */}
              <div className="atd-section-card">
                <div className="atd-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Driver
                </div>
                <div className="atd-driver-row">
                  <div className="atd-driver-avatar" style={{ background: avatarColor }}>
                    {driverImgUrl ? (
                      <img src={driverImgUrl} alt={email} />
                    ) : (
                      <span>{getDriverInitials(email)}</span>
                    )}
                  </div>
                  <div className="atd-driver-info">
                    <span className="atd-driver-email">{email}</span>
                    <span className="atd-plate-badge">{plate}</span>
                  </div>
                </div>
              </div>

              {/* Stats card */}
              <div className="atd-section-card">
                <div className="atd-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Statistics
                </div>
                <div className="atd-stats-grid">
                  <div className="atd-stat-item atd-stat-item--blue">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 12h18" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 6l9-4 9 4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 18l9 4 9-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="atd-stat-value">{distance.toFixed(1)} km</span>
                    <span className="atd-stat-label">Distance</span>
                  </div>
                  <div className="atd-stat-item atd-stat-item--purple">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="atd-stat-value">{duration}</span>
                    <span className="atd-stat-label">Duration</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT: Trip Details ───────────────────── */}
            <div className="atd-right-col">

              <div className="atd-section-card">
                <div className="atd-card-header">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Trip Details
                </div>
                <dl className="atd-detail-list">
                  <div className="atd-detail-row">
                    <dt>Trip ID</dt>
                    <dd className="atd-muted">#{id}</dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>Status</dt>
                    <dd>
                      {isDeleted
                        ? <span className="atd-status atd-status--deleted">Deleted</span>
                        : <span className="atd-status atd-status--active">Active</span>
                      }
                    </dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>Vehicle</dt>
                    <dd><span className="atd-plate-badge">{plate}</span></dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>Start Time</dt>
                    <dd>{startTime}</dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>End Time</dt>
                    <dd>{endTime}</dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>Duration</dt>
                    <dd>{duration}</dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>Distance</dt>
                    <dd className="atd-highlight">{distance.toFixed(1)} km</dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>Departure</dt>
                    <dd>{origin}</dd>
                  </div>
                  <div className="atd-detail-row">
                    <dt>Arrival</dt>
                    <dd>{destination}</dd>
                  </div>
                  {notes && (
                    <div className="atd-detail-row atd-detail-row--notes">
                      <dt>Notes</dt>
                      <dd>{notes}</dd>
                    </div>
                  )}
                </dl>
              </div>

            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default AdminTripDetails;
