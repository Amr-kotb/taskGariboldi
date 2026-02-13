/**
 * Utility functions per la manipolazione delle stringhe
 */

/**
 * Capitalizza la prima lettera di una stringa
 * @param {string} str - Stringa da capitalizzare
 * @returns {string} Stringa capitalizzata
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalizza ogni parola di una stringa
 * @param {string} str - Stringa da capitalizzare
 * @returns {string} Stringa con ogni parola capitalizzata
 */
export function capitalizeWords(str) {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
}

/**
 * Tronca una stringa ad una lunghezza specifica
 * @param {string} str - Stringa da troncare
 * @param {number} length - Lunghezza massima
 * @param {string} suffix - Suffisso da aggiungere (default: '...')
 * @returns {string} Stringa troncata
 */
export function truncate(str, length = 100, suffix = '...') {
  if (!str) return '';
  if (str.length <= length) return str;
  
  return str.substring(0, length).trim() + suffix;
}

/**
 * Rimuove gli spazi extra da una stringa
 * @param {string} str - Stringa da pulire
 * @returns {string} Stringa senza spazi extra
 */
export function cleanSpaces(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Formatta un numero come stringa con separatore delle migliaia
 * @param {number} num - Numero da formattare
 * @param {number} decimals - Decimali da mostrare
 * @returns {string} Numero formattato
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return '0';
  
  return Number(num).toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Genera un ID univoco
 * @param {number} length - Lunghezza dell'ID
 * @returns {string} ID generato
 */
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Sanitizza una stringa per uso HTML
 * @param {string} str - Stringa da sanitizzare
 * @returns {string} Stringa sanitizzata
 */
export function sanitize(str) {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Converte una stringa in slug (URL-friendly)
 * @param {string} str - Stringa da convertire
 * @returns {string} Slug
 */
export function toSlug(str) {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .normalize('NFD') // Normalizza caratteri speciali
    .replace(/[\u0300-\u036f]/g, '') // Rimuovi accenti
    .replace(/[^a-z0-9\s-]/g, '') // Rimuovi caratteri non alfanumerici
    .replace(/\s+/g, '-') // Sostituisci spazi con trattini
    .replace(/-+/g, '-') // Rimuovi trattini multipli
    .trim();
}

/**
 * Maschera parte di una email
 * @param {string} email - Email da mascherare
 * @returns {string} Email mascherata
 */
export function maskEmail(email) {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
  return maskedUsername + '@' + domain;
}

/**
 * Formatta una durata in minuti in formato ore:minuti
 * @param {number} minutes - Durata in minuti
 * @returns {string} Durata formattata
 */
export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'N/D';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  
  return `${hours}h ${mins}m`;
}

/**
 * Estrae il nome da una email
 * @param {string} email - Email
 * @returns {string} Nome estratto
 */
export function getNameFromEmail(email) {
  if (!email) return '';
  
  const username = email.split('@')[0];
  return capitalizeWords(username.replace(/[._]/g, ' '));
}