import React, { useState } from 'react';
import Input from './Input';
import Select from './Select';
import DatePicker from './DatePicker';
import Button from '../ui/Button';

const TaskForm = ({ 
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  users = [] 
}) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    assignedTo: initialData.assignedTo || '',
    priority: initialData.priority || 'medium',
    dueDate: initialData.dueDate || '',
    status: initialData.status || 'pending',
    ...initialData
  });

  const priorities = [
    { value: 'low', label: '🟢 Bassa' },
    { value: 'medium', label: '🟡 Media' },
    { value: 'high', label: '🟠 Alta' },
    { value: 'urgent', label: '🔴 Urgente' }
  ];

  const statuses = [
    { value: 'pending', label: '⏳ In attesa' },
    { value: 'in_progress', label: '🔄 In corso' },
    { value: 'completed', label: '✅ Completato' },
    { value: 'cancelled', label: '❌ Cancellato' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <Input
        label="Titolo Task"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Inserisci titolo del task"
        required
        disabled={loading}
      />
      
      <div className="form-group">
        <label className="form-label">Descrizione</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrivi il task..."
          className="form-control"
          rows="4"
          disabled={loading}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Select
          label="Assegna a"
          name="assignedTo"
          value={formData.assignedTo}
          onChange={handleChange}
          options={users.map(user => ({ value: user.id, label: user.name }))}
          required
          disabled={loading}
        />
        
        <Select
          label="Priorità"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          options={priorities}
          required
          disabled={loading}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
        <DatePicker
          label="Scadenza"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          required
          disabled={loading}
        />
        
        <Select
          label="Stato"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statuses}
          required
          disabled={loading}
        />
      </div>
      
      <div className="form-actions" style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Annulla
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {initialData.id ? 'Aggiorna Task' : 'Crea Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;