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
  Timestamp
} from 'firebase/firestore';
import { 
  COLLECTIONS, 
  MESSAGE_TYPES, 
  READ_STATUS,
  NOTIFICATION_PRIORITY 
} from '../constants/firebaseCollections.js';
import { formatDate } from '../utils/dateFormatter.js';

/**
 * Servizio per la gestione dei messaggi
 */
class MessageService {
  constructor() {
    this.messagesCollection = collection(db, COLLECTIONS.MESSAGES);
  }

  /**
   * Invia un nuovo messaggio
   */
  async sendMessage(messageData) {
    try {
      const message = {
        ...messageData,
        type: messageData.type || MESSAGE_TYPES.MESSAGE,
        read: false,
        readBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.messagesCollection, message);
      console.log('✅ Messaggio inviato con ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...message,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Errore invio messaggio:', error);
      throw error;
    }
  }

  /**
   * Invia un messaggio da admin a dipendente
   */
  async sendAdminMessage({ adminId, employeeId, subject, content, priority = NOTIFICATION_PRIORITY.MEDIUM }) {
    try {
      const message = {
        from: adminId,
        to: employeeId,
        subject,
        content,
        type: MESSAGE_TYPES.NOTIFICATION,
        priority,
        isAdminMessage: true,
        read: false,
        readBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.messagesCollection, message);
      console.log(`✅ Notifica admin inviata a dipendente ${employeeId}`);
      
      return {
        id: docRef.id,
        ...message,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Errore invio notifica admin:', error);
      throw error;
    }
  }

  /**
   * Ottiene i messaggi per un utente
   */
  async getUserMessages(userId, filters = {}) {
    try {
      const conditions = [
        where('to', '==', userId), // Messaggi inviati all'utente
      ];

      // Filtro per tipo di messaggio
      if (filters.type) {
        conditions.push(where('type', '==', filters.type));
      }

      // Filtro per stato di lettura
      if (filters.read !== undefined) {
        conditions.push(where('read', '==', filters.read));
      }

      // Filtro per priorità (solo notifiche)
      if (filters.priority) {
        conditions.push(where('priority', '==', filters.priority));
      }

      // Ordinamento per data creazione (più recenti prima)
      conditions.push(orderBy('createdAt', 'desc'));

      const q = query(this.messagesCollection, ...conditions);
      const querySnapshot = await getDocs(q);
      
      const messages = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          formattedTime: formatDate(data.createdAt?.toDate(), true),
        });
      });

      console.log(`✅ Trovati ${messages.length} messaggi per utente ${userId}`);
      return messages;
    } catch (error) {
      console.error('❌ Errore recupero messaggi utente:', error);
      throw error;
    }
  }

  /**
   * Ottiene i messaggi inviati da un utente
   */
  async getSentMessages(userId) {
    try {
      const q = query(
        this.messagesCollection,
        where('from', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          formattedTime: formatDate(data.createdAt?.toDate(), true),
        });
      });

      console.log(`✅ Trovati ${messages.length} messaggi inviati da ${userId}`);
      return messages;
    } catch (error) {
      console.error('❌ Errore recupero messaggi inviati:', error);
      throw error;
    }
  }

  /**
   * Conta i messaggi non letti per un utente
   */
  async getUnreadCount(userId) {
    try {
      const q = query(
        this.messagesCollection,
        where('to', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Errore conteggio messaggi non letti:', error);
      throw error;
    }
  }

  /**
   * Marca un messaggio come letto
   */
  async markAsRead(messageId, userId) {
    try {
      const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
      const messageSnap = await getDoc(messageRef);
      
      if (!messageSnap.exists()) {
        throw new Error('Messaggio non trovato');
      }

      const message = messageSnap.data();
      const readBy = message.readBy || [];
      
      // Aggiungi l'utente alla lista dei lettori
      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }

      await updateDoc(messageRef, {
        read: true,
        readBy,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Messaggio ${messageId} marcato come letto da ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Errore marcatura messaggio come letto:', error);
      throw error;
    }
  }

  /**
   * Marca tutti i messaggi come letti per un utente
   */
  async markAllAsRead(userId) {
    try {
      const q = query(
        this.messagesCollection,
        where('to', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = [];
      
      querySnapshot.forEach((docSnap) => {
        const messageRef = doc(db, COLLECTIONS.MESSAGES, docSnap.id);
        const message = docSnap.data();
        const readBy = message.readBy || [];
        
        if (!readBy.includes(userId)) {
          readBy.push(userId);
        }

        batch.push(updateDoc(messageRef, {
          read: true,
          readBy,
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }));
      });

      await Promise.all(batch);
      console.log(`✅ ${batch.length} messaggi marcati come letti per ${userId}`);
      return batch.length;
    } catch (error) {
      console.error('❌ Errore marcatura tutti i messaggi come letti:', error);
      throw error;
    }
  }

  /**
   * Elimina un messaggio
   */
  async deleteMessage(messageId) {
    try {
      const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
      await deleteDoc(messageRef);
      console.log(`✅ Messaggio ${messageId} eliminato`);
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione messaggio:', error);
      throw error;
    }
  }

  /**
   * Sottoscrizione in tempo reale ai messaggi di un utente
   */
  subscribeToUserMessages(userId, callback) {
    try {
      const q = query(
        this.messagesCollection,
        where('to', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          messages.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            formattedTime: formatDate(data.createdAt?.toDate(), true),
          });
        });
        
        callback(messages);
      }, (error) => {
        console.error('❌ Errore sottoscrizione messaggi:', error);
      });
    } catch (error) {
      console.error('❌ Errore setup sottoscrizione:', error);
      throw error;
    }
  }

  /**
   * Cerca messaggi per testo
   */
  async searchMessages(userId, searchTerm) {
    try {
      // Nota: Firestore non supporta ricerche full-text out-of-the-box
      // Questa è una soluzione base che cerca nel subject e content
      const allMessages = await this.getUserMessages(userId);
      
      const searchLower = searchTerm.toLowerCase();
      const results = allMessages.filter(msg => 
        msg.subject?.toLowerCase().includes(searchLower) ||
        msg.content?.toLowerCase().includes(searchLower) ||
        msg.from?.toLowerCase().includes(searchLower)
      );

      console.log(`✅ Trovati ${results.length} messaggi per ricerca: "${searchTerm}"`);
      return results;
    } catch (error) {
      console.error('❌ Errore ricerca messaggi:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();
export default messageService;