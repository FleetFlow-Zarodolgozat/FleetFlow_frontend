import { Container, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-content">
        <Card className="legal-card">
          <Card.Body>
            {/* Header */}
            <div className="legal-header">
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
              <h2 className="page-title">Privacy Policy</h2>
              <p className="last-updated">Last updated: March 9, 2026</p>
            </div>

            {/* Content */}
            <div className="legal-body">
              <section className="legal-section">
                <h3>1. Introduction</h3>
                <p>
                  FleetFlow Systems Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fleet management service.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Information We Collect</h3>
                <p>We collect information that you provide directly to us, including:</p>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, phone number, company name, and password</li>
                  <li><strong>Vehicle Data:</strong> Vehicle identification numbers, license plates, and vehicle specifications</li>
                  <li><strong>Location Data:</strong> GPS coordinates and route information from tracked vehicles</li>
                  <li><strong>Usage Data:</strong> Information about how you interact with our service</li>
                  <li><strong>Driver Information:</strong> Driver names, license information, and driving records</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. How We Use Your Information</h3>
                <p>We use the collected information for various purposes:</p>
                <ul>
                  <li>To provide and maintain our fleet management service</li>
                  <li>To notify you about changes to our service</li>
                  <li>To provide customer support</li>
                  <li>To gather analysis or valuable information to improve our service</li>
                  <li>To monitor the usage of our service</li>
                  <li>To detect, prevent, and address technical issues</li>
                  <li>To provide you with news and general information about our services</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>4. Data Sharing and Disclosure</h3>
                <p>We may share your information in the following situations:</p>
                <ul>
                  <li><strong>With Service Providers:</strong> We may share your information with third-party vendors who perform services on our behalf</li>
                  <li><strong>For Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition</li>
                  <li><strong>With Your Consent:</strong> We may disclose your information for any other purpose with your consent</li>
                  <li><strong>Legal Requirements:</strong> If required by law or in response to valid requests by public authorities</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>5. Data Security</h3>
                <p>
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul>
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and audits</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Employee training on data protection</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>6. Data Retention</h3>
                <p>
                  We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements. Vehicle tracking data is retained for a maximum of 2 years unless otherwise required by law.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Your Rights</h3>
                <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                <ul>
                  <li><strong>Access:</strong> Request access to your personal data</li>
                  <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Objection:</strong> Object to processing of your personal data</li>
                  <li><strong>Restriction:</strong> Request restriction of processing</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>8. Cookies and Tracking</h3>
                <p>
                  We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
                </p>
              </section>

              <section className="legal-section">
                <h3>9. Children's Privacy</h3>
                <p>
                  Our service is not intended for use by children under the age of 18. We do not knowingly collect personal information from children under 18. If we discover that a child under 18 has provided us with personal information, we will delete such information immediately.
                </p>
              </section>

              <section className="legal-section">
                <h3>10. Changes to This Policy</h3>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section className="legal-section">
                <h3>11. Contact Us</h3>
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <p className="contact-info">
                  <strong>FleetFlow Systems Inc.</strong><br />
                  Data Protection Officer<br />
                  Email: fleetflow.info@gmail.com<br />
                  Address: 123 Fleet Street, Budapest, Hungary
                </p>
              </section>
            </div>

            {/* Back Link */}
            <div className="legal-footer">
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

export default PrivacyPolicy;
