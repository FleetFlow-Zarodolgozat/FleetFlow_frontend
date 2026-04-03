import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import '../styles/EditDriver.css';

const AddDriver = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    notes: '',
  });

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/admin/drivers', {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        licenseNumber: form.licenseNumber || null,
        licenseExpiryDate: form.licenseExpiryDate,
        notes: form.notes || null,
      });
      setSuccess('Driver created successfully. A set-password email has been sent. Redirecting...');
      setTimeout(() => navigate('/drivers'), 2000);
    } catch (err) {
      const msg = err?.response?.data;
      setError(typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to create driver.');
      setSaving(false);
    }
  };

  return (
    <div className="edit-driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container fluid className="edit-driver-page">

          {/* Header */}
          <div className="edit-driver-header">
            <div className="edit-driver-title-row">
              <h1 className="edit-driver-title">Add New Driver</h1>
              <p className="edit-driver-subtitle">Fill in the details to register a new driver account</p>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-4">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="edit-driver-form-grid">

            {/* Personal Information Card */}
            <div className="edit-driver-card">
              <div className="edit-driver-card-header">
                <div className="card-header-icon card-icon-blue">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.5 21a7.5 7.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h2 className="card-title">Personal Information</h2>
                  <p className="card-subtitle">Basic contact details of the new driver</p>
                </div>
              </div>
              <div className="edit-driver-card-body">
                <div className="form-row-2">
                  <Form.Group className="form-field">
                    <Form.Label className="field-label">Full Name <span className="required">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. John Smith"
                      required
                      className="field-input"
                    />
                  </Form.Group>
                  <Form.Group className="form-field">
                    <Form.Label className="field-label">Email Address <span className="required">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. john@example.com"
                      required
                      className="field-input"
                    />
                  </Form.Group>
                </div>
                <Form.Group className="form-field">
                  <Form.Label className="field-label">Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. +36 30 123 4567"
                    className="field-input"
                  />
                </Form.Group>
              </div>
            </div>

            {/* License Card */}
            <div className="edit-driver-card">
              <div className="edit-driver-card-header">
                <div className="card-header-icon card-icon-green">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 3h-8l-2 4h12l-2-4z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h2 className="card-title">License Details</h2>
                  <p className="card-subtitle">Driver's license information</p>
                </div>
              </div>
              <div className="edit-driver-card-body">
                <div className="form-row-2">
                  <Form.Group className="form-field">
                    <Form.Label className="field-label">License Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="licenseNumber"
                      value={form.licenseNumber}
                      onChange={handleChange}
                      placeholder="e.g. HU-12345678"
                      className="field-input"
                    />
                  </Form.Group>
                  <Form.Group className="form-field">
                    <Form.Label className="field-label">License Expiry Date <span className="required">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="licenseExpiryDate"
                      value={form.licenseExpiryDate}
                      onChange={handleChange}
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      required
                      className="field-input"
                    />
                  </Form.Group>
                </div>
                <Form.Group className="form-field">
                  <Form.Label className="field-label">Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Optional notes about this driver..."
                    rows={3}
                    className="field-input field-textarea"
                  />
                </Form.Group>
              </div>
            </div>

            {/* Action buttons */}
            <div className="edit-driver-actions">
              <Button
                variant="outline-secondary"
                className="action-cancel-btn"
                onClick={() => navigate('/drivers')}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="action-save-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="19" y1="8" x2="19" y2="14" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="22" y1="11" x2="16" y2="11" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Create Driver
                  </>
                )}
              </Button>
            </div>

          </form>
        </Container>
        <Footer />
      </main>
    </div>
  );
};

export default AddDriver;
