import React, { useState } from 'react';
import Card from '../ui/Card';
import Select from '../forms/Select';
import DatePicker from '../forms/DatePicker';
import Button from '../ui/Button';

const TaskFilters = ({ 
  onFilterChange,
  initialFilters = {},
  users = []
}) => {
  const [filters, setFilters] = useState({
    status: initialFilters.status || '',
    priority: initialFilters.priority || '',
    assignedTo: initialFilters.assignedTo || '',
    dueDate: initialFilters.dueDate || '',
    ...initialFilters
  });

  const statusOptions = [
    { value: '', label: 'Tutti gli stati' },
    { value: 'pending', label: '⏳ In attesa' },
    { value: 'in_progress', label: '🔄 In corso' },
    { value: 'completed', label: '✅ Completato' },
    { value: 'cancelled', label: '❌ Cancellato' }
  ];

  const priorityOptions = [
    { value: '', label: 'Tutte le priorità' },
    { value: 'low', label: '🟢 Bassa' },
    { value: 'medium', label: '🟡 Media' },
    { value: 'high', label: '🟠 Alta' },
    { value: 'urgent', label: '🔴 Urgente' }
  ];

  const userOptions = [
    { value: '', label: 'Tutti gli utenti' },
    ...users.map(user => ({ value: user.id, label: user.name }))
  ];

  const handleChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      status: '',
      priority: '',
      assignedTo: '',
      dueDate: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <Card title="🔍 Filtri" className="mb-4">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px' 
      }}>
        <Select
          label="Stato"
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
          options={statusOptions}
        />
        
        <Select
          label="Priorità"
          value={filters.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          options={priorityOptions}
        />
        
        <Select
          label="Assegnato a"
          value={filters.assignedTo}
          onChange={(e) => handleChange('assignedTo', e.target.value)}
          options={userOptions}
        />
        
        <DatePicker
          label="Scadenza"
          value={filters.dueDate}
          onChange={(e) => handleChange('dueDate', e.target.value)}
        />
      </div>
      
      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <Button 
          variant="outline" 
          size="small"
          onClick={handleReset}
        >
          ❌ Reset Filtri
        </Button>
        
        <Button 
          variant="primary" 
          size="small"
          onClick={() => onFilterChange(filters)}
        >
          🔍 Applica Filtri
        </Button>
      </div>
    </Card>
  );
};

export default TaskFilters;