import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Robust Service Worker Registration
 * Handles edge cases like 'Invalid State' and 'Origin Mismatch'
 * especially in sandboxed/proxied development environments.
 */
const registerServiceWorker = async () => {
  // Check if Service Worker is supported
  if (!('serviceWorker' in navigator)) return;

  // Detect if we're in a sandboxed preview environment (e.g. *.usercontent.goog)
  const isProxied = window.location.hostname.includes('usercontent.goog');

  try {
    // 1. Wait for document to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => window.addEventListener('load', resolve));
    }

    // 2. Add a stability delay to prevent "Invalid State" errors in iframes
    await new Promise((resolve) => setTimeout(resolve, 1000));

    /**
     * 3. Register using a relative path and NO explicit scope.
     * By omitting 'scope', the browser defaults the scope to the script's directory.
     * By using a relative URL, we avoid origin-mismatch issues where the browser
     * might get confused between the preview domain and the editor domain.
     */
    const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
    
    console.log('SW Registration Success:', registration.scope);
  } catch (err: any) {
    /**
     * 4. Graceful Error Handling
     * In many development environments, PWA features are blocked by security policies.
     * We filter out "expected" errors to keep the console clean while the app runs.
     */
    const message = err?.message || '';
    const ignorePatterns = ['invalid state', 'origin', 'cross-origin', 'security'];
    const isExpectedError = ignorePatterns.some(p => message.toLowerCase().includes(p));
    
    if (!isExpectedError && !isProxied) {
      console.warn('PWA Service Worker could not be registered:', err);
    } else {
      console.log('PWA features are limited in this environment.');
    }
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