
import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Container, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';   
import Sidebar from '../components/Sidebar';
import RouteMap from '../components/RouteMap';
import CustomModal from '../components/CustomModal';
import '../styles/DriverDashboard.css';
import '../styles/AddNewTrip.css';
import Footer from '../components/Footer';

const AddNewTrip = () => {
  const { t, language } = useLanguage();
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const navigate = useNavigate();

  const smartTruncateAddress = (address) => {
    // Cím csonkítása az 50 karakteres limit megtartásához
    if (address.length <= 50) return address;
    // Nominatim formátum: "Street, District, City, County, Country"
    const parts = address.split(', ');
    for (let i = parts.length - 1; i >= 1; i--) {
      const candidate = parts.slice(0, i).join(', ');
      if (candidate.length <= 50) return candidate;
    }
    return address.slice(0, 50);
  };

  const handleMapLocationSelect = (address) => {
    // Térkép helyet választ
    const smart = smartTruncateAddress(address);
    if (activeLocationField === 'start') {
      setStartLocation(smart);
    } else {
      setEndLocation(smart);
    }
  };

  useEffect(() => {
    // Alapértelmezett kezdési és végzési idő beállítása
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const defaultDateTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setStartDateTime(defaultDateTime);
    setEndDateTime(defaultDateTime);
  }, []);

  useEffect(() => {
    if (error) {
      setModalContent({ title: t('common.errorTitle'), message: error });
      setModalOpen(true);
    }
  }, [error, t]);

  useEffect(() => {
    if (success) {
      setModalContent({ title: t('common.successTitle'), message: t('addTrip.savedSuccess') });
      setModalOpen(true);
    }
  }, [success, t]);

  useEffect(() => {
    // Út adatok lekérése: heti statisztikák és előző kilométeróra
    const fetchTripData = async () => {
      try {
        try {
          const vehicleRes = await api.get('/profile/assigned-vehicle');
          const vehicleData = vehicleRes.data || {};
          const currentMileage = vehicleData.currentMileageKm || vehicleData.CurrentMileageKm || 0;
          setPreviousOdometer(Number(currentMileage));
        } catch {
          setPreviousOdometer(0);
        }
        try {
          // Legutóbbi utak lekérése heti statisztikához
          const tripsRes = await api.get('/trips/mine', { params: { page: 1, pageSize: 100 } });
          const payload = tripsRes.data || {};
          const trips = Array.isArray(payload.data) ? payload.data : [];

          // Heti statisztikák: utolsó 7 nap szűrése
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weekTrips = trips.filter(t => {
            const tripDate = new Date(t.StartTime || t.startTime);
            return tripDate >= weekAgo;
          });
          const totalDist = weekTrips.reduce((sum, t) => sum + (Number(t.DistanceKm) || Number(t.distanceKm) || 0), 0);
          setWeeklyStats({ totalDistance: totalDist, tripsLogged: weekTrips.length });
        } catch {
          setWeeklyStats({ totalDistance: 0, tripsLogged: 0 });
        }
      } catch {
        setPreviousOdometer(0);
        setWeeklyStats({ totalDistance: 0, tripsLogged: 0 });
      }
    };
    fetchTripData();
  }, []);

  const handleSubmit = async (e) => {
    // Új út elküldése - új út létrehozása az API-n keresztül
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
            <h1 className="trip-page-title">{t('addTrip.title')}</h1>
            <p className="trip-page-subtitle">{t('addTrip.subtitle')}</p>
          </div>

          {/* Main layout */}
          <div className="trip-main-layout">
            {/* Left: Trip Details Form */}
            <div className="trip-details-card">

              <div className="trip-details-body">
                <CustomModal
                  isOpen={modalOpen}
                  onClose={() => {
                    setModalOpen(false);
                    setError('');
                    setSuccess(false);
                  }}
                  title={modalContent.title}
                  primaryAction={{
                    label: t('common.ok'),
                    onClick: () => {
                      setModalOpen(false);
                      setError('');
                      setSuccess(false);
                    },
                  }}
                >
                  <p className="mb-0">{modalContent.message}</p>
                </CustomModal>

                <Form onSubmit={handleSubmit}>
                  {/* Locations Row */}
                  <Row className="g-3 mb-4">
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label required">{t('addTrip.label.departure')}</Form.Label>
                        <Form.Control
                          type="text"
                          value={startLocation}
                          onChange={e => setStartLocation(e.target.value)}
                          onFocus={() => setActiveLocationField('start')}
                          placeholder={t('addTrip.placeholder.departure')}
                          className={`trip-location-input${activeLocationField === 'start' ? ' active-location-field' : ''}`}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label required">{t('addTrip.label.arrival')}</Form.Label>
                        <Form.Control
                          type="text"
                          value={endLocation}
                          onChange={e => setEndLocation(e.target.value)}
                          onFocus={() => setActiveLocationField('end')}
                          placeholder={t('addTrip.placeholder.arrival')}
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
                        <Form.Label className="trip-form-label">{t('addTrip.label.start')}</Form.Label>
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
                        <Form.Label className="trip-form-label">{t('addTrip.label.end')}</Form.Label>
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
                        <Form.Label className="trip-form-label">{t('addTrip.label.distance')}</Form.Label>
                        <Form.Control
                          type="number"
                          value={distanceKm}
                          onChange={e => setDistanceKm(e.target.value)}
                          placeholder={t('addTrip.placeholder.distance')}
                          className="trip-odo-input"
                          min="0"
                          step="1"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label">{t('addTrip.label.startOdo')}</Form.Label>
                        <Form.Control
                          type="number"
                          value={startOdometerKm}
                          onChange={e => setStartOdometerKm(e.target.value)}
                          placeholder={t('addTrip.placeholder.startOdo')}
                          className="trip-odo-input"
                          min="0"
                        />
                        <div className="ant-previous-odometer">
                          {t('addTrip.prevTripEnded', { km: Number(previousOdometer).toLocaleString() })}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={12}>
                      <Form.Group>
                        <Form.Label className="trip-form-label">{t('addTrip.label.endOdo')}</Form.Label>
                        <Form.Control
                          type="number"
                          value={endOdometerKm}
                          onChange={e => setEndOdometerKm(e.target.value)}
                          placeholder={t('addTrip.placeholder.endOdo')}
                          className="trip-odo-input"
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Notes */}
                  <Form.Group className="mb-4">
                    <Form.Label className="trip-form-label">{t('addTrip.label.notes')}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder={t('addTrip.placeholder.notes')}
                      className="trip-notes-textarea"
                    />
                    {language !== 'en' && (
                      <Form.Text style={{ color: '#b45309', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/>
                          <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
                        </svg>
                        {t('common.writeInEnglish')}
                      </Form.Text>
                    )}
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
                      {t('addTrip.btn.submit')}
                    </Button>
                    <Button className="btn-cancel-trip" type="button" onClick={() => navigate(-1)}>{t('addTrip.btn.cancel')}</Button>
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
                    <span>{t('addTrip.routePreview')}</span>
                  </div>
                  <span className="live-sync-badge">{t('addTrip.liveSync')}</span>
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
                    <p>{t('addTrip.distNote')}</p>
                  </div>
                </Card.Body>
              </Card>

              {/* Weekly Performance */}
              <Card className="weekly-performance-card">
                <div className="weekly-performance-header">
                  <span className="weekly-performance-title">{t('addTrip.weeklyPerf')}</span>
                  <svg width="20" height="20" fill="none" stroke="#93c5fd" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="16 7 20 7 20 11" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="weekly-stats">
                  <div className="stat-item">
                    <span className="stat-label">{t('addTrip.totalDistance')}</span>
                    <span className="stat-value">{weeklyStats.totalDistance.toLocaleString()} <small>km</small></span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('addTrip.tripsLogged')}</span>
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
