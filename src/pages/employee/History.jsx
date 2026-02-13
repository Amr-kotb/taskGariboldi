import React, { useState, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import TaskCard from '../../components/task/TaskCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  TASK_STATUS, 
  TASK_PRIORITY,
  getStatusName, 
  getStatusColor,
  getPriorityName,
  getPriorityColor
} from '../../constants/statuses';

const EmployeeHistory = () => {
  const { user } = useAuth();
  const { tasks, loading, error, loadTasks } = useTasks();
  
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filters, setFilters] = useState({
    period: 'all', // 'all', 'week', 'month', 'year'
    priority: 'all',
    category: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('completedAt'); // 'completedAt', 'title', 'priority'

  // Carica i task al montaggio
  useEffect(() => {
    loadTasks();
  }, []);

  // Filtra i task completati
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setFilteredTasks([]);
      return;
    }

    // Filtra solo i task completati
    let result = tasks.filter(task => task.status === TASK_STATUS.COMPLETATO);

    // Applica filtro periodo
    if (filters.period !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.period) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      result = result.filter(task => {
        if (!task.completedAt) return false;
        const taskDate = new Date(task.completedAt);
        return taskDate >= cutoffDate;
      });
    }

    // Applica filtro priorità
    if (filters.priority !== 'all') {
      result = result.filter(task => task.priority === filters.priority);
    }

    // Applica ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Ordina i risultati
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { 'alta': 3, 'media': 2, 'bassa': 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'completedAt':
        default:
          const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
          const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
          return dateB - dateA; // Più recenti prima
      }
    });

    setFilteredTasks(result);
  }, [tasks, filters, searchQuery, sortBy]);

  // Statistiche della cronologia
  const getHistoryStats = () => {
    const completedTasks = tasks.filter(task => task.status === TASK_STATUS.COMPLETATO);
    
    if (completedTasks.length === 0) {
      return {
        total: 0,
        thisWeek: 0,
        thisMonth: 0,
        byPriority: { alta: 0, media: 0, bassa: 0 },
        averageCompletionTime: 0
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: completedTasks.length,
      thisWeek: completedTasks.filter(task => 
        task.completedAt && new Date(task.completedAt) >= weekAgo
      ).length,
      thisMonth: completedTasks.filter(task => 
        task.completedAt && new Date(task.completedAt) >= monthAgo
      ).length,
      byPriority: {
        alta: completedTasks.filter(task => task.priority === TASK_PRIORITY.ALTA).length,
        media: completedTasks.filter(task => task.priority === TASK_PRIORITY.MEDIA).length,
        bassa: completedTasks.filter(task => task.priority === TASK_PRIORITY.BASSA).length
      }
    };

    // Calcola tempo medio di completamento
    const totalCompletionTime = completedTasks.reduce((total, task) => {
      if (task.createdAt && task.completedAt) {
        const created = new Date(task.createdAt);
        const completed = new Date(task.completedAt);
        const days = (completed - created) / (1000 * 60 * 60 * 24);
        return total + days;
      }
      return total;
    }, 0);

    stats.averageCompletionTime = completedTasks.length > 0 
      ? Math.round(totalCompletionTime / completedTasks.length)
      : 0;

    return stats;
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // La ricerca è già gestita dall'useEffect
  };

  const handleExportHistory = () => {
    // Implementazione semplice di esportazione
    const historyData = filteredTasks.map(task => ({
      'Titolo': task.title,
      'Descrizione': task.description,
      'Priorità': getPriorityName(task.priority),
      'Categoria': task.category,
      'Data Creazione': task.createdAt ? new Date(task.createdAt).toLocaleDateString('it-IT') : '',
      'Data Completamento': task.completedAt ? new Date(task.completedAt).toLocaleDateString('it-IT') : '',
      'Tempo di Completamento (giorni)': task.createdAt && task.completedAt 
        ? Math.round((new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60 * 24))
        : ''
    }));

    const csvContent = [
      Object.keys(historyData[0] || {}).join(','),
      ...historyData.map(row => Object.values(row).map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storico_task_${user?.name || 'utente'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non specificata';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateCompletionDays = (task) => {
    if (!task.createdAt || !task.completedAt) return null;
    
    const created = new Date(task.createdAt);
    const completed = new Date(task.completedAt);
    const days = Math.round((completed - created) / (1000 * 60 * 60 * 24));
    
    return days;
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <LoadingSpinner size="lg" message="Caricamento storico..." />
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="alert alert-danger">
        <h4>Errore nel caricamento</h4>
        <p>{error}</p>
        <Button variant="primary" onClick={loadTasks}>
          Riprova
        </Button>
      </div>
    );
  }

  const stats = getHistoryStats();

  return (
    <div className="employee-history-container">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h2 mb-3">Storico Task Completati</h1>
        <p className="text-muted">
          Visualizza la cronologia di tutti i task che hai completato
        </p>
      </div>

      {/* Statistiche */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <Card className="h-100">
            <div className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                <i className="fas fa-check-circle text-success fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0">{stats.total}</h3>
                <p className="text-muted mb-0">Totali Completati</p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-md-3">
          <Card className="h-100">
            <div className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                <i className="fas fa-calendar-week text-primary fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0">{stats.thisWeek}</h3>
                <p className="text-muted mb-0">Questa Settimana</p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-md-3">
          <Card className="h-100">
            <div className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                <i className="fas fa-calendar-alt text-info fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0">{stats.thisMonth}</h3>
                <p className="text-muted mb-0">Questo Mese</p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-md-3">
          <Card className="h-100">
            <div className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                <i className="fas fa-clock text-warning fs-4"></i>
              </div>
              <div>
                <h3 className="mb-0">{stats.averageCompletionTime}</h3>
                <p className="text-muted mb-0">Giorni medi</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filtri e controlli */}
      <Card className="mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <form onSubmit={handleSearch} className="d-flex">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cerca nello storico..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" variant="primary">
                    <i className="fas fa-search"></i>
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="col-md-6">
              <div className="d-flex justify-content-end gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                >
                  <option value="all">Tutto lo storico</option>
                  <option value="week">Ultima settimana</option>
                  <option value="month">Ultimo mese</option>
                  <option value="year">Ultimo anno</option>
                </select>
                
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <option value="all">Tutte le priorità</option>
                  <option value="alta">Alta priorità</option>
                  <option value="media">Media priorità</option>
                  <option value="bassa">Bassa priorità</option>
                </select>
                
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="completedAt">Data completamento</option>
                  <option value="title">Titolo</option>
                  <option value="priority">Priorità</option>
                </select>
                
                <Button 
                  variant="outline-primary" 
                  onClick={handleExportHistory}
                  disabled={filteredTasks.length === 0}
                >
                  <i className="fas fa-download me-2"></i>
                  Esporta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Distribuzione priorità */}
      <div className="row mb-4">
        <div className="col-12">
          <Card>
            <div className="card-body">
              <h6 className="card-title mb-3">Distribuzione per Priorità</h6>
              <div className="d-flex align-items-center gap-4">
                {Object.entries(stats.byPriority).map(([priority, count]) => (
                  <div key={priority} className="text-center">
                    <div className="mb-2">
                      <Badge 
                        style={{ 
                          backgroundColor: getPriorityColor(priority),
                          fontSize: '1rem',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        {getPriorityName(priority)}
                      </Badge>
                    </div>
                    <div className="h4 mb-0">{count}</div>
                    <small className="text-muted">
                      {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Lista task completati */}
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 mb-0">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? ' completati' : ' completato'}
              {filters.period !== 'all' && ` (${filters.period})`}
            </h3>
            
            <div className="text-muted">
              {stats.total > 0 && (
                <small>
                  Tasso di completamento: {Math.round((stats.total / tasks.length) * 100)}%
                </small>
              )}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <Card className="text-center py-5">
              <i className="fas fa-history fa-3x text-muted mb-3"></i>
              <h4>Nessun task completato</h4>
              <p className="text-muted">
                {tasks.length === 0 
                  ? 'Non hai ancora task assegnati'
                  : 'Non hai ancora completato task con questi filtri'
                }
              </p>
              {searchQuery || filters.period !== 'all' || filters.priority !== 'all' ? (
                <Button 
                  variant="outline-primary" 
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ period: 'all', priority: 'all', category: 'all' });
                  }}
                >
                  Mostra tutti i task completati
                </Button>
              ) : (
                <Button variant="primary" onClick={() => window.location.href = '/employee/my-tasks'}>
                  Vai ai tuoi task
                </Button>
              )}
            </Card>
          ) : (
            <div className="row g-4">
              {filteredTasks.map(task => {
                const completionDays = calculateCompletionDays(task);
                
                return (
                  <div key={task.id} className="col-lg-6">
                    <Card className="h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="card-title mb-1">{task.title}</h5>
                            <Badge 
                              className="me-2"
                              style={{ backgroundColor: getPriorityColor(task.priority) }}
                            >
                              {getPriorityName(task.priority)}
                            </Badge>
                            <Badge variant="success">
                              <i className="fas fa-check me-1"></i>
                              Completato
                            </Badge>
                          </div>
                          {completionDays !== null && (
                            <Badge variant="info">
                              {completionDays} {completionDays === 1 ? 'giorno' : 'giorni'}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="card-text text-muted mb-4">
                          {task.description?.substring(0, 150)}
                          {task.description?.length > 150 ? '...' : ''}
                        </p>
                        
                        <div className="task-meta">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <small className="text-muted d-block">
                                <i className="far fa-calendar-plus me-1"></i>
                                Assegnato: {formatDate(task.createdAt)}
                              </small>
                              <small className="text-muted d-block">
                                <i className="far fa-calendar-check me-1"></i>
                                Completato: {formatDate(task.completedAt)}
                              </small>
                            </div>
                            
                            <div className="text-end">
                              {completionDays !== null && (
                                <div className="text-success">
                                  <small>
                                    <i className="fas fa-bolt me-1"></i>
                                    Completato in {completionDays} giorni
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-footer bg-transparent border-top-0">
                        <div className="d-flex justify-content-between">
                          <small className="text-muted">
                            ID: {task.id.substring(0, 8)}...
                          </small>
                          <Button 
                            size="sm" 
                            variant="outline-secondary"
                            onClick={() => {/* Azione per visualizzare dettagli */}}
                          >
                            <i className="fas fa-eye me-1"></i>
                            Dettagli
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline visiva (solo se ci sono task) */}
      {filteredTasks.length > 0 && (
        <div className="row mt-5">
          <div className="col-12">
            <Card>
              <div className="card-body">
                <h5 className="card-title mb-4">Timeline Completamenti</h5>
                <div className="timeline">
                  {filteredTasks.slice(0, 5).map((task, index) => {
                    const completionDate = task.completedAt ? new Date(task.completedAt) : null;
                    
                    return (
                      <div key={index} className="timeline-item d-flex">
                        <div className="timeline-marker">
                          <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                        </div>
                        <div className="timeline-content ms-3 flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-1">{task.title}</h6>
                            <small className="text-muted">
                              {completionDate?.toLocaleDateString('it-IT')}
                            </small>
                          </div>
                          <p className="text-muted mb-2">
                            {task.description?.substring(0, 80)}
                            {task.description?.length > 80 ? '...' : ''}
                          </p>
                          <div className="d-flex gap-2">
                            <Badge 
                              style={{ 
                                backgroundColor: getPriorityColor(task.priority),
                                fontSize: '0.75rem'
                              }}
                            >
                              {getPriorityName(task.priority)}
                            </Badge>
                            {calculateCompletionDays(task) !== null && (
                              <Badge variant="info" className="text-nowrap">
                                {calculateCompletionDays(task)} giorni
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeHistory;