import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo"><h1>Task Manager</h1></div>
        
        {user && (
          <div className="user-menu">
            <div className="user-info">
              <div className="avatar">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user.displayName}</span>
                <span className="user-role">
                  {user.role === 'admin' ? 'Amministratore' : 'Dipendente'}
                </span>
              </div>
            </div>
            
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;