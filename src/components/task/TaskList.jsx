import React from 'react';
import TaskCard from './TaskCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';

const TaskList = ({ 
  tasks, 
  loading, 
  emptyMessage = 'Nessun task disponibile',
  onEditTask,
  onDeleteTask,
  onStatusChange,
  showActions = true
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <LoadingSpinner text="Caricamento task..." />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="task-list">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onStatusChange={onStatusChange}
            showActions={showActions}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;