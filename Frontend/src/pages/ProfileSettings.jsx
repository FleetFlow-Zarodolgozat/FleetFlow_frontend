import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Alert, Spinner, Button, Form, Badge } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import '../styles/ProfileSettings.css';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationRefresh, setNotificationRefresh] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Hide feedback after 2 seconds
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ type: '', message: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);
  const [isDirty, setIsDirty] = useState(false);
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

  // Preferences
  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailNotifications: true,
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile/mine');
      const data = response.data;

      const fullName = data.fullName || data.FullName || '';
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

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

      // Fetch profile image
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
      setFeedback({ type: 'danger', message: 'Hiba történt a profil adatok lekérésekor!' });
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
    setIsDirty(true);
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
      // Optionally: handle file upload here if needed (formData.append('File', ...))
      const response = await api.patch('/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', message: 'Profil sikeresen frissítve!' });
      setIsDirty(false);
      setEditMode(false);
      fetchProfile();
      setNotificationRefresh((prev) => prev + 1);
      // Trigger Sidebar reload
      setSidebarOpen((prev) => !prev);
    } catch (err) {
      let msg = 'Hiba történt a mentés során!';
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
    setIsDirty(false);
    setEditMode(false);
    setFeedback({ type: '', message: '' });
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFeedback({ type: 'danger', message: 'Csak JPEG, PNG vagy GIF fájlt tölthet fel!' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'danger', message: 'A fájl mérete nem haladhatja meg a 10MB-ot!' });
      return;
    }

    const formData = new FormData();
    formData.append('File', file); // must match dto.File

    try {
      await api.patch('/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', message: 'Profilkép sikeresen feltöltve!' });

      // Reload image
      const imgResponse = await api.get(`/files/thumbnail/${profile.id}`, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(imgResponse.data);
      setProfileImageUrl(objectUrl);
      setProfileImageError(false);
      setNotificationRefresh((prev) => prev + 1);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Hiba történt a kép feltöltésekor!' });
    }
  };

  const handleRemovePicture = async () => {
    try {
      await api.patch('/profile/delete-profile-image');
      setFeedback({ type: 'success', message: 'Profilkép sikeresen törölve!' });
      setProfileImageUrl(null);
      setProfileImageError(true);
      fetchProfile();
      setNotificationRefresh((prev) => prev + 1);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Hiba történt a kép törlésekor!' });
    }
  };

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
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

  const getRoleDisplay = () => {
    const role = profile?.role || '';
    if (role.toLowerCase() === 'admin') return 'Fleet Administrator';
    if (role.toLowerCase() === 'driver') return 'Driver';
    return role;
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
            <h1 className="page-title">Profile Settings</h1>
            <p className="page-subtitle">Manage your account details and application preferences.</p>
          </div>

          {feedback.message && (
            <Alert variant={feedback.type} className="mb-4">
              {feedback.message}
            </Alert>
          )}

          <Row className="g-4 h-100 align-items-stretch">
            {/* Left Column */}
            <Col lg={4} xl={3} className="h-100 pe-lg-5 pe-xl-6">
              <Row className="g-4">
                {/* Profile Picture Card */}
                <Col xs={12}>
                  <Card className="profile-picture-card h-100">
                    <Card.Body className="p-4">
                      <h3 className="card-title mb-4">Profile Picture</h3>

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
                              <rect x="3" y="7" width="18" height="13" rx="2" fill="none"/>
                              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none"/>
                              <circle cx="12" cy="14" r="3" fill="none"/>
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
                      <Button variant="link" className="w-100 text-danger" onClick={handleRemovePicture}>
                        Remove Picture
                      </Button>

                      <p className="picture-hint text-center mt-3">
                        Must be JPEG, PNG, or GIF and cannot exceed 20MB.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Security Check Card */}
                <Col xs={12}>
                  <Card className="security-card">
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-start gap-2">
                        <div className="security-icon">
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="12" fill="#0d6efd" />
                            <text x="12" y="17" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#fff">?</text>
                          </svg>
                        </div>
                        <div className="security-info">
                          <h4 className="security-title">You need help?</h4>
                          <p className="security-text">
                            Write an email to our support.
                          </p>
                          <Button variant="link" className="p-0" onClick={() => navigate('/help')}>
                            Help Center
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Right Column */}
            <Col lg={8} xl={9} className="h-100 ps-lg-5 ps-xl-6">
              <Row className="g-4">
                {/* Personal Information Card */}
                <Col xs={12}>
                  <Card className="personal-info-card">
                    <Card.Header className="bg-white">
                      <h3 className="card-title mb-0">Personal Information</h3>
                      <p className="card-subtitle mb-0">Update your personal details and contact information.</p>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Form>
                        <Row className="g-3">
                          {!editMode ? (
                            <>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label className="form-label">License Number</Form.Label>
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
                                  <Form.Label className="form-label">License Expiry</Form.Label>
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
                          ) : (
                            <>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label className="form-label">New Password</Form.Label>
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
                                  <Form.Label className="form-label">Confirm Password</Form.Label>
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
                                <Form.Label className="form-label">Full Name</Form.Label>
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
                                <Form.Label className="form-label">Email address</Form.Label>
                                <div className="input-with-icon">
                                  <svg className="input-icon" width="20" height="20" fill="none" stroke="#6c757d" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round"/>
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
                              <Form.Label className="form-label">Phone Number</Form.Label>
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
                              Cancel
                            </Button>
                          )}
                        </div>
                        <div className="ms-auto">
                          {!editMode ? (
                            <Button variant="primary" onClick={() => setEditMode(true)}>
                              Edit
                            </Button>
                          ) : (
                            <Button variant="primary" onClick={handleSave}>
                              Save Changes
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
                      <h3 className="card-title mb-0">Preferences</h3>
                      <p className="card-subtitle mb-0">Customize your interface experience.</p>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="preferences-list">
                        {/* Dark Mode Toggle */}
                        <div className="preference-item">
                          <div className="preference-icon">
                            <svg width="20" height="20" fill="none" stroke="#6c757d" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="preference-content">
                            <h4 className="preference-title">Dark Mode</h4>
                            <p className="preference-description">
                              Adjust the appearance of the application to reduce eye strain in low-light environments.
                            </p>
                          </div>
                          <div className="preference-action">
                            <div className={`toggle-switch ${preferences.darkMode ? 'active' : ''}`} onClick={() => handlePreferenceChange('darkMode')}>
                              <span className="toggle-slider"></span>
                            </div>
                          </div>
                        </div>

                        <div className="preference-divider"></div>

                        {/* Email Notifications Toggle */}
                        <div className="preference-item">
                          <div className="preference-icon">
                            <svg width="20" height="20" fill="none" stroke="#6c757d" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="preference-content">
                            <h4 className="preference-title">Email Notifications</h4>
                            <p className="preference-description">
                              Receive digests about fleet status weekly.
                            </p>
                          </div>
                          <div className="preference-action">
                            <div className={`toggle-switch ${preferences.emailNotifications ? 'active' : ''}`} onClick={() => handlePreferenceChange('emailNotifications')}>
                              <span className="toggle-slider"></span>
                            </div>
                          </div>
                        </div>
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
                          <h4 className="danger-zone-title">Danger Zone</h4>
                          <p className="danger-zone-description">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                        </div>
                        <Button variant="outline-danger" className="delete-account-btn">
                          Delete Account
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
        <div className="page-footer mt-4">
          <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
            <a href="/privacy" className="text-decoration-none text-muted small fw-semibold">PRIVACY POLICY</a>
            <span className="text-muted">•</span>
            <a href="/terms" className="text-decoration-none text-muted small fw-semibold">TERMS OF SERVICE</a>
            <span className="text-muted">•</span>
            <a href="/help" className="text-decoration-none text-muted small fw-semibold">HELP CENTER</a>
          </div>
          <p className="text-center text-muted small mb-0">© 2024 FleetFlow Systems Inc. All rights reserved.</p>
        </div>

      </main>
    </div>
  );
};

export default ProfileSettings;
