import { createContext, useState, useContext } from 'react';
import translations from '../services/translations';

const LanguageContext = createContext();

/**
 * Wraps the entire app. Reads the persisted language from localStorage
 * and makes the `t()` translation function available to all child components.
 */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('fleetflow_language') || 'en'
  );

  const setLanguage = (lang) => {
    localStorage.setItem('fleetflow_language', lang);
    setLanguageState(lang);
  };

  /**
   * Translate a key, with optional placeholder substitution.
   * e.g. t('dashboard.welcome', { name: 'John' })
   *      → 'Welcome back, John. Here is your daily summary.'
   */
  const t = (key, params = {}) => {
    const str =
      translations[language]?.[key] ??
      translations['en']?.[key] ??
      key;
    return Object.entries(params).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
      str
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

/** Hook — use inside any component to access { t, language, setLanguage } */
export const useLanguage = () => useContext(LanguageContext);
