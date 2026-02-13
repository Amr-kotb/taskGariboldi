import { db } from '../firebase/config.js';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { COLLECTIONS } from '../constants/firebaseCollections.js';
import { messageService } from './messageService.js';
import { MESSAGE_TYPES, NOTIFICATION_PRIORITY } from '../constants/firebaseCollections.js';

class TaskNotificationService {
  constructor() {
    this.tasksCollection = collection(db, COLLECTIONS.TASKS);
    this.messagesCollection = collection(db, COLLECTIONS.MESSAGES);
    this.initialized = false;
    this.userId = null;
    this.processedTasks = new Set(); // Cache delle task già processate
  }

  initialize(userId) {
    if (this.initialized && this.userId === userId) {
      console.log('⚠️ Già inizializzato per user:', userId);
      return;
    }
    
    console.log('🚀 Inizializzazione TaskNotificationService per user:', userId);
    
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.userId = userId;
    this.processedTasks.clear(); // Pulisci cache
    
    try {
      // Ascolta SOLO task create DOPO l'inizializzazione
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000); // 5 minuti fa
      
      const q = query(
        this.tasksCollection,
        where('assignedTo', '==', userId),
        where('deleted', '==', false)
        // NON filtrare per createdAt perché non tutti hanno questo campo
      );

      this.unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('📡 Snapshot task ricevuto:', snapshot.size, 'task totali');
        
        // Prima, carica tutte le notifiche esistenti per evitare duplicati
        const existingNotifications = await this.getExistingTaskNotifications(userId);
        
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const task = change.doc.data();
            const taskId = change.doc.id;
            
            console.log('➕ Nuova task rilevata:', task.title, 'ID:', taskId);
            
            // Controlla se abbiamo già processato questa task
            if (this.processedTasks.has(taskId)) {
              console.log('⏭️  Task già processata:', taskId);
              continue;
            }
            
            // Controlla se esiste già una notifica per questa task
            const hasExistingNotification = existingNotifications.some(notif => 
              notif.taskId === taskId || 
              (notif.subject && notif.subject.includes(task.title))
            );
            
            if (hasExistingNotification) {
              console.log('⏭️  Notifica già esistente per task:', taskId);
              this.processedTasks.add(taskId);
              continue;
            }
            
            // Controlla se la task è troppo vecchia (più di 1 ora)
            const taskCreatedAt = task.createdAt?.toDate() || new Date();
            const hoursOld = (now - taskCreatedAt) / (1000 * 60 * 60);
            
            if (hoursOld > 1 && taskCreatedAt.getTime() !== now.getTime()) {
              console.log(`⏰ Task troppo vecchia (${hoursOld.toFixed(1)} ore), salto:`, taskId);
              this.processedTasks.add(taskId);
              continue;
            }
            
            // Invia notifica
            await this.sendTaskAssignmentNotification(taskId, task, userId);
            this.processedTasks.add(taskId);
          }
        }
      }, (error) => {
        console.error('❌ Errore listener task:', error);
      });

      this.initialized = true;
      console.log('✅ TaskNotificationService inizializzato');
      
    } catch (error) {
      console.error('❌ Errore inizializzazione:', error);
    }
  }

  async getExistingTaskNotifications(userId) {
    try {
      console.log('🔍 Controllo notifiche esistenti per user:', userId);
      
      const q = query(
        this.messagesCollection,
        where('to', '==', userId),
        where('type', '==', MESSAGE_TYPES.TASK_ASSIGNMENT)
      );

      const snapshot = await getDocs(q);
      const notifications = [];
      
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      console.log(`📋 Trovate ${notifications.length} notifiche task esistenti`);
      return notifications;
      
    } catch (error) {
      console.error('❌ Errore recupero notifiche esistenti:', error);
      return [];
    }
  }

  async sendTaskAssignmentNotification(taskId, task, assignedToUserId) {
    try {
      console.log('📨 Invio notifica per task:', taskId);
      
      const notification = {
        from: task.createdBy || task.assignedBy || 'Admin',
        to: assignedToUserId,
        subject: `📋 Nuovo Task Assegnato: ${task.title}`,
        content: `Hai ricevuto un nuovo task:\n\n` +
                `📌 **${task.title}**\n` +
                `📝 ${task.description || 'Nessuna descrizione'}\n` +
                `🎯 Priorità: ${this.getPriorityText(task.priority)}\n` +
                `📅 Scadenza: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('it-IT') : 'Nessuna scadenza'}\n` +
                `👤 Assegnato da: ${task.createdBy || task.assignedBy || 'Admin'}`,
        type: MESSAGE_TYPES.TASK_ASSIGNMENT,
        priority: task.priority === 'high' ? NOTIFICATION_PRIORITY.HIGH : 
                  task.priority === 'medium' ? NOTIFICATION_PRIORITY.MEDIUM : 
                  NOTIFICATION_PRIORITY.LOW,
        taskId: taskId,
        isTaskNotification: true,
        taskTitle: task.title,
        taskPriority: task.priority,
        taskDueDate: task.dueDate,
      };

      const result = await messageService.sendMessage(notification);
      console.log(`✅ Notifica inviata per task ${taskId}`);
      return result;
      
    } catch (error) {
      console.error('❌ Errore invio notifica task:', error);
      return null;
    }
  }

  getPriorityText(priority) {
    switch(priority) {
      case 'high': return '🟥 ALTA';
      case 'medium': return '🟨 MEDIA';
      case 'low': return '🟩 BASSA';
      default: return 'MEDIA';
    }
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      console.log('🧹 TaskNotificationService cleanup');
    }
    this.initialized = false;
    this.userId = null;
    this.processedTasks.clear();
  }
}

export const taskNotificationService = new TaskNotificationService();