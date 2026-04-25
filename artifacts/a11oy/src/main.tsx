import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Signal to the proof-capture script that this page is ready for screenshots.
// The capture script opens a fresh browser context per route, waits for
// networkidle, then checks for data-screenshot-ready="true" on document.body.
// We set this after a short delay to allow React to complete its initial render
// and lazy-loaded chunks to resolve.
setTimeout(() => {
  document.body.dataset.screenshotReady = 'true';
}, 1500);
