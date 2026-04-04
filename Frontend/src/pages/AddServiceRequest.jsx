import React, { useState, useEffect } from 'react';
import { Button, Card, Container, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/AddFuelLog.css';
import '../styles/AddServiceRequest.css';
import Footer from '../components/Footer';

const AddServiceRequest = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Removed file upload and other fields
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed file upload and other fields
  const [pendingRequests, setPendingRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/service-requests/mine', { params: { page: 1, pageSize: 50 } });
        const payload = res.data || {};
        const all = Array.isArray(payload.data) ? payload.data : [];
        const nonCompleted = all
          .filter(r => (r.status || r.Status || '').toLowerCase() !== 'completed')
          .slice(0, 2);
        setPendingRequests(nonCompleted);
      } catch {
        // silently fail
      }
    };
    fetchPending();
  }, []);

  // Removed file upload and other fields

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!title) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        Title: title,
        Description: description,
      };
      await api.post('/service-requests', payload);
      setSuccess(true);
      setTimeout(() => navigate('/service-requests'), 1200);
    } catch (err) {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-content add-fuel-log-page add-service-request-page">
        <Container className="px-4 py-4 asr-container">

          {/* Header */}
          <div className="add-fuel-header mb-4">
            <h1 className="add-fuel-title">New Service Request</h1>
            <p className="add-fuel-subtitle">Submit a new service request for your vehicle</p>
          </div>

          <Row className="g-4 justify-content-center">
            {/* Left Column - Form */}
            <Col lg={7} xl={6}>
              <Card className="fuel-form-card border-0 shadow-sm">
                <Card.Body className="p-4 p-md-5">
                  {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                  {success && <Alert variant="success" className="mb-3">Saved successfully!</Alert>}

                  <Form onSubmit={handleSubmit}>
                    <Row className="g-4">
                      {/* Title */}
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">
                            Title <span className="asr-required">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Oil change needed"
                            className="form-control-lg"
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Description */}
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="form-label">Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={5}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the service needed..."
                            className="form-control-lg"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Action Buttons */}
                    <div className="form-actions mt-5">
                      <Button
                        type="submit"
                        className="btn-save asr-submit-btn"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Create Request
                          </>
                        )}
                      </Button>
                      <Button
                        variant="light"
                        type="button"
                        className="btn-cancel"
                        onClick={() => navigate('/service-requests')}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column - Sidebar cards */}
            <Col lg={5} xl={4}>
              {/* Pro Tip Card */}
              <Card className="pro-tip-card border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <div className="pro-tip-header mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#7c3aed" className="me-2">
                      <path d="M9 18h6a2 2 0 0 1 2 2v2H7v-2a2 2 0 0 1 2-2z" />
                      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26C17.81 13.47 19 11.38 19 9a7 7 0 0 0-7-7z" />
                    </svg>
                    <span className="pro-tip-title">Pro Tip</span>
                  </div>
                  <p className="pro-tip-text">
                    Other details may be added after an admin accepted your request.
                  </p>
                </Card.Body>
              </Card>

              {/* Pending Requests Card */}
              <Card className="recent-logs-card border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="recent-logs-header mb-3">
                    <span className="recent-logs-title">Pending Requests</span>
                  </div>
                  {pendingRequests.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>No pending requests.</p>
                  ) : (
                    <div className="recent-logs-list">
                      {pendingRequests.map(r => (
                        <div key={r.id || r.Id} className="recent-log-item">
                          <div style={{ flex: 1 }}>
                            <div className="recent-log-date">{r.title || r.Title}</div>
                          </div>
                          <span className={`asr-status-badge asr-status-${(r.status || r.Status || '').toLowerCase().replace('_', '-')}`}>
                            {r.status || r.Status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <a href="/service-requests" className="view-all-link">View all requests</a>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default AddServiceRequest;
