import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import '../styles/HelpCenter.css';
import Footer from '../components/Footer';

const HelpCenter = () => {
  const { t } = useLanguage();
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
      question: t('help.faq.1.q'),
      answer: t('help.faq.1.a')
    },
    {
      id: 2,
      question: t('help.faq.2.q'),
      answer: t('help.faq.2.a')
    },
    {
      id: 3,
      question: t('help.faq.3.q'),
      answer: t('help.faq.3.a')
    },
    {
      id: 4,
      question: t('help.faq.4.q'),
      answer: t('help.faq.4.a')
    },
    {
      id: 5,
      question: t('help.faq.5.q'),
      answer: t('help.faq.5.a')
    },
    {
      id: 6,
      question: t('help.faq.6.q'),
      answer: t('help.faq.6.a')
    },
    {
      id: 7,
      question: t('help.faq.7.q'),
      answer: t('help.faq.7.a')
    },
    {
      id: 8,
      question: t('help.faq.8.q'),
      answer: t('help.faq.8.a')
    },
    {
      id: 9,
      question: t('help.faq.9.q'),
      answer: t('help.faq.9.a')
    },
    {
      id: 10,
      question: t('help.faq.10.q'),
      answer: t('help.faq.10.a')
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
                <h2 className="h3 fw-bold mb-2 mt-4">{t('help.title')}</h2>
                <p className="text-muted">{t('help.subtitle')}</p>
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
                <h4 className="h6 fw-semibold mb-2">{t('help.email.title')}</h4>
                <p className="small text-muted mb-0">{copied ? t('help.email.copied') : t('help.email.text')}</p>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="mb-5">
              <h3 className="h5 fw-bold mb-4">{t('help.faq.heading')}</h3>
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
                <h3 className="h6 fw-bold mb-3">{t('help.contact.title')}</h3>
                <p className="text-muted small mb-4">
                  {t('help.contact.subtitle')}
                </p>
                <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
                  <div className="text-muted small">
                    <strong className="text-dark">{t('help.contact.email')}:</strong>{' '}
                    <a href="mailto:fleetflow.info@gmail.com" className="text-primary text-decoration-none">
                      fleetflow.info@gmail.com
                    </a>
                  </div>
                  <div className="text-muted small">
                    <strong className="text-dark">{t('help.contact.phone')}:</strong>{' '}
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
