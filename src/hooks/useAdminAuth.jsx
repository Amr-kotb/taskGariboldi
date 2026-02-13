import { useState, useCallback, useEffect } from 'react';
import { api } from '../config/api';

const API_BASE_URL = '/.netlify/functions/api';


export function useAdminAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [authInstance, setAuthInstance] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // Inizializza auth instance
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔧 [useAdminAuth] Inizializzazione auth...');
        
        // Prova in ordine:
        // 1. window.firebaseAuth (dal config.js modificato)
        if (window.firebaseAuth) {
          console.log('✅ Auth trovato in window.firebaseAuth');
          setAuthInstance(window.firebaseAuth);
          return;
        }
        
        // 2. Import dinamico
        console.log('🔍 Tentativo import dinamico...');
        try {
          const module = await import('../firebase/config.js');
          if (module && module.auth) {
            console.log('✅ Auth importato dinamicamente');
            setAuthInstance(module.auth);
            
            // Esporlo anche in window per debug
            window.firebaseAuth = module.auth;
            return;
          }
        } catch (importError) {
          console.warn('⚠️ Import dinamico fallito:', importError.message);
        }
        
        // 3. Cerca in altre posizioni
        console.log('🔍 Ricerca auth in altri namespace...');
        const possiblePaths = [
          'auth',
          'firebase.auth',
          'firebase.auth()',
          'window.firebase.auth',
          'window.firebase.auth()'
        ];
        
        for (const path of possiblePaths) {
          try {
            const auth = eval(path);
            if (auth && typeof auth.currentUser !== 'undefined') {
              console.log(`✅ Auth trovato in: ${path}`);
              setAuthInstance(auth);
              window.firebaseAuth = auth;
              return;
            }
          } catch (e) {
            // Continua
          }
        }
        
        console.error('❌ Impossibile trovare auth instance');
        
      } catch (error) {
        console.error('❌ Errore inizializzazione auth:', error);
      }
    };
    
    initializeAuth();
  }, []);

  // Test connessione backend
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        setBackendConnected(response.ok);
      } catch (error) {
        setBackendConnected(false);
      }
    };
    
    testBackendConnection();
  }, []);

  // Helper per ottenere il token - VERSIONE DEFINITIVA
  const getCurrentToken = useCallback(async () => {
    try {
      console.log('🔍 [useAdminAuth] Ottenimento token...');
      
      // 1. PRIMA: token manuale (per debug)
      if (manualToken && manualToken.length > 100) {
        console.log('✅ Usando token manuale salvato');
        return manualToken;
      }
      
      // 2. SECONDA: verifica auth instance
      if (!authInstance) {
        throw new Error('Istanza Firebase auth non disponibile. Ricarica la pagina.');
      }
      
      if (!authInstance.currentUser) {
        throw new Error('Nessun utente autenticato. Effettua il login.');
      }
      
      console.log('👤 Utente corrente:', authInstance.currentUser.email);
      
      // 3. Ottieni il token
      console.log('🔄 Richiesta token a Firebase...');
      const token = await authInstance.currentUser.getIdToken(true); // forceRefresh: true
      console.log('✅ Token ottenuto, lunghezza:', token.length);
      
      // 4. DEBUG: decodifica il token per vedere i claims
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));
        console.log('📋 Decoded token claims:', {
          email: decoded.email,
          user_id: decoded.user_id,
          role: decoded.role || 'NOT SET',
          claims: decoded
        });
      } catch (decodeError) {
        console.warn('⚠️ Impossibile decodificare token:', decodeError.message);
      }
      
      // 5. DEBUG: ottieni anche i claims dal metodo Firebase
      try {
        const idTokenResult = await authInstance.currentUser.getIdTokenResult();
        console.log('🎯 Firebase token claims:', idTokenResult.claims);
        console.log('👑 Ruolo dai claims:', idTokenResult.claims.role || 'NOT SET');
      } catch (claimsError) {
        console.warn('⚠️ Impossibile ottenere claims:', claimsError.message);
      }
      
      return token;
      
    } catch (error) {
      console.error('❌ Errore critico ottenimento token:', error);
      console.error('Stack:', error.stack);
      
      // DEBUG DETTAGLIATO
      console.log('🔍 DEBUG INFO:');
      console.log('- authInstance:', authInstance);
      console.log('- authInstance?.currentUser:', authInstance?.currentUser);
      console.log('- window.firebaseAuth:', window.firebaseAuth);
      console.log('- typeof getIdToken:', typeof authInstance?.currentUser?.getIdToken);
      
      // ISTRUZIONI EMERGENZA
      console.warn('💡 **ISTRUZIONI EMERGENZA:**');
      console.warn('   1. Apri console del browser');
      console.warn('   2. Verifica: console.log(window.firebaseAuth)');
      console.warn('   3. Se esiste, esegui:');
      console.warn('      await window.firebaseAuth.currentUser.getIdToken()');
      console.warn('   4. Copia il token risultante');
      console.warn('   5. Usa setTokenManually(token) nella tua app');
      
      throw new Error(`Errore token: ${error.message}. Vedi console per dettagli.`);
    }
  }, [manualToken, authInstance]);

  // Helper per chiamate API
  const callApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Verifica connessione backend
      if (!backendConnected) {
        throw new Error('Backend non connesso. Avvialo con: cd backend && npm start');
      }
      
      // 2. Ottieni token
      const token = await getCurrentToken();
      
      if (!token || token.length < 100) {
        throw new Error('Token non valido (troppo corto)');
      }
      
      console.log('🔐 [useAdminAuth] Chiamata API con token (primi 30):', token.substring(0, 30) + '...');
      
      // 3. Effettua chiamata
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
      
      console.log(`📡 [useAdminAuth] Risposta ${endpoint}:`, response.status, response.statusText);
      
      // 4. Gestisci errori specifici
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Token non valido o scaduto. Riloggati.');
      }
      
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Accesso negato. Verifica di essere admin.');
      }
      
      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore interno del server backend.');
      }
      
      // 5. Parsa risposta
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Errore ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ API chiamata con successo');
      return data;
      
    } catch (err) {
      let errorMessage = err.message;
      
      // Gestione errori specifici
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = '❌ Impossibile connettersi al backend. Verifica:';
        errorMessage += '\n1. Il backend è in esecuzione? (cd backend && npm start)';
        errorMessage += '\n2. La porta 3001 è libera?';
        errorMessage += '\n3. CORS è configurato correttamente?';
      }
      
      if (err.message.includes('CORS')) {
        errorMessage = '❌ Errore CORS. Verifica le impostazioni del backend.';
      }
      
      console.error('❌ [useAdminAuth] Errore:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCurrentToken, backendConnected]);

  // ============ FUNZIONI API ============

  // Lista tutti gli utenti Auth
  const listAllAuthUsers = useCallback(async () => {
    try {
      console.log('👥 [useAdminAuth] Richiesta lista utenti Auth...');
      const result = await callApi('/api/admin/users');
      console.log(`✅ [useAdminAuth] ${result.data?.length || 0} utenti ricevuti`);
      return result.data;
    } catch (error) {
      console.error('❌ [useAdminAuth] Errore lista utenti Auth:', error);
      throw error;
    }
  }, [callApi]);

  // Crea nuovo utente
  const createUserAsAdmin = useCallback(async (userData) => {
    try {
      console.log('👤 [useAdminAuth] Creazione utente:', userData.email);
      const result = await callApi('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      console.log('✅ [useAdminAuth] Utente creato');
      return result.data;
    } catch (error) {
      console.error('❌ [useAdminAuth] Errore creazione utente:', error);
      throw error;
    }
  }, [callApi]);

  // Aggiorna utente
  const updateUserAsAdmin = useCallback(async (userId, updates) => {
    try {
      console.log(`✏️ [useAdminAuth] Aggiornamento utente ${userId}`);
      const result = await callApi(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      console.log('✅ [useAdminAuth] Utente aggiornato');
      return result.data;
    } catch (error) {
      console.error('❌ [useAdminAuth] Errore aggiornamento utente:', error);
      throw error;
    }
  }, [callApi]);

  // Elimina utente
  const deleteUserAsAdmin = useCallback(async (userId) => {
    try {
      console.log(`🗑️ [useAdminAuth] Eliminazione utente ${userId}`);
      const result = await callApi(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      console.log('✅ [useAdminAuth] Utente eliminato');
      return result;
    } catch (error) {
      console.error('❌ [useAdminAuth] Errore eliminazione utente:', error);
      throw error;
    }
  }, [callApi]);

  // Disabilita/Abilita utente
  const toggleUserStatus = useCallback(async (userId, disabled) => {
    try {
      console.log(`🔧 [useAdminAuth] Cambio stato utente ${userId} a disabled=${disabled}`);
      const result = await callApi(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        body: JSON.stringify({ disabled }),
      });
      console.log('✅ [useAdminAuth] Stato utente cambiato');
      return result;
    } catch (error) {
      console.error('❌ [useAdminAuth] Errore cambio stato utente:', error);
      throw error;
    }
  }, [callApi]);

  // Funzione per impostare manualmente il token
  const setTokenManually = useCallback((token) => {
    if (token && token.length > 100) {
      setManualToken(token);
      console.log('✅ Token manuale impostato, lunghezza:', token.length);
      setError(null);
      return true;
    } else {
      const errorMsg = 'Token non valido. Deve essere lungo almeno 100 caratteri.';
      setError(errorMsg);
      return false;
    }
  }, []);

  // Test connessione backend
  const testBackendConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const connected = response.ok;
      setBackendConnected(connected);
      return { connected };
    } catch (error) {
      setBackendConnected(false);
      return { connected: false, error: error.message };
    }
  }, []);

  // Debug funzione - ottieni info token
  const debugTokenInfo = useCallback(async () => {
    try {
      if (!authInstance?.currentUser) {
        return { error: 'Nessun utente autenticato' };
      }
      
      const token = await authInstance.currentUser.getIdToken();
      const idTokenResult = await authInstance.currentUser.getIdTokenResult();
      
      return {
        email: authInstance.currentUser.email,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 50) + '...',
        claims: idTokenResult.claims,
        role: idTokenResult.claims.role || 'NOT SET',
        backendConnected
      };
    } catch (error) {
      return { error: error.message };
    }
  }, [authInstance, backendConnected]);

  return {
    loading,
    error,
    listAllAuthUsers,
    createUserAsAdmin,
    updateUserAsAdmin,
    deleteUserAsAdmin,
    toggleUserStatus,
    setTokenManually,
    testBackendConnection,
    debugTokenInfo,
    backendConnected,
    authInstance: authInstance,
    clearError: () => setError(null),
  };
} 