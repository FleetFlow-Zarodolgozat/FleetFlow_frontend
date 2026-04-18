import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, Form, Button } from 'react-bootstrap';
import Footer from '../components/Footer';
import CustomModal from '../components/CustomModal';
import '../styles/SetPassword.css';

const SetPassword = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    // Ha hiányzik a token, azonnal jelezzük a felhasználónak.
    if (!token) {
      setTokenMissing(true);
    }
  }, [token]);

  // Alap jelszóvalidáció: hossz és egyezés ellenőrzése.
  const validatePassword = () => {
    if (password.length < 5) {
      setErrorModal({ open: true, message: 'Password must be at least 5 characters long.' });
      return false;
    }
    if (password !== confirmPassword) {
      setErrorModal({ open: true, message: 'Passwords do not match.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Token nélkül nem indítunk mentést, csak figyelmeztetjük a felhasználót.
    if (!token) {
      setErrorModal({ open: true, message: t('setpwd.invalidMsg') });
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await authService.setPassword(token, password, confirmPassword);
      setSuccessModal({ open: true, message: t('setpwd.successMsg') });
    } catch (err) {
      setErrorModal({
        open: true,
        message: err.response?.data || 'Failed to set password. The link may have expired.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenMissing) {
      setErrorModal({ open: true, message: t('setpwd.invalidMsg') });
    }
  }, [tokenMissing, t]);

  return (
    <div className="set-password-page">
      <div className="set-password-content">
        <Card className="set-password-card">
          <Card.Body>
            {/* Logo and Header */}
            <div className="set-password-header">
              <div className="logo-section">
                <img src="/fleetflow_logo.png" alt="FleetFlow Logo" className="set-password-logo" />
                <h1 className="logo-title">FleetFlow</h1>
              </div>
              <div className="password-icon">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#0d6efd">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="page-title">{t('setpwd.title')}</h2>
              <p className="page-subtitle">
                {t('setpwd.subtitle')}
              </p>
            </div>

            {tokenMissing && (
              <div className="set-password-recovery">
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => navigate('/forgot-password')}
                >
                  {t('setpwd.requestNewLink')}
                </Button>
                <div className="card-footer-text">
                  <p>
                    {t('setpwd.rememberPassword')}{' '}
                    <a href="/login">{t('setpwd.backToSignIn')}</a>
                  </p>
                </div>
              </div>
            )}

            {/* Set Password Form */}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>{t('setpwd.newPassword')}</Form.Label>
                <div className="password-input-wrapper">
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('setpwd.newPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || tokenMissing}
                    minLength={5}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                      </svg>
                    )}
                  </button>
                </div>
                <Form.Text className="text-muted">
                  {t('setpwd.passwordHint')}
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>{t('setpwd.confirmPassword')}</Form.Label>
                <div className="password-input-wrapper">
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('setpwd.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || tokenMissing}
                    minLength={5}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                disabled={loading || tokenMissing}
                className="w-100"
              >
                {loading ? t('setpwd.setting') : t('setpwd.submit')}
              </Button>
            </Form>

            {/* Footer */}
            <div className="card-footer-text">
              <p>
                {t('setpwd.rememberPassword')}{' '}
                <a href="/login">{t('setpwd.backToSignIn')}</a>
              </p>
            </div>
          </Card.Body>
        </Card>

        <Footer />
      </div>
      <CustomModal
        isOpen={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        title={t('common.errorTitle')}
        primaryAction={{
          label: t('common.ok'),
          onClick: () => setErrorModal({ open: false, message: '' }),
        }}
      >
        <p className="mb-0">{errorModal.message}</p>
      </CustomModal>
      <CustomModal
        isOpen={successModal.open}
        onClose={() => setSuccessModal({ open: false, message: '' })}
        title={t('setpwd.successTitle')}
        primaryAction={{
          label: t('setpwd.goToSignIn'),
          onClick: () => navigate('/login'),
        }}
      >
        <p className="mb-0">{successModal.message}</p>
      </CustomModal>
    </div>
  );
};

export default SetPassword;
