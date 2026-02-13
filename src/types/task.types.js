/**
 * TypeScript types per TaskGariboldi
 * Se non usi TypeScript, questi sono utili per JSDoc e autocompletamento
 */

/**
 * @typedef {Object} Task
 * @property {string} id - ID univoco del task
 * @property {string} title - Titolo del task
 * @property {string} description - Descrizione dettagliata
 * @property {TaskStatus} status - Stato corrente del task
 * @property {TaskPriority} priority - Priorità del task
 * @property {TaskCategory} [category] - Categoria del task
 * @property {string} assignedTo - ID utente assegnato
 * @property {string} [assignedToName] - Nome utente assegnato (popolato dal frontend)
 * @property {string} createdBy - ID utente che ha creato il task
 * @property {string} [createdByName] - Nome creatore (popolato dal frontend)
 * @property {Date|string} createdAt - Data creazione
 * @property {Date|string} updatedAt - Data ultimo aggiornamento
 * @property {Date|string} [dueDate] - Data scadenza
 * @property {Date|string} [completedAt] - Data completamento
 * @property {Date|string} [startedAt] - Data inizio lavorazione
 * @property {Date|string} [deletedAt] - Data eliminazione (soft delete)
 * @property {number} [progress] - Progresso 0-100
 * @property {boolean} [deleted] - Flag eliminazione soft
 * @property {string} [deletedReason] - Motivo eliminazione
 * @property {Array<string>} [tags] - Tag per categorizzazione
 * @property {Array<TaskComment>} [comments] - Commenti sul task
 * @property {Array<TaskAttachment>} [attachments] - Allegati al task
 */

/**
 * @typedef {'assegnato' | 'in corso' | 'completato' | 'bloccato'} TaskStatus
 */

/**
 * @typedef {'bassa' | 'media' | 'alta'} TaskPriority
 */

/**
 * @typedef {'generale' | 'amministrazione' | 'sviluppo' | 'marketing' | 'vendite' | 'supporto' | 'riunione' | 'documentazione' | 'manutenzione' | 'emergenza'} TaskCategory
 */

/**
 * @typedef {Object} TaskComment
 * @property {string} id - ID commento
 * @property {string} taskId - ID task associato
 * @property {string} userId - ID utente che ha commentato
 * @property {string} userName - Nome utente che ha commentato
 * @property {string} text - Testo del commento
 * @property {Date|string} timestamp - Data commento
 * @property {string} [type] - Tipo commento (default: 'comment')
 */

/**
 * @typedef {Object} TaskAttachment
 * @property {string} id - ID allegato
 * @property {string} taskId - ID task associato
 * @property {string} name - Nome file originale
 * @property {string} url - URL download file
 * @property {string} path - Percorso storage
 * @property {string} type - Tipo MIME file
 * @property {number} size - Dimensione in bytes
 * @property {string} uploadedBy - ID utente che ha caricato
 * @property {Date|string} uploadedAt - Data upload
 */

/**
 * @typedef {Object} TaskFilter
 * @property {TaskStatus} [status] - Filtro per stato
 * @property {TaskPriority} [priority] - Filtro per priorità
 * @property {TaskCategory} [category] - Filtro per categoria
 * @property {string} [assignedTo] - Filtro per utente assegnato
 * @property {Date} [startDate] - Data inizio range
 * @property {Date} [endDate] - Data fine range
 * @property {string} [search] - Testo di ricerca
 */

/**
 * @typedef {Object} TaskStats
 * @property {number} total - Totale task
 * @property {Object.<TaskStatus, number>} byStatus - Conteggio per stato
 * @property {Object.<TaskPriority, number>} byPriority - Conteggio per priorità
 * @property {number} completionRate - Percentuale completamento
 * @property {number} overdue - Task in ritardo
 * @property {number} averageCompletionTime - Tempo medio completamento (giorni)
 */

/**
 * @typedef {Object} TaskActivity
 * @property {string} id - ID attività
 * @property {string} action - Tipo azione (task_created, task_updated, etc.)
 * @property {string} description - Descrizione attività
 * @property {string} userId - ID utente che ha eseguito l'azione
 * @property {string} userName - Nome utente
 * @property {string} taskId - ID task associato
 * @property {string} [taskTitle] - Titolo task (popolato dal frontend)
 * @property {Date|string} timestamp - Data attività
 * @property {Object} [details] - Dettagli aggiuntivi
 */

/**
 * @typedef {Object} TaskFormData
 * @property {string} title - Titolo task
 * @property {string} description - Descrizione task
 * @property {TaskPriority} priority - Priorità task
 * @property {TaskCategory} [category] - Categoria task
 * @property {string} assignedTo - ID utente da assegnare
 * @property {Date|string} [dueDate] - Data scadenza
 * @property {Array<string>} [tags] - Tag task
 */

// Export types for JavaScript usage
export const TaskTypes = {
  STATUS: {
    ASSEGNATO: 'assegnato',
    IN_CORSO: 'in corso',
    COMPLETATO: 'completato',
    BLOCCATO: 'bloccato'
  },
  
  PRIORITY: {
    BASSA: 'bassa',
    MEDIA: 'media',
    ALTA: 'alta'
  },
  
  CATEGORY: {
    GENERALE: 'generale',
    AMMINISTRAZIONE: 'amministrazione',
    SVILUPPO: 'sviluppo',
    MARKETING: 'marketing',
    VENDITE: 'vendite',
    SUPPORTO: 'supporto',
    RIUNIONE: 'riunione',
    DOCUMENTAZIONE: 'documentazione',
    MANUTENZIONE: 'manutenzione',
    EMERGENZA: 'emergenza'
  }
};

// Helper functions for TypeScript-like usage in JavaScript
export function isTaskStatus(status) {
  return Object.values(TaskTypes.STATUS).includes(status);
}

export function isTaskPriority(priority) {
  return Object.values(TaskTypes.PRIORITY).includes(priority);
}

export function isTaskCategory(category) {
  return Object.values(TaskTypes.CATEGORY).includes(category);
}

export default TaskTypes;