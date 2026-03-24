
import React, { useState } from 'react';
import { Button, Card, Form, Container, Row, Col, Alert } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/DriverDashboard.css';
import '../styles/ServiceRequests.css';

const AddServiceRequest = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverCost, setDriverCost] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!title) {
      setError('Title is required');
      return;
    }
    // Add more validation as needed
    try {
      const payload = {
        Title: title,
        Description: description,
      };
      await api.post('/service-requests', payload);
      setSuccess(true);
      setTimeout(() => navigate(-1), 1200);
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
    }
  };

  return (
    <div className="driver-dashboard">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-content">
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <Card className="shadow-lg border-0 rounded-4 add-service-request-purple-outline">
                <Card.Header className="bg-white rounded-top-4 d-flex align-items-center gap-2 border-bottom" style={{minHeight: 60}}>
                  <svg width="32" height="32" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="fs-5 fw-semibold text-purple">New Service Request</span>
                </Card.Header>
                <Card.Body className="p-4">
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">Saved successfully!</Alert>}
                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3 align-items-end">
                      <Col xs={12} md={12} lg={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-start w-100">Title</Form.Label>
                          <Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Oil change needed" />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={12} lg={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold text-start w-100">Description <span className="text-muted">(optional)</span></Form.Label>
                          <Form.Control as="textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue..." />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-between mt-4">
                      <Button variant="outline-secondary" onClick={() => navigate(-1)} type="button">Back</Button>
                      <Button
                        className="details-btn-custom"
                        style={{background:'#fff',color:'#7c3aed',borderColor:'#7c3aed',fontWeight:'600',minWidth:'120px',borderRadius:'8px',border:'1.5px solid #7c3aed'}}
                        type="submit"
                      >
                        Create Request
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};
export default AddServiceRequest;
