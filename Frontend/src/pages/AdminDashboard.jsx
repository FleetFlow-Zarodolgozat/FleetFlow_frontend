import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import Sidebar from '../components/Sidebar';
import { Card, Container, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { hu, de, enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t, language } = useLanguage();  const localeMap = { hu, de, en: enUS };
  const currentLocale = localeMap[language] || enUS;
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales: { hu, de, en: enUS },
    formats: {
      dateFormat: 'dd',
      dayFormat: 'EEE dd',
      weekdayFormat: 'EEE',
      monthHeaderFormat: 'MMMM yyyy',
      dayHeaderFormat: 'EEE MMM dd',
      dayRangeHeaderFormat: ({ start, end }) => `${format(start, 'MMM dd', { locale: currentLocale })} – ${format(end, 'MMM dd', { locale: currentLocale })}`,
      agendaHeaderFormat: ({ start, end }) => `${format(start, 'MMM dd', { locale: currentLocale })} – ${format(end, 'MMM dd', { locale: currentLocale })}`,
      agendaDateFormat: 'ddd MMM dd',
      agendaTimeFormat: 'p',
      agendaTimeRangeFormat: ({ start, end }) => `${format(start, 'p', { locale: currentLocale })} – ${format(end, 'p', { locale: currentLocale })}`,
      eventTimeRangeFormat: ({ start, end }) => `${format(start, 'p', { locale: currentLocale })} – ${format(end, 'p', { locale: currentLocale })}`,
      eventTimeFormat: 'p',
    },
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1200);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1200) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [timeRange, setTimeRange] = useState('today');
  const [fleetStats, setFleetStats] = useState({ total: 0, activePercent: 0 });
  const [stats, setStats] = useState({
    totalFleet: 0,
    fuelCosts: 0,
    fuelCostsChange: 0,
    activeTrips: 0,
    utilizationRate: 0,
    pendingMaintenance: 0,
    urgentRequests: 0,
  });
  const [trStats, setTrStats] = useState({
    fuelCost: 0,
    fuelCostChange: null,
    tripCount: 0,
    utilizationRate: 0,
    srCount: 0,
    srWaiting: 0,
  });
  const [trStatsLoading, setTrStatsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '',
    description: ''
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [eventFeedback, setEventFeedback] = useState({ type: '', message: '' });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);  const loadCalendarEvents = async () => {
    try {
      const calendarResponse = await api.get('/calendarevents');
      const calendarData = Array.isArray(calendarResponse.data) ? calendarResponse.data : [];
      const mappedEvents = calendarData
        .map((evt) => {
          const startValue = evt.startAt || evt.StartAt;
          const endValue = evt.endAt || evt.EndAt || startValue;
          const start = new Date(startValue);
          const end = new Date(endValue);

          return {
            id: evt.id || evt.Id,
            title: evt.title || evt.Title || 'Untitled event',
            start,
            end,
            allDay: false,
            eventType: evt.eventType || evt.EventType || 'DEFAULT',
            description: evt.description || evt.Description || '',
            relatedServiceRequestId: evt.relatedServiceRequestId || evt.RelatedServiceRequestId || null,
          };
        })
        .filter((evt) => !Number.isNaN(evt.start.getTime()) && !Number.isNaN(evt.end.getTime()));

      setScheduleEvents(mappedEvents);
    } catch (error) {
      console.log('Could not fetch calendar events:', error.message);
    }
  };  const loadStatistics = async () => {
    try {
      const statsResponse = await api.get('/statistics/admin-dashboard');
      const data = statsResponse.data;

      setStats({
        totalFleet: data.totalFleet || data.TotalFleet || 0,
        fuelCosts: data.fuelCosts || data.FuelCosts || 0,
        fuelCostsChange: data.fuelCostsChange || data.FuelCostsChange || 0,
        activeTrips: data.activeTrips || data.ActiveTrips || 0,
        utilizationRate: data.utilizationRate || data.UtilizationRate || 0,
        pendingMaintenance: data.pendingMaintenance || data.PendingMaintenance || 0,
        urgentRequests: data.urgentRequests || data.UrgentRequests || 0,
      });
    } catch (error) {
      console.log('Could not fetch admin statistics:', error.message);
      // Set default values if API fails
      setStats({
        totalFleet: 142,
        fuelCosts: 8450,
        fuelCostsChange: 4.2,
        activeTrips: 38,
        utilizationRate: 92,
        pendingMaintenance: 5,
        urgentRequests: 2,
      });
    }
  };  const loadUpcomingEvents = async () => {
    try {
      // A scheduleEvents már tartalmazza a calendar eseményeket
      // Ha nincs, akkor API-ból töltjük be
      let events = scheduleEvents;
      if (!events || events.length === 0) {
        const response = await api.get('/calendarevents');
        events = Array.isArray(response.data) ? response.data.map(evt => ({
          id: evt.id || evt.Id,
          title: evt.title || evt.Title,
          start: new Date(evt.startAt || evt.StartAt),
          eventType: evt.eventType || evt.EventType,
          vehicle: evt.vehicle || evt.Vehicle,
        })) : [];
      }
      // Csak jövőbeli események, dátum szerint növekvő sorrendben, első 3
      const now = new Date();
      const upcoming = events
        .filter(e => new Date(e.start || e.startAt) > now)
        .sort((a, b) => new Date(a.start || a.startAt) - new Date(b.start || b.startAt))
        .slice(0, 3)
        .map(e => ({
          id: e.id,
          title: e.title,
          startAt: e.start ? e.start.toISOString() : e.startAt,
          eventType: e.eventType,
          vehicle: e.vehicle,
        }));
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.log('Could not fetch upcoming events:', error.message);
    }
  };  const loadVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      const vList = Array.isArray(response.data) ? response.data : [];
      setVehicles(vList.map(v => ({
        id: v.id || v.Id,
        brandModel: v.brandModel || v.BrandModel || v.LicensePlate,
        licensePlate: v.licensePlate || v.LicensePlate,
      })));
    } catch (error) {
      console.log('Could not fetch vehicles:', error.message);
    }
  };  const loadDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      const dList = Array.isArray(response.data) ? response.data : [];
      setDrivers(dList.map(d => ({
        id: d.id || d.Id,
        fullName: d.fullName || d.FullName,
        email: d.email || d.Email,
      })));
    } catch (error) {
      console.log('Could not fetch drivers:', error.message);
    }
  };

  const loadFleetStats = async () => {
    try {
      const [activeRes, maintenanceRes, retiredRes] = await Promise.all([
        api.get('/admin/vehicles', { params: { page: 1, pageSize: 1, Status: 'ACTIVE' } }),
        api.get('/admin/vehicles', { params: { page: 1, pageSize: 1, Status: 'MAINTENANCE' } }),
        api.get('/admin/vehicles', { params: { page: 1, pageSize: 1, Status: 'RETIRED' } }),
      ]);
      const active = activeRes.data?.totalCount || 0;
      const maintenance = maintenanceRes.data?.totalCount || 0;
      const retired = retiredRes.data?.totalCount || 0;
      const total = active + maintenance + retired;
      const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
      setFleetStats({ total, activePercent });
    } catch (error) {
      console.log('Could not fetch fleet stats:', error.message);
    }
  };

  const loadTimeRangeStats = async (range, totalVehicles) => {
    setTrStatsLoading(true);
    try {
      const now = new Date();
      let curFrom, curTo, prevFrom, prevTo;

      if (range === 'today') {
        curFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        curTo   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        prevFrom = new Date(curFrom); prevFrom.setDate(prevFrom.getDate() - 1);
        prevTo   = new Date(curTo);   prevTo.setDate(prevTo.getDate() - 1);
      } else if (range === 'week') {
        // Current calendar week: Monday 00:00 → Sunday 23:59
        const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...
        const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        curFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon, 0, 0, 0);
        curTo   = new Date(curFrom); curTo.setDate(curTo.getDate() + 6); curTo.setHours(23, 59, 59, 999);
        // Previous calendar week
        prevFrom = new Date(curFrom); prevFrom.setDate(prevFrom.getDate() - 7);
        prevTo   = new Date(curFrom); prevTo.setMilliseconds(-1);
      } else {
        // Current calendar month: 1st 00:00 → last day 23:59
        curFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        curTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        // Previous calendar month
        prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        prevTo   = new Date(curFrom); prevTo.setMilliseconds(-1);
      }

      const inRange = (dateStr, from, to) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= from && d <= to;
      };

      const parseCost = (val) =>
        parseFloat(String(val ?? '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

      const [fuelRes, tripsRes, srRes] = await Promise.all([
        api.get('/fuellogs/admin', { params: { page: 1, pageSize: 10000 } }),
        api.get('/trips/admin',    { params: { page: 1, pageSize: 10000 } }),
        api.get('/service-requests/admin', { params: { page: 1, pageSize: 10000 } }),
      ]);

      const fuelLogs = Array.isArray(fuelRes.data?.data)  ? fuelRes.data.data  : [];
      const trips    = Array.isArray(tripsRes.data?.data) ? tripsRes.data.data : [];
      const srs      = Array.isArray(srRes.data?.data)    ? srRes.data.data    : [];

      // ── Fuel cost ──────────────────────────────────────────────────────
      const curFuelLogs  = fuelLogs.filter(l => inRange(l.date ?? l.Date, curFrom, curTo));
      const prevFuelLogs = fuelLogs.filter(l => inRange(l.date ?? l.Date, prevFrom, prevTo));
      const fuelCost     = curFuelLogs.reduce((s, l) => s + parseCost(l.totalCostCur ?? l.TotalCostCur), 0);
      const fuelCostPrev = prevFuelLogs.reduce((s, l) => s + parseCost(l.totalCostCur ?? l.TotalCostCur), 0);
      const fuelCostChange = fuelCostPrev > 0
        ? Math.round(((fuelCost - fuelCostPrev) / fuelCostPrev) * 100)
        : null;

      // ── Trips + utilization ────────────────────────────────────────────
      const curTrips = trips.filter(t => inRange(t.startTime ?? t.StartTime, curFrom, curTo));
      const tripCount = curTrips.length;
      const uniqueVehIds = new Set(curTrips.map(t => t.licensePlate ?? t.LicensePlate ?? t.vehicleId ?? t.VehicleId).filter(Boolean));
      const utilizationRate = (totalVehicles ?? 0) > 0
        ? Math.round((uniqueVehIds.size / totalVehicles) * 100)
        : 0;

      // ── Service requests ───────────────────────────────────────────────
      // Use scheduledStart if available, else closedAt, else treat as "now" (pending/new)
      const curSrs = srs.filter(sr => {
        const dateField = sr.scheduledStart ?? sr.ScheduledStart ?? sr.closedAt ?? sr.ClosedAt;
        if (!dateField) {
          // No date set = newly submitted REQUESTED, count it in current period
          return true;
        }
        return inRange(dateField, curFrom, curTo);
      });
      const srCount = curSrs.length;
      const srWaiting = srs.filter(sr => {
        const s = sr.status ?? sr.Status;
        return s === 'REQUESTED' || s === 'DRIVER_COST';
      }).length;

      setTrStats({ fuelCost, fuelCostChange, tripCount, utilizationRate, srCount, srWaiting });
    } catch (e) {
      console.log('Could not load time-range stats:', e.message);
    } finally {
      setTrStatsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
    loadStatistics();
    loadUpcomingEvents();
    loadVehicles();
    loadDrivers();
    loadFleetStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTimeRangeStats(timeRange, fleetStats.total);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, fleetStats.total]);

  // ── Export helpers ────────────────────────────────────────────────────────
  const exportFormatDateTime = (value) => {
    if (!value) return { date: 'N/A', time: '' };
    const date = new Date(value);
    if (isNaN(date.getTime())) return { date: 'N/A', time: '' };
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  const exportFormatDuration = (ts) => {
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

  const exportParseCost = (val) =>
    parseFloat(String(val ?? '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

  const handleExportReport = async () => {
    setExportLoading(true);
    try {
      const now = new Date();
      let curFrom, curTo;
      if (timeRange === 'today') {
        curFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        curTo   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (timeRange === 'week') {
        const dayOfWeek = now.getDay();
        const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        curFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon, 0, 0, 0);
        curTo   = new Date(curFrom); curTo.setDate(curTo.getDate() + 6); curTo.setHours(23, 59, 59, 999);
      } else {
        curFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        curTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      const rangeLabel = timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month';
      const dateRange = `${curFrom.toLocaleDateString('hu-HU')} → ${curTo.toLocaleDateString('hu-HU')}`;
      const exportDate = new Date().toLocaleString('hu-HU');
      const fileDate = new Date().toISOString().slice(0, 10);

      const inRange = (dateStr, from, to) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= from && d <= to;
      };

      const [fuelRes, tripsRes, srRes] = await Promise.all([
        api.get('/fuellogs/admin', { params: { page: 1, pageSize: 10000 } }),
        api.get('/trips/admin',    { params: { page: 1, pageSize: 10000 } }),
        api.get('/service-requests/admin', { params: { page: 1, pageSize: 10000 } }),
      ]);

      const fuelLogs = (Array.isArray(fuelRes.data?.data) ? fuelRes.data.data : [])
        .filter(l => inRange(l.date ?? l.Date, curFrom, curTo));
      const trips = (Array.isArray(tripsRes.data?.data) ? tripsRes.data.data : [])
        .filter(t => inRange(t.startTime ?? t.StartTime, curFrom, curTo));
      const srs = (Array.isArray(srRes.data?.data) ? srRes.data.data : [])
        .filter(sr => {
          const dateField = sr.scheduledStart ?? sr.ScheduledStart ?? sr.closedAt ?? sr.ClosedAt;
          if (!dateField) return true;
          return inRange(dateField, curFrom, curTo);
        });

      if (fuelLogs.length === 0 && trips.length === 0 && srs.length === 0) {
        setExportLoading(false);
        return;
      }

      // ── Receipt files ─────────────────────────────────────────────────────
      const receiptMap = {};
      await Promise.all(fuelLogs.map(async (log) => {
        const id = log.id ?? log.Id;
        const rid = log.receiptFileId ?? log.ReceiptFileId;
        if (!rid) return;
        try {
          const res = await api.get(`/files/${rid}`, { responseType: 'blob' });
          const type = res.data.type && res.data.type.startsWith('image/') ? res.data.type : 'image/jpeg';
          const blob = res.data.type === type ? res.data : new Blob([res.data], { type });
          const ext = type.split('/')[1].replace('jpeg', 'jpg');
          receiptMap[rid] = { blob, ext, filename: `receipt_${id}.${ext}` };
        } catch { receiptMap[rid] = null; }
      }));

      // ── Invoice files ─────────────────────────────────────────────────────
      const invoiceMap = {};
      await Promise.all(srs.map(async (r) => {
        const id = r.id ?? r.Id;
        const fileId = r.invoiceFileId ?? r.InvoiceFileId;
        if (!fileId) return;
        try {
          const res = await api.get(`/files/${fileId}`, { responseType: 'blob' });
          const type = res.data.type || 'application/octet-stream';
          const ext = type.includes('pdf') ? 'pdf' : type.includes('png') ? 'png' : (type.includes('jpg') || type.includes('jpeg')) ? 'jpg' : 'bin';
          invoiceMap[id] = { blob: res.data, ext, filename: `invoice_${id}.${ext}` };
        } catch { invoiceMap[id] = null; }
      }));

      // ══════════════════════════════════════════════════════════════════════
      // TRIPS
      // ══════════════════════════════════════════════════════════════════════
      const tripTotal = trips.length;
      const tripDist  = trips.reduce((s, t) => s + (parseFloat(t.distanceKm ?? t.DistanceKm) || 0), 0);
      const tripAvg   = tripTotal > 0 ? tripDist / tripTotal : 0;

      const tripCsvLines = [
        `FleetFlow – Trips Export (${rangeLabel})`,
        `Exported at:,${exportDate}`,
        ``,
        `Date range:,${dateRange}`,
        ``,
        `Total trips:,${tripTotal.toLocaleString('hu-HU')}`,
        `Total distance:,"${tripDist.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km"`,
        `Avg distance per trip:,"${tripAvg.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km"`,
        ``,
        ['ID', 'Start Date', 'Start Time', 'Vehicle', 'Driver Email', 'Origin', 'Destination', 'Distance (km)', 'Duration', 'Notes'].join(','),
        ...trips.map((t) => {
          const fmt = exportFormatDateTime(t.startTime ?? t.StartTime);
          const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          return [t.id ?? t.Id, fmt.date, fmt.time, esc(t.licensePlate ?? t.LicensePlate ?? ''), esc(t.userEmail ?? t.UserEmail ?? ''), esc(t.startLocation ?? t.StartLocation ?? ''), esc(t.endLocation ?? t.EndLocation ?? ''), (t.distanceKm ?? t.DistanceKm ?? 0).toString().replace('.', ','), esc(exportFormatDuration(t.long ?? t.Long)), esc(t.notes ?? t.Notes ?? '')].join(',');
        }),
      ];
      // ══════════════════════════════════════════════════════════════════════
      // COMBINED CSV
      // ══════════════════════════════════════════════════════════════════════
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const combinedCsvLines = [
        `FleetFlow – Fleet Report (${rangeLabel})`,
        `Exported at:,${exportDate}`,
        `Date range:,${dateRange}`,
        ``,
        ``,
        `════════════════════════════════════`,
        `TRIPS`,
        `════════════════════════════════════`,
        ...tripCsvLines.slice(tripCsvLines.indexOf('')),   // reuse already built lines (skip header rows)
        ``,
        ``,
        `════════════════════════════════════`,
        `FUEL LOGS`,
        `════════════════════════════════════`,
      ];

      // Fuel logs CSV rows (inline here for the combined file)
      const fuelTotal  = fuelLogs.length;
      const fuelLiters = fuelLogs.reduce((s, l) => s + (parseFloat(l.liters ?? l.Liters) || 0), 0);
      const fuelCost   = fuelLogs.reduce((s, l) => s + exportParseCost(l.totalCostCur ?? l.TotalCostCur), 0);
      const fuelAvgCpl = fuelLiters > 0 ? Math.round(fuelCost / fuelLiters) : 0;

      combinedCsvLines.push(
        `Total records:,${fuelTotal.toLocaleString('hu-HU')}`,
        `Total liters:,"${fuelLiters.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L"`,
        `Total cost:,"${Math.round(fuelCost).toLocaleString('hu-HU')} Ft"`,
        `Avg cost/liter:,"${fuelAvgCpl} Ft/L"`,
        ``,
        ['ID', 'Date', 'Time', 'Vehicle', 'Driver Email', 'Station', 'Liters', 'Total Cost'].join(','),
        ...fuelLogs.map((log) => {
          const fmt = exportFormatDateTime(log.date ?? log.Date);
          return [log.id ?? log.Id, fmt.date, fmt.time, esc(log.licensePlate ?? log.LicensePlate ?? ''), esc(log.userEmail ?? log.UserEmail ?? ''), esc(log.stationName ?? log.StationName ?? ''), (parseFloat(log.liters ?? log.Liters) || 0).toFixed(2).replace('.', ','), esc(log.totalCostCur ?? log.TotalCostCur ?? '')].join(',');
        }),
        ``,
        ``,
        `════════════════════════════════════`,
        `SERVICE REQUESTS`,
        `════════════════════════════════════`,
      );

      const srTotal    = srs.length;
      const srOngoing  = srs.filter(r => { const s = r.status ?? r.Status; return s !== 'REJECTED' && s !== 'CLOSED'; }).length;
      const srApproved = srs.filter(r => (r.status ?? r.Status) === 'APPROVED').length;
      const srWithCost = srs.filter(r => r.driverReportCost ?? r.DriverReportCost).length;

      combinedCsvLines.push(
        `Total records:,${srTotal}`,
        ``,
        ['ID', 'Title', 'Vehicle', 'Driver', 'Status', 'Scheduled', 'Reported Cost (Ft)', 'Closed At'].join(','),
        ...srs.map(r => {
          const scheduled = r.scheduledStart ?? r.ScheduledStart ?? '';
          const closed = r.closedAt ?? r.ClosedAt ?? '';
          return [r.id ?? r.Id ?? '', esc(r.title ?? r.Title ?? ''), r.licensePlate ?? r.LicensePlate ?? '', esc(r.userEmail ?? r.UserEmail ?? ''), r.status ?? r.Status ?? '', scheduled ? new Date(scheduled).toLocaleDateString('hu-HU') : '', r.driverReportCost ?? r.DriverReportCost ?? '', closed ? new Date(closed).toLocaleDateString('hu-HU') : ''].join(',');
        }),
      );

      const combinedCsv = '\uFEFF' + combinedCsvLines.join('\r\n');

      // ══════════════════════════════════════════════════════════════════════
      // COMBINED WORD (HTML)
      // ══════════════════════════════════════════════════════════════════════

      const tripCards = trips.map((t) => {
        const fmt = exportFormatDateTime(t.startTime ?? t.StartTime);
        const dist = (parseFloat(t.distanceKm ?? t.DistanceKm) || 0).toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const dur = exportFormatDuration(t.long ?? t.Long);
        const plate = t.licensePlate ?? t.LicensePlate ?? '—';
        const driver = t.userEmail ?? t.UserEmail ?? '—';
        const origin = t.startLocation ?? t.StartLocation ?? '—';
        const dest = t.endLocation ?? t.EndLocation ?? '—';
        const notes = t.notes ?? t.Notes ?? '';
        const id = t.id ?? t.Id;
        return `<div class="trip-card">
  <div class="card-header"><div class="card-number">#${id}</div><div class="card-plate">${plate}</div><div class="card-date">${fmt.date} &nbsp; ${fmt.time}</div></div>
  <div class="card-route"><div class="route-point"><span class="route-dot dot-origin"></span><span class="route-label">From</span><span class="route-value">${origin}</span></div><div class="route-arrow">&#8594;</div><div class="route-point"><span class="route-dot dot-dest"></span><span class="route-label">To</span><span class="route-value">${dest}</span></div></div>
  <div class="card-stats"><div class="stat-pill">&#128205; ${dist} km</div><div class="stat-pill">&#128344; ${dur}</div></div>
  <div class="card-footer"><span class="driver-label">Driver:</span> <span class="driver-email">${driver}</span>${notes ? ` &nbsp;|&nbsp; <span class="notes-text">${notes}</span>` : ''}</div>
</div>`;
      }).join('\n');

      const tripHtml_cards = tripCards; // already built above

      // Fuel cards (for combined Word)
      const fuelCards = fuelLogs.map((log) => {
        const fmt = exportFormatDateTime(log.date ?? log.Date);
        const plate = log.licensePlate ?? log.LicensePlate ?? '—';
        const liters = (parseFloat(log.liters ?? log.Liters) || 0).toFixed(2);
        const cost = log.totalCostCur ?? log.TotalCostCur ?? '—';
        const station = log.stationName ?? log.StationName ?? '—';
        const driver = log.userEmail ?? log.UserEmail ?? '—';
        const id = log.id ?? log.Id;
        const rid = log.receiptFileId ?? log.ReceiptFileId;
        const receiptEntry = rid ? receiptMap[rid] : null;
        const receiptHtml = receiptEntry
          ? `<div class="receipt-section"><div class="receipt-label">Receipt</div><div class="receipt-filename">&#128206; ${receiptEntry.filename}</div></div>`
          : `<div class="receipt-section receipt-missing">No receipt uploaded</div>`;
        return `<div class="fuel-card">
  <div class="card-header"><div class="card-number">#${id}</div><div class="card-plate">${plate}</div><div class="card-date">${fmt.date}&nbsp;&nbsp;${fmt.time}</div></div>
  <div class="card-stats"><div class="stat-pill pill-orange">&#9650; ${liters} L</div><div class="stat-pill pill-green">&#128178; ${cost}</div><div class="stat-pill">&#128205; ${station}</div></div>
  <div class="card-driver"><span class="driver-label">Driver:</span> <span class="driver-email">${driver}</span></div>
  ${receiptHtml}
</div>`;
      }).join('\n');

      // Service request cards (for combined Word)
      const srStatusLabels = { REQUESTED: 'Requested', APPROVED: 'Approved', REJECTED: 'Rejected', CLOSED: 'Closed', DRIVER_COST: 'Cost Report' };
      const srStatusColors = {
        REQUESTED:   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        APPROVED:    { bg: '#dcfce7', text: '#166534', border: '#86efac' },
        REJECTED:    { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        CLOSED:      { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' },
        DRIVER_COST: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
      };
      const srCards = srs.map(r => {
        const id = r.id ?? r.Id ?? '';
        const title = r.title ?? r.Title ?? '—';
        const plate = r.licensePlate ?? r.LicensePlate ?? '—';
        const driver = r.userEmail ?? r.UserEmail ?? '—';
        const rawStatus = r.status ?? r.Status ?? '';
        const statusLbl = srStatusLabels[rawStatus] ?? rawStatus;
        const sc = srStatusColors[rawStatus] ?? { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
        const scheduled = r.scheduledStart ?? r.ScheduledStart ?? '';
        const closed = r.closedAt ?? r.ClosedAt ?? '';
        const cost = r.driverReportCost ?? r.DriverReportCost;
        const scheduledFmt = scheduled ? new Date(scheduled).toLocaleDateString('hu-HU') : '—';
        const closedFmt = closed ? new Date(closed).toLocaleDateString('hu-HU') : null;
        const invoiceEntry = invoiceMap[id];
        const invoiceHtml = invoiceEntry
          ? `<div class="invoice-section"><div class="invoice-label">Invoice</div><div class="invoice-filename">&#128206; ${invoiceEntry.filename}</div></div>`
          : '';
        return `<div class="sr-card">
  <div class="card-header"><div class="card-number">#${id}</div><div class="card-title">${title}</div><div class="status-badge" style="background:${sc.bg};color:${sc.text};border:1px solid ${sc.border}">${statusLbl}</div></div>
  <div class="card-row"><div class="stat-pill pill-vehicle">&#128663; ${plate}</div><div class="stat-pill pill-date">&#128197; ${scheduledFmt}</div>${cost != null && cost !== '' ? `<div class="stat-pill pill-cost">&#128178; ${cost} Ft</div>` : ''}${closedFmt ? `<div class="stat-pill pill-closed">&#10003; Closed: ${closedFmt}</div>` : ''}</div>
  <div class="card-driver"><span class="driver-label">Driver:</span> <span class="driver-email">${driver}</span></div>
  ${invoiceHtml}
</div>`;
      }).join('\n');

      // ── Dashboard KPI sub-labels (for Word summary cards) ──────────────────
      const kpiFuelSub = fuelCost === 0 || trStats.fuelCostChange === null
        ? `<span class="hl-grey">Cannot be compared</span>`
        : `<span class="${trStats.fuelCostChange >= 0 ? 'hl-red' : 'hl-green'}">${trStats.fuelCostChange >= 0 ? '+' : ''}${trStats.fuelCostChange}%</span> vs previous period`;
      const kpiActiveColor = fleetStats.activePercent >= 50 ? 'hl-green' : 'hl-red';
      const kpiUtilColor = trStats.utilizationRate >= 50 ? 'hl-green' : 'hl-red';
      const kpiSrWaitColor = trStats.srWaiting === 0 ? 'hl-green' : 'hl-red';

      // ── Combined Word (single HTML document) ─────────────────────────────
      const combinedHtml = `<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"><title>FleetFlow - Fleet Report</title><style>
body{font-family:Calibri,Arial,sans-serif;margin:32px;color:#0f172a;font-size:13px;}
h1{font-size:24px;color:#1d6ee6;margin-bottom:2px;}
h2{font-size:16px;font-weight:700;margin:32px 0 4px;padding-bottom:6px;border-bottom:2px solid currentColor;}
h2.trips-title{color:#1d6ee6;}h2.fuel-title{color:#f97316;}h2.sr-title{color:#7c3aed;}
.subtitle{color:#64748b;font-size:12px;margin-bottom:4px;}.meta{color:#94a3b8;font-size:11px;margin-bottom:24px;}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:16px 0 6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;}
.stats-grid{display:flex;gap:14px;margin-bottom:20px;flex-wrap:wrap;}
.stat-box{border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;min-width:120px;}
.stat-box .label{font-size:10px;text-transform:uppercase;color:#94a3b8;}
.stat-box .value{font-size:17px;font-weight:700;color:#0f172a;}
.stat-box.blue{border-top:3px solid #3b82f6;}.stat-box.green{border-top:3px solid #16a34a;}.stat-box.purple{border-top:3px solid #7c3aed;}.stat-box.orange{border-top:3px solid #f97316;}
.trip-card,.fuel-card,.sr-card{border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin-bottom:12px;background:#ffffff;page-break-inside:avoid;}
.card-header{display:flex;align-items:center;gap:12px;margin-bottom:10px;border-bottom:1px solid #f1f5f9;padding-bottom:8px;}
.card-number{font-size:11px;font-weight:700;color:#94a3b8;min-width:28px;}
.card-plate{font-size:14px;font-weight:700;color:#1e293b;background:#f1f5f9;border-radius:5px;padding:2px 10px;letter-spacing:1px;}
.card-title{font-size:13px;font-weight:700;color:#1e293b;flex:1;}
.card-date{font-size:12px;color:#64748b;margin-left:auto;}
.status-badge{font-size:10px;font-weight:700;border-radius:12px;padding:3px 10px;white-space:nowrap;}
.card-route{display:flex;align-items:center;gap:14px;margin-bottom:10px;}
.route-point{display:flex;align-items:center;gap:6px;flex:1;}
.route-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
.dot-origin{background:#3b82f6;}.dot-dest{background:#ef4444;}
.route-label{font-size:9px;text-transform:uppercase;color:#94a3b8;min-width:22px;}
.route-value{font-size:12px;color:#1e293b;}.route-arrow{font-size:16px;color:#cbd5e1;}
.card-stats,.card-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
.stat-pill{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:3px 10px;font-size:11px;color:#475569;}
.pill-orange{background:#fff7ed;border-color:#fed7aa;color:#c2410c;}
.pill-green{background:#f0fdf4;border-color:#bbf7d0;color:#15803d;}
.pill-vehicle{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8;}
.pill-date{background:#fefce8;border-color:#fde68a;color:#92400e;}
.pill-cost{background:#f0fdf4;border-color:#bbf7d0;color:#15803d;}
.pill-closed{background:#f1f5f9;border-color:#cbd5e1;color:#475569;}
.card-footer,.card-driver{font-size:11px;color:#64748b;margin-bottom:2px;}
.driver-label{font-weight:600;color:#475569;}.driver-email{color:#1d6ee6;}.notes-text{font-style:italic;}
.receipt-section,.invoice-section{margin-top:10px;border-top:1px solid #f1f5f9;padding-top:8px;}
.receipt-label,.invoice-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px;}
.receipt-filename{font-size:12px;color:#1d6ee6;font-family:monospace;}
.invoice-filename{font-size:12px;color:#7c3aed;font-family:monospace;}
.receipt-missing{font-size:11px;color:#94a3b8;font-style:italic;}
.footer{margin-top:32px;font-size:10px;color:#94a3b8;text-align:right;border-top:1px solid #f1f5f9;padding-top:10px;}
.kpi-grid{display:flex;gap:16px;margin:12px 0 28px;flex-wrap:wrap;}
.kpi-card{border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;flex:1;min-width:150px;background:#fafafa;}
.kpi-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;font-weight:700;margin-bottom:6px;}
.kpi-value{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:4px;}
.kpi-sub{font-size:12px;color:#64748b;}
.kpi-card.kpi-blue{border-top:3px solid #1d6ee6;}.kpi-card.kpi-orange{border-top:3px solid #f97316;}.kpi-card.kpi-green{border-top:3px solid #16a34a;}.kpi-card.kpi-purple{border-top:3px solid #7c3aed;}
.hl-green{color:#16a34a;font-weight:700;}.hl-red{color:#dc2626;font-weight:700;}.hl-grey{color:#94a3b8;}
</style></head><body>
<h1>FleetFlow – Fleet Report</h1>
<div class="subtitle">${rangeLabel} – ${dateRange}</div>
<div class="meta">Exported: ${exportDate}</div>

<h2 style="color:#1e293b;margin-top:20px;border-bottom:2px solid #e2e8f0;">&#128202; Dashboard Summary</h2>
<div class="kpi-grid">
  <div class="kpi-card kpi-blue">
    <div class="kpi-label">Total Fleet</div>
    <div class="kpi-value">${fleetStats.total}</div>
    <div class="kpi-sub"><span class="${kpiActiveColor}">${fleetStats.activePercent}%</span> active</div>
  </div>
  <div class="kpi-card kpi-orange">
    <div class="kpi-label">Fuel Costs</div>
    <div class="kpi-value">${Math.round(fuelCost).toLocaleString('hu-HU')} Ft</div>
    <div class="kpi-sub">${kpiFuelSub}</div>
  </div>
  <div class="kpi-card kpi-green">
    <div class="kpi-label">Trips / Utilization</div>
    <div class="kpi-value">${tripTotal}</div>
    <div class="kpi-sub"><span class="${kpiUtilColor}">${trStats.utilizationRate}%</span> utilization rate</div>
  </div>
  <div class="kpi-card kpi-purple">
    <div class="kpi-label">Service Requests</div>
    <div class="kpi-value">${trStats.srCount}</div>
    <div class="kpi-sub"><span class="${kpiSrWaitColor}">${trStats.srWaiting}</span> waiting for response</div>
  </div>
</div>

<h2 class="trips-title">&#128663; Trips</h2>
<div class="section-title">Summary</div>
<div class="stats-grid">
  <div class="stat-box blue"><div class="label">Total Trips</div><div class="value">${tripTotal.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box green"><div class="label">Total Distance</div><div class="value">${tripDist.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div></div>
  <div class="stat-box purple"><div class="label">Avg / Trip</div><div class="value">${tripAvg.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</div></div>
</div>
<div class="section-title">Trip Records (${tripTotal})</div>
${tripHtml_cards}

<h2 class="fuel-title">&#9981; Fuel Logs</h2>
<div class="section-title">Summary</div>
<div class="stats-grid">
  <div class="stat-box blue"><div class="label">Total Records</div><div class="value">${fuelTotal.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box orange"><div class="label">Total Liters</div><div class="value">${fuelLiters.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L</div></div>
  <div class="stat-box green"><div class="label">Total Cost</div><div class="value">${Math.round(fuelCost).toLocaleString('hu-HU')} Ft</div></div>
  <div class="stat-box purple"><div class="label">Avg / Liter</div><div class="value">${fuelAvgCpl} Ft/L</div></div>
</div>
<div class="section-title">Fuel Log Records (${fuelTotal})</div>
${fuelCards}

<h2 class="sr-title">&#128295; Service Requests</h2>
<div class="section-title">Summary</div>
<div class="stats-grid">
  <div class="stat-box purple"><div class="label">Total Records</div><div class="value">${srTotal.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box blue"><div class="label">Ongoing</div><div class="value">${srOngoing.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box green"><div class="label">Approved</div><div class="value">${srApproved.toLocaleString('hu-HU')}</div></div>
  <div class="stat-box orange"><div class="label">With Cost</div><div class="value">${srWithCost.toLocaleString('hu-HU')}</div></div>
</div>
<div class="section-title">Service Request Records (${srTotal})</div>
${srCards}

<div class="footer">FleetFlow – generated ${exportDate}</div>
</body></html>`;

      // ══════════════════════════════════════════════════════════════════════
      // BUILD ZIP (1 CSV + 1 Word + attachment folders)
      // ══════════════════════════════════════════════════════════════════════
      const zip = new JSZip();

      zip.file(`fleetflow_report_${fileDate}.csv`, combinedCsv);
      zip.file(`fleetflow_report_${fileDate}.doc`, combinedHtml);

      const receiptsFolder = zip.folder('receipts');
      for (const entry of Object.values(receiptMap)) {
        if (entry) receiptsFolder.file(entry.filename, entry.blob);
      }

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
      a.download = `fleetflow_report_${rangeLabel.replace(' ', '_').toLowerCase()}_${fileDate}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();

    const title = eventForm.title.trim();
    if (!title || !eventForm.date || !eventForm.startTime) {
      setEventFeedback({ type: 'danger', message: 'Title, date and start time are required.' });
      return;
    }

    const startDate = new Date(`${eventForm.date}T${eventForm.startTime}:00`);
    if (Number.isNaN(startDate.getTime())) {
      setEventFeedback({ type: 'danger', message: 'Invalid date format.' });
      return;
    }

    let endDate = null;
    if (eventForm.endTime) {
      endDate = new Date(`${eventForm.date}T${eventForm.endTime}:00`);
      if (Number.isNaN(endDate.getTime())) {
        setEventFeedback({ type: 'danger', message: 'Invalid end time format.' });
        return;
      }
      if (endDate <= startDate) {
        setEventFeedback({ type: 'danger', message: 'End time must be later than start time.' });
        return;
      }
    }

    setEventSaving(true);
    setEventFeedback({ type: '', message: '' });

    try {
      await api.post('/calendarevents', {
        title,
        description: eventForm.description?.trim() || null,
        startAt: startDate.toISOString(),
        endAt: endDate ? endDate.toISOString() : null,
      });

      setEventForm({ title: '', date: '', startTime: '09:00', endTime: '', description: '' });
      setEventFeedback({ type: 'success', message: 'Event created successfully.' });
      await loadCalendarEvents();
      await loadUpcomingEvents();
    } catch (error) {
      setEventFeedback({ type: 'danger', message: 'Failed to create event.' });
    } finally {
      setEventSaving(false);
    }
  };

  const calendarEventStyleGetter = (event) => {
    let backgroundColor = '#0d6efd';
    if (event.eventType === 'SERVICE_APPOINTMENT') {
      backgroundColor = '#fd7e14';
    } else if (event.eventType === 'TRIP') {
      backgroundColor = '#198754';
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        border: 'none',
        color: '#ffffff',
      },
    };
  };

  const getDisplayName = () => {
    const emailPrefix = user?.email?.split('@')[0] || 'Admin';
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  const formatEventTime = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatEventDate = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  const getEventIcon = (eventType) => {
    if (eventType === 'SERVICE_APPOINTMENT') {
      return (
        <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    } else if (eventType === 'TRIP') {
      return (
        <svg width="20" height="20" fill="none" stroke="#fd7e14" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="1" y="3" width="15" height="13" strokeLinecap="round" strokeLinejoin="round"/>
          <polygon points="16,8 20,8 23,11 23,16 16,16 16,8" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="5.5" cy="18.5" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="18.5" cy="18.5" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" fill="none" stroke="#6c757d" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const getEventTypeColor = (eventType) => {
    if (eventType === 'SERVICE_APPOINTMENT') return '#0d6efd';
    if (eventType === 'TRIP') return '#fd7e14';
    return '#198754';
  };

  return (
    <div className="admin-dashboard">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notificationRefresh={0}
      />

      <main className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <Row className="g-3 align-items-center">
            <Col xs={12} lg={6}>
              <div className="header-title">
                <h1>Dashboard Overview</h1>
                <p>Welcome back, here's what's happening with your fleet today.</p>
              </div>
            </Col>
            <Col xs={12} lg={6}>
              <div className="header-actions d-flex flex-wrap gap-2 justify-content-center justify-content-xl-end">
                <div className="time-range-selector btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${timeRange === 'today' ? 'active' : ''}`}
                    onClick={() => setTimeRange('today')}
                  >
                    {t('adminDash.range.today')}
                  </button>
                  <button
                    type="button"
                    className={`btn ${timeRange === 'week' ? 'active' : ''}`}
                    onClick={() => setTimeRange('week')}
                  >
                    {t('adminDash.range.week')}
                  </button>
                  <button
                    type="button"
                    className={`btn ${timeRange === 'month' ? 'active' : ''}`}
                    onClick={() => setTimeRange('month')}
                  >
                    {t('adminDash.range.month')}
                  </button>
                </div>
                <Button className="export-report-btn" onClick={handleExportReport} disabled={exportLoading}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,10 12,15 17,10" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {exportLoading ? 'Exporting…' : 'Export Report'}
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Stats Cards */}
        <Row className="g-3 mb-4">
          {/* Card 1: Total Fleet — always all-time */}
          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">Total Fleet</span>
                    <h3 className="stat-value mb-2">{fleetStats.total}</h3>
                    <Badge
                      bg={fleetStats.activePercent >= 50 ? 'success-subtle' : 'danger-subtle'}
                      text={fleetStats.activePercent >= 50 ? 'success' : 'danger'}
                      className="stat-change"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                        {fleetStats.activePercent >= 50
                          ? <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" strokeLinecap="round" strokeLinejoin="round"/>
                          : <polyline points="23,18 13.5,8.5 8.5,13.5 1,6" strokeLinecap="round" strokeLinejoin="round"/>
                        }
                      </svg>
                      {fleetStats.activePercent}% active
                    </Badge>
                  </div>
                  <div className="stat-icon fleet">
                    <svg width="28" height="28" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="1" y="3" width="15" height="13" strokeLinecap="round" strokeLinejoin="round"/>
                      <polygon points="16,8 20,8 23,11 23,16 16,16 16,8" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="5.5" cy="18.5" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="18.5" cy="18.5" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Card 2: Fuel Costs — filtered by timeRange */}
          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">
                      Fuel Costs ({timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'})
                    </span>
                    <h3 className="stat-value mb-2">
                      {trStatsLoading ? '…' : `${Math.round(trStats.fuelCost).toLocaleString('hu-HU')} Ft`}
                    </h3>
                    {!trStatsLoading && trStats.fuelCost === 0 ? (
                      <Badge bg="secondary-subtle" text="secondary" className="stat-change">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                          <path d="M12 8v8m-4-4h8M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Cannot be compared
                      </Badge>
                    ) : !trStatsLoading && trStats.fuelCostChange !== null ? (
                      <Badge
                        bg={trStats.fuelCostChange <= 0 ? 'success-subtle' : 'danger-subtle'}
                        text={trStats.fuelCostChange <= 0 ? 'success' : 'danger'}
                        className="stat-change"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                          {trStats.fuelCostChange <= 0
                            ? <polyline points="23,18 13.5,8.5 8.5,13.5 1,6" strokeLinecap="round" strokeLinejoin="round"/>
                            : <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" strokeLinecap="round" strokeLinejoin="round"/>
                          }
                        </svg>
                        {Math.abs(trStats.fuelCostChange)}% vs prev. {timeRange === 'today' ? 'day' : timeRange === 'week' ? 'week' : 'month'}
                      </Badge>
                    ) : !trStatsLoading ? (
                      <span className="stat-extra text-muted small">No data for previous period</span>
                    ) : null}
                  </div>
                  <div className="stat-icon fuel">
                    <svg width="28" height="28" fill="none" stroke="#fd7e14" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Card 3: Trips — filtered by timeRange */}
          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">
                      Trips ({timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'})
                    </span>
                    <h3 className="stat-value mb-2">
                      {trStatsLoading ? '…' : trStats.tripCount}
                    </h3>
                    {!trStatsLoading && (
                      <Badge
                        bg={trStats.utilizationRate >= 50 ? 'success-subtle' : 'danger-subtle'}
                        text={trStats.utilizationRate >= 50 ? 'success' : 'danger'}
                        className="stat-change"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                          {trStats.utilizationRate >= 50
                            ? <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" strokeLinecap="round" strokeLinejoin="round"/>
                            : <polyline points="23,18 13.5,8.5 8.5,13.5 1,6" strokeLinecap="round" strokeLinejoin="round"/>
                          }
                        </svg>
                        {trStats.utilizationRate}% utilization rate
                      </Badge>
                    )}
                  </div>
                  <div className="stat-icon trips">
                    <svg width="28" height="28" fill="none" stroke="#198754" strokeWidth="2" viewBox="0 0 24 24">
                      <polygon points="12,2 2,22 22,22 12,2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polygon points="12,8 8,16 16,16 12,8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Card 4: Service Requests — filtered by timeRange */}
          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">
                      Service Requests ({timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'})
                    </span>
                    <h3 className="stat-value mb-2">
                      {trStatsLoading ? '…' : `${trStats.srCount} created`}
                    </h3>
                    <span className="stat-extra text-muted small">
                      {trStatsLoading ? '…' : (
                        <><span className={trStats.srWaiting === 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>{trStats.srWaiting}</span> Waiting for response</>
                      )}
                    </span>
                  </div>
                  <div className="stat-icon maintenance">
                    <svg width="28" height="28" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Second Row - Calendar + Quick Add + Upcoming */}
        <Row className="g-3 mb-4">
          <Col lg={8} xl={9}>
            <Card className="schedule-card h-100">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0">{t('adminDash.schedule.title')}</h3>
                  <div className="calendar-nav-arrows d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => {
                      const newDate = new Date(calendarDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCalendarDate(newDate);
                    }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="15,18 9,12 15,6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>
                    <span className="current-month">
                      {calendarDate.toLocaleDateString(t('dashboard.locale'), { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline-secondary" size="sm" onClick={() => {
                      const newDate = new Date(calendarDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCalendarDate(newDate);
                    }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="9,18 15,12 9,6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="rbc-wrapper h-100" style={{ height: '100%', minHeight: 0 }}>
                {!selectedCalendarEvent ? (
                  <Calendar
                    localizer={localizer}
                    culture={language}
                    events={scheduleEvents}
                    eventPropGetter={calendarEventStyleGetter}
                    onSelectEvent={(event) => {
                      setSelectedCalendarEvent(event);
                    }}
                    date={calendarDate}
                    onNavigate={setCalendarDate}
                    view={calendarView}
                    onView={setCalendarView}
                    views={['month', 'week', 'day']}
                    style={{ height: '100%' }}
                    toolbar={true}
                    messages={{
                      today: t('adminDash.cal.today'),
                      previous: t('adminDash.cal.back'),
                      next: t('adminDash.cal.next'),
                      month: t('adminDash.cal.month'),
                      week: t('adminDash.cal.week'),
                      day: t('adminDash.cal.day'),
                    }}
                    popup
                  />
                ) : (
                  <div className="h-100 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                      <div>
                        <h4 className="mb-1 fw-bold">Event Details</h4>
                        <small className="text-muted">Review, then delete if needed.</small>
                      </div>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        size="sm"
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 34, height: 34 }}
                        aria-label="Close"
                        onClick={() => setSelectedCalendarEvent(null)}
                      >
                        ×
                      </Button>
                    </div>
                    <Card className="border-0 bg-light-subtle mb-3 shadow-sm flex-grow-1" style={{ minHeight: 0 }}>
                      <Card.Body className="p-3 h-100" style={{ minHeight: 0 }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <small className="text-muted d-block">TITLE</small>
                            <h5 className="mb-0 fw-semibold">{selectedCalendarEvent.title || 'N/A'}</h5>
                          </div>
                          <Badge bg="dark" pill>{selectedCalendarEvent.eventType || 'DEFAULT'}</Badge>
                        </div>
                        <Row className="g-2">
                          <Col md={6} xs={12}>
                            <div className="p-2 bg-white rounded border h-100">
                              <small className="text-muted d-block">START</small>
                              <span className="fw-medium">{selectedCalendarEvent.start?.toLocaleString() || 'N/A'}</span>
                            </div>
                          </Col>
                          <Col md={6} xs={12}>
                            <div className="p-2 bg-white rounded border h-100">
                              <small className="text-muted d-block">END</small>
                              <span className="fw-medium">{selectedCalendarEvent.end?.toLocaleString() || 'N/A'}</span>
                            </div>
                          </Col>
                          <Col xs={12}>
                            <div className="p-2 bg-white rounded border">
                              <small className="text-muted d-block">DESCRIPTION</small>
                              <span>{selectedCalendarEvent.description || 'No description'}</span>
                            </div>
                          </Col>
                          {selectedCalendarEvent.relatedServiceRequestId && (
                            <Col xs={12}>
                              <div className="p-2 bg-white rounded border">
                                <small className="text-muted d-block">RELATED SERVICE REQUEST</small>
                                <span className="fw-medium">#{selectedCalendarEvent.relatedServiceRequestId}</span>
                              </div>
                            </Col>
                          )}
                        </Row>
                      </Card.Body>
                    </Card>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} xl={3}>
            <Row className="g-3">
              <Col xs={12}>
                <Card className="event-card h-100 d-flex flex-column">
                  <Card.Header style={{ flexShrink: 0 }}>
                    <h3 className="mb-0">Quick Add Event</h3>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column" style={{ flex: 1, overflow: 'hidden' }}>
                    <Form onSubmit={handleSaveEvent} className="d-flex flex-column h-100">
                      <Form.Group className="mb-3" style={{ flexShrink: 0 }}>
                        <Form.Label className="small text-muted fw-semibold">EVENT TITLE</Form.Label>
                        <Form.Control
                          type="text"
                          name="title"
                          placeholder="e.g. Service Checkup"
                          value={eventForm.title}
                          onChange={handleEventChange}
                          required
                        />
                      </Form.Group>
                      <Form.Group className="mb-3" style={{ flexShrink: 0 }}>
                        <Form.Label className="small text-muted fw-semibold">DATE</Form.Label>
                        <Form.Control
                          type="date"
                          name="date"
                          value={eventForm.date}
                          onChange={handleEventChange}
                          required
                        />
                      </Form.Group>
                      <Row className="g-2 mb-3" style={{ flexShrink: 0 }}>
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small text-muted fw-semibold">START</Form.Label>
                            <Form.Control
                              type="time"
                              name="startTime"
                              value={eventForm.startTime}
                              onChange={handleEventChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small text-muted fw-semibold">END</Form.Label>
                            <Form.Control
                              type="time"
                              name="endTime"
                              value={eventForm.endTime}
                              onChange={handleEventChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3 d-flex flex-column" style={{ flex: 1, minHeight: 0 }}>
                        <Form.Label className="small text-muted fw-semibold" style={{ flexShrink: 0 }}>DESCRIPTION</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="description"
                          placeholder="Additional notes..."
                          value={eventForm.description}
                          onChange={handleEventChange}
                          style={{ resize: 'none', flex: 1, minHeight: 0 }}
                        />
                      </Form.Group>
                      <Button type="submit" variant="primary" className="w-100" style={{ flexShrink: 0 }} disabled={eventSaving}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17,21 17,13 7,13 7,21" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7,3 7,8 15,8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {eventSaving ? 'Saving...' : 'Save Event'}
                      </Button>
                      {eventFeedback.message && (
                        <div className={`mt-2 alert alert-${eventFeedback.type} py-2 px-3 mb-0`} role="alert">
                          {eventFeedback.message}
                        </div>
                      )}
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12}>
                <Card className="upcoming-card">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h3 className="mb-0 fs-5">Upcoming</h3>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center text-muted py-4 small">No upcoming events</div>
                    ) : (
                      <div className="upcoming-list">
                        {upcomingEvents.map(event => (
                          <div key={event.id} className="upcoming-item d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <div className="upcoming-icon">
                                {getEventIcon(event.eventType)}
                              </div>
                              <div className="upcoming-info">
                                <h6 className="mb-0">{event.title}</h6>
                                <small className="text-muted">
                                  {event.vehicle || 'Vehicle'} • {formatEventDate(event.startAt)}, {formatEventTime(event.startAt)}
                                </small>
                              </div>
                              <div
                                className="upcoming-status-dot"
                                style={{ backgroundColor: getEventTypeColor(event.eventType) }}
                              />
                            </div>
                            <Button size="sm" variant="outline-primary" onClick={() => {
                              const found = scheduleEvents.find(e => String(e.id) === String(event.id));
                              if (found) setSelectedCalendarEvent(found);
                            }}>
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </main>
    </div>
  );
};

export default AdminDashboard;
