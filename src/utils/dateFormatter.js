/**
 * Utility per formattazione date e orari
 */

/**
 * Formatta una data in formato leggibile italiano
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return 'N/D';
  
  let dateObj;
  
  // Gestisci diversi tipi di input
  if (date instanceof Date) {
    dateObj = date;
  } else if (date.toDate) { // Firebase Timestamp
    dateObj = date.toDate();
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    return 'Data non valida';
  }
  
  // Verifica se la data è valida
  if (isNaN(dateObj.getTime())) {
    return 'Data non valida';
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const inputDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  
  // Formato per oggi/ieri
  if (inputDate.getTime() === today.getTime()) {
    return includeTime ? `Oggi, ${formatTime(dateObj)}` : 'Oggi';
  } else if (inputDate.getTime() === yesterday.getTime()) {
    return includeTime ? `Ieri, ${formatTime(dateObj)}` : 'Ieri';
  }
  
  // Formato per date più vecchie
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  if (includeTime) {
    return `${day}/${month}/${year}, ${formatTime(dateObj)}`;
  }
  
  return `${day}/${month}/${year}`;
};

/**
 * Formatta l'orario (HH:MM)
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (date.toDate) {
    dateObj = date.toDate();
  } else {
    dateObj = new Date(date);
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Calcola quanto tempo è passato (es: "2 ore fa")
 */
export const timeAgo = (date) => {
  if (!date) return '';
  
  let dateObj;
  if (date instanceof Date) {
    dateObj = date;
  } else if (date.toDate) {
    dateObj = date.toDate();
  } else {
    dateObj = new Date(date);
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const seconds = Math.floor((now - dateObj) / 1000);
  
  if (seconds < 60) {
    return 'ora';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minuti'} fa`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'settimana' : 'settimane'} fa`;
  }
  
  return formatDate(dateObj);
};

/**
 * Formatta la data per input HTML datetime-local
 */
export const formatForDateTimeInput = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Converte una stringa in Date
 */
export const parseDateString = (dateString) => {
  if (!dateString) return null;
  
  // Supporta diversi formati
  const formats = [
    'YYYY-MM-DDTHH:mm',      // datetime-local
    'YYYY-MM-DD',            // date
    'DD/MM/YYYY HH:mm',      // italiano con orario
    'DD/MM/YYYY',            // italiano
  ];
  
  for (const format of formats) {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
};

/**
 * Aggiunge giorni a una data
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Confronta due date (ignorando l'orario)
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export default {
  formatDate,
  formatTime,
  timeAgo,
  formatForDateTimeInput,
  parseDateString,
  addDays,
  isSameDay,
};