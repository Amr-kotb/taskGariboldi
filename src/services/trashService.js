// services/trashService.js
import { rtdb, db } from '../firebase';
import { ref, set, get, remove, onValue, push, update } from 'firebase/database';
import { collection, doc, deleteDoc, getDoc } from 'firebase/firestore';

class TrashService {
  // Sposta task nel trash (RTDB)
  async moveTaskToTrash(taskId, deletedBy) {
    try {
      // 1. Ottieni il task da Firestore
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists()) {
        throw new Error('Task non trovato');
      }
      
      const taskData = taskSnap.data();
      
      // 2. Prepara dati per il trash
      const trashItem = {
        ...taskData,
        id: taskId,
        originalCollection: 'tasks',
        deletedBy: {
          id: deletedBy.id,
          name: deletedBy.name,
          email: deletedBy.email
        },
        deletedAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 giorni
        canBeRestored: true,
        restored: false
      };
      
      // 3. Salva in RTDB
      const trashRef = ref(rtdb, `trash/tasks/${taskId}`);
      await set(trashRef, trashItem);
      
      // 4. Elimina da Firestore
      await deleteDoc(taskRef);
      
      // 5. Registra in history (opzionale)
      await this.logDeletion(taskId, deletedBy);
      
      return { success: true, message: 'Task spostato nel trash' };
      
    } catch (error) {
      console.error('Errore nel moveTaskToTrash:', error);
      throw error;
    }
  }

  // Ottieni tutti gli elementi nel trash
  async getTrashItems() {
    try {
      const trashRef = ref(rtdb, 'trash');
      const snapshot = await get(trashRef);
      
      if (!snapshot.exists()) {
        return { tasks: [], users: [], total: 0 };
      }
      
      const data = snapshot.val();
      
      // Trasforma in array
      const allItems = [];
      Object.keys(data).forEach(category => {
        Object.keys(data[category]).forEach(itemId => {
          allItems.push({
            id: itemId,
            category: category,
            ...data[category][itemId]
          });
        });
      });
      
      return {
        tasks: allItems.filter(item => item.category === 'tasks'),
        users: allItems.filter(item => item.category === 'users'),
        files: allItems.filter(item => item.category === 'files'),
        total: allItems.length,
        allItems
      };
      
    } catch (error) {
      console.error('Errore nel getTrashItems:', error);
      throw error;
    }
  }

  // Ripristina elemento dal trash
  async restoreFromTrash(itemId, category, restoredBy) {
    try {
      // 1. Ottieni dal trash
      const trashRef = ref(rtdb, `trash/${category}/${itemId}`);
      const snapshot = await get(trashRef);
      
      if (!snapshot.exists()) {
        throw new Error('Elemento non trovato nel trash');
      }
      
      const itemData = snapshot.val();
      
      // 2. Ripristina nella collection originale (Firestore)
      const { originalCollection, ...originalData } = itemData;
      
      // Import necessario per Firestore
      const { setDoc, collection: firestoreCollection } = await import('firebase/firestore');
      
      const restoredRef = doc(db, originalCollection, itemId);
      await setDoc(restoredRef, {
        ...originalData,
        restoredAt: Date.now(),
        restoredBy: restoredBy
      });
      
      // 3. Rimuovi dal trash
      await remove(trashRef);
      
      // 4. Registra il ripristino
      await this.logRestoration(itemId, category, restoredBy);
      
      return { success: true, message: 'Elemento ripristinato' };
      
    } catch (error) {
      console.error('Errore nel restoreFromTrash:', error);
      throw error;
    }
  }

  // Elimina permanentemente dal trash
  async permanentlyDelete(itemId, category) {
    try {
      const trashRef = ref(rtdb, `trash/${category}/${itemId}`);
      await remove(trashRef);
      
      // Registra eliminazione permanente
      await this.logPermanentDeletion(itemId, category);
      
      return { success: true, message: 'Elemento eliminato permanentemente' };
      
    } catch (error) {
      console.error('Errore nel permanentlyDelete:', error);
      throw error;
    }
  }

  // Ascolta cambiamenti in tempo reale
  setupTrashListener(callback) {
    const trashRef = ref(rtdb, 'trash');
    
    return onValue(trashRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        callback(data);
      } else {
        callback(null);
      }
    });
  }

  // Log delle operazioni (opzionale)
  async logDeletion(itemId, deletedBy) {
    const logRef = ref(rtdb, `logs/deletions/${Date.now()}`);
    await set(logRef, {
      itemId,
      deletedBy,
      timestamp: Date.now(),
      action: 'deleted'
    });
  }

  async logRestoration(itemId, category, restoredBy) {
    const logRef = ref(rtdb, `logs/restorations/${Date.now()}`);
    await set(logRef, {
      itemId,
      category,
      restoredBy,
      timestamp: Date.now(),
      action: 'restored'
    });
  }

  async logPermanentDeletion(itemId, category) {
    const logRef = ref(rtdb, `logs/permanent_deletions/${Date.now()}`);
    await set(logRef, {
      itemId,
      category,
      timestamp: Date.now(),
      action: 'permanent_deleted'
    });
  }

  // Statistiche del trash
  async getTrashStats() {
    try {
      const trashRef = ref(rtdb, 'trash');
      const snapshot = await get(trashRef);
      
      if (!snapshot.exists()) {
        return {
          totalItems: 0,
          byCategory: {},
          size: '0 KB'
        };
      }
      
      const data = snapshot.val();
      const stats = {
        totalItems: 0,
        byCategory: {},
        size: '0 KB'
      };
      
      // Calcola statistiche
      Object.keys(data).forEach(category => {
        const items = data[category];
        const itemCount = Object.keys(items).length;
        
        stats.byCategory[category] = {
          count: itemCount,
          items: Object.keys(items).map(id => ({
            id,
            ...items[id]
          }))
        };
        
        stats.totalItems += itemCount;
      });
      
      // Stima dimensione (approssimativa)
      const jsonString = JSON.stringify(data);
      const bytes = new TextEncoder().encode(jsonString).length;
      stats.size = this.formatBytes(bytes);
      
      return stats;
      
    } catch (error) {
      console.error('Errore nel getTrashStats:', error);
      throw error;
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export default new TrashService();