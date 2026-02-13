import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentTasks = ({ tasks, users = [], onEdit, onDelete }) => {
  const navigate = useNavigate();

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || 'Non assegnato';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'bassa': return 'priority-low';
      default: return 'priority-default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completato': return 'status-completed';
      case 'in corso': return 'status-in-progress';
      case 'assegnato': return 'status-assigned';
      default: return 'status-default';
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-tasks">
        <div className="empty-icon">📋</div>
        <p className="empty-text">Nessun task trovato</p>
        <button 
          className="btn-create-task"
          onClick={() => navigate('/admin/assign-task')}
        >
          Crea il primo task
        </button>
      </div>
    );
  }

  return (
    <div className="recent-tasks">
      <div className="tasks-header">
        <h3 className="tasks-title">Task Recenti</h3>
        <button 
          className="btn-view-all"
          onClick={() => navigate('/admin/tasks')}
        >
          Vedi tutti ({tasks.length})
        </button>
      </div>
      
      <div className="tasks-list">
        {tasks.slice(0, 5).map((task) => (
          <div 
            key={task.id} 
            className="task-item"
            onClick={() => navigate(`/admin/tasks/${task.id}`)}
          >
            <div className="task-main">
              <div className="task-header">
                <h4 className="task-title">{task.title}</h4>
                <div className="task-actions">
                  <button 
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="task-description">
                {task.description || 'Nessuna descrizione'}
              </p>
              
              <div className="task-footer">
                <div className="task-info">
                  <div className="task-assignee">
                    <span className="assignee-label">Assegnato a:</span>
                    <span className="assignee-name">{getUserName(task.assignedTo)}</span>
                  </div>
                  
                  {task.dueDate && (
                    <div className="task-due">
                      <span className="due-label">Scadenza:</span>
                      <span className="due-date">
                        {new Date(task.dueDate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="task-tags">
                  <span className={`priority-tag ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'media'}
                  </span>
                  <span className={`status-tag ${getStatusColor(task.status)}`}>
                    {task.status || 'assegnato'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTasks;