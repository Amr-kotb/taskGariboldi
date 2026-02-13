/**
 * API Service per statistiche e analitiche
 * Utilizza il servizio Firestore esistente
 */

import { statsService, userService } from '../../services/firebase/firestore';
import { TASK_STATUS, TASK_PRIORITY, getStatusName, getPriorityName } from '../../constants/statuses';

/**
 * Ottieni statistiche dashboard admin
 * @returns {Promise<Object>} Statistiche complete
 */
export const getAdminDashboardStats = async () => {
  try {
    console.log('📊 [analytics.js] Fetching admin dashboard stats');
    
    // Statistiche generali dal servizio esistente
    const dashboardStats = await statsService.getDashboardStats();
    
    // Recupera tutti gli utenti attivi
    const users = await userService.getEmployees();
    
    // Per ogni utente, calcola le statistiche individuali
    const userStatsPromises = users.map(async (user) => {
      const userStats = await statsService.getUserStats(user.id);
      return {
        userId: user.id,
        userName: user.name || user.email,
        ...userStats.data
      };
    });
    
    const usersWithStats = await Promise.all(userStatsPromises);
    
    // Calcola metriche aggiuntive
    const currentDate = new Date();
    const currentWeek = getWeekNumber(currentDate);
    
    // Task completati questa settimana per utente
    const weeklyCompletionByUser = usersWithStats.map(user => ({
      name: user.userName,
      completed: user.completedThisWeek || 0
    }));
    
    // Performance per priorità
    const performanceByPriority = {
      alta: calculatePerformanceByPriority(dashboardStats, 'alta'),
      media: calculatePerformanceByPriority(dashboardStats, 'media'),
      bassa: calculatePerformanceByPriority(dashboardStats, 'bassa')
    };
    
    // Tempo medio di completamento per categoria (se disponibile)
    const avgCompletionTime = calculateAverageCompletionTime(dashboardStats);
    
    // Costruisci l'oggetto statistiche completo
    const analytics = {
      // Statistiche generali
      overview: {
        totalTasks: dashboardStats.totalTasks || 0,
        totalUsers: dashboardStats.totalUsers || 0,
        completionRate: dashboardStats.completionRate || 0,
        activeTasks: (dashboardStats.tasksByStatus?.in_corso || 0) + 
                    (dashboardStats.tasksByStatus?.assegnato || 0),
        overdueTasks: dashboardStats.overdueTasks || calculateOverdueTasks(dashboardStats)
      },
      
      // Distribuzioni
      distribution: {
        byStatus: dashboardStats.tasksByStatus || {},
        byPriority: dashboardStats.tasksByPriority || {},
        byUser: usersWithStats.map(user => ({
          name: user.userName,
          total: user.totalTasks || 0,
          completed: user.completedTasks || 0
        }))
      },
      
      // Performance
      performance: {
        weeklyCompletion: weeklyCompletionByUser,
        byPriority: performanceByPriority,
        averageCompletionTime: avgCompletionTime,
        userPerformance: usersWithStats.map(user => ({
          name: user.userName,
          completionRate: user.completionRate || 0,
          tasksCompleted: user.completedTasks || 0,
          tasksInProgress: user.inProgressTasks || 0
        }))
      },
      
      // Trends (ultime 4 settimane)
      trends: {
        weeklyCompletion: await getWeeklyCompletionTrend(),
        userActivity: await getUserActivityTrend(),
        taskCreation: await getTaskCreationTrend()
      },
      
      // Metriche avanzate
      metrics: {
        efficiency: calculateEfficiency(dashboardStats, usersWithStats),
        workloadBalance: calculateWorkloadBalance(usersWithStats),
        priorityAdherence: calculatePriorityAdherence(dashboardStats)
      },
      
      // Dati raw per grafici
      chartData: {
        statusDistribution: formatForPieChart(dashboardStats.tasksByStatus),
        priorityDistribution: formatForPieChart(dashboardStats.tasksByPriority),
        weeklyCompletionChart: formatForBarChart(weeklyCompletionByUser),
        userPerformanceChart: formatForRadarChart(usersWithStats)
      }
    };
    
    console.log('✅ [analytics.js] Admin stats fetched successfully');
    return {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [analytics.js] Error fetching admin stats:', error);
    return {
      success: false,
      error: error.message || 'Errore nel caricamento delle statistiche',
      data: getDefaultAnalytics()
    };
  }
};

/**
 * Ottieni statistiche per un utente specifico
 * @param {string} userId - ID utente
 * @returns {Promise<Object>} Statistiche utente
 */
export const getUserAnalytics = async (userId) => {
  try {
    const userStats = await statsService.getUserStats(userId);
    const userInfo = await userService.getById(userId);
    
    // Calcola trend personale
    const personalTrend = await getPersonalTrend(userId);
    
    // Metriche specifiche utente
    const analytics = {
      userInfo: {
        name: userInfo.name || userInfo.email,
        role: userInfo.role,
        department: userInfo.department,
        joinDate: userInfo.createdAt
      },
      
      currentStats: {
        ...userStats.data,
        dailyAverage: calculateDailyAverage(userStats.data),
        weeklyPerformance: calculateWeeklyPerformance(userStats.data),
        efficiencyScore: calculateEfficiencyScore(userStats.data)
      },
      
      trends: personalTrend,
      
      comparisons: {
        vsTeamAverage: await compareWithTeamAverage(userId, userStats.data),
        vsLastMonth: await compareWithLastMonth(userId)
      },
      
      recommendations: generateRecommendations(userStats.data)
    };
    
    return {
      success: true,
      data: analytics
    };
    
  } catch (error) {
    console.error('❌ [analytics.js] Error fetching user analytics:', error);
    return {
      success: false,
      error: error.message || 'Errore nel caricamento delle statistiche utente',
      data: getDefaultUserAnalytics()
    };
  }
};

/**
 * Ottieni report dettagliato per periodo
 * @param {Date} startDate - Data inizio
 * @param {Date} endDate - Data fine
 * @param {string} reportType - Tipo report (daily, weekly, monthly)
 * @returns {Promise<Object>} Report
 */
export const getPeriodReport = async (startDate, endDate, reportType = 'weekly') => {
  try {
    // Questa è un'implementazione semplificata
    // In produzione, si utilizzerebbero query Firestore con range di date
    
    const report = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: reportType
      },
      
      summary: {
        tasksCreated: 0,
        tasksCompleted: 0,
        tasksInProgress: 0,
        averageCompletionTime: 0,
        mostActiveUser: null,
        busiestDay: null
      },
      
      details: {
        dailyBreakdown: [],
        userContributions: [],
        categoryAnalysis: []
      },
      
      insights: {
        trends: [],
        anomalies: [],
        recommendations: []
      }
    };
    
    // Per demo, restituiamo dati mock
    if (reportType === 'weekly') {
      report.summary = {
        tasksCreated: 24,
        tasksCompleted: 18,
        tasksInProgress: 6,
        averageCompletionTime: 2.5,
        mostActiveUser: 'Leonardo',
        busiestDay: 'Martedì'
      };
    }
    
    return {
      success: true,
      data: report
    };
    
  } catch (error) {
    console.error('❌ [analytics.js] Error generating report:', error);
    return {
      success: false,
      error: error.message || 'Errore nella generazione del report'
    };
  }
};

/**
 * Esporta dati in vari formati
 * @param {string} format - Formato (csv, json, pdf)
 * @param {Object} data - Dati da esportare
 * @returns {Promise<Object>} Risultato esportazione
 */
export const exportAnalytics = async (format, data) => {
  try {
    let exportData;
    
    switch (format.toLowerCase()) {
      case 'csv':
        exportData = convertToCSV(data);
        break;
      case 'json':
        exportData = JSON.stringify(data, null, 2);
        break;
      case 'pdf':
        // In produzione, si integrerebbe con un servizio PDF
        exportData = 'PDF export would be generated here';
        break;
      default:
        throw new Error(`Formato non supportato: ${format}`);
    }
    
    return {
      success: true,
      data: exportData,
      format: format,
      filename: `analytics_${new Date().toISOString().split('T')[0]}.${format}`
    };
    
  } catch (error) {
    console.error('❌ [analytics.js] Error exporting analytics:', error);
    return {
      success: false,
      error: error.message || 'Errore nell\'esportazione dei dati'
    };
  }
};

/**
 * Ottieni KPI (Key Performance Indicators) per dashboard
 * @returns {Promise<Object>} KPI
 */
export const getKPIs = async () => {
  try {
    const dashboardStats = await statsService.getDashboardStats();
    
    const kpis = {
      productivity: {
        value: dashboardStats.completionRate || 0,
        target: 85,
        trend: 'up',
        change: '+5.2%'
      },
      
      efficiency: {
        value: calculateEfficiencyKPI(dashboardStats),
        target: 90,
        trend: 'stable',
        change: '+1.1%'
      },
      
      quality: {
        value: calculateQualityKPI(dashboardStats),
        target: 95,
        trend: 'up',
        change: '+2.3%'
      },
      
      timeliness: {
        value: calculateTimelinessKPI(dashboardStats),
        target: 80,
        trend: 'down',
        change: '-3.4%'
      }
    };
    
    return {
      success: true,
      data: kpis
    };
    
  } catch (error) {
    console.error('❌ [analytics.js] Error fetching KPIs:', error);
    return {
      success: false,
      error: error.message || 'Errore nel caricamento dei KPI'
    };
  }
};

// Funzioni di utilità

function calculatePerformanceByPriority(stats, priority) {
  const total = stats.tasksByPriority?.[priority] || 0;
  const completed = stats.completedByPriority?.[priority] || 0;
  
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function calculateAverageCompletionTime(stats) {
  // Implementazione semplificata
  return 2.5; // giorni
}

function calculateOverdueTasks(stats) {
  // Implementazione semplificata
  const totalActive = (stats.tasksByStatus?.assegnato || 0) + 
                     (stats.tasksByStatus?.in_corso || 0);
  return Math.round(totalActive * 0.15); // 15% dei task attivi
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function calculateEfficiency(stats, userStats) {
  // Implementazione semplificata
  const totalCompleted = stats.tasksByStatus?.completato || 0;
  const totalUsers = userStats.length || 1;
  return Math.round(totalCompleted / totalUsers);
}

function calculateWorkloadBalance(userStats) {
  if (userStats.length === 0) return 100;
  
  const tasksPerUser = userStats.map(user => user.totalTasks || 0);
  const max = Math.max(...tasksPerUser);
  const min = Math.min(...tasksPerUser);
  
  return max > 0 ? Math.round((min / max) * 100) : 100;
}

function calculatePriorityAdherence(stats) {
  const highPriorityCompleted = stats.completedByPriority?.alta || 0;
  const highPriorityTotal = stats.tasksByPriority?.alta || 0;
  
  return highPriorityTotal > 0 ? Math.round((highPriorityCompleted / highPriorityTotal) * 100) : 100;
}

function formatForPieChart(data) {
  return Object.entries(data || {}).map(([key, value]) => ({
    label: key,
    value: value,
    color: getChartColor(key)
  }));
}

function formatForBarChart(data) {
  return data.map(item => ({
    label: item.name,
    value: item.completed,
    color: getChartColor(item.name)
  }));
}

function formatForRadarChart(usersWithStats) {
  return usersWithStats.map(user => ({
    subject: user.userName,
    completionRate: user.completionRate || 0,
    efficiency: user.efficiencyScore || 0,
    productivity: user.tasksCompleted || 0,
    timeliness: 100 - (user.overdue || 0) * 10
  }));
}

function getChartColor(key) {
  const colors = {
    // Stati
    'assegnato': '#6b7280',
    'in corso': '#3b82f6',
    'completato': '#10b981',
    'bloccato': '#ef4444',
    
    // Priorità
    'alta': '#ef4444',
    'media': '#f59e0b',
    'bassa': '#10b981',
    
    // Utenti (colori predefiniti)
    'Leonardo': '#3b82f6',
    'Andrea': '#8b5cf6',
    'Domenico': '#10b981',
    'Stefano': '#f59e0b'
  };
  
  return colors[key] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

async function getWeeklyCompletionTrend() {
  // Mock data per trend settimanali
  return [
    { week: 'Sett 1', completed: 12 },
    { week: 'Sett 2', completed: 15 },
    { week: 'Sett 3', completed: 18 },
    { week: 'Sett 4', completed: 22 }
  ];
}

async function getUserActivityTrend() {
  // Mock data per attività utente
  return [
    { user: 'Leonardo', activity: 85 },
    { user: 'Andrea', activity: 72 },
    { user: 'Domenico', activity: 91 },
    { user: 'Stefano', activity: 68 }
  ];
}

async function getTaskCreationTrend() {
  // Mock data per creazione task
  return [
    { day: 'Lun', created: 5 },
    { day: 'Mar', created: 8 },
    { day: 'Mer', created: 6 },
    { day: 'Gio', created: 9 },
    { day: 'Ven', created: 7 }
  ];
}

function calculateDailyAverage(userStats) {
  const totalCompleted = userStats.completedTasks || 0;
  const workingDays = 20; // Approssimazione
  return workingDays > 0 ? (totalCompleted / workingDays).toFixed(1) : 0;
}

function calculateWeeklyPerformance(userStats) {
  const weeklyCompleted = userStats.completedThisWeek || 0;
  return weeklyCompleted;
}

function calculateEfficiencyScore(userStats) {
  const completed = userStats.completedTasks || 0;
  const total = userStats.totalTasks || 1;
  const overdue = userStats.overdue || 0;
  
  const completionScore = (completed / total) * 50;
  const timelinessScore = 50 - (overdue * 5);
  
  return Math.round(completionScore + timelinessScore);
}

async function compareWithTeamAverage(userId, userStats) {
  // Implementazione semplificata
  return {
    completionRate: { user: userStats.completionRate || 0, team: 75 },
    tasksCompleted: { user: userStats.completedTasks || 0, team: 15 },
    efficiency: { user: userStats.efficiencyScore || 0, team: 82 }
  };
}

async function compareWithLastMonth(userId) {
  // Implementazione semplificata
  return {
    completionRate: { current: 85, previous: 78, change: '+7%' },
    tasksCompleted: { current: 12, previous: 9, change: '+33%' },
    efficiency: { current: 88, previous: 82, change: '+6%' }
  };
}

function generateRecommendations(userStats) {
  const recommendations = [];
  
  if (userStats.completionRate < 70) {
    recommendations.push({
      type: 'warning',
      message: 'Tasso di completamento inferiore alla media. Considera di concentrarti sui task in corso.',
      action: 'Priorizza i task in base alla scadenza'
    });
  }
  
  if (userStats.overdue > 0) {
    recommendations.push({
      type: 'error',
      message: `Hai ${userStats.overdue} task in ritardo.`,
      action: 'Rivedi le scadenze e segnala eventuali problemi'
    });
  }
  
  if (userStats.efficiencyScore > 90) {
    recommendations.push({
      type: 'success',
      message: 'Ottima efficienza! Continua così.',
      action: 'Considera di aiutare i colleghi con i loro task'
    });
  }
  
  return recommendations;
}

function convertToCSV(data) {
  // Implementazione semplificata per CSV
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).join(',');
  return `${headers}\n${values}`;
}

function calculateEfficiencyKPI(stats) {
  const completed = stats.tasksByStatus?.completato || 0;
  const total = stats.totalTasks || 1;
  return Math.round((completed / total) * 100);
}

function calculateQualityKPI(stats) {
  // Implementazione semplificata
  return 92;
}

function calculateTimelinessKPI(stats) {
  const overdue = calculateOverdueTasks(stats);
  const activeTasks = (stats.tasksByStatus?.assegnato || 0) + 
                     (stats.tasksByStatus?.in_corso || 0);
  
  return activeTasks > 0 ? Math.round(((activeTasks - overdue) / activeTasks) * 100) : 100;
}

function getDefaultAnalytics() {
  return {
    overview: {
      totalTasks: 0,
      totalUsers: 0,
      completionRate: 0,
      activeTasks: 0,
      overdueTasks: 0
    },
    distribution: {
      byStatus: {},
      byPriority: {},
      byUser: []
    },
    performance: {
      weeklyCompletion: [],
      byPriority: {},
      averageCompletionTime: 0,
      userPerformance: []
    },
    trends: {
      weeklyCompletion: [],
      userActivity: [],
      taskCreation: []
    },
    metrics: {
      efficiency: 0,
      workloadBalance: 0,
      priorityAdherence: 0
    },
    chartData: {
      statusDistribution: [],
      priorityDistribution: [],
      weeklyCompletionChart: [],
      userPerformanceChart: []
    }
  };
}

function getDefaultUserAnalytics() {
  return {
    userInfo: {
      name: '',
      role: '',
      department: '',
      joinDate: ''
    },
    currentStats: {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      completionRate: 0,
      overdue: 0
    },
    trends: {},
    comparisons: {},
    recommendations: []
  };
}

// Esporta tutte le funzioni
export default {
  getAdminDashboardStats,
  getUserAnalytics,
  getPeriodReport,
  exportAnalytics,
  getKPIs
};