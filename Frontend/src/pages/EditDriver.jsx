import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Form, Spinner } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import CustomModal from '../components/CustomModal';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/EditDriver.css';

const EditDriver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalIsActive, setOriginalIsActive] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    notes: '',
    isActive: true,
  });

  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (error) {
      setModalType('error');
      setModalContent({ title: t('common.errorTitle'), message: error });
      setModalOpen(true);
    }
  }, [error, t]);

  useEffect(() => {
    if (success) {
      setModalType('success');
      setModalContent({ title: t('common.successTitle'), message: success });
      setModalOpen(true);
    }
  }, [success, t]);

  useEffect(() => {
    const fetchDriver = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/admin/drivers', {
          params: { page: 1, pageSize: 200 },
        });
        const payload = res.data || {};
        const drivers = Array.isArray(payload.data) ? payload.data : [];
        const driver = drivers.find(
          (d) => String(d.id ?? d.Id) === String(id)
        );
        if (!driver) {
          setError('Driver not found.');
          return;
        }
        const formatDate = (val) => {
          if (!val) return '';
          const d = new Date(val);
          if (isNaN(d.getTime())) return '';
          return d.toISOString().split('T')[0];
        };
        setForm({
          fullName: driver.fullName || driver.FullName || '',
          email: driver.email || driver.Email || '',
          phone: driver.phone || driver.Phone || '',
          licenseNumber: driver.licenseNumber || driver.LicenseNumber || '',
          licenseExpiryDate: formatDate(driver.licenseExpiryDate || driver.LicenseExpiryDate),
          notes: driver.notes || driver.Notes || '',
          isActive: driver.isActive ?? driver.IsActive ?? true,
        });
        setOriginalIsActive(driver.isActive ?? driver.IsActive ?? true);
        try {
          const imgRes = await api.get(`/files/thumbnail/${id}`, { responseType: 'blob' });
          setProfileImageUrl(URL.createObjectURL(imgRes.data));
          setProfileImageError(false);
        } catch {
          setProfileImageError(true);
        }
      } catch (err) {
        const msg = err?.response?.data;
        setError(typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to load driver data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggleActive = () => {
    setForm((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/drivers/edit/${id}`, {
        fullName: form.fullName,
        phone: form.phone || null,
        licenseNumber: form.licenseNumber || null,
        licenseExpiryDate: form.licenseExpiryDate || null,
        notes: form.notes || null,
      });
      if (form.isActive !== originalIsActive) {
        const endpoint = form.isActive ? `/admin/drivers/activate/${id}` : `/admin/drivers/deactivate/${id}`;
        await api.patch(endpoint);
        setOriginalIsActive(form.isActive);
      }
      setSuccess('Successfully edited. Redirecting...');
      setTimeout(() => navigate('/drivers'), 1500);
    } catch (err) {
      const msg = err?.response?.data;
      setError(typeof msg === 'string' ? msg : msg?.message || msg?.Message || 'Failed to update driver.');
    } finally {
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
              <h1 className="edit-driver-title">Edit Driver</h1>
              <p className="edit-driver-subtitle">Update driver information and settings</p>
            </div>
          </div>

          <CustomModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setError('');
              setSuccess('');
              setModalType('');
            }}
            title={modalContent.title}
            primaryAction={modalType === 'error' ? {
              label: t('common.ok'),
              onClick: () => {
                setModalOpen(false);
                setError('');
                setSuccess('');
                setModalType('');
              },
            } : undefined}
            closeOnBackdrop={modalType === 'error'}
          >
            <p className="mb-0">{modalContent.message}</p>
          </CustomModal>

          {loading ? (
            <div className="edit-driver-loading">
              <Spinner animation="border" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="edit-driver-form-grid">

              {/* Profile Picture Card — spans both columns */}
              <div className="edit-driver-card edit-driver-card-full">
                <div className="edit-driver-card-header">
                  <div className="card-header-icon card-icon-purple">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="card-title">Profile Picture</h2>
                    <p className="card-subtitle">Driver's current profile photo</p>
                  </div>
                </div>
                <div className="edit-driver-card-body profile-pic-body">
                  <div className="profile-pic-wrapper">
                    {!profileImageError && profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={form.fullName || 'Driver'}
                        className="profile-pic-img"
                      />
                    ) : (
                      <div className="profile-pic-placeholder">
                        <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5.5 21a7.5 7.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="profile-pic-info">
                    <p className="profile-pic-name">{form.fullName || '–'}</p>
                    <p className="profile-pic-email">{form.email || '–'}</p>
                  </div>
                </div>
              </div>

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
                    <p className="card-subtitle">Basic contact details of the driver</p>
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
                        disabled
                        readOnly
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

              {/* License & Status Card */}
              <div className="edit-driver-card">
                <div className="edit-driver-card-header">
                  <div className="card-header-icon card-icon-green">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 3h-8l-2 4h12l-2-4z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="card-title">License & Status</h2>
                    <p className="card-subtitle">Driver's license details and account status</p>
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
                      <Form.Label className="field-label">License Expiry Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="licenseExpiryDate"
                        value={form.licenseExpiryDate}
                        onChange={handleChange}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
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

                  {/* Active toggle */}
                  <div className="status-toggle-row">
                    <div className="status-toggle-info">
                      <span className="field-label">Account Status</span>
                      <span className="status-toggle-desc">
                        {form.isActive ? 'Driver can log in and use the system' : 'Driver is blocked from logging in'}
                      </span>
                    </div>
                    <label className="toggle-switch" title="Toggle active status">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleToggleActive}
                      />
                      <span className="toggle-track">
                        <span className="toggle-thumb" />
                      </span>
                    </label>
                  </div>
                  <div className="status-badge-preview">
                    <span className={`status-badge-pill ${form.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="status-badge-hint">Current status preview</span>
                  </div>
                </div>
              </div>

              {/* Action buttons — full width row */}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="17,21 17,13 7,13 7,21" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="7,3 7,8 15,8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

            </form>
          )}
        </Container>
      </main>
    </div>
  );
};

export default EditDriver;
