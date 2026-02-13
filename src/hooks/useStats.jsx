// src/hooks/useStats.jsx
import { useState, useCallback } from 'react';
import { 
  collection, query, where, getDocs,
  getCountFromServer 
} from 'firebase/firestore';
import { db } from '../services/firebase/config.js';

export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica statistiche utente
  const loadUserStats = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('👤 [useStats] Caricamento statistiche utente:', userId);
      
      // Carica task dell'utente
      const tasksCollection = collection(db, 'tasks');
      const tasksQuery = query(
        tasksCollection,
        where('assignedTo', '==', userId),
        where('deleted', '==', false)
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      const userTasks = tasksSnapshot.docs.map(doc => doc.data());
      
      // Calcola statistiche
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(t => t.status === 'completato').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'in corso').length;
      const assignedTasks = userTasks.filter(t => t.status === 'assegnato').length;
      
      // Task in ritardo
      const overdueTasks = userTasks.filter(task => {
        if (!task.dueDate || task.status === 'completato') return false;
        try {
          const due = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
          return due < new Date();
        } catch {
          return false;
        }
      }).length;
      
      // Task completati questa settimana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const completedThisWeek = userTasks.filter(t => {
        if (t.status !== 'completato') return false;
        if (!t.completedAt) return false;
        try {
          const completedDate = t.completedAt.toDate ? t.completedAt.toDate() : new Date(t.completedAt);
          return completedDate > oneWeekAgo;
        } catch {
          return false;
        }
      }).length;
      
      const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;
      
      const userStats = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        assignedTasks,
        overdueTasks,
        completedThisWeek,
        completionRate
      };
      
      setStats(userStats);
      return userStats;
      
    } catch (err) {
      console.error('❌ [useStats] Errore caricamento statistiche utente:', err);
      setError(err.message);
      
      // Fallback con dati mock
      const mockStats = {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        assignedTasks: 0,
        overdueTasks: 0,
        completedThisWeek: 0,
        completionRate: 0
      };
      
      return mockStats;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica statistiche dashboard (admin)
  const loadDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 [useStats] Caricamento statistiche dashboard');
      
      // Task totali
      const tasksCollection = collection(db, 'tasks');
      const totalTasksSnapshot = await getCountFromServer(tasksCollection);
      const totalTasks = totalTasksSnapshot.data().count;
      
      // Task completati
      const completedQuery = query(tasksCollection, where('status', '==', 'completato'));
      const completedSnapshot = await getCountFromServer(completedQuery);
      const completedTasks = completedSnapshot.data().count;
      
      // Task in corso
      const inProgressQuery = query(tasksCollection, where('status', '==', 'in corso'));
      const inProgressSnapshot = await getCountFromServer(inProgressQuery);
      const inProgressTasks = inProgressSnapshot.data().count;
      
      // Utenti totali
      const usersCollection = collection(db, 'users');
      const totalUsersSnapshot = await getCountFromServer(usersCollection);
      const totalUsers = totalUsersSnapshot.data().count;
      
      const dashboardStats = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        totalUsers,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
      
      setStats(dashboardStats);
      return dashboardStats;
    } catch (err) {
      console.error('❌ [useStats] Errore caricamento statistiche dashboard:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    loadDashboardStats,
    loadUserStats
  };
}