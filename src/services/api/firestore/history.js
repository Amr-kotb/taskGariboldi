// src/services/api/firestore/history.js
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  formatFirestoreData, 
  handleFirestoreError 
} from '../../firebase/helpers';

/**
 * Recupera tutte le attività dal Firestore
 */
export const getAllActivities = async (filters = {}, limitCount = 100) => {
  try {
    console.log('📥 [History Service] Recupero attività con filtri:', filters);
    
    const activitiesRef = collection(db, 'activities');
    let activitiesQuery = query(activitiesRef);
    
    // Costruisci un array di condizioni
    const conditions = [];
    
    if (filters.userId && filters.userId !== 'all') {
      conditions.push(where('userId', '==', filters.userId));
    }
    
    if (filters.project && filters.project !== 'all') {
      conditions.push(where('project', '==', filters.project));
    }
    
    if (filters.complexity && filters.complexity !== 'all') {
      conditions.push(where('complexity', '==', filters.complexity));
    }
    
    if (filters.status && filters.status !== 'all') {
      conditions.push(where('status', '==', filters.status));
    }
    
    // Filtro per data
    if (filters.startDate) {
      try {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        conditions.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
      } catch (dateError) {
        console.error('Errore nella data di inizio:', dateError);
      }
    }
    
    if (filters.endDate) {
      try {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
      } catch (dateError) {
        console.error('Errore nella data di fine:', dateError);
      }
    }
    
    // Aggiungi ordine
    conditions.push(orderBy('timestamp', 'desc'));
    
    // Limita i risultati
    if (limitCount) {
      conditions.push(limit(limitCount));
    }
    
    // Costruisci la query
    if (conditions.length > 0) {
      activitiesQuery = query(activitiesRef, ...conditions);
    }
    
    const snapshot = await getDocs(activitiesQuery);
    
    const activities = [];
    snapshot.forEach((doc) => {
      const activity = formatFirestoreData(doc);
      if (activity) {
        activities.push(activity);
      }
    });
    
    console.log(`✅ [History Service] Trovate ${activities.length} attività`);
    
    return {
      success: true,
      data: activities,
      total: activities.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Errore nel recupero attività:', error);
    
    // Se c'è un errore di indice, prova una query più semplice
    if (error.code === 'failed-precondition') {
      try {
        console.log('🔄 Tentativo con query semplificata...');
        const activitiesRef = collection(db, 'activities');
        const simpleQuery = query(activitiesRef, orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(simpleQuery);
        
        const activities = [];
        snapshot.forEach((doc) => {
          const activity = formatFirestoreData(doc);
          if (activity) {
            activities.push(activity);
          }
        });
        
        console.log(`✅ [History Service] Trovate ${activities.length} attività con query semplificata`);
        
        return {
          success: true,
          data: activities,
          total: activities.length,
          timestamp: new Date().toISOString(),
          warning: 'Query semplificata a causa di limitazioni Firestore'
        };
      } catch (simpleError) {
        return handleFirestoreError(simpleError, 'getAllActivities (semplificata)');
      }
    }
    
    return handleFirestoreError(error, 'getAllActivities');
  }
};

/**
 * Recupera le statistiche delle attività
 */
export const getActivitiesStats = async (filters = {}) => {
  try {
    console.log('📊 [History Service] Calcolo statistiche attività');
    
    const result = await getAllActivities(filters, 500);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Cannot calculate stats',
        data: null,
        timestamp: new Date().toISOString()
      };
    }
    
    const activities = result.data;
    
    // Calcola statistiche
    const stats = {
      totalTasks: activities.length,
      totalHours: activities.reduce((sum, act) => sum + (act.hoursSpent || 0), 0),
      avgQualityScore: activities.length > 0 
        ? Math.round(activities.reduce((sum, act) => sum + (act.qualityScore || 0), 0) / activities.length)
        : 0,
      
      byComplexity: {
        bassa: activities.filter(a => a.complexity === 'bassa').length,
        media: activities.filter(a => a.complexity === 'media').length,
        alta: activities.filter(a => a.complexity === 'alta').length,
        molto_alta: activities.filter(a => a.complexity === 'molto_alta').length
      },
      
      byProject: {},
      byUser: {}
    };
    
    // Calcola per progetto
    activities.forEach(act => {
      if (act.project) {
        stats.byProject[act.project] = (stats.byProject[act.project] || 0) + 1;
      }
    });
    
    // Calcola per utente
    activities.forEach(act => {
      if (act.userId) {
        if (!stats.byUser[act.userId]) {
          stats.byUser[act.userId] = {
            name: act.userName || 'Sconosciuto',
            tasks: 0,
            hours: 0,
            totalScore: 0
          };
        }
        
        stats.byUser[act.userId].tasks++;
        stats.byUser[act.userId].hours += act.hoursSpent || 0;
        stats.byUser[act.userId].totalScore += act.qualityScore || 0;
      }
    });
    
    // Calcola media per utente
    Object.keys(stats.byUser).forEach(userId => {
      const userStats = stats.byUser[userId];
      userStats.avgScore = userStats.tasks > 0 
        ? Math.round(userStats.totalScore / userStats.tasks)
        : 0;
    });
    
    console.log('✅ [History Service] Statistiche calcolate');
    
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return handleFirestoreError(error, 'getActivitiesStats');
  }
};

/**
 * Esporta le attività in formato CSV
 */
export const exportActivitiesToCSV = async (filters = {}) => {
  try {
    console.log('📤 [History Service] Esportazione attività in CSV');
    
    const result = await getAllActivities(filters, 1000);
    
    if (!result.success || !result.data) {
      throw new Error('Impossibile recuperare le attività per l\'esportazione');
    }
    
    const activities = result.data;
    
    if (activities.length === 0) {
      throw new Error('Nessuna attività da esportare');
    }
    
    // Headers CSV
    const headers = [
      'ID',
      'Data',
      'Utente',
      'Email Utente',
      'Ruolo Utente',
      'Tipo Attività',
      'Titolo Task',
      'Descrizione',
      'Progetto',
      'Ore Lavorate',
      'Punteggio Qualità',
      'Complessità',
      'Stato',
      'Tecnologie',
      'Dipartimento'
    ];
    
    // Converti attività in righe CSV
    const rows = activities.map(activity => {
      return [
        activity.id || '',
        activity.timestamp ? new Date(activity.timestamp).toLocaleString('it-IT') : '',
        activity.userName || '',
        activity.userEmail || '',
        activity.userRole || '',
        activity.type || '',
        activity.taskTitle || '',
        activity.description || '',
        activity.project || '',
        activity.hoursSpent || 0,
        activity.qualityScore || 0,
        activity.complexity || '',
        activity.status || '',
        Array.isArray(activity.technologies) ? activity.technologies.join(', ') : '',
        activity.department || ''
      ];
    });
    
    // Crea contenuto CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    console.log(`✅ [History Service] CSV pronto con ${activities.length} record`);
    
    return {
      success: true,
      data: csvContent,
      count: activities.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return handleFirestoreError(error, 'exportActivitiesToCSV');
  }
};

/**
 * Crea attività di esempio per test
 */
export const createSampleActivities = async (count = 10) => {
  try {
    console.log(`🎬 [History Service] Creazione ${count} attività di esempio`);
    
    const sampleUsers = [
      { id: '1', name: 'Leonardo Rossi', email: 'leo@gariboldi.com', role: 'dipendente' },
      { id: '2', name: 'Andrea Bianchi', email: 'andrea@gariboldi.com', role: 'dipendente' },
      { id: '3', name: 'Domenico Verdi', email: 'domenico@gariboldi.com', role: 'dipendente' },
      { id: '4', name: 'Stefano Neri', email: 'stefano@gariboldi.com', role: 'dipendente' },
      { id: '5', name: 'Admin System', email: 'admin@gariboldi.com', role: 'admin' }
    ];
    
    const sampleProjects = ['Sistema Gestione Task', 'Ottimizzazione Infrastruttura', 'Marketing 2024'];
    const sampleTechnologies = ['React', 'Node.js', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'Python', 'JavaScript'];
    
    const activities = [];
    
    for (let i = 0; i < count; i++) {
      const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const activityDate = new Date();
      activityDate.setDate(activityDate.getDate() - daysAgo);
      
      const activityData = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        type: 'task_completed',
        title: 'Task Completato',
        description: `Attività di esempio ${i + 1} completata da ${user.name}.`,
        taskId: `TASK-${1000 + i}`,
        taskTitle: `Task Esempio ${i + 1}`,
        project: sampleProjects[Math.floor(Math.random() * sampleProjects.length)],
        client: 'Gariboldi SRL',
        hoursSpent: Math.floor(Math.random() * 40) + 10,
        qualityScore: Math.floor(Math.random() * 30) + 70,
        complexity: ['bassa', 'media', 'alta', 'molto_alta'][Math.floor(Math.random() * 4)],
        status: ['completed', 'approved', 'in_review'][Math.floor(Math.random() * 3)],
        technologies: sampleTechnologies.slice(0, Math.floor(Math.random() * 4) + 2),
        department: 'Sviluppo',
        timestamp: Timestamp.fromDate(activityDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const activitiesRef = collection(db, 'activities');
      const docRef = await addDoc(activitiesRef, activityData);
      
      activities.push({
        id: docRef.id,
        ...activityData
      });
    }
    
    console.log(`✅ [History Service] Create ${activities.length} attività di esempio`);
    
    return {
      success: true,
      data: activities,
      count: activities.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return handleFirestoreError(error, 'createSampleActivities');
  }
};