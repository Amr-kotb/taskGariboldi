// src/utils/taskUtils.js
export const getPriorityClass = (priority) => {
  const classes = {
    'alta': 'priority-high',
    'media': 'priority-medium', 
    'bassa': 'priority-low',
    'critica': 'priority-high'
  };
  return classes[priority] || 'priority-medium';
};

export const getStatusClass = (status) => {
  const classes = {
    'assegnato': 'assegnato',
    'in corso': 'in-corso',
    'completato': 'completato',
    'bloccato': 'bloccato'
  };
  return classes[status] || 'assegnato';
};