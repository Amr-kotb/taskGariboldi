import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate per la navigazione
import { useAuth } from '../../hooks/useAuth';
import { 
  getAllActivities, 
  getActivitiesStats, 
  exportActivitiesToCSV,
  createSampleActivities 
} from '../../services/api/firestore/history';
import { 
  FiActivity, 
  FiCalendar, 
  FiUser, 
  FiSearch, 
  FiDownload, 
  FiFilter,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiEdit,
  FiPlusCircle,
  FiMessageSquare,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiEye,
  FiX,
  FiTrendingUp,
  FiDatabase,
  FiCode,
  FiLayers,
  FiBarChart,
  FiHome // Icona per la dashboard
} from 'react-icons/fi';
import { 
  HiOutlineCalendarDays, 
  HiOutlineUserGroup, 
  HiOutlineChartBar,
  HiOutlineExclamationCircle
} from 'react-icons/hi2';
import { 
  MdOutlineTask, 
  MdOutlineSettings, 
  MdOutlineNotifications,
  MdOutlineHistory
} from 'react-icons/md';

import './admin-history.css';

const AdminHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook per la navigazione
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  
  const [filters, setFilters] = useState({
    userId: 'all',
    project: 'all',
    complexity: 'all',
    status: 'all',
    search: '',
    dateRange: 'month',
    sortBy: 'date_desc'
  });
  
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  
  const [viewMode, setViewMode] = useState('timeline');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [projects, setProjects] = useState(['Sistema Gestione Task', 'Ottimizzazione Infrastruttura', 'Marketing 2024']);

  // Carica dati iniziali
  useEffect(() => {
    loadHistoryData();
  }, []);

  // Filtra attività quando cambiano filtri
  useEffect(() => {
    filterActivities();
  }, [activities, filters, customDateRange]);

  // Funzione per tornare alla dashboard
  const handleGoToDashboard = () => {
    navigate('/dashboard'); // Modifica questo percorso se la tua dashboard ha un percorso diverso
  };

  // Funzione per tornare alla home
  const handleGoToHome = () => {
    navigate('/'); // Home page principale
  };

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara filtri per Firestore
      const firestoreFilters = {};
      
      if (filters.userId !== 'all') {
        firestoreFilters.userId = filters.userId;
      }
      
      if (filters.project !== 'all') {
        firestoreFilters.project = filters.project;
      }
      
      if (filters.complexity !== 'all') {
        firestoreFilters.complexity = filters.complexity;
      }
      
      if (filters.status !== 'all') {
        firestoreFilters.status = filters.status;
      }
      
      // Gestisci date range
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          firestoreFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          firestoreFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          firestoreFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          firestoreFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            firestoreFilters.startDate = customDateRange.start;
            firestoreFilters.endDate = customDateRange.end;
          }
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
          firestoreFilters.startDate = startDate.toISOString().split('T')[0];
      }
      
      // Recupera attività da Firestore
      const activitiesResult = await getAllActivities(firestoreFilters);
      
      if (!activitiesResult.success) {
        throw new Error(activitiesResult.userMessage || 'Errore nel caricamento delle attività');
      }
      
      const loadedActivities = activitiesResult.data || [];
      setActivities(loadedActivities);
      setFilteredActivities(loadedActivities);
      
      // Recupera statistiche
      const statsResult = await getActivitiesStats(firestoreFilters);
      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        // Calcola statistiche locali
        calculateLocalStats(loadedActivities);
      }
      
      // Estrai utenti unici dalle attività
      const uniqueUsers = [];
      loadedActivities.forEach(act => {
        if (act.userId && !uniqueUsers.some(u => u.id === act.userId)) {
          uniqueUsers.push({
            id: act.userId,
            name: act.userName || 'Utente Sconosciuto',
            email: act.userEmail || '',
            role: act.userRole || 'dipendente',
            avatarColor: getAvatarColor(act.userId)
          });
        }
      });
      
      // Aggiungi l'admin corrente se non presente
      if (user && !uniqueUsers.some(u => u.email === user.email)) {
        uniqueUsers.push({
          id: 'admin',
          name: user.name || 'Admin System',
          email: user.email || 'admin@gariboldi.com',
          role: 'admin',
          avatarColor: getAvatarColor('admin')
        });
      }
      
      // Se non ci sono utenti, usa quelli mock
      if (uniqueUsers.length === 0) {
        uniqueUsers.push(
          { id: '1', name: 'Leonardo Rossi', email: 'leo@gariboldi.com', role: 'dipendente', avatarColor: '#3b82f6' },
          { id: '2', name: 'Andrea Bianchi', email: 'andrea@gariboldi.com', role: 'dipendente', avatarColor: '#10b981' },
          { id: '3', name: 'Domenico Verdi', email: 'domenico@gariboldi.com', role: 'dipendente', avatarColor: '#8b5cf6' },
          { id: '4', name: 'Stefano Neri', email: 'stefano@gariboldi.com', role: 'dipendente', avatarColor: '#f59e0b' },
          { id: '5', name: user?.name || 'Admin System', email: user?.email || 'admin@gariboldi.com', role: 'admin', avatarColor: getAvatarColor('admin') }
        );
      }
      
      setUsers(uniqueUsers);
      
      // Estrai progetti unici
      const uniqueProjects = [...new Set(loadedActivities.map(act => act.project).filter(Boolean))];
      if (uniqueProjects.length > 0) {
        setProjects(uniqueProjects);
      }
      
      console.log(`✅ Dati caricati: ${loadedActivities.length} attività, ${uniqueUsers.length} utenti`);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error loading history data:', error);
      setError(error.message || 'Errore nel caricamento dello storico');
      setLoading(false);
    }
  };

  const calculateLocalStats = (activitiesList) => {
    const statsData = {
      totalTasks: activitiesList.length,
      totalHours: activitiesList.reduce((sum, act) => sum + (act.hoursSpent || 0), 0),
      avgQualityScore: activitiesList.length > 0 
        ? Math.round(activitiesList.reduce((sum, act) => sum + (act.qualityScore || 0), 0) / activitiesList.length)
        : 0,
      byComplexity: {
        bassa: activitiesList.filter(a => a.complexity === 'bassa').length,
        media: activitiesList.filter(a => a.complexity === 'media').length,
        alta: activitiesList.filter(a => a.complexity === 'alta').length,
        molto_alta: activitiesList.filter(a => a.complexity === 'molto_alta').length
      },
      byProject: {},
      byUser: {}
    };
    
    // Calcola per progetto
    activitiesList.forEach(act => {
      if (act.project) {
        statsData.byProject[act.project] = (statsData.byProject[act.project] || 0) + 1;
      }
    });
    
    // Calcola per utente
    activitiesList.forEach(act => {
      if (act.userId) {
        if (!statsData.byUser[act.userId]) {
          statsData.byUser[act.userId] = {
            name: act.userName || 'Sconosciuto',
            tasks: 0,
            hours: 0,
            totalScore: 0
          };
        }
        
        statsData.byUser[act.userId].tasks++;
        statsData.byUser[act.userId].hours += act.hoursSpent || 0;
        statsData.byUser[act.userId].totalScore += act.qualityScore || 0;
      }
    });
    
    // Calcola media per utente
    Object.keys(statsData.byUser).forEach(userId => {
      const userStats = statsData.byUser[userId];
      userStats.avgScore = userStats.tasks > 0 
        ? Math.round(userStats.totalScore / userStats.tasks)
        : 0;
    });
    
    setStats(statsData);
  };

  const filterActivities = () => {
    let result = [...activities];

    // Filtro per utente
    if (filters.userId !== 'all') {
      result = result.filter(act => act.userId === filters.userId);
    }

    // Filtro per progetto
    if (filters.project !== 'all') {
      result = result.filter(act => act.project === filters.project);
    }

    // Filtro per complessità
    if (filters.complexity !== 'all') {
      result = result.filter(act => act.complexity === filters.complexity);
    }

    // Filtro per status
    if (filters.status !== 'all') {
      result = result.filter(act => act.status === filters.status);
    }

    // Filtro per periodo
    const now = new Date();
    let startDate = new Date();
    
    switch (filters.dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          endDate.setHours(23, 59, 59, 999);
          result = result.filter(act => {
            const activityDate = act.timestamp ? new Date(act.timestamp) : null;
            return activityDate && activityDate >= startDate && activityDate <= endDate;
          });
        }
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    if (filters.dateRange !== 'custom') {
      result = result.filter(act => {
        const activityDate = act.timestamp ? new Date(act.timestamp) : null;
        return activityDate && activityDate >= startDate;
      });
    }

    // Filtro per ricerca
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter(act =>
        (act.description?.toLowerCase().includes(query)) ||
        (act.userName?.toLowerCase().includes(query)) ||
        (act.taskTitle?.toLowerCase().includes(query)) ||
        (act.project?.toLowerCase().includes(query))
      );
    }

    // Ordina risultati
    switch (filters.sortBy) {
      case 'date_desc':
        result.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'date_asc':
        result.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'hours_desc':
        result.sort((a, b) => (b.hoursSpent || 0) - (a.hoursSpent || 0));
        break;
      case 'hours_asc':
        result.sort((a, b) => (a.hoursSpent || 0) - (b.hoursSpent || 0));
        break;
      case 'score_desc':
        result.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        break;
      default:
        result.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return dateB - dateA;
        });
    }
    
    setFilteredActivities(result);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleCustomDateChange = (type, value) => {
    setCustomDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleExportData = async (format) => {
    if (format !== 'csv') return;
    
    setExporting(true);
    try {
      // Prepara filtri per esportazione
      const exportFilters = {};
      
      if (filters.userId !== 'all') {
        exportFilters.userId = filters.userId;
      }
      
      if (filters.project !== 'all') {
        exportFilters.project = filters.project;
      }
      
      if (filters.complexity !== 'all') {
        exportFilters.complexity = filters.complexity;
      }
      
      if (filters.status !== 'all') {
        exportFilters.status = filters.status;
      }
      
      // Gestisci date range
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          exportFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          exportFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          exportFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          exportFilters.startDate = startDate.toISOString().split('T')[0];
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            exportFilters.startDate = customDateRange.start;
            exportFilters.endDate = customDateRange.end;
          }
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
          exportFilters.startDate = startDate.toISOString().split('T')[0];
      }
      
      // Usa il servizio di esportazione Firestore
      const result = await exportActivitiesToCSV(exportFilters);
      
      if (!result.success) {
        throw new Error(result.userMessage || 'Errore durante l\'esportazione');
      }
      
      // Crea e scarica il file
      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `storico_tasks_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log(`✅ Esportati ${result.count} record in CSV`);
      
    } catch (error) {
      console.error('❌ Errore esportazione:', error);
      alert(`Errore durante l\'esportazione: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleInitializeSample = async () => {
    if (!window.confirm('Vuoi inizializzare lo storico con dati di esempio?\nVerranno create 10 attività di esempio.')) {
      return;
    }
    
    setInitializing(true);
    try {
      const result = await createSampleActivities(10);
      
      if (result.success) {
        alert('✅ Dati di esempio inizializzati con successo!');
        loadHistoryData(); // Ricarica i dati
      } else {
        throw new Error(result.userMessage || 'Errore durante l\'inizializzazione');
      }
      
    } catch (error) {
      console.error('❌ Errore inizializzazione:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const getAvatarColor = (userId) => {
    const colors = [
      '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
      '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'
    ];
    
    if (!userId) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getActionIcon = (type) => {
    const icons = {
      'task_completed': <FiCheckCircle />,
      'task_created': <FiPlusCircle />,
      'task_assigned': <FiUser />,
      'task_updated': <FiEdit />,
      'task_deleted': <FiTrash2 />,
      'comment_added': <FiMessageSquare />,
      'user_action': <FiUsers />,
      'system_event': <FiActivity />
    };
    
    return icons[type] || <FiActivity />;
  };

  const getActionColor = (type) => {
    const colors = {
      'task_completed': '#10b981',
      'task_created': '#3b82f6',
      'task_assigned': '#8b5cf6',
      'task_updated': '#f59e0b',
      'task_deleted': '#ef4444',
      'comment_added': '#06b6d4',
      'user_action': '#ec4899',
      'system_event': '#9ca3af'
    };
    
    return colors[type] || '#9ca3af';
  };

  const getActionLabel = (type) => {
    const labels = {
      'task_completed': 'Task Completato',
      'task_created': 'Task Creato',
      'task_assigned': 'Task Assegnato',
      'task_updated': 'Task Aggiornato',
      'task_deleted': 'Task Eliminato',
      'comment_added': 'Commento Aggiunto',
      'user_action': 'Azione Utente',
      'system_event': 'Evento Sistema'
    };
    
    return labels[type] || type;
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/D';
    const d = new Date(date);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} sett fa`;
    return formatDateTime(date);
  };

  const getComplexityBadge = (complexity) => {
    const complexityColors = {
      'bassa': { bg: '#10b981', text: 'Bassa' },
      'media': { bg: '#3b82f6', text: 'Media' },
      'alta': { bg: '#f59e0b', text: 'Alta' },
      'molto_alta': { bg: '#ef4444', text: 'Molto Alta' }
    };
    
    const config = complexityColors[complexity] || complexityColors['media'];
    
    return (
      <span 
        className="complexity-badge"
        style={{ 
          backgroundColor: config.bg,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}
      >
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'completed': { bg: '#10b981', text: 'Completato' },
      'approved': { bg: '#059669', text: 'Approvato' },
      'rejected': { bg: '#dc2626', text: 'Rifiutato' },
      'in_review': { bg: '#f59e0b', text: 'In Revisione' }
    };
    
    const config = statusColors[status] || statusColors['completed'];
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: config.bg,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}
      >
        {config.text}
      </span>
    );
  };

  const resetFilters = () => {
    setFilters({
      userId: 'all',
      project: 'all',
      complexity: 'all',
      status: 'all',
      search: '',
      dateRange: 'month',
      sortBy: 'date_desc'
    });
    setCustomDateRange({
      start: '',
      end: ''
    });
  };

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
  };

  const handleCloseDetails = () => {
    setSelectedActivity(null);
  };

  if (loading && activities.length === 0) {
    return (
      <div className="admin-history">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <h3>Caricamento Storico da Firebase</h3>
            <p>Sto recuperando le attività dal database...</p>
            <button 
              onClick={handleGoToDashboard} 
              className="btn-primary"
              style={{ marginTop: '20px' }}
            >
              <FiHome />
              <span>Torna alla Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="admin-history">
        <div className="error-container">
          <HiOutlineExclamationCircle className="error-icon" />
          <div className="error-content">
            <h3>Errore nel caricamento dello storico</h3>
            <p>{error}</p>
            <button onClick={loadHistoryData} className="btn-primary">
              <FiRefreshCw />
              <span>Riprova</span>
            </button>
            <button 
              onClick={handleInitializeSample} 
              className="btn-secondary"
              disabled={initializing}
              style={{ marginLeft: '10px' }}
            >
              {initializing ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Inizializzazione...</span>
                </>
              ) : (
                <>
                  <FiDatabase />
                  <span>Inizializza con dati esempio</span>
                </>
              )}
            </button>
            <button 
              onClick={handleGoToDashboard} 
              className="btn-primary"
              style={{ marginTop: '10px', width: '100%' }}
            >
              <FiHome />
              <span>Torna alla Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-history">
      {/* Header con pulsante Dashboard */}
      <div className="page-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={handleGoToDashboard} 
              className="btn-icon"
              title="Torna alla Dashboard"
              style={{ 
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <FiHome />
              <span>Dashboard</span>
            </button>
            <div>
              <h1 className="page-title">
                <MdOutlineHistory />
                <span>Storico Task Completati</span>
              </h1>
              <p className="page-subtitle">
                Monitora tutti i task completati dal tuo team. {activities.length} attività sincronizzate con Firebase.
              </p>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className={`btn-icon ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filtri"
          >
            <FiFilter />
          </button>
          
          <div className="dropdown">
            <button className="btn-icon" title="Esporta dati">
              <FiDownload />
            </button>
            <div className="dropdown-menu">
              <button 
                onClick={() => handleExportData('csv')} 
                className="dropdown-item"
                disabled={exporting || filteredActivities.length === 0}
              >
                {exporting ? (
                  <>
                    <div className="spinner-small"></div>
                    <span>Esportazione...</span>
                  </>
                ) : (
                  <>
                    <FiFileText />
                    <span>Esporta CSV ({filteredActivities.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <button onClick={loadHistoryData} className="btn-icon" title="Aggiorna">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Pulsante rapido per la Home */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>

          <button 
            onClick={handleGoToDashboard} 
            className="btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px'
            }}
          >
            <FiHome />
            <span>Dashboard</span>
          </button>
        </div>
        
        <div className="results-info">
          <span className="results-count">{filteredActivities.length} attività trovate</span>
        </div>
      </div>

      {/* Statistiche */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.totalTasks || 0}</h3>
              <p className="stat-label">Task Completati</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon today">
              <FiClock />
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.totalHours || 0}h</h3>
              <p className="stat-label">Ore Totali</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon week">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.avgQualityScore || 0}%</h3>
              <p className="stat-label">Qualità Media</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon users">
              <HiOutlineUserGroup />
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{Object.keys(stats.byUser || {}).length}</h3>
              <p className="stat-label">Utenti Attivi</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtri */}
      {showFilters && (
        <div className="filters-card">
          <div className="filters-header">
            <h3>
              <FiFilter />
              <span>Filtri Avanzati</span>
            </h3>
            <button onClick={resetFilters} className="btn-text">
              <FiX />
              <span>Reset Filtri</span>
            </button>
          </div>
          
          <div className="filters-content">
            <div className="filter-row">
              <div className="filter-group">
                <label>Periodo</label>
                <div className="period-buttons">
                  {['today', 'week', 'month', 'year', 'custom'].map(period => (
                    <button
                      key={period}
                      className={`period-btn ${filters.dateRange === period ? 'active' : ''}`}
                      onClick={() => handleFilterChange('dateRange', period)}
                    >
                      {period === 'today' && 'Oggi'}
                      {period === 'week' && 'Settimana'}
                      {period === 'month' && 'Mese'}
                      {period === 'year' && 'Anno'}
                      {period === 'custom' && 'Personalizzato'}
                    </button>
                  ))}
                </div>
              </div>
              
              {filters.dateRange === 'custom' && (
                <div className="filter-group">
                  <label>Range Date Personalizzato</label>
                  <div className="date-range-inputs">
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="date-input"
                    />
                    <span className="date-separator">a</span>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className="date-input"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>Utente</label>
                <select
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tutti gli utenti</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Progetto</label>
                <select
                  value={filters.project}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tutti i progetti</option>
                  {projects.map(project => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Complessità</label>
                <select
                  value={filters.complexity}
                  onChange={(e) => handleFilterChange('complexity', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tutte</option>
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="molto_alta">Molto Alta</option>
                </select>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>Stato</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="completed">Completato</option>
                  <option value="approved">Approvato</option>
                  <option value="rejected">Rifiutato</option>
                  <option value="in_review">In Revisione</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Ordina per</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="filter-select"
                >
                  <option value="date_desc">Data (recenti prima)</option>
                  <option value="date_asc">Data (vecchi prima)</option>
                  <option value="hours_desc">Ore (maggiori prima)</option>
                  <option value="hours_asc">Ore (minori prima)</option>
                  <option value="score_desc">Punteggio (alto prima)</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Cerca</label>
                <div className="search-container">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Cerca per titolo, descrizione, utente..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="search-input"
                  />
                  {filters.search && (
                    <button 
                      onClick={() => handleFilterChange('search', '')}
                      className="search-clear"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Switch View Mode */}
      <div className="view-switch">
        <div className="view-buttons">
          <button
            className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <FiClock />
            <span>Timeline</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <FiLayers />
            <span>Lista</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
            onClick={() => setViewMode('stats')}
          >
            <FiBarChart />
            <span>Statistiche</span>
          </button>
        </div>
        
        <div className="results-info">
          <span className="results-count">{filteredActivities.length} attività trovate</span>
          {filters.userId !== 'all' && (
            <span className="filter-info">
              • Filtro utente: {users.find(u => u.id === filters.userId)?.name}
            </span>
          )}
          {filters.project !== 'all' && (
            <span className="filter-info">
              • Progetto: {filters.project}
            </span>
          )}
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="history-content">
        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <MdOutlineHistory className="empty-icon" />
            <h3>Nessuna attività trovata</h3>
            <p>
              {filters.userId !== 'all' || filters.project !== 'all' || filters.search
                ? 'Nessuna attività corrisponde ai filtri selezionati'
                : 'Non ci sono attività completate nel periodo selezionato'
              }
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {(filters.userId !== 'all' || filters.project !== 'all' || filters.search) && (
                <button onClick={resetFilters} className="btn-primary">
                  Mostra tutte le attività
                </button>
              )}
              <button 
                onClick={handleInitializeSample} 
                className="btn-secondary"
                disabled={initializing}
              >
                {initializing ? (
                  <>
                    <div className="spinner-small"></div>
                    <span>Generazione dati esempio...</span>
                  </>
                ) : (
                  <>
                    <FiDatabase />
                    <span>Genera dati di esempio</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleGoToDashboard} 
                className="btn-primary"
                style={{ backgroundColor: '#10b981' }}
              >
                <FiHome />
                <span>Torna alla Dashboard</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="timeline-view">
            {filteredActivities.map((activity, index) => (
              <div key={activity.id} className="timeline-item">
                <div className="timeline-marker">
                  <div 
                    className="marker-icon"
                    style={{ backgroundColor: getActionColor(activity.type) }}
                  >
                    {getActionIcon(activity.type)}
                  </div>
                  {index < filteredActivities.length - 1 && (
                    <div className="timeline-connector"></div>
                  )}
                </div>
                
                <div className="timeline-content">
                  <div className="activity-card">
                    <div className="activity-header">
                      <div className="activity-info">
                        <h4 className="activity-title">{activity.taskTitle || activity.title}</h4>
                        <p className="activity-description">{activity.description}</p>
                        
                        <div className="activity-meta">
                          <div className="user-info">
                            <div 
                              className="user-avatar"
                              style={{ backgroundColor: getAvatarColor(activity.userId) }}
                            >
                              {activity.userName?.charAt(0) || 'U'}
                            </div>
                            <div className="user-details">
                              <span className="user-name">{activity.userName || 'Utente Sconosciuto'}</span>
                              <span className="user-role">{activity.userRole || 'dipendente'}</span>
                            </div>
                          </div>
                          
                          <div className="activity-time">
                            <FiClock />
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            <span className="full-time">• {formatDateTime(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="activity-actions">
                        <button
                          onClick={() => handleViewDetails(activity)}
                          className="btn-icon"
                          title="Visualizza dettagli"
                        >
                          <FiEye />
                        </button>
                      </div>
                    </div>
                    
                    <div className="activity-details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Progetto:</span>
                        <span className="detail-value">{activity.project || 'N/D'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ore:</span>
                        <span className="detail-value">{activity.hoursSpent || 0}h</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Qualità:</span>
                        <span className="detail-value">{activity.qualityScore || 0}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Complessità:</span>
                        {getComplexityBadge(activity.complexity)}
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Stato:</span>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                    
                    {activity.technologies && activity.technologies.length > 0 && (
                      <div className="tech-tags">
                        {activity.technologies.map(tech => (
                          <span key={tech} className="tech-tag">
                            <FiCode /> {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="list-view">
            <div className="activities-table">
              <div className="table-header">
                <div className="table-cell">Data</div>
                <div className="table-cell">Utente</div>
                <div className="table-cell">Task</div>
                <div className="table-cell">Progetto</div>
                <div className="table-cell">Ore</div>
                <div className="table-cell">Qualità</div>
                <div className="table-cell">Complessità</div>
                <div className="table-cell">Azioni</div>
              </div>
              
              {filteredActivities.map(activity => (
                <div key={activity.id} className="table-row">
                  <div className="table-cell">
                    <div className="cell-content">
                      <FiClock className="cell-icon" />
                      <span className="time-ago">{formatTimeAgo(activity.timestamp)}</span>
                      <span className="full-time">{formatDateTime(activity.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <div className="user-cell">
                      <div 
                        className="user-avatar-small"
                        style={{ backgroundColor: getAvatarColor(activity.userId) }}
                      >
                        {activity.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="user-name">{activity.userName || 'Utente Sconosciuto'}</div>
                        <div className="user-email">{activity.userEmail || ''}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <div className="task-cell">
                      <div className="task-title">{activity.taskTitle || activity.title}</div>
                      <div className="task-description">{activity.description}</div>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <span className="project-badge">{activity.project || 'N/D'}</span>
                  </div>
                  
                  <div className="table-cell">
                    <div className="hours-cell">
                      <FiClock className="hours-icon" />
                      <span className="hours-value">{activity.hoursSpent || 0}h</span>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <div className="score-badge" style={{ 
                      backgroundColor: (activity.qualityScore || 0) >= 80 ? '#10b981' : 
                                     (activity.qualityScore || 0) >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {activity.qualityScore || 0}%
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    {getComplexityBadge(activity.complexity)}
                  </div>
                  
                  <div className="table-cell">
                    <button
                      onClick={() => handleViewDetails(activity)}
                      className="btn-icon-small"
                      title="Visualizza dettagli"
                    >
                      <FiEye />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="stats-view">
            {stats ? (
              <div className="stats-grid-detailed">
                <div className="stats-card">
                  <h3>Distribuzione per Complessità</h3>
                  <div className="action-distribution">
                    {Object.entries(stats.byComplexity || {}).map(([complexity, count]) => (
                      <div key={complexity} className="action-item">
                        <div className="action-header">
                          <div className="action-icon">
                            {complexity === 'molto_alta' ? '🔥' :
                             complexity === 'alta' ? '⚡' :
                             complexity === 'media' ? '⚙️' : '💡'}
                          </div>
                          <span className="action-name">
                            {complexity === 'molto_alta' ? 'Molto Alta' :
                             complexity === 'alta' ? 'Alta' :
                             complexity === 'media' ? 'Media' : 'Bassa'}
                          </span>
                          <span className="action-count">{count}</span>
                        </div>
                        <div className="action-bar">
                          <div 
                            className="bar-fill"
                            style={{
                              width: `${(count / stats.totalTasks) * 100}%`,
                              backgroundColor: 
                                complexity === 'molto_alta' ? '#ef4444' :
                                complexity === 'alta' ? '#f59e0b' :
                                complexity === 'media' ? '#3b82f6' : '#10b981'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="stats-card">
                  <h3>Top Utenti</h3>
                  <div className="top-users">
                    {Object.entries(stats.byUser || {})
                      .sort(([,a], [,b]) => b.tasks - a.tasks)
                      .slice(0, 5)
                      .map(([userId, userStats]) => (
                        <div key={userId} className="user-rank">
                          <div className="user-info">
                            <div 
                              className="user-avatar"
                              style={{ backgroundColor: getAvatarColor(userId) }}
                            >
                              {userStats.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="user-name">{userStats.name}</div>
                              <div className="user-stats-small">
                                {userStats.tasks} task • {userStats.hours}h
                              </div>
                            </div>
                          </div>
                          <div className="user-stats">
                            <span className="user-percentage">
                              {Math.round((userStats.tasks / stats.totalTasks) * 100)}%
                            </span>
                            <span className="user-score">{userStats.avgScore}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="stats-card">
                  <h3>Distribuzione per Progetto</h3>
                  <div className="project-distribution">
                    {Object.entries(stats.byProject || {})
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([project, count]) => (
                        <div key={project} className="project-item">
                          <div className="project-header">
                            <span className="project-name">{project}</span>
                            <span className="project-count">{count} task</span>
                          </div>
                          <div className="project-bar">
                            <div 
                              className="bar-fill"
                              style={{
                                width: `${(count / stats.totalTasks) * 100}%`,
                                backgroundColor: '#3b82f6'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-stats">
                <div className="spinner"></div>
                <p>Calcolo statistiche...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Dettagli Attività */}
      {selectedActivity && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dettagli Task Completato</h2>
              <button onClick={handleCloseDetails} className="modal-close">
                <FiX />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="activity-details">
                <div className="detail-section">
                  <h3>Informazioni Base</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">ID Attività:</span>
                      <span className="detail-value">{selectedActivity.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Data Completamento:</span>
                      <span className="detail-value">{formatDateTime(selectedActivity.timestamp)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tempo trascorso:</span>
                      <span className="detail-value">{formatTimeAgo(selectedActivity.timestamp)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tipo:</span>
                      <span className="detail-value">{getActionLabel(selectedActivity.type)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Task</h3>
                  <div className="task-detail-card">
                    <h4 className="task-title">{selectedActivity.taskTitle || selectedActivity.title}</h4>
                    <p className="task-description">{selectedActivity.description}</p>
                    
                    <div className="task-meta">
                      <div className="meta-item">
                        <span className="meta-label">Progetto:</span>
                        <span className="meta-value">{selectedActivity.project || 'N/D'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Client:</span>
                        <span className="meta-value">{selectedActivity.client || 'Gariboldi SRL'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Dipartimento:</span>
                        <span className="meta-value">{selectedActivity.department || 'Sviluppo'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Utente</h3>
                  <div className="user-detail">
                    <div 
                      className="user-avatar-large"
                      style={{ backgroundColor: getAvatarColor(selectedActivity.userId) }}
                    >
                      {selectedActivity.userName?.charAt(0) || 'U'}
                    </div>
                    <div className="user-info">
                      <h4>{selectedActivity.userName || 'Utente Sconosciuto'}</h4>
                      <p>{selectedActivity.userEmail || ''}</p>
                      <span className="user-role">{selectedActivity.userRole || 'dipendente'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Metriche di Performance</h3>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon" style={{ backgroundColor: '#3b82f6' }}>
                        <FiClock />
                      </div>
                      <div className="metric-content">
                        <h4 className="metric-value">{selectedActivity.hoursSpent || 0}h</h4>
                        <p className="metric-label">Ore Lavorate</p>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon" style={{ backgroundColor: '#10b981' }}>
                        <FiTrendingUp />
                      </div>
                      <div className="metric-content">
                        <h4 className="metric-value">{selectedActivity.qualityScore || 0}%</h4>
                        <p className="metric-label">Qualità</p>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon" style={{ backgroundColor: '#f59e0b' }}>
                        {getComplexityBadge(selectedActivity.complexity)}
                      </div>
                      <div className="metric-content">
                        <h4 className="metric-value">
                          {selectedActivity.complexity === 'molto_alta' ? 'Molto Alta' :
                           selectedActivity.complexity === 'alta' ? 'Alta' :
                           selectedActivity.complexity === 'media' ? 'Media' : 'Bassa'}
                        </h4>
                        <p className="metric-label">Complessità</p>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon" style={{ backgroundColor: '#8b5cf6' }}>
                        {getStatusBadge(selectedActivity.status)}
                      </div>
                      <div className="metric-content">
                        <h4 className="metric-value">
                          {selectedActivity.status === 'approved' ? 'Approvato' :
                           selectedActivity.status === 'rejected' ? 'Rifiutato' :
                           selectedActivity.status === 'in_review' ? 'In Revisione' : 'Completato'}
                        </h4>
                        <p className="metric-label">Stato</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedActivity.technologies && selectedActivity.technologies.length > 0 && (
                  <div className="detail-section">
                    <h3>Tecnologie Utilizzate</h3>
                    <div className="tech-tags">
                      {selectedActivity.technologies.map(tech => (
                        <span key={tech} className="tech-tag">
                          <FiCode /> {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="detail-section">
                  <h3>Dati Firestore</h3>
                  <div className="firestore-info">
                    <div className="data-item">
                      <span className="data-label">ID Documento:</span>
                      <code className="data-value">{selectedActivity.id}</code>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Sincronizzato:</span>
                      <span className="data-value">
                        {selectedActivity.timestamp ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={handleCloseDetails} className="btn-secondary">
                Chiudi
              </button>
              <button 
                onClick={handleGoToDashboard} 
                className="btn-primary"
                style={{ marginLeft: '10px' }}
              >
                <FiHome />
                <span>Torna alla Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer con pulsante fisso */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={handleGoToDashboard}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
            fontSize: '24px',
            transition: 'all 0.3s'
          }}
          title="Torna alla Dashboard"
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FiHome />
        </button>
      </div>
    </div>
  );
};

export default AdminHistory;  