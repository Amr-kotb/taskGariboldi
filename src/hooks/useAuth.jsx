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

  console.log('🔐 [AuthProvider] Inizializzazione provider');

  // Verifica che Firebase sia disponibile
  useEffect(() => {
    console.log('🔍 [AuthProvider] Verifica configurazione Firebase...');
    
    if (!auth) {
      const errorMsg = '❌ [AuthProvider] Auth service non disponibile';
      console.error(errorMsg);
      setError('Errore di configurazione Firebase: Auth service non trovato');
      setLoading(false);
      return;
    }
    
    console.log('✅ [AuthProvider] Firebase configurato correttamente');
  }, []);

  // Ascolta cambiamenti autenticazione
  useEffect(() => {
    console.log('👂 [AuthProvider] Setup listener autenticazione');
    
    if (!auth) {
      console.error('❌ [AuthProvider] auth non disponibile per listener');
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 [AuthProvider] Firebase auth state changed:', 
        firebaseUser ? `Loggato: ${firebaseUser.email}` : 'Nessun utente');
      
      if (firebaseUser) {
        try {
          // SINCRONIZZA UTENTE CON FIRESTORE
          console.log(`🔄 [AuthProvider] Sincronizzazione utente ${firebaseUser.email}...`);
          
          const syncedUser = await authSyncService.syncUserToFirestore(firebaseUser, {
            // Puoi passare dati aggiuntivi qui se disponibili
          });
          
          console.log('✅ [AuthProvider] Utente sincronizzato con Firestore');
          
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
            // Includi tutti i dati sincronizzati
            ...syncedUser
          };
          
          console.log(`✅ [AuthProvider] Utente caricato:`, {
            email: userObj.email,
            role: userObj.role,
            name: userObj.name
          });
          
          setUser(userObj);
          
        } catch (error) {
          console.error('❌ [AuthProvider] Errore sincronizzazione utente:', error);
          
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
          
          console.log('⚠️ [AuthProvider] Usando dati Authentication (fallback)');
          setUser(userObj);
        }
      } else {
        console.log('🚪 [AuthProvider] Nessun utente loggato');
        setUser(null);
      }
      
      setLoading(false);
      setError('');
    });

    // Cleanup
    return () => {
      console.log('🧹 [AuthProvider] Cleanup listener autenticazione');
      unsubscribe();
    };
  }, []);

  // Login con Firebase
  const signIn = async (email, password) => {
    console.log(`🔑 [AuthProvider] Tentativo login per:`, email);
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(`✅ [AuthProvider] Login Firebase riuscito per:`, email);
      
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
      
      console.log(`❌ [AuthProvider] Login fallito:`, errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Registrazione utente
  const signUp = async (email, password, userData = {}) => {
    console.log(`📝 [AuthProvider] Registrazione utente:`, email);
    setError('');
    
    if (!auth) {
      const err = 'Sistema di autenticazione non disponibile';
      console.error(err);
      setError(err);
      return { success: false, error: err };
    }
    
    try {
      // Crea utente in Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`✅ [AuthProvider] Utente creato in Authentication`);
      
      // Sincronizza con Firestore
      const syncedUser = await authSyncService.syncUserToFirestore(userCredential.user, {
        name: userData.name || email.split('@')[0],
        role: userData.role || 'dipendente',
        department: userData.department || 'Generale'
      });
      
      console.log(`✅ [AuthProvider] Utente sincronizzato con Firestore`);
      
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
      
      console.log(`❌ [AuthProvider] Registrazione fallita:`, errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    console.log(`🚪 [AuthProvider] Richiesta logout`);
    
    if (!auth) {
      console.error('❌ [AuthProvider] auth non disponibile per logout');
      return { success: false, error: 'Sistema di autenticazione non disponibile' };
    }
    
    try {
      await signOut(auth);
      console.log(`✅ [AuthProvider] Logout riuscito`);
      return { success: true };
    } catch (error) {
      const errorMessage = 'Errore durante il logout';
      console.error(`❌ [AuthProvider] Errore logout:`, error);
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
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'dipendente'
  };

  console.log(`🎭 [AuthProvider] Contesto creato:`, {
    user: user ? `${user.name} (${user.role})` : 'null',
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;