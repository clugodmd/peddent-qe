import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { DemoProvider } from './context/DemoContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DemoProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </DemoProvider>
  </React.StrictMode>
);
