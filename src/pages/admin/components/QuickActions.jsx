import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 1,
      title: 'Nuovo Task',
      description: 'Crea e assegna un nuovo task',
      icon: '➕',
      color: 'blue',
      path: '/admin/assign-task',
      shortcut: 'N'
    },
    {
      id: 2,
      title: 'Gestisci Utenti',
      description: 'Aggiungi o modifica utenti',
      icon: '👥',
      color: 'green',
      path: '/admin/users',
      shortcut: 'U'
    },
    {
      id: 3,
      title: 'Report',
      description: 'Genera report dettagliati',
      icon: '📊',
      color: 'purple',
      path: '/admin/reports',
      shortcut: 'R'
    },
    {
      id: 4,
      title: 'Impostazioni',
      description: 'Configura sistema',
      icon: '⚙️',
      color: 'gray',
      path: '/admin/settings',
      shortcut: 'S'
    },
    {
      id: 5,
      title: 'Cestino',
      description: 'Gestisci task eliminati',
      icon: '🗑️',
      color: 'red',
      path: '/admin/trash',
      shortcut: 'T'
    },
    {
      id: 6,
      title: 'Esporta Dati',
      description: 'Esporta in Excel/PDF',
      icon: '📥',
      color: 'yellow',
      path: '/admin/export',
      shortcut: 'E'
    },
  ];

  return (
    <div className="quick-actions">
      <h3 className="actions-title">⚡ Azioni Rapide</h3>
      <div className="actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`action-card action-${action.color}`}
            onClick={() => navigate(action.path)}
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-content">
              <h4 className="action-title">{action.title}</h4>
              <p className="action-description">{action.description}</p>
            </div>
            <div className="action-shortcut">{action.shortcut}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;