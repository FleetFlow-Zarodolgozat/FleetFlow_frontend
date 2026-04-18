import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './contexts/LanguageContext.jsx'

// Apply theme on startup: saved mode first, otherwise browser preference.
const savedDarkMode = localStorage.getItem('fleetflow_darkMode');
const shouldUseDarkMode = savedDarkMode !== null
  ? savedDarkMode === 'true'
  : window.matchMedia('(prefers-color-scheme: dark)').matches;

localStorage.setItem('fleetflow_darkMode', String(shouldUseDarkMode));

if (shouldUseDarkMode) {
  document.body.classList.add('dark-mode');
  document.documentElement.style.colorScheme = 'dark';
} else {
  document.body.classList.remove('dark-mode');
  document.documentElement.style.colorScheme = 'light';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
