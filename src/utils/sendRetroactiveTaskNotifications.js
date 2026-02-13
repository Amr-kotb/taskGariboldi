import { db } from '../firebase/config.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '../constants/firebaseCollections.js';
import { messageService } from '../services/messageService.js';
import { MESSAGE_TYPES, NOTIFICATION_PRIORITY } from '../constants/firebaseCollections.js';

/**
 * Invia notifiche retroattive per task esistenti
 */
export async function sendRetroactiveTaskNotifications(userId = null) {
  try {
    console.log('🚀 Avvio notifiche retroattive task...');
    
    const tasksCollection = collection(db, COLLECTIONS.TASKS);
    
    // Query per task non eliminate
    let q = query(tasksCollection, where('deleted', '==', false));
    
    // Se specificato un userId, filtra solo le sue task
    if (userId) {
      q = query(tasksCollection, 
        where('deleted', '==', false),
        where('assignedTo', '==', userId)
      );
    }
    
    const snapshot = await getDocs(q);
    const tasks = [];
    
    snapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    console.log(`📋 Trovate ${tasks.length} task attive`);
    
    let notificationsCreated = 0;
    let notificationsSkipped = 0;
    
    for (const task of tasks) {
      if (!task.assignedTo) {
        console.log(`⚠️ Task ${task.id} senza assignedTo, salto`);
        notificationsSkipped++;
        continue;
      }
      
      // Controlla se esiste già una notifica per questa task
      try {
        const userMessages = await messageService.getUserMessages(task.assignedTo);
        const hasExistingNotification = userMessages.some(msg => 
          (msg.taskId === task.id) || 
          (msg.subject && msg.subject.includes(task.title)) ||
          (msg.content && msg.content.includes(task.title))
        );
        
        if (hasExistingNotification) {
          console.log(`⏭️  Notifica già esistente per task ${task.id}`);
          notificationsSkipped++;
          continue;
        }
        
        // Crea la notifica
        const notification = {
          from: task.createdBy || task.assignedBy || 'Admin',
          to: task.assignedTo,
          subject: `📋 Task Assegnato: ${task.title}`,
          content: `Task assegnato in precedenza:\n\n` +
                  `📌 **${task.title}**\n` +
                  `📝 ${task.description || 'Nessuna descrizione'}\n` +
                  `🎯 Priorità: ${task.priority || 'Media'}\n` +
                  `📅 Scadenza: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('it-IT') : 'Nessuna scadenza'}\n` +
                  `📊 Stato: ${task.status || 'Da fare'}\n` +
                  `👤 Assegnato da: ${task.createdBy || 'Admin'}`,
          type: MESSAGE_TYPES.TASK_ASSIGNMENT,
          priority: task.priority === 'high' ? NOTIFICATION_PRIORITY.HIGH : 
                    task.priority === 'medium' ? NOTIFICATION_PRIORITY.MEDIUM : 
                    NOTIFICATION_PRIORITY.LOW,
          taskId: task.id,
          isTaskNotification: true,
          taskTitle: task.title,
          taskPriority: task.priority,
          taskDueDate: task.dueDate,
          createdAt: task.createdAt || new Date(),
        };
        
        await messageService.sendMessage(notification);
        console.log(`✅ Notifica creata per task: ${task.title} (${task.id})`);
        notificationsCreated++;
        
        // Piccola pausa per non sovraccaricare
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Errore task ${task.id}:`, error.message);
      }
    }
    
    console.log(`🎉 Completato!`);
    console.log(`✅ Notifiche create: ${notificationsCreated}`);
    console.log(`⏭️  Notifiche saltate: ${notificationsSkipped}`);
    
    return {
      success: true,
      created: notificationsCreated,
      skipped: notificationsSkipped,
      total: tasks.length
    };
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Pulsante admin per eseguire lo script
 */
export function RetroactiveNotificationsButton() {
  const handleClick = async () => {
    const confirmed = window.confirm(
      'Vuoi inviare notifiche per tutte le task esistenti?\n\n' +
      'Questo creerà notifiche per task a cui non erano state inviate.\n' +
      'Le task che hanno già notifiche verranno saltate.\n\n' +
      'Il processo potrebbe richiedere qualche minuto.'
    );
    
    if (!confirmed) return;
    
    const button = document.activeElement;
    const originalText = button.textContent;
    button.textContent = '⏳ Elaborazione in corso...';
    button.disabled = true;
    
    try {
      const result = await sendRetroactiveTaskNotifications();
      
      alert(
        `Processo completato!\n\n` +
        `Task trovate: ${result.total}\n` +
        `Notifiche create: ${result.created}\n` +
        `Notifiche saltate: ${result.skipped}`
      );
      
    } catch (error) {
      alert(`Errore: ${error.message}`);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  };
  
  return (
    <button
      onClick={handleClick}
      style={{
        padding: '10px 20px',
        backgroundColor: '#722ed1',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        margin: '10px'
      }}
    >
      🔄 Invia Notifiche Task Retroattive
    </button>
  );
}