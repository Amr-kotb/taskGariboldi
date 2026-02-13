import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUser } from '../utils/userStorage'; // MODIFICATO

/**
 * Servizio Firestore per TaskGariboldi
 * Operazioni database per team di 5 persone
 */

// Riferimenti alle collezioni
const tasksCollection = collection(db, 'tasks');
const usersCollection = collection(db, 'users');
const activityCollection = collection(db, 'activity');

/**
 * Servizio Task
 */
export const taskService = {
  
  /**
   * Crea un nuovo task
   * @param {Object} taskData - Dati del task
   * @returns {Promise<string>} ID del task creato
   */
  async create(taskData) {
    try {
      const taskWithMeta = {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false,
        status: taskData.status || 'assegnato',
        priority: taskData.priority || 'media',
        progress: 0
      };
      
      const docRef = await addDoc(tasksCollection, taskWithMeta);
      console.log('✅ Task creato:', docRef.id);
      
      // Log attività
      await this.logActivity('task_created', `Task "${taskData.title}" creato`, docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Errore creazione task:', error);
      throw new Error('Impossibile creare il task. Riprova più tardi.');
    }
  },
  
  /**
   * Recupera tutti i task (admin)
   * @param {Object} filters - Filtri opzionali
   * @returns {Promise<Array>} Lista task
   */
  async getAll(filters = {}) {
    try {
      let q = query(tasksCollection, where('deleted', '==', false));
      
      // Applica filtri
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      
      // Ordinamento
      q = query(q, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📋 Task recuperati: ${tasks.length}`);
      return tasks;
    } catch (error) {
      console.error('❌ Errore recupero task:', error);
      throw new Error('Impossibile caricare i task. Riprova più tardi.');
    }
  },
  
  /**
   * Recupera task per utente
   * @param {string} userId - ID utente
   * @returns {Promise<Array>} Task dell'utente
   */
  async getByUser(userId) {
    try {
      const q = query(
        tasksCollection,
        where('assignedTo', '==', userId),
        where('deleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`👤 Task per utente ${userId}: ${tasks.length}`);
      return tasks;
    } catch (error) {
      console.error('❌ Errore recupero task utente:', error);
      throw new Error('Impossibile caricare i tuoi task. Riprova più tardi.');
    }
  },
  
  /**
   * Recupera un task specifico
   * @param {string} taskId - ID del task
   * @returns {Promise<Object>} Task
   */
  async getById(taskId) {
    try {
      const docRef = doc(tasksCollection, taskId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Task non trovato');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('❌ Errore recupero task:', taskId, error);
      throw new Error('Task non trovato o errore di caricamento.');
    }
  },
  
  /**
   * Aggiorna un task
   * @param {string} taskId - ID del task
   * @param {Object} updates - Campi da aggiornare
   */
  async update(taskId, updates) {
    try {
      const docRef = doc(tasksCollection, taskId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      console.log('✅ Task aggiornato:', taskId);
      
      // Log attività
      if (updates.status === 'completato') {
        await this.logActivity('task_completed', `Task completato`, taskId);
      } else if (updates.status) {
        await this.logActivity('task_updated', `Task aggiornato a "${updates.status}"`, taskId);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento task:', error);
      throw new Error('Impossibile aggiornare il task. Riprova più tardi.');
    }
  },
  
  /**
   * Soft delete di un task
   * @param {string} taskId - ID del task
   */
  async delete(taskId) {
    try {
      const docRef = doc(tasksCollection, taskId);
      await updateDoc(docRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('🗑️ Task eliminato (soft):', taskId);
      await this.logActivity('task_deleted', `Task eliminato`, taskId);
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione task:', error);
      throw new Error('Impossibile eliminare il task. Riprova più tardi.');
    }
  },
  
  /**
   * Log attività per audit
   * @param {string} action - Azione eseguita
   * @param {string} description - Descrizione
   * @param {string} taskId - ID task (opzionale)
   */
  async logActivity(action, description, taskId = null) {
    try {
      // MODIFICATO: usa getCurrentUser invece di localStorage
      const user = getCurrentUser() || {};
      
      await addDoc(activityCollection, {
        action,
        description,
        userId: user.uid,
        userName: user.name,
        taskId,
        timestamp: serverTimestamp(),
        ip: window.location.hostname // Solo per demo
      });
    } catch (error) {
      console.error('❌ Errore log attività:', error);
      // Non blocchiamo l'app per errori di log
    }
  }
};

/**
 * Servizio Utenti
 */
export const userService = {
  
  /**
   * Recupera tutti gli utenti (admin only)
   * @returns {Promise<Array>} Lista utenti
   */
  async getAll() {
    try {
      const q = query(usersCollection, where('isActive', '==', true), orderBy('name'));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`👥 Utenti attivi: ${users.length}`);
      return users;
    } catch (error) {
      console.error('❌ Errore recupero utenti:', error);
      throw new Error('Impossibile caricare gli utenti. Riprova più tardi.');
    }
  },
  
  /**
   * Recupera utente per ID
   * @param {string} userId - ID utente
   * @returns {Promise<Object>} Utente
   */
  async getById(userId) {
    try {
      const docRef = doc(usersCollection, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Utente non trovato');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('❌ Errore recupero utente:', error);
      throw new Error('Utente non trovato.');
    }
  },
  
  /**
   * Recupera solo dipendenti attivi
   * @returns {Promise<Array>} Lista dipendenti
   */
  async getEmployees() {
    try {
      const q = query(
        usersCollection,
        where('isActive', '==', true),
        where('role', '==', 'dipendente'),
        orderBy('name')
      );
      
      const snapshot = await getDocs(q);
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`👨‍💼 Dipendenti attivi: ${employees.length}`);
      return employees;
    } catch (error) {
      console.error('❌ Errore recupero dipendenti:', error);
      throw new Error('Impossibile caricare i dipendenti. Riprova più tardi.');
    }
  },
  
  /**
   * Aggiorna utente
   * @param {string} userId - ID utente
   * @param {Object} updates - Campi da aggiornare
   */
  async update(userId, updates) {
    try {
      const docRef = doc(usersCollection, userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      console.log('✅ Utente aggiornato:', userId);
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento utente:', error);
      throw new Error('Impossibile aggiornare l\'utente. Riprova più tardi.');
    }
  }
};

/**
 * Servizio Statistiche
 */
export const statsService = {
  
  /**
   * Statistiche generali (admin)
   * @returns {Promise<Object>} Statistiche
   */
  async getDashboardStats() {
    try {
      // Recupera tutti i task non eliminati
      const tasksQuery = query(tasksCollection, where('deleted', '==', false));
      const tasksSnapshot = await getDocs(tasksQuery);
      const allTasks = tasksSnapshot.docs.map(doc => doc.data());
      
      // Recupera tutti gli utenti attivi
      const usersQuery = query(usersCollection, where('isActive', '==', true));
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers = usersSnapshot.docs.map(doc => doc.data());
      
      // Calcola statistiche
      const stats = {
        totalTasks: allTasks.length,
        totalUsers: allUsers.length,
        
        tasksByStatus: {
          assegnato: allTasks.filter(t => t.status === 'assegnato').length,
          in_corso: allTasks.filter(t => t.status === 'in corso').length,
          completato: allTasks.filter(t => t.status === 'completato').length
        },
        
        tasksByPriority: {
          alta: allTasks.filter(t => t.priority === 'alta').length,
          media: allTasks.filter(t => t.priority === 'media').length,
          bassa: allTasks.filter(t => t.priority === 'bassa').length
        },
        
        usersByRole: {
          admin: allUsers.filter(u => u.role === 'admin').length,
          dipendente: allUsers.filter(u => u.role === 'dipendente').length
        }
      };
      
      // Calcola tasso completamento
      stats.completionRate = stats.totalTasks > 0 
        ? Math.round((stats.tasksByStatus.completato / stats.totalTasks) * 100)
        : 0;
      
      console.log('📊 Statistiche calcolate:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Errore calcolo statistiche:', error);
      return {
        totalTasks: 0,
        totalUsers: 0,
        tasksByStatus: { assegnato: 0, in_corso: 0, completato: 0 },
        tasksByPriority: { alta: 0, media: 0, bassa: 0 },
        usersByRole: { admin: 0, dipendente: 0 },
        completionRate: 0
      };
    }
  },
  
  /**
   * Statistiche utente specifico
   * @param {string} userId - ID utente
   * @returns {Promise<Object>} Statistiche utente
   */
  async getUserStats(userId) {
    try {
      const tasksQuery = query(
        tasksCollection,
        where('assignedTo', '==', userId),
        where('deleted', '==', false)
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      const userTasks = tasksSnapshot.docs.map(doc => doc.data());
      
      const stats = {
        totalTasks: userTasks.length,
        completedTasks: userTasks.filter(t => t.status === 'completato').length,
        inProgressTasks: userTasks.filter(t => t.status === 'in corso').length,
        pendingTasks: userTasks.filter(t => t.status === 'assegnato').length,
        
        byPriority: {
          alta: userTasks.filter(t => t.priority === 'alta').length,
          media: userTasks.filter(t => t.priority === 'media').length,
          bassa: userTasks.filter(t => t.priority === 'bassa').length
        },
        
        completionRate: userTasks.length > 0
          ? Math.round((userTasks.filter(t => t.status === 'completato').length / userTasks.length) * 100)
          : 0
      };
      
      return stats;
      
    } catch (error) {
      console.error('❌ Errore statistiche utente:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        byPriority: { alta: 0, media: 0, bassa: 0 },
        completionRate: 0
      };
    }
  }
};

// Esporta tutti i servizi
export default {
  tasks: taskService,
  users: userService,
  stats: statsService
};