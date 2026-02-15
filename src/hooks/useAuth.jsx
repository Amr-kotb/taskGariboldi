import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase/config.js';
import { authSyncService } from '../services/firebase/firestore.js';

console.log('🔐 [useAuth] Import Firebase config');

// 🔴 FUNZIONE PER ISOLARE LE TAB
const forceSessionIsolation = () => {
  // Genera un ID univoco per questa tab/scheda
  const tabId = sessionStorage.getItem('tabId') || Math.random().toString(36).substring(2);
  sessionStorage.setItem('tabId', tabId);
  
  // Pulisci localStorage all'avvio di ogni nuova tab
  if (!sessionStorage.getItem('authInitialized')) {
    console.log(`🧹 [Tab ${tabId}] Nuova tab rilevata, pulizia localStorage...`);
    
    // Rimuovi TUTTI i dati Firebase da localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('firebase') || key.includes('auth') || key.includes('user'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log(`   🗑️ Rimossa chiave: ${key}`);
      localStorage.removeItem(key);
    });
    
    sessionStorage.setItem('authInitialized', 'true');
    console.log(`✅ [Tab ${tabId}] Pulizia completata, chiavi rimosse: ${keysToRemove.length}`);
  }
  
  return tabId;
};

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabId] = useState(() => forceSessionIsolation());

  console.log(`🔐 [AuthProvider] Inizializzazione provider per tab: ${tabId}`);

  // Verifica che Firebase sia disponibile
  useEffect(() => {
    console.log(`🔍 [AuthProvider-${tabId}] Verifica configurazione Firebase...`);
    
    if (!auth) {
      const errorMsg = '❌ [AuthProvider] Auth service non disponibile';
      console.error(errorMsg);
      setError('Errore di configurazione Firebase: Auth service non trovato');
      setLoading(false);
      return;
    }
    
    console.log(`✅ [AuthProvider-${tabId}] Firebase configurato correttamente`);
  }, [tabId]);

  // Ascolta cambiamenti autenticazione
  useEffect(() => {
    console.log(`👂 [AuthProvider-${tabId}] Setup listener autenticazione`);
    
    if (!auth) {
      console.error(`❌ [AuthProvider-${tabId}] auth non disponibile per listener`);
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(`🔄 [AuthProvider-${tabId}] Firebase auth state changed:`, 
        firebaseUser ? `Loggato: ${firebaseUser.email}` : 'Nessun utente');
      
      if (firebaseUser) {
        try {
          // SINCRONIZZA UTENTE CON FIRESTORE
          console.log(`🔄 [AuthProvider-${tabId}] Sincronizzazione utente ${firebaseUser.email}...`);
          
          const syncedUser = await authSyncService.syncUserToFirestore(firebaseUser, {});
          
          console.log(`✅ [AuthProvider-${tabId}] Utente sincronizzato con Firestore`);
          
          // Crea oggetto utente completo con dati sincronizzati
          const userObj = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: syncedUser?.name || firebaseUser.email.split('@')[0],
            role: syncedUser?.role || 'dipendente',
            department: syncedUser?.department || 'Generale',
            photoURL: firebaseUser.photoURL || '',
            isActive: syncedUser?.isActive !== false,
            lastLogin: syncedUser?.lastLogin || new Date().toISOString(),
            createdAt: syncedUser?.createdAt,
            ...syncedUser
          };
          
          console.log(`✅ [AuthProvider-${tabId}] Utente caricato:`, {
            email: userObj.email,
            role: userObj.role,
            name: userObj.name
          });
          
          // Salva l'ID della tab corrente per questa sessione
          sessionStorage.setItem('currentUser', userObj.uid);
          setUser(userObj);
          
        } catch (error) {
          console.error(`❌ [AuthProvider-${tabId}] Errore sincronizzazione utente:`, error);
          
          // Fallback: usa solo dati Authentication
          const userObj = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email.split('@')[0],
            role: 'dipendente',
            department: 'Generale',
            photoURL: firebaseUser.photoURL || '',
            isActive: true,
            lastLogin: new Date().toISOString()
          };
          
          console.log(`⚠️ [AuthProvider-${tabId}] Usando dati Authentication (fallback)`);
          sessionStorage.setItem('currentUser', userObj.uid);
          setUser(userObj);
        }
      } else {
        console.log(`🚪 [AuthProvider-${tabId}] Nessun utente loggato`);
        sessionStorage.removeItem('currentUser');
        setUser(null);
      }
      
      setLoading(false);
      setError('');
    });

    return () => {
      console.log(`🧹 [AuthProvider-${tabId}] Cleanup listener autenticazione`);
      unsubscribe();
    };
  }, [tabId]);

  // Login con Firebase
  const signIn = async (email, password) => {
    console.log(`🔑 [AuthProvider-${tabId}] Tentativo login per:`, email);
    setError('');
    
    if (!auth) {
      const err = 'Sistema di autenticazione non disponibile';
      console.error(err);
      setError(err);
      return { success: false, error: err };
    }
    
    if (!email || !password) {
      const err = 'Inserisci email e password';
      setError(err);
      return { success: false, error: err };
    }
    
    try {
      // 🔴 PULISCI TUTTO PRIMA DEL LOGIN
      console.log(`🧹 [AuthProvider-${tabId}] Pulizia localStorage prima del login...`);
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('auth') || key.includes('user'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`✅ [AuthProvider-${tabId}] Pulite ${keysToRemove.length} chiavi`);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(`✅ [AuthProvider-${tabId}] Login Firebase riuscito per:`, email);
      
      return { 
        success: true, 
        user: userCredential.user,
        email: email
      };
      
    } catch (error) {
      let errorMessage = 'Errore di autenticazione';
      
      switch (error.code) {
        case 'auth/invalid-email': errorMessage = 'Email non valida'; break;
        case 'auth/user-not-found': errorMessage = 'Utente non trovato'; break;
        case 'auth/wrong-password': errorMessage = 'Password errata'; break;
        case 'auth/too-many-requests': errorMessage = 'Troppi tentativi falliti. Riprova più tardi.'; break;
        case 'auth/user-disabled': errorMessage = 'Account disabilitato'; break;
        case 'auth/network-request-failed': errorMessage = 'Errore di rete. Controlla la connessione.'; break;
        default: errorMessage = error.message || 'Errore sconosciuto';
      }
      
      console.log(`❌ [AuthProvider-${tabId}] Login fallito:`, errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Registrazione utente
  const signUp = async (email, password, userData = {}) => {
    console.log(`📝 [AuthProvider-${tabId}] Registrazione utente:`, email);
    setError('');
    
    if (!auth) {
      const err = 'Sistema di autenticazione non disponibile';
      console.error(err);
      setError(err);
      return { success: false, error: err };
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`✅ [AuthProvider-${tabId}] Utente creato in Authentication`);
      
      const syncedUser = await authSyncService.syncUserToFirestore(userCredential.user, {
        name: userData.name || email.split('@')[0],
        role: userData.role || 'dipendente',
        department: userData.department || 'Generale'
      });
      
      console.log(`✅ [AuthProvider-${tabId}] Utente sincronizzato con Firestore`);
      
      return { 
        success: true, 
        user: userCredential.user,
        firestoreUser: syncedUser,
        email: email
      };
      
    } catch (error) {
      let errorMessage = 'Errore durante la registrazione';
      
      switch (error.code) {
        case 'auth/email-already-in-use': errorMessage = 'Email già registrata'; break;
        case 'auth/invalid-email': errorMessage = 'Email non valida'; break;
        case 'auth/weak-password': errorMessage = 'Password troppo debole'; break;
        case 'auth/network-request-failed': errorMessage = 'Errore di rete'; break;
        default: errorMessage = error.message || 'Errore sconosciuto';
      }
      
      console.log(`❌ [AuthProvider-${tabId}] Registrazione fallita:`, errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    console.log(`🚪 [AuthProvider-${tabId}] Richiesta logout`);
    
    try {
      await signOut(auth);
      
      // Pulisci localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('auth') || key.includes('user'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Pulisci sessionStorage (ma mantieni tabId)
      const currentTabId = sessionStorage.getItem('tabId');
      sessionStorage.clear();
      if (currentTabId) {
        sessionStorage.setItem('tabId', currentTabId);
      }
      
      console.log(`✅ [AuthProvider-${tabId}] Logout riuscito, pulite ${keysToRemove.length} chiavi`);
      
      // FORZA il refresh della pagina
      window.location.href = '/login';
      
      return { success: true };
    } catch (error) {
      const errorMessage = 'Errore durante il logout';
      console.error(`❌ [AuthProvider-${tabId}] Errore logout:`, error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'administrator' || user?.role === 'amministratore' || user?.role === 'superadmin',
    isEmployee: user?.role === 'dipendente' || user?.role === 'employee' || user?.role === 'user' || user?.role === 'utente',
    tabId
  };

  console.log(`🎭 [AuthProvider-${tabId}] Contesto creato:`, {
    user: user ? `${user.name} (${user.role})` : 'null',
    loading,
    isAuthenticated: !!user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;