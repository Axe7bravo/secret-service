import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AmbassadorAuthProvider } from './auth/AmbassadorAuthProvider';
import { App } from './App';
import './styles/ambassador.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing.');
createRoot(root).render(<StrictMode><BrowserRouter><AmbassadorAuthProvider><App /></AmbassadorAuthProvider></BrowserRouter></StrictMode>);
