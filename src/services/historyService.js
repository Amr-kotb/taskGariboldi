import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  startAfter,
  endBefore,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
// 🔧 COSTANTI
export const HISTORY_TYPES = {
  TASK_COMPLETED: 'task_completed',
  TASK_CREATED: 'task_created',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  USER_ACTION: 'user_action',
  SYSTEM_EVENT: 'system_event',
  COMMENT_ADDED: 'comment_added'
};

export const COMPLEXITY_LEVELS = {
  LOW: 'bassa',
  MEDIUM: 'media',
  HIGH: 'alta',
  VERY_HIGH: 'molto_alta'
};

export const TASK_STATUS = {
  COMPLETED: 'completed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_REVIEW: 'in_review'
};

// 📊 FUNZIONI PRINCIPALI

/**
 * Recupera lo storico dei task completati con filtri
 */
export const getCompletedTasksHistory = async (options = {}) => {
  try {
    const {
      userId = null,
      project = null,
      startDate = null,
      endDate = null,
      complexity = null,
      limitCount = 50,
      lastDoc = null
    } = options;

    console.log('📥 [HistoryService] Recupero storico con opzioni:', options);

    let q = query(
      collection(db, 'history'),
      where('type', '==', HISTORY_TYPES.TASK_COMPLETED),
      orderBy('completedAt', 'desc')
    );

    // Applica filtri dinamici
    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (project) {
      q = query(q, where('project', '==', project));
    }

    if (complexity) {
      q = query(q, where('complexity', '==', complexity));
    }

    if (startDate && endDate) {
      q = query(
        q,
        where('completedAt', '>=', startDate),
        where('completedAt', '<=', endDate)
      );
    }

    // Limite e paginazione
    if (lastDoc) {
      q = query(q, startAfter(lastDoc), limit(limitCount));
    } else {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    
    console.log(`✅ [HistoryService] Trovati ${querySnapshot.size} record`);

    const activities = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        ...data,
        completedAt: data.completedAt?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      });
    });

    return {
      success: true,
      data: activities,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1],
      total: querySnapshot.size
    };

  } catch (error) {
    console.error('❌ [HistoryService] Errore recupero storico:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Recupera statistiche dello storico
 */
export const getHistoryStats = async (options = {}) => {
  try {
    const { userId = null, startDate = null, endDate = null } = options;

    console.log('📊 [HistoryService] Calcolo statistiche storico');

    let q = query(
      collection(db, 'history'),
      where('type', '==', HISTORY_TYPES.TASK_COMPLETED),
      where('deleted', '==', false)
    );

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    const querySnapshot = await getDocs(q);
    
    const stats = {
      totalTasks: 0,
      totalHours: 0,
      avgQualityScore: 0,
      byComplexity: {},
      byProject: {},
      byUser: {},
      byHour: Array(24).fill(0),
      byDay: Array(7).fill(0),
      timeline: []
    };

    let totalQualityScore = 0;
    let totalEfficiency = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      stats.totalTasks++;
      stats.totalHours += data.hoursSpent || 0;
      totalQualityScore += data.qualityScore || 0;
      totalEfficiency += data.efficiency || 1;

      // Complessità
      const complexity = data.complexity || COMPLEXITY_LEVELS.MEDIUM;
      stats.byComplexity[complexity] = (stats.byComplexity[complexity] || 0) + 1;

      // Progetti
      const project = data.project || 'Generico';
      stats.byProject[project] = (stats.byProject[project] || 0) + 1;

      // Utenti
      const userId = data.userId;
      if (userId) {
        if (!stats.byUser[userId]) {
          stats.byUser[userId] = {
            name: data.userName,
            tasks: 0,
            hours: 0,
            avgScore: 0,
            totalScore: 0
          };
        }
        stats.byUser[userId].tasks++;
        stats.byUser[userId].hours += data.hoursSpent || 0;
        stats.byUser[userId].totalScore += data.qualityScore || 0;
      }

      // Distribuzione oraria
      const completedAt = data.completedAt?.toDate?.() || new Date();
      const hour = completedAt.getHours();
      stats.byHour[hour]++;

      // Distribuzione giornaliera
      const day = completedAt.getDay(); // 0 = Domenica
      stats.byDay[day]++;

      // Timeline per grafico
      const dateStr = completedAt.toISOString().split('T')[0];
      const existing = stats.timeline.find(item => item.date === dateStr);
      if (existing) {
        existing.tasks++;
        existing.hours += data.hoursSpent || 0;
      } else {
        stats.timeline.push({
          date: dateStr,
          tasks: 1,
          hours: data.hoursSpent || 0
        });
      }
    });

    // Calcola medie
    if (stats.totalTasks > 0) {
      stats.avgQualityScore = Math.round(totalQualityScore / stats.totalTasks);
      stats.avgEfficiency = totalEfficiency / stats.totalTasks;
      
      // Calcola punteggio medio per utente
      Object.values(stats.byUser).forEach(user => {
        user.avgScore = Math.round(user.totalScore / user.tasks);
      });
    }

    // Ordina timeline per data
    stats.timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('✅ [HistoryService] Statistiche calcolate:', stats);

    return {
      success: true,
      data: stats,
      period: { startDate, endDate }
    };

  } catch (error) {
    console.error('❌ [HistoryService] Errore calcolo statistiche:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Esporta storico in CSV
 */
export const exportHistoryToCSV = async (options = {}) => {
  try {
    const result = await getCompletedTasksHistory({
      ...options,
      limitCount: 1000 // Limite per export
    });

    if (!result.success || result.data.length === 0) {
      return {
        success: false,
        message: 'Nessun dato da esportare'
      };
    }

    const headers = [
      'ID Task',
      'Titolo',
      'Descrizione',
      'Data Completamento',
      'Utente',
      'Ruolo',
      'Progetto',
      'Ore Lavorate',
      'Punteggio Qualità',
      'Complessità',
      'Stato',
      'Tecnologie',
      'Client',
      'Dipartimento',
      'Scadenza Originale',
      'Efficienza',
      'Rating',
      'Note'
    ];

    const rows = result.data.map(task => [
      task.taskId || '',
      task.taskTitle || '',
      task.description || '',
      task.completedAt ? task.completedAt.toLocaleString('it-IT') : '',
      task.userName || '',
      task.userRole || '',
      task.project || '',
      task.hoursSpent || 0,
      task.qualityScore || 0,
      task.complexity || '',
      task.status || '',
      Array.isArray(task.technologies) ? task.technologies.join(', ') : '',
      task.client || '',
      task.department || '',
      task.originalDeadline || '',
      task.efficiency || 1.0,
      task.rating || 0,
      task.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    return {
      success: true,
      data: {
        url,
        filename: `storico_tasks_${new Date().toISOString().split('T')[0]}.csv`,
        count: result.data.length,
        headers,
        rows
      }
    };

  } catch (error) {
    console.error('❌ [HistoryService] Errore esportazione CSV:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Inizializza dati di esempio (per sviluppo)
 */
export const initializeSampleHistory = async () => {
  try {
    const sampleTasks = [
      {
        taskId: 'TASK-' + Date.now(),
        taskTitle: 'Dashboard Amministrativa',
        description: 'Sviluppo dashboard con statistiche e grafici',
        userId: 'user_001',
        userName: 'Leonardo Rossi',
        userEmail: 'leo@gariboldi.com',
        userRole: 'dipendente',
        hoursSpent: 40,
        qualityScore: 95,
        project: 'Sistema Gestione Task',
        complexity: COMPLEXITY_LEVELS.HIGH,
        status: TASK_STATUS.APPROVED,
        technologies: ['React', 'Node.js', 'MongoDB', 'Chart.js'],
        tags: ['dashboard', 'admin', 'statistiche'],
        client: 'Gariboldi SRL',
        department: 'Sviluppo',
        originalDeadline: '2024-01-15',
        efficiency: 1.2,
        rating: 4.8,
        notes: 'Task completato con successo, buona qualità del codice'
      },
      {
        taskId: 'TASK-' + (Date.now() + 1),
        taskTitle: 'Migrazione Database',
        description: 'Migrazione da MySQL a PostgreSQL',
        userId: 'user_002',
        userName: 'Andrea Bianchi',
        userEmail: 'andrea@gariboldi.com',
        userRole: 'dipendente',
        hoursSpent: 60,
        qualityScore: 98,
        project: 'Ottimizzazione Infrastruttura',
        complexity: COMPLEXITY_LEVELS.VERY_HIGH,
        status: TASK_STATUS.COMPLETED,
        technologies: ['PostgreSQL', 'Docker', 'AWS RDS', 'Python'],
        tags: ['database', 'migrazione', 'infrastruttura'],
        client: 'Gariboldi SRL',
        department: 'IT',
        originalDeadline: '2024-01-10',
        efficiency: 1.1,
        rating: 4.9,
        notes: 'Migrazione completata senza downtime'
      }
    ];

    const results = [];
    for (const task of sampleTasks) {
      // Creazione diretta in Firestore
      const historyRef = collection(db, 'history');
      const newHistoryItem = {
        type: HISTORY_TYPES.TASK_COMPLETED,
        taskId: task.taskId,
        taskTitle: task.taskTitle,
        description: task.description,
        userId: task.userId,
        userName: task.userName,
        userEmail: task.userEmail,
        userRole: task.userRole,
        completedAt: new Date(),
        hoursSpent: task.hoursSpent,
        qualityScore: task.qualityScore,
        project: task.project,
        complexity: task.complexity,
        status: task.status,
        technologies: task.technologies,
        tags: task.tags,
        client: task.client,
        department: task.department,
        originalDeadline: task.originalDeadline,
        efficiency: task.efficiency,
        rating: task.rating,
        notes: task.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false
      };
      
      await addDoc(historyRef, newHistoryItem);
      results.push({ success: true, task: task.taskTitle });
    }

    console.log(`✅ [HistoryService] Inizializzati ${results.length} task di esempio`);

    return {
      success: true,
      message: `Inizializzati ${results.length} task di esempio`,
      results
    };

  } catch (error) {
    console.error('❌ [HistoryService] Errore inizializzazione esempio:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getCompletedTasksHistory,
  getHistoryStats,
  exportHistoryToCSV,
  initializeSampleHistory,
  HISTORY_TYPES,
  COMPLEXITY_LEVELS,
  TASK_STATUS
};