import { GraphQLProvider } from '@szl-holdings/graphql-client/provider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <GraphQLProvider>
      <App />
    </GraphQLProvider>
  </StrictMode>,
);
