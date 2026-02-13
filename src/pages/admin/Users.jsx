import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useAdminAuth } from '../../hooks/useAdminAuth.jsx'; // Importa il nuovo hook
import { ROLES, DEPARTMENTS, getRoleName, getDepartmentName } from '../../constants/roles.js';
import { api } from '../../config/api';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { 
    users: syncedUsers, 
    loading: usersLoading, 
    error: usersError, 
    loadUsers, 
    deactivateUser,
    updateUser
  } = useUsers();
  
  // NUOVO: Hook per admin functions
  const {
    loading: adminLoading,
    error: adminError,
    listAllAuthUsers,
    createUserAsAdmin,
    updateUserAsAdmin,
    deleteUserAsAdmin,
    toggleUserStatus,
    clearError
  } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState('synced'); // 'synced' o 'auth'
  const [authUsers, setAuthUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.DIPENDENTE,
    department: DEPARTMENTS.GENERALE
  });
  const [formErrors, setFormErrors] = useState({});
  const [backendStatus, setBackendStatus] = useState('checking');

  // Test connessione backend
  useEffect(() => {
    const checkBackend = async () => {
      try {
       const health = await api.health();


        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('error');
        console.warn('Backend non raggiungibile:', error.message);
      }
    };
    
    checkBackend();
  }, []);

  // Carica utenti sincronizzati
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      console.log('🔄 [AdminUsers] Caricamento utenti sincronizzati...');
      loadUsers();
    }
  }, [currentUser]);

  // Carica tutti gli utenti Auth (nuova funzione)
  const loadAuthUsers = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
      console.log('🔄 [AdminUsers] Caricamento tutti gli utenti Auth...');
      const users = await listAllAuthUsers();
      setAuthUsers(users);
    } catch (error) {
      console.error('❌ [AdminUsers] Errore caricamento utenti Auth:', error);
      alert(`Errore: ${error.message}\n\nAssicurati di essere loggato come admin.`);
    }
  };

  // Cambia tab
  useEffect(() => {
    if (activeTab === 'auth' && authUsers.length === 0) {
      loadAuthUsers();
    }
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearError();
  };

  // Crea nuovo utente
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validazione
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Nome obbligatorio';
    if (!formData.email.trim()) errors.email = 'Email obbligatoria';
    if (!formData.password) errors.password = 'Password obbligatoria';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Le password non corrispondono';
    }
    if (formData.password.length < 6) {
      errors.password = 'La password deve avere almeno 6 caratteri';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      // Crea utente tramite backend admin
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        department: formData.department
      };
      
      const result = await createUserAsAdmin(userData);
      const response = await fetch('/.netlify/functions/api/health');

      alert(`✅ Utente ${formData.email} creato con successo!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\n⚠️ Ricorda di comunicare la password all'utente!`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ROLES.DIPENDENTE,
        department: DEPARTMENTS.GENERALE
      });
      setFormErrors({});
      setShowCreateModal(false);
      
      // Ricarica liste
      if (activeTab === 'auth') {
        loadAuthUsers();
      }
      loadUsers();
      
    } catch (error) {
      console.error('❌ [AdminUsers] Errore creazione utente:', error);
      // L'errore è già gestito dall'hook
    }
  };

  // Formattazione date
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/D';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/D';
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/D';
    }
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/D';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/D';
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
  };

  const loading = usersLoading || adminLoading;
  const error = usersError || adminError;

  // Verifica permessi admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '500px',
        margin: '40px auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚫</div>
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Accesso Negato</h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Solo gli amministratori possono accedere alla gestione utenti.
        </p>
      </div>
    );
  }

  // Verifica connessione backend
  if (backendStatus === 'error') {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        margin: '40px auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Backend Non Raggiungibile</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Il server admin non è in esecuzione. Avvialo con:
        </p>
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          cd backend<br />
          npm start
        </div>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Assicurati che il server backend sia in esecuzione e ricarica la pagina.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '10px' }}>
              👥 Gestione Utenti Completa
            </h1>
            <p style={{ color: '#6b7280' }}>
              Gestisci tutti gli utenti del sistema, sincronizzati e non.
            </p>
          </div>
          <div style={{
            padding: '8px 16px',
            backgroundColor: backendStatus === 'connected' ? '#d1fae5' : '#fef3c7',
            color: backendStatus === 'connected' ? '#065f46' : '#92400e',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendStatus === 'connected' ? '#10b981' : '#f59e0b',
              animation: backendStatus === 'connected' ? 'pulse 2s infinite' : 'none'
            }}></div>
            Backend: {backendStatus === 'connected' ? 'Connesso' : 'Controllo...'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => handleTabChange('synced')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'synced' ? '#3b82f6' : 'transparent',
            color: activeTab === 'synced' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🔄</span>
          Utenti Sincronizzati ({syncedUsers.length})
        </button>
        <button
          onClick={() => handleTabChange('auth')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'auth' ? '#3b82f6' : 'transparent',
            color: activeTab === 'auth' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>👤</span>
          Tutti gli Utenti Auth ({authUsers.length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              marginLeft: 'auto',
              padding: '5px 10px',
              backgroundColor: 'transparent',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#1f2937' }}>
            {activeTab === 'synced' 
              ? `${syncedUsers.length} Utenti Sincronizzati` 
              : `${authUsers.length} Utenti Auth Totali`}
          </h3>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            {activeTab === 'synced' 
              ? `Admin: ${syncedUsers.filter(u => u.role === 'admin').length} • Dipendenti: ${syncedUsers.filter(u => u.role === 'dipendente').length}`
              : 'Utenti registrati in Firebase Authentication'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={activeTab === 'auth' ? loadAuthUsers : loadUsers}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <span>↻</span>
            Ricarica
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <span>➕</span>
            Nuovo Utente
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          backgroundColor: 'white',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#6b7280' }}>
              {activeTab === 'synced' ? 'Caricamento utenti sincronizzati...' : 'Caricamento utenti Auth...'}
            </p>
          </div>
        </div>
      )}

      {/* Tabella */}
      {!loading && (
        activeTab === 'synced' ? (
          // Tabella utenti sincronizzati (esistente)
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {syncedUsers.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
                <p style={{ color: '#6b7280', marginBottom: '10px' }}>
                  Nessun utente sincronizzato trovato
                </p>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  Gli utenti appariranno qui dopo il primo login.
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Utente</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Ruolo</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Dipartimento</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Ultimo Accesso</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Stato</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {syncedUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: user.role === 'admin' ? '#3b82f6' : '#10b981',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#1f2937' }}>
                              {user.name || 'N/D'}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '14px' }}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 10px',
                          backgroundColor: user.role === 'admin' ? '#dbeafe' : '#d1fae5',
                          color: user.role === 'admin' ? '#1d4ed8' : '#065f46',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#6b7280' }}>
                        {getDepartmentName(user.department)}
                      </td>
                      <td style={{ padding: '15px', color: '#6b7280', fontSize: '14px' }}>
                        {user.lastLogin ? formatDateTime(user.lastLogin) : 'Mai'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 10px',
                          backgroundColor: user.isActive === true ? '#d1fae5' : '#fee2e2',
                          color: user.isActive === true ? '#065f46' : '#dc2626',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {user.isActive === true ? 'Attivo' : 'Disattivato'}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setEditingUser(user)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <span>✏️</span>
                            Dettagli
                          </button>
                          {user.id !== currentUser?.uid && user.isActive === true && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Disattivare ${user.name || user.email}?`)) {
                                  deactivateUser(user.id, user.name);
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>🗑️</span>
                              Disattiva
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          // Tabella tutti gli utenti Auth (nuova)
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {authUsers.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>👤</div>
                <p style={{ color: '#6b7280', marginBottom: '10px' }}>
                  Nessun utente trovato in Firebase Auth
                </p>
                <button
                  onClick={loadAuthUsers}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Ricarica
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Utente</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Stato</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Creato</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Ultimo Accesso</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {authUsers.map((user) => {
                    const isSynced = syncedUsers.some(su => su.email === user.email);
                    const isCurrentUser = user.uid === currentUser.uid;
                    
                    return (
                      <tr key={user.uid}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: isSynced ? '#10b981' : '#6b7280',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '16px'
                            }}>
                              {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500', color: '#1f2937' }}>
                                {user.displayName || 'N/D'}
                                {isSynced && (
                                  <span style={{
                                    marginLeft: '8px',
                                    fontSize: '10px',
                                    backgroundColor: '#d1fae5',
                                    color: '#065f46',
                                    padding: '2px 6px',
                                    borderRadius: '10px'
                                  }}>
                                    Sincronizzato
                                  </span>
                                )}
                              </div>
                              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                                UID: {user.uid.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '15px', color: '#6b7280', fontSize: '14px' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            padding: '5px 10px',
                            backgroundColor: user.disabled ? '#fee2e2' : '#d1fae5',
                            color: user.disabled ? '#dc2626' : '#065f46',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {user.disabled ? 'Disabilitato' : 'Attivo'}
                          </span>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                            {user.emailVerified ? 'Email verificata' : 'Email non verificata'}
                          </div>
                        </td>
                        <td style={{ padding: '15px', color: '#6b7280', fontSize: '14px' }}>
                          {user.metadata?.creationTime ? formatDate(user.metadata.creationTime) : 'N/D'}
                        </td>
                        <td style={{ padding: '15px', color: '#6b7280', fontSize: '14px' }}>
                          {user.metadata?.lastSignInTime ? formatDateTime(user.metadata.lastSignInTime) : 'Mai'}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {!isCurrentUser && (
                              <button
                                onClick={async () => {
                                  if (window.confirm(`${user.disabled ? 'Riabilitare' : 'Disabilitare'} ${user.email}?`)) {
                                    try {
                                      await toggleUserStatus(user.uid, !user.disabled);
                                      loadAuthUsers();
                                    } catch (error) {
                                      alert(`Errore: ${error.message}`);
                                    }
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: user.disabled ? '#d1fae5' : '#fee2e2',
                                  color: user.disabled ? '#065f46' : '#dc2626',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                {user.disabled ? 'Riabilita' : 'Disabilita'}
                              </button>
                            )}
                            {!isCurrentUser && (
                              <button
                                onClick={() => setShowConfirmDelete(user)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fca5a5',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Elimina
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {/* Modal Creazione Utente */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setShowCreateModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
              👤 Crea Nuovo Utente
            </h3>
            
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#4b5563', fontSize: '14px' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${formErrors.name ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Nome gariboldi"
                />
                {formErrors.name && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.name}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#4b5563', fontSize: '14px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${formErrors.email ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="nome@gariboldi.com"
                />
                {formErrors.email && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.email}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#4b5563', fontSize: '14px' }}>
                  Ruolo *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value={ROLES.DIPENDENTE}>Dipendente</option>
                  <option value={ROLES.ADMIN}>Amministratore</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#4b5563', fontSize: '14px' }}>
                  Dipartimento
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  {Object.values(DEPARTMENTS).map(dept => (
                    <option key={dept} value={dept}>
                      {getDepartmentName(dept)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#4b5563', fontSize: '14px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${formErrors.password ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Minimo 6 caratteri"
                />
                {formErrors.password && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.password}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#4b5563', fontSize: '14px' }}>
                  Conferma Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${formErrors.confirmPassword ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  placeholder="Ripeti la password"
                />
                {formErrors.confirmPassword && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.confirmPassword}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: adminLoading ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: adminLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: adminLoading ? 0.7 : 1
                  }}
                >
                  {adminLoading ? 'Creazione...' : 'Crea Utente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {showConfirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setShowConfirmDelete(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>
              ⚠️ Eliminazione Definitiva
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '25px' }}>
              Stai per eliminare definitivamente l'utente:<br />
              <strong>{showConfirmDelete.email}</strong><br /><br />
              Questa azione non può essere annullata!
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowConfirmDelete(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteUserAsAdmin(showConfirmDelete.uid);
                    alert(`✅ Utente ${showConfirmDelete.email} eliminato!`);
                    setShowConfirmDelete(null);
                    loadAuthUsers();
                  } catch (error) {
                    alert(`❌ Errore: ${error.message}`);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Elimina Definitivamente
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
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;