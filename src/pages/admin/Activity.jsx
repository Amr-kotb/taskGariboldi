import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  limit,
  startAfter,
  doc,
  getDoc
} from 'firebase/firestore';
import './Activity.css';

// 🔥 CONFIGURAZIONE FIREBASE
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const AdminActivity = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastActivity, setLastActivity] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: '30days',
    user: 'all'
  });
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    todayActivities: 0,
    uniqueUsers: 0,
    taskActivities: 0
  });

  // Carica attività iniziali
  const loadActivities = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      let activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      // Applica filtro data
      if (filters.dateRange !== 'all') {
        const date = new Date();
        if (filters.dateRange === 'today') {
          date.setHours(0, 0, 0, 0);
        } else if (filters.dateRange === '7days') {
          date.setDate(date.getDate() - 7);
        } else if (filters.dateRange === '30days') {
          date.setDate(date.getDate() - 30);
        }
        
        activitiesQuery = query(
          activitiesQuery,
          where('timestamp', '>=', date)
        );
      }
      
      // Applica filtro tipo
      if (filters.type !== 'all') {
        activitiesQuery = query(
          activitiesQuery,
          where('type', '==', filters.type)
        );
      }
      
      // Applica filtro utente
      if (filters.user !== 'all') {
        activitiesQuery = query(
          activitiesQuery,
          where('userId', '==', filters.user)
        );
      }
      
      // Per il caricamento successivo
      if (loadMore && lastActivity) {
        activitiesQuery = query(
          activitiesQuery,
          startAfter(lastActivity.timestamp)
        );
      }
      
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activitiesList = [];
      let lastDoc = null;
      
      for (const docSnap of activitiesSnapshot.docs) {
        const activityData = docSnap.data();
        let userName = 'Utente sconosciuto';
        let userEmail = '';
        let userAvatar = '';
        
        // Recupera info utente se disponibile
        if (activityData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', activityData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.name || 'Utente sconosciuto';
              userEmail = userData.email || '';
              userAvatar = userData.avatar || userData.name?.charAt(0) || '?';
            }
          } catch (error) {
            console.error('Errore caricamento utente:', error);
          }
        }
        
        activitiesList.push({
          id: docSnap.id,
          ...activityData,
          timestamp: activityData.timestamp?.toDate ? activityData.timestamp.toDate() : new Date(activityData.timestamp),
          user: {
            name: userName,
            email: userEmail,
            avatar: userAvatar,
            id: activityData.userId
          }
        });
        
        lastDoc = docSnap;
      }
      
      if (loadMore) {
        setActivities(prev => [...prev, ...activitiesList]);
      } else {
        setActivities(activitiesList);
      }
      
      // Aggiorna ultimo documento per paginazione
      if (lastDoc && activitiesList.length > 0) {
        setLastActivity(activitiesList[activitiesList.length - 1]);
      }
      
      setHasMore(activitiesList.length === 20);
      
      // Carica statistiche
      loadStats();
      
    } catch (error) {
      console.error('❌ Errore caricamento attività:', error);
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [filters, lastActivity]);

  // Carica statistiche
  const loadStats = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activitiesSnapshot = await getDocs(
        query(
          collection(db, 'activities'),
          where('timestamp', '>=', today)
        )
      );
      
      const allActivitiesSnapshot = await getDocs(collection(db, 'activities'));
      
      const usersSet = new Set();
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach(doc => {
        usersSet.add(doc.id);
      });
      
      // Task related activities
      const taskActivities = await getDocs(
        query(
          collection(db, 'activities'),
          where('type', 'in', ['task_create', 'task_update', 'task_complete', 'task_delete'])
        )
      );
      
      setStats({
        totalActivities: allActivitiesSnapshot.size,
        todayActivities: activitiesSnapshot.size,
        uniqueUsers: usersSet.size,
        taskActivities: taskActivities.size
      });
      
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  }, []);

  // Carica utenti per filtro
  const loadUsers = useCallback(async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadActivities();
      loadUsers();
    }
  }, [user, loadActivities, loadUsers]);

  // Gestione filtri
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Tipi di attività
  const activityTypes = [
    { value: 'all', label: 'Tutte le attività', icon: '📋', color: '#6366f1' },
    { value: 'task_create', label: 'Task creati', icon: '➕', color: '#10b981' },
    { value: 'task_update', label: 'Task modificati', icon: '✏️', color: '#3b82f6' },
    { value: 'task_complete', label: 'Task completati', icon: '✅', color: '#8b5cf6' },
    { value: 'task_delete', label: 'Task eliminati', icon: '🗑️', color: '#ef4444' },
    { value: 'user_create', label: 'Utenti registrati', icon: '👤', color: '#f59e0b' },
    { value: 'user_update', label: 'Utenti modificati', icon: '⚙️', color: '#6366f1' },
    { value: 'file_upload', label: 'File caricati', icon: '📎', color: '#ec4899' },
    { value: 'comment', label: 'Commenti', icon: '💬', color: '#14b8a6' },
    { value: 'login', label: 'Accessi', icon: '🔐', color: '#84cc16' }
  ];

  // Intervalli di tempo
  const dateRanges = [
    { value: 'today', label: 'Oggi' },
    { value: '7days', label: 'Ultimi 7 giorni' },
    { value: '30days', label: 'Ultimi 30 giorni' },
    { value: 'all', label: 'Tutto' }
  ];

  // Formatta data
  const formatDate = (date) => {
    if (!date) return 'N/D';
    
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Pochi secondi fa';
    if (diffMins < 60) return `${diffMins} minuti fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    
    return activityDate.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ottieni icona per tipo attività
  const getActivityIcon = (type) => {
    const typeInfo = activityTypes.find(t => t.value === type);
    return typeInfo?.icon || '📝';
  };

  // Ottieni colore per tipo attività
  const getActivityColor = (type) => {
    const typeInfo = activityTypes.find(t => t.value === type);
    return typeInfo?.color || '#6366f1';
  };

  // Ottieni label per tipo attività
  const getActivityLabel = (type) => {
    const typeInfo = activityTypes.find(t => t.value === type);
    return typeInfo?.label || 'Attività';
  };

  // Carica altre attività
  const loadMoreActivities = () => {
    if (hasMore && !loadingMore) {
      loadActivities(true);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-content">
          <div className="admin-loading-spinner"></div>
          <p className="admin-loading-text">Caricamento attività...</p>
          <p className="admin-loading-subtext">Sto recuperando lo storico delle attività</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-activity">
      {/* Header */}
      <header className="admin-activity-header">
        <div className="admin-activity-header-content">
          <div className="admin-activity-title-section">
            <h1 className="admin-activity-title">📊 Attività del Sistema</h1>
            <p className="admin-activity-subtitle">
              Storico completo di tutte le attività e operazioni nel sistema
              <span className="admin-activity-count">
                {stats.totalActivities} attività totali
              </span>
            </p>
          </div>
          
          <div className="admin-activity-actions">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="admin-btn-back"
            >
              <span className="admin-btn-icon">←</span>
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="admin-activity-main">
        {/* Statistiche */}
        <div className="admin-activity-stats">
          <div className="admin-activity-stat-card">
            <div className="admin-activity-stat-icon">📋</div>
            <div className="admin-activity-stat-content">
              <div className="admin-activity-stat-value">{stats.totalActivities}</div>
              <div className="admin-activity-stat-label">Attività Totali</div>
            </div>
          </div>
          
          <div className="admin-activity-stat-card">
            <div className="admin-activity-stat-icon">⚡</div>
            <div className="admin-activity-stat-content">
              <div className="admin-activity-stat-value">{stats.todayActivities}</div>
              <div className="admin-activity-stat-label">Oggi</div>
            </div>
          </div>
          
          <div className="admin-activity-stat-card">
            <div className="admin-activity-stat-icon">👥</div>
            <div className="admin-activity-stat-content">
              <div className="admin-activity-stat-value">{stats.uniqueUsers}</div>
              <div className="admin-activity-stat-label">Utenti Attivi</div>
            </div>
          </div>
          
          <div className="admin-activity-stat-card">
            <div className="admin-activity-stat-icon">✅</div>
            <div className="admin-activity-stat-content">
              <div className="admin-activity-stat-value">{stats.taskActivities}</div>
              <div className="admin-activity-stat-label">Attività Task</div>
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="admin-activity-filters">
          <div className="admin-filter-section">
            <h3 className="admin-filter-title">🔍 Filtra Attività</h3>
            <div className="admin-filter-grid">
              {/* Filtro Tipo */}
              <div className="admin-filter-group">
                <label className="admin-filter-label">Tipo Attività</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="admin-filter-select"
                >
                  {activityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Data */}
              <div className="admin-filter-group">
                <label className="admin-filter-label">Periodo</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="admin-filter-select"
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Utente */}
              <div className="admin-filter-group">
                <label className="admin-filter-label">Utente</label>
                <select
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="all">Tutti gli utenti</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filtri */}
              <div className="admin-filter-group">
                <button
                  onClick={() => setFilters({ type: 'all', dateRange: '30days', user: 'all' })}
                  className="admin-filter-reset"
                >
                  <span className="admin-btn-icon">🔄</span>
                  Reset Filtri
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista Attività */}
        <div className="admin-activity-list-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">
              {filters.type === 'all' ? '📋 Tutte le Attività' : `📋 ${getActivityLabel(filters.type)}`}
            </h2>
            <p className="admin-section-subtitle">
              {activities.length} attività trovate • Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
            </p>
          </div>

          {activities.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">📭</div>
              <p className="admin-empty-title">Nessuna attività trovata</p>
              <p className="admin-empty-message">
                {filters.type !== 'all' || filters.user !== 'all' || filters.dateRange !== '30days'
                  ? 'Prova a cambiare i filtri di ricerca'
                  : 'Le attività verranno visualizzate qui non appena disponibili'}
              </p>
            </div>
          ) : (
            <>
              <div className="admin-activity-timeline">
                {activities.map((activity) => (
                  <div key={activity.id} className="admin-activity-item">
                    <div className="admin-activity-item-content">
                      <div 
                        className="admin-activity-icon"
                        style={{ backgroundColor: `${getActivityColor(activity.type)}15`, color: getActivityColor(activity.type) }}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="admin-activity-details">
                        <div className="admin-activity-header-row">
                          <h4 className="admin-activity-title">
                            {activity.title || getActivityLabel(activity.type)}
                          </h4>
                          <span className="admin-activity-time">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                        
                        <p className="admin-activity-description">
                          {activity.description || 'Nessuna descrizione disponibile'}
                        </p>
                        
                        <div className="admin-activity-meta">
                          <div className="admin-activity-user">
                            <div className="admin-activity-user-avatar">
                              {activity.user.avatar}
                            </div>
                            <div className="admin-activity-user-info">
                              <span className="admin-activity-user-name">{activity.user.name}</span>
                              {activity.user.email && (
                                <span className="admin-activity-user-email">{activity.user.email}</span>
                              )}
                            </div>
                          </div>
                          
                          {activity.details && (
                            <div className="admin-activity-extra">
                              <span className="admin-activity-extra-label">Dettagli:</span>
                              <span className="admin-activity-extra-value">{activity.details}</span>
                            </div>
                          )}
                          
                          {activity.ipAddress && (
                            <div className="admin-activity-ip">
                              <span className="admin-activity-ip-label">IP:</span>
                              <span className="admin-activity-ip-value">{activity.ipAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-activity-actions">
                      <span 
                        className="admin-activity-type-badge"
                        style={{ backgroundColor: `${getActivityColor(activity.type)}20`, color: getActivityColor(activity.type) }}
                      >
                        {getActivityLabel(activity.type)}
                      </span>
                      
                      {activity.taskId && (
                        <button
                          onClick={() => navigate(`/admin/tasks?view=${activity.taskId}`)}
                          className="admin-activity-task-btn"
                        >
                          Vedi Task
                        </button>
                      )}
                      
                      {activity.userId && (
                        <button
                          onClick={() => navigate(`/admin/users?view=${activity.userId}`)}
                          className="admin-activity-user-btn"
                        >
                          Vedi Utente
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Carica altre */}
              {hasMore && (
                <div className="admin-load-more">
                  <button
                    onClick={loadMoreActivities}
                    disabled={loadingMore}
                    className="admin-load-more-btn"
                  >
                    {loadingMore ? (
                      <>
                        <span className="admin-loading-spinner-small"></span>
                        Caricamento...
                      </>
                    ) : (
                      'Carica altre attività'
                    )}
                  </button>
                </div>
              )}

              {/* Fine lista */}
              {!hasMore && activities.length > 0 && (
                <div className="admin-end-of-list">
                  <span className="admin-end-of-list-text">🎉 Hai raggiunto la fine delle attività!</span>
                  <span className="admin-end-of-list-subtext">
                    Mostrando tutte le {activities.length} attività
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tipi di attività */}
        <div className="admin-activity-types-section">
          <h3 className="admin-section-title">🎯 Tipi di Attività</h3>
          <div className="admin-activity-types-grid">
            {activityTypes.filter(type => type.value !== 'all').map((type) => (
              <div 
                key={type.value}
                className="admin-activity-type-card"
                style={{ borderColor: `${type.color}20`, backgroundColor: `${type.color}05` }}
                onClick={() => handleFilterChange('type', type.value)}
              >
                <div 
                  className="admin-activity-type-icon"
                  style={{ backgroundColor: `${type.color}15`, color: type.color }}
                >
                  {type.icon}
                </div>
                <div className="admin-activity-type-info">
                  <div className="admin-activity-type-label">{type.label}</div>
                  <div className="admin-activity-type-count">
                    {activities.filter(a => a.type === type.value).length} attività
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export e Tools */}
        <div className="admin-activity-tools">
          <div className="admin-tools-header">
            <h3 className="admin-section-title">🛠️ Strumenti</h3>
            <p className="admin-section-subtitle">Esporta e gestisci lo storico attività</p>
          </div>
          
          <div className="admin-tools-grid">
            <button className="admin-tool-card">
              <span className="admin-tool-icon">📤</span>
              <div className="admin-tool-content">
                <div className="admin-tool-title">Esporta in CSV</div>
                <div className="admin-tool-description">Scarica tutte le attività in formato CSV</div>
              </div>
            </button>
            
            <button className="admin-tool-card">
              <span className="admin-tool-icon">📊</span>
              <div className="admin-tool-content">
                <div className="admin-tool-title">Report Attività</div>
                <div className="admin-tool-description">Genera report dettagliato delle attività</div>
              </div>
            </button>
            
            <button className="admin-tool-card">
              <span className="admin-tool-icon">🔍</span>
              <div className="admin-tool-content">
                <div className="admin-tool-title">Ricerca Avanzata</div>
                <div className="admin-tool-description">Ricerca specifica nelle attività</div>
              </div>
            </button>
            
            <button className="admin-tool-card">
              <span className="admin-tool-icon">🗑️</span>
              <div className="admin-tool-content">
                <div className="admin-tool-title">Pulisci Storico</div>
                <div className="admin-tool-description">Rimuovi attività vecchie</div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="admin-activity-footer">
        <div className="admin-activity-footer-content">
          <div className="admin-activity-footer-info">
            <p className="admin-activity-footer-text">
              Sistema di Tracciamento Attività • Versione 2.0 • 
              Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
            </p>
            <p className="admin-activity-footer-subtext">
              Monitorando {activities.length} attività in tempo reale
            </p>
          </div>
          
          <div className="admin-activity-footer-stats">
            <span className="admin-footer-stat">
              <span className="admin-footer-stat-value">{stats.todayActivities}</span>
              <span className="admin-footer-stat-label">attività oggi</span>
            </span>
            <span className="admin-footer-stat">
              <span className="admin-footer-stat-value">{stats.uniqueUsers}</span>
              <span className="admin-footer-stat-label">utenti attivi</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminActivity;