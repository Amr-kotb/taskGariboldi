import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUser } from '../../utils/userStorage';

/**
 * Servizio Firestore per TaskGariboldi - VERSIONE COMPLETA CON GOOGLE DRIVE
 */

// Riferimenti alle collezioni
const tasksCollection = collection(db, 'tasks'); 
const usersCollection = collection(db, 'users');
const activityCollection = collection(db, 'activity');
const employeeFilesCollection = collection(db, 'employee_files'); // NUOVA COLLEZIONE

/**
 * Servizio Task
 */
export const taskService = {
  async create(taskData) {
    try {
      const taskWithMeta = {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false,
        deletedBy: null,
        deletedAt: null,
        status: taskData.status || 'assegnato',
        priority: taskData.priority || 'media',
        progress: taskData.progress || 0
      };
      
      const docRef = await addDoc(tasksCollection, taskWithMeta);
      console.log('✅ Task creato:', docRef.id);
      
      await this.logActivity('task_created', `Task "${taskData.title}" creato`, docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Errore creazione task:', error);
      throw new Error('Impossibile creare il task. Riprova più tardi.');
    }
  },
  
  async getAll(filters = {}) {
    try {
      let q = query(tasksCollection, where('deleted', '==', false));
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      const orderField = filters.orderBy || 'createdAt';
      const orderDir = filters.orderDir || 'desc';
      q = query(q, orderBy(orderField, orderDir));
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📋 Task recuperati: ${tasks.length}`);
      return tasks;
    } catch (error) {
      console.error('❌ Errore recupero task:', error);
      throw new Error('Impossibile caricare i task. Riprova più tardi.');
    }
  },
  
  async getByUser(userId, includeDeleted = false) {
    try {
      let q = query(
        tasksCollection,
        where('assignedTo', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      if (!includeDeleted) {
        q = query(q, where('deleted', '==', false));
      }
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`👤 Task per utente ${userId}: ${tasks.length}`);
      return tasks;
    } catch (error) {
      console.error('❌ Errore recupero task utente:', error);
      throw new Error('Impossibile caricare i tuoi task. Riprova più tardi.');
    }
  },
  
  async getDeletedByUser(userId) {
    try {
      const q = query(
        tasksCollection,
        where('assignedTo', '==', userId),
        where('deleted', '==', true),
        orderBy('deletedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`🗑️ Task eliminati per utente ${userId}: ${tasks.length}`);
      return tasks;
    } catch (error) {
      console.error('❌ Errore recupero task eliminati:', error);
      throw new Error('Impossibile caricare i task eliminati. Riprova più tardi.');
    }
  },
  
  async getById(taskId) {
    try {
      const docRef = doc(tasksCollection, taskId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Task non trovato');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('❌ Errore recupero task:', taskId, error);
      throw new Error('Task non trovato o errore di caricamento.');
    }
  },
  
  async update(taskId, updates) {
    try {
      const docRef = doc(tasksCollection, taskId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      if (updates.status === 'completato' && !updates.completedAt) {
        updateData.completedAt = serverTimestamp();
      }
      
      await updateDoc(docRef, updateData);
      console.log('✅ Task aggiornato:', taskId);
      
      if (updates.status === 'completato') {
        await this.logActivity('task_completed', `Task completato`, taskId);
      } else if (updates.status) {
        await this.logActivity('task_updated', `Task aggiornato a "${updates.status}"`, taskId);
      } else if (updates.progress !== undefined) {
        await this.logActivity('progress_updated', `Progresso aggiornato a ${updates.progress}%`, taskId);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento task:', error);
      throw new Error('Impossibile aggiornare il task. Riprova più tardi.');
    }
  },
  
  async softDelete(taskId, userId) {
    try {
      const docRef = doc(tasksCollection, taskId);
      await updateDoc(docRef, {
        deleted: true,
        deletedBy: userId,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('🗑️ Task eliminato (soft):', taskId);
      await this.logActivity('task_deleted', `Task eliminato nel cestino`, taskId);
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione task:', error);
      throw new Error('Impossibile eliminare il task. Riprova più tardi.');
    }
  },
  
  async restore(taskId) {
    try {
      const docRef = doc(tasksCollection, taskId);
      await updateDoc(docRef, {
        deleted: false,
        deletedBy: null,
        deletedAt: null,
        updatedAt: serverTimestamp(),
        status: 'assegnato'
      });
      
      console.log('🔄 Task ripristinato:', taskId);
      await this.logActivity('task_restored', `Task ripristinato dal cestino`, taskId);
      
      return true;
    } catch (error) {
      console.error('❌ Errore ripristino task:', error);
      throw new Error('Impossibile ripristinare il task. Riprova più tardi.');
    }
  },
  
  async permanentDelete(taskId) {
    try {
      const docRef = doc(tasksCollection, taskId);
      await deleteDoc(docRef);
      
      console.log('💀 Task eliminato permanentemente:', taskId);
      await this.logActivity('task_permanent_delete', `Task eliminato permanentemente`, taskId);
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione permanente:', error);
      throw new Error('Impossibile eliminare definitivamente il task. Riprova più tardi.');
    }
  },
  
  async emptyTrash(userId) {
    try {
      const deletedTasks = await this.getDeletedByUser(userId);
      const batch = writeBatch(db);
      
      deletedTasks.forEach(task => {
        const taskRef = doc(tasksCollection, task.id);
        batch.delete(taskRef);
      });
      
      await batch.commit();
      console.log(`🗑️ Cestino svuotato per utente ${userId}: ${deletedTasks.length} task eliminati`);
      
      await this.logActivity('trash_emptied', `Cestino svuotato (${deletedTasks.length} task)`);
      
      return { success: true, count: deletedTasks.length };
    } catch (error) {
      console.error('❌ Errore svuotamento cestino:', error);
      throw new Error('Impossibile svuotare il cestino. Riprova più tardi.');
    }
  },
  
  async getUserStatsAdvanced(userId, period = 'month') {
    try {
      const userTasks = await this.getByUser(userId);
      const deletedTasks = await this.getDeletedByUser(userId);
      
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }
      
      const recentTasks = userTasks.filter(task => {
        if (!task.createdAt) return false;
        const taskDate = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
        return taskDate >= startDate;
      });
      
      const completedTasks = userTasks.filter(t => t.status === 'completato');
      const inProgressTasks = userTasks.filter(t => t.status === 'in corso');
      const overdueTasks = userTasks.filter(task => {
        if (!task.dueDate || task.status === 'completato') return false;
        const due = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        return due < new Date();
      });
      
      let totalCompletionTime = 0;
      let completedWithDates = 0;
      
      completedTasks.forEach(task => {
        if (task.createdAt && task.completedAt) {
          const created = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
          const completed = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
          const days = Math.round((completed - created) / (1000 * 60 * 60 * 24));
          if (days > 0) {
            totalCompletionTime += days;
            completedWithDates++;
          }
        }
      });
      
      const averageCompletionTime = completedWithDates > 0 
        ? Math.round(totalCompletionTime / completedWithDates) 
        : 0;
      
      const completionRate = userTasks.length > 0 
        ? Math.round((completedTasks.length / userTasks.length) * 100) 
        : 0;
      
      const timelinessScore = userTasks.length > 0
        ? Math.round(((userTasks.length - overdueTasks.length) / userTasks.length) * 100)
        : 100;
      
      const progressScore = userTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / userTasks.length;
      
      const productivityScore = userTasks.length > 0
        ? Math.round(
            (completionRate * 0.5) + 
            (timelinessScore * 0.3) + 
            (progressScore * 0.2)
          )
        : 0;
      
      const priorityDistribution = {
        critica: userTasks.filter(t => t.priority === 'critica').length,
        alta: userTasks.filter(t => t.priority === 'alta').length,
        media: userTasks.filter(t => t.priority === 'media').length,
        bassa: userTasks.filter(t => t.priority === 'bassa').length
      };
      
      const categoryDistribution = {};
      userTasks.forEach(task => {
        const category = task.category || 'generale';
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      });
      
      return {
        summary: {
          totalTasks: userTasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          pendingTasks: userTasks.filter(t => t.status === 'assegnato').length,
          overdueTasks: overdueTasks.length,
          deletedTasks: deletedTasks.length,
          completionRate,
          averageCompletionTime,
          productivityScore,
          timelinessScore
        },
        
        distribution: {
          byPriority: priorityDistribution,
          byCategory: categoryDistribution,
          byStatus: {
            completato: completedTasks.length,
            in_corso: inProgressTasks.length,
            assegnato: userTasks.filter(t => t.status === 'assegnato').length,
            bloccato: userTasks.filter(t => t.status === 'bloccato').length
          }
        },
        
        recentActivity: {
          period: period,
          tasksInPeriod: recentTasks.length,
          completedInPeriod: recentTasks.filter(t => t.status === 'completato').length,
          completionRateInPeriod: recentTasks.length > 0 
            ? Math.round((recentTasks.filter(t => t.status === 'completato').length / recentTasks.length) * 100)
            : 0
        },
        
        metrics: {
          efficiency: completionRate,
          speed: 100 - Math.min(averageCompletionTime * 10, 100),
          quality: timelinessScore,
          consistency: progressScore
        }
      };
      
    } catch (error) {
      console.error('❌ Errore statistiche avanzate:', error);
      return {
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          deletedTasks: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          productivityScore: 0,
          timelinessScore: 0
        },
        distribution: {
          byPriority: { critica: 0, alta: 0, media: 0, bassa: 0 },
          byCategory: {},
          byStatus: { completato: 0, in_corso: 0, assegnato: 0, bloccato: 0 }
        },
        recentActivity: {
          period: period,
          tasksInPeriod: 0,
          completedInPeriod: 0,
          completionRateInPeriod: 0
        },
        metrics: {
          efficiency: 0,
          speed: 0,
          quality: 0,
          consistency: 0
        }
      };
    }
  },
  
  async logActivity(action, description, taskId = null) {
    try {
      const user = getCurrentUser() || {};

      await addDoc(activityCollection, {
        action,
        description,
        userId: user.uid,
        userName: user.name,
        taskId,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
    } catch (error) {
      console.error('❌ Errore log attività:', error);
    }
  }
};

/**
 * Servizio Utenti
 */
export const userService = {
  async getAll() {
    try {
      const q = query(usersCollection, where('isActive', '==', true), orderBy('name'));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`👥 Utenti attivi: ${users.length}`);
      return users;
    } catch (error) {
      console.error('❌ Errore recupero utenti:', error);
      throw new Error('Impossibile caricare gli utenti. Riprova più tardi.');
    }
  },
  
  async getById(userId) {
    try {
      const docRef = doc(usersCollection, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Utente non trovato');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('❌ Errore recupero utente:', error);
      throw new Error('Utente non trovato.');
    }
  },
  
  async getEmployees() {
    try {
      const q = query(
        usersCollection,
        where('isActive', '==', true),
        where('role', '==', 'dipendente'),
        orderBy('name')
      );
      
      const snapshot = await getDocs(q);
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`👨‍💼 Dipendenti attivi: ${employees.length}`);
      return employees;
    } catch (error) {
      console.error('❌ Errore recupero dipendenti:', error);
      throw new Error('Impossibile caricare i dipendenti. Riprova più tardi.');
    }
  },
  
  async update(userId, updates) {
    try {
      const docRef = doc(usersCollection, userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      console.log('✅ Utente aggiornato:', userId);
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento utente:', error);
      throw new Error('Impossibile aggiornare l\'utente. Riprova più tardi.');
    }
  },
  
  async updateProfile(userId, profileData) {
    try {
      const allowedFields = ['name', 'department', 'phone', 'bio', 'avatar', 'preferences'];
      const updateData = {};
      
      Object.keys(profileData).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = profileData[key];
        }
      });
      
      if (Object.keys(updateData).length === 0) {
        throw new Error('Nessun campo valido da aggiornare');
      }
      
      updateData.updatedAt = serverTimestamp();
      
      const docRef = doc(usersCollection, userId);
      await updateDoc(docRef, updateData);
      
      console.log('✅ Profilo aggiornato per utente:', userId);
      return { success: true, updatedFields: Object.keys(updateData) };
      
    } catch (error) {
      console.error('❌ Errore aggiornamento profilo:', error);
      throw new Error('Impossibile aggiornare il profilo. Riprova più tardi.');
    }
  }
};

/**
 * Servizio Statistiche
 */
export const statsService = {
  async getDashboardStats() {
    try {
      const tasksQuery = query(tasksCollection, where('deleted', '==', false));
      const tasksSnapshot = await getDocs(tasksQuery);
      const allTasks = tasksSnapshot.docs.map(doc => doc.data());
      
      const usersQuery = query(usersCollection, where('isActive', '==', true));
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers = usersSnapshot.docs.map(doc => doc.data());
      
      const stats = {
        totalTasks: allTasks.length,
        totalUsers: allUsers.length,
        
        tasksByStatus: {
          assegnato: allTasks.filter(t => t.status === 'assegnato').length,
          in_corso: allTasks.filter(t => t.status === 'in corso').length,
          completato: allTasks.filter(t => t.status === 'completato').length,
          bloccato: allTasks.filter(t => t.status === 'bloccato').length
        },
        
        tasksByPriority: {
          critica: allTasks.filter(t => t.priority === 'critica').length,
          alta: allTasks.filter(t => t.priority === 'alta').length,
          media: allTasks.filter(t => t.priority === 'media').length,
          bassa: allTasks.filter(t => t.priority === 'bassa').length
        },
        
        usersByRole: {
          admin: allUsers.filter(u => u.role === 'admin').length,
          dipendente: allUsers.filter(u => u.role === 'dipendente').length
        }
      };
      
      stats.completionRate = stats.totalTasks > 0 
        ? Math.round((stats.tasksByStatus.completato / stats.totalTasks) * 100)
        : 0;
      
      console.log('📊 Statistiche calcolate:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Errore calcolo statistiche:', error);
      return {
        totalTasks: 0,
        totalUsers: 0,
        tasksByStatus: { assegnato: 0, in_corso: 0, completato: 0, bloccato: 0 },
        tasksByPriority: { critica: 0, alta: 0, media: 0, bassa: 0 },
        usersByRole: { admin: 0, dipendente: 0 },
        completionRate: 0
      };
    }
  },
  
  async getUserStats(userId) {
    try {
      return await taskService.getUserStatsAdvanced(userId, 'month');
    } catch (error) {
      console.error('❌ Errore statistiche utente:', error);
      return taskService.getUserStatsAdvanced(userId, 'month');
    }
  },
  
  async getWeeklyReport(userId) {
    try {
      const stats = await taskService.getUserStatsAdvanced(userId, 'week');
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      
      return {
        period: {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
          label: `Settimana ${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
        },
        summary: stats.summary,
        highlights: {
          mostProductiveDay: 'Lunedì',
          tasksCompleted: stats.summary.completedTasks,
          averageTaskTime: `${stats.summary.averageCompletionTime} giorni`,
          overdueTasks: stats.summary.overdueTasks
        },
        recommendations: this.generateRecommendations(stats)
      };
      
    } catch (error) {
      console.error('❌ Errore report settimanale:', error);
      return {
        period: { start: '', end: '', label: '' },
        summary: {},
        highlights: {},
        recommendations: []
      };
    }
  },
  
  generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.summary.completionRate < 60) {
      recommendations.push({
        type: 'improvement',
        title: 'Aumenta il tasso di completamento',
        description: `Il tuo tasso di completamento è ${stats.summary.completionRate}%. Punta almeno al 70%.`,
        action: 'Focus su task in corso'
      });
    }
    
    if (stats.summary.overdueTasks > 0) {
      recommendations.push({
        type: 'urgent',
        title: 'Task in ritardo',
        description: `Hai ${stats.summary.overdueTasks} task in ritardo. Pianificali come priorità.`,
        action: 'Revisiona scadenze'
      });
    }
    
    if (stats.summary.averageCompletionTime > 7) {
      recommendations.push({
        type: 'efficiency',
        title: 'Ottimizza i tempi',
        description: `Il tempo medio di completamento è ${stats.summary.averageCompletionTime} giorni. Prova a ridurlo.`,
        action: 'Suddividi task complessi'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'excellent',
        title: 'Ottimo lavoro!',
        description: 'Le tue performance sono eccellenti. Continua così!',
        action: 'Mantieni il ritmo'
      });
    }
    
    return recommendations;
  }
};

/**
 * Servizio sincronizzazione Authentication ↔ Firestore - VERSIONE CORRETTA
 */
export const authSyncService = {
  /**
   * Sincronizza utente Firebase Authentication con Firestore
   */
  async syncUserToFirestore(firebaseUser, additionalData = {}) {
    try {
      console.log('🔄 [authSync] Sincronizzazione per:', firebaseUser.email);
      
      const userRef = doc(usersCollection, firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      let userData;
      
      if (userSnap.exists()) {
        // UTENTE ESISTENTE - Preserva il ruolo
        const existingData = userSnap.data();
        console.log('✅ [authSync] Utente esistente trovato:', {
          email: existingData.email,
          ruolo: existingData.role,
          name: existingData.name
        });
        
        userData = {
          ...existingData,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || existingData.photoURL || '',
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // FORZA admin se l'email è admin@gariboldi.com
        if (firebaseUser.email === 'admin@gariboldi.com') {
          console.log('👑 [authSync] RILEVATO ADMIN - Forzo ruolo admin');
          userData.role = 'admin';
          userData.isAdmin = true;
        }
        
      } else {
        // NUOVO UTENTE
        console.log('🆕 [authSync] Nuovo utente, creo documento');
        
        // SPECIALE: Se è admin@gariboldi.com, è sempre admin
        const isAdminEmail = firebaseUser.email === 'admin@gariboldi.com';
        
        userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: isAdminEmail ? 'Administrator' : (additionalData.name || firebaseUser.email.split('@')[0]),
          role: isAdminEmail ? 'admin' : (additionalData.role || 'dipendente'),
          department: isAdminEmail ? 'Amministrazione' : (additionalData.department || 'Generale'),
          photoURL: firebaseUser.photoURL || '',
          isActive: true,
          isAdmin: isAdminEmail,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...additionalData
        };
      }
      
      await setDoc(userRef, userData, { merge: true });
      
      console.log('✅ [authSync] Utente sincronizzato:', {
        email: userData.email,
        role: userData.role,
        name: userData.name
      });
      
      return {
        id: userRef.id,
        ...userData
      };
      
    } catch (error) {
      console.error('❌ [authSync] Errore sincronizzazione:', error);
      throw new Error('Impossibile sincronizzare utente con database');
    }
  },
  
  /**
   * DEBUG: Controlla tutti gli utenti
   */
  async debugAllUsers() {
    try {
      const snapshot = await getDocs(usersCollection);
      console.log('👥 [DEBUG] Tutti gli utenti:');
      snapshot.forEach(doc => {
        console.log(`  ${doc.id}:`, {
          email: doc.data().email,
          role: doc.data().role,
          name: doc.data().name
        });
      });
    } catch (error) {
      console.error('❌ [DEBUG] Errore:', error);
    }
  },
  
  /**
   * Correggi manualmente il ruolo di un utente
   */
  async fixUserRole(userId, newRole) {
    try {
      const userRef = doc(usersCollection, userId);
      await updateDoc(userRef, {
        role: newRole,
        isAdmin: newRole === 'admin',
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Ruolo corretto a ${newRole} per ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Errore correzione ruolo:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================
// 🟢 GOOGLE DRIVE FILE SERVICES - AGGIUNTI QUI
// ============================================

/**
 * Salva i metadati di un file da Google Drive
 */
export const saveDriveFileMetadata = async (fileData, employeeId, category = 'generale') => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Utente non autenticato');

    const fileMetadata = {
      employeeId,
      driveFileId: fileData.id,
      driveUrl: fileData.url,
      fileName: fileData.name,
      fileMimeType: fileData.mimeType,
      fileSize: fileData.size || 0,
      category,
      uploadedBy: user.uid,
      uploadedByEmail: user.email,
      uploadDate: serverTimestamp(),
      lastModified: serverTimestamp(),
      status: 'attivo',
      source: 'google_drive',
      iconUrl: fileData.iconUrl,
      thumbnail: fileData.thumbnail || null,
      deleted: false,
      deletedAt: null,
      deletedBy: null
    };

    const docRef = await addDoc(employeeFilesCollection, fileMetadata);
    console.log('✅ File Drive salvato:', docRef.id);
    
    return { id: docRef.id, ...fileMetadata };
  } catch (error) {
    console.error('❌ Errore salvataggio file Drive:', error);
    throw new Error('Impossibile salvare il riferimento al file');
  }
};

/**
 * Recupera tutti i file di un dipendente
 */
export const getEmployeeFiles = async (employeeId) => {
  try {
    const q = query(
      employeeFilesCollection,
      where('employeeId', '==', employeeId),
      where('deleted', '==', false),
      orderBy('uploadDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadDate: doc.data().uploadDate?.toDate() || new Date(),
      lastModified: doc.data().lastModified?.toDate() || new Date()
    }));
    
    console.log(`📎 File recuperati per dipendente ${employeeId}: ${files.length}`);
    return files;
  } catch (error) {
    console.error('❌ Errore recupero file dipendente:', error);
    throw new Error('Impossibile caricare i file');
  }
};

/**
 * Recupera tutti i file (per admin)
 */
export const getAllEmployeeFiles = async () => {
  try {
    const q = query(
      employeeFilesCollection,
      where('deleted', '==', false),
      orderBy('uploadDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadDate: doc.data().uploadDate?.toDate() || new Date()
    }));
    
    console.log(`📎 Totale file in sistema: ${files.length}`);
    return files;
  } catch (error) {
    console.error('❌ Errore recupero tutti i file:', error);
    throw new Error('Impossibile caricare i file');
  }
};

/**
 * Elimina un file (soft delete)
 */
export const deleteEmployeeFile = async (fileId) => {
  try {
    const user = getCurrentUser();
    const fileRef = doc(employeeFilesCollection, fileId);
    
    await updateDoc(fileRef, {
      deleted: true,
      deletedBy: user?.uid || 'unknown',
      deletedAt: serverTimestamp(),
      status: 'eliminato'
    });
    
    console.log('🗑️ File eliminato (soft):', fileId);
    return true;
  } catch (error) {
    console.error('❌ Errore eliminazione file:', error);
    throw new Error('Impossibile eliminare il file');
  }
};

/**
 * Elimina file permanentemente
 */
export const permanentDeleteEmployeeFile = async (fileId) => {
  try {
    const fileRef = doc(employeeFilesCollection, fileId);
    await deleteDoc(fileRef);
    
    console.log('💀 File eliminato permanentemente:', fileId);
    return true;
  } catch (error) {
    console.error('❌ Errore eliminazione permanente file:', error);
    throw new Error('Impossibile eliminare definitivamente il file');
  }
};

/**
 * Recupera file eliminati di un dipendente (cestino)
 */
export const getDeletedEmployeeFiles = async (employeeId) => {
  try {
    const q = query(
      employeeFilesCollection,
      where('employeeId', '==', employeeId),
      where('deleted', '==', true),
      orderBy('deletedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deletedAt: doc.data().deletedAt?.toDate() || new Date()
    }));
    
    console.log(`🗑️ File nel cestino per ${employeeId}: ${files.length}`);
    return files;
  } catch (error) {
    console.error('❌ Errore recupero cestino:', error);
    throw new Error('Impossibile caricare il cestino');
  }
};

/**
 * Ripristina file dal cestino
 */
export const restoreEmployeeFile = async (fileId) => {
  try {
    const fileRef = doc(employeeFilesCollection, fileId);
    
    await updateDoc(fileRef, {
      deleted: false,
      deletedBy: null,
      deletedAt: null,
      status: 'attivo',
      restoredAt: serverTimestamp()
    });
    
    console.log('🔄 File ripristinato:', fileId);
    return true;
  } catch (error) {
    console.error('❌ Errore ripristino file:', error);
    throw new Error('Impossibile ripristinare il file');
  }
};

/**
 * Svuota cestino di un dipendente
 */
export const emptyEmployeeTrash = async (employeeId) => {
  try {
    const deletedFiles = await getDeletedEmployeeFiles(employeeId);
    const batch = writeBatch(db);
    
    deletedFiles.forEach(file => {
      const fileRef = doc(employeeFilesCollection, file.id);
      batch.delete(fileRef);
    });
    
    await batch.commit();
    console.log(`🗑️ Cestino svuotato per ${employeeId}: ${deletedFiles.length} file eliminati`);
    
    return { success: true, count: deletedFiles.length };
  } catch (error) {
    console.error('❌ Errore svuotamento cestino:', error);
    throw new Error('Impossibile svuotare il cestino');
  }
};

/**
 * Ottiene statistiche file per dipendente
 */
export const getEmployeeFileStats = async (employeeId) => {
  try {
    const allFiles = await getEmployeeFiles(employeeId);
    const deletedFiles = await getDeletedEmployeeFiles(employeeId);
    
    const byCategory = {};
    allFiles.forEach(file => {
      const category = file.category || 'generale';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });
    
    const byType = {};
    allFiles.forEach(file => {
      const mime = file.fileMimeType?.split('/')[0] || 'unknown';
      byType[mime] = (byType[mime] || 0) + 1;
    });
    
    const totalSize = allFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0);
    
    return {
      totalFiles: allFiles.length,
      deletedFiles: deletedFiles.length,
      activeFiles: allFiles.length,
      totalSize,
      byCategory,
      byType,
      lastUpload: allFiles[0]?.uploadDate || null
    };
  } catch (error) {
    console.error('❌ Errore statistiche file:', error);
    throw new Error('Impossibile calcolare statistiche');
  }
};

// ============================================
// EXPORT COMPLETO
// ============================================

// Esporta tutti i servizi
export default {
  tasks: taskService,
  users: userService,
  stats: statsService,
  authSync: authSyncService,
  files: {
    saveDriveFileMetadata,
    getEmployeeFiles,
    getAllEmployeeFiles,
    deleteEmployeeFile,
    permanentDeleteEmployeeFile,
    getDeletedEmployeeFiles,
    restoreEmployeeFile,
    emptyEmployeeTrash,
    getEmployeeFileStats
  }
};