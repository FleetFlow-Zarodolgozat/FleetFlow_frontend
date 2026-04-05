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
      question: "How do I log a new trip?",
      answer: "Go to the 'Log New Trip' page from your dashboard. Fill in the departure and arrival date/time, start and end location, distance (km), and odometer readings. You can click anywhere on the map to automatically fill in the location fields — it will extract the city and street name. Once all fields are filled in, click 'Log Trip' to save."
    },
    {
      id: 2,
      question: "How do I use the map to select trip locations?",
      answer: "On the 'Log New Trip' page, there is an interactive map. First select which field you want to fill (Departure or Arrival) by clicking the corresponding input field — it will be highlighted in blue. Then click on the desired location on the map. The city and street name will be automatically filled into the selected field."
    },
    {
      id: 3,
      question: "How do I add a fuel log entry?",
      answer: "Navigate to 'Fuel Logs' and click 'Add New Fuel Log'. Fill in the date, fuel station name, number of liters refueled, and the total cost. The system will automatically associate the entry with your assigned vehicle. After saving, the entry will appear in your fuel log table and will be included in the consumption statistics."
    },
    {
      id: 4,
      question: "How do I submit a service request?",
      answer: "Go to 'Service Requests' and click 'Add New Request'. Enter a title describing the issue, select a scheduled date, and provide any additional notes or estimated cost. The request will be sent to the administrator for review. You can track the status of your request (Requested → Approved / Rejected → Closed) in the Service Requests list."
    },
    {
      id: 5,
      question: "What do the service request statuses mean?",
      answer: "REQUESTED: the request has been submitted and is awaiting admin review. APPROVED: the admin has approved the request and maintenance is being scheduled. DRIVER_COST: the driver has reported the actual cost. CLOSED: the service has been completed and the case is closed. REJECTED: the admin has rejected the request."
    },
    {
      id: 6,
      question: "Where can I see my assigned vehicle?",
      answer: "Your assigned vehicle information is displayed on the Driver Dashboard — look for the 'My Vehicle' card which shows the license plate, make/model, and current mileage. You can also see your vehicle's license plate when logging trips and fuel entries."
    },
    {
      id: 7,
      question: "How is fuel consumption calculated?",
      answer: "The average consumption (L/100km) on the Fuel Logs page is calculated automatically from your recorded trips and fuel log entries. It divides the total liters refueled by the total kilometers driven across all your trips and fuel logs. The more data you enter, the more accurate this figure becomes."
    },
    {
      id: 8,
      question: "How do I update my profile or profile picture?",
      answer: "Go to 'Profile Settings' from the sidebar. You can update your phone number and driver's license details here. To change your profile picture, click on the avatar image at the top of the settings page and upload a new photo. Changes are saved immediately after clicking 'Save Changes'."
    },
    {
      id: 9,
      question: "How do I reset my password?",
      answer: "On the login page, click 'Forgot password?'. Enter your registered email address and you will receive a password reset link. Click the link in the email and set a new password. If you do not receive the email, check your spam/junk folder or contact support at fleetflow.info@gmail.com."
    },
    {
      id: 10,
      question: "How do notifications work?",
      answer: "The bell icon in the sidebar shows the number of unread notifications. Notifications are sent for events such as an admin approving or rejecting your service request, or other system messages. Click the bell icon to open the Notifications page and view all your messages."
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
      <main className={`help-main${isAuthenticated ? ' help-main--with-sidebar' : ''}`}>
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
