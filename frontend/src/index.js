import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(reg) { reg.unregister(); });
  });
  caches.keys().then(function(keys) {
    keys.forEach(function(key) { caches.delete(key); });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);