import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Task Manager Pro.</p>
        <p className="footer-version">Versione 1.0.0</p>
      </div>
    </footer>
  );
};

export default Footer;