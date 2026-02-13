// C:\Users\akotb\Desktop\backup taskG\src\pages\admin\Tasks.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { collection, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import "./Tasks.css";
import "./variables.css";
import { db } from '../../firebase/config';

const AdminTasks = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // State
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtri
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    department: ''
  });

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Carica tutte le task da Firestore
  const loadAllTasks = useCallback(async () => {
    setLoading(true);
    try {
      console.log("📋 Caricamento task da Firestore...");
      
      const tasksCollection = collection(db, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      
      const tasksList = [];
      tasksSnapshot.forEach((doc) => {
        const taskData = doc.data();
        tasksList.push({
          id: doc.id,
          ...taskData
        });
      });
      
      console.log(`✅ ${tasksList.length} task caricati`);
      setTasks(tasksList);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento task:', error);
      setError('Errore nel caricamento delle task. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica utenti da Firestore
  const loadUsers = useCallback(async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      const usersList = [];
      usersSnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
    }
  }, []);

  // Carica dati al mount
  useEffect(() => {
    loadAllTasks();
    loadUsers();
  }, [loadAllTasks, loadUsers]);

  // Applica filtri e ricerca
  const filteredTasks = tasks.filter(task => {
    // Filtri
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
    if (filters.department) {
      const assignedUser = users.find(u => u.id === task.assignedTo);
      if (!assignedUser || assignedUser.department !== filters.department) return false;
    }
    
    // Ricerca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        getUserName(task.assignedTo).toLowerCase().includes(searchLower) ||
        task.status.toLowerCase().includes(searchLower) ||
        task.priority.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // Gestione filtri
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  // Elimina task
  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il task "${taskTitle}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setSuccess('Task eliminato con successo');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Errore eliminazione task:', error);
      setError('Errore nell\'eliminazione del task');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Cambia stato task
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid
      });
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      setSuccess(`Stato aggiornato a: ${newStatus}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('❌ Errore aggiornamento stato:', error);
      setError('Errore nell\'aggiornamento dello stato');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Formatta data
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Nessuna scadenza';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data non valida';
    }
  }, []);

  // Formatta data e ora
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return 'N/D';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data non valida';
    }
  }, []);

  // Ottieni nome utente
  const getUserName = useCallback((userId) => {
    if (!userId) return 'Non assegnato';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Utente non trovato';
  }, [users]);

  // Ottieni dipartimento utente
  const getUserDepartment = useCallback((userId) => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    return user?.department || 'N/A';
  }, [users]);

  // Ottieni email utente
  const getUserEmail = useCallback((userId) => {
    if (!userId) return '';
    const user = users.find(u => u.id === userId);
    return user?.email || '';
  }, [users]);

  // Ottieni stati unici per filtri
  const uniqueStatuses = [...new Set(tasks.map(task => task.status).filter(Boolean))];
  const uniquePriorities = [...new Set(tasks.map(task => task.priority).filter(Boolean))];
  const uniqueDepartments = [...new Set(users.map(user => user.department).filter(Boolean))];

  // Calcola statistiche
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completato').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in corso').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'alta').length;
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completato') return false;
    const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  // Reset filtri
  const resetFilters = () => {
    setFilters({ status: '', priority: '', assignedTo: '', department: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Navigazione pagine
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-content">
          <div className="admin-loading-spinner"></div>
          <p className="admin-loading-text">Caricamento task...</p>
          <p className="admin-loading-subtext">Sto recuperando i dati dal server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tasks">
      {/* Header */}
      <div className="admin-tasks-header">
        <div className="admin-tasks-header-content">
          <div className="admin-tasks-title-section">
            <h1 className="admin-tasks-title">📋 Gestione Task</h1>
            <p className="admin-tasks-subtitle">
              Visualizza e gestisci tutte le task dei dipendenti
              <span className="admin-tasks-count">
                {filteredTasks.length} task trovati
              </span>
            </p>
          </div>
          
          <div className="admin-tasks-actions">
            <button
              onClick={() => loadAllTasks()}
              className="admin-btn-secondary"
            >
              <span className="admin-btn-icon">🔄</span>
              Aggiorna
            </button>
            
            <Link
              to="/admin/assign-task"
              className="admin-btn-primary"
            >
              <span className="admin-btn-icon">+</span>
              Assegna Nuova Task
            </Link>
            
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="admin-btn-back"
            >
              <span className="admin-btn-icon">←</span>
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Messaggi */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <span className="admin-alert-icon">⚠️</span>
          <span className="admin-alert-message">{error}</span>
          <button onClick={() => setError('')} className="admin-alert-close">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <span className="admin-alert-icon">✅</span>
          <span className="admin-alert-message">{success}</span>
          <button onClick={() => setSuccess('')} className="admin-alert-close">
            ×
          </button>
        </div>
      )}

      <div className="admin-tasks-main">
        {/* Barra di ricerca */}
        <div className="admin-search-bar">
          <div className="admin-search-input-wrapper">
            <span className="admin-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cerca per titolo, descrizione, assegnatario..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="admin-search-clear"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={resetFilters}
            className="admin-btn-reset"
          >
            <span className="admin-btn-icon">🗑️</span>
            Reset Filtri
          </button>
        </div>

        {/* Statistiche */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-label">Task Totali</div>
            <div className="admin-stat-value admin-stat-total">{totalTasks}</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-label">Completati</div>
            <div className="admin-stat-value admin-stat-completed">{completedTasks}</div>
            <div className="admin-stat-percentage">
              {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%'}
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-label">In Corso</div>
            <div className="admin-stat-value admin-stat-inprogress">{inProgressTasks}</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-label">Priorità Alta</div>
            <div className="admin-stat-value admin-stat-highpriority">{highPriorityTasks}</div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-label">In Ritardo</div>
            <div className="admin-stat-value admin-stat-overdue">{overdueTasks}</div>
          </div>
        </div>

        {/* Filtri */}
        <div className="admin-filters-card">
          <h3 className="admin-filters-title">🔍 Filtra Task</h3>
          
          <div className="admin-filters-grid">
            {/* Filtro Stato */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Stato</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="admin-filter-select"
              >
                <option value="">Tutti gli stati</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Priorità */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Priorità</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="admin-filter-select"
              >
                <option value="">Tutte le priorità</option>
                {uniquePriorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Assegnato a */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Assegnato a</label>
              <select
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                className="admin-filter-select"
              >
                <option value="">Tutti i dipendenti</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.department || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Dipartimento */}
            <div className="admin-filter-group">
              <label className="admin-filter-label">Dipartimento</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="admin-filter-select"
              >
                <option value="">Tutti i dipartimenti</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabella Task */}
        <div className="admin-tasks-table-container">
          {filteredTasks.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">📭</div>
              <p className="admin-empty-title">Nessuna task trovata</p>
              <p className="admin-empty-message">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Prova a cambiare i filtri di ricerca' 
                  : 'Assegna una nuova task per iniziare'}
              </p>
              <Link
                to="/admin/assign-task"
                className="admin-btn-primary"
              >
                + Crea la prima task
              </Link>
            </div>
          ) : (
            <>
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th className="admin-table-th">Task</th>
                      <th className="admin-table-th">Assegnato a</th>
                      <th className="admin-table-th">Stato</th>
                      <th className="admin-table-th">Priorità</th>
                      <th className="admin-table-th">Scadenza</th>
                      <th className="admin-table-th">Progresso</th>
                      <th className="admin-table-th">Allegati</th> {/* ✅ NUOVA COLONNA */}
                      <th className="admin-table-th">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {currentTasks.map((task) => {
                      const isOverdue = task.dueDate && 
                        (task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)) < new Date() && 
                        task.status !== 'completato';
                      
                      return (
                        <tr key={task.id} className="admin-table-row">
                          {/* Task Info */}
                          <td className="admin-table-cell admin-task-info">
                            <div className="admin-task-indicator-container">
                              <div className={`admin-task-indicator ${
                                task.status === 'completato' ? 'admin-task-indicator-completed' :
                                task.status === 'in corso' ? 'admin-task-indicator-inprogress' :
                                'admin-task-indicator-assigned'
                              }`}></div>
                              <div className="admin-task-details">
                                <div className="admin-task-title">{task.title}</div>
                                <div className="admin-task-description">
                                  {task.description || 'Nessuna descrizione'}
                                </div>
                                <div className="admin-task-meta">
                                  <span className="admin-task-created">
                                    Creato: {formatDateTime(task.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Assegnato a */}
                          <td className="admin-table-cell">
                            <div className="admin-assignee-info">
                              <div className="admin-assignee-avatar">
                                {getUserName(task.assignedTo)?.charAt(0) || '?'}
                              </div>
                              <div className="admin-assignee-details">
                                <div className="admin-assignee-name">
                                  {getUserName(task.assignedTo)}
                                </div>
                                <div className="admin-assignee-department">
                                  {getUserDepartment(task.assignedTo)}
                                </div>
                                <div className="admin-assignee-email">
                                  {getUserEmail(task.assignedTo)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Stato */}
                          <td className="admin-table-cell">
                            <select
                              value={task.status || 'assegnato'}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className={`admin-status-select admin-status-${task.status?.replace(/\s+/g, '-') || 'assegnato'}`}
                            >
                              <option value="assegnato">Assegnato</option>
                              <option value="in corso">In corso</option>
                              <option value="in pausa">In pausa</option>
                              <option value="completato">Completato</option>
                            </select>
                          </td>

                          {/* Priorità */}
                          <td className="admin-table-cell">
                            <span className={`admin-priority-badge admin-priority-${task.priority || 'media'}`}>
                              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Media'}
                            </span>
                          </td>

                          {/* Scadenza */}
                          <td className="admin-table-cell">
                            <div className={`admin-due-date ${isOverdue ? 'admin-due-overdue' : ''}`}>
                              <div className="admin-due-label">{formatDate(task.dueDate)}</div>
                              {isOverdue && (
                                <div className="admin-overdue-badge">⚠️ In ritardo</div>
                              )}
                            </div>
                          </td>

                          {/* Progresso */}
                          <td className="admin-table-cell">
                            <div className="admin-progress-container">
                              <div className="admin-progress-bar">
                                <div 
                                  className={`admin-progress-fill ${
                                    task.status === 'completato' ? 'admin-progress-completed' :
                                    task.status === 'in corso' ? 'admin-progress-inprogress' :
                                    'admin-progress-assigned'
                                  }`}
                                  style={{ 
                                    width: task.status === 'completato' ? '100%' : 
                                           task.status === 'in corso' ? '50%' : '25%' 
                                  }}
                                ></div>
                              </div>
                              <div className="admin-progress-text">
                                {task.status === 'completato' ? '100%' :
                                 task.status === 'in corso' ? '50%' : '25%'}
                              </div>
                            </div>
                          </td>

                          {/* ✅ ALLEGATI - NUOVA CELLA */}
                          <td className="admin-table-cell">
                            <div className="admin-attachments-cell">
                              {task.attachments && task.attachments.length > 0 ? (
                                <div className="admin-attachments-badge">
                                  <span className="admin-attachments-icon">📎</span>
                                  <span className="admin-attachments-count">{task.attachments.length}</span>
                                  {task.hasDriveAttachments && (
                                    <span className="admin-attachments-drive" title="Contiene file da Google Drive">☁️</span>
                                  )}
                                  <button
                                    onClick={() => navigate(`/admin/task-details/${task.id}`)}
                                    className="admin-attachments-view-btn"
                                    title="Visualizza allegati"
                                  >
                                    👁️
                                  </button>
                                </div>
                              ) : (
                                <span className="admin-no-attachments">—</span>
                              )}
                            </div>
                          </td>

                          {/* Azioni */}
                          <td className="admin-table-cell">
                            <div className="admin-action-buttons">
                              <button
                                onClick={() => navigate(`/admin/edit-task/${task.id}`)}
                                className="admin-action-btn admin-action-edit"
                                title="Modifica task"
                              >
                                <span className="admin-action-icon">✏️</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteTask(task.id, task.title)}
                                className="admin-action-btn admin-action-delete"
                                title="Elimina task"
                              >
                                <span className="admin-action-icon">🗑️</span>
                              </button>
                              
                              <button
                                onClick={() => navigate(`/admin/task-details/${task.id}`)}
                                className="admin-action-btn admin-action-view"
                                title="Dettagli task"
                              >
                                <span className="admin-action-icon">👁️</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="admin-pagination">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="admin-pagination-btn admin-pagination-prev"
                  >
                    ← Precedente
                  </button>
                  
                  <div className="admin-pagination-info">
                    Pagina <span className="admin-pagination-current">{currentPage}</span> di {totalPages}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="admin-pagination-btn admin-pagination-next"
                  >
                    Successiva →
                  </button>
                  
                  <div className="admin-pagination-stats">
                    Mostrando {indexOfFirstTask + 1}-{Math.min(indexOfLastTask, filteredTasks.length)} di {filteredTasks.length} task
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="admin-footer-info">
          <p className="admin-footer-text">
            Sistema di gestione task • Versione 2.0 • 
            Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
          </p>
          <div className="admin-footer-legend">
            <div className="admin-legend-item">
              <div className="admin-legend-color admin-legend-completed"></div>
              <span>Completato</span>
            </div>
            <div className="admin-legend-item">
              <div className="admin-legend-color admin-legend-inprogress"></div>
              <span>In corso</span>
            </div>
            <div className="admin-legend-item">
              <div className="admin-legend-color admin-legend-assigned"></div>
              <span>Assegnato</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTasks;