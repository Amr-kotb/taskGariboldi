/**
 * Utility di formattazione dati per TaskGariboldi
 * Formattazioni specifiche per l'Italia
 */

/**
 * Formatta una data in formato italiano
 * @param {string|Date} date - Data da formattare
 * @param {Object} options - Opzioni di formattazione
 * @returns {string} - Data formattata
 */
export function formatDate(date, options = {}) {
  if (!date) return 'Non definita';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Data non valida';
    }
    
    const defaultOptions = { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    
    return dateObj.toLocaleDateString('it-IT', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Errore formattazione data:', error);
    return 'Errore data';
  }
}

/**
 * Formatta data e ora in formato italiano
 * @param {string|Date} dateTime - Data e ora da formattare
 * @returns {string} - Data e ora formattate
 */
export function formatDateTime(dateTime) {
  if (!dateTime) return 'Non definita';
  
  try {
    const dateObj = dateTime instanceof Date ? dateTime : new Date(dateTime);
    
    if (isNaN(dateObj.getTime())) {
      return 'Data non valida';
    }
    
    return dateObj.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Errore formattazione data/ora:', error);
    return 'Errore data';
  }
}

/**
 * Formatta una data come tempo relativo (es: "2 giorni fa")
 * @param {string|Date} date - Data da formattare
 * @returns {string} - Tempo relativo
 */
export function formatRelativeTime(date) {
  if (!date) return 'Non definita';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Data non valida';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    // Meno di un minuto
    if (diffInSeconds < 60) {
      return 'proprio ora';
    }
    
    // Minuti
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes === 1 ? 'uto' : 'uti'} fa`;
    }
    
    // Ore
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} or${diffInHours === 1 ? 'a' : 'e'} fa`;
    }
    
    // Giorni
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} giorn${diffInDays === 1 ? 'o' : 'i'} fa`;
    }
    
    // Settimane
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} settiman${diffInWeeks === 1 ? 'a' : 'e'} fa`;
    }
    
    // Mesi
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} mes${diffInMonths === 1 ? 'e' : 'i'} fa`;
    }
    
    // Anni
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ann${diffInYears === 1 ? 'o' : 'i'} fa`;
    
  } catch (error) {
    console.error('Errore formattazione tempo relativo:', error);
    return 'Data non valida';
  }
}

/**
 * Formatta la durata in ore e minuti
 * @param {number} minutes - Durata in minuti
 * @returns {string} - Durata formattata
 */
export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'Non definita';
  
  const mins = Number(minutes);
  
  if (isNaN(mins) || mins < 0) {
    return 'Durata non valida';
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  
  return `${hours} h ${remainingMinutes} min`;
}

/**
 * Formatta un numero con separatore migliaia
 * @param {number} number - Numero da formattare
 * @param {number} decimals - Decimali (default: 0)
 * @returns {string} - Numero formattato
 */
export function formatNumber(number, decimals = 0) {
  if (!number && number !== 0) return 'N/A';
  
  const num = Number(number);
  
  if (isNaN(num)) {
    return 'Non valido';
  }
  
  return num.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formatta la percentuale
 * @param {number} value - Valore da formattare (0-100)
 * @param {number} decimals - Decimali (default: 0)
 * @returns {string} - Percentuale formattata
 */
export function formatPercentage(value, decimals = 0) {
  if (!value && value !== 0) return 'N/A';
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return 'Non valido';
  }
  
  return `${num.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`;
}

/**
 * Formatta la priorità in testo italiano
 * @param {string} priority - Priorità (bassa/media/alta)
 * @returns {string} - Priorità formattata
 */
export function formatPriority(priority) {
  const priorities = {
    'bassa': 'Bassa',
    'media': 'Media',
    'alta': 'Alta'
  };
  
  return priorities[priority] || 'Non definita';
}

/**
 * Formatta lo stato in testo italiano
 * @param {string} status - Stato del task
 * @returns {string} - Stato formattato
 */
export function formatStatus(status) {
  const statuses = {
    'assegnato': 'Assegnato',
    'in corso': 'In Corso',
    'completato': 'Completato',
    'bloccato': 'Bloccato'
  };
  
  return statuses[status] || 'Non definito';
}

/**
 * Formatta il ruolo in testo italiano
 * @param {string} role - Ruolo utente
 * @returns {string} - Ruolo formattato
 */
export function formatRole(role) {
  const roles = {
    'admin': 'Amministratore',
    'dipendente': 'Dipendente'
  };
  
  return roles[role] || 'Non definito';
}

/**
 * Formatta il nome del dipartimento
 * @param {string} department - Dipartimento
 * @returns {string} - Dipartimento formattato
 */
export function formatDepartment(department) {
  const departments = {
    'sviluppo': 'Sviluppo',
    'marketing': 'Marketing',
    'vendite': 'Vendite',
    'amministrazione': 'Amministrazione',
    'supporto': 'Supporto',
    'generale': 'Generale'
  };
  
  return departments[department] || 'Non definito';
}

/**
 * Formatta bytes in unità leggibili (KB, MB, GB)
 * @param {number} bytes - Bytes da formattare
 * @returns {string} - Dimensione formattata
 */
export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return 'N/A';
  
  const b = Number(bytes);
  
  if (isNaN(b) || b < 0) {
    return 'Non valido';
  }
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = b;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Formatta il nome utente (capitalizza prima lettera)
 * @param {string} name - Nome utente
 * @returns {string} - Nome formattato
 */
export function formatUserName(name) {
  if (!name || typeof name !== 'string') return 'Utente';
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formatta l'email per display (maschera parte)
 * @param {string} email - Email completa
 * @returns {string} - Email mascherata
 */
export function formatEmailForDisplay(email) {
  if (!email || typeof email !== 'string') return '';
  
  const [username, domain] = email.split('@');
  
  if (!username || !domain) return email;
  
  const maskedUsername = username.length > 3 
    ? username.substring(0, 3) + '***'
    : '***';
  
  return `${maskedUsername}@${domain}`;
}

/**
 * Formatta i dati per export CSV/Excel
 * @param {Array} data - Dati da formattare
 * @param {Array} columns - Colonne da includere
 * @returns {Array} - Dati formattati
 */
export function formatForExport(data, columns = []) {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => {
    const formatted = {};
    
    columns.forEach(col => {
      if (item[col.key] !== undefined) {
        formatted[col.label] = item[col.key];
      }
    });
    
    return formatted;
  });
}

/**
 * Formatta il colore in base alla priorità
 * @param {string} priority - Priorità
 * @returns {string} - Codice colore CSS
 */
export function getPriorityColor(priority) {
  const colors = {
    'bassa': '#10b981', // verde
    'media': '#f59e0b', // arancione
    'alta': '#ef4444'   // rosso
  };
  
  return colors[priority] || '#6b7280'; // grigio di default
}

/**
 * Formatta il colore in base allo stato
 * @param {string} status - Stato
 * @returns {string} - Codice colore CSS
 */
export function getStatusColor(status) {
  const colors = {
    'assegnato': '#6b7280',   // grigio
    'in corso': '#3b82f6',    // blu
    'completato': '#10b981',  // verde
    'bloccato': '#ef4444'     // rosso
  };
  
  return colors[status] || '#6b7280';
}

// Esporta tutte le funzioni
export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  formatNumber,
  formatPercentage,
  formatPriority,
  formatStatus,
  formatRole,
  formatDepartment,
  formatFileSize,
  formatUserName,
  formatEmailForDisplay,
  formatForExport,
  getPriorityColor,
  getStatusColor
};