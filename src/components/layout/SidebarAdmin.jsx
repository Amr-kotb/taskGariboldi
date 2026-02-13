import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { ROUTES } from '../../constants/routes.js';

const SidebarAdmin = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: '📊' },
    { path: ROUTES.ADMIN.TASKS, label: 'Tutti i Task', icon: '📋' },
    { path: ROUTES.ADMIN.ASSIGN_TASK, label: 'Assegna Task', icon: '➕' },
    { path: ROUTES.ADMIN.USERS, label: 'Gestione Utenti', icon: '👥' },
    { path: ROUTES.ADMIN.STATISTICS, label: 'Statistiche', icon: '📈' },
    { path: ROUTES.ADMIN.HISTORY, label: 'Storico', icon: '🕒' },
    { path: ROUTES.ADMIN.TRASH, label: 'Cestino', icon: '🗑️' },
  ];

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '20px'
      }}>
        {/* Logo e utente */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '5px' }}>TaskG Admin</h2>
          {user && (
            <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
              {user.email}
            </p>
          )}
        </div>

        {/* Menu */}
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 15px',
                marginBottom: '5px',
                color: location.pathname === item.path ? '#3b82f6' : '#cbd5e1',
                backgroundColor: location.pathname === item.path ? '#1e1b4b' : 'transparent',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '15px'
              }}
            >
              <span style={{ marginRight: '10px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Contenuto principale */}
      <div style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {children}
      </div>
    </div>
  );
};

export default SidebarAdmin;