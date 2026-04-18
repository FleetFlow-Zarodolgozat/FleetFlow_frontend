import { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';
import CustomModal from '../components/CustomModal';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // A backend egy reset e-mail küldést indít; siker esetén külön success nézetre váltunk.
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      // Minden hiba ugyanabba az állapotba kerül, amit később a CustomModal jelenít meg.
      setError(
        err.response?.data?.message || 
        'Failed to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-content">
        <Card className="forgot-password-card">
          <Card.Body>
            {/* Logo and Header */}
            <div className="forgot-password-header">
              <Link to="/login" className="logo-link">
                <div className="logo-section">
                  <img src="/fleetflow_logo.png" alt="FleetFlow Logo" className="forgot-logo-img" />
                  <h1 className="logo-title">FleetFlow</h1>
                </div>
              </Link>
              <h2 className="page-title">{t('forgot.title')}</h2>
              <p className="page-subtitle">
                {t('forgot.subtitle')}
              </p>
            </div>

            {success ? (
              // Success State
              <div className="success-message">
                <div className="success-icon">
                  <svg width="48" height="48" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>{t('forgot.checkEmail')}</h3>
                <p>
                  {t('forgot.sentTo')}<br />
                  <strong>{email}</strong>
                </p>
                <Button
                  variant="primary"
                  className="w-100 reset-btn"
                  onClick={() => window.location.href = 'mailto:'}
                >
                  {t('forgot.openEmailApp')}
                </Button>
                <p className="resend-text">
                  {t('forgot.didntReceive')}{' '}
                  <button 
                    className="resend-link"
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                  >
                    {t('forgot.clickResend')}
                  </button>
                </p>
              </div>
            ) : (
              // Form State
              <>
                {/* Forgot Password Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label>{t('forgot.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder={t('forgot.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="w-100 reset-btn mb-4"
                  >
                    {loading ? t('forgot.sending') : t('forgot.submit')}
                  </Button>
                </Form>
              </>
            )}

            {/* Back to Login */}
            <div className="back-to-login mt-3 text-center">
              <Link to="/login" className="back-link">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('forgot.backToLogin')}
              </Link>
            </div>
          </Card.Body>
        </Card>

        <Footer />

        <CustomModal
          isOpen={Boolean(error)}
          onClose={() => setError('')}
          title={t('common.errorTitle')}
          primaryAction={{
            label: t('common.ok'),
            onClick: () => setError(''),
          }}
        >
          <p className="mb-0">{error}</p>
        </CustomModal>
      </div>
    </div>
  );
};

export default ForgotPassword;
