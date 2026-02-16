import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTasks } from '../../hooks/useTasks.jsx';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  limit
} from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';

import './admin-dashboard.css';

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,  
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inizializzazione Firebase
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('Errore inizializzazione Firebase:', error);
}

const db = getFirestore(app);

// ⏱️ COMPONENTE TIMER
const AutoUpdateTimer = ({ lastUpdate, onRefresh, isRefreshing: externalRefreshing }) => {
  const [timeToNextUpdate, setTimeToNextUpdate] = useState(300);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const UPDATE_INTERVAL = 300;
  const timerRef = useRef(null);
  const isMounted = useRef(true);

  const refreshing = externalRefreshing !== undefined ? externalRefreshing : internalRefreshing;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!isMounted.current) return;

      setTimeToNextUpdate(prev => {
        if (prev <= 1) {
          if (!refreshing && isMounted.current) {
            setInternalRefreshing(true);
            onRefresh().finally(() => {
              if (isMounted.current) {
                setInternalRefreshing(false);
                setTimeToNextUpdate(UPDATE_INTERVAL);
              }
            });
          }
          return UPDATE_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [onRefresh, refreshing]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleManualRefresh = () => {
    if (refreshing) return;
    
    setInternalRefreshing(true);
    onRefresh().finally(() => {
      if (isMounted.current) {
        setInternalRefreshing(false);
        setTimeToNextUpdate(UPDATE_INTERVAL);
      }
    });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      backgroundColor: '#e0f2fe',
      borderRadius: '30px',
      border: '1px solid #7dd3fc',
      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.1)',
      marginRight: '15px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: refreshing ? '#059669' : '#0369a1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px',
        animation: refreshing ? 'spin 1s linear infinite' : 'none'
      }}>
        {refreshing ? '🔄' : '⏱️'}
      </div>

      <div>
        <div style={{
          fontSize: '12px',
          color: '#0369a1',
          fontWeight: '600',
          marginBottom: '2px'
        }}>
          {refreshing ? 'AGGIORNAMENTO IN CORSO...' : 'PROSSIMO AGGIORNAMENTO'}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#0c4a6e',
            fontFamily: 'monospace'
          }}>
            {refreshing ? '--:--' : formatTimer(timeToNextUpdate)}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            style={{
              padding: '4px 12px',
              backgroundColor: refreshing ? '#9ca3af' : '#0369a1',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            <span>🔄</span>
            {refreshing ? '...' : 'Aggiorna'}
          </button>
        </div>
      </div>

      <div style={{
        fontSize: '11px',
        color: '#0369a1',
        borderLeft: '1px solid #7dd3fc',
        paddingLeft: '12px',
        marginLeft: '4px'
      }}>
        <div>Ultimo</div>
        <div style={{ fontWeight: '600' }}>
          {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    tasks, 
    deletedTasks, 
    loadAllTasks, 
    loadDeletedTasks,
    restoreTask,
    deletePermanently,
    emptyTrash,
    loading: tasksLoading,
    error: tasksError,
    subscribeToAllTasks
  } = useTasks();
  
  const [dashboardData, setDashboardData] = useState({
    users: [],
    activities: [],
    stats: {},
    systemStatus: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [quickStats, setQuickStats] = useState({
    pendingTasks: 0,
    urgentTasks: 0,
    recentUsers: 0,
    storageUsage: 0
  });

  const quickActions = [
    {
      id: 'statistics',
      title: '📊 Statistiche',
      description: 'Analisi dettagliate e report',
      link: '/admin/stats', 
      icon: '📊',
      color: 'blue',
      badge: 'Analytics'
    },
    {
      id: 'users',
      title: '👥 Gestione Utenti',
      description: 'Gestisci tutti gli utenti del sistema',
      link: '/admin/users',
      icon: '👥',
      color: 'green',
      badge: 'Admin'
    },
    {
      id: 'tasks',
      title: '📋 Gestione Task',
      description: 'Visualizza e modifica tutti i task',
      link: '/admin/tasks', 
      icon: '📋',
      color: 'purple',
      badge: 'Manage'
    },
    {
      id: 'assign',
      title: '🎯 Assegna Task',
      description: 'Assegna nuovi task agli utenti',
      link: '/admin/assign-task', 
      icon: '🎯',
      color: 'orange',
      badge: 'Assign'
    },
    {
      id: 'reports',
      title: '📈 Report',
      description: 'Genera report e documenti',
      link: '/admin/reports',
      icon: '📈',
      color: 'red',
      badge: 'Export'
    },
    {
      id: 'activity',
      title: '📝 Attività Recenti',
      description: 'Storico delle attività del sistema',
      link: '/admin/activity',
      icon: '📝',
      color: 'cyan',
      badge: 'Logs'
    },
    {
      id: 'history',
      title: '📖 Storico Completo',
      description: 'Archivio storico di tutte le azioni',
      link: '/admin/history',
      icon: '📖',
      color: 'indigo',
      badge: 'Archive'
    },
    {
      id: 'settings',
      title: '⚙️ Impostazioni Sistema',
      description: 'Configura le impostazioni della piattaforma',
      link: '/admin/settings',
      icon: '⚙️',
      color: 'gray',
      badge: 'Config'
    },
    {
      id: 'trash',
      title: '🗑️ Cestino Globale',
      description: 'Gestisci i task eliminati',
      link: '/admin/trash', 
      icon: '🗑️',
      color: 'red',
      badge: deletedTasks.length > 0 ? `${deletedTasks.length}` : 'Empty'
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
      setError('Errore durante il logout');
    }
  };

  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return 'N/D';
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/D';
    }
  }, []);

  const formatDateTime = useCallback((dateValue) => {
    if (!dateValue) return 'N/D';
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/D';
    }
  }, []);

  const calculateQuickStats = useCallback((tasksList, usersList) => {
    const now = new Date();
    
    const pendingTasks = tasksList.filter(t => 
      t.status !== 'completato' && t.status !== 'bloccato'
    ).length;
    
    const urgentTasks = tasksList.filter(task => {
      if (!task.dueDate || task.status === 'completato') return false;
      try {
        const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        const daysDiff = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
        return daysDiff <= 3 && daysDiff >= 0;
      } catch {
        return false;
      }
    }).length;

    const recentUsers = usersList.filter(user => {
      if (!user.createdAt) return false;
      try {
        const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        const daysDiff = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      } catch {
        return false;
      }
    }).length;

    return {
      pendingTasks,
      urgentTasks,
      recentUsers,
      storageUsage: Math.round((tasksList.length + usersList.length) * 0.5)
    };
  }, []);

  // ✅ FUNZIONE DI CARICAMENTO DATI - RIMOSSE DIPENDENZE CIRCOLARI
  const fetchAllData = useCallback(async () => {
    if (!db) {
      setError('Database non disponibile');
      setLoading(false);
      return null;
    }

    try {
      console.log('📊 Caricamento dati dashboard admin...');
      
      // Carica utenti
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Carica task globali
      await loadAllTasks();
      
      // Carica task eliminati globali
      await loadDeletedTasks('all');
      
      // Carica attività recenti
      let activitiesList = [];
      try {
        const activitiesCollection = collection(db, 'activities');
        const activitiesSnapshot = await getDocs(
          query(activitiesCollection, orderBy('timestamp', 'desc'), limit(10))
        );
        activitiesList = activitiesSnapshot.docs
          .map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
          }));
      } catch (activityError) {
        console.error('❌ Errore caricamento attività:', activityError);
      }
      
      // Calcola statistiche dettagliate
      const stats = calculateStats(usersList);
      
      // Calcola statistiche rapide
      const quickStatsData = calculateQuickStats(tasks, usersList);
      
      // Carica stato sistema
      const systemStatus = await loadSystemStatus();
      
      setDashboardData({
        users: usersList,
        activities: activitiesList,
        stats,
        systemStatus
      });
      
      setQuickStats(quickStatsData);
      setLastUpdate(new Date());
      setError(null);
      
      console.log('✅ Dati dashboard caricati:', {
        tasks: tasks.length,
        deletedTasks: deletedTasks.length,
        users: usersList.length
      });
      
      return true;
    } catch (error) {
      console.error('❌ Errore caricamento dashboard:', error);
      setError(`Errore nel caricamento dei dati: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAllTasks, loadDeletedTasks, tasks, deletedTasks, calculateQuickStats]);

  // ✅ FUNZIONE DI REFRESH - MODIFICATA
  const refreshData = useCallback(async () => {
    if (isRefreshing) {
      console.log('⏳ Aggiornamento già in corso...');
      return;
    }
    
    setIsRefreshing(true);
    setError(null);
    console.log('🔄 [AdminDashboard] Aggiornamento dati...');
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout aggiornamento')), 30000)
      );
      
      await Promise.race([
        fetchAllData(),
        timeoutPromise
      ]);
      
      setRetryCount(0);
      console.log('✅ [AdminDashboard] Aggiornamento completato');
    } catch (error) {
      console.error('❌ [AdminDashboard] Errore aggiornamento:', error);
      setRetryCount(prev => prev + 1);
      
      if (retryCount >= 3) {
        setError('❌ Troppi tentativi di aggiornamento. Verifica i permessi o la connessione.');
      } else {
        setError(`Errore durante l'aggiornamento: ${error.message}`);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, retryCount, fetchAllData]);

  // Carica dati iniziali
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let isMounted = true;

    const loadInitialData = async () => {
      if (!db) {
        setError('Database non disponibile');
        setLoading(false);
        return;
      }

      try {
        await fetchAllData();
      } catch (error) {
        console.error('❌ Errore caricamento dashboard:', error);
        if (isMounted) {
          setError(`❌ Errore nel caricamento dei dati: ${error.message}`);
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [user, fetchAllData]);

  // Setup real-time updates
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    console.log('🔌 [AdminDashboard] Attivazione real-time updates');
    
    const unsubscribe = subscribeToAllTasks({}, (updatedTasks) => {
      console.log('📦 [AdminDashboard] Task aggiornati in tempo reale:', updatedTasks.length);
      setLastUpdate(new Date());
    });

    return () => {
      console.log('🔌 [AdminDashboard] Disattivazione real-time updates');
      unsubscribe();
    };
  }, [user, subscribeToAllTasks]);

  // ✅ CALCOLA STATISTICHE - MODIFICATO PER USARE tasks E deletedTasks DIRETTAMENTE
  const calculateStats = useCallback((usersList) => {
    const now = new Date();
    
    const completedTasks = tasks.filter(t => t.status === 'completato').length;
    const activeTasks = tasks.filter(t => t.status === 'in corso' || t.status === 'assegnato').length;
    
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completato') return false;
      try {
        const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        return dueDate < now;
      } catch {
        return false;
      }
    }).length;
    
    const highPriorityTasks = tasks.filter(t => t.priority === 'alta' || t.priority === 'critica').length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const today = new Date();
    const deletedToday = deletedTasks.filter(item => {
      if (!item.deletedAt) return false;
      try {
        const deletedDate = item.deletedAt.toDate ? item.deletedAt.toDate() : new Date(item.deletedAt);
        return deletedDate.toDateString() === today.toDateString();
      } catch {
        return false;
      }
    }).length;

    return {
      totalUsers: usersList.length,
      activeUsers: usersList.filter(u => u.status === 'active').length,
      totalTasks: tasks.length,
      completedTasks,
      activeTasks,
      overdueTasks,
      highPriorityTasks,
      completionRate,
      totalDeleted: deletedTasks.length,
      deletedToday,
      systemHealth: 95,
      performance: 98,
      uptime: 99.9
    };
  }, [tasks, deletedTasks]);

  const loadSystemStatus = async () => {
    try {
      return {
        database: { status: 'online', latency: 45 },
        server: { status: 'healthy', load: 65 },
        storage: { status: 'normal', used: 75 },
        cache: { status: 'active', hitRate: 92 }
      };
    } catch {
      return {
        database: { status: 'error', latency: 0 },
        server: { status: 'unknown', load: 0 },
        storage: { status: 'unknown', used: 0 },
        cache: { status: 'unknown', hitRate: 0 }
      };
    }
  };

  const recentTasks = useMemo(() => tasks.slice(0, 5), [tasks]);
  const recentDeleted = useMemo(() => deletedTasks.slice(0, 3), [deletedTasks]);

  const handleEmptyTrash = async () => {
    if (deletedTasks.length === 0) return;
    
    if (!window.confirm(`Sei sicuro di voler svuotare il cestino globale? ${deletedTasks.length} task verranno eliminati definitivamente. Questa azione è irreversibile.`)) {
      return;
    }
    
    try {
      await emptyTrash('all');
      alert('✅ Cestino globale svuotato con successo!');
      await refreshData();
    } catch (error) {
      console.error('❌ Errore svuotamento cestino:', error);
      setError('❌ Errore durante lo svuotamento del cestino');
    }
  };

  const handleRestoreTask = async (taskId) => {
    try {
      await restoreTask(taskId);
      alert('✅ Task ripristinato con successo!');
      await refreshData();
    } catch (error) {
      console.error('❌ Errore ripristino task:', error);
      setError('❌ Errore nel ripristino del task');
    }
  };

  const handleDeletePermanently = async (taskId) => {
    if (!window.confirm('Sei sicuro di voler eliminare definitivamente questo task?')) return;
    
    try {
      await deletePermanently(taskId);
      alert('✅ Task eliminato definitivamente!');
      await refreshData();
    } catch (error) {
      console.error('❌ Errore eliminazione permanente:', error);
      setError('❌ Errore nell\'eliminazione del task');
    }
  };

  // Gestione errori di permessi
  if (tasksError && tasksError.includes('Missing or insufficient permissions')) {
    return (
      <div className="permission-error" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
        <h1 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '16px' }}>
          Errore di Permessi
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '500px', marginBottom: '24px' }}>
          Non hai i permessi necessari per accedere ai dati.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.location.reload()} style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            🔄 Ricarica
          </button>
          <button onClick={handleLogout} style={{
            padding: '12px 24px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            🚪 Logout
          </button>
        </div>
      </div>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Caricamento dashboard...</p>
        <p className="loading-subtext">Sto recuperando i dati dal server</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="access-denied">
        <div className="access-content">
          <div className="access-icon">🚫</div>
          <h2 className="access-title">Accesso Negato</h2>
          <p className="access-message">
            Non hai i permessi necessari per accedere alla dashboard di amministrazione.
          </p>
          <div className="access-actions">
            <button onClick={() => navigate('/')} className="btn-secondary">
              Torna alla Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <h1 className="admin-title">👑 Admin Dashboard</h1>
            <p className="admin-subtitle">
              Gestione completa del sistema • Ultimo aggiornamento: {lastUpdate ? formatDateTime(lastUpdate) : 'N/D'}
            </p>
          </div>
          
          <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AutoUpdateTimer lastUpdate={lastUpdate} onRefresh={refreshData} isRefreshing={isRefreshing} />
            <button onClick={() => navigate('/admin/trash')} className="btn-trash">
              🗑️ Cestino Globale ({deletedTasks.length})
            </button>
            <button onClick={handleLogout} className="btn-logout">
              👋 Esci
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="welcome-section">
          <div className="welcome-card">
            <div className="welcome-content">
              <div className="welcome-icon">👋</div>
              <div className="welcome-text">
                <h2>Benvenuto, {user?.displayName || user?.email || 'Admin'}!</h2>
                <p>Gestisci il sistema da questa dashboard centrale</p>
              </div>
            </div>
            <div className="welcome-stats">
              <div className="welcome-stat">
                <span className="stat-value">{tasks.length}</span>
                <span className="stat-label">Task Attivi</span>
              </div>
              <div className="welcome-stat">
                <span className="stat-value">{dashboardData.users?.length || 0}</span>
                <span className="stat-label">Utenti</span>
              </div>
              <div className="welcome-stat">
                <span className="stat-value">{deletedTasks.length}</span>
                <span className="stat-label">Nel Cestino</span>
              </div>
              <div className="welcome-stat">
                <span className="stat-value">{dashboardData.stats?.activeTasks || 0}</span>
                <span className="stat-label">Task in Corso</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3 className="stat-title">Utenti Registrati</h3>
              <div className="stat-value">{dashboardData.stats.totalUsers || 0}</div>
              <div className="stat-subtitle">{dashboardData.stats.activeUsers || 0} attivi</div>
            </div>
          </div>
          
          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3 className="stat-title">Task Completati</h3>
              <div className="stat-value">{dashboardData.stats.completedTasks || 0}</div>
              <div className="stat-subtitle">{dashboardData.stats.completionRate || 0}% completamento</div>
            </div>
          </div>
          
          <div className="stat-card orange">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3 className="stat-title">Task in Ritardo</h3>
              <div className="stat-value">{dashboardData.stats.overdueTasks || 0}</div>
              <div className="stat-subtitle">{dashboardData.stats.highPriorityTasks || 0} ad alta priorità</div>
            </div>
          </div>
          
          <div className="stat-card red">
            <div className="stat-icon">🗑️</div>
            <div className="stat-content">
              <h3 className="stat-title">Cestino Globale</h3>
              <div className="stat-value">{dashboardData.stats.totalDeleted || 0}</div>
              <div className="stat-subtitle">{dashboardData.stats.deletedToday || 0} eliminati oggi</div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">🚀 Azioni Rapide</h3>
            <div className="card-actions">
              <span className="stat-subtitle">{quickActions.length} azioni disponibili</span>
            </div>
          </div>
          <div className="card-content">
            <div className="quick-actions-grid">
              {quickActions.map((action) => (
                <Link key={action.id} to={action.link} className={`quick-action-card ${action.color}`}>
                  <div className="quick-action-icon">{action.icon}</div>
                  <div className="quick-action-content">
                    <h4 className="quick-action-title">{action.title}</h4>
                    <p className="quick-action-desc">{action.description}</p>
                  </div>
                  <div className="quick-action-badge">{action.badge}</div>
                  <div className="quick-action-arrow">→</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">📋 Task Recenti</h3>
              <Link to="/admin/tasks" className="card-action">Vedi tutti ({tasks.length})</Link>
            </div>
            <div className="card-content">
              {recentTasks.length > 0 ? (
                <div className="task-list">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="task-item" onClick={() => navigate(`/admin/edittask/${task.id}`)}>
                      <div className="task-item-header">
                        <span className="task-title">{task.title}</span>
                        <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                      </div>
                      <div className="task-item-details">
                        <span className="task-assigned">Assegnato a: {task.assignedToName || 'N/D'}</span>
                        <span className="task-date">Scade: {task.dueDate ? formatDate(task.dueDate) : 'N/D'}</span>
                      </div>
                      <div className="task-item-footer">
                        <span className={`task-status ${task.status}`}>{task.status}</span>
                        <span className="task-progress">Progresso: {task.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p className="empty-text">Nessun task disponibile</p>
                  <Link to="/admin/assigntask" className="card-action">🎯 Crea il primo task</Link>
                </div>
              )}
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">🗑️ Cestino Globale</h3>
              <div className="card-actions">
                <Link to="/admin/trash" className="card-action">Gestisci ({deletedTasks.length})</Link>
                <button onClick={handleEmptyTrash} disabled={deletedTasks.length === 0} className="card-action danger">Svuota</button>
              </div>
            </div>
            <div className="card-content">
              {recentDeleted.length > 0 ? (
                <div className="trash-preview">
                  {recentDeleted.map((item) => (
                    <div key={item.id} className="trash-item">
                      <div className="trash-item-header">
                        <span className="trash-title">{item.title}</span>
                        <span className="trash-days">
                          {(() => {
                            if (!item.deletedAt) return 'N/D';
                            try {
                              const deleted = item.deletedAt.toDate ? item.deletedAt.toDate() : new Date(item.deletedAt);
                              const now = new Date();
                              const days = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
                              return `${days}g fa`;
                            } catch {
                              return 'N/D';
                            }
                          })()}
                        </span>
                      </div>
                      <div className="trash-item-details">
                        <span className="trash-user">Eliminato da: {item.deletedByName || 'N/D'}</span>
                        <span className="trash-date">{formatDateTime(item.deletedAt)}</span>
                      </div>
                      <div className="trash-item-actions">
                        <button onClick={(e) => { e.stopPropagation(); handleRestoreTask(item.id); }} className="btn-small success">🔄 Ripristina</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePermanently(item.id); }} className="btn-small danger">🗑️ Elimina</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🎉</div>
                  <p className="empty-text">Cestino vuoto</p>
                  <p className="empty-subtext">I task eliminati appariranno qui</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">⚙️ Stato Sistema</h3>
            <span className="status-value online">Online</span>
          </div>
          <div className="card-content">
            <div className="system-status">
              <div className="status-item">
                <span className="status-label">Database</span>
                <span className="status-value online">✅ Online</span>
                <div className="health-bar"><div className="health-fill" style={{ width: '95%' }}></div></div>
              </div>
              <div className="status-item">
                <span className="status-label">Storage</span>
                <span className="status-value">{quickStats.storageUsage} MB</span>
                <div className="health-bar"><div className="health-fill" style={{ width: '65%' }}></div></div>
              </div>
              <div className="status-item">
                <span className="status-label">Task in sospeso</span>
                <span className="status-value warning">{quickStats.pendingTasks} task</span>
                <div className="health-bar"><div className="health-fill" style={{ width: `${Math.min(100, quickStats.pendingTasks * 10)}%` }}></div></div>
              </div>
              <div className="status-item">
                <span className="status-label">Task urgenti</span>
                <span className="status-value danger">{quickStats.urgentTasks} task</span>
                <div className="health-bar"><div className="health-fill" style={{ width: `${Math.min(100, quickStats.urgentTasks * 20)}%`, background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' }}></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-footer">
        <div className="footer-content">
          <span className="footer-text">TaskGariboldi Admin Dashboard • v1.0.0 • {new Date().getFullYear()}</span>
          <span className="footer-update">Ultimo aggiornamento: {lastUpdate ? formatDateTime(lastUpdate) : 'N/D'}</span>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminDashboard;