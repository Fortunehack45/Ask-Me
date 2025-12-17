import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Robust Service Worker Registration
 * Handles edge cases like 'Invalid State' by ensuring the document is fully stable.
 */
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    // Wait for the document to be fully loaded if it isn't already
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => window.addEventListener('load', resolve));
    }

    /**
     * In some sandboxed or frame-based environments, the document can 
     * briefly be in an 'invalid state' immediately after load.
     * A small delay ensures the context is fully active.
     */
    await new Promise((resolve) => setTimeout(resolve, 500));

    const swUrl = `${window.location.origin}/firebase-messaging-sw.js`;
    
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
    });
    
    console.log('SW Registration Success:', registration.scope);
  } catch (err) {
    // Gracefully handle the error - PWA features might be unavailable, 
    // but the main app should still function.
    console.warn('SW Registration failed (PWA features disabled):', err);
  }
};

// Initiate registration
registerServiceWorker();

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element 'root' not found in the document.");
}