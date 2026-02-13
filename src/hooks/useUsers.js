import { useState, useContext, createContext } from 'react';
import { useAuth } from './useAuth';
import * as userApi from '../services/api/users';

// Creazione del context
const UsersContext = createContext();

/**
 * Custom hook per gestione utenti
 * Fornisce funzioni per gestire utenti, dipendenti e profili
 */
export function useUsers() {
  return useContext(UsersContext);
}

export function UsersProvider({ children }) {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({});

  /**
   * Carica tutti gli utenti (admin only)
   */
  const loadUsers = async () => {
    if (!user || user.role !== 'admin') {
      setError('Accesso negato: solo admin può vedere tutti gli utenti');
      return { success: false, error: 'Accesso negato' };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await userApi.getAllUsers();
      
      if (result.success) {
        setUsers(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error loading users:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carica solo i dipendenti
   */
  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      const result = await userApi.getEmployees();
      
      if (result.success) {
        setEmployees(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error loading employees:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carica un utente specifico
   */
  const loadUserById = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await userApi.getUserById(userId);
      
      if (result.success) {
        setSelectedUser(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error loading user:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiorna un utente
   */
  const updateUser = async (userId, updates) => {
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Solo admin può aggiornare utenti' };
    }
    
    try {
      setLoading(true);
      
      const result = await userApi.updateUser(userId, updates);
      
      if (result.success) {
        // Aggiorna nell'array users
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, ...updates } : u
        ));
        
        // Aggiorna nell'array employees se è un dipendente
        if (updates.role === 'dipendente' || !updates.role) {
          setEmployees(prev => prev.map(e => 
            e.id === userId ? { ...e, ...updates } : e
          ));
        }
        
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error updating user:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aggiorna profilo utente corrente
   */
  const updateProfile = async (profileData) => {
    if (!user) {
      return { success: false, error: 'Utente non autenticato' };
    }
    
    try {
      setLoading(true);
      
      const result = await userApi.updateProfile(user.uid, profileData);
      
      if (result.success) {
        // Aggiorna utente selezionato
        setSelectedUser(prev => prev ? { ...prev, ...profileData } : null);
        
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error updating profile:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cambia password utente corrente
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) {
      return { success: false, error: 'Utente non autenticato' };
    }
    
    try {
      setLoading(true);
      
      const result = await userApi.changePassword(
        user.uid, 
        currentPassword, 
        newPassword
      );
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error changing password:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ottieni statistiche per un utente
   */
  const getUserStatistics = async (userId) => {
    try {
      setLoading(true);
      
      const result = await userApi.getUserStatistics(userId);
      
      if (result.success) {
        // Cache delle statistiche
        setUserStats(prev => ({
          ...prev,
          [userId]: result.data
        }));
        
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error getting user statistics:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerca utenti
   */
  const searchUsers = async (query) => {
    try {
      setLoading(true);
      
      const result = await userApi.searchUsers(query);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error searching users:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Esporta utenti in CSV
   */
  const exportUsers = async (usersToExport = []) => {
    try {
      setLoading(true);
      
      const result = await userApi.exportUsersToCSV(usersToExport);
      
      if (result.success) {
        return { success: true, data: result.data, filename: result.filename };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [useUsers] Error exporting users:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtra utenti per ruolo
   */
  const getUsersByRole = (role) => {
    return users.filter(u => u.role === role);
  };

  /**
   * Filtra utenti per dipartimento
   */
  const getUsersByDepartment = (department) => {
    return users.filter(u => u.department === department);
  };

  /**
   * Ottieni utente per ID (dalla cache locale)
   */
  const getUserFromCache = (userId) => {
    return users.find(u => u.id === userId) || 
           employees.find(e => e.id === userId);
  };

  /**
   * Resetta errori
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    // State
    users,
    employees,
    loading,
    error,
    selectedUser,
    userStats,
    
    // Actions
    loadUsers,
    loadEmployees,
    loadUserById,
    updateUser,
    updateProfile,
    changePassword,
    getUserStatistics,
    searchUsers,
    exportUsers,
    
    // Utility functions
    getUsersByRole,
    getUsersByDepartment,
    getUserFromCache,
    clearError,
    setSelectedUser
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

// Hook semplificato per uso rapido
export function useEmployees() {
  const { employees, loadEmployees, loading, error } = useUsers();
  
  return {
    employees,
    loadEmployees,
    loading,
    error,
    count: employees.length
  };
}

// Hook per gestione profilo corrente
export function useCurrentUserProfile() {
  const { user } = useAuth();
  const { selectedUser, loadUserById, updateProfile, loading, error } = useUsers();
  
  const loadProfile = () => {
    if (user) {
      return loadUserById(user.uid);
    }
    return Promise.resolve({ success: false, error: 'No user' });
  };
  
  return {
    profile: selectedUser,
    loadProfile,
    updateProfile,
    loading,
    error
  };
}

export default useUsers;