import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.jsx';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/tasks', icon: '📋', label: 'Task' },
    { path: '/admin/assign-task', icon: '➕', label: 'Nuovo Task' },
    { path: '/admin/users', icon: '👥', label: 'Utenti' },
    { path: '/admin/statistics', icon: '📈', label: 'Statistiche' },
    { path: '/admin/reports', icon: '📄', label: 'Report' },
    { path: '/admin/history', icon: '🕒', label: 'Cronologia' },
    { path: '/admin/trash', icon: '🗑️', label: 'Cestino' },
    { path: '/admin/settings', icon: '⚙️', label: 'Impostazioni' },
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">👑</div>
          {!collapsed && <h2 className="logo-text">TaskG Admin</h2>}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
        </div>
        {!collapsed && (
          <div className="user-info">
            <div className="user-name">{user?.name || 'Admin'}</div>
            <div className="user-role">Amministratore</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="logout-btn"
          onClick={logout}
          title={collapsed ? 'Logout' : ''}
        >
          <span className="logout-icon">🚪</span>
          {!collapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;