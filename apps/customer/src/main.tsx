import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CustomerAuthProvider } from './auth/CustomerAuthProvider';
import { App } from './App';
import './styles/customer.css';
import './styles/operation-creation.css';
import './styles/homepage-theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CustomerAuthProvider><App /></CustomerAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
