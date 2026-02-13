import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('🚀 [main.jsx] Avvio applicazione');

// Test import Firebase prima di render
console.log('🔧 [main.jsx] Test import Firebase...');
try {
  // Test import relativo
  const configModule = await import('./services/firebase/config.js');
  console.log('✅ [main.jsx] Firebase config importato:', configModule);
} catch (error) {
  console.error('❌ [main.jsx] Errore import Firebase config:', error.message);
  console.error('   Stack:', error.stack);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento root non trovato');
}

console.log('🎯 [main.jsx] Rendering React...');

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ [main.jsx] React renderizzato');
} catch (error) {
  console.error('❌ [main.jsx] Errore rendering:', error);
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
      <h1 style="color: #dc2626;">⚠️ Errore React</h1>
      <p style="margin: 20px 0; color: #4b5563; font-size: 18px;">
        ${error.message}
      </p>
      <button onclick="location.reload()" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      ">
        🔄 Ricarica applicazione
      </button>
      <div style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        Controlla la console per maggiori dettagli
      </div>
    </div>
  `;
}