/**
 * Utility functions per la gestione delle date
 */

/**
 * Formatta una data nel formato italiano
 * @param {Date|string} date - Data da formattare
 * @param {boolean} includeTime - Se includere l'orario
 * @returns {string} Data formattata
 */
export function formatDate(date, includeTime = false) {
  if (!date) return 'N/D';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data non valida';
  
  const options = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('it-IT', options);
}

/**
 * Formatta una data per input di tipo date (YYYY-MM-DD)
 * @param {Date|string} date - Data da formattare
 * @returns {string} Data in formato YYYY-MM-DD
 */
export function formatDateForInput(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calcola la differenza in giorni tra due date
 * @param {Date|string} date1 - Prima data
 * @param {Date|string} date2 - Seconda data
 * @returns {number} Differenza in giorni
 */
export function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Controlla se una data è scaduta
 * @param {Date|string} dueDate - Data di scadenza
 * @returns {boolean} True se scaduta
 */
export function isDateExpired(dueDate) {
  if (!dueDate) return false;
  
  const due = new Date(dueDate);
  const today = new Date();
  
  if (isNaN(due.getTime())) return false;
  
  // Rimuovi l'orario per confrontare solo le date
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return due < today;
}

/**
 * Controlla se una data è oggi
 * @param {Date|string} date - Data da controllare
 * @returns {boolean} True se è oggi
 */
export function isToday(date) {
  if (!date) return false;
  
  const d = new Date(date);
  const today = new Date();
  
  if (isNaN(d.getTime())) return false;
  
  return d.toDateString() === today.toDateString();
}

/**
 * Controlla se una data è entro i prossimi giorni
 * @param {Date|string} date - Data da controllare
 * @param {number} days - Numero di giorni
 * @returns {boolean} True se è entro i giorni specificati
 */
export function isWithinDays(date, days) {
  if (!date) return false;
  
  const d = new Date(date);
  const today = new Date();
  
  if (isNaN(d.getTime())) return false;
  
  const diffTime = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Aggiunge giorni a una data
 * @param {Date|string} date - Data di partenza
 * @param {number} days - Giorni da aggiungere
 * @returns {Date} Nuova data
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Ottieni il nome del giorno della settimana
 * @param {Date|string} date - Data
 * @returns {string} Nome del giorno
 */
export function getDayName(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return days[d.getDay()];
}

/**
 * Ottieni il nome del mese
 * @param {Date|string} date - Data
 * @returns {string} Nome del mese
 */
export function getMonthName(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  
  return months[d.getMonth()];
}