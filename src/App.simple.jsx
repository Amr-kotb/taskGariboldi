// src/App.simple.jsx
import React from 'react';

export default function AppSimple() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a202c',
      color: 'white',
      padding: '40px',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#48bb78' }}>🎉 React Caricato!</h1>
      <p style={{ fontSize: '18px', margin: '20px 0' }}>
        L'applicazione TaskG è stata caricata con successo.
      </p>
      
      <div style={{
        backgroundColor: '#2d3748',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h3>Componenti Testati:</h3>
        <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
          <li>✅ React 18</li>
          <li>✅ JSX/ES6 Modules</li>
          <li>✅ Vite Dev Server</li>
          <li>✅ CSS-in-JS</li>
        </ul>
      </div>
      
      <button
        onClick={() => alert('Tutto funziona perfettamente!')}
        style={{
          padding: '12px 24px',
          backgroundColor: '#4299e1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '30px'
        }}
      >
        Test Completo
      </button>
    </div>
  );
}