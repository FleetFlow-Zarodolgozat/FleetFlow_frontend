import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button } from 'react-bootstrap';
import { authService } from '../services/authService';
import '../styles/DriverDashboard.css';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(14);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    description: ''
  });

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    console.log('Event saved:', eventForm);
    // TODO: API call to save event
  };

  // Mock data - replace with actual API data
  const driverData = {
    name: user?.name || 'Alex Morgan',
    role: 'Senior Driver',
    employeeId: 'FK-9912',
    licenseType: 'Class A CDL',
    licenseExpires: 'Dec 2026',
    email: 'alex.m@fleetflow.com',
    fuelEfficiency: 8.4,
    fuelChange: '+2.1%',
    weeklyHours: '38h 12m',
    hoursChange: '-5.0%',
    safetyScore: 98,
    safetyStatus: 'Excellent'
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

  const routeData = {
    origin: 'Berlin Logistics Hub, DE',
    destination: 'Port of Hamburg, Terminal 4',
    distance: '288 km',
    duration: '3h 15m'
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

  return (
    <div className="driver-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#0d6efd"/>
              <path d="M14 18L24 12L34 18V30L24 36L14 30V18Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 18L24 24L34 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 24V36" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
              {driverData.name.charAt(0)}
            </div>
            <div className="user-details">
              <span className="user-name">{driverData.name}</span>
              <span className="user-role">{driverData.role}</span>
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
        <header className="dashboard-header">
          <div className="header-title">
            <h1>Driver Dashboard</h1>
            <p>Welcome back, {driverData.name.split(' ')[0]}. Here is your daily summary.</p>
          </div>
          <div className="header-actions">
            <div className="date-display">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <Button className="new-trip-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              New Trip
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-row">
          <Card className="stat-card">
            <div className="stat-icon fuel">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Fuel Efficiency</span>
              <div className="stat-value-row">
                <span className="stat-value">{driverData.fuelEfficiency} km/L</span>
                <span className="stat-change positive">{driverData.fuelChange}</span>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon hours">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Weekly Driving Hours</span>
              <div className="stat-value-row">
                <span className="stat-value">{driverData.weeklyHours}</span>
                <span className="stat-change negative">{driverData.hoursChange}</span>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon safety">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22,4 12,14.01 9,11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Safety Score</span>
              <div className="stat-value-row">
                <span className="stat-value">{driverData.safetyScore}/100</span>
                <span className="stat-badge excellent">{driverData.safetyStatus}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="grid-left">
            {/* Personal Information */}
            <Card className="info-card">
              <div className="card-header-row">
                <h3>Personal Information</h3>
                <button className="edit-btn">Edit</button>
              </div>
              <div className="driver-profile">
                <div className="profile-avatar">
                  {driverData.name.charAt(0)}
                </div>
                <div className="profile-info">
                  <h4>{driverData.name}</h4>
                  <span>Employee ID: {driverData.employeeId}</span>
                </div>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">LICENSE TYPE</span>
                  <span className="info-value">{driverData.licenseType}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">EXPIRES</span>
                  <span className="info-value">{driverData.licenseExpires}</span>
                </div>
              </div>
              <div className="info-item full">
                <span className="info-label">CONTACT EMAIL</span>
                <span className="info-value">{driverData.email}</span>
              </div>
            </Card>

            {/* Assigned Vehicle */}
            <Card className="vehicle-card">
              <div className="card-header-row">
                <h3>Assigned Vehicle</h3>
                <span className="status-badge active">● Active</span>
              </div>
              <div className="vehicle-image">
                <img src="/truck-placeholder.jpg" alt={vehicleData.name} onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="vehicle-placeholder"><svg width="64" height="64" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="6" width="15" height="12" rx="2"/><path d="M16 10h4l3 3v5h-7V10z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
                }} />
              </div>
              <div className="vehicle-info">
                <div className="vehicle-header">
                  <div>
                    <h4>{vehicleData.name}</h4>
                    <span className="vehicle-type">{vehicleData.type} • {vehicleData.year} Model</span>
                  </div>
                  <span className="vehicle-id">{vehicleData.id}</span>
                </div>
                <div className="maintenance-info">
                  <span className="maintenance-label">Next Maintenance</span>
                  <span className="maintenance-value">{vehicleData.nextMaintenance} / {vehicleData.maintenanceKm}</span>
                  <div className="maintenance-bar">
                    <div className="maintenance-progress" style={{ width: `${vehicleData.maintenanceProgress}%` }}></div>
                  </div>
                </div>
                <button className="inspection-btn">Vehicle Inspection Report</button>
              </div>
            </Card>
          </div>

          {/* Middle Column */}
          <div className="grid-middle">
            {/* Schedule Calendar */}
            <Card className="schedule-card">
              <div className="card-header-row">
                <h3>Schedule - {formatMonth(currentDate)}</h3>
                <div className="calendar-nav">
                  <button className="nav-btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="15,18 9,12 15,6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="nav-btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="9,18 15,12 9,6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
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
            </Card>

            {/* Current Route Details */}
            <Card className="route-card">
              <h3>Current Route Details</h3>
              <div className="route-timeline">
                <div className="route-point origin">
                  <div className="point-marker"></div>
                  <div className="point-info">
                    <span className="point-label">ORIGIN</span>
                    <span className="point-value">{routeData.origin}</span>
                  </div>
                </div>
                <div className="route-line"></div>
                <div className="route-point destination">
                  <div className="point-marker"></div>
                  <div className="point-info">
                    <span className="point-label">DESTINATION</span>
                    <span className="point-value">{routeData.destination}</span>
                  </div>
                </div>
              </div>
              <div className="route-stats">
                <div className="route-stat">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {routeData.distance}
                </div>
                <div className="route-stat">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {routeData.duration}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="grid-right">
            {/* Quick Add Event */}
            <Card className="event-card">
              <h3>Quick Add Event</h3>
              <Form onSubmit={handleSaveEvent}>
                <Form.Group className="mb-3">
                  <Form.Label>EVENT TITLE</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="e.g. Service Checkup"
                    value={eventForm.title}
                    onChange={handleEventChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>DATE</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={eventForm.date}
                    onChange={handleEventChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>DESCRIPTION</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    placeholder="Additional notes..."
                    value={eventForm.description}
                    onChange={handleEventChange}
                  />
                </Form.Group>
                <Button type="submit" className="save-event-btn">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17,21 17,13 7,13 7,21" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,3 7,8 15,8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Save Event
                </Button>
              </Form>
            </Card>

            {/* Map Preview */}
            <Card className="map-card">
              <div className="map-placeholder">
                <img 
                  src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/10.0,53.55,8,0/400x200?access_token=placeholder" 
                  alt="Route Map"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="map-overlay">
                  <svg width="48" height="48" fill="none" stroke="#0d6efd" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>View Full Map</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
