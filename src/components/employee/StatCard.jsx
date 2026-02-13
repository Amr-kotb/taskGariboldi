// src/components/employee/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, description, icon, type = 'my-tasks' }) => {
  const getTypeClass = () => {
    const types = {
      'my-tasks': 'my-tasks',
      'completed': 'completed',
      'in-progress': 'in-progress',
      'overdue': 'overdue'
    };
    return types[type] || 'my-tasks';
  };

  const getIconBg = () => {
    const colors = {
      'my-tasks': { bg: 'var(--primary-100)', color: 'var(--primary-600)' },
      'completed': { bg: 'var(--success-100)', color: 'var(--success-600)' },
      'in-progress': { bg: 'var(--warning-100)', color: 'var(--warning-600)' },
      'overdue': { bg: 'var(--danger-100)', color: 'var(--danger-600)' }
    };
    return colors[type] || colors['my-tasks'];
  };

  const iconStyle = getIconBg();

  return (
    <div className={`employee-stat-card ${getTypeClass()}`}>
      <div className="stat-card-header">
        <div className="stat-card-title">{title}</div>
        <div 
          className="stat-card-icon"
          style={{ 
            backgroundColor: iconStyle.bg,
            color: iconStyle.color
          }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-description">{description}</div>
    </div>
  );
};

export default StatCard;