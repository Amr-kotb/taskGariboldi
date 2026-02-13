// Definizione delle collections Firestore per l'applicazione
export const COLLECTIONS = {
  // Messaggi tra utenti (dipendente-dipendente o dipendente-admin)
  MESSAGES: 'messages',
  
  // Notifiche di sistema (admin -> dipendenti, sistema -> utenti)
  NOTIFICATIONS: 'notifications',
  
  // Utenti dell'applicazione
  USERS: 'users',
  
  // Task/attività
  TASKS: 'tasks',
  
  // Cronologia attività
  HISTORY: 'history',
  
  // Cestino (elementi eliminati)
  TRASH: 'trash',
};

// Tipi di messaggi
export const MESSAGE_TYPES = {
  MESSAGE: 'message',        // Messaggio normale tra utenti
  NOTIFICATION: 'notification', // Notifica di sistema/admin
  TASK_ASSIGNMENT: 'task_assignment', // Assegnazione task
  TASK_UPDATE: 'task_update', // Aggiornamento task
  SYSTEM_ALERT: 'system_alert', // Allerta di sistema
};

// Priorità delle notifiche
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',        // Priorità bassa (verde)
  MEDIUM: 'medium',  // Priorità media (giallo/arancione)
  HIGH: 'high',      // Priorità alta (rosso)
  URGENT: 'urgent',  // Urgente (rosso scuro)
};

// Stati di lettura
export const READ_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  ARCHIVED: 'archived',
};

// Ruoli utente (coerenti con quelli esistenti)
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'dipendente',
  MANAGER: 'manager',
  GUEST: 'guest',
};