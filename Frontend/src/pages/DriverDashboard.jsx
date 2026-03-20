import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Container, Row, Col, Badge } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { hu } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { authService } from '../services/authService';
import api from '../services/api';
import '../styles/DriverDashboard.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { hu },
});

const DriverDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [currentDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [profile, setProfile] = useState({
    id: user?.id || 0,
    fullName: '',
    email: user?.email || '',
    phone: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    profileImgFileId: null,
    role: user?.role || 'DRIVER'
  });
  const [statistics, setStatistics] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalServices: 0,
    totalServicesCost: 0,
    totalFuels: 0,
    totalFuelCost: 0
  });
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '',
    description: ''
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [eventFeedback, setEventFeedback] = useState({ type: '', message: '' });
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);
  const [eventDeleting, setEventDeleting] = useState(false);
  const [calendarDetailFeedback, setCalendarDetailFeedback] = useState({ type: '', message: '' });
  const [copiedField, setCopiedField] = useState('');
  const copyFeedbackTimeoutRef = useRef(null);

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

  // Fetch profile and statistics from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await api.get('/profile/mine');
        const profileData = profileResponse.data;
        
        setProfile({
          id: profileData.id || profileData.Id || user?.id || 0,
          fullName: profileData.fullName || profileData.FullName || '',
          email: profileData.email || profileData.Email || user?.email || '',
          phone: profileData.phone || profileData.Phone || '',
          licenseNumber: profileData.licenseNumber || profileData.LicenseNumber || '',
          licenseExpiryDate: profileData.licenseExpiryDate || profileData.LicenseExpiryDate || '',
          profileImgFileId: profileData.profileImgFileId || profileData.ProfileImgFileId || null,
          role: profileData.role || profileData.Role || user?.role || 'DRIVER'
        });
      } catch (error) {
        console.log('Could not fetch profile:', error.message);
      }

      try {
        const vehicleResponse = await api.get('/profile/assigned-vehicle');
        const v = vehicleResponse.data;
        setVehicle({
          brandModel: v.brandModel || v.BrandModel || '',
          licensePlate: v.licensePlate || v.LicensePlate || '',
          year: v.year || v.Year || 0,
          currentMileageKm: v.currentMileageKm || v.CurrentMileageKm || 0,
          vin: v.vin || v.Vin || '',
          status: v.status || v.Status || 'Unknown'
        });
      } catch (error) {
        console.log('Could not fetch assigned vehicle:', error.message);
      } finally {
        setVehicleLoading(false);
      }

      await loadCalendarEvents();

      try {
        // Get statistics for last 12 months
        const statsResponse = await api.get('/statistics/mine?months=12');
        const data = statsResponse.data;
        
        setStatistics({
          totalTrips: data.totalTrips || data.TotalTrips || 0,
          totalDistance: data.totalDistance || data.TotalDistance || 0,
          totalServices: data.totalServices || data.TotalServices || 0,
          totalServicesCost: data.totalServicesCost || data.TotalServicesCost || 0,
          totalFuels: data.totalFuels || data.TotalFuels || 0,
          totalFuelCost: data.totalFuelCost || data.TotalFuelCost || 0
        });
      } catch (error) {
        console.log('Could not fetch statistics:', error.message);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleCopyToClipboard = (text, label, fieldKey) => {
    if (text && text !== 'N/A') {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldKey);
        if (copyFeedbackTimeoutRef.current) {
          clearTimeout(copyFeedbackTimeoutRef.current);
        }
        copyFeedbackTimeoutRef.current = setTimeout(() => {
          setCopiedField('');
        }, 1800);
        // You could add a toast notification here
        console.log(`${label} copied to clipboard: ${text}`);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!eventFeedback.message) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setEventFeedback({ type: '', message: '' });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [eventFeedback]);

  useEffect(() => {
    if (!calendarDetailFeedback.message) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setCalendarDetailFeedback({ type: '', message: '' });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [calendarDetailFeedback]);

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const getApiErrorMessage = (error, fallbackMessage) => {
    const apiData = error?.response?.data;

    if (typeof apiData === 'string' && apiData.trim()) {
      return apiData;
    }

    if (apiData?.message || apiData?.Message) {
      return apiData.message || apiData.Message;
    }

    if (Array.isArray(apiData?.errors) && apiData.errors.length > 0) {
      return apiData.errors.join(' ');
    }

    if (apiData?.errors && typeof apiData.errors === 'object') {
      const firstErrorList = Object.values(apiData.errors).find((value) => Array.isArray(value) && value.length > 0);
      if (firstErrorList) {
        return firstErrorList.join(' ');
      }
    }

    const status = error?.response?.status;
    if (status === 400) return 'Invalid event data. Please check date, time and title.';
    if (status === 401) return 'You are not authorized. Please sign in again.';
    if (status === 403) return 'You do not have permission for this action.';
    if (status === 404) return 'Requested endpoint or resource was not found.';

    if (error?.message === 'Network Error') {
      return 'Network error: backend is unavailable or blocked by CORS.';
    }

    return fallbackMessage;
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
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to create event.');
      setEventFeedback({ type: 'danger', message });
    } finally {
      setEventSaving(false);
    }
  };

  const handleDeleteSelectedEvent = async () => {
    if (!selectedCalendarEvent?.id) {
      setCalendarDetailFeedback({ type: 'danger', message: 'Event id is missing.' });
      return;
    }

    const selectedType = String(selectedCalendarEvent?.eventType || '').toUpperCase();
    if (selectedType === 'SERVICE_APPOINTMENT' && profile.role !== 'ADMIN') {
      setCalendarDetailFeedback({ type: 'danger', message: 'Not allowed to delete' });
      return;
    }

    setEventDeleting(true);
    setCalendarDetailFeedback({ type: '', message: '' });

    try {
      await api.delete(`/calendarevents/${selectedCalendarEvent.id}`);
      setSelectedCalendarEvent(null);
      await loadCalendarEvents();
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to delete event.');
      setCalendarDetailFeedback({ type: 'danger', message });
    } finally {
      setEventDeleting(false);
    }
  };

  const calendarEventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: '#0d6efd',
        borderRadius: '6px',
        border: 'none',
        color: '#ffffff',
      },
    };
  };

  const formatEventDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get display name from profile
  const getDisplayName = () => {
    if (profile.fullName) {
      return profile.fullName;
    }
    // Fallback: Format email prefix nicely: sofor1 -> Sofor1
    const emailPrefix = profile.email?.split('@')[0] || 'Driver';
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  const getInitials = () => {
    if (profile.fullName) {
      const names = profile.fullName.split(' ');
      if (names.length >= 2) {
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
      }
      return profile.fullName.charAt(0).toUpperCase();
    }
    return profile.email?.charAt(0)?.toUpperCase() || 'D';
  };

  // Format license expiry date
  const formatLicenseExpiry = () => {
    if (!profile.licenseExpiryDate) return 'N/A';
    const date = new Date(profile.licenseExpiryDate);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // State for profile image loading
  const [profileImageError, setProfileImageError] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  // Fetch profile image with auth
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (profile.id) {
        try {
          const response = await api.get(`/files/thumbnail/${profile.id}`, {
            responseType: 'blob'
          });
          const imageUrl = URL.createObjectURL(response.data);
          setProfileImageUrl(imageUrl);
          setProfileImageError(false);
        } catch (error) {
          console.log('Could not fetch profile image:', error.message);
          setProfileImageError(true);
        }
      }
    };
    
    fetchProfileImage();
    
    // Cleanup URL on unmount
    return () => {
      if (profileImageUrl) {
        URL.revokeObjectURL(profileImageUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="driver-dashboard">
      {/* Mobile Menu Button */}
      {!sidebarOpen && (
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="28" height="28" fill="none" stroke="#ffffff" strokeWidth="3" viewBox="0 0 24 24">
            <polyline points="9,6 15,12 9,18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/fleetflow_logo.png" alt="FleetFlow Logo" className="logo-image" />
            <div className="sidebar-brand">
              <span className="brand-name">FleetFlow</span>
              <span className="brand-tagline">Fleet Management</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </Link>
          <Link to="/fuel-logs" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Fuel Logs
          </Link>
          <Link to="/trips" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Trips
          </Link>
          <Link to="/service-requests" className="nav-item">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Service Requests
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {!profileImageError && profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt={getDisplayName()}
                />
              ) : (
                getInitials()
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{getDisplayName()}</p>
              <p className="user-role">{profile.role}</p>
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="action-btn" title="Notifications" aria-label="Notifications" onClick={() => navigate('/notifications')}>
              {/* Material Bell icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 16v-5a6 6 0 0 0-12 0v5a2 2 0 0 1-2 2h16a2 2 0 0 1-2-2z" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="action-btn" title="Logout" aria-label="Logout" onClick={handleLogout}>
              {/* Material Logout icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <Row className="g-3 mb-4">
          <Col xs={12}>
            <div className="dashboard-header">
              <Row className="g-3 align-items-start">
                <Col lg={12} xl={6} className="mb-3 mb-xl-0">
                  <div className="header-title">
                    <h1>Driver Dashboard</h1>
                    <p>Welcome back, {getDisplayName()}. Here is your daily summary.</p>
                  </div>
                </Col>
                <Col lg={12} xl={6}>
                  <div className="header-actions d-flex flex-wrap gap-2 justify-content-center justify-content-xl-end">
                    <Button className="new-trip-btn" onClick={() => navigate('/add-new-trip')}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      New Trip
                    </Button>
                    <Button className="new-fuel-btn" onClick={() => navigate('/add-fuel-log')}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      New Fuel Log
                    </Button>
                    <div className="date-display">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row className="g-3 mb-4">
          <Col lg={4} md={6} xs={6}>
            <Card className="stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon trips me-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label d-block text-muted small">Total Trips</span>
                  <span className="stat-value fs-4 fw-bold">{statistics.totalTrips}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} xs={6}>
            <Card className="stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon fuel me-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label d-block text-muted small">Total Fuel Logs</span>
                  <span className="stat-value fs-4 fw-bold">{statistics.totalFuels}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} xs={6}>
            <Card className="stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon services me-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label d-block text-muted small">Service Requests</span>
                  <span className="stat-value fs-4 fw-bold">{statistics.totalServices}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} xs={6}>
            <Card className="stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon distance me-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 20L8 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 20L16 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="16" x2="14" y2="16" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10.5" y1="12" x2="13.5" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="11" y1="8" x2="13" y2="8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label d-block text-muted small">Total Distance</span>
                  <span className="stat-value fs-4 fw-bold">{statistics.totalDistance.toLocaleString()} km</span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} xs={6}>
            <Card className="stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon fuel-cost me-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label d-block text-muted small">Fuel Cost</span>
                  <span className="stat-value fs-4 fw-bold">{statistics.totalFuelCost.toLocaleString()} Ft</span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} xs={6}>
            <Card className="stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon service-cost me-3">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <span className="stat-label d-block text-muted small">Service Cost</span>
                  <span className="stat-value fs-4 fw-bold">{statistics.totalServicesCost.toLocaleString()} Ft</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Second Row - Quick Add Event + Calendar */}
        <Row className="g-3 mb-4">
          <Col lg={4} md={12}>
            {/* Quick Add Event */}
            <Card className="event-card h-100 d-flex flex-column">
              <Card.Header className="bg-light" style={{ flexShrink: 0 }}>
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

          <Col lg={8} md={12}>
            {/* Schedule Calendar */}
            <Card className="schedule-card h-100">
              <Card.Header className="bg-light">
                <h3 className="mb-0 text-center">Schedule</h3>
              </Card.Header>
              <Card.Body className="rbc-wrapper" style={{ minHeight: 460 }}>
                {!selectedCalendarEvent ? (
                  <Calendar
                    localizer={localizer}
                    events={scheduleEvents}
                    eventPropGetter={calendarEventStyleGetter}
                    onSelectEvent={(event) => {
                      setCalendarDetailFeedback({ type: '', message: '' });
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
                        onClick={() => {
                          setCalendarDetailFeedback({ type: '', message: '' });
                          setSelectedCalendarEvent(null);
                        }}
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
                              <span className="fw-medium">{formatEventDateTime(selectedCalendarEvent.start)}</span>
                            </div>
                          </Col>
                          <Col md={6} xs={12}>
                            <div className="p-2 bg-white rounded border h-100">
                              <small className="text-muted d-block">END</small>
                              <span className="fw-medium">{formatEventDateTime(selectedCalendarEvent.end)}</span>
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

                    {calendarDetailFeedback.message && (
                      <div className={`alert alert-${calendarDetailFeedback.type} py-2 px-3`} role="alert">
                        {calendarDetailFeedback.message}
                      </div>
                    )}

                    {String(selectedCalendarEvent?.eventType || '').toUpperCase() === 'SERVICE_APPOINTMENT' && profile.role !== 'ADMIN' && (
                      <div className="alert alert-warning py-2 px-3" role="alert">
                        This event type can only be deleted by admin.
                      </div>
                    )}

                    <div className="mt-auto d-flex justify-content-center">
                      <Button
                        variant="danger"
                        className="px-4"
                        onClick={handleDeleteSelectedEvent}
                        disabled={
                          eventDeleting ||
                          (String(selectedCalendarEvent?.eventType || '').toUpperCase() === 'SERVICE_APPOINTMENT' && profile.role !== 'ADMIN')
                        }
                      >
                        {eventDeleting ? 'Deleting...' : 'Delete Event'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Third Row - Personal Info + Vehicle */}
        <Row className="g-3 mb-4">
          <Col lg={8} md={12}>
            {/* Personal Information */}
            <Card className="info-card h-100">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0">Personal Information</h3>
                  <Button variant="outline-primary" size="sm">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="driver-profile">
                  <div className="profile-avatar">
                    {!profileImageError && profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt={getDisplayName()}
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="profile-info">
                <h4 className="mb-1">{getDisplayName()}</h4>
                <span className="d-block text-muted">{profile.role}</span>
              </div>
            </div>
            <div className="info-grid">
              <div className={`info-item ${copiedField === 'email' ? 'bg-success-subtle border-success' : ''}`} onClick={() => handleCopyToClipboard(profile.email, 'Email', 'email')} style={{ cursor: 'pointer' }}>
                <div className="info-icon">
                  <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="info-content d-flex flex-column justify-content-center w-100 text-center">
                  <span className="info-label">EMAIL</span>
                  <span className="info-value">{profile.email}</span>
                </div>
              </div>
              <div className={`info-item ${copiedField === 'phone' ? 'bg-success-subtle border-success' : ''}`} onClick={() => handleCopyToClipboard(profile.phone, 'Phone', 'phone')} style={{ cursor: 'pointer' }}>
                <div className="info-icon">
                  <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="info-content d-flex flex-column justify-content-center w-100 text-center">
                  <span className="info-label">PHONE</span>
                  <span className="info-value">{profile.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="info-grid">
              <div className={`info-item ${copiedField === 'licenseNumber' ? 'bg-success-subtle border-success' : ''}`} onClick={() => handleCopyToClipboard(profile.licenseNumber, 'License Number', 'licenseNumber')} style={{ cursor: 'pointer' }}>
                <div className="info-icon">
                  <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8" cy="14" r="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11h4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 15h4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="info-content d-flex flex-column justify-content-center w-100 text-center">
                  <span className="info-label">LICENSE NUMBER</span>
                  <span className="info-value">{profile.licenseNumber || 'N/A'}</span>
                </div>
              </div>
              <div className={`info-item ${copiedField === 'licenseExpiry' ? 'bg-success-subtle border-success' : ''}`} onClick={() => handleCopyToClipboard(formatLicenseExpiry(), 'License Expiry', 'licenseExpiry')} style={{ cursor: 'pointer' }}>
                <div className="info-icon">
                  <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="info-content d-flex flex-column justify-content-center w-100 text-center">
                  <span className="info-label">LICENSE EXPIRES</span>
                  <span className="info-value">{formatLicenseExpiry()}</span>
                </div>
              </div>
            </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={12}>
            {/* Assigned Vehicle */}
            <Card className="vehicle-card h-100">
              <Card.Header className="bg-light">
                <h3 className="mb-0">Assigned Vehicle</h3>
              </Card.Header>
              <Card.Body>
                {vehicleLoading ? (
                  <div className="text-center text-muted py-4">Loading...</div>
                ) : !vehicle ? (
                  <div className="text-center text-muted py-4">No vehicle assigned</div>
                ) : (
                  <div className="vehicle-info">
                    <div className="vehicle-header mb-3">
                      <div>
                        <h4 className="mb-1">{vehicle.brandModel}</h4>
                        <span className="vehicle-type text-muted small">{vehicle.year}</span>
                      </div>
                      <Badge bg="secondary">{vehicle.licensePlate}</Badge>
                    </div>

                    <div className="d-flex justify-content-center mb-3">
                      <Badge
                        bg={vehicle.status?.toLowerCase() === 'active' ? 'success' : 'secondary'}
                        className="d-flex align-items-center px-3 py-2"
                        style={{ fontSize: '0.85rem' }}
                      >
                        <span className="me-1">●</span> {vehicle.status}
                      </Badge>
                    </div>

                    <Row className="g-2">
                      <Col xs={12}>
                        <div className="info-item">
                          <div className="info-icon">
                            <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="info-content d-flex flex-column justify-content-center w-100 text-center">
                            <span className="info-label">MILEAGE</span>
                            <span className="info-value">{vehicle.currentMileageKm.toLocaleString()} km</span>
                          </div>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div
                          className="info-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleCopyToClipboard(vehicle.vin, 'VIN', 'vin')}
                        >
                          <div className="info-icon">
                            <svg width="20" height="20" fill="none" stroke="#0d6efd" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 3h-2a2 2 0 0 0-2 2v2h6V5a2 2 0 0 0-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="info-content d-flex flex-column justify-content-center w-100 text-center">
                            <span className="info-label">VIN</span>
                            <span className="info-value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{vehicle.vin || 'N/A'}</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </main>
    </div>
  );
};


export default DriverDashboard;
