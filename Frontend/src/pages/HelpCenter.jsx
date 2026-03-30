import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import '../styles/HelpCenter.css';
import Footer from '../components/Footer';

const HelpCenter = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationRefresh] = useState(0);

  const handleEmailClick = () => {
    navigator.clipboard.writeText('fleetflow.info@gmail.com').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const faqs = [
    {
      id: 1,
      question: "How do I add a new vehicle to my fleet?",
      answer: "To add a new vehicle, navigate to the Dashboard and click on 'Add Vehicle'. Fill in the required information including vehicle identification number (VIN), license plate, make, model, and year. Once submitted, the vehicle will appear in your fleet list."
    },
    {
      id: 2,
      question: "How does real-time tracking work?",
      answer: "FleetFlow uses GPS technology to track your vehicles in real-time. Each vehicle must have a compatible GPS device installed. Once connected, you can view live locations, routes, and movement history through the dashboard map view."
    },
    {
      id: 3,
      question: "How do I assign a driver to a vehicle?",
      answer: "Go to the Drivers section in your dashboard, select the driver you want to assign, and click 'Assign Vehicle'. Choose the vehicle from the dropdown list and confirm the assignment. You can also do this from the Vehicles section by selecting a vehicle and assigning a driver."
    },
    {
      id: 4,
      question: "How can I set up maintenance alerts?",
      answer: "Navigate to Settings > Maintenance Alerts. You can configure alerts based on mileage intervals, time periods, or specific dates. FleetFlow will automatically notify you via email and dashboard notifications when maintenance is due."
    },
    {
      id: 5,
      question: "Can I export my fleet data?",
      answer: "Yes! Go to Reports > Export Data. You can export vehicle information, trip history, driver logs, and maintenance records in CSV, Excel, or PDF formats. Select the date range and data types you need, then click Export."
    },
    {
      id: 6,
      question: "How do I reset my password?",
      answer: "Click on 'Forgot password?' on the login page. Enter your registered email address, and we'll send you a password reset link. The link is valid for 24 hours. If you don't receive the email, check your spam folder or contact support."
    },
    {
      id: 7,
      question: "What browsers are supported?",
      answer: "FleetFlow works best on modern browsers including Google Chrome (recommended), Mozilla Firefox, Microsoft Edge, and Safari. We recommend keeping your browser updated to the latest version for optimal performance and security."
    },
    {
      id: 8,
      question: "How do I add additional users to my account?",
      answer: "Go to Settings > User Management > Add User. Enter the new user's email address and select their role (Admin, Manager, or Viewer). They will receive an invitation email to set up their account. You can manage user permissions at any time."
    }
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const isAuthenticated = authService.isAuthenticated();
  return (
    <div className="help-page">
      {isAuthenticated && (
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notificationRefresh={notificationRefresh} />
      )}
      <main className="main-content">
        <div className="help-content">
          <Card className="help-card shadow-sm">
            <Card.Body className="p-4 p-md-5">
              {/* Header */}
              <div className="help-header text-center mb-5">
                <Link to="/login" className="text-decoration-none">
                  <div className="logo-section">
                    <img src="/fleetflow_logo.png" alt="FleetFlow Logo" style={{ height: '48px', width: 'auto' }} />
                    <h1 className="logo-title">FleetFlow</h1>
                  </div>
                </Link>
                <h2 className="h3 fw-bold mb-2 mt-4">Help Center</h2>
                <p className="text-muted">Find answers to common questions and get support</p>
              </div>

            {/* Quick Links */}
            <div className="d-flex justify-content-center mb-5">
              <Card 
                className={`help-card text-center p-4 ${copied ? 'border-success bg-light' : 'border'}`}
                style={{ cursor: 'pointer', maxWidth: '300px', width: '100%' }}
                onClick={handleEmailClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailClick()}
              >
                <div className={`rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center ${copied ? 'bg-success' : 'bg-primary'}`} 
                     style={{ width: '56px', height: '56px' }}>
                  <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4 className="h6 fw-semibold mb-2">Email Support</h4>
                <p className="small text-muted mb-0">{copied ? 'Email copied to clipboard!' : 'fleetflow.info@gmail.com'}</p>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="mb-5">
              <h3 className="h5 fw-bold mb-4">Frequently Asked Questions</h3>
              <div className="d-flex flex-column gap-3">
                {faqs.map((faq) => (
                  <Card 
                    key={faq.id} 
                    className={`faq-item border ${expandedFaq === faq.id ? 'border-primary' : ''}`}
                  >
                    <Card.Header 
                      className="bg-white border-0 p-3"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">{faq.question}</span>
                        <svg 
                          className={`text-muted transition ${expandedFaq === faq.id ? 'rotate-180' : ''}`}
                          style={{ 
                            transform: expandedFaq === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                          width="20" 
                          height="20" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Card.Header>
                    {expandedFaq === faq.id && (
                      <Card.Body className="pt-0 px-3 pb-3">
                        <p className="text-muted mb-0 small">{faq.answer}</p>
                      </Card.Body>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <Card className="bg-light border-0 mb-4">
              <Card.Body className="p-4 text-center">
                <h3 className="h6 fw-bold mb-3">Still need help?</h3>
                <p className="text-muted small mb-4">
                  Our support team is available Monday to Friday, 9:00 AM - 6:00 PM (CET)
                </p>
                <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
                  <div className="text-muted small">
                    <strong className="text-dark">Email:</strong>{' '}
                    <a href="mailto:fleetflow.info@gmail.com" className="text-primary text-decoration-none">
                      fleetflow.info@gmail.com
                    </a>
                  </div>
                  <div className="text-muted small">
                    <strong className="text-dark">Phone:</strong>{' '}
                    <a href="tel:+3612345678" className="text-primary text-decoration-none">
                      +36 1 234 5678
                    </a>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Back Link */}
            {!isAuthenticated && (
              <div className="text-center mt-4 pt-3 border-top">
                <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                  ← Back to Login
                </Link>
              </div>
            )}
          </Card.Body>
        </Card>

        <Footer/>
      </div>
      </main>
    </div>
  );
};

export default HelpCenter;
