import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { ROUTES } from '../../constants/routes.js';

const SidebarEmployee = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: ROUTES.EMPLOYEE.DASHBOARD, label: 'Dashboard', icon: '📊' },
    { path: ROUTES.EMPLOYEE.MY_TASKS, label: 'I Miei Task', icon: '📋' },
    { path: ROUTES.EMPLOYEE.HISTORY, label: 'Storico', icon: '🕒' },
    { path: ROUTES.EMPLOYEE.PROFILE, label: 'Profilo', icon: '👤' },
    { path: ROUTES.EMPLOYEE.TRASH, label: 'Cestino', icon: '🗑️' },
  ];

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '220px',
        backgroundColor: '#0f172a',
        color: 'white',
        padding: '20px'
      }}>
        {/* Logo e utente */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '5px' }}>TaskG</h2>
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
                color: location.pathname === item.path ? '#10b981' : '#cbd5e1',
                backgroundColor: location.pathname === item.path ? '#064e3b' : 'transparent',
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
              backgroundColor: '#475569',
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

export default SidebarEmployee;