import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/HelpCenter.css';

const HelpCenter = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="help-page">
      <div className="help-content">
        <Card className="help-card">
          <Card.Body>
            {/* Header */}
            <div className="help-header">
              <Link to="/login" className="logo-link">
                <div className="logo-section">
                  <div className="logo-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect width="48" height="48" rx="12" fill="#0d6efd"/>
                      <path d="M14 18L24 12L34 18V30L24 36L14 30V18Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 18L24 24L34 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M24 24V36" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h1 className="logo-title">FleetFlow</h1>
                </div>
              </Link>
              <h2 className="page-title">Help Center</h2>
              <p className="page-subtitle">Find answers to common questions and get support</p>
            </div>

            {/* Quick Links */}
            <div className="quick-links">
              <div 
                className={`quick-link-card ${copied ? 'copied' : ''}`}
                onClick={handleEmailClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailClick()}
              >
                <div className="quick-link-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h4>Email Support</h4>
                <p>{copied ? 'Email copied to clipboard!' : 'fleetflow.info@gmail.com'}</p>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
              <h3 className="section-title">Frequently Asked Questions</h3>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <div 
                    key={faq.id} 
                    className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                  >
                    <button 
                      className="faq-question"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <span>{faq.question}</span>
                      <svg 
                        className="faq-icon" 
                        width="20" 
                        height="20" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="contact-section">
              <h3 className="section-title">Still need help?</h3>
              <p className="contact-text">
                Our support team is available Monday to Friday, 9:00 AM - 6:00 PM (CET)
              </p>
              <div className="contact-methods">
                <div className="contact-method">
                  <strong>Email:</strong>
                  <a href="mailto:fleetflow.info@gmail.com">fleetflow.info@gmail.com</a>
                </div>
                <div className="contact-method">
                  <strong>Phone:</strong>
                  <a href="tel:+3612345678">+36 1 234 5678</a>
                </div>
              </div>
            </div>

            {/* Back Link */}
            <div className="help-footer">
              <Link to="/login" className="back-link">← Back to Login</Link>
            </div>
          </Card.Body>
        </Card>

        {/* Page Footer */}
        <div className="page-footer">
          <div className="footer-links">
            <Link to="/privacy">PRIVACY POLICY</Link>
            <Link to="/terms">TERMS OF SERVICE</Link>
            <Link to="/help">HELP CENTER</Link>
          </div>
          <p className="copyright">© 2024 FleetFlow Systems Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
