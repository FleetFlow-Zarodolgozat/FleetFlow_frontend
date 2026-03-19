
import React from 'react';
import { Card, Row, Col, Button, Alert } from 'react-bootstrap';
import '../styles/ServiceRequestDetails.css';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const ServiceRequestDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const request = location.state?.request || {};

  return (
    <div className="service-request-details-dashboard">
      <div className="main-content">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4 service-request-details-orange-outline">
              <Card.Header className="bg-white rounded-top-4 d-flex align-items-center gap-2 border-bottom" style={{minHeight: 60}}>
                <svg width="32" height="32" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="fs-5 fw-semibold text-purple">Edit Service Details</span>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3 align-items-end">
                  <Col xs={12} md={12} lg={6}>
                    <div className="service-request-details-row">
                      <span className="service-request-details-label">Title</span>
                      <span className="service-request-details-value">{request.title}</span>
                    </div>
                  </Col>
                  <Col xs={12} md={12} lg={6}>
                    <div className="service-request-details-row">
                      <span className="service-request-details-label">Status</span>
                      <span className="service-request-details-value">{request.status}</span>
                    </div>
                  </Col>
                  <Col xs={12} md={12} lg={6}>
                    <div className="service-request-details-row">
                      <span className="service-request-details-label">License Plate</span>
                      <span className="service-request-details-value">{request.licensePlate}</span>
                    </div>
                  </Col>
                  <Col xs={12} md={12} lg={6}>
                    <div className="service-request-details-row">
                      <span className="service-request-details-label">Scheduled</span>
                      <span className="service-request-details-value">{request.scheduledStart}</span>
                    </div>
                  </Col>
                  <Col xs={12} md={12} lg={12}>
                    <div className="service-request-details-row">
                      <span className="service-request-details-label">Description</span>
                      <span className="service-request-details-value">{request.description}</span>
                    </div>
                  </Col>
                  <Col xs={12} md={12} lg={6}>
                    <div className="service-request-details-row">
                      <span className="service-request-details-label">Driver Cost</span>
                      <span className="service-request-details-value">{request.driverReportCost} Ft</span>
                    </div>
                  </Col>
                </Row>
                <div className="d-flex justify-content-between mt-4">
                  <Button variant="outline-secondary" onClick={() => navigate(-1)} type="button">Back</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ServiceRequestDetails;
