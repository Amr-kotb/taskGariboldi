/**
 * Gestione errori centralizzata per TaskGariboldi
 * Mappa errori Firebase a messaggi italiani per team di 5 persone
 */

/**
 * Mappa errori Firebase Auth a messaggi italiani
 * @param {Object} error - Errore Firebase
 * @returns {string} - Messaggio utente-friendly
 */
export function getAuthErrorMessage(error) {
  if (!error || !error.code) {
    return 'Si è verificato un errore sconosciuto. Riprova più tardi.';
  }

  const errorMap = {
    // Autenticazione
    'auth/user-not-found': 'Utente non trovato. Controlla l\'email o contatta l\'amministratore.',
    'auth/wrong-password': 'Password errata. Riprova o clicca "Password dimenticata".',
    'auth/invalid-email': 'Email non valida. Inserisci un indirizzo email corretto.',
    'auth/email-already-in-use': 'Questa email è già registrata. Prova ad accedere invece.',
    'auth/weak-password': 'Password troppo debole. Usa almeno 8 caratteri con lettere e numeri.',
    'auth/too-many-requests': 'Troppi tentativi falliti. Riprova tra qualche minuto.',
    'auth/user-disabled': 'Account disabilitato. Contatta l\'amministratore.',
    'auth/operation-not-allowed': 'Operazione non consentita. Contatta l\'amministratore.',
    'auth/invalid-credential': 'Credenziali non valide. Riprova o contatta l\'amministratore.',
    
    // Firestore
    'permission-denied': 'Non hai i permessi per eseguire questa operazione.',
    'not-found': 'Risorsa non trovata.',
    'already-exists': 'Questo elemento esiste già.',
    'resource-exhausted': 'Limite di risorse raggiunto. Riprova più tardi.',
    'failed-precondition': 'Operazione non consentita nello stato attuale.',
    'aborted': 'Operazione annullata. Riprova.',
    'out-of-range': 'Valore fuori range consentito.',
    'unimplemented': 'Funzionalità non implementata.',
    'internal': 'Errore interno del server. Riprova più tardi.',
    'unavailable': 'Servizio non disponibile. Riprova più tardi.',
    'data-loss': 'Perdita di dati. Contatta l\'amministratore.',
    'unauthenticated': 'Devi essere autenticato per eseguire questa operazione.',
    
    // Storage
    'storage/object-not-found': 'File non trovato.',
    'storage/bucket-not-found': 'Bucket di storage non trovato.',
    'storage/project-not-found': 'Progetto non trovato.',
    'storage/quota-exceeded': 'Spazio di storage esaurito. Contatta l\'amministratore.',
    'storage/unauthenticated': 'Autenticazione richiesta per accedere al file.',
    'storage/unauthorized': 'Non hai i permessi per accedere a questo file.',
    'storage/retry-limit-exceeded': 'Troppi tentativi. Riprova più tardi.',
    'storage/invalid-checksum': 'File corrotto. Ricaricalo.',
    'storage/canceled': 'Upload annullato.',
    'storage/unknown': 'Errore sconosciuto nel caricamento file.'
  };

  // Cerca messaggio specifico
  const message = errorMap[error.code];
  if (message) {
    return message;
  }

  // Messaggio generico per errori conosciuti ma non mappati
  if (error.code.startsWith('auth/')) {
    return 'Errore di autenticazione. Riprova o contatta l\'amministratore.';
  }
  
  if (error.code.startsWith('storage/')) {
    return 'Errore nel caricamento file. Riprova o contatta l\'amministratore.';
  }

  // Fallback: usa il messaggio Firebase o generico
  return error.message || 'Si è verificato un errore inaspettato. Riprova più tardi.';
}

/**
 * Gestore errori per operazioni Firestore
 * @param {Error} error - Errore Firestore
 * @param {string} operation - Operazione eseguita (es: "creazione task")
 * @returns {Object} - { message: string, code: string, retryable: boolean }
 */
export function handleFirestoreError(error, operation = 'operazione') {
  console.error(`❌ Errore Firestore durante ${operation}:`, error);
  
  const defaultMessage = `Impossibile completare la ${operation}. Riprova più tardi.`;
  
  if (!error.code) {
    return {
      message: defaultMessage,
      code: 'unknown',
      retryable: false
    };
  }

  const code = error.code;
  let message = defaultMessage;
  let retryable = false;

  switch (code) {
    case 'failed-precondition':
      message = `La ${operation} non è consentita nello stato attuale.`;
      break;
    case 'permission-denied':
      message = `Non hai i permessi per eseguire questa ${operation}.`;
      break;
    case 'not-found':
      message = `Elemento non trovato per la ${operation}.`;
      break;
    case 'resource-exhausted':
      message = `Limite di risorse raggiunto. Riprova tra qualche minuto.`;
      retryable = true;
      break;
    case 'unavailable':
      message = `Servizio temporaneamente non disponibile. Riprova tra qualche minuto.`;
      retryable = true;
      break;
    case 'aborted':
      message = `${operation.charAt(0).toUpperCase() + operation.slice(1)} annullata. Riprova.`;
      retryable = true;
      break;
    case 'deadline-exceeded':
      message = `Timeout durante la ${operation}. Riprova.`;
      retryable = true;
      break;
  }

  return { message, code, retryable };
}

/**
 * Classe di errore personalizzata per TaskGariboldi
 */
export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Mantiene lo stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Errori specifici dell'applicazione
 */
export const AppErrors = {
  // Autenticazione
  USER_NOT_FOUND: new AppError('Utente non trovato', 'USER_NOT_FOUND'),
  INVALID_CREDENTIALS: new AppError('Credenziali non valide', 'INVALID_CREDENTIALS'),
  SESSION_EXPIRED: new AppError('Sessione scaduta. Effettua il login.', 'SESSION_EXPIRED'),
  ACCESS_DENIED: new AppError('Accesso negato. Permessi insufficienti.', 'ACCESS_DENIED'),
  
  // Task
  TASK_NOT_FOUND: new AppError('Task non trovato', 'TASK_NOT_FOUND'),
  TASK_ACCESS_DENIED: new AppError('Non hai i permessi per accedere a questo task', 'TASK_ACCESS_DENIED'),
  TASK_INVALID_DATA: new AppError('Dati del task non validi', 'TASK_INVALID_DATA'),
  TASK_UPDATE_FAILED: new AppError('Impossibile aggiornare il task', 'TASK_UPDATE_FAILED'),
  
  // Utenti
  USER_DISABLED: new AppError('Account disabilitato', 'USER_DISABLED'),
  USER_EXISTS: new AppError('Utente già esistente', 'USER_EXISTS'),
  
  // Sistema
  NETWORK_ERROR: new AppError('Errore di rete. Verifica la connessione.', 'NETWORK_ERROR'),
  SERVER_ERROR: new AppError('Errore del server. Riprova più tardi.', 'SERVER_ERROR'),
  VALIDATION_ERROR: new AppError('Errore di validazione dati', 'VALIDATION_ERROR'),
  
  // Team specifico (5 persone)
  TEAM_LIMIT_REACHED: new AppError('Limite team raggiunto (max 5 persone)', 'TEAM_LIMIT_REACHED'),
  ADMIN_REQUIRED: new AppError('Questa operazione richiede permessi di amministratore', 'ADMIN_REQUIRED')
};

/**
 * Wrapper per gestire errori in promise/async
 * @param {Promise} promise - Promise da gestire
 * @param {Object} options - Opzioni { context: string, fallback: any }
 * @returns {Promise} - Promise con gestione errori
 */
export function withErrorHandling(promise, options = {}) {
  const { context = 'operazione', fallback = null } = options;
  
  return promise
    .then(result => ({ success: true, data: result, error: null }))
    .catch(error => {
      console.error(`❌ Errore in ${context}:`, error);
      
      const errorInfo = {
        success: false,
        data: fallback,
        error: {
          message: getAuthErrorMessage(error),
          code: error.code || 'UNKNOWN',
          original: error.message,
          context
        }
      };
      
      return errorInfo;
    });
}

/**
 * Gestore errori globale per window.onerror
 */
export function setupGlobalErrorHandler() {
  if (typeof window === 'undefined') return;
  
  const originalOnError = window.onerror;
  
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('🔥 ERRORE GLOBALE:', {
      message,
      source,
      lineno,
      colno,
      error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Mostra errore solo in sviluppo
    if (import.meta.env.VITE_APP_ENV === 'development') {
      const errorDiv = document.getElementById('global-error');
      if (errorDiv) {
        errorDiv.innerHTML = `
          <div style="background: #fee; border: 2px solid #f00; padding: 10px; margin: 10px;">
            <strong>Errore JavaScript:</strong> ${message}<br>
            <small>${source}:${lineno}:${colno}</small>
          </div>
        `;
        errorDiv.style.display = 'block';
      }
    }
    
    // Chiama l'handler originale se esiste
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    
    // Previene il default (mostra nella console)
    return false;
  };
  
  // Gestore per promise non catturate
  window.addEventListener('unhandledrejection', function(event) {
    console.error('🔥 PROMISE NON GESTITA:', event.reason);
    
    if (import.meta.env.VITE_APP_ENV === 'development') {
      event.preventDefault();
      console.error('Stack trace:', event.reason.stack);
    }
  });
}

/**
 * Logga errore per analytics/monitoring
 * @param {Error} error - Errore da loggare
 * @param {Object} metadata - Metadata aggiuntivo
 */
export function logError(error, metadata = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    code: error.code,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...metadata
  };
  
  console.error('📝 Log errore:', errorLog);
  
  // In produzione, potremmo inviare a un servizio di logging
  if (import.meta.env.VITE_APP_ENV === 'production') {
    // Qui potremmo inviare a Firebase Crashlytics o servizio simile
    // Per ora solo console
  }
  
  return errorLog;
}

/**
 * Valida e formatta errore per display UI
 * @param {Error|string|any} error - Errore da formattare
 * @returns {string} - Messaggio formattato per UI
 */
export function formatErrorForUI(error) {
  if (!error) {
    return 'Errore sconosciuto';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error.message) {
    return getAuthErrorMessage(error);
  }
  
  return 'Si è verificato un errore inaspettato';
}

/**
 * Crea boundary per catturare errori React-style
 */
export function createErrorBoundary(componentName) {
  return {
    componentDidCatch(error, errorInfo) {
      logError(error, {
        component: componentName,
        componentStack: errorInfo.componentStack
      });
    }
  };
}

// Esporta tutto
export default {
  getAuthErrorMessage,
  handleFirestoreError,
  AppError,
  AppErrors,
  withErrorHandling,
  setupGlobalErrorHandler,
  logError,
  formatErrorForUI,
  createErrorBoundary
};