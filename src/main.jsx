import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './store/StoreContext';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import { ActivityModalProvider } from './components/activities/ActivityModal';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <ActivityModalProvider>
              <App />
            </ActivityModalProvider>
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
