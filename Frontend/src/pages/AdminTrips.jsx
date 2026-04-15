import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Container, Spinner } from 'react-bootstrap';
import JSZip from 'jszip';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import CustomModal from '../components/CustomModal';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/AdminTrips.css';

const PAGE_SIZE = 10;

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

const AdminTrips = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const debounceRef = useRef(null);

  const [showDeleted, setShowDeleted] = useState(false);
  const [ordering, setOrdering] = useState('starttime_desc');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);
  const dateDebounceRef = useRef(null);
  const [debouncedDateFrom, setDebouncedDateFrom] = useState('');
  const [debouncedDateTo, setDebouncedDateTo] = useState('');

  const [driverImages, setDriverImages] = useState({});
  const [csvLoading, setCsvLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [exportEmptyModalOpen, setExportEmptyModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTrips = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    setError('');
    try {
      const df = debouncedDateFrom;
      const dt = debouncedDateTo;
      const dateFilterActive = !!(df || dt);

      const params = {
        page: dateFilterActive ? 1 : pageToLoad,
        pageSize: dateFilterActive ? 10000 : PAGE_SIZE,
        IsDeleted: showDeleted,
        Ordering: ordering,
      };
      if (searchQ.trim()) params.StringQ = searchQ.trim();

      const response = await api.get('/trips/admin', { params });
      const payload = response.data || {};
      let rawTrips = Array.isArray(payload.data) ? payload.data : [];

      if (dateFilterActive) {
        const from = df ? new Date(df + 'T00:00:00') : null;
        const to   = dt ? new Date(dt + 'T23:59:59') : null;
        rawTrips = rawTrips.filter((trip) => {
          const start = new Date(trip.startTime ?? trip.StartTime);
          const endRaw = trip.endTime ?? trip.EndTime;
          const end = endRaw ? new Date(endRaw) : start;
          // trip matches if startTime OR endTime falls within the range
          const startInRange = (!from || start >= from) && (!to || start <= to);
          const endInRange   = (!from || end   >= from) && (!to || end   <= to);
          return startInRange || endInRange;
        });
        const start = (pageToLoad - 1) * PAGE_SIZE;
        const total = rawTrips.length;
        rawTrips = rawTrips.slice(start, start + PAGE_SIZE);
        setTotalCount(total);
        setPage(pageToLoad);
      } else {
        setTotalCount(payload.totalCount || 0);
        setPage(payload.page || pageToLoad);
      }

      setTrips(rawTrips);
    } catch (err) {
      const apiMsg = err?.response?.data;
      const message =
        typeof apiMsg === 'string'
          ? apiMsg
          : apiMsg?.message || apiMsg?.Message || 'An error occurred while fetching trips.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchQ, showDeleted, ordering, debouncedDateFrom, debouncedDateTo]);

  useEffect(() => {
    fetchTrips(1);
    setPage(1);
  }, [fetchTrips]);
  useEffect(() => {
    if (trips.length === 0) return;
    let cancelled = false;
    const fetchImages = async () => {
      const newImages = {};
      await Promise.all(
        trips.map(async (trip) => {
          const imgId = trip.profileImgFileId ?? trip.ProfileImgFileId;
          if (imgId && driverImages[imgId] === undefined) {
            try {
              const res = await api.get(`/files/${imgId}`, { responseType: 'blob' });
              newImages[imgId] = URL.createObjectURL(res.data);
            } catch {
              newImages[imgId] = null;
            }
          }
        })
      );
      if (!cancelled && Object.keys(newImages).length > 0) {
        setDriverImages((prev) => ({ ...prev, ...newImages }));
      }
    };
    fetchImages();
    return () => { cancelled = true; };
  }, [trips]);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQ(val), 400);
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    setActionError('');
    try {
      await api.patch(`/trips/delete/${id}`);
      fetchTrips(page);
    } catch (err) {
      const msg = err?.response?.data;
      setActionError(typeof msg === 'string' ? msg : msg?.message || 'Failed to delete trip.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (id) => {
    setActionLoading(id);
    setActionError('');
    try {
      await api.patch(`/trips/restore/${id}`);
      fetchTrips(page);
    } catch (err) {
      const msg = err?.response?.data;
      setActionError(typeof msg === 'string' ? msg : msg?.message || 'Failed to restore trip.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = () => {    setSearchInput('');
    setSearchQ('');
    setDateFrom('');
    setDateTo('');
    setDebouncedDateFrom('');
    setDebouncedDateTo('');
    setShowDeleted(false);
    setOrdering('starttime_desc');
  };

  const handleExport = async () => {
    setCsvLoading(true);
    try {
      const params = { page: 1, pageSize: 10000, IsDeleted: showDeleted, Ordering: ordering };
      if (searchQ.trim()) params.StringQ = searchQ.trim();

      const response = await api.get('/trips/admin', { params });
      let rows = Array.isArray(response.data?.data) ? response.data.data : [];

      const df = debouncedDateFrom;
      const dt = debouncedDateTo;
      if (df || dt) {
        const from = df ? new Date(df + 'T00:00:00') : null;
        const to   = dt ? new Date(dt + 'T23:59:59') : null;
        rows = rows.filter((t) => {
          const d = new Date(t.startTime ?? t.StartTime);
          if (from && d < from) return false;
          if (to   && d > to)   return false;
          return true;
        });
      }

      if (rows.length === 0) {
        setError('');
        setCsvLoading(false);
        setExportEmptyModalOpen(true);
        return;
      }

      const exportTotal = rows.length;
      const exportDistance = rows.reduce((s, t) => s + (parseFloat(t.distanceKm ?? t.DistanceKm) || 0), 0);
      const exportAvgDist = exportTotal > 0 ? exportDistance / exportTotal : 0;
      const exportDate = new Date().toLocaleString('hu-HU');
      const dateRange = df || dt ? `${df || '—'} → ${dt || '—'}` : 'All dates';
      const searchFilter = searchQ.trim() || '—';
      const statusFilter = showDeleted ? 'Including deleted' : 'Active only';
      const orderingLabel = { date_desc: 'Date (Newest first)', date: 'Date (Oldest first)' }[ordering] || ordering;
      const fileDate = new Date().toISOString().slice(0, 10);

      // ── CSV ──────────────────────────────────────────────────────────────
      const summary = [
        `FleetFlow – Trips Export`,
        `Exported at:,${exportDate}`,
        ``,
        `── Applied Filters ──────────────────────────────`,
        `Date range:,${dateRange}`,
        `Search:,${searchFilter}`,
        `Status:,${statusFilter}`,
        `Sort order:,${orderingLabel}`,
        ``,
        `── Summary ──────────────────────────────────────`,
        `Total trips:,${exportTotal.toLocaleString('hu-HU')}`,
        `Total distance:,"${exportDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km"`,
        `Avg distance per trip:,"${exportAvgDist.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km"`,
        ``,
        `── Trip Records ─────────────────────────────────`,
      ];
      const headers = ['ID', 'Start Date', 'Start Time', 'Vehicle', 'Driver Email', 'Origin', 'Destination', 'Distance (km)', 'Duration', 'Notes', 'Deleted'];
      const csvRows = rows.map((t) => {
        const fmt = formatDateTime(t.startTime ?? t.StartTime);
        const duration = formatDuration(t.long ?? t.Long);
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        return [
          t.id ?? t.Id,
          fmt.date,
          fmt.time,
          esc(t.licensePlate ?? t.LicensePlate ?? ''),
          esc(t.userEmail ?? t.UserEmail ?? ''),
          esc(t.startLocation ?? t.StartLocation ?? ''),
          esc(t.endLocation ?? t.EndLocation ?? ''),
          (t.distanceKm ?? t.DistanceKm ?? 0).toString().replace('.', ','),
          esc(duration),
          esc(t.notes ?? t.Notes ?? ''),
          (t.isDeleted ?? t.IsDeleted) ? 'Yes' : 'No',
        ].join(',');
      });
      const csv = '\uFEFF' + [...summary, headers.join(','), ...csvRows].join('\r\n');

      // ── Word (cards) ─────────────────────────────────────────────────────
      const tripCards = rows.map((t) => {
        const fmt = formatDateTime(t.startTime ?? t.StartTime);
        const dist = (parseFloat(t.distanceKm ?? t.DistanceKm) || 0).toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const dur = formatDuration(t.long ?? t.Long);
        const isDeleted = t.isDeleted ?? t.IsDeleted;
        const notes = t.notes ?? t.Notes ?? '';
        const plate = t.licensePlate ?? t.LicensePlate ?? '—';
        const driver = t.userEmail ?? t.UserEmail ?? '—';
        const origin = t.startLocation ?? t.StartLocation ?? '—';
        const dest = t.endLocation ?? t.EndLocation ?? '—';
        const id = t.id ?? t.Id;
        return `
      <table class="card-block"><tr><td>
      <div class="trip-card${isDeleted ? ' deleted' : ''}">
  <div class="card-header">
    <div class="card-number">#${id}</div>
    <div class="card-plate">${plate}</div>
    <div class="card-date">${fmt.date} &nbsp; ${fmt.time}</div>
    ${isDeleted ? '<div class="deleted-badge">Deleted</div>' : ''}
  </div>
  <div class="card-route">
    <div class="route-point">
      <span class="route-dot dot-origin"></span>
      <span class="route-label">From</span>
      <span class="route-value">${origin}</span>
    </div>
    <div class="route-arrow">&#8594;</div>
    <div class="route-point">
      <span class="route-dot dot-dest"></span>
      <span class="route-label">To</span>
      <span class="route-value">${dest}</span>
    </div>
  </div>
  <div class="card-stats">
    <div class="stat-pill">&#128205; ${dist} km</div>
    <div class="stat-pill">&#128344; ${dur}</div>
    <div class="stat-pill">&#128197; ${fmt.date}</div>
  </div>
  <div class="card-footer">
    <span class="driver-label">Driver:</span> <span class="driver-email">${driver}</span>${notes ? ` &nbsp;|&nbsp; <span class="notes-text">${notes}</span>` : ''}
  </div>
</div>
</td></tr></table>`;
      }).join('\n');

      const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<title>FleetFlow - Trips Export</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 32px; color: #0f172a; font-size: 13px; }
  h1 { font-size: 22px; color: #1d6ee6; margin-bottom: 2px; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 4px; }
  .meta { color: #94a3b8; font-size: 11px; margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .filter-grid { display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 8px; }
  .filter-item span { font-size: 10px; text-transform: uppercase; color: #94a3b8; display: block; }
  .filter-item b { font-size: 13px; color: #1e293b; }
  .stats-grid { display: flex; gap: 16px; margin-bottom: 24px; }
  .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; min-width: 140px; }
  .stat-box .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; }
  .stat-box .value { font-size: 20px; font-weight: 700; color: #0f172a; }
  .stat-box.blue { border-top: 3px solid #3b82f6; }
  .stat-box.green { border-top: 3px solid #16a34a; }
  .stat-box.purple { border-top: 3px solid #7c3aed; }
  .card-block { width: 100%; border-collapse: collapse; page-break-inside: avoid; break-inside: avoid; }
  .card-block td { padding: 0; }
  .trip-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 14px; background: #ffffff; page-break-inside: avoid; break-inside: avoid-page; break-inside: avoid; -webkit-column-break-inside: avoid; -moz-column-break-inside: avoid; display: block; width: 100%; }
  .trip-card.deleted { border-color: #fca5a5; background: #fff5f5; }
  .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
  .card-number { font-size: 11px; font-weight: 700; color: #94a3b8; min-width: 28px; }
  .card-plate { font-size: 15px; font-weight: 700; color: #1e293b; background: #f1f5f9; border-radius: 5px; padding: 2px 10px; letter-spacing: 1px; }
  .card-date { font-size: 12px; color: #64748b; margin-left: auto; }
  .deleted-badge { font-size: 10px; font-weight: 700; color: #ef4444; background: #fee2e2; border-radius: 4px; padding: 2px 8px; }
  .card-route { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
  .route-point { display: flex; align-items: center; gap: 6px; flex: 1; }
  .route-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .dot-origin { background: #3b82f6; }
  .dot-dest { background: #ef4444; }
  .route-label { font-size: 9px; text-transform: uppercase; color: #94a3b8; min-width: 22px; }
  .route-value { font-size: 12px; color: #1e293b; }
  .route-arrow { font-size: 18px; color: #cbd5e1; }
  .card-stats { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .stat-pill { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 3px 12px; font-size: 11px; color: #475569; }
  .card-footer { font-size: 11px; color: #64748b; }
  .driver-label { font-weight: 600; color: #475569; }
  .driver-email { color: #1d6ee6; }
  .notes-text { font-style: italic; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #f1f5f9; padding-top: 12px; }
</style>
</head>
<body>
<h1>FleetFlow - Trips Export</h1>
<div class="subtitle">Fleet management trip records</div>
<div class="meta">Exported: ${exportDate}</div>

<div class="section-title">Applied Filters</div>
<div class="filter-grid">
  <div class="filter-item"><span>Date range</span><b>${dateRange}</b></div>
  <div class="filter-item"><span>Search</span><b>${searchFilter}</b></div>
  <div class="filter-item"><span>Status</span><b>${statusFilter}</b></div>
  <div class="filter-item"><span>Sort order</span><b>${orderingLabel}</b></div>
</div>

<div class="section-title">Summary</div>
<div class="stats-grid">
  <div class="stat-box blue"><div class="label">Total Trips</div><div class="value">${exportTotal.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box green"><div class="label">Total Distance</div><div class="value">${exportDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div></div>
  <div class="stat-box purple"><div class="label">Avg Distance / Trip</div><div class="value">${exportAvgDist.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div></div>
</div>

<div class="section-title">Trip Records (${exportTotal})</div>
${tripCards}

<div class="footer">FleetFlow - generated ${exportDate}</div>
</body>
</html>`;

      const zip = new JSZip();
      zip.file(`trips_export_${fileDate}.csv`, csv);
      zip.file(`trips_export_${fileDate}.doc`, html);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const zipA = document.createElement('a');
      zipA.href = zipUrl;
      zipA.download = `trips_export_${fileDate}.zip`;
      document.body.appendChild(zipA);
      zipA.click();
      document.body.removeChild(zipA);
      URL.revokeObjectURL(zipUrl);
    } catch {
      setError('Failed to export.');
    } finally {
      setCsvLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return { date: 'N/A', time: '' };
    const date = new Date(value);
    if (isNaN(date.getTime())) return { date: 'N/A', time: '' };
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
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

  const getDriverInitials = (email) => {
    if (!email) return '?';
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  const totalDistance = trips.reduce((sum, t) => sum + (parseFloat(t.distanceKm ?? t.DistanceKm) || 0), 0);
  const avgDistance = trips.length > 0 ? totalDistance / trips.length : 0;

  const buildPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        items.push(i);
      } else if (i === page - 2 || i === page + 2) {
        items.push('...');
      }
    }
    return items.filter((item, idx) => !(item === '...' && items[idx - 1] === '...'));
  };

  const renderPagination = () => (
    <div className="at-pagination">
      <span className="at-pagination-info">
        Showing <strong>{startItem} to {endItem}</strong> of <strong>{totalCount}</strong> results
      </span>
      <div className="at-pagination-controls">
        <button className="at-page-btn" disabled={page <= 1} onClick={() => fetchTrips(page - 1)}>‹</button>
        {buildPaginationItems().map((item, idx) =>
          item === '...' ? (
            <span key={`el-${idx}`} className="at-page-ellipsis">…</span>
          ) : (
            <button
              key={item}
              className={`at-page-btn${page === item ? ' at-page-btn--active' : ''}`}
              onClick={() => fetchTrips(item)}
            >
              {item}
            </button>
          )
        )}
        <button className="at-page-btn" disabled={page >= totalPages} onClick={() => fetchTrips(page + 1)}>›</button>
      </div>
    </div>
  );

  return (
    <div className="at-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="at-main">
        <Container fluid className="at-page">

          <CustomModal
            isOpen={exportEmptyModalOpen}
            onClose={() => setExportEmptyModalOpen(false)}
            title={t('adminDash.export.emptyTitle')}
            primaryAction={{
              label: t('common.ok'),
              onClick: () => setExportEmptyModalOpen(false),
            }}
          >
            <p className="mb-0">{t('adminDash.export.emptyMessage')}</p>
          </CustomModal>

          {/* ── Header ─────────────────────────────────── */}
          <div className="at-header">
            <div>
              <h1 className="at-title">Trips Overview</h1>
              <p className="at-subtitle">Monitor and analyze all fleet movements and logistic routes.</p>
            </div>
            <button className="at-export-btn" onClick={handleExport} disabled={csvLoading}>
              {csvLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Export Page
            </button>
          </div>

          {/* ── Filter Bar ─────────────────────────────── */}
          <div className="at-filter-card">
            <div className="at-filter-row">

              {/* Date Range */}
              <div className="at-filter-group at-filter-group--date">
                <label className="at-filter-label">DATE RANGE</label>
                <div className="at-date-range">
                  <div className="at-date-wrapper" onClick={() => dateFromRef.current?.showPicker?.()}>
                    <svg className="at-date-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      ref={dateFromRef}
                      type="date"
                      className="at-date-input"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDateFrom(val);
                        if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
                        dateDebounceRef.current = setTimeout(() => setDebouncedDateFrom(val), 600);
                      }}
                    />
                  </div>
                  <span className="at-date-sep">–</span>
                  <div className="at-date-wrapper" onClick={() => dateToRef.current?.showPicker?.()}>
                    <svg className="at-date-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      ref={dateToRef}
                      type="date"
                      className="at-date-input"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDateTo(val);
                        if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
                        dateDebounceRef.current = setTimeout(() => setDebouncedDateTo(val), 600);
                      }}
                    />
                  </div>

                </div>
              </div>



              {/* Search */}
              <div className="at-filter-group">
                <label className="at-filter-label">SEARCH</label>
                <div className="at-search-wrapper">
                  <svg className="at-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <input
                    className="at-search-input"
                    type="text"
                    placeholder="Search by name, plate, location..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="at-filter-group">
                <label className="at-filter-label">SORT ORDER</label>
                <div className="at-select-wrapper">
                  <select className="at-select" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
                    <option value="starttime_desc">Date (Newest first)</option>
                    <option value="starttime">Date (Oldest first)</option>
                    <option value="distance_desc">Distance (High → Low)</option>
                    <option value="distance">Distance (Low → High)</option>
                  </select>
                  <svg className="at-select-chevron" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Show Deleted toggle + Reset */}
              <div className="at-filter-group at-filter-group--actions">
                <label className="at-toggle-label">
                  <span className="at-toggle-text">Show Deleted</span>
                  <div
                    className={`at-toggle-track${showDeleted ? ' at-toggle-track--on' : ''}`}
                    onClick={() => setShowDeleted((v) => !v)}
                  >
                    <div className="at-toggle-thumb" />
                  </div>
                </label>
                <button className="at-reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </div>
          </div>

          {/* ── Stats Cards ─────────────────────────────── */}
          <div className="at-stats-grid">
            <div className="at-stat-card">
              <div className="at-stat-icon at-stat-icon--blue">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="at-stat-body">
                <div className="at-stat-top">
                  <span className="at-stat-label">Total Trips</span>
                  <span className="at-stat-badge at-stat-badge--blue">All records</span>
                </div>
                <span className="at-stat-value">{totalCount.toLocaleString('hu-HU')}</span>
              </div>
            </div>

            <div className="at-stat-card">
              <div className="at-stat-icon at-stat-icon--green">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12h18" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 6l9-4 9 4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 18l9 4 9-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="at-stat-body">
                <div className="at-stat-top">
                  <span className="at-stat-label">Total Distance</span>
                  <span className="at-stat-badge at-stat-badge--green">Current page</span>
                </div>
                <span className="at-stat-value">
                  {totalDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km
                </span>
              </div>
            </div>

            <div className="at-stat-card">
              <div className="at-stat-icon at-stat-icon--purple">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="at-stat-body">
                <div className="at-stat-top">
                  <span className="at-stat-label">Avg Distance</span>
                  <span className="at-stat-badge at-stat-badge--purple">Current page</span>
                </div>
                <span className="at-stat-value">
                  {avgDistance.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km
                </span>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          {actionError && (
            <Alert variant="danger" className="mb-3" onClose={() => setActionError('')} dismissible>
              {actionError}
            </Alert>
          )}

          {/* ── Table Card ─────────────────────────────── */}
          <div className="at-table-card">
            {loading ? (
              <div className="at-spinner-wrap">
                <Spinner animation="border" role="status"/>
              </div>
            ) : trips.length === 0 ? (
              <div className="at-empty">
                <svg width="60" height="60" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>No trips found</p>
              </div>
            ) : (
              <>
                {/* ── Desktop Table ─────────────────────── */}
                <div className="at-desktop-table">
                  <table className="at-table">
                    <thead>
                      <tr>
                        <th className="at-th">DATE</th>
                        <th className="at-th">VEHICLE</th>
                        <th className="at-th">DRIVER</th>
                        <th className="at-th">DEPARTURE LOCATION</th>
                        <th className="at-th">ARRIVAL LOCATION</th>
                        <th className="at-th">DISTANCE (KM)</th>
                        <th className="at-th">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip) => {
                        const id = trip.id ?? trip.Id;
                        const formatted = formatDateTime(trip.startTime ?? trip.StartTime);
                        const duration = trip.long ?? trip.Long;
                        const plate = trip.licensePlate ?? trip.LicensePlate ?? '—';
                        const email = trip.userEmail ?? trip.UserEmail ?? '—';
                        const origin = trip.startLocation ?? trip.StartLocation ?? '—';
                        const destination = trip.endLocation ?? trip.EndLocation ?? '—';
                        const distance = parseFloat(trip.distanceKm ?? trip.DistanceKm) || 0;
                        const isDeleted = trip.isDeleted ?? trip.IsDeleted ?? false;
                        const imgId = trip.profileImgFileId ?? trip.ProfileImgFileId;
                        const imgUrl = imgId != null ? driverImages[imgId] : null;
                        const avatarColor = getColorForEmail(email);

                        return (
                          <tr key={id} className={`at-tr${isDeleted ? ' at-tr--deleted' : ''}`}>
                            <td className="at-td">
                              <div className="at-date-block">
                                <div className="at-date-main">{formatted.date}</div>
                                {formatted.time && <div className="at-date-time">{formatted.time}</div>}
                                {duration && <div className="at-date-duration">{formatDuration(duration)}</div>}
                              </div>
                            </td>
                            <td className="at-td">
                              <div className="at-vehicle-cell">
                                <span className="at-plate">{plate}</span>
                              </div>
                            </td>
                            <td className="at-td">
                              <div className="at-driver-cell">
                                <div className="at-avatar" style={{ background: avatarColor }}>
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={email}/>
                                  ) : (
                                    <span>{getDriverInitials(email)}</span>
                                  )}
                                </div>
                                <span className="at-driver-email">{email}</span>
                              </div>
                            </td>
                            <td className="at-td at-td--location">{origin}</td>
                            <td className="at-td at-td--location">{destination}</td>
                            <td className="at-td at-td--distance">{distance.toFixed(1)}</td>
                            <td className="at-td">
                              <div className="at-action-btns">
                                <button
                                  className="at-icon-btn at-icon-btn--view"
                                  title="Details"
                                  onClick={() => navigate('/admin-trip-details', { state: { trip } })}
                                >
                                  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                {isDeleted ? (
                                  <button
                                    className="at-icon-btn at-icon-btn--restore"
                                    title="Restore"
                                    disabled={actionLoading === id}
                                    onClick={() => handleRestore(id)}
                                  >
                                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M3.51 15a9 9 0 1 0 .49-4.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    className="at-icon-btn at-icon-btn--delete"
                                    title="Delete"
                                    disabled={actionLoading === id}
                                    onClick={() => handleDelete(id)}
                                  >
                                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M10 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile Cards ───────────────────────── */}
                <div className="at-mobile-cards">
                  {trips.map((trip) => {
                    const id = trip.id ?? trip.Id;
                    const formatted = formatDateTime(trip.startTime ?? trip.StartTime);
                    const plate = trip.licensePlate ?? trip.LicensePlate ?? '—';
                    const email = trip.userEmail ?? trip.UserEmail ?? '—';
                    const origin = trip.startLocation ?? trip.StartLocation ?? '—';
                    const destination = trip.endLocation ?? trip.EndLocation ?? '—';
                    const distance = parseFloat(trip.distanceKm ?? trip.DistanceKm) || 0;
                    const isDeleted = trip.isDeleted ?? trip.IsDeleted ?? false;
                    const imgId = trip.profileImgFileId ?? trip.ProfileImgFileId;
                    const imgUrl = imgId != null ? driverImages[imgId] : null;
                    const avatarColor = getColorForEmail(email);

                    return (
                      <div key={id} className={`at-mobile-card${isDeleted ? ' at-mobile-card--deleted' : ''}`}>
                        <div className="at-mc-header">
                          <div className="at-vehicle-cell">
                            <svg className="at-truck-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              <rect x="2" y="11" width="14" height="9" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 11l4 4v5h-4" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="6.5" cy="20" r="1.5"/>
                              <circle cx="17.5" cy="20" r="1.5"/>
                            </svg>
                            <span className="at-plate">{plate}</span>
                          </div>
                          <span className="at-mc-distance">{distance.toFixed(1)} km</span>
                        </div>
                        <div className="at-mc-date">{formatted.date} {formatted.time}</div>
                        <div className="at-mc-row">
                          <span className="at-mc-label">Driver</span>
                          <div className="at-driver-cell">
                            <div className="at-avatar at-avatar--sm" style={{ background: avatarColor }}>
                              {imgUrl ? <img src={imgUrl} alt={email}/> : <span>{getDriverInitials(email)}</span>}
                            </div>
                            <span className="at-driver-email">{email}</span>
                          </div>
                        </div>
                        <div className="at-mc-row">
                          <span className="at-mc-label">Origin</span>
                          <span>{origin}</span>
                        </div>
                        <div className="at-mc-row">
                          <span className="at-mc-label">Destination</span>
                          <span>{destination}</span>
                        </div>
                        <div className="at-mc-actions">
                          <button
                            className="at-icon-btn at-icon-btn--view"
                            title="Details"
                            onClick={() => navigate('/admin-trip-details', { state: { trip } })}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          {isDeleted ? (
                            <button
                              className="at-icon-btn at-icon-btn--restore"
                              title="Restore"
                              disabled={actionLoading === id}
                              onClick={() => handleRestore(id)}
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3.51 15a9 9 0 1 0 .49-4.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          ) : (
                            <button
                              className="at-icon-btn at-icon-btn--delete"
                              title="Delete"
                              disabled={actionLoading === id}
                              onClick={() => handleDelete(id)}
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {renderPagination()}
              </>
            )}
          </div>

        </Container>
        <Footer />
      </main>
    </div>
  );
};

export default AdminTrips;
