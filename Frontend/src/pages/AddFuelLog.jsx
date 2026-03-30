
import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/FuelLogs.css';
import Footer from '../components/Footer';

const AddFuelLog = () => {
    const [vehicleCurrentMileageKm, setVehicleCurrentMileageKm] = useState(null);
    useEffect(() => {
      const fetchVehicleMileage = async () => {
        try {
          const vehicleResponse = await api.get('/profile/assigned-vehicle');
          const v = vehicleResponse.data;
          setVehicleCurrentMileageKm(v.currentMileageKm || v.CurrentMileageKm || 0);
        } catch (error) {
          setVehicleCurrentMileageKm(null);
        }
      };
      fetchVehicleMileage();
    }, []);
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [station, setStation] = useState('');
  const [location, setLocation] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoName, setReceiptPhotoName] = useState('');
  const [odometer, setOdometer] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
    useEffect(() => {
      // Set default date and time to now
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const defaultDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
      const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setDate(defaultDate);
      setTime(defaultTime);
    }, []);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    console.log('receiptPhoto:', receiptPhoto);

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
    const logDate = new Date(date + 'T' + (time || '00:00'));
    if (logDate > now) {
      setError('Date cannot be in the future');
      return;
    }
    if (logDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      setError('Date cannot be older than 7 days');
      return;
    }
    // Odometer check
    if (
      odometer && vehicleCurrentMileageKm !== null &&
      Number(odometer) < Number(vehicleCurrentMileageKm)
    ) {
      setError('OdometerKm must be greater than or equal to the current mileage of the vehicle (' + vehicleCurrentMileageKm + ' km)');
      return;
    }
    // Receipt file required check
    if (!receiptPhoto) {
      setError('Receipt file is required');
      return;
    }

    try {
      // Combine date and time for submission
      let dateTime = date;
      if (date && time) {
        dateTime = date + 'T' + time;
      }

      // FuelLog POST (file-t közvetlenül küldjük)
      const formData = new FormData();
      formData.append('Liters', Number(liters));
      formData.append('TotalCost', Number(cost));
      formData.append('StationName', station);
      formData.append('OdometerKm', Number(odometer));
      formData.append('LocationText', location);
      formData.append('Date', new Date(dateTime).toISOString());
      if (receiptPhoto) {
        formData.append('File', receiptPhoto);
      }
      await api.post('/fuellogs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      console.log('FuelLog POST error:', err);
      if (err.response) console.log('Axios error full response:', err.response);
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
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="shadow-lg border-0 rounded-4 add-fuel-log-orange-outline">
                <Card.Header className="bg-white rounded-top-4 d-flex align-items-center gap-2 border-bottom" style={{minHeight: 60}}>
                  <svg width="32" height="32" fill="none" stroke="#fb923c" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 22V8l4-4h6l4 4v14H3z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 13h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="fs-5 fw-semibold text-orange">Add New Fuel Log</span>
                </Card.Header>
                <Card.Body className="p-4">
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">Saved successfully!</Alert>}
                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3 align-items-end">
                      {/* Date & Time row */}
                      <Col xs={12} md={12} lg={6}>
                        <Form.Group className="mb-0">
                          <Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2 mb-1">
                            <span style={{display:'flex',alignItems:'center'}}>
                              <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            Date
                          </Form.Label>
                          <Form.Control type="date" value={date} onChange={e => setDate(e.target.value)} required style={{minHeight: '38px'}} />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={12} lg={6}>
                        <Form.Group className="mb-0">
                          <Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2 mb-1">
                            <span style={{display:'flex',alignItems:'center'}}>
                              <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            Time
                          </Form.Label>
                          <Form.Control type="time" value={time} onChange={e => setTime(e.target.value)} required style={{minHeight: '38px'}} />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={12} lg={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold d-flex align-items-center gap-2 text-start w-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fb923c"><path d="M12 2C12 2 5 11 5 16a7 7 0 0 0 14 0c0-5-7-14-7-14z"/><path d="M12 21a5 5 0 0 1-5-5c0-3.07 4.13-9.14 5-10.32C14.87 6.86 19 12.93 19 16a5 5 0 0 1-5 5z" fill="#fb923c"/></svg>
                            Liters
                          </Form.Label>
                          <Form.Control type="number" value={liters} onChange={e => setLiters(e.target.value)} required min="0" step="1" placeholder="0" />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={12} lg={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold d-flex align-items-center gap-2 text-start w-100">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><line x1="12" y1="1" x2="12" y2="23"/></svg>
                            Total Cost
                          </Form.Label>
                          <Form.Control type="number" value={cost} onChange={e => setCost(e.target.value)} required min="0" step="1" placeholder="0" />
                        </Form.Group>
                      </Col>
                      {/* Station Name, Location, Receipt Photo each in their own row */}
                                            <Col xs={12} md={12} lg={12}>
                                              <Form.Group>
                                                <Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
                                                  <span style={{display:'flex',alignItems:'center'}}>
                                                    <svg width="18" height="18" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                                                      <path d="M3 20L8 4" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <path d="M21 20L16 4" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <line x1="10" y1="16" x2="14" y2="16" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <line x1="10.5" y1="12" x2="13.5" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                                                      <line x1="11" y1="8" x2="13" y2="8" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                  </span>
                                                  Odometer (km)
                                                </Form.Label>
                                                <Form.Control type="number" value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="0" min="0" step="1" required />
                                              </Form.Group>
                                            </Col>
                      <Col xs={12} md={12} lg={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
                            <span style={{display:'flex',alignItems:'center'}}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6}}>
                                <rect x="3" y="11" width="18" height="5" rx="2"/>
                                <circle cx="7.5" cy="17" r="1.5" fill="#6b7280"/>
                                <circle cx="16.5" cy="17" r="1.5" fill="#6b7280"/>
                                <path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/>
                              </svg>
                            </span>
                            Station Name <span className="text-muted">(optional)</span>
                          </Form.Label>
                          <Form.Control type="text" value={station} onChange={e => setStation(e.target.value)} placeholder="e.g. OMV Budapest" />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={12} lg={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
                            <span style={{display:'flex',alignItems:'center'}}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight:2}}>
                                <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.25 10.25 8.25 10.92a1 1 0 0 0 1.5 0C13.75 21.25 21 16.25 21 11c0-4.97-4.03-9-9-9zm0 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="#6b7280"/>
                                <circle cx="12" cy="11" r="2" fill="#a3a3a3"/>
                              </svg>
                            </span>
                            Location <span className="text-muted">(optional)</span>
                          </Form.Label>
                          <Form.Control type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. M1 highway" />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={12} lg={6}>
                        <Form.Group className="add-fuel-log-file-input">
                          <Form.Label className="fw-semibold text-start w-100">Receipt Photo</Form.Label>
                          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                            <input
                              type="file"
                              accept="image/*"
                              id="receiptPhotoInput"
                              style={{display:'none'}}
                              required
                              onChange={e => {
                                setReceiptPhoto(e.target.files[0]);
                                setReceiptPhotoName(e.target.files[0]?.name || '');
                              }}
                            />
                            <Button
                              variant="warning"
                              onClick={() => document.getElementById('receiptPhotoInput').click()}
                              style={{minWidth:'120px',backgroundColor:'#fb923c',borderColor:'#fb923c',color:'#fff'}}
                            >
                              Choose File
                            </Button>
                            <span style={{fontSize:'0.95em',color:'#555'}}>{receiptPhotoName || 'No file selected'}</span>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-between mt-4">
                      <Button variant="outline-secondary" onClick={() => navigate(-1)} type="button">Back</Button>
                      <Button variant="light" className="fw-semibold btn-fuel-log-save" type="submit">Create Log</Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer/>
      </div>
    </div>
  );
}
export default AddFuelLog;
