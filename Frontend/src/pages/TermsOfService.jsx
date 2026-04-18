import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import '../styles/LegalPages.css';
import Footer from '../components/Footer';

const TermsOfService = () => {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationRefresh] = useState(0);
  const isAuthenticated = authService.isAuthenticated();
  return (
    <div className="legal-page">
      {isAuthenticated && (
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notificationRefresh={notificationRefresh} />
      )}
      <main className={`legal-main${isAuthenticated ? ' legal-main--with-sidebar' : ''}`}>
        <div className="legal-content">
          <Card className="legal-card">
            <Card.Body>
              {/* Header */}
              <div className="legal-header">
                <Link to="/login" className="logo-link">
                  <div className="logo-section">
                    <img src="/fleetflow_logo.png" alt="FleetFlow Logo" className="legal-logo-image" />
                    <h1 className="logo-title">FleetFlow</h1>
                  </div>
                </Link>
                <h2 className="page-title">{t('terms.title')}</h2>
                <p className="last-updated">{t('terms.lastUpdated')}</p>
              </div>

            {/* Content */}
            <div className="legal-body">
              <section className="legal-section">
                <h3>{t('terms.section1.title')}</h3>
                <p>
                  {t('terms.section1.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section2.title')}</h3>
                <p>
                  {t('terms.section2.intro')}
                </p>
                <ul>
                  <li>{t('terms.section2.li1')}</li>
                  <li>{t('terms.section2.li2')}</li>
                  <li>{t('terms.section2.li3')}</li>
                  <li>{t('terms.section2.li4')}</li>
                  <li>{t('terms.section2.li5')}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section3.title')}</h3>
                <p>
                  {t('terms.section3.intro')}
                </p>
                <ul>
                  <li>{t('terms.section3.li1')}</li>
                  <li>{t('terms.section3.li2')}</li>
                  <li>{t('terms.section3.li3')}</li>
                  <li>{t('terms.section3.li4')}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section4.title')}</h3>
                <p>
                  {t('terms.section4.intro')}
                </p>
                <ul>
                  <li>{t('terms.section4.li1')}</li>
                  <li>{t('terms.section4.li2')}</li>
                  <li>{t('terms.section4.li3')}</li>
                  <li>{t('terms.section4.li4')}</li>
                  <li>{t('terms.section4.li5')}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section5.title')}</h3>
                <p>
                  {t('terms.section5.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section6.title')}</h3>
                <p>
                  {t('terms.section6.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section7.title')}</h3>
                <p>
                  {t('terms.section7.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section8.title')}</h3>
                <p>
                  {t('terms.section8.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section9.title')}</h3>
                <p>
                  {t('terms.section9.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('terms.section10.title')}</h3>
                <p>
                  {t('terms.section10.intro')}
                </p>
                <p className="contact-info">
                  <strong>{t('terms.contact.company')}</strong><br />
                  {t('terms.contact.email')}<br />
                  {t('terms.contact.address')}
                </p>
              </section>
            </div>

            {/* Back Link */}
            {!isAuthenticated && (
              <div className="legal-footer">
                <Link to="/login" className="back-link">← Back to Login</Link>
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

export default TermsOfService;
