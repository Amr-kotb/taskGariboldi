import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  trend,
  onClick 
}) => {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  };

  const colorSet = colors[color] || colors.blue;

  return (
    <div 
      className={`stats-card ${colorSet.bg} ${colorSet.border} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="stats-header">
        <div className={`stats-icon ${colorSet.text}`}>
          {icon}
        </div>
        <div className="stats-value">
          <span className="value-number">{value}</span>
          {trend && (
            <span className={`value-trend ${trend > 0 ? 'trend-up' : 'trend-down'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      <h3 className="stats-title">{title}</h3>
      <div className="stats-footer">
        <span className="stats-more">Dettagli →</span>
      </div>
    </div>
  );
};

export default StatsCard;