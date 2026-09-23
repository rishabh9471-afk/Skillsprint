import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import './styles.css';

const isDashboard = window.location.pathname.replace(/\/$/, '') === '/dashboard';

createRoot(document.getElementById('root')).render(<React.StrictMode>{isDashboard ? <Dashboard /> : <App />}</React.StrictMode>);
