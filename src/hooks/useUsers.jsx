// src/hooks/useUsers.jsx
import { useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase/config.js';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funzione diretta per caricare utenti da Firestore
  const loadUsersDirect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('👥 [useUsers] Caricamento utenti da Firestore...');
      
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      const usersList = [];
      usersSnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ [useUsers] ${usersList.length} utenti caricati`);
      setUsers(usersList);
      return usersList;
      
    } catch (err) {
      console.error('❌ [useUsers] Errore Firestore:', err);
      
      // Fallback: dati mock per sviluppo
      const mockUsers = [
        { 
          id: '1', 
          name: 'Andrea Rossi', 
          email: 'andrea@azienda.com', 
          department: 'Sviluppo',
          role: 'dipendente',
          isActive: true
        },
        { 
          id: '2', 
          name: 'Leonardo Bianchi', 
          email: 'leonardo@azienda.com', 
          department: 'Design',
          role: 'dipendente',
          isActive: true
        },
        { 
          id: '3', 
          name: 'Stefano Verdi', 
          email: 'stefano@azienda.com', 
          department: 'Marketing',
          role: 'dipendente',
          isActive: true
        },
        { 
          id: '4', 
          name: 'Domenico Neri', 
          email: 'domenico@azienda.com', 
          department: 'Vendite',
          role: 'dipendente',
          isActive: true
        }
      ];
      
      console.log('⚠️ [useUsers] Usando dati mock per sviluppo');
      setUsers(mockUsers);
      return mockUsers;
      
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica tutti gli utenti sincronizzati
  const loadUsers = useCallback(async (filters = {}) => {
    return loadUsersDirect();
  }, [loadUsersDirect]);

  // Carica solo dipendenti
  const loadEmployees = useCallback(async () => {
    const allUsers = await loadUsersDirect();
    const employees = allUsers.filter(user => user.role === 'dipendente');
    return employees;
  }, [loadUsersDirect]);

  // Mock delle altre funzioni
  const updateUser = useCallback(async (userId, updates) => {
    console.log('✏️ [useUsers] Mock update user:', userId, updates);
    return { success: true };
  }, []);

  const deactivateUser = useCallback(async (userId) => {
    console.log('🗑️ [useUsers] Mock deactivate user:', userId);
    return { success: true };
  }, []);

  return {  
    users,
    loading,
    error,
    loadUsers,
    loadEmployees,
    updateUser,
    deactivateUser,
    refresh: loadUsersDirect
  };
}