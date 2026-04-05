import { Container, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import '../styles/LegalPages.css';
import { useState } from 'react';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
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
                    <img src="/fleetflow_logo.png" alt="FleetFlow Logo" style={{ height: '48px', width: 'auto' }} />
                    <h1 className="logo-title">FleetFlow</h1>
                  </div>
                </Link>
                <h2 className="page-title">{t('privacy.title')}</h2>
                <p className="last-updated">{t('privacy.lastUpdated')}</p>
              </div>

            {/* Content */}
            <div className="legal-body">
              <section className="legal-section">
                <h3>{t('privacy.section1.title')}</h3>
                <p>
                  {t('privacy.section1.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section2.title')}</h3>
                <p>{t('privacy.section2.intro')}</p>
                <ul>
                  <li><strong>{t('privacy.section2.li1').split(':')[0]}:</strong> {t('privacy.section2.li1').split(':')[1]}</li>
                  <li><strong>{t('privacy.section2.li2').split(':')[0]}:</strong> {t('privacy.section2.li2').split(':')[1]}</li>
                  <li><strong>{t('privacy.section2.li3').split(':')[0]}:</strong> {t('privacy.section2.li3').split(':')[1]}</li>
                  <li><strong>{t('privacy.section2.li4').split(':')[0]}:</strong> {t('privacy.section2.li4').split(':')[1]}</li>
                  <li><strong>{t('privacy.section2.li5').split(':')[0]}:</strong> {t('privacy.section2.li5').split(':')[1]}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section3.title')}</h3>
                <p>{t('privacy.section3.intro')}</p>
                <ul>
                  <li>{t('privacy.section3.li1')}</li>
                  <li>{t('privacy.section3.li2')}</li>
                  <li>{t('privacy.section3.li3')}</li>
                  <li>{t('privacy.section3.li4')}</li>
                  <li>{t('privacy.section3.li5')}</li>
                  <li>{t('privacy.section3.li6')}</li>
                  <li>{t('privacy.section3.li7')}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section4.title')}</h3>
                <p>{t('privacy.section4.intro')}</p>
                <ul>
                  <li><strong>{t('privacy.section4.li1').split(':')[0]}:</strong> {t('privacy.section4.li1').split(':')[1]}</li>
                  <li><strong>{t('privacy.section4.li2').split(':')[0]}:</strong> {t('privacy.section4.li2').split(':')[1]}</li>
                  <li><strong>{t('privacy.section4.li3').split(':')[0]}:</strong> {t('privacy.section4.li3').split(':')[1]}</li>
                  <li><strong>{t('privacy.section4.li4').split(':')[0]}:</strong> {t('privacy.section4.li4').split(':')[1]}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section5.title')}</h3>
                <p>{t('privacy.section5.intro')}</p>
                <ul>
                  <li>{t('privacy.section5.li1')}</li>
                  <li>{t('privacy.section5.li2')}</li>
                  <li>{t('privacy.section5.li3')}</li>
                  <li>{t('privacy.section5.li4')}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section6.title')}</h3>
                <p>
                  {t('privacy.section6.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section7.title')}</h3>
                <p>{t('privacy.section7.intro')}</p>
                <ul>
                  <li><strong>{t('privacy.section7.li1').split(':')[0]}:</strong> {t('privacy.section7.li1').split(':')[1]}</li>
                  <li><strong>{t('privacy.section7.li2').split(':')[0]}:</strong> {t('privacy.section7.li2').split(':')[1]}</li>
                  <li><strong>{t('privacy.section7.li3').split(':')[0]}:</strong> {t('privacy.section7.li3').split(':')[1]}</li>
                  <li><strong>{t('privacy.section7.li4').split(':')[0]}:</strong> {t('privacy.section7.li4').split(':')[1]}</li>
                  <li><strong>{t('privacy.section7.li5').split(':')[0]}:</strong> {t('privacy.section7.li5').split(':')[1]}</li>
                  <li><strong>{t('privacy.section7.li6').split(':')[0]}:</strong> {t('privacy.section7.li6').split(':')[1]}</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section8.title')}</h3>
                <p>
                  {t('privacy.section8.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section9.title')}</h3>
                <p>
                  {t('privacy.section9.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section10.title')}</h3>
                <p>
                  {t('privacy.section10.text')}
                </p>
              </section>

              <section className="legal-section">
                <h3>{t('privacy.section11.title')}</h3>
                <p>
                  {t('privacy.section11.intro')}
                </p>
                <p className="contact-info">
                  <strong>{t('privacy.contact.company')}</strong><br />
                  {t('privacy.contact.position')}<br />
                  {t('privacy.contact.email')}<br />
                  {t('privacy.contact.address')}
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
  );};

export default PrivacyPolicy;
