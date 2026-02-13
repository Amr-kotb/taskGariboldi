import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Caricamento...', fullScreen = false }) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  const spinner = (
    <div className="loading-spinner-container" style={{ textAlign: 'center', padding: '20px' }}>
      <div 
        className="loading-spinner"
        style={{ 
          width: sizes[size] || sizes.medium,
          height: sizes[size] || sizes.medium,
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}
      />
      {text && <p className="loading-text" style={{ marginTop: '10px', color: '#666' }}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Aggiungi gli stili CSS inline o in un file CSS separato
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default LoadingSpinner;