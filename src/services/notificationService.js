import { db } from '../firebase/config.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { 
  COLLECTIONS, 
  MESSAGE_TYPES, 
  NOTIFICATION_PRIORITY,
  USER_ROLES 
} from '../constants/firebaseCollections.js';
import { formatDate } from '../utils/dateFormatter.js';

/**
 * Servizio per la gestione delle notifiche di sistema/admin
 */
class NotificationService {
  constructor() {
    this.notificationsCollection = collection(db, COLLECTIONS.NOTIFICATIONS);
    this.messagesCollection = collection(db, COLLECTIONS.MESSAGES);
    this.usersCollection = collection(db, COLLECTIONS.USERS);
  }

  /**
   * Crea una notifica di sistema
   */
  async createSystemNotification({ title, message, priority = NOTIFICATION_PRIORITY.MEDIUM, targetUsers = 'all' }) {
    try {
      const notification = {
        title,
        message,
        type: MESSAGE_TYPES.SYSTEM_ALERT,
        priority,
        target: targetUsers, // 'all', 'employees', 'admins', o array di user IDs
        isSystem: true,
        readBy: [],
        createdAt: serverTimestamp(),
        expiresAt: this.getExpiryDate(priority),
        active: true,
      };

      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log(`✅ Notifica di sistema creata: ${title}`);
      
      // Invia anche come messaggi agli utenti target
      await this.distributeNotificationToUsers(docRef.id, notification);
      
      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Errore creazione notifica sistema:', error);
      throw error;
    }
  }

  /**
   * Crea una notifica admin per tutti i dipendenti
   */
  async createAdminBroadcast({ adminId, title, message, priority = NOTIFICATION_PRIORITY.MEDIUM, department = null }) {
    try {
      const notification = {
        title,
        message,
        type: MESSAGE_TYPES.NOTIFICATION,
        priority,
        from: adminId,
        target: 'employees',
        department,
        isBroadcast: true,
        readBy: [],
        createdAt: serverTimestamp(),
        expiresAt: this.getExpiryDate(priority),
        active: true,
      };

      const docRef = await addDoc(this.notificationsCollection, notification);
      console.log(`✅ Broadcast admin creato: ${title}`);
      
      // Distribuisci a tutti i dipendenti
      await this.distributeToEmployees(docRef.id, notification);
      
      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Errore creazione broadcast admin:', error);
      throw error;
    }
  }

  /**
   * Crea notifica per un singolo dipendente
   */
  async createEmployeeNotification({ adminId, employeeId, title, message, priority = NOTIFICATION_PRIORITY.MEDIUM }) {
    try {
      // Crea la notifica nel sistema
      const notification = {
        title,
        message,
        type: MESSAGE_TYPES.NOTIFICATION,
        priority,
        from: adminId,
        target: [employeeId],
        isBroadcast: false,
        readBy: [],
        createdAt: serverTimestamp(),
        expiresAt: this.getExpiryDate(priority),
        active: true,
      };

      const docRef = await addDoc(this.notificationsCollection, notification);
      
      // Crea anche un messaggio diretto
      await this.createDirectMessage(adminId, employeeId, title, message, priority);
      
      console.log(`✅ Notifica per dipendente ${employeeId} creata`);
      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Errore creazione notifica dipendente:', error);
      throw error;
    }
  }

  /**
   * Crea notifica per un dipartimento specifico
   */
  async createDepartmentNotification({ adminId, department, title, message, priority = NOTIFICATION_PRIORITY.MEDIUM }) {
    try {
      // Prima ottieni tutti i dipendenti del dipartimento
      const employees = await this.getEmployeesByDepartment(department);
      
      if (employees.length === 0) {
        console.warn(`⚠️ Nessun dipendente trovato per dipartimento: ${department}`);
        return { success: false, message: 'Nessun dipendente nel dipartimento' };
      }

      // Crea la notifica nel sistema
      const notification = {
        title,
        message,
        type: MESSAGE_TYPES.NOTIFICATION,
        priority,
        from: adminId,
        targetDepartment: department,
        targetUsers: employees.map(e => e.id),
        isBroadcast: true,
        readBy: [],
        createdAt: serverTimestamp(),
        expiresAt: this.getExpiryDate(priority),
        active: true,
      };

      const docRef = await addDoc(this.notificationsCollection, notification);
      
      // Distribuisci a ogni dipendente del dipartimento
      await this.distributeToUsers(employees, docRef.id, notification);
      
      console.log(`✅ Notifica per dipartimento ${department} creata (${employees.length} dipendenti)`);
      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date(),
        affectedEmployees: employees.length,
      };
    } catch (error) {
      console.error('❌ Errore creazione notifica dipartimento:', error);
      throw error;
    }
  }

  /**
   * Ottiene le notifiche attive per un utente
   */
  async getUserNotifications(userId, includeExpired = false) {
    try {
      const conditions = [
        where('target', 'array-contains', userId), // Per notifiche targettizzate
      ];

      // Aggiungi condizioni per broadcast
      const broadcastConditions = [
        where('target', 'in', ['all', 'employees']),
      ];

      if (!includeExpired) {
        conditions.push(where('active', '==', true));
        broadcastConditions.push(where('active', '==', true));
      }

      conditions.push(orderBy('createdAt', 'desc'));
      broadcastConditions.push(orderBy('createdAt', 'desc'));

      // Query per notifiche specifiche per utente
      const q1 = query(this.notificationsCollection, ...conditions);
      
      // Query per broadcast
      const q2 = query(this.notificationsCollection, ...broadcastConditions);

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      const notifications = new Map();

      // Processa notifiche specifiche
      snapshot1.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.set(docSnap.id, {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || null,
          isPersonal: true,
        });
      });

      // Processa broadcast (evita duplicati)
      snapshot2.forEach((docSnap) => {
        if (!notifications.has(docSnap.id)) {
          const data = docSnap.data();
          notifications.set(docSnap.id, {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || null,
            isPersonal: false,
          });
        }
      });

      // Filtra notifiche scadute se necessario
      let result = Array.from(notifications.values());
      if (!includeExpired) {
        const now = new Date();
        result = result.filter(notif => 
          !notif.expiresAt || notif.expiresAt > now
        );
      }

      console.log(`✅ Trovate ${result.length} notifiche per utente ${userId}`);
      return result;
    } catch (error) {
      console.error('❌ Errore recupero notifiche utente:', error);
      throw error;
    }
  }

  /**
   * Marca una notifica come letta da un utente
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      const notificationSnap = await getDoc(notificationRef);
      
      if (!notificationSnap.exists()) {
        throw new Error('Notifica non trovata');
      }

      const notification = notificationSnap.data();
      const readBy = notification.readBy || [];
      
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        
        await updateDoc(notificationRef, {
          readBy,
          updatedAt: serverTimestamp(),
        });

        console.log(`✅ Notifica ${notificationId} marcata come letta da ${userId}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Errore marcatura notifica come letta:', error);
      throw error;
    }
  }

  /**
   * Archivia una notifica (admin only)
   */
  async archiveNotification(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        active: false,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Notifica ${notificationId} archiviata`);
      return true;
    } catch (error) {
      console.error('❌ Errore archiviazione notifica:', error);
      throw error;
    }
  }

  /**
   * Elimina una notifica (admin only)
   */
  async deleteNotification(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await deleteDoc(notificationRef);
      
      console.log(`✅ Notifica ${notificationId} eliminata`);
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione notifica:', error);
      throw error;
    }
  }

  /**
   * Sottoscrizione in tempo reale alle notifiche
   */
  subscribeToNotifications(userId, callback) {
    try {
      const q = query(
        this.notificationsCollection,
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, async (snapshot) => {
        const notifications = [];
        const now = new Date();
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          
          // Controlla se la notifica è per questo utente
          const isForUser = this.isNotificationForUser(data, userId);
          const isExpired = data.expiresAt?.toDate() < now;
          
          if (isForUser && !isExpired) {
            notifications.push({
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              expiresAt: data.expiresAt?.toDate() || null,
              formattedTime: formatDate(data.createdAt?.toDate(), true),
              isPersonal: Array.isArray(data.target) && data.target.includes(userId),
            });
          }
        }
        
        callback(notifications);
      }, (error) => {
        console.error('❌ Errore sottoscrizione notifiche:', error);
      });
    } catch (error) {
      console.error('❌ Errore setup sottoscrizione:', error);
      throw error;
    }
  }

  // ========== METODI PRIVATI ==========

  /**
   * Distribuisce una notifica agli utenti target
   */
  async distributeNotificationToUsers(notificationId, notification) {
    try {
      let users = [];
      
      if (notification.target === 'all') {
        users = await this.getAllUsers();
      } else if (notification.target === 'employees') {
        users = await this.getAllEmployees();
      } else if (notification.target === 'admins') {
        users = await this.getAllAdmins();
      } else if (Array.isArray(notification.target)) {
        users = await this.getUsersByIds(notification.target);
      }
      
      await this.distributeToUsers(users, notificationId, notification);
    } catch (error) {
      console.error('❌ Errore distribuzione notifiche:', error);
    }
  }

  /**
   * Distribuisce a tutti i dipendenti
   */
  async distributeToEmployees(notificationId, notification) {
    try {
      const employees = await this.getAllEmployees();
      await this.distributeToUsers(employees, notificationId, notification);
    } catch (error) {
      console.error('❌ Errore distribuzione dipendenti:', error);
    }
  }

  /**
   * Distribuisce a una lista di utenti
   */
  async distributeToUsers(users, notificationId, notification) {
    try {
      const batch = writeBatch(db);
      const now = new Date();
      
      users.forEach(user => {
        const messageRef = doc(this.messagesCollection);
        batch.set(messageRef, {
          from: notification.from || 'Sistema',
          to: user.id,
          subject: notification.title,
          content: notification.message,
          type: MESSAGE_TYPES.NOTIFICATION,
          priority: notification.priority,
          notificationId,
          read: false,
          readBy: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          expiresAt: notification.expiresAt,
        });
      });
      
      await batch.commit();
      console.log(`✅ Notifica distribuita a ${users.length} utenti`);
    } catch (error) {
      console.error('❌ Errore batch distribuzione:', error);
    }
  }

  /**
   * Crea un messaggio diretto
   */
  async createDirectMessage(from, to, subject, content, priority) {
    try {
      await addDoc(this.messagesCollection, {
        from,
        to,
        subject,
        content,
        type: MESSAGE_TYPES.NOTIFICATION,
        priority,
        read: false,
        readBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Errore creazione messaggio diretto:', error);
    }
  }

  /**
   * Ottiene tutti i dipendenti
   */
  async getAllEmployees() {
    try {
      const q = query(
        this.usersCollection,
        where('role', '==', USER_ROLES.EMPLOYEE),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Errore recupero dipendenti:', error);
      return [];
    }
  }

  /**
   * Ottiene dipendenti per dipartimento
   */
  async getEmployeesByDepartment(department) {
    try {
      const q = query(
        this.usersCollection,
        where('role', '==', USER_ROLES.EMPLOYEE),
        where('department', '==', department),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Errore recupero dipendenti per dipartimento:', error);
      return [];
    }
  }

  /**
   * Ottiene tutti gli admin
   */
  async getAllAdmins() {
    try {
      const q = query(
        this.usersCollection,
        where('role', '==', USER_ROLES.ADMIN),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Errore recupero admin:', error);
      return [];
    }
  }

  /**
   * Ottiene tutti gli utenti
   */
  async getAllUsers() {
    try {
      const q = query(
        this.usersCollection,
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Errore recupero tutti gli utenti:', error);
      return [];
    }
  }

  /**
   * Ottiene utenti per IDs
   */
  async getUsersByIds(userIds) {
    try {
      if (userIds.length === 0) return [];
      
      const q = query(
        this.usersCollection,
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs
        .filter(doc => userIds.includes(doc.id))
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
    } catch (error) {
      console.error('❌ Errore recupero utenti per IDs:', error);
      return [];
    }
  }

  /**
   * Controlla se una notifica è per un utente specifico
   */
  isNotificationForUser(notification, userId) {
    if (notification.target === 'all') return true;
    if (notification.target === 'employees') return true; // Il controllo del ruolo va fatto a monte
    if (notification.target === 'admins') return true; // Il controllo del ruolo va fatto a monte
    if (Array.isArray(notification.target) && notification.target.includes(userId)) return true;
    if (Array.isArray(notification.targetUsers) && notification.targetUsers.includes(userId)) return true;
    
    return false;
  }

  /**
   * Calcola la data di scadenza in base alla priorità
   */
  getExpiryDate(priority) {
    const now = new Date();
    
    switch (priority) {
      case NOTIFICATION_PRIORITY.URGENT:
        now.setDate(now.getDate() + 1); // 1 giorno
        break;
      case NOTIFICATION_PRIORITY.HIGH:
        now.setDate(now.getDate() + 3); // 3 giorni
        break;
      case NOTIFICATION_PRIORITY.MEDIUM:
        now.setDate(now.getDate() + 7); // 1 settimana
        break;
      case NOTIFICATION_PRIORITY.LOW:
        now.setDate(now.getDate() + 30); // 1 mese
        break;
      default:
        now.setDate(now.getDate() + 7); // Default 1 settimana
    }
    
    return now;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;