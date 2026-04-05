import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { authService } from './services/authService.js'
import { LanguageProvider } from './contexts/LanguageContext.jsx'

// Apply dark mode from localStorage on startup (driver users only)
const _startupUser = authService.getCurrentUser();
const _isAdmin = _startupUser?.role?.toLowerCase() === 'admin';
if (!_isAdmin && localStorage.getItem('fleetflow_darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
