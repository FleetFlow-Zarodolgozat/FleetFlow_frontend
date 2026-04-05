import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hu', label: 'HU' },
  { code: 'de', label: 'DE' },
];

const Footer = () => {
  const { t, language, setLanguage } = useLanguage();
  const isLoggedIn = !!localStorage.getItem('authToken');

  return (
    <div className="page-footer mt-4">
      {/* Language Switcher — only shown when not logged in */}
      {!isLoggedIn && <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
        {LANGUAGES.map((lang, idx) => (
          <React.Fragment key={lang.code}>
            <button
              onClick={() => setLanguage(lang.code)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '13px',
                fontWeight: language === lang.code ? '700' : '400',
                color: language === lang.code ? '#0d6efd' : '#6c757d',
                textDecoration: language === lang.code ? 'underline' : 'none',
              }}
            >
              {lang.label}
            </button>
            {idx < LANGUAGES.length - 1 && (
              <span style={{ color: '#dee2e6', fontSize: '13px' }}>|</span>
            )}
          </React.Fragment>
        ))}
      </div>}

      <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
        <a href="/privacy" className="text-decoration-none text-muted small fw-semibold">{t('footer.privacy')}</a>
        <span className="text-muted">•</span>
        <a href="/terms" className="text-decoration-none text-muted small fw-semibold">{t('footer.terms')}</a>
        <span className="text-muted">•</span>
        <a href="/help" className="text-decoration-none text-muted small fw-semibold">{t('footer.help')}</a>
      </div>
      <p className="text-center text-muted small mb-0">{t('footer.copyright')}</p>
    </div>
  );
};

export default Footer;
