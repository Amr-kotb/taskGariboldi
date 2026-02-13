import React from 'react';
import StatsCard from './StatsCard.jsx';

const StatsGrid = ({ stats }) => {
  const statsItems = [
    {
      title: "Totale Utenti",
      value: stats.totalUsers || 0,
      icon: "👥",
      color: "blue"
    },
    {
      title: "Task Totali",
      value: stats.totalTasks || 0,
      icon: "📋",
      color: "green"
    },
    {
      title: "Task Completati",
      value: stats.completedTasks || 0,
      icon: "✅",
      color: "purple"
    },
    {
      title: "Task in Corso",
      value: stats.activeTasks || 0,
      icon: "⏳",
      color: "yellow"
    },
    {
      title: "Task Scaduti",
      value: stats.overdueTasks || 0,
      icon: "⚠️",
      color: "red"
    },
    {
      title: "Priorità Alta",
      value: stats.highPriorityTasks || 0,
      icon: "🚨",
      color: "orange"
    }
  ];

  return (
    <div className="stats-grid">
      {statsItems.map((item, index) => (
        <StatsCard
          key={index}
          title={item.title}
          value={item.value}
          icon={item.icon}
          color={item.color}
        />
      ))}
    </div>
  );
};

export default StatsGrid;