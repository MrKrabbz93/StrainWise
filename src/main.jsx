import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import ErrorBoundary from './components/ErrorBoundary.jsx'

import { Analytics } from '@vercel/analytics/react';
import { registerSW } from 'virtual:pwa-register';
import './lib/i18n'; // Initialize i18n

// PWA: Auto-update service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Prompt user to refresh, or just auto-reload
    if (confirm("New content available. Reload?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("StrainWise is ready for offline use.");
  },
});

import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
      {/* <Analytics /> */}
    </ErrorBoundary>
  </StrictMode>,
)
