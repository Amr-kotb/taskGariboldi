import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Task Service
export const taskService = {
  // Ottieni tutti i task
  async getAllTasks() {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Errore nel recupero task:', error);
      throw error;
    }
  },

  // Ottieni task per utente
  async getTasksByUser(userId) {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('assignedTo', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Errore nel recupero task utente:', error);
      throw error;
    }
  },

  // Crea nuovo task
  async createTask(taskData) {
    try {
      const tasksRef = collection(db, 'tasks');
      const newTask = {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'assegnato'
      };
      
      const docRef = await addDoc(tasksRef, newTask);
      return { id: docRef.id, ...newTask };
    } catch (error) {
      console.error('Errore nella creazione task:', error);
      throw error;
    }
  },

  // Aggiorna task
  async updateTask(taskId, updates) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Errore nell\'aggiornamento task:', error);
      throw error;
    }
  },

  // Elimina task
  async deleteTask(taskId) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      return { success: true };
    } catch (error) {
      console.error('Errore nell\'eliminazione task:', error);
      throw error;
    }
  }
};

export default taskService;