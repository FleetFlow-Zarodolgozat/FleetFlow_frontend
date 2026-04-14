import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Alert, Spinner, Button, Form, Badge } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
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
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);
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
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to load profile data.' });
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
    setFeedback({ type: '', message: '' });
    try {
      const formData = new FormData();
      if (personalInfo.fullName) formData.append('FullName', personalInfo.fullName);
      if (personalInfo.phone) formData.append('Phone', personalInfo.phone);
      if (personalInfo.password) {
        formData.append('Password', personalInfo.password);
        formData.append('PasswordAgain', personalInfo.confirmPassword);
      }
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
      setEditMode(false);
      fetchProfile();
      setNotificationRefresh((prev) => prev + 1);
      // Trigger Sidebar reload
      setSidebarOpen((prev) => !prev);
    } catch (err) {
      let msg = 'Failed to save changes.';
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'string') msg = data;
        else if (data.message) msg = data.message;
        else if (data.detail) msg = data.detail;
        else if (data.errors) msg = Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
        else msg = JSON.stringify(data);
      }
      setFeedback({ type: 'danger', message: msg });
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
    setFeedback({ type: '', message: '' });
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFeedback({ type: 'danger', message: 'Only JPEG, PNG or GIF files are allowed.' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'danger', message: 'File size must not exceed 10MB.' });
      return;
    }

    const formData = new FormData();
    formData.append('File', file); // must match dto.File

    try {
      await api.patch('/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', message: 'Profile picture updated successfully.' });

      // Reload image
      const imgResponse = await api.get(`/files/thumbnail/${profile.id}`, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(imgResponse.data);
      setProfileImageUrl(objectUrl);
      setProfileImageError(false);
      setNotificationRefresh((prev) => prev + 1);
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to upload profile picture.' });
    }
  };

  const handleRemovePicture = async () => {
    try {
      await api.patch('/profile/delete-profile-image');
      setFeedback({ type: 'success', message: 'Profile picture removed successfully.' });
      setProfileImageUrl(null);
      setProfileImageError(true);
      fetchProfile();
      setNotificationRefresh((prev) => prev + 1);
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to remove profile picture.' });
    }
  };

  const handlePreferenceChange = (key) => {
    if (key === 'darkMode') {
      if (user?.role?.toLowerCase() === 'admin') return;
      const newVal = !preferences.darkMode;
      setPreferences(prev => ({ ...prev, darkMode: newVal }));
      localStorage.setItem('fleetflow_darkMode', String(newVal));
      document.body.classList.toggle('dark-mode', newVal);
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
        <Container fluid className="px-4 py-4" style={{ maxWidth: '1400px' }}>
          {/* Page Header */}
          <div className="page-header mb-4">
            <h1 className="page-title">{t('profile.title')}</h1>
            <p className="page-subtitle">{t('profile.subtitle')}</p>
          </div>

          {feedback.message && (
            <Alert variant={feedback.type} className="mb-4">
              {feedback.message}
            </Alert>
          )}

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
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
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
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>
                      <h3 className="card-title text-muted mb-4">{profile.fullName}</h3>
                      <div className="remove-picture-bg">
                        <Button variant="link" className="w-100 text-danger" onClick={handleRemovePicture}>
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
                <Col xs={12}>
                  <Card className="help-support-card">
                    <Card.Body className="p-0">
                      <div className="d-flex align-items-center gap-3" style={{ padding: '24px' }}>
                        <div className="help-icon-wrapper">
                          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Background circle */}
                            <circle cx="24" cy="24" r="22" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
                            {/* Question mark */}
                            <path d="M24 14C20.13 14 17 17.13 17 21H20C20 18.79 21.79 17 24 17C26.21 17 28 18.79 28 21C28 23.5 26 25 24 27V29H27V27C29 25 31 23.5 31 21C31 17.13 27.88 14 24 14Z" fill="currentColor"/>
                            <circle cx="24" cy="33" r="1.5" fill="currentColor"/>
                          </svg>
                        </div>
                        <div className="help-content" style={{ flex: 1 }}>
                          <h4 className="help-title mb-1">{t('profile.help.title')}</h4>
                          <p className="help-description mb-2">
                            {t('profile.help.description')}
                          </p>
                          <Button variant="link" className="help-link p-0" onClick={() => navigate('/help')} style={{ textDecoration: 'none' }}>
                            {t('profile.help.link')}
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
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
                            <Button variant="primary" onClick={handleSave}>
                              {t('profile.btn.save')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

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
                            {user?.role?.toLowerCase() === 'admin' ? (
                              <div title="Not available for admin page" style={{ cursor: 'not-allowed' }}>
                                <div className="toggle-switch" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                                  <span className="toggle-slider"></span>
                                </div>
                              </div>
                            ) : (
                              <div className={`toggle-switch ${preferences.darkMode ? 'active' : ''}`} onClick={() => handlePreferenceChange('darkMode')}>
                                <span className="toggle-slider"></span>
                              </div>
                            )}
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
                            {user?.role?.toLowerCase() === 'admin' ? (
                              <div
                                title={t('profile.pref.languageNotAvailable')}
                                style={{ cursor: 'not-allowed' }}
                              >
                                <Form.Select
                                  size="sm"
                                  disabled
                                  style={{ opacity: 0.4, pointerEvents: 'none', minWidth: 130 }}
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
                                style={{ minWidth: 130 }}
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

                {/* Danger Zone Card */}
                <Col xs={12}>
                  <Card className="danger-zone-card">
                    <Card.Body className="p-4">
                      <div className="danger-zone-content">
                        <div className="danger-zone-text">
                          <h4 className="danger-zone-title">{t('profile.danger.title')}</h4>
                          <p className="danger-zone-description">
                            {t('profile.danger.description')}
                          </p>
                        </div>
                        <Button
                          variant="outline-danger"
                          className="delete-account-btn"
                          onClick={() => { authService.logout(); navigate('/login'); }}
                        >
                          {t('profile.danger.btn')}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
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
