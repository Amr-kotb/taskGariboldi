import { useState, useEffect, useCallback } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, serverTimestamp, writeBatch,
  onSnapshot  // 🔥 IMPORTANTE: aggiunto per real-time
} from 'firebase/firestore';
import { db } from '../services/firebase/config.js';

// Import condizionale di storageService
let storageService = null;
try {
  // Prova a importare, se non esiste sarà null
  const storageModule = require('../services/firebase/storage.js');
  storageService = storageModule.storageService || storageModule.default;
} catch (error) {
  console.log('ℹ️ Storage service non disponibile, funzionalità allegati limitata');
}

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [storageAvailable, setStorageAvailable] = useState(!!storageService);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Carica tutti i task (admin) - NON eliminati
  const loadAllTasks = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 [useTasks] Caricamento task con filtri:', filters);

      let q = query(collection(db, 'tasks'));

      const conditions = [where('deleted', '==', false)];

      if (filters.status) conditions.push(where('status', '==', filters.status));
      if (filters.priority) conditions.push(where('priority', '==', filters.priority));
      if (filters.assignedTo) conditions.push(where('assignedTo', '==', filters.assignedTo));

      conditions.push(orderBy('createdAt', 'desc'));
      q = query(q, ...conditions);

      const snapshot = await getDocs(q);
      const tasksList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));

      setTasks(tasksList);
      setLastUpdate(new Date());
      return tasksList;
    } catch (err) {
      console.error('❌ [useTasks] Errore caricamento task:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 FUNZIONE REAL-TIME PER I TASK DELL'UTENTE
  const subscribeToUserTasks = useCallback((userId, onUpdate) => {
    if (!userId) {
      console.warn('⚠️ subscribeToUserTasks chiamato senza userId');
      return () => {};
    }

    console.log('🔌 [useTasks] ATTIVAZIONE REAL-TIME per utente:', userId);

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('assignedTo', '==', userId),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    // Sottoscrizione real-time - SI AGGIORNA AUTOMATICAMENTE!
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));

      console.log('🔄 [useTasks] REAL-TIME: Task aggiornati!', updatedTasks.length);
      setTasks(updatedTasks);
      setLastUpdate(new Date());
      
      if (onUpdate) onUpdate(updatedTasks);
    }, (error) => {
      console.error('❌ [useTasks] Errore real-time:', error);
      setError(error.message);
    });

    return unsubscribe; // Restituisce la funzione per pulire
  }, []);

  // 🔥 FUNZIONE REAL-TIME PER ADMIN (TUTTI I TASK)
  const subscribeToAllTasks = useCallback((filters = {}, onUpdate) => {
    console.log('🔌 [useTasks] ATTIVAZIONE REAL-TIME per ADMIN');

    const tasksRef = collection(db, 'tasks');
    let conditions = [where('deleted', '==', false)];

    if (filters.status) conditions.push(where('status', '==', filters.status));
    if (filters.priority) conditions.push(where('priority', '==', filters.priority));
    if (filters.assignedTo) conditions.push(where('assignedTo', '==', filters.assignedTo));

    conditions.push(orderBy('createdAt', 'desc'));
    const q = query(tasksRef, ...conditions);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));

      console.log('🔄 [useTasks] REAL-TIME ADMIN: Task aggiornati!', updatedTasks.length);
      setTasks(updatedTasks);
      setLastUpdate(new Date());
      
      if (onUpdate) onUpdate(updatedTasks);
    }, (error) => {
      console.error('❌ [useTasks] Errore real-time admin:', error);
      setError(error.message);
    });

    return unsubscribe;
  }, []);

  // Crea nuovo task - VERSIONE COMPATIBILE
  const createTask = useCallback(async (taskData, attachments = []) => {
    console.log('➕ [useTasks] Creazione task con', attachments.length, 'allegati');

    try {
      // 1. Prima crea il task base
      const taskWithMetadata = {
        ...taskData,
        attachments: [], // Inizializza campo allegati
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false,
        status: taskData.status || 'assegnato',
        progress: taskData.progress || 0
      };

      // 2. Crea il task in Firestore per ottenere ID
      const docRef = await addDoc(collection(db, 'tasks'), taskWithMetadata);
      const taskId = docRef.id;

      console.log('✅ [useTasks] Task base creato con ID:', taskId);

      // 3. Se ci sono allegati E storage è disponibile, caricali
      let uploadedAttachments = [];

      if (attachments.length > 0 && taskData.createdBy && storageService) {
        console.log('📤 [useTasks] Tentativo upload allegati...');

        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];

          // Valida dimensione file (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            console.warn(`⚠️ File ${file.name} troppo grande, saltato`);
            continue;
          }

          try {
            const uploadResult = await storageService.uploadTaskAttachment(
              taskId,
              taskData.createdBy,
              file
            );

            if (uploadResult && uploadResult.success) {
              uploadedAttachments.push({
                name: file.name,
                url: uploadResult.url,
                path: uploadResult.path,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                uploadedBy: taskData.createdBy
              });
              console.log(`✅ Allegato ${i+1}/${attachments.length} caricato: ${file.name}`);
            }
          } catch (uploadError) {
            console.error(`❌ Errore upload ${file.name}:`, uploadError.message);
          }
        }
      } else if (attachments.length > 0 && !storageService) {
        console.log('ℹ️ [useTasks] Storage non disponibile, allegati ignorati');
      }

      // 4. Aggiorna task con URL degli allegati (se ce ne sono)
      if (uploadedAttachments.length > 0) {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          attachments: uploadedAttachments,
          updatedAt: serverTimestamp()
        });
        console.log(`✅ ${uploadedAttachments.length} allegati salvati nel task`);
      }

      // 5. Crea oggetto task completo
      const completeTask = {
        id: taskId,
        ...taskWithMetadata,
        attachments: uploadedAttachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 6. Aggiorna stato locale
      if (taskData.assignedTo) {
        setTasks(prev => [...prev, completeTask]);
      }

      return {
        success: true,
        taskId: taskId,
        attachmentsCount: uploadedAttachments.length,
        storageAvailable: !!storageService
      };

    } catch (err) {
      console.error('❌ [useTasks] Errore creazione task:', err);

      // Fallback: salva in localStorage
      const mockTask = {
        id: `mock_${Date.now()}`,
        ...taskData,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const savedTasks = JSON.parse(localStorage.getItem('mockTasks') || '[]');
      savedTasks.push(mockTask);
      localStorage.setItem('mockTasks', JSON.stringify(savedTasks));

      setTasks(prev => [...prev, mockTask]);

      return {
        success: true,
        taskId: mockTask.id,
        attachmentsCount: 0,
        storageAvailable: false,
        message: 'Task salvato localmente'
      };
    }
  }, []);

  // Carica task per utente corrente (dipendente)
  const loadUserTasks = useCallback(async (userId, includeDeleted = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log('👤 [useTasks] Caricamento task per utente:', userId);

      const tasksCollection = collection(db, 'tasks');
      let conditions = [where('assignedTo', '==', userId)];

      if (!includeDeleted) {
        conditions.push(where('deleted', '==', false));
      }

      conditions.push(orderBy('createdAt', 'desc'));
      const q = query(tasksCollection, ...conditions);

      const snapshot = await getDocs(q);
      const tasksList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));

      setTasks(tasksList);
      setLastUpdate(new Date());
      return tasksList;
    } catch (err) {
      console.error('❌ [useTasks] Errore caricamento task utente:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Aggiorna task
  const updateTask = useCallback(async (taskId, updates) => {
    setError(null);

    try {
      console.log('✏️ [useTasks] Aggiornamento task:', taskId);

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Aggiorna lo stato locale
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));

      return { success: true };
    } catch (err) {
      console.error('❌ [useTasks] Errore aggiornamento task:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Soft delete task (sposta nel cestino)
  const moveToTrash = useCallback(async (taskId, userData) => {
    setError(null);

    try {
      console.log('🗑️ [useTasks] Spostamento task nel cestino:', taskId);

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: userData?.uid || userData,
        deletedByName: userData?.displayName || userData?.email || 'Unknown',
        deletedByRole: userData?.role || 'employee',
        updatedAt: serverTimestamp(),
        status: 'assegnato'
      });

      // Aggiorna lo stato locale immediatamente
      setTasks(prev => {
        const updatedTasks = prev.filter(task => task.id !== taskId);

        const deletedTask = prev.find(task => task.id === taskId);
        if (deletedTask) {
          setDeletedTasks(prevDeleted => [{
            ...deletedTask,
            deleted: true,
            deletedBy: userData?.uid || userData,
            deletedByName: userData?.displayName || userData?.email || 'Unknown',
            deletedByRole: userData?.role || 'employee',
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, ...prevDeleted]);
        }

        return updatedTasks;
      });

      return {
        success: true,
        message: 'Task spostato nel cestino con successo',
        taskId
      };
    } catch (err) {
      console.error('❌ [useTasks] Errore spostamento nel cestino:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message,
        message: 'Errore durante lo spostamento nel cestino'
      };
    }
  }, []);

  // Carica statistiche utente
  const loadUserStats = useCallback(async (userId) => {
    try {
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('assignedTo', '==', userId),
        where('deleted', '==', false)
      );

      const snapshot = await getDocs(q);
      const userTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(t => t.status === 'completato').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'in corso').length;
      const assignedTasks = userTasks.filter(t => t.status === 'assegnato').length;

      const completionRate = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      const stats = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        assignedTasks,
        completionRate
      };

      setStats(stats);
      return stats;
    } catch (err) {
      console.error('❌ [useTasks] Errore caricamento statistiche:', err);
      return null;
    }
  }, []);

  // Ripristina task dal cestino
  const restoreTask = useCallback(async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        deletedByName: null,
        deletedByRole: null,
        restoredAt: serverTimestamp(),
        status: 'assegnato',
        updatedAt: serverTimestamp()
      });

      // Aggiorna lo stato locale
      setDeletedTasks(prev => prev.filter(task => task.id !== taskId));

      return { success: true };
    } catch (err) {
      console.error('❌ [useTasks] Errore ripristino task:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Eliminazione permanente
  const deletePermanently = useCallback(async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));

      // Aggiorna lo stato locale
      setDeletedTasks(prev => prev.filter(task => task.id !== taskId));

      return { success: true };
    } catch (err) {
      console.error('❌ [useTasks] Errore eliminazione permanente:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Svuota cestino
  const emptyTrash = useCallback(async (userId = 'all') => {
    try {
      const tasksCollection = collection(db, 'tasks');
      let q;

      if (userId === 'all') {
        q = query(tasksCollection, where('deleted', '==', true));
      } else {
        q = query(
          tasksCollection,
          where('assignedTo', '==', userId),
          where('deleted', '==', true)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: true, deletedCount: 0, message: 'Cestino già vuoto' };
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      if (userId === 'all') {
        setDeletedTasks([]);
      } else {
        setDeletedTasks(prev => prev.filter(task => task.assignedTo !== userId));
      }

      return {
        success: true,
        deletedCount: snapshot.docs.length,
        message: `Eliminati ${snapshot.docs.length} task`
      };
    } catch (err) {
      console.error('❌ [useTasks] Errore svuotamento cestino:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Carica task eliminati
  const loadDeletedTasks = useCallback(async (userId = 'all') => {
    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ [useTasks] Caricamento task eliminati:', userId === 'all' ? 'TUTTI' : `per utente: ${userId}`);

      const tasksCollection = collection(db, 'tasks');
      let conditions = [where('deleted', '==', true)];

      if (userId !== 'all') {
        conditions.push(where('assignedTo', '==', userId));
      }

      conditions.push(orderBy('deletedAt', 'desc'));
      const q = query(tasksCollection, ...conditions);

      const snapshot = await getDocs(q);
      const deletedList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deletedAt: doc.data().deletedAt?.toDate?.() || doc.data().deletedAt
      }));

      setDeletedTasks(deletedList);
      return deletedList;
    } catch (err) {
      console.error('❌ [useTasks] Errore caricamento task eliminati:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Funzione per verificare disponibilità storage
  const checkStorageAvailability = useCallback(() => {
    return !!storageService;
  }, []);

  useEffect(() => {
    console.log('🎯 [useTasks] Hook inizializzato - Storage disponibile:', !!storageService);
    setStorageAvailable(!!storageService);
  }, []);

  return {
    // Stato
    tasks,
    deletedTasks,
    loading,
    error,
    stats,
    storageAvailable,
    lastUpdate,

    // Metodi caricamento
    loadAllTasks,
    loadUserTasks,
    loadDeletedTasks,
    loadUserStats,

    // 🔥 NUOVI METODI REAL-TIME
    subscribeToUserTasks,
    subscribeToAllTasks,

    // Metodi operazioni
    createTask,
    updateTask,
    moveToTrash,
    restoreTask,
    deletePermanently,
    emptyTrash,

    // Metodi allegati (condizionali)
    canUploadAttachments: !!storageService,

    // Helper
    refresh: loadAllTasks,
    checkStorageAvailability,

    // Helper per filtri rapidi
    getTasksByStatus: (status) => tasks.filter(task => task.status === status),
    getTasksByPriority: (priority) => tasks.filter(task => task.priority === priority),
    getOverdueTasks: () => tasks.filter(task => {
      if (!task.dueDate || task.status === 'completato') return false;
      try {
        const due = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        return due < new Date();
      } catch {
        return false;
      }
    }),

    // Statistiche rapide
    quickStats: {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completato').length,
      inProgress: tasks.filter(t => t.status === 'in corso').length,
      pending: tasks.filter(t => t.status === 'assegnato').length,
      attachmentsTotal: tasks.reduce((sum, task) => sum + (task.attachments?.length || 0), 0),
      storageAvailable: !!storageService
    }
  };
}