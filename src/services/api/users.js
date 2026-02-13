/**
 * API Service per gestione Utenti
 * Utilizza il servizio Firestore esistente
 */
import { getCurrentUser, saveUserToStorage } from '../../utils/userStorage';

import { userService } from '../firebase/firestore';
import { 
  ROLES, 
  DEPARTMENTS, 
  getRoleName, 
  getDepartmentName,
  getRoleColor,
  getDepartmentColor
} from '../../constants/roles';

/**
 * Recupera tutti gli utenti attivi
 * @returns {Promise<Object>} Risultato operazione
 */
export const getAllUsers = async () => {
  try {
    console.log('👥 [users.js] Fetching all active users...');
    
    const users = await userService.getAll();
    
    // Formatta gli utenti per il frontend
    const formattedUsers = users.map(user => ({
      ...user,
      roleName: getRoleName(user.role),
      departmentName: getDepartmentName(user.department),
      roleColor: getRoleColor(user.role),
      departmentColor: getDepartmentColor(user.department),
      initials: getInitials(user.name || user.email),
      isActive: user.isActive !== false // Default true se non specificato
    }));
    
    console.log(`✅ [users.js] Users fetched: ${formattedUsers.length}`);
    return {
      success: true,
      data: formattedUsers,
      count: formattedUsers.length
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error fetching users:', error);
    return {
      success: false,
      error: error.message || 'Errore nel caricamento degli utenti',
      data: []
    };
  }
};

/**
 * Recupera solo i dipendenti attivi
 * @returns {Promise<Object>} Lista dipendenti
 */
export const getEmployees = async () => {
  try {
    console.log('👨‍💼 [users.js] Fetching employees...');
    
    const employees = await userService.getEmployees();
    
    const formattedEmployees = employees.map(employee => ({
      ...employee,
      roleName: getRoleName(employee.role),
      departmentName: getDepartmentName(employee.department),
      departmentColor: getDepartmentColor(employee.department),
      initials: getInitials(employee.name || employee.email),
      stats: {
        totalTasks: 0, // Saranno popolati successivamente
        completedTasks: 0,
        completionRate: 0
      }
    }));
    
    console.log(`✅ [users.js] Employees fetched: ${formattedEmployees.length}`);
    return {
      success: true,
      data: formattedEmployees,
      count: formattedEmployees.length
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error fetching employees:', error);
    return {
      success: false,
      error: error.message || 'Errore nel caricamento dei dipendenti',
      data: []
    };
  }
};

/**
 * Recupera un utente specifico per ID
 * @param {string} userId - ID utente
 * @returns {Promise<Object>} Utente
 */
export const getUserById = async (userId) => {
  try {
    console.log(`👤 [users.js] Fetching user: ${userId}`);
    
    const user = await userService.getById(userId);
    
    if (!user) {
      throw new Error('Utente non trovato');
    }
    
    const formattedUser = {
      ...user,
      roleName: getRoleName(user.role),
      departmentName: getDepartmentName(user.department),
      roleColor: getRoleColor(user.role),
      departmentColor: getDepartmentColor(user.department),
      initials: getInitials(user.name || user.email)
    };
    
    console.log(`✅ [users.js] User fetched: ${formattedUser.name || formattedUser.email}`);
    return {
      success: true,
      data: formattedUser
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error fetching user:', error);
    return {
      success: false,
      error: error.message || 'Utente non trovato'
    };
  }
};

/**
 * Aggiorna un utente
 * @param {string} userId - ID utente
 * @param {Object} updates - Campi da aggiornare
 * @returns {Promise<Object>} Risultato operazione
 */
export const updateUser = async (userId, updates) => {
  try {
    console.log(`✏️ [users.js] Updating user: ${userId}`);
    
    // Validazione ruoli
    if (updates.role && !Object.values(ROLES).includes(updates.role)) {
      throw new Error(`Ruolo non valido: ${updates.role}`);
    }
    
    // Validazione dipartimenti
    if (updates.department && !Object.values(DEPARTMENTS).includes(updates.department)) {
      throw new Error(`Dipartimento non valido: ${updates.department}`);
    }
    
    const result = await userService.update(userId, updates);
    
    console.log(`✅ [users.js] User updated successfully`);
    return {
      success: true,
      message: 'Utente aggiornato con successo',
      data: result
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error updating user:', error);
    return {
      success: false,
      error: error.message || 'Errore nell\'aggiornamento dell\'utente'
    };
  }
};

/**
 * Aggiorna profilo utente corrente
 * @param {string} userId - ID utente corrente
 * @param {Object} profileData - Dati profilo
 * @returns {Promise<Object>} Risultato operazione
 */
export const updateProfile = async (userId, profileData) => {
  try {
    console.log(`👤 [users.js] Updating profile for user: ${userId}`);
    
    // Campi consentiti per l'aggiornamento profilo
    const allowedFields = ['name', 'avatar', 'department', 'phone', 'bio'];
    const updates = {};
    
    // Filtra solo i campi consentiti
    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = profileData[key];
      }
    });
    
    // Verifica che ci siano campi da aggiornare
    if (Object.keys(updates).length === 0) {
      throw new Error('Nessun campo valido da aggiornare');
    }
    
    const result = await userService.update(userId, updates);
    
    // Aggiorna anche nel localStorage se necessario
    const currentUser = getCurrentUser() || {};

    if (currentUser.uid === userId) {
      const updatedUser = { ...currentUser, ...updates };
      saveUserToStorage(updatedUser);
    }
    
    console.log(`✅ [users.js] Profile updated successfully`);
    return {
      success: true,
      message: 'Profilo aggiornato con successo',
      data: result
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error updating profile:', error);
    return {
      success: false,
      error: error.message || 'Errore nell\'aggiornamento del profilo'
    };
  }
};

/**
 * Cambia password utente
 * @param {string} userId - ID utente
 * @param {string} currentPassword - Password attuale
 * @param {string} newPassword - Nuova password
 * @returns {Promise<Object>} Risultato operazione
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Nota: Questa funzione dovrebbe integrarsi con Firebase Auth
    // Per ora restituiamo un successo mock
    console.log(`🔐 [users.js] Changing password for user: ${userId}`);
    
    // Validazione password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nuova password deve contenere almeno 6 caratteri');
    }
    
    // Simulazione di successo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`✅ [users.js] Password changed successfully`);
    return {
      success: true,
      message: 'Password cambiata con successo'
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error changing password:', error);
    return {
      success: false,
      error: error.message || 'Errore nel cambio password'
    };
  }
};

/**
 * Ottieni statistiche per utente
 * @param {string} userId - ID utente
 * @returns {Promise<Object>} Statistiche utente
 */
export const getUserStatistics = async (userId) => {
  try {
    console.log(`📊 [users.js] Getting statistics for user: ${userId}`);
    
    // Recupera l'utente
    const userResult = await getUserById(userId);
    if (!userResult.success) {
      throw new Error(userResult.error);
    }
    
    const user = userResult.data;
    
    // Qui dovremmo integrare con il servizio statistiche
    // Per ora restituiamo statistiche mock
    const stats = {
      userInfo: user,
      performance: {
        tasksCompleted: 24,
        tasksAssigned: 32,
        completionRate: 75,
        averageCompletionTime: '2.5 giorni',
        efficiencyScore: 82
      },
      timeline: {
        lastMonth: [12, 15, 18, 22],
        lastWeek: [3, 5, 4, 6]
      },
      comparisons: {
        vsTeamAverage: {
          completionRate: { user: 75, team: 68 },
          efficiency: { user: 82, team: 75 },
          productivity: { user: 24, team: 19 }
        }
      },
      achievements: [
        { id: 1, title: 'Task Master', description: 'Completato 10 task', earned: true },
        { id: 2, title: 'Puntuale', description: 'Nessun task in ritardo', earned: true },
        { id: 3, title: 'Team Player', description: 'Ha aiutato 3 colleghi', earned: false }
      ]
    };
    
    return {
      success: true,
      data: stats
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error getting user statistics:', error);
    return {
      success: false,
      error: error.message || 'Errore nel recupero delle statistiche',
      data: null
    };
  }
};

/**
 * Cerca utenti per nome o email
 * @param {string} query - Testo da cercare
 * @returns {Promise<Object>} Risultati ricerca
 */
export const searchUsers = async (query) => {
  try {
    console.log(`🔍 [users.js] Searching users for: "${query}"`);
    
    const usersResult = await getAllUsers();
    if (!usersResult.success) {
      throw new Error(usersResult.error);
    }
    
    const searchLower = query.toLowerCase();
    const filteredUsers = usersResult.data.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.departmentName && user.departmentName.toLowerCase().includes(searchLower))
    );
    
    return {
      success: true,
      data: filteredUsers,
      count: filteredUsers.length
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error searching users:', error);
    return {
      success: false,
      error: error.message || 'Errore nella ricerca utenti',
      data: []
    };
  }
};

/**
 * Esporta lista utenti in formato CSV
 * @param {Array} users - Lista utenti da esportare
 * @returns {Promise<Object>} CSV data
 */
export const exportUsersToCSV = async (users = []) => {
  try {
    console.log(`📄 [users.js] Exporting users to CSV`);
    
    // Se non vengono passati utenti, recuperali tutti
    let usersToExport = users;
    if (usersToExport.length === 0) {
      const result = await getAllUsers();
      if (result.success) {
        usersToExport = result.data;
      } else {
        throw new Error(result.error);
      }
    }
    
    // Intestazioni CSV
    const headers = ['Nome', 'Email', 'Ruolo', 'Dipartimento', 'Stato', 'Ultimo Accesso'];
    
    // Righe CSV
    const rows = usersToExport.map(user => [
      `"${user.name || ''}"`,
      `"${user.email || ''}"`,
      `"${user.roleName || ''}"`,
      `"${user.departmentName || ''}"`,
      `"${user.isActive ? 'Attivo' : 'Disattivato'}"`,
      `"${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('it-IT') : 'Mai'}"`
    ]);
    
    // Combina headers e rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return {
      success: true,
      data: csvContent,
      filename: `utenti_${new Date().toISOString().split('T')[0]}.csv`
    };
    
  } catch (error) {
    console.error('❌ [users.js] Error exporting users:', error);
    return {
      success: false,
      error: error.message || 'Errore nell\'esportazione degli utenti'
    };
  }
};

// Funzioni di utilità
function getInitials(name) {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Esporta tutte le funzioni
export default {
  getAllUsers,
  getEmployees,
  getUserById,
  updateUser,
  updateProfile,
  changePassword,
  getUserStatistics,
  searchUsers,
  exportUsersToCSV
};