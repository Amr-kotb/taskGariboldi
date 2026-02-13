import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import './Settings.css';

// ✅ CORRETTO: Importa dal file di configurazione centrale
import { db } from '../../firebase/config';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      pushNotifications: true,
      emailAlerts: true,
      taskAssignments: true,
      taskCompletions: true,
      overdueAlerts: true,
      dailyDigest: true,
      weeklyReport: false
    },
    appearance: {
      theme: 'dark',
      fontSize: 'medium',
      compactMode: false,
      showAvatars: true,
      animations: true
    },
    system: {
      autoSave: true,
      autoBackup: true,
      backupFrequency: 'daily',
      sessionTimeout: 30,
      maxFileSize: 10,
      dataRetention: 365
    },
    security: {
      twoFactorAuth: false,
      loginNotifications: true,
      passwordExpiry: 90,
      ipWhitelist: [],
      sessionManagement: true
    },
    language: 'it',
    timezone: 'Europe/Rome',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [usersCount, setUsersCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [backupStatus, setBackupStatus] = useState({ lastBackup: null, nextBackup: null });

  // Verifica che db esista
  if (!db) {
    return (
      <div className="error-screen">
        <h2>⚠️ Errore di configurazione</h2>
        <p>Il database non è disponibile. Controlla la configurazione Firebase.</p>
      </div>
    );
  }

  // Carica impostazioni da Firestore
  const loadSettings = useCallback(async () => {
    if (!user || !db) return;
    
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'admin_settings');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setSettings(prev => ({
          ...prev,
          ...settingsSnap.data()
        }));
      }
      
      // Carica statistiche
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      
      setUsersCount(usersSnapshot.size);
      setTasksCount(tasksSnapshot.size);
      
      // Simula calcolo storage
      const totalSize = usersSnapshot.size * 5 + tasksSnapshot.size * 2;
      setStorageUsed(totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} MB` : `${totalSize} KB`);
      
      // Carica stato backup
      const backupRef = doc(db, 'backups', 'latest');
      const backupSnap = await getDoc(backupRef);
      if (backupSnap.exists()) {
        const backupData = backupSnap.data();
        setBackupStatus({
          lastBackup: backupData.timestamp?.toDate() || new Date(),
          nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
      
    } catch (error) {
      console.error('❌ Errore caricamento impostazioni:', error);
      showNotification('Errore nel caricamento delle impostazioni', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Salva impostazioni in Firestore
  const saveSettings = async () => {
    if (!user || !db) return;
    
    setSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'admin_settings');
      const settingsToSave = {
        ...settings,
        lastModified: serverTimestamp(),
        modifiedBy: user.uid,
        modifiedByName: user.name || user.email
      };
      
      await setDoc(settingsRef, settingsToSave, { merge: true });
      
      // Salva anche nelle preferenze utente
      const userSettingsRef = doc(db, 'users', user.uid);
      await setDoc(userSettingsRef, {
        preferences: {
          language: settings.language,
          timezone: settings.timezone,
          theme: settings.appearance.theme
        },
        lastSettingsUpdate: serverTimestamp()
      }, { merge: true });
      
      // Aggiorna tema globale se cambiato
      if (settings.appearance.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      
      showNotification('Impostazioni salvate con successo!', 'success');
      
    } catch (error) {
      console.error('❌ Errore salvataggio impostazioni:', error);
      showNotification('Errore nel salvataggio delle impostazioni', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Mostra notifica
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Gestione toggle
  const handleToggle = useCallback((category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  }, []);

  // Gestione cambio valore
  const handleValueChange = useCallback((category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  }, []);

  // Reset impostazioni
  const resetSettings = () => {
    if (window.confirm('Sei sicuro di voler resettare tutte le impostazioni ai valori predefiniti?')) {
      const defaultSettings = {
        notifications: {
          enabled: true,
          pushNotifications: true,
          emailAlerts: true,
          taskAssignments: true,
          taskCompletions: true,
          overdueAlerts: true,
          dailyDigest: true,
          weeklyReport: false
        },
        appearance: {
          theme: 'dark',
          fontSize: 'medium',
          compactMode: false,
          showAvatars: true,
          animations: true
        },
        system: {
          autoSave: true,
          autoBackup: true,
          backupFrequency: 'daily',
          sessionTimeout: 30,
          maxFileSize: 10,
          dataRetention: 365
        },
        security: {
          twoFactorAuth: false,
          loginNotifications: true,
          passwordExpiry: 90,
          ipWhitelist: [],
          sessionManagement: true
        },
        language: 'it',
        timezone: 'Europe/Rome',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      };
      
      setSettings(defaultSettings);
      showNotification('Impostazioni resettate ai valori predefiniti', 'info');
    }
  };

  // Test notifiche
  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Test Notifica', {
        body: 'Questa è una notifica di test dal sistema.',
        icon: '/favicon.ico'
      });
      showNotification('Notifica di test inviata con successo!', 'success');
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Test Notifica', {
            body: 'Questa è una notifica di test dal sistema.',
            icon: '/favicon.ico'
          });
          showNotification('Notifica di test inviata con successo!', 'success');
        }
      });
    }
  };

  // Backup manuale
  const manualBackup = async () => {
    if (!db) return;
    
    try {
      showNotification('Backup in corso...', 'info');
      
      // Simula backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const backupRef = doc(collection(db, 'backups'), `backup_${Date.now()}`);
      await setDoc(backupRef, {
        timestamp: serverTimestamp(),
        createdBy: user.uid,
        createdByName: user.name || user.email,
        stats: {
          users: usersCount,
          tasks: tasksCount,
          storage: storageUsed
        },
        status: 'completed'
      });
      
      setBackupStatus({
        lastBackup: new Date(),
        nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      
      showNotification('Backup completato con successo!', 'success');
      
    } catch (error) {
      console.error('❌ Errore backup:', error);
      showNotification('Errore durante il backup', 'error');
    }
  };

  // Lingue disponibili
  const languages = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  // Timezone disponibili
  const timezones = [
    { value: 'Europe/Rome', label: 'Roma (GMT+1)', offset: '+01:00' },
    { value: 'Europe/London', label: 'Londra (GMT+0)', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Parigi (GMT+1)', offset: '+01:00' },
    { value: 'Europe/Berlin', label: 'Berlino (GMT+1)', offset: '+01:00' },
    { value: 'America/New_York', label: 'New York (GMT-5)', offset: '-05:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)', offset: '+09:00' }
  ];

  // Formati data
  const dateFormats = [
    { value: 'DD/MM/YYYY', label: '31/12/2023' },
    { value: 'MM/DD/YYYY', label: '12/31/2023' },
    { value: 'YYYY-MM-DD', label: '2023-12-31' },
    { value: 'DD MMM YYYY', label: '31 Dic 2023' }
  ];

  // Frequenze backup
  const backupFrequencies = [
    { value: 'hourly', label: 'Ogni ora' },
    { value: 'daily', label: 'Giornaliero' },
    { value: 'weekly', label: 'Settimanale' },
    { value: 'monthly', label: 'Mensile' }
  ];

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-content">
          <div className="admin-loading-spinner"></div>
          <p className="admin-loading-text">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      {/* Header */}
      <header className="admin-settings-header">
        <div className="admin-settings-header-content">
          <div className="admin-settings-title-section">
            <h1 className="admin-settings-title">⚙️ Impostazioni Sistema</h1>
            <p className="admin-settings-subtitle">
              Configura e personalizza le preferenze dell'applicazione
              <span className="admin-settings-stats">
                {usersCount} utenti • {tasksCount} task
              </span>
            </p>
          </div>
          
          <div className="admin-settings-actions">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="admin-btn-back"
            >
              <span className="admin-btn-icon">←</span>
              Dashboard
            </button>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="admin-btn-save"
            >
              <span className="admin-btn-icon">{saving ? '⏳' : '💾'}</span>
              {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
            </button>
          </div>
        </div>
      </header>

      {/* Notifiche */}
      {notification.show && (
        <div className={`admin-notification admin-notification-${notification.type}`}>
          <span className="admin-notification-message">{notification.message}</span>
          <button 
            onClick={() => setNotification({ show: false, message: '', type: '' })}
            className="admin-notification-close"
          >
            ×
          </button>
        </div>
      )}

      <main className="admin-settings-main">
        {/* Statistiche */}
        <div className="admin-settings-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{usersCount}</div>
              <div className="admin-stat-label">Utenti Registrati</div>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📋</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{tasksCount}</div>
              <div className="admin-stat-label">Task Attivi</div>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon">💾</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{storageUsed}</div>
              <div className="admin-stat-label">Storage Usato</div>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🛡️</div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">2FA</div>
              <div className="admin-stat-label">
                {settings.security.twoFactorAuth ? 'Attivato' : 'Disattivato'}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-settings-grid">
          {/* Colonna sinistra */}
          <div className="admin-settings-column">
            {/* Notifiche */}
            <div className="admin-settings-card">
              <div className="admin-settings-card-header">
                <h2 className="admin-settings-card-title">
                  <span className="admin-settings-card-icon">🔔</span>
                  Notifiche
                </h2>
                <button 
                  onClick={testNotification}
                  className="admin-settings-card-action"
                >
                  Test Notifiche
                </button>
              </div>
              
              <div className="admin-settings-section">
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Notifiche Push</span>
                    <span className="admin-toggle-description">Ricevi notifiche in tempo reale</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.notifications.pushNotifications ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('notifications', 'pushNotifications')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Avvisi Email</span>
                    <span className="admin-toggle-description">Ricevi riepiloghi giornalieri</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.notifications.emailAlerts ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('notifications', 'emailAlerts')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Nuovi Task</span>
                    <span className="admin-toggle-description">Notifica per task assegnati</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.notifications.taskAssignments ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('notifications', 'taskAssignments')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Task Completati</span>
                    <span className="admin-toggle-description">Notifica per task completati</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.notifications.taskCompletions ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('notifications', 'taskCompletions')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Task in Ritardo</span>
                    <span className="admin-toggle-description">Avvisi per scadenze</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.notifications.overdueAlerts ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('notifications', 'overdueAlerts')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aspetto */}
            <div className="admin-settings-card">
              <div className="admin-settings-card-header">
                <h2 className="admin-settings-card-title">
                  <span className="admin-settings-card-icon">🎨</span>
                  Aspetto
                </h2>
              </div>
              
              <div className="admin-settings-section">
                <div className="admin-select-group">
                  <label className="admin-select-label">Tema</label>
                  <div className="admin-theme-selector">
                    <button
                      className={`admin-theme-option ${settings.appearance.theme === 'light' ? 'admin-theme-selected' : ''}`}
                      onClick={() => handleValueChange('appearance', 'theme', 'light')}
                    >
                      <span className="admin-theme-icon">☀️</span>
                      <span className="admin-theme-label">Chiaro</span>
                    </button>
                    <button
                      className={`admin-theme-option ${settings.appearance.theme === 'dark' ? 'admin-theme-selected' : ''}`}
                      onClick={() => handleValueChange('appearance', 'theme', 'dark')}
                    >
                      <span className="admin-theme-icon">🌙</span>
                      <span className="admin-theme-label">Scuro</span>
                    </button>
                    <button
                      className={`admin-theme-option ${settings.appearance.theme === 'auto' ? 'admin-theme-selected' : ''}`}
                      onClick={() => handleValueChange('appearance', 'theme', 'auto')}
                    >
                      <span className="admin-theme-icon">⚙️</span>
                      <span className="admin-theme-label">Auto</span>
                    </button>
                  </div>
                </div>
                
                <div className="admin-select-group">
                  <label className="admin-select-label">Dimensione Testo</label>
                  <select
                    value={settings.appearance.fontSize}
                    onChange={(e) => handleValueChange('appearance', 'fontSize', e.target.value)}
                    className="admin-select"
                  >
                    <option value="small">Piccolo</option>
                    <option value="medium">Medio</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Modalità Compatta</span>
                    <span className="admin-toggle-description">Riduci gli spazi tra gli elementi</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.appearance.compactMode ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('appearance', 'compactMode')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Mostra Avatar</span>
                    <span className="admin-toggle-description">Visualizza immagini profilo</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.appearance.showAvatars ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('appearance', 'showAvatars')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Animazioni</span>
                    <span className="admin-toggle-description">Attiva transizioni animate</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.appearance.animations ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('appearance', 'animations')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonna destra */}
          <div className="admin-settings-column">
            {/* Sistema */}
            <div className="admin-settings-card">
              <div className="admin-settings-card-header">
                <h2 className="admin-settings-card-title">
                  <span className="admin-settings-card-icon">⚙️</span>
                  Sistema
                </h2>
                <button 
                  onClick={manualBackup}
                  className="admin-settings-card-action"
                >
                  Backup Manuale
                </button>
              </div>
              
              <div className="admin-settings-section">
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Salvataggio Automatico</span>
                    <span className="admin-toggle-description">Salva automaticamente le modifiche</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.system.autoSave ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('system', 'autoSave')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Backup Automatico</span>
                    <span className="admin-toggle-description">Backup periodico dei dati</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.system.autoBackup ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('system', 'autoBackup')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                {settings.system.autoBackup && (
                  <div className="admin-select-group">
                    <label className="admin-select-label">Frequenza Backup</label>
                    <select
                      value={settings.system.backupFrequency}
                      onChange={(e) => handleValueChange('system', 'backupFrequency', e.target.value)}
                      className="admin-select"
                    >
                      {backupFrequencies.map(freq => (
                        <option key={freq.value} value={freq.value}>{freq.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="admin-select-group">
                  <label className="admin-select-label">Timeout Sessione (min)</label>
                  <select
                    value={settings.system.sessionTimeout}
                    onChange={(e) => handleValueChange('system', 'sessionTimeout', parseInt(e.target.value))}
                    className="admin-select"
                  >
                    <option value="15">15 minuti</option>
                    <option value="30">30 minuti</option>
                    <option value="60">1 ora</option>
                    <option value="120">2 ore</option>
                    <option value="240">4 ore</option>
                  </select>
                </div>
                
                <div className="admin-select-group">
                  <label className="admin-select-label">Dimensione Max File (MB)</label>
                  <select
                    value={settings.system.maxFileSize}
                    onChange={(e) => handleValueChange('system', 'maxFileSize', parseInt(e.target.value))}
                    className="admin-select"
                  >
                    <option value="5">5 MB</option>
                    <option value="10">10 MB</option>
                    <option value="25">25 MB</option>
                    <option value="50">50 MB</option>
                    <option value="100">100 MB</option>
                  </select>
                </div>
                
                {backupStatus.lastBackup && (
                  <div className="admin-backup-info">
                    <div className="admin-backup-item">
                      <span className="admin-backup-label">Ultimo Backup:</span>
                      <span className="admin-backup-value">
                        {backupStatus.lastBackup.toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <div className="admin-backup-item">
                      <span className="admin-backup-label">Prossimo Backup:</span>
                      <span className="admin-backup-value">
                        {backupStatus.nextBackup?.toLocaleDateString('it-IT') || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lingua e Internazionalizzazione */}
            <div className="admin-settings-card">
              <div className="admin-settings-card-header">
                <h2 className="admin-settings-card-title">
                  <span className="admin-settings-card-icon">🌍</span>
                  Lingua e Formato
                </h2>
              </div>
              
              <div className="admin-settings-section">
                <div className="admin-select-group">
                  <label className="admin-select-label">Lingua</label>
                  <div className="admin-language-selector">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        className={`admin-language-option ${settings.language === lang.code ? 'admin-language-selected' : ''}`}
                        onClick={() => setSettings(prev => ({ ...prev, language: lang.code }))}
                      >
                        <span className="admin-language-flag">{lang.flag}</span>
                        <span className="admin-language-name">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="admin-select-group">
                  <label className="admin-select-label">Fuso Orario</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="admin-select"
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} {tz.offset}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="admin-select-group">
                  <label className="admin-select-label">Formato Data</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="admin-select"
                  >
                    {dateFormats.map(format => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="admin-select-group">
                  <label className="admin-select-label">Formato Ora</label>
                  <div className="admin-radio-group">
                    <label className="admin-radio-label">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="24h"
                        checked={settings.timeFormat === '24h'}
                        onChange={(e) => setSettings(prev => ({ ...prev, timeFormat: e.target.value }))}
                        className="admin-radio-input"
                      />
                      <span className="admin-radio-custom"></span>
                      <span className="admin-radio-text">24 ore (14:30)</span>
                    </label>
                    <label className="admin-radio-label">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="12h"
                        checked={settings.timeFormat === '12h'}
                        onChange={(e) => setSettings(prev => ({ ...prev, timeFormat: e.target.value }))}
                        className="admin-radio-input"
                      />
                      <span className="admin-radio-custom"></span>
                      <span className="admin-radio-text">12 ore (2:30 PM)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sicurezza */}
            <div className="admin-settings-card">
              <div className="admin-settings-card-header">
                <h2 className="admin-settings-card-title">
                  <span className="admin-settings-card-icon">🔒</span>
                  Sicurezza
                </h2>
              </div>
              
              <div className="admin-settings-section">
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Autenticazione a Due Fattori</span>
                    <span className="admin-toggle-description">Richiedi codice aggiuntivo al login</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.security.twoFactorAuth ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('security', 'twoFactorAuth')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Notifiche Login</span>
                    <span className="admin-toggle-description">Ricevi email per nuovi accessi</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.security.loginNotifications ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('security', 'loginNotifications')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-toggle-group">
                  <label className="admin-toggle-label">
                    <span className="admin-toggle-text">Gestione Sessioni</span>
                    <span className="admin-toggle-description">Visualizza e termina sessioni attive</span>
                  </label>
                  <div 
                    className={`admin-toggle ${settings.security.sessionManagement ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                    onClick={() => handleToggle('security', 'sessionManagement')}
                  >
                    <div className="admin-toggle-slider"></div>
                  </div>
                </div>
                
                <div className="admin-select-group">
                  <label className="admin-select-label">Scadenza Password (giorni)</label>
                  <select
                    value={settings.security.passwordExpiry}
                    onChange={(e) => handleValueChange('security', 'passwordExpiry', parseInt(e.target.value))}
                    className="admin-select"
                  >
                    <option value="30">30 giorni</option>
                    <option value="60">60 giorni</option>
                    <option value="90">90 giorni</option>
                    <option value="180">180 giorni</option>
                    <option value="365">365 giorni</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="admin-settings-actions-footer">
          <div className="admin-actions-grid">
            <button
              onClick={resetSettings}
              className="admin-action-btn admin-action-reset"
            >
              <span className="admin-action-icon">🔄</span>
              Reset Impostazioni
            </button>
            
            <button
              onClick={() => navigate('/admin/activity')}
              className="admin-action-btn admin-action-logs"
            >
              <span className="admin-action-icon">📋</span>
              Log Sistema
            </button>
            
            <button
              onClick={() => navigate('/admin/reports')}
              className="admin-action-btn admin-action-reports"
            >
              <span className="admin-action-icon">📊</span>
              Report Sistema
            </button>
            
            <button
              onClick={() => alert('Documentazione in sviluppo...')}
              className="admin-action-btn admin-action-help"
            >
              <span className="admin-action-icon">❓</span>
              Aiuto
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="admin-settings-footer">
        <div className="admin-settings-footer-content">
          <div className="admin-settings-footer-info">
            <p className="admin-settings-footer-text">
              Sistema di Gestione • Versione 2.0 • 
              Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
            </p>
            <p className="admin-settings-footer-subtext">
              Tema: {settings.appearance.theme} • Lingua: {languages.find(l => l.code === settings.language)?.name}
            </p>
          </div>
          
          <div className="admin-settings-footer-status">
            <span className={`admin-status-indicator ${settings.system.autoBackup ? 'admin-status-online' : 'admin-status-offline'}`}></span>
            <span className="admin-status-text">
              {settings.system.autoBackup ? 'Backup attivo' : 'Backup disattivo'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminSettings;