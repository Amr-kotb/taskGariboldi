/**
 * TypeScript types generali per TaskGariboldi
 */

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success - Indica se la richiesta è andata a buon fine
 * @property {T} [data] - Dati della risposta (se success = true)
 * @property {string} [error] - Messaggio di errore (se success = false)
 * @property {number} [count] - Numero di elementi (per liste)
 * @property {string} [message] - Messaggio informativo
 * @property {string} [timestamp] - Timestamp risposta
 */

/**
 * @typedef {Object} Pagination
 * @property {number} page - Pagina corrente
 * @property {number} limit - Elementi per pagina
 * @property {number} total - Totale elementi
 * @property {number} pages - Totale pagine
 */

/**
 * @typedef {Object} FilterOptions
 * @property {string} [search] - Testo di ricerca
 * @property {string} [sortBy] - Campo per ordinamento
 * @property {'asc' | 'desc'} [sortOrder] - Direzione ordinamento
 * @property {number} [page] - Pagina corrente
 * @property {number} [limit] - Elementi per pagina
 * @property {Object} [filters] - Filtri specifici
 */

/**
 * @typedef {Object} ChartData
 * @property {Array<string>} labels - Etichette per i dati
 * @property {Array<ChartDataset>} datasets - Dataset per il grafico
 */

/**
 * @typedef {Object} ChartDataset
 * @property {string} label - Nome del dataset
 * @property {Array<number>} data - Valori dei dati
 * @property {Array<string>} [backgroundColor] - Colori di sfondo
 * @property {Array<string>} [borderColor] - Colori bordo
 * @property {number} [borderWidth] - Spessore bordo
 */

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} title - Titolo breadcrumb
 * @property {string} path - Percorso URL
 * @property {boolean} [active] - Se è la pagina corrente
 */

/**
 * @typedef {Object} NavItem
 * @property {string} title - Titolo navigazione
 * @property {string} path - Percorso URL
 * @property {string} icon - Icona FontAwesome
 * @property {boolean} [exact] - Match esatto per route attiva
 * @property {string} [badge] - Tipo badge (per conteggio dinamico)
 * @property {number} [count] - Conteggio statico
 * @property {boolean} [highlight] - Se evidenziare l'item
 * @property {Array<NavItem>} [children] - Sottomenu
 */

/**
 * @typedef {Object} ModalProps
 * @property {boolean} show - Se mostrare il modal
 * @property {Function} onHide - Funzione per chiudere il modal
 * @property {string} title - Titolo del modal
 * @property {React.ReactNode} children - Contenuto del modal
 * @property {'sm' | 'md' | 'lg' | 'xl'} [size] - Dimensione modal
 * @property {boolean} [centered] - Se centrare verticalmente
 * @property {boolean} [backdrop] - Se mostrare backdrop
 * @property {boolean} [keyboard] - Se chiudere con ESC
 * @property {string} [className] - Classi CSS aggiuntive
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - ID notifica
 * @property {string} title - Titolo notifica
 * @property {string} message - Messaggio notifica
 * @property {'info' | 'success' | 'warning' | 'error'} type - Tipo notifica
 * @property {Date|string} timestamp - Data notifica
 * @property {boolean} read - Se è stata letta
 * @property {string} [actionUrl] - URL per azione
 */

/**
 * @typedef {Object} AppConfig
 * @property {string} appName - Nome applicazione
 * @property {string} version - Versione app
 * @property {string} environment - Ambiente (development/production)
 * @property {Object} api - Configurazione API
 * @property {string} api.baseUrl - URL base API
 * @property {number} api.timeout - Timeout richieste (ms)
 * @property {Object} features - Feature flags
 * @property {boolean} features.analytics - Se abilitare analytics
 * @property {boolean} features.notifications - Se abilitare notifiche
 * @property {boolean} features.fileUpload - Se abilitare upload file
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {string} mode - Modalità (light/dark)
 * @property {string} primaryColor - Colore primario
 * @property {string} secondaryColor - Colore secondario
 * @property {Object} colors - Palette colori
 * @property {Object} spacing - Sistema spaziatura
 * @property {Object} typography - Sistema tipografico
 * @property {Object} borderRadius - Sistema border radius
 */

// Export constants for JavaScript usage
export const AppTypes = {
  API_RESPONSE_STATUS: {
    SUCCESS: 'success',
    ERROR: 'error',
    LOADING: 'loading'
  },
  
  NOTIFICATION_TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  },
  
  MODAL_SIZES: {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl'
  },
  
  THEME_MODES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
  }
};

// Helper functions
export function createApiResponse(data, error = null, count = null) {
  if (error) {
    return {
      success: false,
      error: typeof error === 'string' ? error : error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    success: true,
    data,
    count: count !== null ? count : (Array.isArray(data) ? data.length : null),
    timestamp: new Date().toISOString()
  };
}

export function isValidNotificationType(type) {
  return Object.values(AppTypes.NOTIFICATION_TYPES).includes(type);
}

export function isValidModalSize(size) {
  return Object.values(AppTypes.MODAL_SIZES).includes(size);
}

export default AppTypes;