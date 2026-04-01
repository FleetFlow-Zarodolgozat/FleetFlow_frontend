
import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RouteMap from '../components/RouteMap';
import '../styles/DriverDashboard.css';
import '../styles/AddNewTrip.css';
import Footer from '../components/Footer';

const AddNewTrip = () => {
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [startOdometerKm, setStartOdometerKm] = useState('');
  const [endOdometerKm, setEndOdometerKm] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({ totalDistance: 0, tripsLogged: 0 });
  const [previousOdometer, setPreviousOdometer] = useState(0);
  const [activeLocationField, setActiveLocationField] = useState('start');
  const navigate = useNavigate();

  const smartTruncateAddress = (address) => {
    if (address.length <= 50) return address;
    // Nominatim returns "Street, District, City, County, Country"
    // Remove parts from the end (least specific) until it fits
    const parts = address.split(', ');
    for (let i = parts.length - 1; i >= 1; i--) {
      const candidate = parts.slice(0, i).join(', ');
      if (candidate.length <= 50) return candidate;
    }
    return address.slice(0, 50);
  };

  const handleMapLocationSelect = (address) => {
    const smart = smartTruncateAddress(address);
    if (activeLocationField === 'start') {
      setStartLocation(smart);
    } else {
      setEndLocation(smart);
    }
  };

  useEffect(() => {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const defaultDateTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setStartDateTime(defaultDateTime);
    setEndDateTime(defaultDateTime);

    // Fetch vehicle data for previous odometer and weekly stats
    const fetchTripData = async () => {
      try {
        // Get vehicle current mileage
        try {
          const vehicleRes = await api.get('/profile/assigned-vehicle');
          const vehicleData = vehicleRes.data || {};
          const currentMileage = vehicleData.currentMileageKm || vehicleData.CurrentMileageKm || 0;
          setPreviousOdometer(Number(currentMileage));
          console.log('Current Mileage:', currentMileage);
        } catch (err) {
          console.log('Could not fetch vehicle data:', err);
          setPreviousOdometer(0);
        }

        // Get weekly stats from trips
        try {
          const tripsRes = await api.get('/trips/mine', { params: { page: 1, pageSize: 100 } });
          const payload = tripsRes.data || {};
          const trips = Array.isArray(payload.data) ? payload.data : [];

          console.log('Trips data:', trips);

          // Weekly stats: filter last 7 days
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weekTrips = trips.filter(t => {
            const tripDate = new Date(t.StartTime || t.startTime);
            return tripDate >= weekAgo;
          });
          const totalDist = weekTrips.reduce((sum, t) => sum + (Number(t.DistanceKm) || Number(t.distanceKm) || 0), 0);
          setWeeklyStats({ totalDistance: totalDist, tripsLogged: weekTrips.length });
        } catch (err) {
          console.log('Could not fetch trips:', err);
          setWeeklyStats({ totalDistance: 0, tripsLogged: 0 });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setPreviousOdometer(0);
        setWeeklyStats({ totalDistance: 0, tripsLogged: 0 });
      }
    };;
    fetchTripData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const payload = {
        StartTime: new Date(startDateTime).toISOString(),
        EndTime: new Date(endDateTime).toISOString(),
        StartLocation: startLocation,
        EndLocation: endLocation,
        DistanceKm: Number(distanceKm),
        StartOdometerKm: Number(startOdometerKm),
        EndOdometerKm: Number(endOdometerKm),
        Notes: notes
      };
      await api.post('trips', payload);
      setSuccess(true);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      let msg = 'An error occurred while saving!';
      if (err.response) {
        if (err.response.status === 403) {
          msg = 'You are not authorized to perform this action.';
        } else if (err.response.data) {
          const data = err.response.data;
          if (typeof data === 'string') msg = data;
          else if (data.message) msg = data.message;
          else if (data.detail) msg = data.detail;
          else if (data.errors) msg = Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
          else if (err.response.statusText) msg = err.response.statusText;
          else msg = JSON.stringify(data);
        }
      }
      setError(msg);
    }
  };

  return (
    <div className="driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-content">
        <div className="add-new-trip-page">
          {/* Breadcrumb + Header */}
          <div className="trip-header-section">
            <h1 className="trip-page-title">Log New Trip</h1>
            <p className="trip-page-subtitle">Please record your latest journey details accurately for fleet reporting.</p>
          </div>

          {/* Main layout */}
          <div className="trip-main-layout">
            {/* Left: Trip Details Form */}
            <div className="trip-details-card">
              <div className="trip-details-header">
                <svg width="24" height="24" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Trip Details</span>
              </div>

              <div className="trip-details-body">
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">Saved successfully!</Alert>}

                <Form onSubmit={handleSubmit}>
                  {/* Locations Row */}
                  <Row className="g-3 mb-4">
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label required">Departure Location</Form.Label>
                        <Form.Control
                          type="text"
                          value={startLocation}
                          onChange={e => setStartLocation(e.target.value)}
                          onFocus={() => setActiveLocationField('start')}
                          placeholder="e.g. Central Logistics Hub"
                          className={`trip-location-input${activeLocationField === 'start' ? ' active-location-field' : ''}`}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label required">Arrival Location</Form.Label>
                        <Form.Control
                          type="text"
                          value={endLocation}
                          onChange={e => setEndLocation(e.target.value)}
                          onFocus={() => setActiveLocationField('end')}
                          placeholder="e.g. North Terminal"
                          className={`trip-location-input${activeLocationField === 'end' ? ' active-location-field' : ''}`}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Duration & Distance Row */}
                  <Row className="g-3 mb-4">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="trip-form-label">START</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={startDateTime}
                          onChange={e => setStartDateTime(e.target.value)}
                          className="trip-date-input"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="trip-form-label">END</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={endDateTime}
                          onChange={e => setEndDateTime(e.target.value)}
                          className="trip-date-input"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label">Distance (km)</Form.Label>
                        <Form.Control
                          type="number"
                          value={distanceKm}
                          onChange={e => setDistanceKm(e.target.value)}
                          placeholder="Total distance"
                          className="trip-odo-input"
                          min="0"
                          step="0.1"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label">Start Odo.</Form.Label>
                        <Form.Control
                          type="number"
                          value={startOdometerKm}
                          onChange={e => setStartOdometerKm(e.target.value)}
                          placeholder="Start Odometer"
                          className="trip-odo-input"
                          min="0"
                        />
                        <div className="previous-odometer" style={{fontSize: '0.95em', color: '#6b7280', marginTop: '2px'}}>
                          Previous: {Number(previousOdometer).toLocaleString()} km
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label">End Odo.</Form.Label>
                        <Form.Control
                          type="number"
                          value={endOdometerKm}
                          onChange={e => setEndOdometerKm(e.target.value)}
                          placeholder="End Odometer"
                          className="trip-odo-input"
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Notes */}
                  <Form.Group className="mb-4">
                    <Form.Label className="trip-form-label">Trip Notes (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add any incidents or specific details about the route..."
                      className="trip-notes-textarea"
                    />
                  </Form.Group>

                  {/* Hidden fields for odometer - will be implemented later if needed */}
                  <input type="hidden" name="startOdometerKm" value={startOdometerKm} />
                  <input type="hidden" name="endOdometerKm" value={endOdometerKm} />

                  {/* Submit Buttons */}
                  <div className="trip-actions">
                    <Button className="btn-submit-trip" type="submit">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="17,21 17,13 7,13 7,21" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="7,3 7,8 15,8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Submit Trip Log
                    </Button>
                    <Button className="btn-cancel-trip" type="button" onClick={() => navigate(-1)}>Cancel</Button>
                  </div>
                </Form>
              </div>
            </div>

            {/* Right: Route Preview & Weekly Stats */}
            <div className="trip-sidebar">
              {/* Route Preview */}
              <Card className="route-preview-card">
                <Card.Header className="route-preview-header">
                  <div className="route-preview-title">
                    <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="8" y1="2" x2="8" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="16" y1="6" x2="16" y2="22" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Route Preview</span>
                  </div>
                  <span className="live-sync-badge">LIVE SYNC</span>
                </Card.Header>
                <Card.Body className="route-preview-body">
                  <div className="map-placeholder">
                    <RouteMap
                      startLocation={startLocation}
                      endLocation={endLocation}
                      activeField={activeLocationField}
                      onLocationSelect={handleMapLocationSelect}
                      onDistanceCalculated={(km) => setDistanceKm(km)}
                    />
                  </div>
                  <div className="route-info">
                    <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>Distance calculation is based on the most fuel-efficient route. If you took a detour, please adjust the distance manually.</p>
                  </div>
                </Card.Body>
              </Card>

              {/* Weekly Performance */}
              <Card className="weekly-performance-card">
                <div className="weekly-performance-header">
                  <span className="weekly-performance-title">Weekly Performance</span>
                  <svg width="20" height="20" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="16 7 20 7 20 11" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="weekly-stats">
                  <div className="stat-item">
                    <span className="stat-label">TOTAL DISTANCE</span>
                    <span className="stat-value">{weeklyStats.totalDistance.toLocaleString()} <small>km</small></span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">TRIPS LOGGED</span>
                    <span className="stat-value">{weeklyStats.tripsLogged}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        <Footer/>
      </div>
    </div>
  );
};

export default AddNewTrip;
