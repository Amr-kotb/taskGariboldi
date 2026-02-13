/**
 * Utility di validazione dati per TaskGariboldi
 * Validazioni specifiche per team di 5 persone
 */

/**
 * Validazione email
 * @param {string} email - Email da validare
 * @returns {boolean} - true se valida
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validazione password
 * @param {string} password - Password da validare
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'La password è obbligatoria' };
  }
  
  const minLength = parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 8;
  
  if (password.length < minLength) {
    return { 
      isValid: false, 
      message: `La password deve essere di almeno ${minLength} caratteri` 
    };
  }
  
  return { isValid: true, message: 'Password valida' };
}

/**
 * Validazione nome utente
 * @param {string} name - Nome da validare
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, message: 'Il nome è obbligatorio' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, message: 'Il nome deve essere di almeno 2 caratteri' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, message: 'Il nome non può superare 50 caratteri' };
  }
  
  return { isValid: true, message: 'Nome valido' };
}

/**
 * Validazione titolo task
 * @param {string} title - Titolo del task
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateTaskTitle(title) {
  if (!title || typeof title !== 'string') {
    return { isValid: false, message: 'Il titolo del task è obbligatorio' };
  }
  
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < 3) {
    return { isValid: false, message: 'Il titolo deve essere di almeno 3 caratteri' };
  }
  
  if (trimmedTitle.length > 100) {
    return { isValid: false, message: 'Il titolo non può superare 100 caratteri' };
  }
  
  return { isValid: true, message: 'Titolo valido' };
}

/**
 * Validazione descrizione task
 * @param {string} description - Descrizione del task
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateTaskDescription(description) {
  if (!description || typeof description !== 'string') {
    return { isValid: true, message: 'Descrizione opzionale' };
  }
  
  const trimmedDesc = description.trim();
  
  if (trimmedDesc.length > 1000) {
    return { isValid: false, message: 'La descrizione non può superare 1000 caratteri' };
  }
  
  return { isValid: true, message: 'Descrizione valida' };
}

/**
 * Validazione data scadenza
 * @param {string|Date} dueDate - Data di scadenza
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateDueDate(dueDate) {
  if (!dueDate) {
    return { isValid: true, message: 'Data opzionale' };
  }
  
  try {
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(date.getTime())) {
      return { isValid: false, message: 'Data non valida' };
    }
    
    // La data non può essere nel passato (eccetto per completati)
    if (date < today) {
      return { 
        isValid: false, 
        message: 'La data di scadenza non può essere nel passato' 
      };
    }
    
    return { isValid: true, message: 'Data valida' };
  } catch (error) {
    return { isValid: false, message: 'Errore nella validazione della data' };
  }
}

/**
 * Validazione ore stimate
 * @param {number} hours - Ore stimate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validateEstimatedHours(hours) {
  if (!hours && hours !== 0) {
    return { isValid: true, message: 'Ore opzionali' };
  }
  
  const num = Number(hours);
  
  if (isNaN(num)) {
    return { isValid: false, message: 'Le ore devono essere un numero' };
  }
  
  if (num < 0) {
    return { isValid: false, message: 'Le ore non possono essere negative' };
  }
  
  if (num > 1000) {
    return { isValid: false, message: 'Le ore non possono superare 1000' };
  }
  
  return { isValid: true, message: 'Ore valide' };
}

/**
 * Validazione form completo task
 * @param {Object} taskData - Dati del task
 * @returns {Object} - { isValid: boolean, errors: Object, message: string }
 */
export function validateTaskForm(taskData) {
  const errors = {};
  let isValid = true;
  
  // Validazione titolo
  const titleValidation = validateTaskTitle(taskData.title);
  if (!titleValidation.isValid) {
    errors.title = titleValidation.message;
    isValid = false;
  }
  
  // Validazione descrizione
  const descValidation = validateTaskDescription(taskData.description);
  if (!descValidation.isValid) {
    errors.description = descValidation.message;
    isValid = false;
  }
  
  // Validazione data scadenza
  const dateValidation = validateDueDate(taskData.dueDate);
  if (!dateValidation.isValid) {
    errors.dueDate = dateValidation.message;
    isValid = false;
  }
  
  // Validazione ore stimate
  const hoursValidation = validateEstimatedHours(taskData.estimatedHours);
  if (!hoursValidation.isValid) {
    errors.estimatedHours = hoursValidation.message;
    isValid = false;
  }
  
  // Validazione assegnatario
  if (!taskData.assignedTo) {
    errors.assignedTo = 'Seleziona un assegnatario';
    isValid = false;
  }
  
  // Validazione priorità
  const validPriorities = ['bassa', 'media', 'alta'];
  if (!taskData.priority || !validPriorities.includes(taskData.priority)) {
    errors.priority = 'Seleziona una priorità valida';
    isValid = false;
  }
  
  // Validazione stato
  const validStatuses = ['assegnato', 'in corso', 'completato', 'bloccato'];
  if (!taskData.status || !validStatuses.includes(taskData.status)) {
    errors.status = 'Seleziona uno stato valido';
    isValid = false;
  }
  
  return {
    isValid,
    errors,
    message: isValid ? 'Form valido' : 'Correggi gli errori nel form'
  };
}

/**
 * Validazione form login
 * @param {Object} loginData - Dati di login
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export function validateLoginForm(loginData) {
  const errors = {};
  let isValid = true;
  
  // Validazione email
  if (!validateEmail(loginData.email)) {
    errors.email = 'Inserisci un indirizzo email valido';
    isValid = false;
  }
  
  // Validazione password
  if (!loginData.password || loginData.password.length < 6) {
    errors.password = 'La password deve essere di almeno 6 caratteri';
    isValid = false;
  }
  
  return { isValid, errors };
}

/**
 * Sanitizzazione input (protezione XSS base)
 * @param {string} input - Input da sanitizzare
 * @returns {string} - Input sanitizzato
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Rimuove tag HTML pericolosi
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validazione URL
 * @param {string} url - URL da validare
 * @returns {boolean} - true se URL valido
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validazione telefono
 * @param {string} phone - Numero di telefono
 * @returns {boolean} - true se valido
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Accetta formati: +39 123 456789, 123-456-7890, (123) 456-7890, ecc.
  const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{8,20}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validazione numero positivo
 * @param {number} num - Numero da validare
 * @param {Object} options - Opzioni { min, max }
 * @returns {Object} - { isValid: boolean, message: string }
 */
export function validatePositiveNumber(num, options = {}) {
  const value = Number(num);
  
  if (isNaN(value)) {
    return { isValid: false, message: 'Deve essere un numero' };
  }
  
  if (value < 0) {
    return { isValid: false, message: 'Il numero non può essere negativo' };
  }
  
  if (options.min !== undefined && value < options.min) {
    return { 
      isValid: false, 
      message: `Il numero deve essere almeno ${options.min}` 
    };
  }
  
  if (options.max !== undefined && value > options.max) {
    return { 
      isValid: false, 
      message: `Il numero non può superare ${options.max}` 
    };
  }
  
  return { isValid: true, message: 'Numero valido' };
}

// Esporta tutte le funzioni
export default {
  validateEmail,
  validatePassword,
  validateName,
  validateTaskTitle,
  validateTaskDescription,
  validateDueDate,
  validateEstimatedHours,
  validateTaskForm,
  validateLoginForm,
  sanitizeInput,
  isValidUrl,
  isValidPhone,
  validatePositiveNumber
};