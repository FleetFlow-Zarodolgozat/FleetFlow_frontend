import React, { useState, useEffect } from 'react';
import { Button, Card, Container, Row, Col, Alert, Form, Badge } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/AddFuelLog.css';
import Footer from '../components/Footer';

const AddFuelLog = () => {
  const { t, language } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicleCurrentMileageKm, setVehicleCurrentMileageKm] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [station, setStation] = useState('');
  const [odometer, setOdometer] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoName, setReceiptPhotoName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        try {
          const vehicleResponse = await api.get('/profile/assigned-vehicle');
          const v = vehicleResponse.data;
          setVehicleCurrentMileageKm(v.currentMileageKm || v.CurrentMileageKm || 0);
          setVehicles([{ id: v.id || v.Id, name: v.vehicleName || v.VehicleName || 'Vehicle', licensePlate: v.licensePlate || v.LicensePlate || '' }]);
          setSelectedVehicle(v.id || v.Id);
          setOdometer(v.currentMileageKm || v.CurrentMileageKm || 0);
        } catch {
          // No assigned vehicle, fetch all vehicles
          try {
            const allVehiclesResponse = await api.get('/vehicles');
            const vehicleList = Array.isArray(allVehiclesResponse.data) ? allVehiclesResponse.data : [];
            setVehicles(vehicleList.map(v => ({ id: v.id || v.Id, name: v.vehicleName || v.VehicleName || 'Vehicle', licensePlate: v.licensePlate || v.LicensePlate || '' })));
            if (vehicleList.length > 0) {
              setSelectedVehicle(vehicleList[0].id || vehicleList[0].Id);
            }
          } catch {
            // no vehicles available
          }
        }
        try {
          const logsResponse = await api.get('/fuellogs/mine', { params: { page: 1, pageSize: 10 } });
          const allLogs = Array.isArray(logsResponse.data?.data) ? logsResponse.data.data : [];
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          const logs = allLogs
            .filter((l) => new Date(l.date || l.Date) >= cutoff)
            .slice(0, 2);
          setRecentLogs(logs);
        } catch {
          // could not fetch recent logs
        }
      } catch (err) {
        // error fetching data
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Set default date and time to now
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const defaultDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setDate(defaultDate);
    setTime(defaultTime);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Frontend validation
    if (!liters || Number(liters) <= 0) {
      setError('Liters must be greater than 0');
      return;
    }
    if (!cost || Number(cost) <= 0) {
      setError('Total cost must be greater than 0');
      return;
    }
    const now = new Date();
    // Combine date and time for validation
    const logDateTime = new Date(`${date}T${time}`);
    if (logDateTime > now) {
      setError('Date/time cannot be in the future');
      return;
    }
    if (logDateTime < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      setError('Date/time cannot be older than 7 days');
      return;
    }
    // Odometer check
    if (
      odometer && vehicleCurrentMileageKm !== null &&
      Number(odometer) < Number(vehicleCurrentMileageKm)
    ) {
      setError('Odometer must be greater than or equal to the current mileage of the vehicle (' + vehicleCurrentMileageKm + ' km)');
      return;
    }

    try {
      // FuelLog POST
      const formData = new FormData();
      formData.append('Liters', Number(liters));
      formData.append('TotalCost', Number(cost));
      formData.append('StationName', station);
      formData.append('OdometerKm', Number(odometer));
      // Combine date and time for submission
      formData.append('Date', new Date(`${date}T${time}`).toISOString());
      // formData.append('FuelType', fuelType);
      if (notes) formData.append('Notes', notes);
      if (receiptPhoto) {
        formData.append('File', receiptPhoto);
      }
      await api.post('/fuellogs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => navigate('/fuel-logs'), 1200);
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
          else msg = err.response.statusText;
        }
      }
      setError(msg);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setReceiptPhoto(file);
      setReceiptPhotoName(file.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const formatRecentLogDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const formatCost = (costStr) => {
    if (!costStr) return '0 Ft';
    return costStr;
  };

  return (
    <div className="driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-content add-fuel-log-page">
        <Container fluid className="px-4 py-4">

          {/* Header */}
          <div className="add-fuel-header mb-4">
            <h1 className="add-fuel-title">{t('addFuelLog.title')}</h1>
            <p className="add-fuel-subtitle">{t('addFuelLog.subtitle')}</p>
          </div>

          <Row className="g-4">
            {/* Left Column - Form */}
            <Col lg={7} xl={8}>
              <Card className="fuel-form-card border-0 shadow-sm">
                <Card.Body className="p-4 p-md-5">
                  {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                  {success && <Alert variant="success" className="mb-3">{t('addFuelLog.savedSuccess')}</Alert>}

                  <Form onSubmit={handleSubmit}>
                    <Row className="g-4">
                      {/* Date and Time */}
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">{t('addFuelLog.label.dateTime')}</Form.Label>
                          <div className="date-time-row">
                            <Form.Control
                              type="date"
                              value={date}
                              onChange={e => setDate(e.target.value)}
                              required
                              className="form-control-lg date-time-input"
                            />
                            <Form.Control
                              type="time"
                              value={time}
                              onChange={e => setTime(e.target.value)}
                              required
                              className="form-control-lg date-time-input"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      
                      {/* Quantity */}
                        <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">{t('addFuelLog.label.liters')}</Form.Label>
                          <div className="input-with-suffix">
                            <Form.Control
                              type="number"
                              value={liters}
                              onChange={e => setLiters(e.target.value)}
                              required
                              min="0"
                              step="1"
                              placeholder="0.00"
                              className="form-control-lg"
                            />
                            <span className="input-suffix">L</span>
                          </div>
                        </Form.Group>
                      </Col>

                      {/* Total Cost */}
                        <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">{t('addFuelLog.label.totalCost')}</Form.Label>
                          <div className="input-with-suffix">
                            <Form.Control
                              type="number"
                              value={cost}
                              onChange={e => setCost(e.target.value)}
                              required
                              min="0"
                              step="100"
                              placeholder="0.00"
                              className="form-control-lg"
                            />
                            <span className="input-suffix">Ft</span>
                          </div>
                          {liters && cost && (
                            <div className="price-per-liter">
                              Kb. {Math.round(Number(cost) / Number(liters))} Ft/liter
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      {/* Odometer */}
                        <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">{t('addFuelLog.label.odometer')}</Form.Label>
                          <div className="input-with-suffix">
                            <Form.Control
                              type="number"
                              value={odometer}
                              onChange={e => setOdometer(e.target.value)}
                              min="0"
                              step="1"
                              placeholder="0"
                              className="form-control-lg"
                              required
                            />
                            <span className="input-suffix">km</span>
                          </div>
                          {vehicleCurrentMileageKm !== null && (
                            <div className="previous-odometer">
                              {t('addFuelLog.prevTripEnded', { km: vehicleCurrentMileageKm.toLocaleString() })}
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      {/* Station Name */}
                        <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">{t('addFuelLog.label.station')}</Form.Label>
                          <Form.Control
                            type="text"
                            value={station}
                            onChange={e => setStation(e.target.value)}
                            placeholder="e.g. Shell, OMV, BP..."
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>

                      {/* Notes */}
                        <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">{t('addFuelLog.label.notes')}</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add details like pump number or issues encountered..."
                            className="form-control-lg"
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
                      </Col>
                    </Row>

                    {/* Action Buttons */}
                    <div className="form-actions mt-5">
                      <Button
                        variant="primary"
                        type="submit"
                        className="btn-save"
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {t('addFuelLog.btn.submit')}
                      </Button>
                      <Button
                        variant="light"
                        type="button"
                        className="btn-cancel"
                        onClick={() => navigate(-1)}
                      >
                        {t('addFuelLog.btn.cancel')}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column - Sidebar */}
            <Col lg={5} xl={4}>
              {/* Receipt Upload */}
              <Card className="receipt-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="receipt-header mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <span className="receipt-title">{t('addFuelLog.receipt.title')}</span>
                  </div>

                  <div
                    className={`receipt-dropzone ${isDragging ? 'dragging' : ''} ${receiptPhoto ? 'has-file' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('receiptFileInput').click()}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id="receiptFileInput"
                      style={{ display: 'none' }}
                      onChange={e => {
                        setReceiptPhoto(e.target.files[0]);
                        setReceiptPhotoName(e.target.files[0]?.name || '');
                      }}
                    />

                    {receiptPhoto ? (
                      <div className="receipt-file-selected">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          <line x1="12" y1="11" x2="12" y2="17" />
                          <line x1="9" y1="14" x2="15" y2="14" />
                        </svg>
                        <div className="file-name">{receiptPhotoName}</div>
                        <div className="file-size">{(receiptPhoto.size / 1024).toFixed(1)} KB</div>
                        <button type="button" className="remove-file" onClick={(e) => { e.stopPropagation(); setReceiptPhoto(null); setReceiptPhotoName(''); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <div className="upload-text">
                          <strong>{t('addFuelLog.receipt.click')}</strong>
                          <span>{t('addFuelLog.receipt.drag')}</span>
                        </div>
                        <div className="upload-hint">{t('addFuelLog.receipt.hint')}</div>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {/* Pro Tip */}
              <Card className="pro-tip-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="pro-tip-header mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                      <path d="M9 18h6a2 2 0 0 1 2 2v2H7v-2a2 2 0 0 1 2-2z" />
                      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26C17.81 13.47 19 11.38 19 9a7 7 0 0 0-7-7z" />
                    </svg>
                    <span className="pro-tip-title">{t('addFuelLog.proTip.title')}</span>
                  </div>
                  <p className="pro-tip-text">
                    {t('addFuelLog.proTip.text')}
                  </p>
                  <ul className="pro-tip-list">
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t('addFuelLog.proTip.1')}
                    </li>
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t('addFuelLog.proTip.2')}
                    </li>
                  </ul>
                </Card.Body>
              </Card>

              {/* Recent Logs */}
              {recentLogs.length > 0 && (
                <Card className="recent-logs-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="recent-logs-header mb-3">
                      <span className="recent-logs-title">{t('addFuelLog.recentLogs')}</span>
                    </div>
                    <div className="recent-logs-list">
                      {recentLogs.map(log => (
                        <div key={log.id || log.Id} className="recent-log-item">
                          <div>
                            <div className="recent-log-date">{formatRecentLogDate(log.date || log.Date)}</div>
                            <div className="recent-log-vehicle">{log.vehicleName || log.VehicleName || 'Vehicle'}</div>
                          </div>
                          <div className="recent-log-cost">{formatCost(log.totalCostCur || log.TotalCostCur)}</div>
                        </div>
                      ))}
                    </div>
                    <a href="/fuel-logs" className="view-all-link">{t('addFuelLog.viewAllLogs')}</a>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default AddFuelLog;
