import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Container, Spinner } from 'react-bootstrap';
import api from '../services/api';
import JSZip from 'jszip';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/AdminServiceRequests.css';

const PAGE_SIZE = 10;

const STATUS_LABELS = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DRIVER_COST: 'Cost Reported',
  CLOSED: 'Closed',
};

const AdminServiceRequests = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalOngoingCount, setTotalOngoingCount] = useState(0);
  const [totalRequestedCount, setTotalRequestedCount] = useState(0);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [totalEndedCount, setTotalEndedCount] = useState(0);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const debounceRef = useRef(null);

  const [exporting, setExporting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ongoing');
  const [ordering, setOrdering] = useState('');

  const [driverImages, setDriverImages] = useState({});

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRequests = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page: pageToLoad,
          pageSize: PAGE_SIZE,
        };
        if (searchQ.trim()) params.StringQ = searchQ.trim();
        if (statusFilter && statusFilter !== 'ongoing') params.Status = statusFilter;
        if (ordering) params.Ordering = ordering;

        const response = await api.get('/service-requests/admin', { params });
        const payload = response.data || {};
        let rawItems = Array.isArray(payload.data) ? payload.data : [];

        // Calculate totals from all API data
        const allItems = Array.isArray(payload.data) ? payload.data : [];
        const totalOngoing = allItems.filter(r => {
          const status = r.status ?? r.Status;
          return status !== 'REJECTED' && status !== 'CLOSED';
        }).length;
        const totalRequested = allItems.filter(r => (r.status ?? r.Status) === 'REQUESTED').length;
        const totalPending = allItems.filter(r => {
          const status = r.status ?? r.Status;
          return status === 'APPROVED' || status === 'DRIVER_COST';
        }).length;
        const totalEnded = allItems.filter(r => {
          const status = r.status ?? r.Status;
          return status === 'CLOSED' || status === 'REJECTED';
        }).length;
        
        setTotalOngoingCount(totalOngoing);
        setTotalRequestedCount(totalRequested);
        setTotalPendingCount(totalPending);
        setTotalEndedCount(totalEnded);

        if (statusFilter === 'ongoing') {
          rawItems = rawItems.filter(r => {
            const status = r.status ?? r.Status;
            return status !== 'REJECTED' && status !== 'CLOSED';
          });
        }

        setTotalCount(rawItems.length || 0);
        setPage(1);
        setRequests(rawItems);
      } catch (err) {
        const apiMessage = err?.response?.data;
        const message =
          typeof apiMessage === 'string'
            ? apiMessage
            : apiMessage?.message || apiMessage?.Message || 'An error occurred while fetching service requests.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [searchQ, statusFilter, ordering]
  );

  useEffect(() => {
    fetchRequests(1);
    setPage(1);
  }, [fetchRequests]);

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
    if (requests.length === 0) return;
    let cancelled = false;
    const fetchImages = async () => {
      const newImages = {};
      await Promise.all(
        requests.map(async (req) => {
          const imgId = req.profileImgFileId ?? req.ProfileImgFileId;
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
  }, [requests]);

  // Computed stats from current page
  const ongoingCount = requests.filter((r) => {
    const status = r.status ?? r.Status;
    return status !== 'REJECTED' && status !== 'CLOSED';
  }).length;
  const pendingCount = requests.filter((r) => (r.status ?? r.Status) === 'REQUESTED').length;
  const approvedCount = requests.filter((r) => (r.status ?? r.Status) === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => (r.status ?? r.Status) === 'REJECTED').length;

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

  const getInitials = (email) => {
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

  const handleReset = () => {
    setSearchInput('');
    setSearchQ('');
    setStatusFilter('ongoing');
    setOrdering('');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { page: 1, pageSize: 1000 };
      if (searchQ.trim()) params.StringQ = searchQ.trim();
      if (statusFilter && statusFilter !== 'ongoing') params.Status = statusFilter;
      if (ordering) params.Ordering = ordering;
      const response = await api.get('/service-requests/admin', { params });
      let items = Array.isArray(response.data?.data) ? response.data.data : [];
      if (statusFilter === 'ongoing') {
        items = items.filter(r => {
          const s = r.status ?? r.Status;
          return s !== 'REJECTED' && s !== 'CLOSED';
        });
      }

      if (items.length === 0) {
        setError('No data to export for the selected filters.');
        setExporting(false);
        return;
      }

      const exportDate = new Date().toLocaleString('hu-HU');
      const fileDate = new Date().toISOString().slice(0, 10);
      const searchFilter = searchQ.trim() || '—';
      const statusLabel = statusFilter === 'ongoing' ? 'Ongoing' : (statusFilter || 'All');

      // ── CSV ──────────────────────────────────────────────────────────────
      const summary = [
        `FleetFlow – Service Requests Export`,
        `Exported at:,${exportDate}`,
        ``,
        `── Applied Filters ──────────────────────────────`,
        `Search:,${searchFilter}`,
        `Status:,${statusLabel}`,
        ``,
        `── Summary ──────────────────────────────────────`,
        `Total records:,${items.length}`,
        ``,
        `── Records ──────────────────────────────────────`,
      ];
      const headers = ['ID', 'Title', 'Vehicle', 'Driver', 'Status', 'Scheduled', 'Reported Cost (Ft)', 'Closed At'];
      const csvRows = items.map(r => {
        const scheduled = r.scheduledStart ?? r.ScheduledStart ?? '';
        const closed = r.closedAt ?? r.ClosedAt ?? '';
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        return [
          r.id ?? r.Id ?? '',
          esc(r.title ?? r.Title ?? ''),
          r.licensePlate ?? r.LicensePlate ?? '',
          esc(r.userEmail ?? r.UserEmail ?? ''),
          r.status ?? r.Status ?? '',
          scheduled ? new Date(scheduled).toLocaleDateString('hu-HU') : '',
          r.driverReportCost ?? r.DriverReportCost ?? '',
          closed ? new Date(closed).toLocaleDateString('hu-HU') : '',
        ].join(',');
      });
      const csv = '\uFEFF' + [...summary, headers.join(','), ...csvRows].join('\r\n');

      // ── Invoice files (for filename display in Word) ────────────────────
      const invoiceMap = {};
      await Promise.all(
        items.map(async (r) => {
          const id = r.id ?? r.Id;
          const fileId = r.invoiceFileId ?? r.InvoiceFileId;
          if (!fileId) return;
          try {
            const res = await api.get(`/files/${fileId}`, { responseType: 'blob' });
            const type = res.data.type || 'application/octet-stream';
            const ext = type.includes('pdf') ? 'pdf'
              : type.includes('png') ? 'png'
              : (type.includes('jpg') || type.includes('jpeg')) ? 'jpg'
              : 'bin';
            invoiceMap[id] = { blob: res.data, ext, filename: `invoice_${id}.${ext}` };
          } catch {
            invoiceMap[id] = null;
          }
        })
      );

      // ── Word cards ───────────────────────────────────────────────────────
      const STATUS_COLORS = {
        REQUESTED:   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        APPROVED:    { bg: '#dcfce7', text: '#166534', border: '#86efac' },
        REJECTED:    { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        CLOSED:      { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' },
        DRIVER_COST: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
      };

      const exportOngoing = items.filter(r => { const s = r.status ?? r.Status; return s !== 'REJECTED' && s !== 'CLOSED'; }).length;
      const exportApproved = items.filter(r => (r.status ?? r.Status) === 'APPROVED').length;
      const exportWithCost = items.filter(r => r.driverReportCost ?? r.DriverReportCost).length;

      const serviceCards = items.map(r => {
        const id = r.id ?? r.Id ?? '';
        const title = r.title ?? r.Title ?? '—';
        const plate = r.licensePlate ?? r.LicensePlate ?? '—';
        const driver = r.userEmail ?? r.UserEmail ?? '—';
        const rawStatus = r.status ?? r.Status ?? '';
        const statusLabel2 = STATUS_LABELS[rawStatus] ?? rawStatus;
        const sc = STATUS_COLORS[rawStatus] ?? { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
        const scheduled = r.scheduledStart ?? r.ScheduledStart ?? '';
        const closed = r.closedAt ?? r.ClosedAt ?? '';
        const cost = r.driverReportCost ?? r.DriverReportCost;
        const scheduledFmt = scheduled ? new Date(scheduled).toLocaleDateString('hu-HU') : '—';
        const closedFmt = closed ? new Date(closed).toLocaleDateString('hu-HU') : null;
        const invoiceEntry = invoiceMap[id];
        const invoiceHtml = invoiceEntry
          ? `<div class="invoice-section"><div class="invoice-label">Invoice</div><div class="invoice-filename">&#128206; ${invoiceEntry.filename}</div></div>`
          : '';

        return `
<div class="sr-card">
  <div class="card-header">
    <div class="card-number">#${id}</div>
    <div class="card-title">${title}</div>
    <div class="status-badge" style="background:${sc.bg};color:${sc.text};border:1px solid ${sc.border}">${statusLabel2}</div>
  </div>
  <div class="card-row">
    <div class="stat-pill pill-vehicle">&#128663; ${plate}</div>
    <div class="stat-pill pill-date">&#128197; ${scheduledFmt}</div>
    ${cost != null && cost !== '' ? `<div class="stat-pill pill-cost">&#128178; ${cost} Ft</div>` : ''}
    ${closedFmt ? `<div class="stat-pill pill-closed">&#10003; Closed: ${closedFmt}</div>` : ''}
  </div>
  <div class="card-driver">
    <span class="driver-label">Driver:</span>
    <span class="driver-email">${driver}</span>
  </div>
  ${invoiceHtml}
</div>`;
      }).join('\n');

      const html = `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<title>FleetFlow - Service Requests Export</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 32px; color: #0f172a; font-size: 13px; }
  h1 { font-size: 22px; color: #7c3aed; margin-bottom: 2px; }
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
  .stat-box.purple { border-top: 3px solid #7c3aed; }
  .stat-box.blue { border-top: 3px solid #3b82f6; }
  .stat-box.green { border-top: 3px solid #16a34a; }
  .stat-box.orange { border-top: 3px solid #f97316; }
  .sr-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; background: #ffffff; page-break-inside: avoid; }
  .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
  .card-number { font-size: 11px; font-weight: 700; color: #94a3b8; min-width: 28px; }
  .card-title { font-size: 14px; font-weight: 700; color: #1e293b; flex: 1; }
  .status-badge { font-size: 10px; font-weight: 700; border-radius: 12px; padding: 3px 10px; white-space: nowrap; }
  .card-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
  .stat-pill { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 3px 12px; font-size: 11px; color: #475569; }
  .pill-vehicle { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
  .pill-date { background: #fefce8; border-color: #fde68a; color: #92400e; }
  .pill-cost { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
  .pill-closed { background: #f1f5f9; border-color: #cbd5e1; color: #475569; }
  .card-driver { font-size: 11px; color: #64748b; }
  .driver-label { font-weight: 600; color: #475569; }
  .driver-email { color: #7c3aed; }
  .invoice-section { margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
  .invoice-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
  .invoice-filename { font-size: 12px; color: #7c3aed; font-family: monospace; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #f1f5f9; padding-top: 12px; }
</style>
</head>
<body>
<h1>FleetFlow – Service Requests Export</h1>
<div class="subtitle">Fleet service request records</div>
<div class="meta">Exported: ${exportDate}</div>

<div class="section-title">Applied Filters</div>
<div class="filter-grid">
  <div class="filter-item"><span>Search</span><b>${searchFilter}</b></div>
  <div class="filter-item"><span>Status</span><b>${statusLabel}</b></div>
</div>

<div class="section-title">Summary</div>
<div class="stats-grid">
  <div class="stat-box purple"><div class="label">Total Records</div><div class="value">${items.length.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box blue"><div class="label">Ongoing</div><div class="value">${exportOngoing.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box green"><div class="label">Approved</div><div class="value">${exportApproved.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box orange"><div class="label">With Cost Report</div><div class="value">${exportWithCost.toLocaleString('hu-HU')}</div></div>
</div>

<div class="section-title">Service Request Records (${items.length})</div>
${serviceCards}

<div class="footer">FleetFlow – generated ${exportDate}</div>
</body>
</html>`;

      // ── Invoices ─────────────────────────────────────────────────────────
      const zip = new JSZip();
      zip.file(`service_requests_${fileDate}.csv`, csv);
      zip.file(`service_requests_${fileDate}.doc`, html);

      const invoiceEntries = Object.values(invoiceMap).filter(Boolean);
      if (invoiceEntries.length > 0) {
        const invoicesFolder = zip.folder('invoices');
        for (const entry of invoiceEntries) {
          invoicesFolder.file(entry.filename, entry.blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `service_requests_export_${fileDate}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch {
      setError('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const renderPagination = () => (
    <div className="asr-pagination">
      <span className="asr-pagination-info">
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalCount}</strong>
      </span>
      <div className="asr-pagination-controls">
        <button
          className="asr-page-btn"
          disabled={page <= 1}
          onClick={() => fetchRequests(page - 1)}
        >
          ‹
        </button>
        {buildPaginationItems().map((item, idx) =>
          item === '...' ? (
            <span key={`ellipsis-${idx}`} className="asr-page-ellipsis">…</span>
          ) : (
            <button
              key={item}
              className={`asr-page-btn${page === item ? ' asr-page-btn--active' : ''}`}
              onClick={() => fetchRequests(item)}
            >
              {item}
            </button>
          )
        )}
        <button
          className="asr-page-btn"
          disabled={page >= totalPages}
          onClick={() => fetchRequests(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'REQUESTED': return 'asr-status--requested';
      case 'APPROVED': return 'asr-status--approved';
      case 'REJECTED': return 'asr-status--rejected';
      case 'DRIVER_COST': return 'asr-status--driver-cost';
      case 'CLOSED': return 'asr-status--closed';
      default: return 'asr-status--default';
    }
  };

  return (
    <div className="asr-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="asr-main">
        <Container fluid className="asr-page">

          {/* ── Header ─────────────────────────────────── */}
          <div className="asr-header">
            <div>
              <h1 className="asr-title">Service Requests Overview</h1>
              <p className="asr-subtitle">
                Review and manage all driver service requests across your fleet.
              </p>
            </div>
            <div className="asr-export-wrapper">
              <button
                className="asr-export-btn"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
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
          </div>

          {/* ── Filter Bar ─────────────────────────────── */}
          <div className="asr-filter-card">
            <div className="asr-filter-row">

              {/* Search */}
              <div className="asr-filter-group">
                <label className="asr-filter-label">SEARCH</label>
                <div className="asr-search-wrapper">
                  <svg className="asr-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    className="asr-search-input"
                    type="text"
                    placeholder="e.g. FK-992-TX, driver email, or title"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="asr-filter-group asr-filter-group--sm">
                <label className="asr-filter-label">STATUS</label>
                <div className="asr-select-wrapper">
                  <select
                    className="asr-select"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); }}
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="">All Statuses</option>
                    <option value="REQUESTED">Requested</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DRIVER_COST">Cost Reported</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <svg className="asr-select-chevron" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Sort */}
              <div className="asr-filter-group asr-filter-group--sm">
                <label className="asr-filter-label">SORT BY</label>
                <div className="asr-select-wrapper">
                  <select
                    className="asr-select"
                    value={ordering}
                    onChange={(e) => setOrdering(e.target.value)}
                  >
                    <option value="">Latest first</option>
                    <option value="scheduledstart">Scheduled (Oldest first)</option>
                    <option value="scheduledstart_desc">Scheduled (Newest first)</option>
                    <option value="driverreportcost">Cost (Low → High)</option>
                    <option value="driverreportcost_desc">Cost (High → Low)</option>
                    <option value="closedat">Closed (Oldest first)</option>
                    <option value="closedat_desc">Closed (Newest first)</option>
                  </select>
                  <svg className="asr-select-chevron" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6,9 12,15 18,9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Reset */}
              <div className="asr-filter-group asr-filter-group--reset">
                <label className="asr-filter-label">&nbsp;</label>
                <button className="asr-reset-btn" onClick={handleReset}>Reset</button>
              </div>
            </div>
          </div>

          {/* ── Stats Cards ────────────────────────────── */}
          <div className="asr-stats-grid">
            {/* Ongoing Requests */}
            <div className="asr-stat-card">
              <div className="asr-stat-icon asr-stat-icon--purple">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="asr-stat-body">
                <div className="asr-stat-top">
                  <span className="asr-stat-label">Ongoing Requests</span>
                  <span className="asr-stat-badge asr-stat-badge--purple">All records</span>
                </div>
                <span className="asr-stat-value">{totalOngoingCount.toLocaleString('hu-HU')}</span>
              </div>
            </div>

            {/* Requested */}
            <div className="asr-stat-card">
              <div className="asr-stat-icon asr-stat-icon--blue">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="asr-stat-body">
                <div className="asr-stat-top">
                  <span className="asr-stat-label">Requested</span>
                  <span className="asr-stat-badge asr-stat-badge--blue">All records</span>
                </div>
                <span className="asr-stat-value">{totalRequestedCount.toLocaleString('hu-HU')}</span>
              </div>
            </div>

            {/* Pending */}
            <div className="asr-stat-card">
              <div className="asr-stat-icon asr-stat-icon--green">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20,6 9,17 4,12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="asr-stat-body">
                <div className="asr-stat-top">
                  <span className="asr-stat-label">Pending</span>
                  <span className="asr-stat-badge asr-stat-badge--green">All records</span>
                </div>
                <span className="asr-stat-value">{totalPendingCount.toLocaleString('hu-HU')}</span>
              </div>
            </div>

            {/* Ended */}
            <div className="asr-stat-card">
              <div className="asr-stat-icon asr-stat-icon--red">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="asr-stat-body">
                <div className="asr-stat-top">
                  <span className="asr-stat-label">Ended</span>
                  <span className="asr-stat-badge asr-stat-badge--red">All records</span>
                </div>
                <span className="asr-stat-value">{totalEndedCount.toLocaleString('hu-HU')}</span>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-3" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          {/* ── Table Card ─────────────────────────────── */}
          <div className="asr-table-card">
            {loading ? (
              <div className="asr-spinner-wrap">
                <Spinner animation="border" role="status" />
              </div>
            ) : requests.length === 0 ? (
              <div className="asr-empty">
                <svg width="60" height="60" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>No service requests found</p>
              </div>
            ) : (
              <>
                {/* ── Desktop Table ───────────────────── */}
                <div className="asr-desktop-table">
                  <table className="asr-table">
                    <thead>
                      <tr>
                        <th className="asr-th">SCHEDULED</th>
                        <th className="asr-th">VEHICLE</th>
                        <th className="asr-th">DRIVER</th>
                        <th className="asr-th">TITLE</th>
                        <th className="asr-th">REPORTED COST</th>
                        <th className="asr-th">CLOSED AT</th>
                        <th className="asr-th">STATUS</th>
                        <th className="asr-th">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => {
                        const id = req.id ?? req.Id;
                        const scheduledStart = formatDateTime(req.scheduledStart ?? req.ScheduledStart);
                        const closedAt = formatDateTime(req.closedAt ?? req.ClosedAt);
                        const plate = req.licensePlate ?? req.LicensePlate ?? '—';
                        const email = req.userEmail ?? req.UserEmail ?? '—';
                        const title = req.title ?? req.Title ?? '—';
                        const status = req.status ?? req.Status ?? '—';
                        const cost = req.driverReportCost ?? req.DriverReportCost;
                        const imgId = req.profileImgFileId ?? req.ProfileImgFileId;
                        const imgUrl = imgId != null ? driverImages[imgId] : null;

                        return (
                          <tr key={id} className="asr-tr">
                            <td className="asr-td">
                              <div className="asr-date-main">{scheduledStart.date}</div>
                              {scheduledStart.time && (
                                <div className="asr-date-time">{scheduledStart.time}</div>
                              )}
                            </td>
                            <td className="asr-td">
                              <span className="asr-plate-badge">{plate}</span>
                            </td>
                            <td className="asr-td">
                              <div className="asr-driver-cell">
                                <div className="asr-avatar">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={email} />
                                  ) : (
                                    <span>{getInitials(email)}</span>
                                  )}
                                </div>
                                <span className="asr-driver-email">{email}</span>
                              </div>
                            </td>
                            <td className="asr-td asr-td--title">{title}</td>
                            <td className="asr-td asr-td--cost">
                              {cost != null ? `${Number(cost).toLocaleString('hu-HU')} Ft` : '—'}
                            </td>
                            <td className="asr-td">
                              {closedAt.date !== 'N/A' ? (
                                <>
                                  <div className="asr-date-main">{closedAt.date}</div>
                                  {closedAt.time && <div className="asr-date-time">{closedAt.time}</div>}
                                </>
                              ) : (
                                <span className="asr-na">—</span>
                              )}
                            </td>
                            <td className="asr-td">
                              <span className={`asr-status-badge ${getStatusClass(status)}`}>
                                {STATUS_LABELS[status] ?? status}
                              </span>
                            </td>
                            <td className="asr-td">
                              <button
                                className="asr-icon-btn asr-icon-btn--view"
                                title="View details"
                                onClick={() => navigate('/admin-service-request-details', { state: { request: req } })}
                              >
                                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile Cards ────────────────────── */}
                <div className="asr-mobile-cards">
                  {requests.map((req) => {
                    const id = req.id ?? req.Id;
                    const scheduledStart = formatDateTime(req.scheduledStart ?? req.ScheduledStart);
                    const closedAt = formatDateTime(req.closedAt ?? req.ClosedAt);
                    const plate = req.licensePlate ?? req.LicensePlate ?? '—';
                    const email = req.userEmail ?? req.UserEmail ?? '—';
                    const title = req.title ?? req.Title ?? '—';
                    const status = req.status ?? req.Status ?? '—';
                    const cost = req.driverReportCost ?? req.DriverReportCost;
                    const imgId = req.profileImgFileId ?? req.ProfileImgFileId;
                    const imgUrl = imgId != null ? driverImages[imgId] : null;

                    return (
                      <div key={id} className="asr-mobile-card">
                        <div className="asr-mc-header">
                          <span className="asr-plate-badge">{plate}</span>
                          <span className={`asr-status-badge ${getStatusClass(status)}`}>
                            {STATUS_LABELS[status] ?? status}
                          </span>
                        </div>
                        <div className="asr-mc-title">{title}</div>
                        <div className="asr-mc-row">
                          <span className="asr-mc-label">Scheduled</span>
                          <span className="asr-date-main">
                            {scheduledStart.date}
                            {scheduledStart.time && <span className="asr-date-time"> {scheduledStart.time}</span>}
                          </span>
                        </div>
                        <div className="asr-mc-row">
                          <span className="asr-mc-label">Driver</span>
                          <div className="asr-driver-cell">
                            <div className="asr-avatar asr-avatar--sm">
                              {imgUrl ? (
                                <img src={imgUrl} alt={email} />
                              ) : (
                                <span>{getInitials(email)}</span>
                              )}
                            </div>
                            <span className="asr-driver-email">{email}</span>
                          </div>
                        </div>
                        <div className="asr-mc-row">
                          <span className="asr-mc-label">Reported Cost</span>
                          <span className="asr-td--cost">
                            {cost != null ? `${Number(cost).toLocaleString('hu-HU')} Ft` : '—'}
                          </span>
                        </div>
                        {closedAt.date !== 'N/A' && (
                          <div className="asr-mc-row">
                            <span className="asr-mc-label">Closed At</span>
                            <span className="asr-date-main">{closedAt.date}</span>
                          </div>
                        )}
                        <div className="asr-mc-details-row">
                          <span className="asr-mc-label">Actions</span>
                          <button
                            className="asr-icon-btn asr-icon-btn--view"
                            title="View details"
                            onClick={() => navigate('/admin-service-request-details', { state: { request: req } })}
                          >
                            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
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

export default AdminServiceRequests;
