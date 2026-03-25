import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Alert, Spinner, Button, Form } from 'react-bootstrap';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/ProfileDetails.css';

const ProfileDetails = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/profile/mine');
      const data = response.data;
      setProfile({
        id: data.id || data.Id,
        fullName: data.fullName || data.FullName,
        email: data.email || data.Email,
        role: data.role || data.Role,
        phone: data.phone || data.Phone,
        licenseNumber: data.licenseNumber || data.LicenseNumber,
        createdAt: data.createdAt || data.CreatedAt,
      });
      setFormData({
        fullName: data.fullName || data.FullName || '',
        email: data.email || data.Email || '',
      });
      // Try to fetch profile image
      if (data.id || data.Id) {
        try {
          const imgResponse = await api.get(`/files/thumbnail/${data.id || data.Id}`, { responseType: 'blob' });
          const objectUrl = URL.createObjectURL(imgResponse.data);
          setProfileImageUrl(objectUrl);
          setProfileImageError(false);
        } catch (imgErr) {
          setProfileImageUrl(null);
          setProfileImageError(true);
        }
      } else {
        setProfileImageUrl(null);
        setProfileImageError(true);
      }
    } catch (err) {
      setError('Hiba történt a profil adatok lekérésekor!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      await api.put('/profile/mine', {
        FullName: formData.fullName,
        Email: formData.email,
      });
      setSuccess('Profil sikeresen frissítve!');
      setEditMode(false);
      fetchProfile();
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
      setError(msg);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      fullName: profile?.fullName || '',
      email: profile?.email || '',
    });
  };

  if (loading) {
    return (
      <div className="profile-details-page">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="main-content">
          <Container className="py-5 text-center">
            <Spinner animation="border" variant="primary" />
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-details-page">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        <Container className="py-4" style={{maxWidth: '1300px'}}>
          <Row className="justify-content-center">
            <Col md={12} lg={12}>
              <Card className="shadow-lg border-0 rounded-4 profile-card">
                <Card.Header className="bg-white rounded-top-4 d-flex align-items-center gap-2 border-bottom" style={{ minHeight: 60 }}>
                  <svg width="32" height="32" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="fs-5 fw-semibold" style={{color: '#2563eb'}}>Profile Details</span>
                </Card.Header>
                <Card.Body className="p-4">
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}

                  <div className="profile-header text-center mb-4">
                    <div className="profile-avatar-large mx-auto mb-3" style={{overflow: 'hidden', width: 96, height: 96, borderRadius: '50%', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      {profileImageUrl && !profileImageError ? (
                        <img src={profileImageUrl} alt="Profilkép" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} onError={() => setProfileImageError(true)} />
                      ) : (
                        <span style={{fontSize: 48, color: '#7c3aed', fontWeight: 700}}>{profile?.fullName?.charAt(0).toUpperCase() || 'P'}</span>
                      )}
                    </div>
                    <h3 className="fw-bold mb-1">{profile?.fullName || 'N/A'}</h3>
                    <p className="text-muted mb-0">{profile?.role || 'N/A'}</p>
                  </div>

                  <div className="profile-divider mb-4"></div>

                  <Form>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Full Name</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="text"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Enter your name"
                            />
                          ) : (
                            <div className="profile-value">{profile?.fullName || 'N/A'}</div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Email</Form.Label>
                          {editMode ? (
                            <Form.Control
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="Enter your email"
                            />
                          ) : (
                            <div className="profile-value">{profile?.email || 'N/A'}</div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Role</Form.Label>
                          <div className="profile-value">{profile?.role || 'N/A'}</div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">License Number</Form.Label>
                          <div className="profile-value">{profile?.licenseNumber || 'N/A'}</div>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>

                  <div className="d-flex justify-content-center mt-4">
                    {editMode ? (
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-secondary"
                          onClick={handleCancel}
                          type="button"
                        >
                          Cancel
                        </Button>
                        <Button
                          className="profile-edit-btn"
                          onClick={handleSave}
                          type="button"
                        >
                          Save Changes
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="profile-edit-btn"
                        onClick={() => setEditMode(true)}
                        type="button"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default ProfileDetails;
