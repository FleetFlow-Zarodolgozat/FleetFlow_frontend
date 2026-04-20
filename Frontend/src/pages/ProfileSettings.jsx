import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Spinner, Button, Form } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import CustomModal from '../components/CustomModal';
import '../styles/ProfileSettings.css';

import Footer from '../components/Footer';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const personalInfoRef = useRef(null);
  const user = authService.getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationRefresh, setNotificationRefresh] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });
  const fileInputRef = useRef(null);

  // Personal Information form
  const [personalInfo, setPersonalInfo] = useState({
    licenseNumber: '',
    licenseExpiryDate: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  // Edit mode for personal info
  const [editMode, setEditMode] = useState(false);
  // Edit mode aktiválása, ha navigation state-ben edit=true
  useEffect(() => {
    if (location.state && location.state.edit) {
      setEditMode(true);
    }
    if (location.state && location.state.scrollToPersonal) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
    }
  }, [location.state]);

  const { t, language, setLanguage } = useLanguage();
  const roleLower = String(user?.role || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const isDriver = roleLower === 'driver';

  const showErrorModal = (message) => {
    setErrorModal({ open: true, message });
  };

  // A backend hibák szövegét kulcsszavak alapján lokalizáljuk,
  // hogy a felhasználó mindig érthető, konzisztens üzenetet kapjon.
  const getLocalizedBackendError = (err, fallbackKey = 'profile.error.backendGeneric') => {
    const data = err?.response?.data;
    const rawMessage =
      typeof data === 'string'
        ? data
        : data?.message || data?.Message || data?.detail || '';

    const normalized = String(rawMessage || '').toLowerCase();
    if (normalized.includes('password') && (normalized.includes('match') || normalized.includes('again'))) {
      return t('profile.error.passwordMismatch');
    }
    if (normalized.includes('unauthorized') || err?.response?.status === 401) {
      return t('profile.error.unauthorized');
    }
    if (normalized.includes('forbidden') || err?.response?.status === 403) {
      return t('profile.error.forbidden');
    }

    return t(fallbackKey);
  };

  // Preferences
  const [preferences, setPreferences] = useState({
    darkMode: localStorage.getItem('fleetflow_darkMode') === 'true',
    emailNotifications: true,
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile/mine');
      const data = response.data;

      const fullName = data.fullName || data.FullName || '';

      setProfile({
        id: data.id || data.Id,
        fullName,
        email: data.email || data.Email,
        role: data.role || data.Role,
        phone: data.phone || data.Phone,
        licenseNumber: data.licenseNumber || data.LicenseNumber,
        licenseExpiryDate: data.licenseExpiryDate || data.LicenseExpiryDate || '',
      });

      setPersonalInfo({
        licenseNumber: data.licenseNumber || data.LicenseNumber || '',
        licenseExpiryDate: data.licenseExpiryDate || data.LicenseExpiryDate || '',
        fullName: data.fullName || data.FullName || '',
        email: data.email || data.Email || '',
        phone: data.phone || data.Phone || '',
        password: '',
        confirmPassword: '',
      });
      if (data.id || data.Id) {
        try {
          const imgResponse = await api.get(`/files/thumbnail/${data.id || data.Id}`, { responseType: 'blob' });
          const objectUrl = URL.createObjectURL(imgResponse.data);
          setProfileImageUrl(objectUrl);
          setProfileImageError(false);
        } catch {
          setProfileImageUrl(null);
          setProfileImageError(true);
        }
      }
    } catch (err) {
      showErrorModal(getLocalizedBackendError(err, 'profile.error.loadProfile'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      if (personalInfo.fullName) formData.append('FullName', personalInfo.fullName);
      if (personalInfo.phone) formData.append('Phone', personalInfo.phone);
      if (personalInfo.password) {
        formData.append('Password', personalInfo.password);
        formData.append('PasswordAgain', personalInfo.confirmPassword);
      }
      await api.patch('/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessModal({ open: true, message: 'Profile updated successfully.' });
      setEditMode(false);
      fetchProfile();
      setNotificationRefresh((prev) => prev + 1);
      // Trigger Sidebar reload
      setSidebarOpen((prev) => !prev);
    } catch (err) {
      showErrorModal(getLocalizedBackendError(err, 'profile.error.saveChanges'));
    }
  };

  const handleCancel = () => {
    if (profile) {
      setPersonalInfo({
        licenseNumber: profile.licenseNumber || '',
        licenseExpiryDate: profile.licenseExpiryDate || '',
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        password: '',
        confirmPassword: '',
      });
    }
    setEditMode(false);
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showErrorModal(t('profile.error.invalidFileType'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showErrorModal(t('profile.error.fileTooLarge'));
      return;
    }

    const formData = new FormData();
    formData.append('File', file); // must match dto.File

    try {
      await api.patch('/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessModal({ open: true, message: 'Profile picture updated successfully.' });

      // Reload image
      const imgResponse = await api.get(`/files/thumbnail/${profile.id}`, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(imgResponse.data);
      setProfileImageUrl(objectUrl);
      setProfileImageError(false);
      setNotificationRefresh((prev) => prev + 1);
    } catch (err) {
      showErrorModal(getLocalizedBackendError(err, 'profile.error.uploadPicture'));
    }
  };

  const handleRemovePicture = async () => {
    try {
      await api.patch('/profile/delete-profile-image');
      setSuccessModal({ open: true, message: 'Profile picture removed successfully.' });
      setProfileImageUrl(null);
      setProfileImageError(true);
      fetchProfile();
      setNotificationRefresh((prev) => prev + 1);
    } catch (err) {
      showErrorModal(getLocalizedBackendError(err, 'profile.error.removePicture'));
    }
  };

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({ open: true, title, message, onConfirm });
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

  const handlePreferenceChange = (key) => {
    if (key === 'darkMode') {
      const newVal = !preferences.darkMode;
      setPreferences(prev => ({ ...prev, darkMode: newVal }));
      localStorage.setItem('fleetflow_darkMode', String(newVal));

      // Force theme update on body class
      if (newVal) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }

      // A custom eventet a többi komponens figyeli, így frissül a teljes UI.
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { isDarkMode: newVal } }));
    } else {
      setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const getInitials = () => {
    if (profile?.fullName) {
      const names = profile.fullName.split(' ');
      if (names.length >= 2) {
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
      }
      return profile.fullName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="profile-settings-page">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notificationRefresh={notificationRefresh} />
        <main className="main-content">
          <Container className="py-5 text-center">
            <Spinner animation="border" variant="primary" />
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-settings-page">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notificationRefresh={notificationRefresh} />

      <main className="main-content">
        <Container fluid className="px-4 py-4 profile-container">
          {/* Page Header */}
          <div className="page-header mb-4">
            <h1 className="page-title">{t('profile.title')}</h1>
            <p className="page-subtitle">{t('profile.subtitle')}</p>
          </div>

          <CustomModal
            isOpen={errorModal.open}
            onClose={() => setErrorModal({ open: false, message: '' })}
            title={t('common.errorTitle')}
            primaryAction={{
              label: t('common.ok'),
              onClick: () => setErrorModal({ open: false, message: '' }),
            }}
          >
            <p className="mb-0">{errorModal.message}</p>
          </CustomModal>

          <CustomModal
            isOpen={successModal.open}
            onClose={() => setSuccessModal({ open: false, message: '' })}
            title={t('common.successTitle')}
            primaryAction={{
              label: t('common.ok'),
              onClick: () => setSuccessModal({ open: false, message: '' }),
            }}
          >
            <p className="mb-0">{successModal.message}</p>
          </CustomModal>

          <Row className="g-4 h-100 align-items-stretch">
            {/* Left Column */}
            <Col lg={4} xl={3}>
              <Row className="g-4">
                {/* Profile Picture Card */}
                <Col xs={12}>
                  <Card className="profile-picture-card h-100">
                    <Card.Body className="p-4">
                      <h3 className="card-title mb-4">{t('profile.picture.title')}</h3>

                      <div className="profile-picture-wrapper text-center mb-3">
                        <div className="profile-picture-container">
                          {!profileImageError && profileImageUrl ? (
                            <img src={profileImageUrl} alt="Profile" className="profile-picture" />
                          ) : (
                            <div className="profile-picture-placeholder">
                              <span>{getInitials()}</span>
                            </div>
                          )}
                          <button className="edit-picture-btn" onClick={handleImageUploadClick} type="button" aria-label="Upload new profile picture">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="7" width="18" height="13" rx="2" fill="none" />
                              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" />
                              <circle cx="12" cy="14" r="3" fill="none" />
                            </svg>
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/gif"
                            className="file-input-hidden"
                          />
                        </div>
                      </div>
                      <h3 className="card-title text-muted mb-4">{profile.fullName}</h3>
                      <div className="remove-picture-bg">
                        <Button
                          variant="link"
                          className="w-100 text-danger"
                          onClick={() =>
                            openConfirmModal({
                              title: t('profile.confirm.removeTitle'),
                              message: t('profile.confirm.removeMessage'),
                              onConfirm: handleRemovePicture,
                            })
                          }
                        >
                          {t('profile.picture.remove')}
                        </Button>
                      </div>

                      <p className="picture-hint text-center mt-3">
                        {t('profile.picture.hint')}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Help & Support Card */}
                {!isAdmin && (
                <Col xs={12}>
                  <Card className="help-support-card">
                    <Card.Body className="p-0">
                      <div className="d-flex align-items-center gap-3 help-support-row">
                        <div className="help-icon-wrapper">
                          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="24" cy="24" r="21" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" />
                            <path d="M19.5 18.5C19.5 16.02 21.52 14 24 14C26.48 14 28.5 16.02 28.5 18.5C28.5 20.38 27.36 21.72 25.8 22.56C24.88 23.06 24 23.88 24 25.5V27" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="24" cy="33" r="1.8" fill="currentColor" />
                          </svg>
                        </div>
                        <div className="help-content">
                          <h4 className="help-title mb-1">{t('profile.help.title')}</h4>
                          <p className="help-description mb-2">
                            {t('profile.help.description')}
                          </p>
                          <Button variant="link" className="help-link p-0" onClick={() => navigate('/help')}>
                            {t('profile.help.link')}
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                )}
              </Row>
            </Col>

            {/* Right Column */}
            <Col lg={8} xl={9}>
              <Row className="g-4">
                {/* Personal Information Card */}
                <Col xs={12}>
                  <Card className="personal-info-card">
                    <Card.Header className="bg-white">
                      <h3 className="card-title mb-0" ref={personalInfoRef}>{t('profile.personal.title')}</h3>
                      <p className="card-subtitle mb-0">{t('profile.personal.subtitle')}</p>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Form>
                        <Row className="g-3">
                          {!editMode ? (
                            <>
                              {user?.role !== 'ADMIN' && (
                                <>
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="form-label">{t('profile.label.licenseNumber')}</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="licenseNumber"
                                        value={personalInfo.licenseNumber}
                                        readOnly
                                        placeholder="Enter license number"
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label className="form-label">{t('profile.label.licenseExpiry')}</Form.Label>
                                      <Form.Control
                                        type="text"
                                        name="licenseExpiryDate"
                                        value={personalInfo.licenseExpiryDate ? new Date(personalInfo.licenseExpiryDate).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                                        readOnly
                                        placeholder="YYYY-MM-DD"
                                      />
                                    </Form.Group>
                                  </Col>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label className="form-label">{t('profile.label.password')}</Form.Label>
                                  <Form.Control
                                    type="password"
                                    name="password"
                                    value={personalInfo.password}
                                    onChange={handlePersonalInfoChange}
                                    placeholder="Enter new password"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label className="form-label">{t('profile.label.confirmPassword')}</Form.Label>
                                  <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    value={personalInfo.confirmPassword}
                                    onChange={handlePersonalInfoChange}
                                    placeholder="Confirm new password"
                                  />
                                </Form.Group>
                              </Col>
                            </>
                          )}
                          {editMode ? (
                            <Col md={12}>
                              <Form.Group>
                                <Form.Label className="form-label">{t('profile.label.fullName')}</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="fullName"
                                  value={personalInfo.fullName}
                                  readOnly={!editMode}
                                  onChange={editMode ? handlePersonalInfoChange : undefined}
                                  placeholder="Enter full name"
                                />
                              </Form.Group>
                            </Col>
                          ) : (
                            <Col md={12}>
                              <Form.Group>
                                <Form.Label className="form-label">{t('profile.label.email')}</Form.Label>
                                <div className="input-with-icon">
                                  <svg className="input-icon" width="20" height="20" fill="none" stroke="#6c757d" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <Form.Control
                                    type="email"
                                    name="email"
                                    value={personalInfo.email}
                                    readOnly
                                    placeholder="Enter email address"
                                  />
                                </div>
                              </Form.Group>
                            </Col>
                          )}
                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="form-label">{t('profile.label.phone')}</Form.Label>
                              <Form.Control
                                type="text"
                                name="phone"
                                value={personalInfo.phone}
                                readOnly={!editMode}
                                onChange={editMode ? handlePersonalInfoChange : undefined}
                                placeholder="Enter phone number"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Form>

                      <div className="form-actions d-flex justify-content-between gap-2 mt-4 pt-3 border-top">
                        <div>
                          {editMode && (
                            <Button variant="outline-secondary" onClick={handleCancel}>
                              {t('profile.btn.cancel')}
                            </Button>
                          )}
                        </div>
                        <div className="ms-auto">
                          {!editMode ? (
                            <Button variant="primary" onClick={() => setEditMode(true)}>
                              {t('profile.btn.edit')}
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() =>
                                openConfirmModal({
                                  title: t('profile.confirm.saveTitle'),
                                  message: t('profile.confirm.saveMessage'),
                                  onConfirm: handleSave,
                                })
                              }
                            >
                              {t('profile.btn.save')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <CustomModal
                  isOpen={confirmModal.open}
                  onClose={closeConfirmModal}
                  title={confirmModal.title}
                  primaryAction={{
                    label: t('common.confirm'),
                    onClick: handleConfirmAction,
                  }}
                  secondaryAction={{
                    label: t('common.cancel'),
                    onClick: closeConfirmModal,
                  }}
                >
                  <p className="mb-0">{confirmModal.message}</p>
                </CustomModal>

                {/* Preferences Card */}
                <Col xs={12}>
                  <Card className="preferences-card">
                    <Card.Header className="bg-white">
                      <h3 className="card-title mb-0">{t('profile.pref.title')}</h3>
                      <p className="card-subtitle mb-0">{t('profile.pref.subtitle')}</p>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="preferences-list">
                        {/* Dark Mode Toggle */}
                        <div className="preference-item">
                          <div className="preference-icon">
                            <svg width="20" height="20" fill="none" stroke="#6c757d" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="preference-content">
                            <h4 className="preference-title">{t('profile.pref.darkMode')}</h4>
                            <p className="preference-description">
                              {t('profile.pref.darkModeDesc')}
                            </p>
                          </div>
                          <div className="preference-action">
                              <div className={`toggle-switch ${preferences.darkMode ? 'active' : ''}`} onClick={() => handlePreferenceChange('darkMode')}>
                                <span className="toggle-slider"></span>
                              </div>
                          </div>
                        </div>

                        <div className="preference-divider"></div>

                        {/* Language Selector */}
                        <div className="preference-item">
                          <div className="preference-icon">
                            <svg width="20" height="20" fill="none" stroke="#6c757d" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                              <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="preference-content">
                            <h4 className="preference-title">{t('profile.pref.language')}</h4>
                            <p className="preference-description">
                              {t('profile.pref.languageDesc')}
                            </p>
                          </div>
                          <div className="preference-action">
                            {isAdmin ? (
                              <div
                                title={t('profile.pref.languageNotAvailable')}
                                className="language-select-disabled"
                              >
                                <Form.Select
                                  size="sm"
                                  disabled
                                  className="profile-language-select profile-language-select--disabled"
                                  value="en"
                                  readOnly
                                >
                                  <option value="en">English</option>
                                  <option value="hu">Hungarian</option>
                                  <option value="de">German</option>
                                </Form.Select>
                              </div>
                            ) : (
                              <Form.Select
                                size="sm"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="profile-language-select"
                              >
                                <option value="en">English</option>
                                <option value="hu">Hungarian</option>
                                <option value="de">German</option>
                              </Form.Select>
                            )}
                          </div>
                        </div>

                        <div className="preference-divider"></div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Mobile App Download Card */}
                {!isAdmin && (
                <Col xs={12}>
                  <Card className="app-download-card">
                    <Card.Body className="p-4">
                      <div className="app-download-content">
                        {isDriver && (
                          <div className="app-download-logo-wrap">
                            <img src="/fleetflow_logo.png" alt="FleetFlow" className="app-download-logo" />
                          </div>
                        )}
                        <div className="app-download-text">
                          <h4 className="app-download-title">{t('profile.app.title')}</h4>
                          <p className="app-download-description">
                            {t('profile.app.description')}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          className="app-download-btn"
                          href="https://github.com/FleetFlow-Zarodolgozat/FleetFlow_mobil/releases/download/v1.3/com.fleetflow.mobil-Signed.apk"
                          download
                        >
                          {t('profile.app.cta')}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                )}
              </Row>
            </Col>
          </Row>
        </Container>
      {/* Footer csak ha nem ADMIN */}
      {user?.role !== 'ADMIN' && <Footer userType={user?.role} />}
    </main>
  </div>
  );
};

export default ProfileSettings;
