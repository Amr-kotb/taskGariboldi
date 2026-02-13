import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks.jsx';
import { useStats } from '../../hooks/useStats.jsx';

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

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, loadUserTasks, updateTask } = useTasks();
  const { loadUserStats } = useStats();
  
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('tutti');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Aggiorna l'ora ogni minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Carica i task dell'utente corrente
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) return;
      
      try {
        console.log('📊 [EmployeeDashboard] Caricamento dati utente:', user.uid);
        await loadUserTasks(user.uid);
        
        // Carica statistiche utente
        const stats = await loadUserStats(user.uid);
        setUserStats(stats);
      } catch (error) {
        console.error('❌ [EmployeeDashboard] Errore caricamento dati:', error);
      } finally {
        setLoading(false);
        console.log('✅ [EmployeeDashboard] Dati caricati');
      }
    };
    
    loadUserData();
  }, [user]);

  // Calcola statistiche REALI con useMemo per performance
  const myStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.status === 'completato').length;
    const inProgress = tasks.filter(t => t.status === 'in corso').length;
    const assigned = tasks.filter(t => t.status === 'assegnato').length;
    const overdue = tasks.filter(isTaskOverdue).length;
    
    const completionRate = totalTasks > 0 
      ? Math.round((completed / totalTasks) * 100) 
      : 0;
    
    // Calcola task completati questa settimana
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedThisWeek = tasks.filter(t => {
      if (t.status !== 'completato') return false;
      if (!t.completedAt) return false;
      try {
        const completedDate = t.completedAt.toDate ? t.completedAt.toDate() : new Date(t.completedAt);
        return completedDate > oneWeekAgo;
      } catch {
        return false;
      }
    }).length;

    return {
      totalTasks,
      completed,
      inProgress,
      assigned,
      overdue,
      completionRate,
      completedThisWeek
    };
  }, [tasks]);

  // Task filtrati per status
  const filteredTasks = useMemo(() => {
    if (selectedStatus === 'tutti') return tasks;
    if (selectedStatus === 'overdue') return tasks.filter(isTaskOverdue);
    return tasks.filter(task => task.status === selectedStatus);
  }, [tasks, selectedStatus]);

  // Task recenti (ultimi 3)
  const recentTasks = useMemo(() => filteredTasks.slice(0, 3), [filteredTasks]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { 
        status: newStatus,
        ...(newStatus === 'completato' && { completedAt: new Date().toISOString() })
      });
      console.log(`✅ Status task ${taskId} aggiornato a ${newStatus}`);
    } catch (error) {
      console.error('❌ Errore aggiornamento status:', error);
      alert('Errore nell\'aggiornamento del task');
    }
  };

  const handleProgressChange = async (taskId, progress) => {
    try {
      await updateTask(taskId, { progress });
      console.log(`✅ Progresso task ${taskId} aggiornato a ${progress}%`);
    } catch (error) {
      console.error('❌ Errore aggiornamento progresso:', error);
    }
  };

  // Formatta l'orario corrente
  const formatTime = (date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Ottieni il saluto in base all'ora
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  if (loading || tasksLoading) {
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
      fontFamily: "'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Top Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '18px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            backgroundColor: '#3b82f6',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 style={{ fontSize: '20px', color: '#1f2937', margin: 0, fontWeight: '600' }}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Collega'}!
            </h1>
            <p style={{ color: '#6b7280', margin: '3px 0 0 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👤 {user?.department || 'Dipartimento'}</span>
              <span style={{ width: '4px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '50%' }}></span>
              <span>🕐 {formatTime(currentTime)}</span>
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/employee/create-task')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <span style={{ fontSize: '16px' }}>➕</span>
            Nuovo Task
          </button>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => navigate('/employee/profile')}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                color: '#4b5563',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              <span style={{ fontSize: '16px' }}>👤</span>
              Profilo
            </button>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            Esci
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Statistiche Rapide */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {[
            { 
              title: 'Task Totali', 
              value: myStats.totalTasks, 
              color: '#3b82f6', 
              icon: '📋',
              subtitle: 'Assegnati a te',
              gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)'
            },
            { 
              title: 'Completati', 
              value: myStats.completed, 
              color: '#10b981', 
              icon: '✅',
              subtitle: `${myStats.completionRate}% completamento`,
              gradient: 'linear-gradient(135deg, #10b981, #34d399)'
            },
            { 
              title: 'In Lavorazione', 
              value: myStats.inProgress, 
              color: '#f59e0b', 
              icon: '🔄',
              subtitle: 'Task in corso',
              gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
            },
            { 
              title: 'Da Iniziare', 
              value: myStats.assigned, 
              color: '#8b5cf6', 
              icon: '⏳',
              subtitle: 'Assegnati',
              gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
            },
            { 
              title: 'In Ritardo', 
              value: myStats.overdue, 
              color: myStats.overdue > 0 ? '#ef4444' : '#6b7280', 
              icon: '⚠️',
              subtitle: 'Da completare',
              gradient: myStats.overdue > 0 
                ? 'linear-gradient(135deg, #ef4444, #f87171)'
                : 'linear-gradient(135deg, #6b7280, #9ca3af)'
            }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: stat.value > 0 ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => {
                if (stat.value > 0) {
                  const statusMap = ['tutti', 'completato', 'in corso', 'assegnato', 'overdue'];
                  setSelectedStatus(statusMap[index]);
                }
              }}
              onMouseEnter={(e) => {
                if (stat.value > 0) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (stat.value > 0) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }
              }}
            >
              {/* Background gradient accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: stat.gradient
              }}></div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                    {stat.title}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {stat.subtitle}
                  </div>
                </div>
                <div style={{
                  fontSize: '32px',
                  opacity: 0.9
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          {/* Colonna Sinistra: Task e Attività */}
          <div>
            {/* Filtri Status */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {[
                { label: 'Tutti', value: 'tutti', color: '#6b7280', count: myStats.totalTasks },
                { label: 'Assegnati', value: 'assegnato', color: '#3b82f6', count: myStats.assigned },
                { label: 'In Corso', value: 'in corso', color: '#f59e0b', count: myStats.inProgress },
                { label: 'Completati', value: 'completato', color: '#10b981', count: myStats.completed },
                ...(myStats.overdue > 0 ? [
                  { label: 'In Ritardo', value: 'overdue', color: '#ef4444', count: myStats.overdue }
                ] : [])
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: selectedStatus === filter.value ? filter.color : '#f3f4f6',
                    color: selectedStatus === filter.value ? 'white' : '#4b5563',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStatus !== filter.value) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStatus !== filter.value) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  <span>{filter.label}</span>
                  <span style={{
                    backgroundColor: selectedStatus === filter.value ? 'rgba(255,255,255,0.2)' : '#d1d5db',
                    color: selectedStatus === filter.value ? 'white' : '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Task Recenti */}
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#1f2937', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  📋 Task {selectedStatus === 'tutti' ? 'Recenti' : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/employee/tasks')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  >
                    Vedi tutti ({filteredTasks.length})
                    <span style={{ fontSize: '12px' }}>→</span>
                  </button>
                </div>
              </div>
              
              {filteredTasks.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '50px 20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                  <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                    Nessun task trovato
                  </p>
                  <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                    {selectedStatus === 'completato' 
                      ? 'Non hai ancora completato task!' 
                      : selectedStatus === 'overdue'
                      ? 'Ottimo! Nessun task in ritardo!'
                      : 'Crea il tuo primo task o aspetta assegnazioni'}
                  </p>
                  {selectedStatus !== 'tutti' && (
                    <button
                      onClick={() => setSelectedStatus('tutti')}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Mostra tutti i task
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {recentTasks.map((task, index) => {
                    const daysRemaining = getDaysRemaining(task.dueDate);
                    const isOverdue = daysRemaining !== null && daysRemaining < 0 && task.status !== 'completato';
                    const priorityColor = getPriorityColor(task.priority);
                    const statusColor = getStatusColor(task.status);
                    
                    return (
                      <div
                        key={task.id || index}
                        style={{
                          padding: '20px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          borderLeft: `4px solid ${priorityColor}`,
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Status Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '20px',
                          right: '20px',
                          padding: '4px 12px',
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: statusColor,
                            borderRadius: '50%'
                          }}></div>
                          {task.status?.toUpperCase()}
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: '#1f2937',
                                marginBottom: '8px',
                                lineHeight: '1.4'
                              }}>
                                {task.title}
                              </h3>
                              
                              {task.description && (
                                <p style={{ 
                                  fontSize: '14px', 
                                  color: '#6b7280',
                                  marginBottom: '12px',
                                  lineHeight: '1.5'
                                }}>
                                  {task.description.length > 100 
                                    ? `${task.description.substring(0, 100)}...` 
                                    : task.description}
                                </p>
                              )}
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                {/* Priorità */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: priorityColor,
                                    borderRadius: '50%'
                                  }}></div>
                                  <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                    {task.priority?.toUpperCase() || 'MEDIA'}
                                  </span>
                                </div>
                                
                                {/* Scadenza */}
                                {task.dueDate && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '14px' }}>📅</span>
                                    <span style={{ 
                                      fontSize: '13px', 
                                      color: isOverdue ? '#ef4444' : '#6b7280',
                                      fontWeight: isOverdue ? '600' : '400'
                                    }}>
                                      {formatDate(task.dueDate)}
                                      {daysRemaining !== null && (
                                        <span style={{ 
                                          marginLeft: '8px',
                                          padding: '2px 8px',
                                          backgroundColor: isOverdue ? '#fee2e2' : 
                                                         daysRemaining === 0 ? '#fef3c7' : '#dbeafe',
                                          color: isOverdue ? '#dc2626' : 
                                                daysRemaining === 0 ? '#92400e' : '#1e40af',
                                          borderRadius: '4px',
                                          fontSize: '11px',
                                          fontWeight: '600'
                                        }}>
                                          {isOverdue ? `RITARDO ${Math.abs(daysRemaining)}g` : 
                                           daysRemaining === 0 ? 'OGGI' : 
                                           `${daysRemaining}g`}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progresso e Azioni */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '16px',
                          borderTop: '1px solid #e5e7eb'
                        }}>
                          {/* Progress Bar */}
                          <div style={{ flex: 1, maxWidth: '250px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>Progresso</span>
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#3b82f6', 
                                fontWeight: '600' 
                              }}>
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
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginTop: '8px'
                            }}>
                              {[0, 25, 50, 75, 100].map(value => (
                                <button
                                  key={value}
                                  onClick={() => handleProgressChange(task.id, value)}
                                  style={{
                                    padding: '4px 10px',
                                    backgroundColor: value === task.progress ? '#3b82f6' : '#f3f4f6',
                                    color: value === task.progress ? 'white' : '#6b7280',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: value === task.progress ? '600' : '400',
                                    transition: 'all 0.2s'
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
                          
                          {/* Azioni */}
                          <div style={{ display: 'flex', gap: '10px' }}>
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
                                paddingRight: '30px'
                              }}
                            >
                              <option value="assegnato" style={{ backgroundColor: '#3b82f6' }}>Assegnato</option>
                              <option value="in corso" style={{ backgroundColor: '#f59e0b' }}>In Corso</option>
                              <option value="completato" style={{ backgroundColor: '#10b981' }}>Completato</option>
                              <option value="bloccato" style={{ backgroundColor: '#ef4444' }}>Bloccato</option>
                            </select>
                            

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Colonna Destra: Accesso Rapido e Performance */}
          <div>
            {/* Accesso Rapido */}
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: '20px'
            }}>
              <h2 style={{ 
                color: '#1f2937', 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                Accesso Rapido
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { 
                    icon: '📋', 
                    label: 'I Miei Task', 
                    desc: 'Gestisci tutti i tuoi task', 
                    path: '/employee/tasks',
                    color: '#3b82f6'
                  },
                  { 
                    icon: '📊', 
                    label: 'I Miei Report', 
                    desc: 'Statistiche e performance', 
                    path: '/employee/reports',
                    color: '#10b981'
                  },
                  { 
                    icon: '🗑️', 
                    label: 'Cestino', 
                    desc: 'Task eliminati di recente', 
                    path: '/employee/trash',
                    color: '#6b7280'
                  },
                  { 
                    icon: '👤', 
                    label: 'Il Mio Profilo', 
                    desc: 'Aggiorna informazioni personali', 
                    path: '/employee/profile',
                    color: '#8b5cf6'
                  },
                  { 
                    icon: '🔄', 
                    label: 'Cronologia', 
                    desc: 'Storico delle tue attività', 
                    path: '/employee/history',
                    color: '#f59e0b'
                  },
                  { 
                    icon: '💬', 
                    label: 'Messaggi', 
                    desc: 'Comunicazioni e notifiche', 
                    path: '/employee/messages',
                    color: '#ec4899'
                  }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(item.path)}
                    style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}>
                        {item.label}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        {item.desc}
                      </div>
                    </div>
                    <div style={{ 
                      color: '#9ca3af',
                      fontSize: '14px',
                      opacity: 0
                    }}>
                      →
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance */}
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: '20px'
            }}>
              <h2 style={{ 
                color: '#1f2937', 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>📈</span>
                La Tua Performance
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Progresso */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Completamento Task</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                      {myStats.completionRate}%
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${myStats.completionRate}%`,
                        backgroundColor: '#10b981',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
                
                {/* Metriche */}
                {[
                  { label: 'Produttività Settimanale', value: `${myStats.completedThisWeek} task`, color: '#3b82f6' },
                  { label: 'Puntualità', value: myStats.overdue === 0 ? '100%' : `${Math.round(((myStats.totalTasks - myStats.overdue) / myStats.totalTasks) * 100)}%`, color: myStats.overdue === 0 ? '#10b981' : '#f59e0b' },
                  { label: 'Task/Giorno', value: myStats.totalTasks > 0 ? (myStats.completed / 30).toFixed(1) : '0.0', color: '#8b5cf6' },
                  { label: 'Attività Recente', value: tasks.length > 0 ? formatDate(tasks[0].updatedAt || tasks[0].createdAt) : 'Nessuna', color: '#6b7280' }
                ].map((metric, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>{metric.label}</span>
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: '600', 
                      color: metric.color 
                    }}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Punteggio Complessivo */}
              <div style={{ 
                marginTop: '25px', 
                paddingTop: '20px', 
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                  Punteggio complessivo
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: myStats.completionRate >= 80 ? '#10b981' : 
                         myStats.completionRate >= 60 ? '#f59e0b' : '#ef4444',
                  marginBottom: '6px'
                }}>
                  {myStats.completionRate >= 80 ? '👑 Eccellente' : 
                   myStats.completionRate >= 60 ? '👍 Buono' : '📈 Da migliorare'}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Basato su completamento e puntualità
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stile per animazione spin */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;