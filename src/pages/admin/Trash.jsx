import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTasks } from '../../hooks/useTasks.jsx';
import './trash.css';

// Definizione costante per i colori delle priorità
const PRIORITY_COLORS = {
  critica: '#dc2626',
  alta: '#ef4444',
  media: '#f59e0b',
  bassa: '#10b981'
};

// Lista degli utenti specifici
const USER_LIST = [
  { id: 'andrea', name: 'Andrea', emoji: '👨‍💼' },
  { id: 'stefano', name: 'Stefano', emoji: '👨‍🔧' },
  { id: 'domenico', name: 'Domenico', emoji: '👨‍💻' },
  { id: 'leonardo', name: 'Leonardo', emoji: '👨‍🎨' }
];

// Componenti UI modulari
const LoadingSpinner = () => (
  <div className="admin-trash-loading">
    <div className="loading-spinner"></div>
    <p>Caricamento cestino globale...</p>
  </div>
);

const AccessDenied = ({ navigate }) => (
  <div className="access-denied">
    <div className="access-content">
      <div className="access-icon">🔒</div>
      <h2 className="access-title">Accesso Riservato</h2>
      <p className="access-message">
        Solo gli amministratori possono accedere al cestino globale.
      </p>
      <div className="access-actions">
        <button onClick={() => navigate('/')} className="btn-secondary">
          Torna alla Dashboard
        </button>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, color, icon, description }) => (
  <div className="stat-card">
    <div className="stat-card-content">
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stat-text">
        <div className="stat-value" style={{ color }}>
          {value}
        </div>
        <div className="stat-title">{title}</div>
        <div className="stat-description">{description}</div>
      </div>
    </div>
  </div>
);

const TaskItem = ({ 
  task, 
  isSelected, 
  onSelect, 
  onRestore, 
  onDelete,
  actionLoading 
}) => {
  const daysInTrash = Math.max(0, Math.floor((new Date() - new Date(task.deletedAt)) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, 30 - daysInTrash);
  
  const getDaysRemainingColor = (days) => {
    if (days <= 3) return '#ef4444';
    if (days <= 7) return '#f59e0b';
    return '#10b981';
  };

  const priorityColor = PRIORITY_COLORS[task.priority] || '#6b7280';
  const expiryColor = getDaysRemainingColor(daysRemaining);

  // Trova l'emoji corrispondente all'utente
  const userEmoji = USER_LIST.find(u => 
    task.deletedByName?.toLowerCase().includes(u.name.toLowerCase()) || 
    task.deletedByName?.toLowerCase() === u.id.toLowerCase()
  )?.emoji || '👤';

  return (
    <div className={`trash-item ${isSelected ? 'selected' : ''}`}>
      <div className="trash-item-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(task.id)}
          disabled={actionLoading}
        />
      </div>
      
      <div className="trash-item-content">
        <div className="item-main">
          <div className="item-header">
            <div className="item-title">{task.title}</div>
            <div className="item-badges">
              <div 
                className="item-priority-badge"
                style={{ 
                  backgroundColor: `${priorityColor}15`,
                  color: priorityColor
                }}
              >
                {task.priority?.toUpperCase() || 'N/A'}
              </div>
              <div 
                className="expiry-badge"
                style={{ 
                  backgroundColor: `${expiryColor}15`,
                  color: expiryColor
                }}
              >
                {daysRemaining > 0 
                  ? `${daysRemaining} giorni`
                  : 'SCADUTO'}
              </div>
            </div>
          </div>
          
          {task.description && (
            <div className="item-description">
              {task.description.length > 120 
                ? `${task.description.substring(0, 120)}...` 
                : task.description}
            </div>
          )}
          
          <div className="item-meta">
            <div className="meta-group">
              <div className="meta-item">
                <span className="meta-icon">{userEmoji}</span>
                <span className="meta-value">{task.deletedByName || 'Sconosciuto'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span className="meta-value">
                  {new Date(task.deletedAt).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>
            <div className="meta-group">
              <div className="meta-item">
                <span className="meta-label">Nel cestino:</span>
                <span className="meta-value">{daysInTrash} giorni</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="trash-item-actions">
        <button
          onClick={() => onRestore(task.id)}
          disabled={actionLoading}
          className="btn-action btn-restore"
          title="Ripristina task"
        >
          <span className="btn-icon">↩️</span>
          <span className="btn-text">Ripristina</span>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          disabled={actionLoading}
          className="btn-action btn-delete"
          title="Elimina definitivamente"
        >
          <span className="btn-icon">🗑️</span>
          <span className="btn-text">Elimina</span>
        </button>
      </div>
    </div>
  );
};

const BulkActionsBar = ({ selectedItems, onBulkRestore, onBulkDelete, onClearSelection, actionLoading }) => {
  if (selectedItems.length === 0) return null;
  
  return (
    <div className="bulk-actions-bar">
      <div className="bulk-content">
        <div className="bulk-info">
          <span className="selected-count">{selectedItems.length}</span>
          <span className="bulk-text">elementi selezionati</span>
        </div>
        
        <div className="bulk-buttons">
          <button
            onClick={onBulkRestore}
            disabled={actionLoading}
            className="btn-bulk btn-restore"
          >
            <span className="btn-icon">↩️</span>
            <span>Ripristina Selezionati</span>
          </button>
          
          <button
            onClick={onBulkDelete}
            disabled={actionLoading}
            className="btn-bulk btn-delete"
          >
            <span className="btn-icon">🗑️</span>
            <span>Elimina Selezionati</span>
          </button>
          
          <button
            onClick={onClearSelection}
            className="btn-bulk btn-cancel"
          >
            <span className="btn-icon">✖️</span>
            <span>Deseleziona</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyTrashWarning = ({ expiringSoon, onEmptyTrash, totalDeleted, actionLoading }) => {
  if (totalDeleted === 0) return null;
  
  return (
    <div className="empty-trash-warning">
      <div className="warning-content">
        <div className="warning-header">
          <span className="warning-icon">⚠️</span>
          <h3 className="warning-title">Attenzione: Scadenza Automatica</h3>
        </div>
        <p className="warning-text">
          I task vengono eliminati automaticamente dopo 30 giorni nel cestino.
          {expiringSoon > 0 && ` ${expiringSoon} task scadono a breve.`}
        </p>
        <button
          onClick={onEmptyTrash}
          disabled={actionLoading}
          className="btn-empty-trash"
        >
          <span className="btn-icon">🧹</span>
          <span>Svuota Cestino Globale</span>
        </button>
      </div>
    </div>
  );
};

// Componente principale
const AdminTrash = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    deletedTasks, 
    loading, 
    loadDeletedTasks, 
    restoreTask, 
    deletePermanently,
    emptyTrash,
    bulkRestoreTasks,
    bulkDeletePermanently
  } = useTasks();
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDays, setFilterDays] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  // Carica dati iniziali
  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadDeletedTasks('all');
      } catch (error) {
        console.error('Errore inizializzazione cestino:', error);
      }
    };
    
    initializeData();
  }, []);

  // Statistiche avanzate
  const trashStats = useMemo(() => {
    const totalDeleted = deletedTasks.length;
    const now = new Date();
    
    // Calcolo statistiche per utente
    const userStats = {};
    USER_LIST.forEach(user => {
      userStats[user.id] = deletedTasks.filter(task => 
        task.deletedByName?.toLowerCase().includes(user.name.toLowerCase()) || 
        task.deletedByName?.toLowerCase() === user.id.toLowerCase()
      ).length;
    });

    // Calcolo statistiche
    const stats = {
      totalDeleted,
      deletedToday: deletedTasks.filter(task => {
        const deleted = new Date(task.deletedAt);
        return deleted.toDateString() === now.toDateString();
      }).length,
      deletedWeek: deletedTasks.filter(task => {
        const deleted = new Date(task.deletedAt);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return deleted >= weekAgo;
      }).length,
      uniqueUsers: new Set(deletedTasks.map(task => task.deletedByName).filter(Boolean)).size,
      expiringSoon: deletedTasks.filter(task => {
        const deleted = new Date(task.deletedAt);
        const daysInTrash = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
        return daysInTrash >= 25;
      }).length,
      userDistribution: userStats,
      priorityDistribution: {
        critica: deletedTasks.filter(t => t.priority === 'critica').length,
        alta: deletedTasks.filter(t => t.priority === 'alta').length,
        media: deletedTasks.filter(t => t.priority === 'media').length,
        bassa: deletedTasks.filter(t => t.priority === 'bassa').length
      },
      totalSize: (totalDeleted * 2.5).toFixed(1),
      averageDaysInTrash: totalDeleted > 0 
        ? Math.floor(deletedTasks.reduce((sum, task) => {
            const deleted = new Date(task.deletedAt);
            return sum + Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
          }, 0) / totalDeleted)
        : 0
    };
    
    return stats;
  }, [deletedTasks]);

  // Filtri avanzati
  const filteredTasks = useMemo(() => {
    let result = [...deletedTasks];
    
    // Filtro ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.deletedByName?.toLowerCase().includes(query) ||
        task.deletedByEmail?.toLowerCase().includes(query)
      );
    }
    
    // Filtro utente specifico
    if (filterUser !== 'all') {
      const selectedUser = USER_LIST.find(u => u.id === filterUser);
      if (selectedUser) {
        result = result.filter(task => 
          task.deletedByName?.toLowerCase().includes(selectedUser.name.toLowerCase()) ||
          task.deletedByName?.toLowerCase() === selectedUser.id.toLowerCase()
        );
      }
    }
    
    // Filtro priorità
    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }
    
    // Filtro giorni
    if (filterDays !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filterDays) {
        case 'today':
          cutoffDate.setDate(cutoffDate.getDate() - 1);
          break;
        case 'week':
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setDate(cutoffDate.getDate() - 30);
          break;
        case 'critical':
          cutoffDate.setDate(cutoffDate.getDate() - 25);
          result = result.filter(task => {
            const deleted = new Date(task.deletedAt);
            const daysInTrash = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
            return daysInTrash >= 25;
          });
          break;
      }
      
      if (filterDays !== 'critical') {
        result = result.filter(task => {
          const deleted = new Date(task.deletedAt);
          return deleted >= cutoffDate;
        });
      }
    }
    
    // Ordinamento
    result.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
    
    return result;
  }, [deletedTasks, searchQuery, filterUser, filterPriority, filterDays]);

  // Gestione selezione
  const handleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === filteredTasks.length 
        ? [] 
        : filteredTasks.map(task => task.id)
    );
  };

  // Azioni singole
  const handleRestoreTask = async (taskId) => {
    if (!window.confirm('Ripristinare questo task?')) return;
    
    setActionLoading(true);
    try {
      await restoreTask(taskId);
      setSelectedItems(prev => prev.filter(id => id !== taskId));
    } catch (error) {
      console.error('Errore ripristino:', error);
      alert('Errore durante il ripristino');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermanently = async (taskId) => {
    if (!window.confirm('Eliminare definitivamente questo task? L\'azione è irreversibile.')) return;
    
    setActionLoading(true);
    try {
      await deletePermanently(taskId);
      setSelectedItems(prev => prev.filter(id => id !== taskId));
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore durante l\'eliminazione');
    } finally {
      setActionLoading(false);
    }
  };

  // Azioni bulk
  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`Ripristinare ${selectedItems.length} task selezionati?`)) return;
    
    setActionLoading(true);
    try {
      await bulkRestoreTasks(selectedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Errore ripristino bulk:', error);
      alert('Errore durante il ripristino multiplo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`Eliminare definitivamente ${selectedItems.length} task? Questa azione è irreversibile.`)) return;
    
    setActionLoading(true);
    try {
      await bulkDeletePermanently(selectedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Errore eliminazione bulk:', error);
      alert('Errore durante l\'eliminazione multipla');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (deletedTasks.length === 0) return;
    
    if (!window.confirm(`Svuotare completamente il cestino? ${deletedTasks.length} task verranno eliminati definitivamente.`)) return;
    
    setActionLoading(true);
    try {
      await emptyTrash('all');
      setSelectedItems([]);
    } catch (error) {
      console.error('Errore svuotamento:', error);
      alert('Errore durante lo svuotamento del cestino');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterUser('all');
    setFilterDays('all');
    setFilterPriority('all');
  };

  // Stati di caricamento
  if (loading) return <LoadingSpinner />;
  
  if (!user || user.role !== 'admin') {
    return <AccessDenied navigate={navigate} />;
  }

  const hasActiveFilters = searchQuery || filterUser !== 'all' || filterDays !== 'all' || filterPriority !== 'all';

  return (
    <div className="admin-trash-container">
      {/* Header */}
      <header className="admin-trash-header">
        <div className="header-container">
          <button onClick={() => navigate('/admin/dashboard')} className="btn-back">
            ← Dashboard
          </button>
          
          <div className="header-content">
            <div className="header-title-section">
              <h1 className="header-title">
                <span className="header-icon">🗑️</span>
                Cestino Globale
              </h1>
              <p className="header-subtitle">
                Gestione centralizzata dei task eliminati
              </p>
            </div>
            
            <div className="header-stats">
              <div className="stat-badge">
                <span className="stat-label">Task totali</span>
                <span className="stat-value">{trashStats.totalDeleted}</span>
              </div>
              <div className="stat-badge">
                <span className="stat-label">Utenti</span>
                <span className="stat-value">{trashStats.uniqueUsers}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Barra delle azioni bulk */}
      <BulkActionsBar
        selectedItems={selectedItems}
        onBulkRestore={handleBulkRestore}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedItems([])}
        actionLoading={actionLoading}
      />

      {/* Contenuto principale */}
      <main className="admin-trash-content">
        {/* Sezione statistiche */}
        <section className="stats-section">
          <h2 className="section-title">📊 Panoramica</h2>
          <div className="stats-grid">
            <StatCard
              title="Task Eliminati"
              value={trashStats.totalDeleted}
              color="#ef4444"
              icon="🗑️"
              description="Totale nel cestino"
            />
            
            <StatCard
              title="Spazio Occupato"
              value={`${trashStats.totalSize} KB`}
              color="#3b82f6"
              icon="💾"
              description="Stima spazio storage"
            />
            
            <StatCard
              title="Da Eliminare"
              value={trashStats.expiringSoon}
              color="#dc2626"
              icon="⏰"
              description="Scadenza imminente"
            />
            
            <StatCard
              title="Giorni Medi"
              value={trashStats.averageDaysInTrash}
              color="#10b981"
              icon="📊"
              description="Tempo medio nel cestino"
            />
          </div>
        </section>

        {/* Sezione filtri */}
        <section className="filters-section">
          <div className="filters-header">
            <h3 className="section-title">🔍 Filtri e Ricerca</h3>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="btn-clear-filters">
                Pulisci filtri
              </button>
            )}
          </div>
          
          <div className="filters-grid">
            <div className="search-container">
              <input
                type="text"
                placeholder="Cerca per titolo, descrizione o utente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <div className="filter-group">
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="filter-select"
              >
                <option value="all">👤 Tutti gli utenti</option>
                {USER_LIST.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.emoji} {user.name}
                  </option>
                ))}
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="filter-select"
              >
                <option value="all">🎯 Tutte le priorità</option>
                <option value="critica">🔴 Critica</option>
                <option value="alta">🟠 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="bassa">🟢 Bassa</option>
              </select>
              
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="filter-select"
              >
                <option value="all">📅 Tutti i periodi</option>
                <option value="today">⏰ Ultime 24h</option>
                <option value="week">📅 Ultima settimana</option>
                <option value="month">🗓️ Ultimo mese</option>
                <option value="critical">⚠️ In scadenza</option>
              </select>
            </div>
          </div>
        </section>

        {/* Sezione task */}
        <section className="tasks-section">
          <div className="tasks-header">
            <div className="tasks-header-left">
              <div className="select-all">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredTasks.length && filteredTasks.length > 0}
                  onChange={handleSelectAll}
                  disabled={filteredTasks.length === 0}
                />
                <span>Seleziona tutto</span>
              </div>
              <div className="tasks-count">
                {filteredTasks.length} di {deletedTasks.length} task
              </div>
            </div>
            <div className="tasks-header-right">
              <div className="auto-delete-info">
                <span className="info-icon">⏳</span>
                <span>Eliminazione automatica dopo 30 giorni</span>
              </div>
            </div>
          </div>
          
          <div className="tasks-container">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>{hasActiveFilters ? 'Nessun risultato' : 'Cestino vuoto'}</h3>
                <p>
                  {hasActiveFilters
                    ? 'Nessun task corrisponde ai filtri selezionati.'
                    : 'Il cestino globale è attualmente vuoto.'}
                </p>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="btn-clear-filters">
                    Pulisci filtri
                  </button>
                )}
              </div>
            ) : (
              <div className="tasks-list">
                {filteredTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isSelected={selectedItems.includes(task.id)}
                    onSelect={(id) => {
                      setSelectedItems(prev => 
                        prev.includes(id) 
                          ? prev.filter(item => item !== id)
                          : [...prev, id]
                      );
                    }}
                    onRestore={handleRestoreTask}
                    onDelete={handleDeletePermanently}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Avviso svuota cestino */}
        <EmptyTrashWarning
          expiringSoon={trashStats.expiringSoon}
          onEmptyTrash={handleEmptyTrash}
          totalDeleted={deletedTasks.length}
          actionLoading={actionLoading}
        />

        {/* Statistiche dettagliate */}
        <section className="detailed-stats">
          <h3 className="section-title">📈 Dettagli Statistiche</h3>
          <div className="detailed-stats-grid">
            <div className="detail-card">
              <h4 className="detail-title">Distribuzione per Priorità</h4>
              <div className="priority-distribution">
                {Object.entries(trashStats.priorityDistribution).map(([priority, count]) => (
                  <div key={priority} className="priority-item">
                    <div className="priority-info">
                      <div 
                        className="priority-dot" 
                        style={{ backgroundColor: PRIORITY_COLORS[priority] || '#6b7280' }}
                      />
                      <span className="priority-name">
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </div>
                    <span className="priority-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="detail-card">
              <h4 className="detail-title">Attività per Utente</h4>
              <div className="user-distribution">
                {USER_LIST.map(user => {
                  const userTasks = trashStats.userDistribution[user.id] || 0;
                  if (userTasks === 0) return null;
                  
                  return (
                    <div key={user.id} className="user-item">
                      <div className="user-info">
                        <span className="user-avatar">{user.emoji}</span>
                        <span className="user-name">{user.name}</span>
                      </div>
                      <span className="user-count">{userTasks} task</span>
                    </div>
                  );
                }).filter(Boolean)}
                {Object.values(trashStats.userDistribution).reduce((a, b) => a + b, 0) === 0 && (
                  <div className="no-data">
                    <span className="no-data-icon">📊</span>
                    <span className="no-data-text">Nessuna attività registrata</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminTrash;