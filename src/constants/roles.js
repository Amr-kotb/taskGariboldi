/**
 * Definizione ruoli e permessi per TaskGariboldi
 * Team di 5 persone: 1 admin + 4 dipendenti
 */

/**
 * Ruoli disponibili nel sistema
 */
export const ROLES = {
  ADMIN: 'admin',
  DIPENDENTE: 'dipendente'
};

/**
 * Nomi visualizzati per i ruoli
 */
export const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Amministratore',
  [ROLES.DIPENDENTE]: 'Dipendente'
};

/**
 * Icone per i ruoli
 */
export const ROLE_ICONS = {
  [ROLES.ADMIN]: 'fa-crown',
  [ROLES.DIPENDENTE]: 'fa-user'
};

/**
 * Colori per i ruoli
 */
export const ROLE_COLORS = {
  [ROLES.ADMIN]: '#f59e0b', // arancione
  [ROLES.DIPENDENTE]: '#3b82f6' // blu
};

/**
 * Descrizioni dei ruoli
 */
export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Accesso completo a tutte le funzionalità. Può gestire utenti, task e impostazioni.',
  [ROLES.DIPENDENTE]: 'Può vedere e gestire solo i task assegnati a sé stesso. Accesso limitato alle funzionalità.'
};

/**
 * Permessi per ruolo
 * true = permesso, false = negato
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    // Dashboard
    viewAdminDashboard: true,
    viewEmployeeDashboard: true,
    
    // Task
    createTask: true,
    editAnyTask: true,
    deleteAnyTask: true,
    viewAllTasks: true,
    assignTask: true,
    changeTaskStatus: true,
    
    // Utenti
    viewAllUsers: true,
    createUser: true,
    editUser: true,
    deleteUser: true,
    changeUserRole: true,
    
    // Statistiche
    viewStatistics: true,
    exportData: true,
    
    // Storico
    viewGlobalHistory: true,
    viewPersonalHistory: true,
    
    // Cestino
    viewGlobalTrash: true,
    restoreAnyTask: true,
    deletePermanently: true,
    
    // Impostazioni
    changeSettings: true,
    manageSystem: true,
    
    // Profile
    editOwnProfile: true,
    viewOwnProfile: true
  },
  
  [ROLES.DIPENDENTE]: {
    // Dashboard
    viewAdminDashboard: false,
    viewEmployeeDashboard: true,
    
    // Task
    createTask: false, // Solo admin può creare task
    editAnyTask: false,
    editOwnTask: true, // Può modificare solo i propri task
    deleteAnyTask: false,
    deleteOwnTask: false, // Solo soft delete tramite admin
    viewAllTasks: false,
    viewOwnTasks: true,
    assignTask: false,
    changeTaskStatus: true, // Può cambiare stato dei propri task
    
    // Utenti
    viewAllUsers: false,
    viewOwnProfile: true,
    editOwnProfile: true,
    editOtherUsers: false,
    
    // Statistiche
    viewStatistics: false,
    viewOwnStatistics: true,
    exportData: false,
    
    // Storico
    viewGlobalHistory: false,
    viewPersonalHistory: true,
    
    // Cestino
    viewGlobalTrash: false,
    viewOwnTrash: true,
    restoreOwnTask: true,
    deletePermanently: false,
    
    // Impostazioni
    changeSettings: false,
    manageSystem: false
  }
};

/**
 * Lista di nomi dei dipendenti fissi
 */
export const EMPLOYEE_NAMES = {
  LEONARDO: 'Leonardo',
  ANDREA: 'Andrea', 
  DOMENICO: 'Domenico',
  STEFANO: 'Stefano'
};

/**
 * Dipartimenti disponibili
 */
export const DEPARTMENTS = {
  GENERALE: 'generale',
  SVILUPPO: 'sviluppo',
  MARKETING: 'marketing',
  VENDITE: 'vendite',
  AMMINISTRAZIONE: 'amministrazione',
  SUPPORTO: 'supporto'
};

/**
 * Nomi visualizzati per dipartimenti
 */
export const DEPARTMENT_NAMES = {
  [DEPARTMENTS.GENERALE]: 'Generale',
  [DEPARTMENTS.SVILUPPO]: 'Sviluppo',
  [DEPARTMENTS.MARKETING]: 'Marketing',
  [DEPARTMENTS.VENDITE]: 'Vendite',
  [DEPARTMENTS.AMMINISTRAZIONE]: 'Amministrazione',
  [DEPARTMENTS.SUPPORTO]: 'Supporto'
};

/**
 * Icone per dipartimenti
 */
export const DEPARTMENT_ICONS = {
  [DEPARTMENTS.GENERALE]: 'fa-building',
  [DEPARTMENTS.SVILUPPO]: 'fa-code',
  [DEPARTMENTS.MARKETING]: 'fa-bullhorn',
  [DEPARTMENTS.VENDITE]: 'fa-chart-line',
  [DEPARTMENTS.AMMINISTRAZIONE]: 'fa-file-invoice-dollar',
  [DEPARTMENTS.SUPPORTO]: 'fa-headset'
};

/**
 * Colori per dipartimenti
 */
export const DEPARTMENT_COLORS = {
  [DEPARTMENTS.GENERALE]: '#6b7280',
  [DEPARTMENTS.SVILUPPO]: '#3b82f6',
  [DEPARTMENTS.MARKETING]: '#8b5cf6',
  [DEPARTMENTS.VENDITE]: '#10b981',
  [DEPARTMENTS.AMMINISTRAZIONE]: '#f59e0b',
  [DEPARTMENTS.SUPPORTO]: '#ef4444'
};

/**
 * Verifica se un utente ha un determinato permesso
 * @param {string} role - Ruolo dell'utente
 * @param {string} permission - Permesso da verificare
 * @returns {boolean} - true se ha il permesso
 */
export function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  
  // Cerca permesso specifico
  if (ROLE_PERMISSIONS[role][permission] !== undefined) {
    return ROLE_PERMISSIONS[role][permission];
  }
  
  // Fallback: admin ha tutti i permessi, dipendente no
  return role === ROLES.ADMIN;
}

/**
 * Ottieni tutti i permessi per un ruolo
 * @param {string} role - Ruolo
 * @returns {Object} - Oggetto con tutti i permessi
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || {};
}

/**
 * Ottieni nome visualizzato per un ruolo
 * @param {string} role - Ruolo
 * @returns {string} - Nome visualizzato
 */
export function getRoleName(role) {
  return ROLE_NAMES[role] || 'Ruolo sconosciuto';
}

/**
 * Ottieni icona per un ruolo
 * @param {string} role - Ruolo
 * @returns {string} - Classe icona FontAwesome
 */
export function getRoleIcon(role) {
  return ROLE_ICONS[role] || 'fa-user';
}

/**
 * Ottieni colore per un ruolo
 * @param {string} role - Ruolo
 * @returns {string} - Codice colore CSS
 */
export function getRoleColor(role) {
  return ROLE_COLORS[role] || '#6b7280';
}

/**
 * Ottieni descrizione per un ruolo
 * @param {string} role - Ruolo
 * @returns {string} - Descrizione
 */
export function getRoleDescription(role) {
  return ROLE_DESCRIPTIONS[role] || 'Ruolo non configurato';
}

/**
 * Ottieni nome visualizzato per un dipartimento
 * @param {string} department - Dipartimento
 * @returns {string} - Nome visualizzato
 */
export function getDepartmentName(department) {
  return DEPARTMENT_NAMES[department] || 'Non specificato';
}

/**
 * Ottieni icona per un dipartimento
 * @param {string} department - Dipartimento
 * @returns {string} - Classe icona FontAwesome
 */
export function getDepartmentIcon(department) {
  return DEPARTMENT_ICONS[department] || 'fa-building';
}

/**
 * Ottieni colore per un dipartimento
 * @param {string} department - Dipartimento
 * @returns {string} - Codice colore CSS
 */
export function getDepartmentColor(department) {
  return DEPARTMENT_COLORS[department] || '#6b7280';
}

/**
 * Verifica se un ruolo è valido
 * @param {string} role - Ruolo da verificare
 * @returns {boolean} - true se valido
 */
export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

/**
 * Verifica se un dipartimento è valido
 * @param {string} department - Dipartimento da verificare
 * @returns {boolean} - true se valido
 */
export function isValidDepartment(department) {
  return Object.values(DEPARTMENTS).includes(department);
}

/**
 * Lista di tutti i ruoli per select dropdown
 */
export const ROLE_OPTIONS = Object.values(ROLES).map(role => ({
  value: role,
  label: getRoleName(role),
  icon: getRoleIcon(role),
  color: getRoleColor(role)
}));

/**
 * Lista di tutti i dipartimenti per select dropdown
 */
export const DEPARTMENT_OPTIONS = Object.values(DEPARTMENTS).map(department => ({
  value: department,
  label: getDepartmentName(department),
  icon: getDepartmentIcon(department),
  color: getDepartmentColor(department)
}));

/**
 * Configurazione team (fissa per 5 persone)
 */
export const TEAM_CONFIG = {
  MAX_USERS: 5,
  ADMIN_COUNT: 1,
  EMPLOYEE_COUNT: 4,
  EMPLOYEE_NAMES: Object.values(EMPLOYEE_NAMES)
};

// Esporta tutto
export default {
  ROLES,
  ROLE_NAMES,
  ROLE_ICONS,
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  EMPLOYEE_NAMES,
  DEPARTMENTS,
  DEPARTMENT_NAMES,
  DEPARTMENT_ICONS,
  DEPARTMENT_COLORS,
  hasPermission,
  getRolePermissions,
  getRoleName,
  getRoleIcon,
  getRoleColor,
  getRoleDescription,
  getDepartmentName,
  getDepartmentIcon,
  getDepartmentColor,
  isValidRole,
  isValidDepartment,
  ROLE_OPTIONS,
  DEPARTMENT_OPTIONS,
  TEAM_CONFIG
};