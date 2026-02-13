import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const TaskCard = ({ 
  task, 
  onEdit, 
  onDelete,
  onStatusChange,
  showActions = true 
}) => {
  const priorityColors = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger'
  };

  const statusLabels = {
    pending: '⏳ In attesa',
    in_progress: '🔄 In corso',
    completed: '✅ Completato',
    cancelled: '❌ Cancellato'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non specificata';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  return (
    <Card hover className="task-card">
      <div className="task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <Badge variant={priorityColors[task.priority] || 'primary'}>
              {task.priority === 'low' && '🟢 Bassa'}
              {task.priority === 'medium' && '🟡 Media'}
              {task.priority === 'high' && '🟠 Alta'}
              {task.priority === 'urgent' && '🔴 Urgente'}
            </Badge>
            <Badge variant="info">
              {statusLabels[task.status] || task.status}
            </Badge>
          </div>
        </div>
        
        {showActions && (
          <div style={{ display: 'flex', gap: '5px' }}>
            <Button size="small" variant="outline" onClick={() => onEdit && onEdit(task)}>
              ✏️
            </Button>
            <Button size="small" variant="danger" onClick={() => onDelete && onDelete(task)}>
              🗑️
            </Button>
          </div>
        )}
      </div>
      
      <p style={{ margin: '10px 0', color: '#666' }}>
        {task.description?.substring(0, 100)}{task.description?.length > 100 ? '...' : ''}
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
        <div>
          <small style={{ color: '#888' }}>
            <strong>Assegnato a:</strong> {task.assignedToName || 'Non assegnato'}
          </small>
          <br />
          <small style={{ color: '#888' }}>
            <strong>Scadenza:</strong> {formatDate(task.dueDate)}
          </small>
        </div>
        
        {showActions && onStatusChange && task.status !== 'completed' && (
          <Button 
            size="small" 
            variant="success"
            onClick={() => onStatusChange(task.id, 'completed')}
          >
            ✅ Completa
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;