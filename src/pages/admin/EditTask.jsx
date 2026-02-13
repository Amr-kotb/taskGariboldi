import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTasks, useUsers } from '../../hooks/useTasks.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { tasks, updateTask, loadAllTasks } = useTasks();
  const { users, loadEmployees } = useUsers();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'media',
    dueDate: '',
    status: 'assegnato',
    progress: 0
  });

  // Carica task e utenti
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadAllTasks(),
          loadEmployees()
        ]);
      } catch (error) {
        console.error('❌ [EditTask] Errore caricamento dati:', error);
        alert('Errore nel caricamento dei dati');
      }
    };
    
    loadData();
  }, []);

  // Popola form quando task è caricato
  useEffect(() => {
    if (tasks.length > 0 && id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        console.log('📝 [EditTask] Task trovato:', task);
        
        setFormData({
          title: task.title || '',
          description: task.description || '',
          assignedTo: task.assignedTo || '',
          priority: task.priority || 'media',
          dueDate: task.dueDate ? 
            (task.dueDate.toDate ? 
              task.dueDate.toDate().toISOString().split('T')[0] : 
              new Date(task.dueDate).toISOString().split('T')[0]
            ) : '',
          status: task.status || 'assegnato',
          progress: task.progress || 0
        });
      } else {
        console.error('❌ [EditTask] Task non trovato con ID:', id);
        alert('Task non trovato');
        navigate('/admin/tasks');
      }
      setLoading(false);
    }
  }, [tasks, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Se cambi stato in "completato", progress = 100%
      ...(name === 'status' && value === 'completato' ? { progress: 100 } : {})
    }));
  };

  const handleProgressChange = (value) => {
    setFormData(prev => ({ 
      ...prev, 
      progress: value,
      // Se progress = 100%, stato = completato
      ...(value === 100 ? { status: 'completato' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      console.log('💾 [EditTask] Aggiornamento task:', id, formData);
      
      // Prepara dati per l'update
      const updateData = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        status: formData.status,
        progress: parseInt(formData.progress),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      };
      
      const result = await updateTask(id, updateData);
      
      if (result.success) {
        alert('✅ Task aggiornato con successo!');
        navigate('/admin/tasks');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ [EditTask] Errore aggiornamento:', error);
      alert('❌ Errore nell\'aggiornamento del task: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questo task?')) return;
    
    try {
      const { deleteTask } = useTasks();
      const result = await deleteTask(id);
      
      if (result.success) {
        alert('✅ Task eliminato!');
        navigate('/admin/tasks');
      }
    } catch (error) {
      alert('❌ Errore nell\'eliminazione');
    }
  };

  const priorities = [
    { value: 'bassa', label: '🟢 Bassa' },
    { value: 'media', label: '🟡 Media' },
    { value: 'alta', label: '🟠 Alta' }
  ];

  const statuses = [
    { value: 'assegnato', label: '⏳ Assegnato' },
    { value: 'in corso', label: '🔄 In corso' },
    { value: 'completato', label: '✅ Completato' }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const assignedUser = users.find(u => u.id === formData.assignedTo);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '10px' }}>
          ✏️ Modifica Task
        </h1>
        <p style={{ color: '#6b7280' }}>
          Modifica i dettagli del task "{formData.title}"
        </p>
      </div>

      {/* Bottoni navigazione */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/admin/tasks')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Torna a Task
        </button>
        
        <button 
          onClick={() => navigate('/admin/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🏠 Dashboard
        </button>
      </div>

      {/* Form */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Titolo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              Titolo Task *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Inserisci titolo del task"
              required
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
          
          {/* Descrizione */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              Descrizione
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrivi il task..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                minHeight: '100px',
                fontSize: '16px'
              }}
              disabled={saving}
            />
          </div>
          
          {/* Righe orizzontali */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px', 
            marginBottom: '20px' 
          }}>
            {/* Assegna a */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Assegna a *
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                required
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="">Seleziona dipendente</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {assignedUser && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '14px', 
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#3b82f620',
                    color: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}>
                    {assignedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  Attualmente assegnato a: <strong>{assignedUser.name}</strong>
                </div>
              )}
            </div>
            
            {/* Priorità */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Priorità *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Seconda riga orizzontale */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px', 
            marginBottom: '20px' 
          }}>
            {/* Stato */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Stato *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Scadenza */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#374151'
              }}>
                Scadenza
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
          
          {/* Progresso */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              Progresso: {formData.progress}%
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              marginBottom: '10px'
            }}>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                disabled={saving}
                style={{
                  flex: 1,
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: '#e5e7eb',
                  outline: 'none'
                }}
              />
              <span style={{ 
                fontWeight: '600', 
                color: '#3b82f6',
                minWidth: '40px'
              }}>
                {formData.progress}%
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {[0, 25, 50, 75, 100].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleProgressChange(value)}
                  disabled={saving}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: value === formData.progress ? '#3b82f6' : '#f3f4f6',
                    color: value === formData.progress ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
          
          {/* Barra progresso visiva */}
          <div style={{ 
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Progresso attuale</span>
              <span style={{ 
                fontWeight: '600', 
                color: formData.progress === 100 ? '#10b981' : '#3b82f6'
              }}>
                {formData.progress}% {formData.progress === 100 ? '✅' : ''}
              </span>
            </div>
            <div style={{
              height: '10px',
              backgroundColor: '#e5e7eb',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${formData.progress}%`,
                backgroundColor: formData.progress === 100 ? '#10b981' : '#3b82f6',
                borderRadius: '5px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Bottoni azione */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  opacity: saving ? 0.5 : 1
                }}
              >
                🗑️ Elimina Task
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/tasks')}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Annulla
              </button>
              
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: saving ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {saving ? 'Salvataggio...' : '💾 Salva Modifiche'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Informazioni task */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ color: '#1f2937', marginBottom: '15px' }}>ℹ️ Informazioni Task</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          fontSize: '14px'
        }}>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '5px' }}>ID Task:</div>
            <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{id}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '5px' }}>Ultima modifica:</div>
            <div style={{ fontWeight: '500' }}>{new Date().toLocaleString('it-IT')}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '5px' }}>Creato da:</div>
            <div style={{ fontWeight: '500' }}>{currentUser?.name || 'Admin'}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '5px' }}>Stato attuale:</div>
            <div style={{ 
              fontWeight: '500',
              color: formData.status === 'completato' ? '#10b981' : 
                     formData.status === 'in corso' ? '#f59e0b' : '#3b82f6'
            }}>
              {formData.status === 'completato' ? '✅ Completato' : 
               formData.status === 'in corso' ? '🔄 In corso' : '⏳ Assegnato'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTask;