
import React, { useState } from 'react';
import { Card, Row, Col, Button, Alert, Form } from 'react-bootstrap';
import '../styles/ServiceRequestDetails.css';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const ServiceRequestDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const request = location.state?.request || {};
  const [driverCost, setDriverCost] = useState(request.driverReportCost || '');
  const [closeNote, setCloseNote] = useState(request.driverCloseNote || '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    // Custom file required validation for first upload
    if (!request.driverReportCost && !file) {
      setError('A file is required');
      setSaving(false);
      return;
    }
    const formData = new FormData();
    if (driverCost !== '') formData.append('DriverReportCost', driverCost);
    if (closeNote !== '') formData.append('DriverCloseNote', closeNote);
    if (file) formData.append('File', file);
    try {
      let endpoint = '';
      if (!request.driverReportCost) {
        endpoint = `/service-requests/upload-details/${request.id || request.Id}`;
      } else {
        endpoint = `/service-requests/edit-uploaded-data/${request.id || request.Id}`;
      }
      await import('../services/api').then(({ default: api }) =>
        api.patch(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      setSuccess('Service details saved successfully!');
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'Failed to save service details.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="service-request-details-dashboard">
      <div className="main-content">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4 service-request-details-orange-outline">
              <Card.Header className="bg-white rounded-top-4 d-flex align-items-center gap-3 border-bottom" style={{minHeight: 60}}>
                <svg width="32" height="32" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="d-flex flex-column align-items-start">
                  <span className="fs-5 fw-semibold text-purple">Edit Service Details</span>
                  <span className="service-request-details-value">{request.title}</span>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3 align-items-end">
                  <Col xs={12} md={12} lg={12}>
                    <div className="service-request-details-row" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'2rem',background:'rgba(124,58,237,0.12)',border:'1.5px solid #7c3aed',borderRadius:'12px',padding:'0.75rem 0.9rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                      <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle'}}>
                          <circle cx="12" cy="12" r="10" stroke="#7c3aed" strokeWidth="2" fill="#f3f4f6" />
                          <path d="M9 12l2 2l4-4" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="service-request-details-label" style={{color:'#1f2937'}}>Status</span>
                        <span className="service-request-details-value" style={{color:'#7c3aed',fontWeight:600}}>{request.status}</span>
                      </span>
                      <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 2, display: 'block' }}>
                          <rect x="4" y="10" width="16" height="6" rx="2" fill="#2563eb" />
                          <rect x="7" y="6" width="10" height="5" rx="2" fill="#3b82f6" />
                          <rect x="9" y="8" width="6" height="2" rx="1" fill="#fff" />
                          <circle cx="7" cy="18" r="1.5" fill="#2563eb" />
                          <circle cx="17" cy="18" r="1.5" fill="#2563eb" />
                          <rect x="6" y="16" width="2" height="2" rx="1" fill="#3b82f6" />
                          <rect x="16" y="16" width="2" height="2" rx="1" fill="#3b82f6" />
                          <rect x="10.5" y="13" width="3" height="1.5" rx="0.75" fill="#fff" />
                        </svg>
                        <span className="service-request-details-label" style={{color:'#1f2937'}}>License Plate</span>
                        <span className="service-request-details-value" style={{color:'#2563eb',fontWeight:600}}>{request.licensePlate}</span>
                      </span>
                    </div>
                  </Col>
                  <Col xs={12} md={12} lg={12}>
                      <Form.Group>
                         <Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
                             <span style={{display:'flex',alignItems:'center'}}>
                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /><line x1="12" y1="1" x2="12" y2="23" /></svg>
                              </span>
                              Driver cost <span className="text-muted">(Ft)</span>
                          </Form.Label>
                          <Form.Control type="number" value={driverCost} onChange={e => setDriverCost(e.target.value)} placeholder="0" min="0" step="1" required />
                       </Form.Group>
                  </Col>
                  <Col xs={12} md={12} lg={12}>
                                          <Form.Group>
                                            <Form.Label className="fw-semibold text-start w-100 d-flex align-items-center gap-2">
                                              <span style={{display:'flex',alignItems:'center'}}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{marginRight:6}}>
                                                  <rect x="4" y="3" width="16" height="18" rx="2" fill="#fb923c"/>
                                                  <path d="M8 7h8M8 11h8M8 15h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                              </span>
                                              Close Note <span className="text-muted">(optional)</span>
                                            </Form.Label>
                                              <Form.Control type="text" value={closeNote} onChange={e => setCloseNote(e.target.value)} placeholder="Any notes about the service" />
                                          </Form.Group>
                                        </Col>
                  <Col xs={12} md={12} lg={6}>
                                          <Form.Group className="add-fuel-log-file-input">
                                            <Form.Label className="fw-semibold text-start w-100">Invoice Photo</Form.Label>
                                            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                id="receiptPhotoInput"
                                                style={{display:'none'}}
                                                onChange={handleFileChange}
                                              />
                                              <Button
                                                variant="primary"
                                                onClick={() => document.getElementById('receiptPhotoInput').click()}
                                                style={{minWidth:'120px',backgroundColor:'#7c3aed',borderColor:'#7c3aed',color:'#fff'}}
                                              >
                                                Choose File
                                              </Button>
                                              <span style={{fontSize:'0.95em',color:'#555'}}>{ file ? file.name : 'No file selected'}</span>
                                            </div>
                                            {/* No file error here, all errors below Save button */}
                                          </Form.Group>
                 </Col>
                </Row>
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <Button variant="outline-secondary" onClick={() => navigate(-1)} type="button">Back</Button>
                  <Button
                    className="details-btn-custom"
                    style={{background:'#fff',color:'#7c3aed',borderColor:'#7c3aed',fontWeight:'600',minWidth:'120px',borderRadius:'8px',border:'1.5px solid #7c3aed'}}
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                {error && (
                  <div className="alert alert-danger mt-3" style={{padding:'6px 12px',fontSize:'0.95em',textAlign:'center',maxWidth:'100%'}}>{error}</div>
                )}
                {success && <Alert variant="success" className="mt-3">{success}</Alert>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ServiceRequestDetails;
