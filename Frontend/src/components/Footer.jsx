import React from "react";

const Footer = () => {
  return (
    <div className="page-footer mt-4">
      <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
        <a href="/privacy" className="text-decoration-none text-muted small fw-semibold">PRIVACY POLICY</a>
        <span className="text-muted">•</span>
        <a href="/terms" className="text-decoration-none text-muted small fw-semibold">TERMS OF SERVICE</a>
        <span className="text-muted">•</span>
        <a href="/help" className="text-decoration-none text-muted small fw-semibold">HELP CENTER</a>
      </div>
      <p className="text-center text-muted small mb-0">© 2026 FleetFlow Systems Inc. All rights reserved.</p>
    </div>
  );
};

export default Footer;
