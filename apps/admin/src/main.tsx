import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from './auth/AdminAuthProvider';
import { App } from './App';
import './styles/admin.css';
import './styles/workflow.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider><App /></AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
