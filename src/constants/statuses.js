/**
 * Definizione stati e priorità per TaskGariboldi
 */

/**
 * Stati dei task
 */
export const TASK_STATUS = {
  ASSEGNATO: 'assegnato',
  IN_CORSO: 'in corso',
  COMPLETATO: 'completato',
  BLOCCATO: 'bloccato'
};

/**
 * Nomi visualizzati per stati
 */
export const STATUS_NAMES = {
  [TASK_STATUS.ASSEGNATO]: 'Assegnato',
  [TASK_STATUS.IN_CORSO]: 'In Corso',
  [TASK_STATUS.COMPLETATO]: 'Completato',
  [TASK_STATUS.BLOCCATO]: 'Bloccato'
};

/**
 * Descrizioni degli stati
 */
export const STATUS_DESCRIPTIONS = {
  [TASK_STATUS.ASSEGNATO]: 'Task assegnato ma non ancora iniziato',
  [TASK_STATUS.IN_CORSO]: 'Task in fase di lavorazione',
  [TASK_STATUS.COMPLETATO]: 'Task completato con successo',
  [TASK_STATUS.BLOCCATO]: 'Task bloccato, richiede intervento'
};

/**
 * Icone per stati
 */
export const STATUS_ICONS = {
  [TASK_STATUS.ASSEGNATO]: 'fa-clock',
  [TASK_STATUS.IN_CORSO]: 'fa-spinner',
  [TASK_STATUS.COMPLETATO]: 'fa-check-circle',
  [TASK_STATUS.BLOCCATO]: 'fa-exclamation-triangle'
};

/**
 * Colori per stati
 */
export const STATUS_COLORS = {
  [TASK_STATUS.ASSEGNATO]: '#6b7280', // grigio
  [TASK_STATUS.IN_CORSO]: '#3b82f6',  // blu
  [TASK_STATUS.COMPLETATO]: '#10b981', // verde
  [TASK_STATUS.BLOCCATO]: '#ef4444'   // rosso
};

/**
 * Progresso di default per stato
 */
export const STATUS_PROGRESS = {
  [TASK_STATUS.ASSEGNATO]: 0,
  [TASK_STATUS.IN_CORSO]: 50,
  [TASK_STATUS.COMPLETATO]: 100,
  [TASK_STATUS.BLOCCATO]: 0
};

/**
 * Priorità dei task
 */
export const TASK_PRIORITY = {
  BASSA: 'bassa',
  MEDIA: 'media',
  ALTA: 'alta'
};

/**
 * Nomi visualizzati per priorità
 */
export const PRIORITY_NAMES = {
  [TASK_PRIORITY.BASSA]: 'Bassa',
  [TASK_PRIORITY.MEDIA]: 'Media',
  [TASK_PRIORITY.ALTA]: 'Alta'
};

/**
 * Descrizioni priorità
 */
export const PRIORITY_DESCRIPTIONS = {
  [TASK_PRIORITY.BASSA]: 'Task a bassa priorità, può essere completato quando possibile',
  [TASK_PRIORITY.MEDIA]: 'Task a priorità media, completare entro i tempi previsti',
  [TASK_PRIORITY.ALTA]: 'Task ad alta priorità, completare il prima possibile'
};

/**
 * Icone per priorità
 */
export const PRIORITY_ICONS = {
  [TASK_PRIORITY.BASSA]: 'fa-arrow-down',
  [TASK_PRIORITY.MEDIA]: 'fa-minus',
  [TASK_PRIORITY.ALTA]: 'fa-arrow-up'
};

/**
 * Colori per priorità
 */
export const PRIORITY_COLORS = {
  [TASK_PRIORITY.BASSA]: '#10b981', // verde
  [TASK_PRIORITY.MEDIA]: '#f59e0b', // arancione
  [TASK_PRIORITY.ALTA]: '#ef4444'   // rosso
};

/**
 * Categorie task
 */
export const TASK_CATEGORIES = {
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
};

/**
 * Nomi visualizzati per categorie
 */
export const CATEGORY_NAMES = {
  [TASK_CATEGORIES.GENERALE]: 'Generale',
  [TASK_CATEGORIES.AMMINISTRAZIONE]: 'Amministrazione',
  [TASK_CATEGORIES.SVILUPPO]: 'Sviluppo',
  [TASK_CATEGORIES.MARKETING]: 'Marketing',
  [TASK_CATEGORIES.VENDITE]: 'Vendite',
  [TASK_CATEGORIES.SUPPORTO]: 'Supporto',
  [TASK_CATEGORIES.RIUNIONE]: 'Riunione',
  [TASK_CATEGORIES.DOCUMENTAZIONE]: 'Documentazione',
  [TASK_CATEGORIES.MANUTENZIONE]: 'Manutenzione',
  [TASK_CATEGORIES.EMERGENZA]: 'Emergenza'
};

/**
 * Icone per categorie
 */
export const CATEGORY_ICONS = {
  [TASK_CATEGORIES.GENERALE]: 'fa-tasks',
  [TASK_CATEGORIES.AMMINISTRAZIONE]: 'fa-file-invoice-dollar',
  [TASK_CATEGORIES.SVILUPPO]: 'fa-code',
  [TASK_CATEGORIES.MARKETING]: 'fa-bullhorn',
  [TASK_CATEGORIES.VENDITE]: 'fa-chart-line',
  [TASK_CATEGORIES.SUPPORTO]: 'fa-headset',
  [TASK_CATEGORIES.RIUNIONE]: 'fa-users',
  [TASK_CATEGORIES.DOCUMENTAZIONE]: 'fa-file-alt',
  [TASK_CATEGORIES.MANUTENZIONE]: 'fa-tools',
  [TASK_CATEGORIES.EMERGENZA]: 'fa-exclamation-triangle'
};

/**
 * Colori per categorie
 */
export const CATEGORY_COLORS = {
  [TASK_CATEGORIES.GENERALE]: '#6b7280',
  [TASK_CATEGORIES.AMMINISTRAZIONE]: '#f59e0b',
  [TASK_CATEGORIES.SVILUPPO]: '#3b82f6',
  [TASK_CATEGORIES.MARKETING]: '#8b5cf6',
  [TASK_CATEGORIES.VENDITE]: '#10b981',
  [TASK_CATEGORIES.SUPPORTO]: '#ef4444',
  [TASK_CATEGORIES.RIUNIONE]: '#ec4899',
  [TASK_CATEGORIES.DOCUMENTAZIONE]: '#6366f1',
  [TASK_CATEGORIES.MANUTENZIONE]: '#14b8a6',
  [TASK_CATEGORIES.EMERGENZA]: '#dc2626'
};

/**
 * Ordine degli stati (per workflow)
 */
export const STATUS_ORDER = [
  TASK_STATUS.ASSEGNATO,
  TASK_STATUS.IN_CORSO,
  TASK_STATUS.COMPLETATO,
  TASK_STATUS.BLOCCATO
];

/**
 * Stati che possono essere impostati da un dipendente
 */
export const EMPLOYEE_ALLOWED_STATUSES = [
  TASK_STATUS.IN_CORSO,
  TASK_STATUS.COMPLETATO,
  TASK_STATUS.BLOCCATO
];

/**
 * Stati che possono essere impostati da admin
 */
export const ADMIN_ALLOWED_STATUSES = Object.values(TASK_STATUS);

/**
 * Stati che indicano task attivi (non completati)
 */
export const ACTIVE_STATUSES = [
  TASK_STATUS.ASSEGNATO,
  TASK_STATUS.IN_CORSO,
  TASK_STATUS.BLOCCATO
];

/**
 * Stati che indicano task completati
 */
export const COMPLETED_STATUSES = [
  TASK_STATUS.COMPLETATO
];

/**
 * Verifica se uno stato è valido
 * @param {string} status - Stato da verificare
 * @returns {boolean} - true se valido
 */
export function isValidStatus(status) {
  return Object.values(TASK_STATUS).includes(status);
}

/**
 * Verifica se una priorità è valida
 * @param {string} priority - Priorità da verificare
 * @returns {boolean} - true se valida
 */
export function isValidPriority(priority) {
  return Object.values(TASK_PRIORITY).includes(priority);
}

/**
 * Verifica se una categoria è valida
 * @param {string} category - Categoria da verificare
 * @returns {boolean} - true se valida
 */
export function isValidCategory(category) {
  return Object.values(TASK_CATEGORIES).includes(category);
}

/**
 * Ottieni nome visualizzato per stato
 * @param {string} status - Stato
 * @returns {string} - Nome visualizzato
 */
export function getStatusName(status) {
  return STATUS_NAMES[status] || 'Sconosciuto';
}

/**
 * Ottieni icona per stato
 * @param {string} status - Stato
 * @returns {string} - Classe icona FontAwesome
 */
export function getStatusIcon(status) {
  return STATUS_ICONS[status] || 'fa-question';
}

/**
 * Ottieni colore per stato
 * @param {string} status - Stato
 * @returns {string} - Codice colore CSS
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status] || '#6b7280';
}

/**
 * Ottieni progresso di default per stato
 * @param {string} status - Stato
 * @returns {number} - Progresso (0-100)
 */
export function getStatusProgress(status) {
  return STATUS_PROGRESS[status] || 0;
}

/**
 * Ottieni nome visualizzato per priorità
 * @param {string} priority - Priorità
 * @returns {string} - Nome visualizzato
 */
export function getPriorityName(priority) {
  return PRIORITY_NAMES[priority] || 'Non definita';
}

/**
 * Ottieni icona per priorità
 * @param {string} priority - Priorità
 * @returns {string} - Classe icona FontAwesome
 */
export function getPriorityIcon(priority) {
  return PRIORITY_ICONS[priority] || 'fa-minus';
}

/**
 * Ottieni colore per priorità
 * @param {string} priority - Priorità
 * @returns {string} - Codice colore CSS
 */
export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] || '#6b7280';
}

/**
 * Ottieni nome visualizzato per categoria
 * @param {string} category - Categoria
 * @returns {string} - Nome visualizzato
 */
export function getCategoryName(category) {
  return CATEGORY_NAMES[category] || 'Generale';
}

/**
 * Ottieni icona per categoria
 * @param {string} category - Categoria
 * @returns {string} - Classe icona FontAwesome
 */
export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || 'fa-tasks';
}

/**
 * Ottieni colore per categoria
 * @param {string} category - Categoria
 * @returns {string} - Codice colore CSS
 */
export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#6b7280';
}

/**
 * Verifica se un utente può impostare uno stato
 * @param {string} role - Ruolo utente
 * @param {string} status - Stato da impostare
 * @returns {boolean} - true se può impostarlo
 */
export function canSetStatus(role, status) {
  if (role === 'admin') {
    return ADMIN_ALLOWED_STATUSES.includes(status);
  }
  
  if (role === 'dipendente') {
    return EMPLOYEE_ALLOWED_STATUSES.includes(status);
  }
  
  return false;
}

/**
 * Prossimo stato logico in base a stato corrente
 * @param {string} currentStatus - Stato corrente
 * @returns {Array} - Possibili stati successivi
 */
export function getNextPossibleStatuses(currentStatus) {
  const workflow = {
    [TASK_STATUS.ASSEGNATO]: [TASK_STATUS.IN_CORSO, TASK_STATUS.BLOCCATO],
    [TASK_STATUS.IN_CORSO]: [TASK_STATUS.COMPLETATO, TASK_STATUS.BLOCCATO],
    [TASK_STATUS.COMPLETATO]: [TASK_STATUS.IN_CORSO],
    [TASK_STATUS.BLOCCATO]: [TASK_STATUS.IN_CORSO, TASK_STATUS.ASSEGNATO]
  };
  
  return workflow[currentStatus] || [];
}

/**
 * Lista di tutti gli stati per select dropdown
 */
export const STATUS_OPTIONS = Object.values(TASK_STATUS).map(status => ({
  value: status,
  label: getStatusName(status),
  icon: getStatusIcon(status),
  color: getStatusColor(status),
  description: STATUS_DESCRIPTIONS[status]
}));

/**
 * Lista di tutte le priorità per select dropdown
 */
export const PRIORITY_OPTIONS = Object.values(TASK_PRIORITY).map(priority => ({
  value: priority,
  label: getPriorityName(priority),
  icon: getPriorityIcon(priority),
  color: getPriorityColor(priority),
  description: PRIORITY_DESCRIPTIONS[priority]
}));

/**
 * Lista di tutte le categorie per select dropdown
 */
export const CATEGORY_OPTIONS = Object.values(TASK_CATEGORIES).map(category => ({
  value: category,
  label: getCategoryName(category),
  icon: getCategoryIcon(category),
  color: getCategoryColor(category)
}));

// Esporta tutto
export default {
  TASK_STATUS,
  STATUS_NAMES,
  STATUS_DESCRIPTIONS,
  STATUS_ICONS,
  STATUS_COLORS,
  STATUS_PROGRESS,
  TASK_PRIORITY,
  PRIORITY_NAMES,
  PRIORITY_DESCRIPTIONS,
  PRIORITY_ICONS,
  PRIORITY_COLORS,
  TASK_CATEGORIES,
  CATEGORY_NAMES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  STATUS_ORDER,
  EMPLOYEE_ALLOWED_STATUSES,
  ADMIN_ALLOWED_STATUSES,
  ACTIVE_STATUSES,
  COMPLETED_STATUSES,
  isValidStatus,
  isValidPriority,
  isValidCategory,
  getStatusName,
  getStatusIcon,
  getStatusColor,
  getStatusProgress,
  getPriorityName,
  getPriorityIcon,
  getPriorityColor,
  getCategoryName,
  getCategoryIcon,
  getCategoryColor,
  canSetStatus,
  getNextPossibleStatuses,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS
};