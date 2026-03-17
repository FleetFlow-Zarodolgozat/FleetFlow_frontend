import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
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
                  <img src="/fleetflow_logo.png" alt="FleetFlow Logo" style={{ height: '48px', width: 'auto' }} />
                  <h1 className="logo-title">FleetFlow</h1>
                </div>
              </Link>
              <h2 className="page-title">Forgot Password?</h2>
              <p className="page-subtitle">
                No worries, we'll send you reset instructions.
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
                <h3>Check your email</h3>
                <p>
                  We sent a password reset link to<br />
                  <strong>{email}</strong>
                </p>
                <Button
                  variant="primary"
                  className="w-100 reset-btn"
                  onClick={() => window.location.href = 'mailto:'}
                >
                  Open email app
                </Button>
                <p className="resend-text">
                  Didn't receive the email?{' '}
                  <button 
                    className="resend-link"
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                    }}
                  >
                    Click to resend
                  </button>
                </p>
              </div>
            ) : (
              // Form State
              <>
                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                    {error}
                  </Alert>
                )}

                {/* Forgot Password Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
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
                    {loading ? 'Sending...' : 'Reset Password'}
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
                Back to login
              </Link>
            </div>
          </Card.Body>
        </Card>

        {/* Page Footer */}
        <div className="page-footer mt-4">
          <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
            <Link to="/privacy" className="text-decoration-none text-muted small fw-semibold">PRIVACY POLICY</Link>
            <span className="text-muted">•</span>
            <Link to="/terms" className="text-decoration-none text-muted small fw-semibold">TERMS OF SERVICE</Link>
            <span className="text-muted">•</span>
            <Link to="/help" className="text-decoration-none text-muted small fw-semibold">HELP CENTER</Link>
          </div>
          <p className="text-center text-muted small mb-0">© 2024 FleetFlow Systems Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
