

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert, Form, Container, Spinner } from 'react-bootstrap';
import '../styles/DriverDashboard.css';
import '../styles/AddFuelLog.css';
import '../styles/ServiceRequestDetails.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import api from '../services/api';
import CustomModal from '../components/CustomModal';

const ServiceRequestDetails = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const request = location.state?.request || {};
  const [driverCost, setDriverCost] = useState(request.driverReportCost || '');
  const [closeNote, setCloseNote] = useState(request.driverCloseNote || '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invoiceImgUrl, setInvoiceImgUrl] = useState(null);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: '',
    confirmVariant: '',
    onConfirm: null,
  });
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    type: 'error',
    title: '',
    message: '',
  });

  const getApiErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.Message) return data.Message;
    if (data?.detail) return data.detail;
    if (data?.errors) return Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
    if (err?.response?.statusText) return err.response.statusText;
    return fallback;
  };

  const openConfirmModal = ({ title, message, confirmLabel, cancelLabel, confirmVariant, onConfirm }) => {
    setConfirmModal({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      confirmVariant,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, open: false }));
  };

  const handleConfirmAction = async () => {
    const action = confirmModal.onConfirm;
    closeConfirmModal();
    if (typeof action === 'function') {
      await action();
    }
  };

  const openFeedbackModal = ({ type = 'error', title, message }) => {
    setFeedbackModal({ open: true, type, title, message });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal((prev) => ({ ...prev, open: false }));
  };
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
    openConfirmModal({
      title: t('sr.modal.cancelTitle'),
      message: t('sr.modal.cancelMessage'),
      confirmLabel: t('sr.modal.cancelConfirm'),
      cancelLabel: t('sr.modal.keep'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        setCancelling(true);
        try {
          await api.delete(`/service-requests/cancel/${request.id || request.Id}`);
          navigate(-1);
        } catch (err) {
          openFeedbackModal({
            type: 'error',
            title: t('sr.modal.cancelFailedTitle'),
            message: getApiErrorMessage(err, t('sr.modal.cancelFailedMessage')),
          });
        } finally {
          setCancelling(false);
        }
      },
    });
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
    // Custom file required validation for first upload
    if (!request.driverReportCost && !file) {
      openFeedbackModal({
        type: 'error',
        title: t('common.errorTitle'),
        message: t('srDetails.error.fileRequired'),
      });
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
      openFeedbackModal({
        type: 'success',
        title: t('common.successTitle'),
        message: t('srDetails.success.saved'),
      });
      setTimeout(() => {
        closeFeedbackModal();
        navigate(-1);
      }, 2000);
    } catch (err) {
      openFeedbackModal({
        type: 'error',
        title: t('common.errorTitle'),
        message: getApiErrorMessage(err, t('srDetails.error.saveFailed')),
      });
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
            <h1 className="add-fuel-title">{t('srDetails.title')}</h1>
            <p className="add-fuel-subtitle">{t('srDetails.subtitle')}</p>
          </div>

          <Row className={`g-4${request.status === 'REQUESTED' ? ' justify-content-center' : ''}`}>
            {/* Left Column - Form */}
            <Col lg={7} xl={8}>
              <Card className="fuel-form-card border-0 shadow-sm">
                <Card.Body className="p-4 p-md-5">
                  {request.status === 'REQUESTED' && (
                    <Alert variant="info" className="mb-4">
                      <strong>{t('srDetails.readOnly')}</strong> {t('srDetails.readOnlyMsg')}
                    </Alert>
                  )}

                  <Row className="g-4">
                    {/* Title - always shown */}
                    <Col xs={12}>
                      <div className="srd-info-row">
                          <div className="srd-info-label">{t('srDetails.label.title')}</div>
                        <div className="srd-info-value">{request.title || '—'}</div>
                      </div>
                    </Col>

                    {/* Description - always shown */}
                    {(request.description) && (
                      <Col xs={12}>
                        <div className="srd-info-row">
                          <div className="srd-info-label">{t('srDetails.label.description')}</div>
                          <div className="srd-info-value srd-info-value--muted">{request.description}</div>
                        </div>
                      </Col>
                    )}

                    {/* Service Date - always shown if available */}
                    {request.scheduledStart && (
                      <Col xs={12}>
                        <div className="srd-info-row">
                          <div className="srd-info-label">{t('srDetails.label.serviceDate')}</div>
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
                              <div className="srd-meta-label">{t('srDetails.label.status')}</div>
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
                              <div className="srd-meta-label">{t('srDetails.label.licensePlate')}</div>
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
                          <div className="srd-info-label">{t('srDetails.label.location')}</div>
                          <div className="srd-info-value">{request.serviceLocation || request.ServiceLocation}</div>
                        </div>
                      </Col>
                    )}

                    {/* Driver Cost - Only show when NOT requested */}
                    {request.status !== 'REQUESTED' && (
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">
                            {t('srDetails.label.driverCost')} <span className="srd-required">*</span>
                          </Form.Label>
                          <div className="input-with-suffix">
                            <Form.Control
                              type="number"
                              value={driverCost}
                              onChange={e => setDriverCost(e.target.value)}
                              placeholder="0"
                              min="0"
                              step="100"
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
                            {t('srDetails.label.closeNote')} <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.85rem' }}>{t('srDetails.closeNoteOptional')}</span>
                          </Form.Label>
                          <Form.Control
                              type="text"
                              value={closeNote}
                              onChange={e => setCloseNote(e.target.value)}
                              placeholder={t('srDetails.placeholder.closeNote')}
                            className="form-control-lg"
                          />                            {language !== 'en' && (
                              <Form.Text style={{ color: '#b45309', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/>
                                  <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
                                </svg>
                                {t('common.writeInEnglish')}
                              </Form.Text>
                            )}                        </Form.Group>
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
                          <><Spinner animation="border" size="sm" className="me-2" />{t('srDetails.btn.saving')}</>
                        ) : (
                          <>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {t('srDetails.btn.save')}
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
                          <><Spinner animation="border" size="sm" className="me-2" />{t('srDetails.btn.cancelling')}</>
                        ) : (
                          <>{t('srDetails.btn.cancel')}</>
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
                      {t('srDetails.btn.back')}
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
                    <span className="receipt-title">{t('srDetails.invoice.title')}</span>
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
                          <strong>{t('srDetails.invoice.click')}</strong>
                          <span>{t('srDetails.invoice.drag')}</span>
                        </div>
                        <span className="upload-hint">{t('srDetails.invoice.hint')}</span>
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
                        <span className="srd-existing-label">{t('srDetails.invoice.current')}</span>
                      </div>
                      <div className="srd-invoice-preview">
                        <img
                          src={invoiceImgUrl}
                          alt="Invoice"
                          className="srd-invoice-img"
                          onClick={() => setInvoicePreviewOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setInvoicePreviewOpen(true);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        />
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
                    <span className="pro-tip-title">{t('srDetails.proTip.title')}</span>
                  </div>
                  <p className="pro-tip-text">
                    {t('srDetails.proTip.text')}
                  </p>
                  <ul className="pro-tip-list">
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t('srDetails.proTip.1')}
                    </li>
                    <li>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0d6efd" className="me-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t('srDetails.proTip.2')}
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            )}
          </Row>
        </Container>
        <Footer />

        <CustomModal
          isOpen={confirmModal.open}
          onClose={closeConfirmModal}
          title={confirmModal.title}
          primaryAction={{
            label: confirmModal.confirmLabel,
            onClick: handleConfirmAction,
            variant: confirmModal.confirmVariant,
            disabled: cancelling,
          }}
          secondaryAction={{
            label: confirmModal.cancelLabel,
            onClick: closeConfirmModal,
            disabled: cancelling,
          }}
        >
          <p className="mb-0">{confirmModal.message}</p>
        </CustomModal>

        <CustomModal
          isOpen={feedbackModal.open}
          onClose={closeFeedbackModal}
          title={feedbackModal.title}
          primaryAction={feedbackModal.type === 'error' ? {
            label: t('common.ok'),
            onClick: closeFeedbackModal,
          } : undefined}
        >
          <p className="mb-0">{feedbackModal.message}</p>
        </CustomModal>

        <CustomModal
          isOpen={invoicePreviewOpen}
          onClose={() => setInvoicePreviewOpen(false)}
          title={t('srDetails.invoice.current')}
          closeOnBackdrop
          closeOnEscape
          size="lg"
          primaryAction={{
            label: t('common.ok'),
            onClick: () => setInvoicePreviewOpen(false),
          }}
        >
          <div className="srd-zoomed-image-wrap">
            <img src={invoiceImgUrl} alt="Invoice enlarged" className="srd-zoomed-image" />
          </div>
        </CustomModal>
      </div>
    </div>
  );
};

export default ServiceRequestDetails;
