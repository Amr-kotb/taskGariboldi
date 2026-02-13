import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
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

const formatDateTime = (date) => {
  if (!date) return 'N/D';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return 'N/D';
  }
};

const getDaysInTrash = (deletedAt) => {
  if (!deletedAt) return 0;
  try {
    const deleted = deletedAt.toDate ? deletedAt.toDate() : new Date(deletedAt);
    const now = new Date();
    const diffTime = now - deleted;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 0;
  }
};

const getPriorityColor = (priority) => {
  const colors = {
    critica: '#dc2626',
    alta: '#ef4444',
    media: '#f59e0b',
    bassa: '#10b981'
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

const EmployeeTrash = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    deletedTasks, 
    loading, 
    error, 
    loadDeletedTasks, 
    restoreTask, 
    deletePermanently,
    emptyTrash,
    bulkRestoreTasks,
    bulkDeletePermanently,
    tasks // Task attivi per statistiche
  } = useTasks();
  
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDays, setFilterDays] = useState('all');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToAction, setTaskToAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  console.log('🗑️ [EmployeeTrash] Pagina cestino caricata');

  // Carica task eliminati al mount
  useEffect(() => {
    if (user?.uid) {
      loadDeletedTasks(user.uid);
    }
  }, [user, loadDeletedTasks]);

  // Reset selezione quando cambiano i task
  useEffect(() => {
    if (selectedTasks.length > 0 && deletedTasks.length === 0) {
      setSelectedTasks([]);
    }
  }, [deletedTasks]);

  // Statistiche del cestino
  const trashStats = useMemo(() => {
    const totalDeleted = deletedTasks.length;
    const today = new Date();
    
    // Task eliminati oggi
    const deletedToday = deletedTasks.filter(task => {
      if (!task.deletedAt) return false;
      const deleted = task.deletedAt.toDate ? task.deletedAt.toDate() : new Date(task.deletedAt);
      return deleted.toDateString() === today.toDateString();
    }).length;
    
    // Task eliminati questa settimana
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const deletedThisWeek = deletedTasks.filter(task => {
      if (!task.deletedAt) return false;
      const deleted = task.deletedAt.toDate ? task.deletedAt.toDate() : new Date(task.deletedAt);
      return deleted >= weekAgo;
    }).length;
    
    // Task che scadranno presto (eliminazione permanente in 7 giorni)
    const deletionThreshold = 30; // giorni prima dell'eliminazione permanente
    const soonToDelete = deletedTasks.filter(task => {
      const daysInTrash = getDaysInTrash(task.deletedAt);
      return daysInTrash >= (deletionThreshold - 7);
    }).length;
    
    // Distribuzione per priorità
    const priorityDistribution = {
      critica: deletedTasks.filter(t => t.priority === 'critica').length,
      alta: deletedTasks.filter(t => t.priority === 'alta').length,
      media: deletedTasks.filter(t => t.priority === 'media').length,
      bassa: deletedTasks.filter(t => t.priority === 'bassa').length
    };
    
    // Spazio totale (simulato)
    const totalSize = totalDeleted * 2.5; // KB simulati
    
    return {
      totalDeleted,
      deletedToday,
      deletedThisWeek,
      soonToDelete,
      priorityDistribution,
      totalSize,
      daysUntilPermanent: 30
    };
  }, [deletedTasks]);

  // Task filtrati
  const filteredTasks = useMemo(() => {
    let result = [...deletedTasks];
    
    // Filtro per ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.category && task.category.toLowerCase().includes(query))
      );
    }
    
    // Filtro per status originale
    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }
    
    // Filtro per priorità
    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }
    
    // Filtro per giorni nel cestino
    if (filterDays !== 'all') {
      const now = new Date();
      let daysAgo;
      
      switch (filterDays) {
        case 'today':
          daysAgo = 1;
          break;
        case 'week':
          daysAgo = 7;
          break;
        case 'month':
          daysAgo = 30;
          break;
        default:
          daysAgo = 0;
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      result = result.filter(task => {
        if (!task.deletedAt) return false;
        const deleted = task.deletedAt.toDate ? task.deletedAt.toDate() : new Date(task.deletedAt);
        return deleted >= cutoffDate;
      });
    }
    
    // Ordinamento per data eliminazione (più recenti prima)
    result.sort((a, b) => {
      const dateA = a.deletedAt ? (a.deletedAt.toDate ? a.deletedAt.toDate() : new Date(a.deletedAt)) : new Date(0);
      const dateB = b.deletedAt ? (b.deletedAt.toDate ? b.deletedAt.toDate() : new Date(b.deletedAt)) : new Date(0);
      return dateB - dateA;
    });
    
    return result;
  }, [deletedTasks, searchQuery, filterStatus, filterPriority, filterDays]);

  // Gestione selezione task
  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
  };

  // Ripristina task
  const handleRestoreTask = async (taskId) => {
    if (!user?.uid) return;
    
    setActionLoading(true);
    try {
      const result = await restoreTask(taskId);
      if (result.success) {
        // Rimuovi dalla selezione
        setSelectedTasks(prev => prev.filter(id => id !== taskId));
      }
    } catch (error) {
      console.error('Errore ripristino task:', error);
    } finally {
      setActionLoading(false);
      setShowRestoreModal(false);
      setTaskToAction(null);
    }
  };

  // Eliminazione permanente task
  const handleDeletePermanently = async (taskId) => {
    if (!user?.uid) return;
    
    setActionLoading(true);
    try {
      const result = await deletePermanently(taskId);
      if (result.success) {
        // Rimuovi dalla selezione
        setSelectedTasks(prev => prev.filter(id => id !== taskId));
      }
    } catch (error) {
      console.error('Errore eliminazione permanente:', error);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setTaskToAction(null);
    }
  };

  // Ripristino multiplo
  const handleBulkRestore = async () => {
    if (selectedTasks.length === 0 || !user?.uid) return;
    
    setActionLoading(true);
    try {
      const result = await bulkRestoreTasks(selectedTasks);
      if (result.success) {
        setSelectedTasks([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error('Errore ripristino bulk:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminazione permanente multipla
  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0 || !user?.uid) return;
    
    if (!window.confirm(`Sei sicuro di voler eliminare definitivamente ${selectedTasks.length} task? Questa azione è irreversibile.`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await bulkDeletePermanently(selectedTasks);
      if (result.success) {
        setSelectedTasks([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error('Errore eliminazione bulk:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Svuota cestino
  const handleEmptyTrash = async () => {
    if (!user?.uid || deletedTasks.length === 0) return;
    
    if (!window.confirm(`Sei sicuro di voler svuotare il cestino? ${deletedTasks.length} task verranno eliminati definitivamente. Questa azione è irreversibile.`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await emptyTrash(user.uid);
      if (result.success) {
        setSelectedTasks([]);
      }
    } catch (error) {
      console.error('Errore svuotamento cestino:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Calcola giorni rimanenti prima dell'eliminazione permanente
  const getDaysRemaining = (deletedAt) => {
    const daysInTrash = getDaysInTrash(deletedAt);
    return Math.max(0, 30 - daysInTrash);
  };

  // Ottieni colore per giorni rimanenti
  const getDaysRemainingColor = (daysRemaining) => {
    if (daysRemaining <= 7) return '#ef4444';
    if (daysRemaining <= 14) return '#f59e0b';
    return '#10b981';
  };

  if (loading && deletedTasks.length === 0) {
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
      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif"
    }}>
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
              🗑️ Cestino
            </h1>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '15px' }}>
              Task eliminati di recente. I task rimangono nel cestino per 30 giorni prima dell'eliminazione definitiva.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/employee/tasks')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📋 Task Attivi
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 30px 30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Statistiche Cestino */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {[
            { 
              title: 'Task Eliminati', 
              value: trashStats.totalDeleted, 
              color: '#ef4444', 
              icon: '🗑️',
              description: 'Totale nel cestino'
            },
            { 
              title: 'Eliminati Oggi', 
              value: trashStats.deletedToday, 
              color: '#f59e0b', 
              icon: '📅',
              description: 'Task eliminati oggi'
            },
            { 
              title: 'Da Eliminare Presto', 
              value: trashStats.soonToDelete, 
              color: '#dc2626', 
              icon: '⏰',
              description: 'Tra 7 giorni o meno'
            },
            { 
              title: 'Giorni Rimanenti', 
              value: trashStats.daysUntilPermanent, 
              color: '#10b981', 
              icon: '📆',
              description: 'Prima dell\'eliminazione'
            },
            { 
              title: 'Spazio Occupato', 
              value: `${trashStats.totalSize.toFixed(1)} KB`, 
              color: '#3b82f6', 
              icon: '💾',
              description: 'Stima spazio storage'
            }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${stat.color}`,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px', color: stat.color }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: stat.color, marginBottom: '8px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                {stat.title}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Barra di Controllo */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            
            {/* Barra di Ricerca */}
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Cerca nel cestino..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: '#f9fafb'
                  }}
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
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  backgroundColor: 'white',
                  minWidth: '140px'
                }}
              >
                <option value="all">📊 Tutti gli stati</option>
                <option value="assegnato">🔵 Assegnati</option>
                <option value="in corso">🟡 In Corso</option>
                <option value="completato">🟢 Completati</option>
                <option value="bloccato">🔴 Bloccati</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  backgroundColor: 'white',
                  minWidth: '140px'
                }}
              >
                <option value="all">🎯 Tutte le priorità</option>
                <option value="critica">🔴 Critica</option>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="bassa">🟢 Bassa</option>
              </select>
              
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  backgroundColor: 'white',
                  minWidth: '140px'
                }}
              >
                <option value="all">📅 Tutti i periodi</option>
                <option value="today">Oggi</option>
                <option value="week">Ultima settimana</option>
                <option value="month">Ultimo mese</option>
              </select>
              
              <button
                onClick={handleEmptyTrash}
                disabled={deletedTasks.length === 0 || actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: deletedTasks.length === 0 ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deletedTasks.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {actionLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Svuotamento...
                  </>
                ) : (
                  '🧹 Svuota Cestino'
                )}
              </button>
            </div>
          </div>
          
          {/* Messaggi di errore */}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              marginTop: '16px',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
        
        {/* Azioni Bulk */}
        {selectedTasks.length > 0 && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {selectedTasks.length}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0369a1' }}>
                    {selectedTasks.length} task selezionati
                  </div>
                  <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
                    Cosa vuoi fare con questi task?
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleBulkRestore}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: actionLoading ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {actionLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Ripristino...
                    </>
                  ) : (
                    '🔄 Ripristina Selezionati'
                  )}
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  disabled={actionLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: actionLoading ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {actionLoading ? (
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
                    '💀 Elimina Definitivamente'
                  )}
                </button>
                
                <button
                  onClick={() => setSelectedTasks([])}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ✖️ Annulla Selezione
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Lista Task Eliminati */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          {/* Header Tabella */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 2fr 1fr 1fr 1fr 1fr auto',
            gap: '16px',
            padding: '20px 24px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: '600',
            color: '#374151',
            fontSize: '14px'
          }}>
            <div>
              <input
                type="checkbox"
                checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                onChange={handleSelectAll}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
            </div>
            <div>Task</div>
            <div>Priorità</div>
            <div>Eliminato il</div>
            <div>Giorni nel Cestino</div>
            <div>Status Originale</div>
            <div>Azioni</div>
          </div>
          
          {filteredTasks.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', color: '#d1d5db' }}>
                🗑️
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                color: '#1f2937', 
                marginBottom: '12px',
                fontWeight: '600'
              }}>
                Il cestino è vuoto
              </h3>
              <p style={{ 
                fontSize: '15px', 
                color: '#6b7280',
                marginBottom: '24px',
                maxWidth: '500px',
                margin: '0 auto 24px'
              }}>
                {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterDays !== 'all'
                  ? 'Nessun task corrisponde ai filtri selezionati.'
                  : 'Non ci sono task eliminati al momento.'}
              </p>
              {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterDays !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setFilterDays('all');
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}
                >
                  🗑️ Cancella filtri
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredTasks.map((task) => {
                const daysInTrash = getDaysInTrash(task.deletedAt);
                const daysRemaining = getDaysRemaining(task.deletedAt);
                const daysRemainingColor = getDaysRemainingColor(daysRemaining);
                const priorityColor = getPriorityColor(task.priority);
                const statusColor = getStatusColor(task.status);
                const isSelected = selectedTasks.includes(task.id);
                
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 2fr 1fr 1fr 1fr 1fr auto',
                      gap: '16px',
                      padding: '20px 24px',
                      borderBottom: '1px solid #e5e7eb',
                      alignItems: 'center',
                      backgroundColor: isSelected ? '#f0f9ff' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    {/* Checkbox */}
                    <div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectTask(task.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    
                    {/* Titolo e Descrizione */}
                    <div>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        marginBottom: '6px'
                      }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#6b7280',
                          lineHeight: '1.4'
                        }}>
                          {task.description.length > 60 
                            ? `${task.description.substring(0, 60)}...` 
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
                    
                    {/* Data Eliminazione */}
                    <div>
                      <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500', marginBottom: '4px' }}>
                        {formatDate(task.deletedAt)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatDateTime(task.deletedAt)}
                      </div>
                    </div>
                    
                    {/* Giorni nel Cestino */}
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#1f2937', 
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {daysInTrash} giorni
                      </div>
                      <div style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        backgroundColor: `${daysRemainingColor}15`,
                        color: daysRemainingColor,
                        borderRadius: '12px',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {daysRemaining > 0 ? `${daysRemaining}g rimanenti` : 'DA ELIMINARE'}
                      </div>
                    </div>
                    
                    {/* Status Originale */}
                    <div>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {task.status?.toUpperCase() || 'ASSEGNATO'}
                      </div>
                    </div>
                    
                    {/* Azioni */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setTaskToAction(task);
                          setShowRestoreModal(true);
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f0f9ff',
                          color: '#0ea5e9',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        🔄 Ripristina
                      </button>
                      
                      <button
                        onClick={() => {
                          setTaskToAction(task);
                          setShowDeleteModal(true);
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        🗑️ Elimina
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Footer Tabella */}
          {filteredTasks.length > 0 && (
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
                Mostrati <strong>{filteredTasks.length}</strong> di <strong>{deletedTasks.length}</strong> task eliminati
              </div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                I task vengono eliminati definitivamente dopo 30 giorni
              </div>
            </div>
          )}
        </div>
        
        {/* Note Informative */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ 
              fontSize: '32px', 
              color: '#0ea5e9',
              flexShrink: 0
            }}>
              💡
            </div>
            <div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#0369a1',
                marginBottom: '12px'
              }}>
                Informazioni sul Cestino
              </h3>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {[
                  '🗑️ I task eliminati rimangono nel cestino per 30 giorni',
                  '🔄 Puoi ripristinare i task in qualsiasi momento prima della cancellazione definitiva',
                  '⏰ I task vengono automaticamente eliminati dopo 30 giorni',
                  '📊 Puoi filtrare i task per data, priorità o stato originale',
                  '⚠️ L\'eliminazione definitiva è irreversibile',
                  '💾 Il cestino non influisce sulle statistiche dei task attivi'
                ].map((tip, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      color: '#0c4a6e'
                    }}
                  >
                    {tip}
                  </div>
                ))}
              </div>
              
              <div style={{ 
                fontSize: '14px', 
                color: '#0284c7',
                fontStyle: 'italic'
              }}>
                Suggerimento: Ripristina i task importanti entro 7 giorni dall\'eliminazione per evitare perdite accidentali.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Ripristino */}
      {showRestoreModal && taskToAction && (
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
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', color: '#10b981' }}>🔄</div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Ripristina Task
              </h2>
            </div>
            
            <div style={{ 
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', color: '#0369a1', marginBottom: '8px', fontWeight: '500' }}>
                Task da ripristinare:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                {taskToAction.title}
              </div>
              {taskToAction.description && (
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                  {taskToAction.description.length > 100 
                    ? `${taskToAction.description.substring(0, 100)}...` 
                    : taskToAction.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '4px 10px',
                  backgroundColor: `${getPriorityColor(taskToAction.priority)}15`,
                  color: getPriorityColor(taskToAction.priority),
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {taskToAction.priority}
                </div>
                <div style={{
                  padding: '4px 10px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Eliminato: {formatDate(taskToAction.deletedAt)}
                </div>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ fontSize: '16px', color: '#065f46' }}>💡</div>
                <div style={{ fontSize: '14px', color: '#065f46' }}>
                  Il task verrà ripristinato e tornará nella lista dei tuoi task attivi con stato "assegnato".
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setTaskToAction(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Annulla
              </button>
              <button
                onClick={() => handleRestoreTask(taskToAction.id)}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: actionLoading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {actionLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Ripristino...
                  </>
                ) : (
                  '🔄 Conferma Ripristino'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Eliminazione Definitiva */}
      {showDeleteModal && taskToAction && (
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
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '24px', color: '#ef4444' }}>⚠️</div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Eliminazione Definitiva
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
                <div style={{ fontSize: '20px', color: '#dc2626' }}>🚨</div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                    Attenzione: Questa azione è irreversibile!
                  </h3>
                  <p style={{ fontSize: '14px', color: '#991b1b', lineHeight: '1.5' }}>
                    Il task verrà eliminato definitivamente e non sarà più recuperabile.
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
                  {taskToAction.title}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                  Eliminato il: {formatDate(taskToAction.deletedAt)}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '4px 10px',
                    backgroundColor: `${getPriorityColor(taskToAction.priority)}15`,
                    color: getPriorityColor(taskToAction.priority),
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {taskToAction.priority}
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Nel cestino da {getDaysInTrash(taskToAction.deletedAt)} giorni
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToAction(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Annulla
              </button>
              <button
                onClick={() => handleDeletePermanently(taskToAction.id)}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: actionLoading ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {actionLoading ? (
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
                  '🗑️ Elimina Definitivamente'
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
      `}</style>
    </div>
  );
};

export default EmployeeTrash;
