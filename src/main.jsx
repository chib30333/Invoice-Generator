import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { registerFonts } from './fonts.js';
import regular from './fonts/Selawik-Regular.ttf';
import bold from './fonts/Selawik-Bold.ttf';
import './styles.css';

registerFonts({ regular, bold });

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
