/**
 * Definizione delle rotte per TaskGariboldi
 * Struttura specifica per team di 5 persone (1 admin + 4 dipendenti)
 */

/**
 * Route pubbliche (accessibili senza autenticazione)
 */

          export const ROUTES = {
            // Pubbliche
            HOME: '/',
            LOGIN: '/login',
            REGISTER: '/register',
            FORGOT_PASSWORD: '/forgot-password',
            
            // Admin
            ADMIN: {
              ROOT: '/admin',
              DASHBOARD: '/admin/dashboard',
              TASKS: '/admin/tasks',
              ASSIGN_TASK: '/admin/assign-task',
              USERS: '/admin/users',
              STATISTICS: '/admin/statistics',
              HISTORY: '/admin/history',
              TRASH: '/admin/trash'
            },
            
            // Employee
            EMPLOYEE: {
              ROOT: '/employee',
              DASHBOARD: '/employee/dashboard',
              MY_TASKS: '/employee/my-tasks',
              HISTORY: '/employee/history',
              PROFILE: '/employee/profile',
              TRASH: '/employee/trash'
            }
          };

    export const ROLES = {
      ADMIN: 'admin',
      EMPLOYEE: 'dipendente'
    };

// IL RESTO DEL TUO CODICE ESISTENTE SEGUE QUI...
export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ERROR_404: '/404',
  ERROR_500: '/500'
};

/**
 * Route protette per DIPENDENTI
 */
export const EMPLOYEE_ROUTES = {
  DASHBOARD: '/dashboard',
  MY_TASKS: '/my-tasks',
  TASK_DETAIL: '/task/:id',
  HISTORY: '/history',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  TRASH: '/trash'
};

/**
 * Route protette per ADMIN
 */
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  ALL_TASKS: '/admin/tasks',
  ASSIGN_TASK: '/admin/assign-task',
  USERS: '/admin/users',
  STATISTICS: '/admin/statistics',
  GLOBAL_HISTORY: '/admin/history',
  GLOBAL_TRASH: '/admin/trash',
  SETTINGS: '/admin/settings'
};

/**
 * Mappa ruoli → rotte accessibili
 */
export const ROLE_ROUTES = {
  dipendente: [
    EMPLOYEE_ROUTES.DASHBOARD,
    EMPLOYEE_ROUTES.MY_TASKS,
    EMPLOYEE_ROUTES.TASK_DETAIL,
    EMPLOYEE_ROUTES.HISTORY,
    EMPLOYEE_ROUTES.PROFILE,
    EMPLOYEE_ROUTES.SETTINGS,
    EMPLOYEE_ROUTES.TRASH
  ],
  admin: [
    ADMIN_ROUTES.DASHBOARD,
    ADMIN_ROUTES.ALL_TASKS,
    ADMIN_ROUTES.ASSIGN_TASK,
    ADMIN_ROUTES.USERS,
    ADMIN_ROUTES.STATISTICS,
    ADMIN_ROUTES.GLOBAL_HISTORY,
    ADMIN_ROUTES.GLOBAL_TRASH,
    ADMIN_ROUTES.SETTINGS,
    ...Object.values(EMPLOYEE_ROUTES) // Admin può accedere anche a route dipendente
  ]
};

/**
 * Route che richiedono parametri
 */
export const PARAM_ROUTES = {
  TASK_DETAIL: (taskId) => `/task/${taskId}`,
  USER_PROFILE: (userId) => `/admin/users/${userId}`,
  EDIT_TASK: (taskId) => `/admin/tasks/edit/${taskId}`
};

/**
 * Navigazione per sidebar/menu
 */
export const NAVIGATION = {
  // Navigazione DIPENDENTE
  EMPLOYEE: [
    {
      title: 'Dashboard',
      path: EMPLOYEE_ROUTES.DASHBOARD,
      icon: 'fa-home',
      exact: true
    },
    {
      title: 'I Miei Task',
      path: EMPLOYEE_ROUTES.MY_TASKS,
      icon: 'fa-tasks',
      badge: 'tasks' // Mostra conteggio task in badge
    },
    {
      title: 'Storico',
      path: EMPLOYEE_ROUTES.HISTORY,
      icon: 'fa-history'
    },
    {
      title: 'Cestino',
      path: EMPLOYEE_ROUTES.TRASH,
      icon: 'fa-trash',
      count: 0
    },
    {
      title: 'Profilo',
      path: EMPLOYEE_ROUTES.PROFILE,
      icon: 'fa-user'
    },
    {
      title: 'Impostazioni',
      path: EMPLOYEE_ROUTES.SETTINGS,
      icon: 'fa-cog'
    }
  ],
  
  // Navigazione ADMIN
  ADMIN: [
    {
      title: 'Dashboard Admin',
      path: ADMIN_ROUTES.DASHBOARD,
      icon: 'fa-tachometer-alt',
      exact: true
    },
    {
      title: 'Tutti i Task',
      path: ADMIN_ROUTES.ALL_TASKS,
      icon: 'fa-list-check',
      badge: 'all-tasks'
    },
    {
      title: 'Assegna Task',
      path: ADMIN_ROUTES.ASSIGN_TASK,
      icon: 'fa-plus-circle',
      highlight: true
    },
    {
      title: 'Gestione Dipendenti',
      path: ADMIN_ROUTES.USERS,
      icon: 'fa-users',
      count: 4 // Dipendenti fissi
    },
    {
      title: 'Statistiche',
      path: ADMIN_ROUTES.STATISTICS,
      icon: 'fa-chart-bar'
    },
    {
      title: 'Storico Globale',
      path: ADMIN_ROUTES.GLOBAL_HISTORY,
      icon: 'fa-history'
    },
    {
      title: 'Cestino Globale',
      path: ADMIN_ROUTES.GLOBAL_TRASH,
      icon: 'fa-trash-alt'
    },
    {
      title: 'Impostazioni',
      path: ADMIN_ROUTES.SETTINGS,
      icon: 'fa-cog'
    }
  ]
};

/**
 * Route di default in base al ruolo
 */
export const DEFAULT_ROUTES = {
  dipendente: EMPLOYEE_ROUTES.DASHBOARD,
  admin: ADMIN_ROUTES.DASHBOARD
};

/**
 * Verifica se una route è pubblica
 * @param {string} path - Path da verificare
 * @returns {boolean}
 */
export function isPublicRoute(path) {
  const publicPaths = Object.values(PUBLIC_ROUTES);
  return publicPaths.includes(path) || path.startsWith('/reset-password/');
}

/**
 * Verifica se un utente può accedere a una route
 * @param {string} path - Path da verificare
 * @param {string} role - Ruolo utente (admin/dipendente)
 * @returns {boolean}
 */
export function canAccessRoute(path, role) {
  if (isPublicRoute(path)) return true;
  
  const allowedRoutes = ROLE_ROUTES[role] || [];
  
  // Verifica match esatto o pattern (per route con parametri)
  return allowedRoutes.some(route => {
    if (route.includes(':')) {
      // Route con parametri - verifica pattern
      const routeRegex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
      return routeRegex.test(path);
    }
    return route === path;
  });
}

/**
 * Ottieni navigazione in base al ruolo
 * @param {string} role - Ruolo utente
 * @returns {Array} - Array di oggetti navigazione
 */
export function getNavigationForRole(role) {
  return role === 'admin' ? NAVIGATION.ADMIN : NAVIGATION.EMPLOYEE;
}

/**
 * Ottieni route di default per il ruolo
 * @param {string} role - Ruolo utente
 * @returns {string} - Route di default
 */
export function getDefaultRoute(role) {
  return DEFAULT_ROUTES[role] || PUBLIC_ROUTES.LOGIN;
}

/**
 * Genera breadcrumb per una route
 * @param {string} path - Route corrente
 * @returns {Array} - Array di breadcrumb
 */
export function generateBreadcrumbs(path) {
  const breadcrumbs = [];
  
  // Mappa route -> titolo
  const routeTitles = {
    [EMPLOYEE_ROUTES.DASHBOARD]: 'Dashboard',
    [EMPLOYEE_ROUTES.MY_TASKS]: 'I Miei Task',
    [EMPLOYEE_ROUTES.HISTORY]: 'Storico',
    [EMPLOYEE_ROUTES.PROFILE]: 'Profilo',
    [EMPLOYEE_ROUTES.SETTINGS]: 'Impostazioni',
    [EMPLOYEE_ROUTES.TRASH]: 'Cestino',
    
    [ADMIN_ROUTES.DASHBOARD]: 'Dashboard Admin',
    [ADMIN_ROUTES.ALL_TASKS]: 'Tutti i Task',
    [ADMIN_ROUTES.ASSIGN_TASK]: 'Assegna Task',
    [ADMIN_ROUTES.USERS]: 'Gestione Dipendenti',
    [ADMIN_ROUTES.STATISTICS]: 'Statistiche',
    [ADMIN_ROUTES.GLOBAL_HISTORY]: 'Storico Globale',
    [ADMIN_ROUTES.GLOBAL_TRASH]: 'Cestino Globale',
    [ADMIN_ROUTES.SETTINGS]: 'Impostazioni Admin'
  };
  
  // Suddivide il path
  const parts = path.split('/').filter(part => part);
  
  let currentPath = '';
  parts.forEach((part, index) => {
    currentPath += '/' + part;
    
    // Cerca titolo esatto
    let title = routeTitles[currentPath];
    
    // Se non trovato, cerca pattern con parametri
    if (!title) {
      for (const route in routeTitles) {
        if (route.includes(':')) {
          const routePattern = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
          if (routePattern.test(currentPath)) {
            title = routeTitles[route];
            break;
          }
        }
      }
    }
    
    // Se ancora non trovato, usa il nome del segmento
    if (!title) {
      title = part.charAt(0).toUpperCase() + part.slice(1);
    }
    
    breadcrumbs.push({
      title,
      path: currentPath,
      active: index === parts.length - 1
    });
  });
  
  // Aggiungi home come primo breadcrumb
  if (breadcrumbs.length > 0) {
    breadcrumbs.unshift({
      title: 'Home',
      path: '/',
      active: false
    });
  }
  
  return breadcrumbs;
}

// Esporta tutto
export default {
  PUBLIC_ROUTES,
  EMPLOYEE_ROUTES,
  ADMIN_ROUTES,
  ROLE_ROUTES,
  PARAM_ROUTES,
  NAVIGATION,
  DEFAULT_ROUTES,
  isPublicRoute,
  canAccessRoute,
  getNavigationForRole,
  getDefaultRoute,
  generateBreadcrumbs
};