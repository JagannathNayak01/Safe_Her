import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/main.css';
import './styles/loaders.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// ── Register Service Worker (PWA + offline SOS) ─────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => console.log('✅ Service Worker registered:', reg.scope))
      .catch((err) => console.warn('⚠️ SW registration failed:', err));
  });

  // Listen for queued SOS messages from SW
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SOS_QUEUED') {
      // Show a notification that SOS is queued
      if (window.__safeher_toast) {
        window.__safeher_toast('📡 You\'re offline — SOS queued and will be sent when connected', 'warning');
      }
    }
  });
}
