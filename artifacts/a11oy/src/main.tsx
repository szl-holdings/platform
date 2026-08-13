import { OmniaShellProvider } from '@szl-holdings/omnia-shell/provider';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('A11oy root element is unavailable');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <OmniaShellProvider
      config={{ artifactId: 'a11oy', accentColor: '#c9b787', networkState: 'UNAVAILABLE' }}
    >
      <App />
    </OmniaShellProvider>
  </React.StrictMode>,
);
