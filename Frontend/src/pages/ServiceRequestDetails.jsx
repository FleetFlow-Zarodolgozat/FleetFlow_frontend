

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert, Form, Container, Spinner } from 'react-bootstrap';
import '../styles/DriverDashboard.css';
import '../styles/AddFuelLog.css';
import '../styles/ServiceRequestDetails.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import api from '../services/api';

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
  const [invoiceImgUrl, setInvoiceImgUrl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Kép letöltése authentikációval, ha van fileId
  useEffect(() => {
    const fileId = request.InvoiceFileId || request.invoiceFileId;
    if (!fileId) {
      setInvoiceImgUrl(null);
      return;
    }
    let objectUrl = null;
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://fleetflow-zarodolgozat-backend-ressdominik.jcloud.jedlik.cloud/api/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Image fetch failed');
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setInvoiceImgUrl(objectUrl);
      } catch (e) {
        setInvoiceImgUrl(null);
      }
    };
    fetchImage();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [request.InvoiceFileId, request.invoiceFileId]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) setFile(f);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this service request?')) return;
    setCancelling(true);
    setError('');
    try {
      await api.delete(`/service-requests/cancel/${request.id || request.Id}`);
      navigate(-1);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || apiMessage?.Message || 'Could not cancel service request.';
      setError(message);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusClass = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'REQUESTED': return 'requested';
      case 'APPROVED': return 'approved';
      case 'REJECTED': return 'rejected';
      case 'CLOSED': return 'closed';
      case 'DRIVER_COST': return 'driver-cost';
      default: return 'default';
    }
  };

  const getStatusIconStyle = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'REQUESTED': return { bg: '#dbeafe', stroke: '#1e40af' };
      case 'APPROVED':  return { bg: '#dcfce7', stroke: '#166534' };
      case 'REJECTED':  return { bg: '#fee2e2', stroke: '#991b1b' };
      case 'CLOSED':    return { bg: '#e5e7eb', stroke: '#374151' };
      case 'DRIVER_COST': return { bg: '#f3e8ff', stroke: '#6b21a8' };
      default:          return { bg: '#f1f5f9', stroke: '#475569' };
    }
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
    <div className="driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-content add-fuel-log-page srd-page">
        <Container fluid className="px-4 py-4">

          {/* Header */}
          <div className="add-fuel-header mb-4">
            <h1 className="add-fuel-title">Edit Service Details</h1>
            <p className="add-fuel-subtitle">Submit your cost report and invoice for the completed service</p>
          </div>

          <Row className={`g-4${request.status === 'REQUESTED' ? ' justify-content-center' : ''}`}>
            {/* Left Column - Form */}
            <Col lg={7} xl={8}>
              <Card className="fuel-form-card border-0 shadow-sm">
                <Card.Body className="p-4 p-md-5">
                  {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                  {success && <Alert variant="success" className="mb-3">{success}</Alert>}

                  {request.status === 'REQUESTED' && (
                    <Alert variant="info" className="mb-4">
                      <strong>Read Only:</strong> Service requests with "requested" status cannot be edited. Wait for admin approval before making changes.
                    </Alert>
                  )}

                  <Row className="g-4">
                    {/* Title - always shown */}
                    <Col xs={12}>
                      <div className="srd-info-row">
                        <div className="srd-info-label">Title</div>
                        <div className="srd-info-value">{request.title || '—'}</div>
                      </div>
                    </Col>

                    {/* Description - always shown */}
                    {(request.description) && (
                      <Col xs={12}>
                        <div className="srd-info-row">
                          <div className="srd-info-label">Description</div>
                          <div className="srd-info-value srd-info-value--muted">{request.description}</div>
                        </div>
                      </Col>
                    )}

                    {/* Service Date - always shown if available */}
                    {request.scheduledStart && (
                      <Col xs={12}>
                        <div className="srd-info-row">
                          <div className="srd-info-label">Service Date</div>
                          <div className="srd-info-value">{new Date(request.scheduledStart).toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </Col>
                    )}

                    {/* Status + License Plate info */}
                    <Col xs={12}>
                      <Row className="g-3">
                        <Col xs={6}>
                          <div className="srd-meta-card">
                            <div className="srd-meta-icon" style={{ background: getStatusIconStyle(request.status).bg }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={getStatusIconStyle(request.status).stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                            </div>
                            <div>
                              <div className="srd-meta-label">Status</div>
                              <span className={`srd-status-badge status-${getStatusClass(request.status)}`}>{request.status || '—'}</span>
                            </div>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="srd-meta-card">
                            <div className="srd-meta-icon srd-meta-icon-plate">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="10" rx="2" />
                                <path d="M6 11h.01M18 11h.01" />
                                <path d="M9 11h6" />
                              </svg>
                            </div>
                            <div>
                              <div className="srd-meta-label">License Plate</div>
                              <div className="srd-meta-value srd-meta-value-plate">{request.licensePlate || '—'}</div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Col>

                    {/* Location - shown when NOT requested and available */}
                    {request.status !== 'REQUESTED' && (request.serviceLocation || request.ServiceLocation) && (
                      <Col xs={12}>
                        <div className="srd-info-row">
                          <div className="srd-info-label">Location</div>
                          <div className="srd-info-value">{request.serviceLocation || request.ServiceLocation}</div>
                        </div>
                      </Col>
                    )}

                    {/* Driver Cost - Only show when NOT requested */}
                    {request.status !== 'REQUESTED' && (
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">
                            Driver Cost <span className="srd-required">*</span>
                          </Form.Label>
                          <div className="input-with-suffix">
                            <Form.Control
                              type="number"
                              value={driverCost}
                              onChange={e => setDriverCost(e.target.value)}
                              placeholder="0"
                              min="0"
                              step="1"
                              className="form-control-lg"
                              required
                            />
                            <span className="input-suffix">Ft</span>
                          </div>
                        </Form.Group>
                      </Col>
                    )}

                    {/* Close Note - Only show when NOT requested */}
                    {request.status !== 'REQUESTED' && (
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">
                            Close Note <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.85rem' }}>(optional)</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={closeNote}
                            onChange={e => setCloseNote(e.target.value)}
                            placeholder="Any notes about the service"
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    )}
                  </Row>

                  {/* Action Buttons */}
                  <div className="form-actions mt-5">
                    {request.status !== 'REQUESTED' && (
                      <Button
                        type="button"
                        className="btn-save srd-submit-btn"
                        disabled={saving}
                        onClick={handleSave}
                      >
                        {saving ? (
                          <><Spinner animation="border" size="sm" className="me-2" />Saving...</>
                        ) : (
                          <>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Save Details
                          </>
                        )}
                      </Button>
                    )}
                    {request.status === 'REQUESTED' && (
                      <Button
                        variant="danger"
                        type="button"
                        disabled={cancelling}
                        onClick={handleCancel}
                      >
                        {cancelling ? (
                          <><Spinner animation="border" size="sm" className="me-2" />Cancelling...</>
                        ) : (
                          <>Cancel Request</>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="light"
                      type="button"
                      className="btn-cancel"
                      onClick={() => navigate(-1)}
                      disabled={saving || cancelling}
                    >
                      Back
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column */}
            {request.status !== 'REQUESTED' && (
              <Col lg={5} xl={4}>
                {/* Invoice Upload Card */}
                <Card className="receipt-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="receipt-header mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <span className="receipt-title">Invoice Photo</span>
                  </div>

                  <div
                    className={`receipt-dropzone srd-dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('invoiceFileInput').click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      id="invoiceFileInput"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <div className="receipt-file-selected">
                        <div className="upload-icon" style={{ background: '#ede9fe' }}>
                          <svg width="24" height="24" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <span className="file-name">{file.name}</span>
                        <button
                          className="remove-file"
                          onClick={e => { e.stopPropagation(); setFile(null); }}
                          type="button"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon" style={{ background: '#ede9fe' }}>
                          <svg width="24" height="24" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                          </svg>
                        </div>
                        <div className="upload-text">
                          <strong>Click to upload</strong>
                          <span>or drag and drop</span>
                        </div>
                        <span className="upload-hint">JPG, PNG, WEBP</span>
                      </>
                    )}
                  </div>

                  {/* Existing invoice from DB */}
                  {invoiceImgUrl && (
                    <div className="srd-existing-invoice mt-4">
                      <div className="srd-existing-header">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="srd-existing-label">Current Invoice</span>
                      </div>
                      <div className="srd-invoice-preview">
                        <img src={invoiceImgUrl} alt="Invoice" className="srd-invoice-img" />
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Request Info Card */}
              <Card className="pro-tip-card border-0 shadow-sm srd-info-card">
                <Card.Body className="p-4">
                  <div className="pro-tip-header mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                      <path d="M9 18h6a2 2 0 0 1 2 2v2H7v-2a2 2 0 0 1 2-2z" />
                      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26C17.81 13.47 19 11.38 19 9a7 7 0 0 0-7-7z" />
                    </svg>
                    <span className="pro-tip-title">Pro Tip</span>
                  </div>
                  <p className="pro-tip-text">
                    Uploading a clear photo of your receipt helps automate data verification and ensures your expense claims are approved faster by fleet managers.
                  </p>
                  <ul className="pro-tip-list">
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Ensure date is visible
                    </li>
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Liters & price must be sharp
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            )}
          </Row>
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default ServiceRequestDetails;
