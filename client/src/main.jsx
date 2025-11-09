import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './context/GameContext';
import App from './App';
import './index.css';

// --- THIS IS THE FIX ---
// In production, we override the console methods with empty functions.
// This guarantees that no logs (from our code, libraries, or by mistake)
// will ever be displayed in the browser console.
if (import.meta.env.VITE_ENVIRONMENT === 'production') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <GameProvider> 
            <App />
          </GameProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);