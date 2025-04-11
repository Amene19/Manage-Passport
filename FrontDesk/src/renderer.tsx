import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './components/App';
import { AuthProvider } from './contexts/AuthContext';
import './styles.css';

// When the renderer process starts, notify the main process
if (window.api) {
  window.api.send('app-ready', 'Renderer process is ready');
}

// Create the root element and render our app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);

// Add global type definitions for the API bridge
declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      callApi: (endpoint: string, method: string, data?: any) => Promise<any>;
    }
  }
} 