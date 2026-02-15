import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks.jsx';

// Utility functions
const formatDate = (date) => {
  if (!date) return 'N/D';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT');
  } catch {
    return 'N/D';
  }
};

const getDaysRemaining = (dueDate) => {
  if (!dueDate) return null;
  try {
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
};

const isTaskOverdue = (task) => {
  if (!task.dueDate || task.status === 'completato') return false;
  const daysRemaining = getDaysRemaining(task.dueDate);
  return daysRemaining !== null && daysRemaining < 0;
};

const getPriorityColor = (priority) => {
  const colors = {
    alta: '#ef4444',
    media: '#f59e0b',
    bassa: '#10b981',
    critica: '#dc2626'
  };
  return colors[priority] || '#6b7280';
};

const getStatusColor = (status) => {
  const colors = {
    assegnato: '#3b82f6',
    'in corso': '#f59e0b',
    completato: '#10b981',
    in_revisione: '#8b5cf6',
    bloccato: '#ef4444'
  };
  return colors[status] || '#6b7280';
};

const AllTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tasks, loading, loadAllTasks } = useTasks();
  
  const [selectedStatus, setSelectedStatus] = useState('tutti');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAllTasks();
  }, []);

  const canModifyTask = (task) => {
    return task.assignedTo === user?.uid;
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStatus === 'tutti') return filtered;
    if (selectedStatus === 'overdue') return filtered.filter(isTaskOverdue);
    return filtered.filter(task => task.status === selectedStatus);
  }, [tasks, selectedStatus, searchTerm]);

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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '30px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '24px', color: '#1f2937', margin: 0 }}>
          📋 Tutti i Task del Sistema
        </h1>
        <button
          onClick={() => navigate('/employee')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Torna alla Dashboard
        </button>
      </div>

      {/* Filtri e Ricerca */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '30px',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="🔍 Cerca task..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 15px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '250px'
          }}
        />
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Tutti', value: 'tutti', color: '#6b7280' },
            { label: 'Assegnati', value: 'assegnato', color: '#3b82f6' },
            { label: 'In Corso', value: 'in corso', color: '#f59e0b' },
            { label: 'Completati', value: 'completato', color: '#10b981' },
            { label: 'In Ritardo', value: 'overdue', color: '#ef4444' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedStatus === filter.value ? filter.color : '#f3f4f6',
                color: selectedStatus === filter.value ? 'white' : '#4b5563',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Task */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', color: '#1f2937', margin: 0 }}>
            {filteredTasks.length} Task Trovati
          </h2>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              Nessun task trovato
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredTasks.map((task) => {
              const daysRemaining = getDaysRemaining(task.dueDate);
              const isOverdue = daysRemaining !== null && daysRemaining < 0 && task.status !== 'completato';
              const priorityColor = getPriorityColor(task.priority);
              const statusColor = getStatusColor(task.status);
              const isOwnTask = canModifyTask(task);
              
              return (
                <div
                  key={task.id}
                  style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    borderLeft: `4px solid ${priorityColor}`,
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      padding: '4px 10px',
                      backgroundColor: isOwnTask ? '#10b98120' : '#6b728020',
                      color: isOwnTask ? '#10b981' : '#6b7280',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {isOwnTask ? '👤 TUO' : '👥 Altro'}
                    </div>
                    
                    <div style={{
                      padding: '4px 12px',
                      backgroundColor: `${statusColor}15`,
                      color: statusColor,
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {task.status}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        marginBottom: '8px'
                      }}>
                        {task.description}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: priorityColor,
                          borderRadius: '50%'
                        }}></div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {task.priority?.toUpperCase()}
                        </span>
                      </div>
                      
                      {task.dueDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px' }}>📅</span>
                          <span style={{ 
                            fontSize: '12px', 
                            color: isOverdue ? '#ef4444' : '#6b7280',
                            fontWeight: isOverdue ? '600' : '400'
                          }}>
                            {formatDate(task.dueDate)}
                            {daysRemaining !== null && (
                              <span style={{ 
                                marginLeft: '8px',
                                padding: '2px 6px',
                                backgroundColor: isOverdue ? '#fee2e2' : '#dbeafe',
                                color: isOverdue ? '#dc2626' : '#1e40af',
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}>
                                {isOverdue ? `${Math.abs(daysRemaining)}g in ritardo` : `${daysRemaining}g`}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>👤</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          Assegnato a: {task.assignedName || 'Utente'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '70px' }}>
                        Progresso:
                      </span>
                      <div style={{
                        flex: 1,
                        height: '6px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${task.progress || 0}%`,
                            backgroundColor: '#3b82f6',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
                        {task.progress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AllTasks;