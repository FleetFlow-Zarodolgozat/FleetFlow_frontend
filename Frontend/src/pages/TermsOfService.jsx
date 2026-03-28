import { Container, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import '../styles/LegalPages.css';

const TermsOfService = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationRefresh] = useState(0);
  const isAuthenticated = authService.isAuthenticated();
  return (
    <div className="legal-page">
      {isAuthenticated && (
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notificationRefresh={notificationRefresh} />
      )}
      <main className="main-content">
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
                <h2 className="page-title">Terms of Service</h2>
                <p className="last-updated">Last updated: March 9, 2026</p>
              </div>

            {/* Content */}
            <div className="legal-body">
              <section className="legal-section">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By accessing and using FleetFlow's fleet management services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Description of Service</h3>
                <p>
                  FleetFlow provides a comprehensive fleet management platform that enables businesses to track, manage, and optimize their vehicle fleets. Our services include but are not limited to:
                </p>
                <ul>
                  <li>Real-time vehicle tracking and monitoring</li>
                  <li>Fleet analytics and reporting</li>
                  <li>Driver management and scheduling</li>
                  <li>Maintenance tracking and alerts</li>
                  <li>Route optimization</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. User Accounts</h3>
                <p>
                  To access certain features of the service, you must register for an account. You agree to:
                </p>
                <ul>
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>4. Acceptable Use</h3>
                <p>
                  You agree not to use the service to:
                </p>
                <ul>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Transmit harmful or malicious code</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with the proper functioning of the service</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>5. Data and Privacy</h3>
                <p>
                  Your use of FleetFlow is also governed by our Privacy Policy. By using our service, you consent to the collection and use of your data as described in our <Link to="/privacy">Privacy Policy</Link>.
                </p>
              </section>

              <section className="legal-section">
                <h3>6. Intellectual Property</h3>
                <p>
                  All content, features, and functionality of the FleetFlow service, including but not limited to text, graphics, logos, and software, are the exclusive property of FleetFlow Systems Inc. and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Limitation of Liability</h3>
                <p>
                  FleetFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our total liability shall not exceed the amount paid by you for the service in the twelve months preceding the claim.
                </p>
              </section>

              <section className="legal-section">
                <h3>8. Termination</h3>
                <p>
                  We reserve the right to terminate or suspend your account and access to the service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
                </p>
              </section>

              <section className="legal-section">
                <h3>9. Changes to Terms</h3>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service. Your continued use of the service after such modifications constitutes your acceptance of the updated terms.
                </p>
              </section>

              <section className="legal-section">
                <h3>10. Contact Information</h3>
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="contact-info">
                  <strong>FleetFlow Systems Inc.</strong><br />
                  Email: fleetflow.info@gmail.com<br />
                  Address: 123 Fleet Street, Budapest, Hungary
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
      </main>
    </div>
  );
};

export default TermsOfService;
