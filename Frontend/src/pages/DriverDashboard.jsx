import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Container, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { authService } from '../services/authService';
import api from '../services/api';
import '../styles/DriverDashboard.css';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(14);
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
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    description: ''
  });
  const [copiedField, setCopiedField] = useState('');
  const copyFeedbackTimeoutRef = useRef(null);

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

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    console.log('Event saved:', eventForm);
    // TODO: API call to save event
  };

  const vehicleData = {
    name: 'Volvo FH16 Globetrotter',
    id: 'FL-9982-K',
    type: 'Heavy Duty Hauler',
    year: 2023,
    status: 'Active',
    nextMaintenance: '12 Days',
    maintenanceKm: '1,420 km',
    maintenanceProgress: 75,
    image: '/truck-placeholder.jpg'
  };

  const scheduleEvents = [
    { day: 4, type: 'trip', label: '#442' },
    { day: 7, type: 'rest', label: 'Rest Day' }
  ];

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay: firstDay === 0 ? 6 : firstDay - 1, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);

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
              <path d="M3 22V8l4-4h10l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 22V12h10v10" strokeLinecap="round" strokeLinejoin="round"/>
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
            <button className="action-btn" title="Notifications">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="action-btn" title="Settings">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="action-btn" title="Logout" onClick={handleLogout}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16,17 21,12 16,7" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
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
                    <Button className="new-trip-btn">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      New Trip
                    </Button>
                    <Button className="new-fuel-btn">
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
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" style={{ flexShrink: 0 }}>
                    <Form.Label className="small text-muted fw-semibold">DATE</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={eventForm.date}
                      onChange={handleEventChange}
                    />
                  </Form.Group>
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
                  <Button type="submit" variant="primary" className="w-100" style={{ flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17,21 17,13 7,13 7,21" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="7,3 7,8 15,8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Save Event
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} md={12}>
            {/* Schedule Calendar */}
            <Card className="schedule-card h-100">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0">Schedule - {formatMonth(currentDate)}</h3>
                  <div className="calendar-nav">
                    <button className="nav-btn btn btn-sm btn-outline-secondary me-2">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="15,18 9,12 15,6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="nav-btn btn btn-sm btn-outline-secondary">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="9,18 15,12 9,6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="calendar">
                  <div className="calendar-header">
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>
                  </div>
                  <div className="calendar-body">
                    {/* Previous month days */}
                    {[...Array(firstDay)].map((_, i) => (
                      <div key={`prev-${i}`} className="calendar-day other-month">
                        {new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate() - firstDay + i + 1}
                      </div>
                    ))}
                    {/* Current month days */}
                    {[...Array(daysInMonth)].map((_, i) => {
                      const day = i + 1;
                      const event = scheduleEvents.find(e => e.day === day);
                      const isToday = day === currentDate.getDate();
                      const isSelected = day === selectedDate;
                  return (
                    <div
                      key={day}
                      className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${event ? `has-event ${event.type}` : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      {event ? (
                        <span className="event-badge">{event.type === 'trip' ? `Trip ${event.label}` : event.label}</span>
                      ) : (
                        day
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0">Assigned Vehicle</h3>
                  <Badge bg="success" className="d-flex align-items-center">
                    <span className="me-1">●</span> Active
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="vehicle-info">
                  <div className="vehicle-header mb-3">
                    <div>
                      <h4 className="mb-1">{vehicleData.name}</h4>
                      <span className="vehicle-type text-muted small">{vehicleData.type} • {vehicleData.year} Model</span>
                    </div>
                    <Badge bg="secondary">{vehicleData.id}</Badge>
                  </div>
                  <div className="maintenance-info mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="maintenance-label text-muted small">Next Maintenance</span>
                      <span className="maintenance-value fw-semibold">{vehicleData.nextMaintenance} / {vehicleData.maintenanceKm}</span>
                    </div>
                    <ProgressBar now={vehicleData.maintenanceProgress} variant="primary" />
                  </div>
                  <Button variant="outline-primary" className="w-100">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12h6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 16h6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Vehicle Inspection Report
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
};


export default DriverDashboard;
