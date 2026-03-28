import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Card, Container, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { authService } from '../services/authService';
import api from '../services/api';
import '../styles/AdminDashboard.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { hu },
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
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
  const [currentDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [timeRange, setTimeRange] = useState('today');
  const [stats, setStats] = useState({
    totalFleet: 0,
    fuelCosts: 0,
    fuelCostsChange: 0,
    activeTrips: 0,
    utilizationRate: 0,
    pendingMaintenance: 0,
    urgentRequests: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    eventType: 'Trip',
    vehicle: '',
    date: '',
    driver: 'Auto',
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [eventFeedback, setEventFeedback] = useState({ type: '', message: '' });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Fetch calendar events
  const loadCalendarEvents = async () => {
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
  };

  // Fetch dashboard statistics
  const loadStatistics = async () => {
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
  };

  // Fetch upcoming events
  const loadUpcomingEvents = async () => {
    try {
      const response = await api.get('/calendarevents/upcoming?limit=5');
      const events = Array.isArray(response.data) ? response.data : [];
      setUpcomingEvents(events.map(e => ({
        id: e.id || e.Id,
        title: e.title || e.Title,
        startAt: e.startAt || e.StartAt,
        eventType: e.eventType || e.EventType,
        vehicle: e.vehicle || e.Vehicle,
      })));
    } catch (error) {
      console.log('Could not fetch upcoming events:', error.message);
    }
  };

  // Fetch vehicles for dropdown
  const loadVehicles = async () => {
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
  };

  // Fetch drivers for dropdown
  const loadDrivers = async () => {
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

  useEffect(() => {
    loadCalendarEvents();
    loadStatistics();
    loadUpcomingEvents();
    loadVehicles();
    loadDrivers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventSaving(true);
    setEventFeedback({ type: '', message: '' });

    try {
      const startDate = new Date(eventForm.date);
      startDate.setHours(9, 0, 0, 0);

      const endDate = new Date(eventForm.date);
      endDate.setHours(17, 0, 0, 0);

      await api.post('/calendarevents', {
        title: `${eventForm.eventType} - ${eventForm.vehicle}`,
        description: `${eventForm.eventType} scheduled for ${eventForm.date}`,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        eventType: eventForm.eventType === 'Trip' ? 'TRIP' : 'SERVICE_APPOINTMENT',
      });

      setEventForm({ eventType: 'Trip', vehicle: '', date: '', driver: 'Auto' });
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
                    Today
                  </button>
                  <button
                    type="button"
                    className={`btn ${timeRange === 'week' ? 'active' : ''}`}
                    onClick={() => setTimeRange('week')}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    className={`btn ${timeRange === 'month' ? 'active' : ''}`}
                    onClick={() => setTimeRange('month')}
                  >
                    Month
                  </button>
                </div>
                <Button className="export-report-btn">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,10 12,15 17,10" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Export Report
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Stats Cards */}
        <Row className="g-3 mb-4">
          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">Total Fleet</span>
                    <h3 className="stat-value mb-2">{stats.totalFleet}</h3>
                    <Badge bg="success-subtle" text="success" className="stat-change">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                        <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="17,6 23,6 23,12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      12%
                    </Badge>
                    <span className="stat-compare text-muted small ms-1">vs last month</span>
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

          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">Fuel Costs</span>
                    <h3 className="stat-value mb-2">${stats.fuelCosts.toLocaleString()}</h3>
                    <Badge bg="danger-subtle" text="danger" className="stat-change">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                        <polyline points="23,18 13.5,8.5 8.5,13.5 1,6" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="17,18 23,18 23,12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {stats.fuelCostsChange}%
                    </Badge>
                    <span className="stat-compare text-muted small ms-1">vs last month</span>
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

          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">Active Trips</span>
                    <h3 className="stat-value mb-2">{stats.activeTrips}</h3>
                    <span className="stat-extra text-muted small">{stats.utilizationRate}% utilization rate</span>
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

          <Col xl={3} lg={4} md={6}>
            <Card className="stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="stat-label text-muted small">Pending Maintenance</span>
                    <h3 className="stat-value mb-2">{stats.pendingMaintenance}</h3>
                    <span className="stat-extra text-muted small">
                      <span className="text-danger fw-semibold">{stats.urgentRequests} Urgent</span> requests
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
                  <h3 className="mb-0">Schedule Overview</h3>
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
                      {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
              <Card.Body className="rbc-wrapper" style={{ minHeight: 460 }}>
                {!selectedCalendarEvent ? (
                  <Calendar
                    localizer={localizer}
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
                    style={{ height: 440 }}
                    toolbar={true}
                    popup
                  />
                ) : (
                  <div className="h-100 d-flex flex-column">
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
                    <Card className="border-0 bg-light-subtle mb-3 shadow-sm">
                      <Card.Body className="p-3">
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
                <Card className="quick-add-card h-100">
                  <Card.Header className="bg-light">
                    <h3 className="mb-0 fs-5">Quick Add Event</h3>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleSaveEvent}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-semibold">Event Type</Form.Label>
                        <div className="d-flex gap-2">
                          <Button
                            variant={eventForm.eventType === 'Trip' ? 'primary' : 'outline-primary'}
                            className="flex-fill"
                            onClick={() => setEventForm(prev => ({ ...prev, eventType: 'Trip' }))}
                          >
                            Trip
                          </Button>
                          <Button
                            variant={eventForm.eventType === 'Service' ? 'primary' : 'outline-primary'}
                            className="flex-fill"
                            onClick={() => setEventForm(prev => ({ ...prev, eventType: 'Service' }))}
                          >
                            Service
                          </Button>
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted fw-semibold">Vehicle</Form.Label>
                        <Form.Select
                          value={eventForm.vehicle}
                          onChange={(e) => setEventForm(prev => ({ ...prev, vehicle: e.target.value }))}
                          required
                        >
                          <option value="">Select Vehicle...</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.licensePlate}>
                              {v.brandModel} ({v.licensePlate})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Row className="g-2 mb-3">
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small text-muted fw-semibold">Date</Form.Label>
                            <Form.Control
                              type="date"
                              value={eventForm.date}
                              onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className="small text-muted fw-semibold">Driver</Form.Label>
                            <Form.Select
                              value={eventForm.driver}
                              onChange={(e) => setEventForm(prev => ({ ...prev, driver: e.target.value }))}
                            >
                              <option value="Auto">Auto</option>
                              {drivers.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.fullName}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button type="submit" variant="primary" className="w-100" disabled={eventSaving}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="8" x2="12" y2="16" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {eventSaving ? 'Creating...' : 'Create Entry'}
                      </Button>
                      {eventFeedback.message && (
                        <div className={`mt-2 alert alert-${eventFeedback.type} py-2 px-3 mb-0 small`}>
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
                    <Button variant="link" size="sm" className="text-decoration-none">View All</Button>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center text-muted py-4 small">No upcoming events</div>
                    ) : (
                      <div className="upcoming-list">
                        {upcomingEvents.map(event => (
                          <div key={event.id} className="upcoming-item">
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
