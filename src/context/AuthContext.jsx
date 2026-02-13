// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getTabId, getUserFromStorage, saveUserToStorage, removeUserFromStorage } from '../utils/userStorage';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabId] = useState(() => getTabId());

  useEffect(() => {
    console.log('🔑 AuthContext inizializzato per tab:', tabId);
    
    // 1. Prima controlla se c'è un utente salvato per questa tab
    const savedUser = getUserFromStorage();
    if (savedUser) {
      setUser(savedUser);
      setLoading(false);
    }

    // 2. Poi ascolta i cambiamenti Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Firebase auth state changed per tab', tabId, ':', firebaseUser?.email);
      
      // SE c'è già un utente salvato in questa tab E Firebase dice che c'è un utente DIVERSO
      if (savedUser && firebaseUser && savedUser.uid !== firebaseUser.uid) {
        console.log('⚠️ Conflitto di sessione! Tab', tabId, 'ha', savedUser.email, 'ma Firebase ha', firebaseUser.email);
        
        // FORZA LOGOUT per questa tab se l'utente è diverso
        await signOut(auth);
        setUser(null);
        removeUserFromStorage();
        setLoading(false);
        return;
      }
      
      if (firebaseUser) {
        // Recupera dati completi utente (se necessario)
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          // ... altri campi
        };
        
        setUser(userData);
        saveUserToStorage(userData);
      } else {
        setUser(null);
        removeUserFromStorage();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [tabId]);

  const login = async (email, password) => {
    // Usa il servizio auth esistente
    const { authService } = await import('../firebase/auth');
    return authService.login(email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    removeUserFromStorage();
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};