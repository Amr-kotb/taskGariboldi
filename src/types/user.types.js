/**
 * TypeScript types per Utenti TaskGariboldi
 */

/**
 * @typedef {Object} User
 * @property {string} id - ID univoco utente (corrisponde a Firebase Auth UID)
 * @property {string} email - Email utente
 * @property {string} name - Nome completo
 * @property {UserRole} role - Ruolo utente
 * @property {UserDepartment} department - Dipartimento
 * @property {string} [avatar] - URL immagine profilo
 * @property {string} [phone] - Numero telefono
 * @property {string} [bio] - Biografia/descrizione
 * @property {boolean} isActive - Stato attivo/inattivo
 * @property {Date|string} createdAt - Data creazione account
 * @property {Date|string} updatedAt - Data ultimo aggiornamento
 * @property {Date|string} lastLoginAt - Data ultimo login
 * @property {UserStats} [stats] - Statistiche utente (popolate dinamicamente)
 */

/**
 * @typedef {'admin' | 'dipendente'} UserRole
 */

/**
 * @typedef {'generale' | 'sviluppo' | 'marketing' | 'vendite' | 'amministrazione' | 'supporto'} UserDepartment
 */

/**
 * @typedef {Object} UserStats
 * @property {number} totalTasks - Task totali assegnati
 * @property {number} completedTasks - Task completati
 * @property {number} inProgressTasks - Task in corso
 * @property {number} pendingTasks - Task in attesa
 * @property {number} completionRate - Percentuale completamento
 * @property {number} overdueTasks - Task in ritardo
 * @property {number} efficiencyScore - Punteggio efficienza (0-100)
 * @property {Object.<string, number>} byPriority - Task per priorità
 * @property {number} averageCompletionTime - Tempo medio completamento (giorni)
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name - Nome utente
 * @property {string} [avatar] - URL avatar
 * @property {UserDepartment} [department] - Dipartimento
 * @property {string} [phone] - Telefono
 * @property {string} [bio] - Biografia
 */

/**
 * @typedef {Object} UserActivity
 * @property {string} id - ID attività
 * @property {string} userId - ID utente
 * @property {string} action - Tipo azione
 * @property {string} description - Descrizione attività
 * @property {Date|string} timestamp - Data attività
 * @property {Object} [details] - Dettagli aggiuntivi
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email - Email utente
 * @property {string} password - Password
 */

/**
 * @typedef {Object} RegisterData
 * @property {string} email - Email
 * @property {string} password - Password
 * @property {string} name - Nome completo
 * @property {UserRole} [role] - Ruolo (default: 'dipendente')
 * @property {UserDepartment} [department] - Dipartimento
 */

/**
 * @typedef {Object} PasswordChangeData
 * @property {string} currentPassword - Password attuale
 * @property {string} newPassword - Nuova password
 * @property {string} confirmPassword - Conferma nuova password
 */

// Export types for JavaScript usage
export const UserTypes = {
  ROLES: {
    ADMIN: 'admin',
    DIPENDENTE: 'dipendente'
  },
  
  DEPARTMENTS: {
    GENERALE: 'generale',
    SVILUPPO: 'sviluppo',
    MARKETING: 'marketing',
    VENDITE: 'vendite',
    AMMINISTRAZIONE: 'amministrazione',
    SUPPORTO: 'supporto'
  },
  
  // Nomi fissi dei 4 dipendenti
  EMPLOYEE_NAMES: {
    LEONARDO: 'Leonardo',
    ANDREA: 'Andrea',
    DOMENICO: 'Domenico',
    STEFANO: 'Stefano'
  }
};

// Helper functions
export function isValidRole(role) {
  return Object.values(UserTypes.ROLES).includes(role);
}

export function isValidDepartment(department) {
  return Object.values(UserTypes.DEPARTMENTS).includes(department);
}

export function isEmployeeName(name) {
  return Object.values(UserTypes.EMPLOYEE_NAMES).includes(name);
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export default UserTypes;