import React from 'react';
import { useAuth } from '../../../hooks/useAuth.jsx';

const AdminHeader = ({ title = "Dashboard", onRefresh, lastUpdate }) => {
  const { user } = useAuth();

  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('it-IT');
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <div className="header-subtitle">
          <span className="header-user">{user?.name || user?.email}</span>
          <span className="header-separator">•</span>
          <span className="header-role">Amministratore</span>
        </div>
      </div>

      <div className="header-right">
        {lastUpdate && (
          <div className="last-update">
            <span className="update-icon">🕒</span>
            <span className="update-text">Aggiornato: {formatTime(lastUpdate)}</span>
          </div>
        )}
        
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={onRefresh}
            title="Aggiorna dati"
          >
            <span className="refresh-icon">↻</span>
            <span className="refresh-text">Aggiorna</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;