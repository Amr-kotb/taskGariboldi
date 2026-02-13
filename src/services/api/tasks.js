/**
 * API Service per gestione Task
 * Utilizza il servizio Firestore esistente
 */

import { taskService } from '../../services/firebase/firestore';
import { 
  TASK_STATUS, 
  TASK_PRIORITY, 
  getStatusName,
  getPriorityName 
} from '../../constants/statuses';

/**
 * Ottieni tutti i task per l'utente corrente
 * @param {string} userId - ID utente corrente
 * @param {Object} filters - Filtri opzionali
 * @returns {Promise<Array>} Lista task
 */
export const getUserTasks = async (userId, filters = {}) => {
  try {
    console.log('📥 [tasks.js] Fetching tasks for user:', userId);
    
    // Filtri base: task assegnati all'utente e non eliminati
    const baseFilters = {
      assignedTo: userId,
      ...filters
    };
    
    const tasks = await taskService.getByUser(userId);
    
    // Formatta i task per il frontend
    const formattedTasks = tasks.map(task => ({
      ...task,
      statusName: getStatusName(task.status),
      priorityName: getPriorityName(task.priority),
      formattedDueDate: task.dueDate ? formatDate(task.dueDate) : null,
      isOverdue: checkIfOverdue(task.dueDate, task.status)
    }));
    
    console.log('✅ [tasks.js] Tasks fetched:', formattedTasks.length);
    return {
      success: true,
      data: formattedTasks,
      count: formattedTasks.length
    };
    
  } catch (error) {
    console.error('❌ [tasks.js] Error fetching user tasks:', error);
    return {
      success: false,
      error: error.message || 'Errore nel caricamento dei task',
      data: []
    };
  }
};

/**
 * Aggiorna lo stato di un task
 * @param {string} taskId - ID del task
 * @param {string} status - Nuovo stato
 * @param {string} userId - ID utente che esegue l'azione
 * @returns {Promise<Object>} Risultato operazione
 */
export const updateTaskStatus = async (taskId, status, userId) => {
  try {
    console.log(`🔄 [tasks.js] Updating task ${taskId} to status: ${status}`);
    
    // Verifica che lo stato sia valido
    if (!Object.values(TASK_STATUS).includes(status)) {
      throw new Error(`Stato non valido: ${status}`);
    }
    
    // Recupera il task per verificare l'assegnazione
    const task = await taskService.getById(taskId);
    
    if (!task) {
      throw new Error('Task non trovato');
    }
    
    // Verifica che l'utente sia assegnato al task (solo per dipendenti)
    if (task.assignedTo !== userId) {
      throw new Error('Non sei autorizzato a modificare questo task');
    }
    
    // Aggiorna il task
    const updates = {
      status: status,
      updatedAt: new Date().toISOString()
    };
    
    // Se il task viene completato, aggiungi data completamento
    if (status === TASK_STATUS.COMPLETATO) {
      updates.completedAt = new Date().toISOString();
      updates.progress = 100;
    }
    
    // Se il task viene messo in corso, aggiungi data inizio
    if (status === TASK_STATUS.IN_CORSO && task.status !== TASK_STATUS.IN_CORSO) {
      updates.startedAt = new Date().toISOString();
      updates.progress = 50;
    }
    
    // Se il task viene bloccato, azzera progresso
    if (status === TASK_STATUS.BLOCCATO) {
      updates.progress = 0;
    }
    
    await taskService.update(taskId, updates);
    
    console.log('✅ [tasks.js] Task status updated successfully');
    return {
      success: true,
      message: `Task aggiornato a: ${getStatusName(status)}`,
      data: { ...task, ...updates }
    };
    
  } catch (error) {
    console.error('❌ [tasks.js] Error updating task status:', error);
    return {
      success: false,
      error: error.message || 'Errore nell\'aggiornamento del task'
    };
  }
};

/**
 * Aggiorna progresso di un task
 * @param {string} taskId - ID del task
 * @param {number} progress - Progresso (0-100)
 * @param {string} userId - ID utente
 * @returns {Promise<Object>} Risultato operazione
 */
export const updateTaskProgress = async (taskId, progress, userId) => {
  try {
    // Validazione progresso
    if (progress < 0 || progress > 100) {
      throw new Error('Il progresso deve essere tra 0 e 100');
    }
    
    const task = await taskService.getById(taskId);
    
    if (!task) {
      throw new Error('Task non trovato');
    }
    
    if (task.assignedTo !== userId) {
      throw new Error('Non sei autorizzato a modificare questo task');
    }
    
    const updates = {
      progress: progress,
      updatedAt: new Date().toISOString()
    };
    
    // Se progresso 100%, aggiorna stato a completato
    if (progress === 100) {
      updates.status = TASK_STATUS.COMPLETATO;
      updates.completedAt = new Date().toISOString();
    }
    // Se progresso > 0 e stato è assegnato, cambia in "in corso"
    else if (progress > 0 && task.status === TASK_STATUS.ASSEGNATO) {
      updates.status = TASK_STATUS.IN_CORSO;
      if (!task.startedAt) {
        updates.startedAt = new Date().toISOString();
      }
    }
    
    await taskService.update(taskId, updates);
    
    return {
      success: true,
      message: `Progresso aggiornato al ${progress}%`,
      data: updates
    };
    
  } catch (error) {
    console.error('❌ [tasks.js] Error updating task progress:', error);
    return {
      success: false,
      error: error.message || 'Errore nell\'aggiornamento del progresso'
    };
  }
};

/**
 * Aggiungi commento a un task
 * @param {string} taskId - ID del task
 * @param {string} comment - Testo del commento
 * @param {string} userId - ID utente
 * @param {string} userName - Nome utente
 * @returns {Promise<Object>} Risultato operazione
 */
export const addTaskComment = async (taskId, comment, userId, userName) => {
  try {
    const task = await taskService.getById(taskId);
    
    if (!task) {
      throw new Error('Task non trovato');
    }
    
    // Crea il nuovo commento
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      userId: userId,
      userName: userName,
      timestamp: new Date().toISOString(),
      type: 'comment'
    };
    
    // Aggiungi ai commenti esistenti o crea nuovo array
    const comments = task.comments || [];
    comments.push(newComment);
    
    const updates = {
      comments: comments,
      updatedAt: new Date().toISOString()
    };
    
    await taskService.update(taskId, updates);
    
    return {
      success: true,
      message: 'Commento aggiunto',
      data: newComment
    };
    
  } catch (error) {
    console.error('❌ [tasks.js] Error adding comment:', error);
    return {
      success: false,
      error: error.message || 'Errore nell\'aggiunta del commento'
    };
  }
};

/**
 * Ottieni statistiche task per utente
 * @param {string} userId - ID utente
 * @returns {Promise<Object>} Statistiche
 */
export const getUserTaskStats = async (userId) => {
  try {
    const tasks = await taskService.getByUser(userId);
    
    const stats = {
      total: tasks.length,
      byStatus: {
        [TASK_STATUS.ASSEGNATO]: tasks.filter(t => t.status === TASK_STATUS.ASSEGNATO).length,
        [TASK_STATUS.IN_CORSO]: tasks.filter(t => t.status === TASK_STATUS.IN_CORSO).length,
        [TASK_STATUS.COMPLETATO]: tasks.filter(t => t.status === TASK_STATUS.COMPLETATO).length,
        [TASK_STATUS.BLOCCATO]: tasks.filter(t => t.status === TASK_STATUS.BLOCCATO).length
      },
      byPriority: {
        [TASK_PRIORITY.ALTA]: tasks.filter(t => t.priority === TASK_PRIORITY.ALTA).length,
        [TASK_PRIORITY.MEDIA]: tasks.filter(t => t.priority === TASK_PRIORITY.MEDIA).length,
        [TASK_PRIORITY.BASSA]: tasks.filter(t => t.priority === TASK_PRIORITY.BASSA).length
      },
      completedThisWeek: tasks.filter(t => 
        t.status === TASK_STATUS.COMPLETATO && 
        isThisWeek(t.completedAt)
      ).length,
      overdue: tasks.filter(t => 
        t.status !== TASK_STATUS.COMPLETATO && 
        checkIfOverdue(t.dueDate, t.status)
      ).length
    };
    
    // Calcola percentuale completamento
    stats.completionRate = stats.total > 0 
      ? Math.round((stats.byStatus[TASK_STATUS.COMPLETATO] / stats.total) * 100)
      : 0;
    
    // Calcola tempo medio completamento (in giorni)
    const completedTasks = tasks.filter(t => t.status === TASK_STATUS.COMPLETATO);
    if (completedTasks.length > 0) {
      const totalDays = completedTasks.reduce((sum, task) => {
        if (task.createdAt && task.completedAt) {
          const created = new Date(task.createdAt);
          const completed = new Date(task.completedAt);
          const days = (completed - created) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      
      stats.averageCompletionTime = Math.round(totalDays / completedTasks.length);
    } else {
      stats.averageCompletionTime = 0;
    }
    
    return {
      success: true,
      data: stats
    };
    
  } catch (error) {
    console.error('❌ [tasks.js] Error getting user stats:', error);
    return {
      success: false,
      error: error.message || 'Errore nel calcolo delle statistiche',
      data: {
        total: 0,
        byStatus: {},
        byPriority: {},
        completionRate: 0,
        completedThisWeek: 0,
        overdue: 0,
        averageCompletionTime: 0
      }
    };
  }
};

/**
 * Cerca task per testo
 * @param {string} userId - ID utente
 * @param {string} searchText - Testo da cercare
 * @returns {Promise<Array>} Task trovati
 */
export const searchTasks = async (userId, searchText) => {
  try {
    const tasks = await taskService.getByUser(userId);
    
    const searchLower = searchText.toLowerCase();
    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
    
    return {
      success: true,
      data: filtered,
      count: filtered.length
    };
    
  } catch (error) {
    console.error('❌ [tasks.js] Error searching tasks:', error);
    return {
      success: false,
      error: error.message || 'Errore nella ricerca',
      data: []
    };
  }
};

// Funzioni di utility
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function checkIfOverdue(dueDate, status) {
  if (!dueDate || status === TASK_STATUS.COMPLETATO) return false;
  
  const today = new Date();
  const due = new Date(dueDate);
  
  // Rimuovi la parte dell'ora per confrontare solo le date
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  return due < today;
}

function isThisWeek(dateString) {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Inizio della settimana (lunedì)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // +1 perché 0=domenica
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Fine della settimana (domenica)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
}

// Esporta tutte le funzioni
export default {
  getUserTasks,
  updateTaskStatus,
  updateTaskProgress,
  addTaskComment,
  getUserTaskStats,
  searchTasks
};