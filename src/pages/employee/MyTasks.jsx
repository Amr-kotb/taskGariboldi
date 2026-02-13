import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../../hooks/useTasks.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

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
    bloccato: '#ef4444'
  };
  return colors[status] || '#6b7280';
};

const MyTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, loading, error, loadUserTasks, updateTask, moveToTrash } = useTasks();
  
  const [selectedStatus, setSelectedStatus] = useState('tutti');
  const [selectedPriority, setSelectedPriority] = useState('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Stato per modale e notifiche
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  console.log('👤 [MyTasks] Pagina task dipendente caricata');

  // Carica task dell'utente al mount
  useEffect(() => {
    if (user?.uid) {
      loadUserTasks(user.uid);
    }
  }, [user, loadUserTasks]);

  // Nasconde la notifica dopo 3 secondi
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Statistiche calcolate
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.status === 'completato').length;
    const inProgress = tasks.filter(t => t.status === 'in corso').length;
    const assigned = tasks.filter(t => t.status === 'assegnato').length;
    const overdue = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completato') return false;
      const daysRemaining = getDaysRemaining(task.dueDate);
      return daysRemaining !== null && daysRemaining < 0;
    }).length;
    
    const completionRate = totalTasks > 0 
      ? Math.round((completed / totalTasks) * 100) 
      : 0;

    return {
      totalTasks,
      completed,
      inProgress,
      assigned,
      overdue,
      completionRate
    };
  }, [tasks]);

  // Task filtrati e ordinati
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filtro per status
    if (selectedStatus !== 'tutti') {
      if (selectedStatus === 'overdue') {
        result = result.filter(task => {
          if (!task.dueDate || task.status === 'completato') return false;
          const daysRemaining = getDaysRemaining(task.dueDate);
          return daysRemaining !== null && daysRemaining < 0;
        });
      } else {
        result = result.filter(task => task.status === selectedStatus);
      }
    }

    // Filtro per priorità
    if (selectedPriority !== 'tutti') {
      result = result.filter(task => task.priority === selectedPriority);
    }

    // Filtro per ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.category && task.category.toLowerCase().includes(query))
      );
    }

    // Ordinamento
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? (a.dueDate.toDate ? a.dueDate.toDate() : new Date(a.dueDate)) : new Date(0);
          bValue = b.dueDate ? (b.dueDate.toDate ? b.dueDate.toDate() : new Date(b.dueDate)) : new Date(0);
          break;
        case 'priority':
          const priorityOrder = { critica: 0, alta: 1, media: 2, bassa: 3 };
          aValue = priorityOrder[a.priority] || 4;
          bValue = priorityOrder[b.priority] || 4;
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        default: // createdAt
          aValue = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          bValue = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [tasks, selectedStatus, selectedPriority, searchQuery, sortBy, sortOrder]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { 
        status: newStatus,
        ...(newStatus === 'completato' && { completedAt: new Date().toISOString() })
      });
      
      // Notifica
      setNotification({
        type: 'success',
        message: 'Status aggiornato con successo!'
      });
    } catch (error) {
      console.error('❌ Errore aggiornamento status:', error);
      setNotification({
        type: 'error',
        message: 'Errore durante l\'aggiornamento dello status'
      });
    }
  };

  const handleProgressChange = async (taskId, progress) => {
    try {
      await updateTask(taskId, { progress });
      
      setNotification({
        type: 'success',
        message: 'Progresso aggiornato con successo!'
      });
    } catch (error) {
      console.error('❌ Errore aggiornamento progresso:', error);
      setNotification({
        type: 'error',
        message: 'Errore durante l\'aggiornamento del progresso'
      });
    }
  };

  // Funzione per aprire il modal di conferma eliminazione
  const handleOpenDeleteModal = (task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  // Funzione per spostare nel cestino
  const handleMoveToTrash = async () => {
    if (!selectedTask || !user) return;
    
    setIsDeleting(true);
    
    try {
      const result = await moveToTrash(selectedTask.id, user);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Task spostato nel cestino con successo!'
        });
        
        // Chiudi il modal
        setShowDeleteModal(false);
        setSelectedTask(null);
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Errore durante l\'eliminazione'
        });
      }
    } catch (error) {
      console.error('❌ Errore eliminazione task:', error);
      setNotification({
        type: 'error',
        message: 'Errore durante l\'eliminazione del task'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && tasks.length === 0) {
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
      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
      position: 'relative'
    }}>
      
      {/* Notifiche */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '16px 20px',
          backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '300px',
          animation: 'slideInRight 0.3s ease'
        }}>
          <div style={{ fontSize: '20px' }}>
            {notification.type === 'success' ? '✅' : '⚠️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              {notification.message}
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button
              onClick={() => navigate('/employee/dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              ← Torna alla Dashboard
            </button>
            <h1 style={{ fontSize: '28px', color: '#1f2937', margin: 0, fontWeight: '700' }}>
              📋 I Miei Task
            </h1>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '15px' }}>
              Gestisci tutti i task assegnati a te ({tasks.length} task)
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/employee/create-task')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>➕</span>
              Nuovo Task
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 30px 30px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Statistiche */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '30px'
        }}>
          {[
            { label: 'Totali', value: stats.totalTasks, color: '#3b82f6', icon: '📋' },
            { label: 'Completati', value: stats.completed, color: '#10b981', icon: '✅' },
            { label: 'In Corso', value: stats.inProgress, color: '#f59e0b', icon: '🔄' },
            { label: 'Assegnati', value: stats.assigned, color: '#8b5cf6', icon: '⏳' },
            { label: 'In Ritardo', value: stats.overdue, color: stats.overdue > 0 ? '#ef4444' : '#6b7280', icon: '⚠️' },
            { label: 'Completamento', value: `${stats.completionRate}%`, color: '#06b6d4', icon: '📈' }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: `1px solid ${stat.color}20`,
                textAlign: 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px', color: stat.color }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Barra di controllo */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center'
        }}>
          {/* Barra di ricerca */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cerca task per titolo, descrizione o categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: '#f9fafb',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#9ca3af'
              }}>
                🔍
              </div>
            </div>
          </div>

          {/* Filtri */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Filtro Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
                backgroundColor: 'white',
                minWidth: '140px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            >
              <option value="tutti">📊 Tutti gli stati</option>
              <option value="assegnato">🔵 Assegnati ({tasks.filter(t => t.status === 'assegnato').length})</option>
              <option value="in corso">🟡 In Corso ({stats.inProgress})</option>
              <option value="completato">🟢 Completati ({stats.completed})</option>
              <option value="bloccato">🔴 Bloccati ({tasks.filter(t => t.status === 'bloccato').length})</option>
              {stats.overdue > 0 && (
                <option value="overdue">⚠️ In Ritardo ({stats.overdue})</option>
              )}
            </select>

            {/* Filtro Priorità */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
                backgroundColor: 'white',
                minWidth: '140px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            >
              <option value="tutti">🎯 Tutte le priorità</option>
              <option value="critica">🔴 Critica ({tasks.filter(t => t.priority === 'critica').length})</option>
              <option value="alta">🔴 Alta ({tasks.filter(t => t.priority === 'alta').length})</option>
              <option value="media">🟡 Media ({tasks.filter(t => t.priority === 'media').length})</option>
              <option value="bassa">🟢 Bassa ({tasks.filter(t => t.priority === 'bassa').length})</option>
            </select>

            {/* Ordinamento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
                backgroundColor: 'white',
                minWidth: '140px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
            >
              <option value="createdAt">📅 Ordina per data creazione</option>
              <option value="dueDate">⏳ Ordina per scadenza</option>
              <option value="title">🔤 Ordina per titolo</option>
              <option value="priority">🎯 Ordina per priorità</option>
              <option value="progress">📈 Ordina per progresso</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              {sortOrder === 'asc' ? '⬆️ Crescente' : '⬇️ Decrescente'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Lista Task */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          {/* Header Tabella */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
            gap: '16px',
            padding: '20px 24px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: '600',
            color: '#374151',
            fontSize: '14px'
          }}>
            <div>Task</div>
            <div>Priorità</div>
            <div>Scadenza</div>
            <div>Progresso</div>
            <div>Status</div>
            <div>Azioni</div>
          </div>

          {filteredAndSortedTasks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
              <h3 style={{ 
                fontSize: '20px', 
                color: '#1f2937', 
                marginBottom: '12px',
                fontWeight: '600'
              }}>
                Nessun task trovato
              </h3>
              <p style={{ 
                fontSize: '15px', 
                color: '#6b7280',
                marginBottom: '24px',
                maxWidth: '500px',
                margin: '0 auto 24px'
              }}>
                {searchQuery 
                  ? `Nessun risultato per "${searchQuery}". Prova con un'altra ricerca.`
                  : selectedStatus !== 'tutti' || selectedPriority !== 'tutti'
                  ? 'Nessun task corrisponde ai filtri selezionati.'
                  : 'Non hai ancora task assegnati.'}
              </p>
              {(searchQuery || selectedStatus !== 'tutti' || selectedPriority !== 'tutti') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('tutti');
                    setSelectedPriority('tutti');
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  🗑️ Cancella filtri
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredAndSortedTasks.map((task) => {
                const daysRemaining = getDaysRemaining(task.dueDate);
                const isOverdue = daysRemaining !== null && daysRemaining < 0 && task.status !== 'completato';
                const priorityColor = getPriorityColor(task.priority);
                const statusColor = getStatusColor(task.status);
                
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                      gap: '16px',
                      padding: '20px 24px',
                      borderBottom: '1px solid #e5e7eb',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease, transform 0.1s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    {/* Titolo e Descrizione */}
                    <div>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>{task.title}</span>
                        {task.deleted && (
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            Cestino
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#6b7280',
                          lineHeight: '1.4'
                        }}>
                          {task.description.length > 80 
                            ? `${task.description.substring(0, 80)}...` 
                            : task.description}
                        </div>
                      )}
                      {task.category && (
                        <div style={{
                          display: 'inline-block',
                          marginTop: '8px',
                          padding: '4px 10px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {task.category}
                        </div>
                      )}
                    </div>

                    {/* Priorità */}
                    <div>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: `${priorityColor}15`,
                        color: priorityColor,
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {task.priority?.toUpperCase() || 'MEDIA'}
                      </div>
                    </div>

                    {/* Scadenza */}
                    <div>
                      {task.dueDate ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ 
                            fontSize: '14px', 
                            color: isOverdue ? '#ef4444' : '#6b7280',
                            fontWeight: isOverdue ? '600' : '400'
                          }}>
                            {formatDate(task.dueDate)}
                          </span>
                          {daysRemaining !== null && (
                            <span style={{
                              fontSize: '12px',
                              padding: '2px 8px',
                              backgroundColor: isOverdue ? '#fee2e2' : 
                                            daysRemaining === 0 ? '#fef3c7' : '#dbeafe',
                              color: isOverdue ? '#dc2626' : 
                                    daysRemaining === 0 ? '#92400e' : '#1e40af',
                              borderRadius: '4px',
                              fontWeight: '500',
                              display: 'inline-block'
                            }}>
                              {isOverdue ? `Ritardo ${Math.abs(daysRemaining)}g` : 
                               daysRemaining === 0 ? 'OGGI' : 
                               `${daysRemaining}g`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>Nessuna</span>
                      )}
                    </div>

                    {/* Progresso */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            marginBottom: '4px',
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            <span>Progresso</span>
                            <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                              {task.progress || 0}%
                            </span>
                          </div>
                          <div style={{
                            height: '6px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${task.progress || 0}%`,
                                backgroundColor: task.progress === 100 ? '#10b981' : '#3b82f6',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '2px',
                          marginLeft: '8px'
                        }}>
                          {[0, 50, 100].map(value => (
                            <button
                              key={value}
                              onClick={() => handleProgressChange(task.id, value)}
                              style={{
                                padding: '2px 6px',
                                backgroundColor: value === task.progress ? '#3b82f6' : '#f3f4f6',
                                color: value === task.progress ? 'white' : '#6b7280',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                minWidth: '30px',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (value !== task.progress) {
                                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (value !== task.progress) {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                }
                              }}
                            >
                              {value}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: statusColor,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          minWidth: '120px',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                          backgroundSize: '12px',
                          paddingRight: '30px',
                          transition: 'filter 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <option value="assegnato" style={{ backgroundColor: '#3b82f6' }}>Assegnato</option>
                        <option value="in corso" style={{ backgroundColor: '#f59e0b' }}>In Corso</option>
                        <option value="completato" style={{ backgroundColor: '#10b981' }}>Completato</option>
                        <option value="bloccato" style={{ backgroundColor: '#ef4444' }}>Bloccato</option>
                      </select>
                    </div>

                    {/* Azioni */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      
                      
                      <button
                        onClick={() => handleOpenDeleteModal(task)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      >
                        <span style={{ fontSize: '14px' }}>🗑️</span>
                        Cestino
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Tabella */}
          {filteredAndSortedTasks.length > 0 && (
            <div style={{
              padding: '16px 24px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <div>
                Mostrati <strong>{filteredAndSortedTasks.length}</strong> di <strong>{tasks.length}</strong> task
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🖨️ Stampa
                </button>
                <button
                  onClick={() => {
                    // Export as CSV
                    const csv = filteredAndSortedTasks.map(task => 
                      `"${task.title}","${task.status}","${task.priority}","${task.dueDate ? formatDate(task.dueDate) : ''}","${task.progress}%"`
                    ).join('\n');
                    const blob = new Blob([`Titolo,Status,Priorità,Scadenza,Progresso\n${csv}`], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mytasks-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  📥 Esporta CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal Eliminazione */}
      {showDeleteModal && selectedTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', color: '#ef4444' }}>🗑️</div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Sposta nel Cestino
              </h2>
            </div>
            
            <div style={{ 
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '20px', color: '#dc2626' }}>⚠️</div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                    Conferma eliminazione
                  </h3>
                  <p style={{ fontSize: '14px', color: '#991b1b', lineHeight: '1.5' }}>
                    Il task verrà spostato nel cestino. Potrai recuperarlo entro 30 giorni.
                  </p>
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                  Task da eliminare:
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {selectedTask.title}
                </div>
                {selectedTask.description && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                    {selectedTask.description.length > 100 
                      ? `${selectedTask.description.substring(0, 100)}...` 
                      : selectedTask.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '4px 10px',
                    backgroundColor: `${getPriorityColor(selectedTask.priority)}15`,
                    color: getPriorityColor(selectedTask.priority),
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {selectedTask.priority}
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    backgroundColor: `${getStatusColor(selectedTask.status)}15`,
                    color: getStatusColor(selectedTask.status),
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {selectedTask.status}
                  </div>
                  {selectedTask.dueDate && (
                    <div style={{
                      padding: '4px 10px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      Scade: {formatDate(selectedTask.dueDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ fontSize: '16px', color: '#0ea5e9' }}>💡</div>
                <div style={{ fontSize: '13px', color: '#0369a1' }}>
                  Il task rimarrà nel cestino per 30 giorni. Potrai recuperarlo dalla sezione "Cestino" o eliminarlo definitivamente.
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTask(null);
                }}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Annulla
              </button>
              <button
                onClick={handleMoveToTrash}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isDeleting ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#ef4444';
                }}
              >
                {isDeleting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Eliminazione...
                  </>
                ) : (
                  '🗑️ Sposta nel Cestino'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MyTasks;