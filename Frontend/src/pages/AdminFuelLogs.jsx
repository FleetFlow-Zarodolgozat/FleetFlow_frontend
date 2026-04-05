import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Container, Spinner } from 'react-bootstrap';
import JSZip from 'jszip';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/AdminFuelLogs.css';

const PAGE_SIZE = 10;

const AdminFuelLogs = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const debounceRef = useRef(null);

  const [showDeleted, setShowDeleted] = useState(false);
  const [ordering, setOrdering] = useState('date_desc');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);
  const dateDebounceRef = useRef(null);
  const [debouncedDateFrom, setDebouncedDateFrom] = useState('');
  const [debouncedDateTo, setDebouncedDateTo] = useState('');

  const [driverImages, setDriverImages] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchFuelLogs = useCallback(
    async (pageToLoad = 1) => {
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

        const response = await api.get('/fuellogs/admin', { params });
        const payload = response.data || {};
        let rawLogs = Array.isArray(payload.data) ? payload.data : [];

        if (dateFilterActive) {
          const from = df ? new Date(df + 'T00:00:00') : null;
          const to   = dt ? new Date(dt + 'T23:59:59') : null;
          rawLogs = rawLogs.filter((log) => {
            const d = new Date(log.date ?? log.Date);
            if (from && d < from) return false;
            if (to   && d > to)   return false;
            return true;
          });
          const start = (pageToLoad - 1) * PAGE_SIZE;
          const total = rawLogs.length;
          rawLogs = rawLogs.slice(start, start + PAGE_SIZE);
          setTotalCount(total);
          setPage(pageToLoad);
        } else {
          setTotalCount(payload.totalCount || 0);
          setPage(payload.page || pageToLoad);
        }

        setFuelLogs(rawLogs);
      } catch (err) {
        const apiMessage = err?.response?.data;
        const message =
          typeof apiMessage === 'string'
            ? apiMessage
            : apiMessage?.message || apiMessage?.Message || 'An error occurred while fetching fuel logs.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [searchQ, showDeleted, ordering, debouncedDateFrom, debouncedDateTo]
  );

  useEffect(() => {
    fetchFuelLogs(1);
    setPage(1);
  }, [fetchFuelLogs]);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQ(val);
    }, 400);
  };

  // Fetch driver profile images
  useEffect(() => {
    if (fuelLogs.length === 0) return;
    let cancelled = false;
    const fetchImages = async () => {
      const newImages = {};
      await Promise.all(
        fuelLogs.map(async (log) => {
          const imgId = log.profileImgFileId ?? log.ProfileImgFileId;
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
    return () => {
      cancelled = true;
    };
  }, [fuelLogs]);

  // Computed stats from current page
  const totalLiters = fuelLogs.reduce((sum, log) => {
    return sum + (parseFloat(log.liters ?? log.Liters) || 0);
  }, 0);

  const totalCostNum = fuelLogs.reduce((sum, log) => {
    const costStr = String(log.totalCostCur ?? log.TotalCostCur ?? '0');
    const val = parseFloat(costStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    return sum + val;
  }, 0);

  const avgCostPerLiter =
    totalLiters > 0 ? Math.round(totalCostNum / totalLiters) : 0;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const formatDateTime = (value) => {
    if (!value) return { date: 'N/A', time: '' };
    const date = new Date(value);
    if (isNaN(date.getTime())) return { date: 'N/A', time: '' };
    return {
      date: date.toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      time: date.toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getDriverInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  const buildPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        items.push(i);
      } else if (i === page - 2 || i === page + 2) {
        items.push('...');
      }
    }
    return items.filter(
      (item, idx) => !(item === '...' && items[idx - 1] === '...')
    );
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = { page: 1, pageSize: 10000, IsDeleted: showDeleted, Ordering: ordering };
      if (searchQ.trim()) params.StringQ = searchQ.trim();

      const response = await api.get('/fuellogs/admin', { params });
      let rows = Array.isArray(response.data?.data) ? response.data.data : [];

      const df = debouncedDateFrom;
      const dt = debouncedDateTo;
      if (df || dt) {
        const from = df ? new Date(df + 'T00:00:00') : null;
        const to   = dt ? new Date(dt + 'T23:59:59') : null;
        rows = rows.filter((log) => {
          const d = new Date(log.date ?? log.Date);
          if (from && d < from) return false;
          if (to   && d > to)   return false;
          return true;
        });
      }

      if (rows.length === 0) {
        setError('No data to export for the selected filters.');
        setExportLoading(false);
        return;
      }

      const exportTotal = rows.length;
      const exportLiters = rows.reduce((s, log) => s + (parseFloat(log.liters ?? log.Liters) || 0), 0);
      const exportCost = rows.reduce((s, log) => {
        const v = parseFloat(String(log.totalCostCur ?? log.TotalCostCur ?? '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        return s + v;
      }, 0);
      const exportAvgCpl = exportLiters > 0 ? Math.round(exportCost / exportLiters) : 0;
      const exportDate = new Date().toLocaleString('hu-HU');
      const dateRange = df || dt ? `${df || '—'} → ${dt || '—'}` : 'All dates';
      const searchFilter = searchQ.trim() || '—';
      const statusFilter = showDeleted ? 'Including deleted' : 'Active only';
      const orderingLabel = { date_desc: 'Date (Newest first)', date: 'Date (Oldest first)', totalcost_desc: 'Cost (Highest first)', totalcost: 'Cost (Lowest first)' }[ordering] || ordering;
      const fileDate = new Date().toISOString().slice(0, 10);

      // ── Receipt images ────────────────────────────────────────────────────
      // receiptMap[rid] = { blob, type, ext, filename: 'receipt_{logId}.jpg' }
      const receiptMap = {};
      await Promise.all(
        rows.map(async (log) => {
          const id = log.id ?? log.Id;
          const rid = log.receiptFileId ?? log.ReceiptFileId;
          if (!rid) return;
          try {
            const res = await api.get(`/files/${rid}`, { responseType: 'blob' });
            const type = res.data.type && res.data.type.startsWith('image/') ? res.data.type : 'image/jpeg';
            const blob = res.data.type === type ? res.data : new Blob([res.data], { type });
            const ext = type.split('/')[1].replace('jpeg', 'jpg');
            receiptMap[rid] = { blob, type, ext, filename: `receipt_${id}.${ext}` };
          } catch {
            receiptMap[rid] = null;
          }
        })
      );

      // ── CSV ──────────────────────────────────────────────────────────────
      const summary = [
        `FleetFlow - Fuel Logs Export`,
        `Exported at:,${exportDate}`,
        ``,
        `-- Applied Filters --`,
        `Date range:,${dateRange}`,
        `Search:,${searchFilter}`,
        `Status:,${statusFilter}`,
        `Sort order:,${orderingLabel}`,
        ``,
        `-- Summary --`,
        `Total records:,${exportTotal.toLocaleString('hu-HU')}`,
        `Total liters:,"${exportLiters.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L"`,
        `Total cost:,"${Math.round(exportCost).toLocaleString('hu-HU')} Ft"`,
        `Avg cost/liter:,"${exportAvgCpl} Ft/L"`,
        ``,
        `-- Fuel Log Records --`,
      ];
      const headers = ['ID', 'Date', 'Time', 'Vehicle', 'Driver Email', 'Station', 'Liters', 'Total Cost', 'Deleted'];
      const csvRows = rows.map((log) => {
        const fmt = formatDateTime(log.date ?? log.Date);
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        return [
          log.id ?? log.Id,
          fmt.date,
          fmt.time,
          esc(log.licensePlate ?? log.LicensePlate ?? ''),
          esc(log.userEmail ?? log.UserEmail ?? ''),
          esc(log.stationName ?? log.StationName ?? ''),
          (parseFloat(log.liters ?? log.Liters) || 0).toFixed(2).replace('.', ','),
          esc(log.totalCostCur ?? log.TotalCostCur ?? ''),
          (log.isDeleted ?? log.IsDeleted) ? 'Yes' : 'No',
        ].join(',');
      });
      const csv = '\uFEFF' + [...summary, headers.join(','), ...csvRows].join('\r\n');

      // ── Word cards ───────────────────────────────────────────────────────
      const fuelCards = rows.map((log) => {
        const fmt = formatDateTime(log.date ?? log.Date);
        const plate = log.licensePlate ?? log.LicensePlate ?? '—';
        const liters = (parseFloat(log.liters ?? log.Liters) || 0).toFixed(2);
        const cost = log.totalCostCur ?? log.TotalCostCur ?? '—';
        const station = log.stationName ?? log.StationName ?? '—';
        const driver = log.userEmail ?? log.UserEmail ?? '—';
        const isDeleted = log.isDeleted ?? log.IsDeleted;
        const id = log.id ?? log.Id;
        const rid = log.receiptFileId ?? log.ReceiptFileId;
        const receiptEntry = rid ? receiptMap[rid] : null;

        const receiptHtml = receiptEntry
          ? `<div class="receipt-section">
              <div class="receipt-label">Receipt</div>
              <div class="receipt-filename">&#128206; ${receiptEntry.filename}</div>
            </div>`
          : `<div class="receipt-section receipt-missing">No receipt uploaded</div>`;

        return `
<div class="fuel-card${isDeleted ? ' deleted' : ''}">
  <div class="card-header">
    <div class="card-number">#${id}</div>
    <div class="card-plate">${plate}</div>
    <div class="card-date">${fmt.date}&nbsp;&nbsp;${fmt.time}</div>
    ${isDeleted ? '<div class="deleted-badge">Deleted</div>' : ''}
  </div>
  <div class="card-stats">
    <div class="stat-pill pill-orange">&#9650; ${liters} L</div>
    <div class="stat-pill pill-green">&#128178; ${cost}</div>
    <div class="stat-pill">&#128205; ${station}</div>
  </div>
  <div class="card-driver">
    <span class="driver-label">Driver:</span>
    <span class="driver-email">${driver}</span>
  </div>
  ${receiptHtml}
</div>`;
      }).join('\n');

      const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<title>FleetFlow - Fuel Logs Export</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 32px; color: #0f172a; font-size: 13px; }
  h1 { font-size: 22px; color: #1d6ee6; margin-bottom: 2px; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 4px; }
  .meta { color: #94a3b8; font-size: 11px; margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .filter-grid { display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 8px; }
  .filter-item span { font-size: 10px; text-transform: uppercase; color: #94a3b8; display: block; }
  .filter-item b { font-size: 13px; color: #1e293b; }
  .stats-grid { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; min-width: 130px; }
  .stat-box .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; }
  .stat-box .value { font-size: 18px; font-weight: 700; color: #0f172a; }
  .stat-box.blue { border-top: 3px solid #3b82f6; }
  .stat-box.orange { border-top: 3px solid #f97316; }
  .stat-box.green { border-top: 3px solid #16a34a; }
  .stat-box.purple { border-top: 3px solid #7c3aed; }
  .fuel-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; background: #ffffff; page-break-inside: avoid; }
  .fuel-card.deleted { border-color: #fca5a5; background: #fff5f5; }
  .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
  .card-number { font-size: 11px; font-weight: 700; color: #94a3b8; min-width: 28px; }
  .card-plate { font-size: 15px; font-weight: 700; color: #1e293b; background: #f1f5f9; border-radius: 5px; padding: 2px 10px; letter-spacing: 1px; }
  .card-date { font-size: 12px; color: #64748b; margin-left: auto; }
  .deleted-badge { font-size: 10px; font-weight: 700; color: #ef4444; background: #fee2e2; border-radius: 4px; padding: 2px 8px; }
  .card-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
  .stat-pill { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 3px 12px; font-size: 11px; color: #475569; }
  .pill-orange { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
  .pill-green { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
  .card-driver { font-size: 11px; color: #64748b; margin-bottom: 12px; }
  .driver-label { font-weight: 600; color: #475569; }
  .driver-email { color: #1d6ee6; }
  .receipt-section { margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
  .receipt-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
  .receipt-filename { font-size: 12px; color: #1d6ee6; font-family: monospace; }
  .receipt-missing { font-size: 11px; color: #94a3b8; font-style: italic; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #f1f5f9; padding-top: 12px; }
</style>
</head>
<body>
<h1>FleetFlow - Fuel Logs Export</h1>
<div class="subtitle">Fleet fuel expense records</div>
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
  <div class="stat-box blue"><div class="label">Total Records</div><div class="value">${exportTotal.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box orange"><div class="label">Total Liters</div><div class="value">${exportLiters.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L</div></div>
  <div class="stat-box green"><div class="label">Total Cost</div><div class="value">${Math.round(exportCost).toLocaleString('hu-HU')} Ft</div></div>
  <div class="stat-box purple"><div class="label">Avg Cost / Liter</div><div class="value">${exportAvgCpl} Ft/L</div></div>
</div>

<div class="section-title">Fuel Log Records (${exportTotal})</div>
${fuelCards}

<div class="footer">FleetFlow - generated ${exportDate}</div>
</body>
</html>`;

      // ── ZIP ───────────────────────────────────────────────────────────────
      const zip = new JSZip();
      zip.file(`fuellogs_export_${fileDate}.csv`, csv);
      zip.file(`fuellogs_export_${fileDate}.doc`, html);
      const receiptsFolder = zip.folder('receipts');
      for (const entry of Object.values(receiptMap)) {
        if (!entry) continue;
        receiptsFolder.file(entry.filename, entry.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const zipA = document.createElement('a');
      zipA.href = zipUrl;
      zipA.download = `fuellogs_export_${fileDate}.zip`;
      document.body.appendChild(zipA);
      zipA.click();
      document.body.removeChild(zipA);
      URL.revokeObjectURL(zipUrl);
    } catch {
      setError('Failed to export.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    setActionError('');
    try {
      await api.patch(`/fuellogs/delete/${id}`);
      fetchFuelLogs(page);
    } catch (err) {
      const msg = err?.response?.data;
      setActionError(typeof msg === 'string' ? msg : msg?.message || 'Failed to delete fuel log.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (id) => {
    setActionLoading(id);
    setActionError('');
    try {
      await api.patch(`/fuellogs/restore/${id}`);
      fetchFuelLogs(page);
    } catch (err) {
      const msg = err?.response?.data;
      setActionError(typeof msg === 'string' ? msg : msg?.message || 'Failed to restore fuel log.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSortDate = () => {
    setOrdering((prev) => (prev === 'date_desc' ? 'date' : 'date_desc'));
  };

  const handleSortCost = () => {
    setOrdering((prev) => (prev === 'totalcost_desc' ? 'totalcost' : 'totalcost_desc'));
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchQ('');
    setDateFrom('');
    setDateTo('');
    setDebouncedDateFrom('');
    setDebouncedDateTo('');
    setShowDeleted(false);
    setOrdering('date_desc');
  };

  const renderPagination = () => (
    <div className="afl-pagination">
      <span className="afl-pagination-info">
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalCount}</strong>
      </span>
      <div className="afl-pagination-controls">
        <button
          className="afl-page-btn"
          disabled={page <= 1}
          onClick={() => fetchFuelLogs(page - 1)}
        >
          ‹
        </button>
        {buildPaginationItems().map((item, idx) =>
          item === '...' ? (
            <span key={`ellipsis-${idx}`} className="afl-page-ellipsis">…</span>
          ) : (
            <button
              key={item}
              className={`afl-page-btn${page === item ? ' afl-page-btn--active' : ''}`}
              onClick={() => fetchFuelLogs(item)}
            >
              {item}
            </button>
          )
        )}
        <button
          className="afl-page-btn"
          disabled={page >= totalPages}
          onClick={() => fetchFuelLogs(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );

  return (
    <div className="afl-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="afl-main">
        <Container fluid className="afl-page">

          {/* ── Header ─────────────────────────────────── */}
          <div className="afl-header">
            <div>
              <h1 className="afl-title">Fuel Logs Overview</h1>
              <p className="afl-subtitle">
                Audit and monitor historical fueling expenses across your fleet.
              </p>
            </div>
            <button className="afl-export-btn" onClick={handleExport} disabled={exportLoading}>
              {exportLoading ? (
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
          <div className="afl-filter-card">
            <div className="afl-filter-row">

              {/* Date Range */}
              <div className="afl-filter-group afl-filter-group--date">
                <label className="afl-filter-label">DATE RANGE</label>
                <div className="afl-date-range">
                  <div className="afl-date-wrapper" onClick={() => dateFromRef.current?.showPicker?.()}>
                    <svg className="afl-date-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      ref={dateFromRef}
                      type="date"
                      className="afl-date-input"
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
                  <span className="afl-date-sep">–</span>
                  <div className="afl-date-wrapper" onClick={() => dateToRef.current?.showPicker?.()}>
                    <svg className="afl-date-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                      ref={dateToRef}
                      type="date"
                      className="afl-date-input"
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
              <div className="afl-filter-group">
                <label className="afl-filter-label">SEARCH</label>
                <div className="afl-search-wrapper">
                  <svg className="afl-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    className="afl-search-input"
                    type="text"
                    placeholder="e.g. FK-992-TX, driver email, or station name"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="afl-filter-group">
                <label className="afl-filter-label">SORT ORDER</label>
                <div className="afl-select-wrapper">
                  <select
                    className="afl-select"
                    value={ordering}
                    onChange={(e) => setOrdering(e.target.value)}
                  >
                    <option value="date_desc">Date (Newest first)</option>
                    <option value="date">Date (Oldest first)</option>
                    <option value="totalcost_desc">Cost (High → Low)</option>
                    <option value="totalcost">Cost (Low → High)</option>
                  </select>
                  <svg className="afl-select-chevron" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Show Deleted toggle + Reset */}
              <div className="afl-filter-group afl-filter-group--actions">
                <label className="afl-toggle-label">
                  <span className="afl-toggle-text">Show Deleted</span>
                  <div
                    className={`afl-toggle-track${showDeleted ? ' afl-toggle-track--on' : ''}`}
                    onClick={() => setShowDeleted((v) => !v)}
                  >
                    <div className="afl-toggle-thumb" />
                  </div>
                </label>
                <button className="afl-reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </div>
          </div>

          {/* ── Stats Cards ────────────────────────────── */}
          <div className="afl-stats-grid">
            {/* Card 1: Total Records */}
            <div className="afl-stat-card">
              <div className="afl-stat-icon afl-stat-icon--blue">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="afl-stat-body">
                <div className="afl-stat-top">
                  <span className="afl-stat-label">Total Fuel Logs</span>
                  <span className="afl-stat-badge afl-stat-badge--blue">All records</span>
                </div>
                <span className="afl-stat-value">{totalCount.toLocaleString('hu-HU')}</span>
              </div>
            </div>

            {/* Card 2: Total Liters */}
            <div className="afl-stat-card">
              <div className="afl-stat-icon afl-stat-icon--orange">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="afl-stat-body">
                <div className="afl-stat-top">
                  <span className="afl-stat-label">Total Liters Consumed</span>
                  <span className="afl-stat-badge afl-stat-badge--orange">Current page</span>
                </div>
                <span className="afl-stat-value">
                  {totalLiters.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                </span>
              </div>
            </div>

            {/* Card 3: Total Cost */}
            <div className="afl-stat-card">
              <div className="afl-stat-icon afl-stat-icon--green">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="afl-stat-body">
                <div className="afl-stat-top">
                  <span className="afl-stat-label">Total Fuel Cost</span>
                  <span className="afl-stat-badge afl-stat-badge--green">Current page</span>
                </div>
                <span className="afl-stat-value">
                  {Math.round(totalCostNum).toLocaleString('hu-HU')} Ft
                </span>
              </div>
            </div>

            {/* Card 4: Refuel Operations */}
            <div className="afl-stat-card">
              <div className="afl-stat-icon afl-stat-icon--purple">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="5" rx="9" ry="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="afl-stat-body">
                <div className="afl-stat-top">
                  <span className="afl-stat-label">Refuel Operations</span>
                  <span className="afl-stat-badge afl-stat-badge--purple">Current page</span>
                </div>
                <span className="afl-stat-value">
                  Avg {avgCostPerLiter} Ft/L
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
          <div className="afl-table-card">
            {loading ? (
              <div className="afl-spinner-wrap">
                <Spinner animation="border" role="status" />
              </div>
            ) : fuelLogs.length === 0 ? (
              <div className="afl-empty">
                <svg width="60" height="60" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p>No fuel logs found</p>
              </div>
            ) : (
              <>
                {/* ── Desktop Table ───────────────────── */}
                <div className="afl-desktop-table">
                  <table className="afl-table">
                    <thead>
                      <tr>
                        <th
                          className="afl-th afl-th--sortable"
                          onClick={handleSortDate}
                        >
                          DATE &amp; TIME
                          <span className="afl-sort-arrow">
                            {ordering === 'date_desc' ? '↓' : ordering === 'date' ? '↑' : '↕'}
                          </span>
                        </th>
                        <th className="afl-th">VEHICLE</th>
                        <th className="afl-th">DRIVER</th>
                        <th className="afl-th">LITERS</th>
                        <th
                          className="afl-th afl-th--sortable"
                          onClick={handleSortCost}
                        >
                          COST
                          <span className="afl-sort-arrow">
                            {ordering === 'totalcost_desc' ? '↓' : ordering === 'totalcost' ? '↑' : '↕'}
                          </span>
                        </th>
                        <th className="afl-th">LOCATION</th>
                        <th className="afl-th">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelLogs.map((log) => {
                        const id = log.id ?? log.Id;
                        const formatted = formatDateTime(log.date ?? log.Date);
                        const plate = log.licensePlate ?? log.LicensePlate ?? '—';
                        const liters = parseFloat(log.liters ?? log.Liters) || 0;
                        const cost = log.totalCostCur ?? log.TotalCostCur ?? '0 Ft';
                        const email = log.userEmail ?? log.UserEmail ?? '—';
                        const station = log.stationName ?? log.StationName ?? '—';
                        const isDeleted = log.isDeleted ?? log.IsDeleted ?? false;
                        const imgId = log.profileImgFileId ?? log.ProfileImgFileId;
                        const imgUrl = imgId != null ? driverImages[imgId] : null;

                        return (
                          <tr
                            key={id}
                            className={`afl-tr${isDeleted ? ' afl-tr--deleted' : ''}`}
                          >
                            <td className="afl-td">
                              <div className="afl-date-main">{formatted.date}</div>
                              {formatted.time && (
                                <div className="afl-date-time">{formatted.time}</div>
                              )}
                            </td>
                            <td className="afl-td">
                              <span className="afl-plate-badge">{plate}</span>
                            </td>
                            <td className="afl-td">
                              <div className="afl-driver-cell">
                                <div className="afl-avatar">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={email} />
                                  ) : (
                                    <span>{getDriverInitials(email)}</span>
                                  )}
                                </div>
                                <span className="afl-driver-email">{email}</span>
                              </div>
                            </td>
                            <td className="afl-td afl-td--num">
                              {liters.toFixed(2)} L
                            </td>
                            <td className="afl-td afl-td--cost">{cost}</td>
                            <td className="afl-td afl-td--station">{station}</td>
                            <td className="afl-td">
                              <div className="afl-action-btns">
                                <button
                                  className="afl-icon-btn afl-icon-btn--view"
                                  title="Details"
                                  onClick={() => navigate('/admin-fuel-log-details', { state: { log } })}
                                >
                                  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                                {isDeleted ? (
                                  <button
                                    className="afl-icon-btn afl-icon-btn--restore"
                                    title="Restore"
                                    disabled={actionLoading === id}
                                    onClick={() => handleRestore(id)}
                                  >
                                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M3.51 15a9 9 0 1 0 .49-4.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    className="afl-icon-btn afl-icon-btn--delete"
                                    title="Delete"
                                    disabled={actionLoading === id}
                                    onClick={() => handleDelete(id)}
                                  >
                                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M10 11v6" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
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

                {/* ── Mobile Cards ────────────────────── */}
                <div className="afl-mobile-cards">
                  {fuelLogs.map((log) => {
                    const id = log.id ?? log.Id;
                    const formatted = formatDateTime(log.date ?? log.Date);
                    const plate = log.licensePlate ?? log.LicensePlate ?? '—';
                    const liters = parseFloat(log.liters ?? log.Liters) || 0;
                    const cost = log.totalCostCur ?? log.TotalCostCur ?? '0 Ft';
                    const email = log.userEmail ?? log.UserEmail ?? '—';
                    const station = log.stationName ?? log.StationName ?? '—';
                    const isDeleted = log.isDeleted ?? log.IsDeleted ?? false;
                    const imgId = log.profileImgFileId ?? log.ProfileImgFileId;
                    const imgUrl = imgId != null ? driverImages[imgId] : null;

                    return (
                      <div
                        key={id}
                        className={`afl-mobile-card${isDeleted ? ' afl-mobile-card--deleted' : ''}`}
                      >
                        <div className="afl-mc-header">
                          <span className="afl-plate-badge">{plate}</span>
                          <span className="afl-date-main">
                            {formatted.date}
                            {formatted.time && (
                              <span className="afl-date-time"> {formatted.time}</span>
                            )}
                          </span>
                        </div>
                        <div className="afl-mc-row">
                          <span className="afl-mc-label">Liters</span>
                          <span>{liters.toFixed(2)} L</span>
                        </div>
                        <div className="afl-mc-row">
                          <span className="afl-mc-label">Cost</span>
                          <span className="afl-td--cost">{cost}</span>
                        </div>
                        <div className="afl-mc-row">
                          <span className="afl-mc-label">Driver</span>
                          <div className="afl-driver-cell">
                            <div className="afl-avatar afl-avatar--sm">
                              {imgUrl ? (
                                <img src={imgUrl} alt={email} />
                              ) : (
                                <span>{getDriverInitials(email)}</span>
                              )}
                            </div>
                            <span className="afl-driver-email">{email}</span>
                          </div>
                        </div>
                        <div className="afl-mc-row">
                          <span className="afl-mc-label">Location</span>
                          <span className="afl-td--station">{station}</span>
                        </div>
                        <div className="afl-mc-details-row">
                          <span className="afl-mc-label">Actions</span>
                          <div className="afl-action-btns">
                            <button
                              className="afl-icon-btn afl-icon-btn--view"
                              title="Details"
                              onClick={() => navigate('/admin-fuel-log-details', { state: { log } })}
                            >
                              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {isDeleted ? (
                              <button
                                className="afl-icon-btn afl-icon-btn--restore"
                                title="Restore"
                                disabled={actionLoading === id}
                                onClick={() => handleRestore(id)}
                              >
                                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M3.51 15a9 9 0 1 0 .49-4.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                className="afl-icon-btn afl-icon-btn--delete"
                                title="Delete"
                                disabled={actionLoading === id}
                                onClick={() => handleDelete(id)}
                              >
                                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M10 11v6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Pagination ──────────────────────── */}
                {totalCount > 0 && renderPagination()}
              </>
            )}
          </div>
        </Container>

        <Footer />
      </main>
    </div>
  );
};

export default AdminFuelLogs;
