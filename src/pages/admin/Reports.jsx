import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

// ✅ CORRETTO: Importa db dal config esistente
import { db } from '../../firebase/config';

import './reports.css';

const AdminReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');
  const [timeRange, setTimeRange] = useState('7days');
  const [reportType, setReportType] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeUsers: 0,
    averageCompletionTime: 0,
    efficiency: 0
  });

  // Carica dati da Firestore
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📊 Caricamento dati per report...');
      
      // Carica task
      const tasksCollection = collection(db, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasksList = tasksSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate ? doc.data().dueDate.toDate() : doc.data().dueDate,
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));
      setTasks(tasksList);
      
      // Carica utenti
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
      
      // Carica report generati
      const reportsCollection = collection(db, 'reports');
      const reportsQuery = query(reportsCollection, orderBy('createdAt', 'desc'));
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsList = reportsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));
      setReports(reportsList);
      
      // Calcola statistiche
      calculateStatistics(tasksList, usersList);
      
    } catch (error) {
      console.error('❌ Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Calcola statistiche
  const calculateStatistics = (tasksList, usersList) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filtra task in base al periodo selezionato
    let filteredTasks = tasksList;
    if (timeRange === '7days') {
      filteredTasks = tasksList.filter(task => 
        task.createdAt && task.createdAt >= sevenDaysAgo
      );
    } else if (timeRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredTasks = tasksList.filter(task => 
        task.createdAt && task.createdAt >= thirtyDaysAgo
      );
    }
    
    const completedTasks = filteredTasks.filter(t => t.status === 'completato').length;
    const activeUsers = usersList.filter(u => u.lastLogin && 
      new Date(u.lastLogin) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length;
    
    // Calcola tempo medio di completamento
    const completedTasksWithTime = filteredTasks.filter(t => 
      t.status === 'completato' && t.createdAt && t.completedAt
    );
    
    let totalCompletionTime = 0;
    completedTasksWithTime.forEach(task => {
      const completionTime = task.completedAt - task.createdAt;
      totalCompletionTime += completionTime;
    });
    
    const averageCompletionTime = completedTasksWithTime.length > 0 
      ? Math.round(totalCompletionTime / completedTasksWithTime.length / (1000 * 60 * 60 * 24)) // in giorni
      : 0;
    
    // Calcola efficienza
    const efficiency = filteredTasks.length > 0 
      ? Math.round((completedTasks / filteredTasks.length) * 100) 
      : 0;
    
    setStats({
      totalTasks: filteredTasks.length,
      completedTasks,
      activeUsers,
      averageCompletionTime,
      efficiency
    });
  };

  // Genera report
  const generateReport = async (type) => {
    setGenerating(type);
    try {
      const now = new Date();
      let reportData = {};
      let reportTitle = '';
      let reportDescription = '';
      
      // Calcola dati in base al tipo di report
      switch(type) {
        case 'productivity':
          reportTitle = 'Report Produttività';
          reportDescription = 'Analisi produttività del team';
          reportData = await generateProductivityReport();
          break;
          
        case 'tasks':
          reportTitle = 'Report Task';
          reportDescription = 'Stato e completamento task';
          reportData = await generateTasksReport();
          break;
          
        case 'users':
          reportTitle = 'Report Utenti';
          reportDescription = 'Attività e performance utenti';
          reportData = await generateUsersReport();
          break;
          
        case 'timing':
          reportTitle = 'Report Tempi';
          reportDescription = 'Tempi di completamento';
          reportData = await generateTimingReport();
          break;
          
        case 'custom':
          reportTitle = 'Report Personalizzato';
          reportDescription = 'Report generato su richiesta';
          reportData = await generateCustomReport();
          break;
      }
      
      // Salva report in Firestore
      const reportRef = await addDoc(collection(db, 'reports'), {
        title: reportTitle,
        description: reportDescription,
        type: type,
        data: reportData,
        stats: stats,
        timeRange: timeRange,
        generatedBy: user?.uid,
        generatedByName: user?.name,
        createdAt: serverTimestamp(),
        size: `${Math.round(JSON.stringify(reportData).length / 1024)} KB`
      });
      
      // Aggiorna lista report
      const newReport = {
        id: reportRef.id,
        title: reportTitle,
        description: reportDescription,
        type: type,
        size: `${Math.round(JSON.stringify(reportData).length / 1024)} KB`,
        createdAt: now,
        generatedByName: user?.name
      };
      
      setReports(prev => [newReport, ...prev]);
      
      // Simula download
      setTimeout(() => {
        alert(`✅ Report "${reportTitle}" generato con successo!`);
        setGenerating('');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Errore generazione report:', error);
      alert('❌ Errore nella generazione del report');
      setGenerating('');
    }
  };

  // Genera report produttività
  const generateProductivityReport = async () => {
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayTasks = tasks.filter(task => 
        task.createdAt && task.createdAt >= dayStart && task.createdAt < dayEnd
      );
      const completedTasks = dayTasks.filter(task => task.status === 'completato').length;
      
      days.push({
        date: date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
        totalTasks: dayTasks.length,
        completedTasks,
        efficiency: dayTasks.length > 0 ? Math.round((completedTasks / dayTasks.length) * 100) : 0
      });
    }
    
    return {
      period: timeRange === '7days' ? 'Ultimi 7 giorni' : 'Ultimi 30 giorni',
      days,
      summary: {
        averageDailyTasks: Math.round(tasks.length / 7),
        peakDay: days.reduce((max, day) => day.totalTasks > max.totalTasks ? day : max, days[0]),
        bestPerformer: getBestPerformer()
      }
    };
  };

  // Genera report task
  const generateTasksReport = async () => {
    const statusCount = {};
    const priorityCount = {};
    
    tasks.forEach(task => {
      statusCount[task.status] = (statusCount[task.status] || 0) + 1;
      priorityCount[task.priority] = (priorityCount[task.priority] || 0) + 1;
    });
    
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completato') return false;
      return task.dueDate < new Date();
    });
    
    const completionRate = tasks.length > 0 
      ? Math.round((tasks.filter(t => t.status === 'completato').length / tasks.length) * 100) 
      : 0;
    
    return {
      totalTasks: tasks.length,
      statusDistribution: statusCount,
      priorityDistribution: priorityCount,
      overdueTasks: overdueTasks.length,
      completionRate,
      recentTasks: tasks.slice(0, 10).map(task => ({
        title: task.title,
        status: task.status,
        assignedTo: getUserName(task.assignedTo),
        dueDate: formatDate(task.dueDate)
      }))
    };
  };

  // Genera report utenti
  const generateUsersReport = async () => {
    const userStats = users.map(user => {
      const userTasks = tasks.filter(task => task.assignedTo === user.id);
      const completedTasks = userTasks.filter(task => task.status === 'completato').length;
      const overdueTasks = userTasks.filter(task => {
        if (!task.dueDate || task.status === 'completato') return false;
        return task.dueDate < new Date();
      });
      
      return {
        name: user.name,
        email: user.email,
        department: user.department || 'N/A',
        totalTasks: userTasks.length,
        completedTasks,
        overdueTasks,
        completionRate: userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0,
        averageCompletionTime: calculateUserAverageTime(user.id)
      };
    });
    
    return {
      totalUsers: users.length,
      activeUsers: stats.activeUsers,
      userStats: userStats.sort((a, b) => b.completionRate - a.completionRate),
      departmentStats: calculateDepartmentStats(),
      topPerformers: userStats.filter(u => u.completionRate >= 80).slice(0, 5)
    };
  };

  // Genera report tempi
  const generateTimingReport = async () => {
    const completedTasks = tasks.filter(t => t.status === 'completato' && t.createdAt && t.completedAt);
    
    const completionTimes = completedTasks.map(task => {
      const completionTime = task.completedAt - task.createdAt;
      return Math.round(completionTime / (1000 * 60 * 60 * 24)); // in giorni
    });
    
    const averageTime = completionTimes.length > 0 
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;
    
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completato') return false;
      return task.dueDate < new Date();
    });
    
    return {
      totalCompletedTasks: completedTasks.length,
      averageCompletionTime: averageTime,
      minCompletionTime: completionTimes.length > 0 ? Math.min(...completionTimes) : 0,
      maxCompletionTime: completionTimes.length > 0 ? Math.max(...completionTimes) : 0,
      overdueTasks: overdueTasks.length,
      timingDistribution: {
        '≤ 1 giorno': completionTimes.filter(t => t <= 1).length,
        '2-7 giorni': completionTimes.filter(t => t > 1 && t <= 7).length,
        '8-30 giorni': completionTimes.filter(t => t > 7 && t <= 30).length,
        '> 30 giorni': completionTimes.filter(t => t > 30).length
      }
    };
  };

  // Genera report personalizzato
  const generateCustomReport = async () => {
    return {
      customData: 'Report personalizzato generato su richiesta',
      timestamp: new Date().toISOString(),
      filtersApplied: {
        timeRange,
        reportType,
        user: user?.name
      }
    };
  };

  // Funzioni di utilità
  const getBestPerformer = () => {
    const userPerformance = users.map(user => {
      const userTasks = tasks.filter(task => task.assignedTo === user.id);
      const completedTasks = userTasks.filter(task => task.status === 'completato').length;
      const rate = userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0;
      return { name: user.name, rate };
    });
    
    return userPerformance.sort((a, b) => b.rate - a.rate)[0] || { name: 'Nessuno', rate: 0 };
  };

  const calculateUserAverageTime = (userId) => {
    const userCompletedTasks = tasks.filter(task => 
      task.assignedTo === userId && 
      task.status === 'completato' && 
      task.createdAt && 
      task.completedAt
    );
    
    if (userCompletedTasks.length === 0) return 0;
    
    const totalTime = userCompletedTasks.reduce((sum, task) => {
      return sum + (task.completedAt - task.createdAt);
    }, 0);
    
    return Math.round(totalTime / userCompletedTasks.length / (1000 * 60 * 60 * 24));
  };

  const calculateDepartmentStats = () => {
    const deptStats = {};
    
    users.forEach(user => {
      const dept = user.department || 'Non assegnato';
      if (!deptStats[dept]) {
        deptStats[dept] = { users: 0, tasks: 0, completed: 0 };
      }
      deptStats[dept].users++;
    });
    
    tasks.forEach(task => {
      const assignedUser = users.find(u => u.id === task.assignedTo);
      const dept = assignedUser?.department || 'Non assegnato';
      if (deptStats[dept]) {
        deptStats[dept].tasks++;
        if (task.status === 'completato') {
          deptStats[dept].completed++;
        }
      }
    });
    
    return Object.entries(deptStats).map(([dept, stats]) => ({
      department: dept,
      users: stats.users,
      tasks: stats.tasks,
      completed: stats.completed,
      completionRate: stats.tasks > 0 ? Math.round((stats.completed / stats.tasks) * 100) : 0
    }));
  };

  const getUserName = (userId) => {
    if (!userId) return 'Non assegnato';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Utente non trovato';
  };

  const formatDate = (date) => {
    if (!date) return 'N/D';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'N/D';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/D';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/D';
    }
  };

  // Elimina report
  const deleteReport = async (reportId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo report?')) return;
    
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
      alert('✅ Report eliminato con successo');
    } catch (error) {
      console.error('❌ Errore eliminazione report:', error);
      alert('❌ Errore nell\'eliminazione del report');
    }
  };

  // Download report
  const downloadReport = async (report) => {
    try {
      const reportData = {
        ...report,
        generatedAt: new Date().toISOString(),
        systemInfo: {
          totalUsers: users.length,
          totalTasks: tasks.length
        }
      };
      
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert('📥 Report scaricato con successo!');
    } catch (error) {
      console.error('❌ Errore download report:', error);
      alert('❌ Errore nel download del report');
    }
  };

  // Tipi di report disponibili
  const reportTypes = [
    { 
      id: 'productivity',
      title: 'Report Produttività', 
      icon: '📊', 
      description: 'Analisi produttività team e metriche di efficienza',
      color: '#3b82f6'
    },
    { 
      id: 'tasks',
      title: 'Report Task', 
      icon: '📋', 
      description: 'Stato, completamento e distribuzione task',
      color: '#10b981'
    },
    { 
      id: 'users',
      title: 'Report Utenti', 
      icon: '👥', 
      description: 'Attività, performance e statistiche utenti',
      color: '#8b5cf6'
    },
    { 
      id: 'timing',
      title: 'Report Tempi', 
      icon: '⏱️', 
      description: 'Tempi di completamento e analisi tempistiche',
      color: '#f59e0b'
    },
    { 
      id: 'custom',
      title: 'Report Personalizzato', 
      icon: '⚙️', 
      description: 'Crea un report con parametri personalizzati',
      color: '#6366f1'
    }
  ];

  if (loading && tasks.length === 0) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-content">
          <div className="admin-loading-spinner"></div>
          <p className="admin-loading-text">Caricamento report...</p>
          <p className="admin-loading-subtext">Sto analizzando i dati del sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      {/* Header */}
      <header className="admin-reports-header">
        <div className="admin-reports-header-content">
          <div className="admin-reports-title-section">
            <h1 className="admin-reports-title">📈 Report e Analisi</h1>
            <p className="admin-reports-subtitle">
              Analisi dettagliate, statistiche e report del sistema
            </p>
          </div>
          
          <div className="admin-reports-actions">
            <div className="admin-time-range">
              <label className="admin-time-range-label">Periodo:</label>
              <select
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value);
                  calculateStatistics(tasks, users);
                }}
                className="admin-time-range-select"
              >
                <option value="7days">Ultimi 7 giorni</option>
                <option value="30days">Ultimi 30 giorni</option>
                <option value="all">Tutto</option>
              </select>
            </div>
            
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="admin-btn-back"
            >
              <span className="admin-btn-icon">←</span>
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="admin-reports-main">
        {/* Statistiche veloci */}
        <div className="admin-reports-stats">
          <div className="admin-reports-stat-card">
            <div className="admin-reports-stat-icon">📋</div>
            <div className="admin-reports-stat-content">
              <div className="admin-reports-stat-value">{stats.totalTasks}</div>
              <div className="admin-reports-stat-label">Task Totali</div>
            </div>
          </div>
          
          <div className="admin-reports-stat-card">
            <div className="admin-reports-stat-icon">✅</div>
            <div className="admin-reports-stat-content">
              <div className="admin-reports-stat-value">{stats.completedTasks}</div>
              <div className="admin-reports-stat-label">Completati</div>
              <div className="admin-reports-stat-percentage">{stats.efficiency}%</div>
            </div>
          </div>
          
          <div className="admin-reports-stat-card">
            <div className="admin-reports-stat-icon">👥</div>
            <div className="admin-reports-stat-content">
              <div className="admin-reports-stat-value">{stats.activeUsers}</div>
              <div className="admin-reports-stat-label">Utenti Attivi</div>
            </div>
          </div>
          
          <div className="admin-reports-stat-card">
            <div className="admin-reports-stat-icon">⏱️</div>
            <div className="admin-reports-stat-content">
              <div className="admin-reports-stat-value">{stats.averageCompletionTime}</div>
              <div className="admin-reports-stat-label">Giorni medi</div>
              <div className="admin-reports-stat-subtext">per completamento</div>
            </div>
          </div>
        </div>

        {/* Report Disponibili */}
        <div className="admin-reports-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">📊 Report Disponibili</h2>
            <p className="admin-section-subtitle">
              Genera report dettagliati per analizzare le performance del sistema
            </p>
          </div>
          
          <div className="admin-reports-grid">
            {reportTypes.map((report) => (
              <div 
                key={report.id}
                className="admin-report-card"
                style={{ borderColor: `${report.color}20` }}
              >
                <div className="admin-report-card-header">
                  <div 
                    className="admin-report-icon"
                    style={{ backgroundColor: `${report.color}15`, color: report.color }}
                  >
                    {report.icon}
                  </div>
                  <div className="admin-report-info">
                    <h3 className="admin-report-title">{report.title}</h3>
                    <p className="admin-report-description">{report.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => generateReport(report.id)}
                  disabled={generating === report.id}
                  className="admin-report-generate-btn"
                  style={{ backgroundColor: report.color }}
                >
                  {generating === report.id ? (
                    <>
                      <span className="admin-loading-spinner-small"></span>
                      Generazione...
                    </>
                  ) : (
                    'Genera Report'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Report Generati Recentemente */}
        <div className="admin-reports-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">📄 Report Generati Recentemente</h2>
            <p className="admin-section-subtitle">
              Report precedentemente generati e disponibili per il download
            </p>
          </div>
          
          {reports.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">📭</div>
              <p className="admin-empty-title">Nessun report trovato</p>
              <p className="admin-empty-message">
                Genera il tuo primo report per iniziare l'analisi dei dati
              </p>
            </div>
          ) : (
            <div className="admin-reports-list">
              {reports.map((report) => (
                <div key={report.id} className="admin-report-item">
                  <div className="admin-report-item-content">
                    <div 
                      className="admin-report-item-icon"
                      style={{ backgroundColor: reportTypes.find(r => r.id === report.type)?.color + '15' }}
                    >
                      {reportTypes.find(r => r.id === report.type)?.icon || '📄'}
                    </div>
                    <div className="admin-report-item-details">
                      <h4 className="admin-report-item-title">{report.title}</h4>
                      <p className="admin-report-item-description">{report.description}</p>
                      <div className="admin-report-item-meta">
                        <span className="admin-report-item-date">
                          📅 {formatDateTime(report.createdAt)}
                        </span>
                        <span className="admin-report-item-size">
                          💾 {report.size || 'N/A'}
                        </span>
                        <span className="admin-report-item-author">
                          👤 {report.generatedByName || 'Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-report-item-actions">
                    <button
                      onClick={() => downloadReport(report)}
                      className="admin-btn-download"
                      title="Scarica report"
                    >
                      <span className="admin-btn-icon">📥</span>
                      Download
                    </button>
                    
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="admin-btn-view"
                      title="Visualizza anteprima"
                    >
                      <span className="admin-btn-icon">👁️</span>
                      Anteprima
                    </button>
                    
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="admin-btn-delete"
                      title="Elimina report"
                    >
                      <span className="admin-btn-icon">🗑️</span>
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Dashboard */}
        <div className="admin-analytics-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">📈 Dashboard Analitica</h2>
            <p className="admin-section-subtitle">
              Grafici e visualizzazioni delle metriche principali
            </p>
          </div>
          
          <div className="admin-analytics-grid">
            {/* Efficienza nel tempo */}
            <div className="admin-analytics-card">
              <h3 className="admin-analytics-card-title">📈 Efficienza nel Tempo</h3>
              <div className="admin-analytics-placeholder">
                <p>Grafico di efficienza settimanale</p>
                <div className="admin-analytics-chart-placeholder">
                  {/* Qui andrebbe un grafico reale */}
                  <div className="admin-chart-bar" style={{ height: '80%' }}></div>
                  <div className="admin-chart-bar" style={{ height: '60%' }}></div>
                  <div className="admin-chart-bar" style={{ height: '90%' }}></div>
                  <div className="admin-chart-bar" style={{ height: '70%' }}></div>
                  <div className="admin-chart-bar" style={{ height: '85%' }}></div>
                  <div className="admin-chart-bar" style={{ height: '75%' }}></div>
                  <div className="admin-chart-bar" style={{ height: '95%' }}></div>
                </div>
              </div>
            </div>
            
            {/* Distribuzione Task */}
            <div className="admin-analytics-card">
              <h3 className="admin-analytics-card-title">📊 Distribuzione Task</h3>
              <div className="admin-analytics-placeholder">
                <p>Task per stato e priorità</p>
                <div className="admin-analytics-donut-placeholder">
                  {/* Qui andrebbe un grafico a ciambella */}
                  <div className="admin-donut-segment" style={{ '--segment-percent': '40%', '--segment-color': '#10b981' }}></div>
                  <div className="admin-donut-segment" style={{ '--segment-percent': '30%', '--segment-color': '#3b82f6' }}></div>
                  <div className="admin-donut-segment" style={{ '--segment-percent': '20%', '--segment-color': '#8b5cf6' }}></div>
                  <div className="admin-donut-segment" style={{ '--segment-percent': '10%', '--segment-color': '#f59e0b' }}></div>
                </div>
              </div>
            </div>
            
            {/* Performance Utenti */}
            <div className="admin-analytics-card">
              <h3 className="admin-analytics-card-title">🏆 Performance Utenti</h3>
              <div className="admin-analytics-placeholder">
                <p>Top 5 utenti per task completati</p>
                <div className="admin-analytics-list">
                  {users.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="admin-user-performance">
                      <div className="admin-user-rank">{index + 1}.</div>
                      <div className="admin-user-name">{user.name}</div>
                      <div className="admin-user-stats">
                        <span className="admin-user-tasks">
                          {tasks.filter(t => t.assignedTo === user.id).length} task
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Metriche Chiave */}
            <div className="admin-analytics-card">
              <h3 className="admin-analytics-card-title">🎯 Metriche Chiave</h3>
              <div className="admin-analytics-metrics">
                <div className="admin-metric">
                  <div className="admin-metric-label">Tasso Completamento</div>
                  <div className="admin-metric-value">{stats.efficiency}%</div>
                </div>
                <div className="admin-metric">
                  <div className="admin-metric-label">Task in Ritardo</div>
                  <div className="admin-metric-value admin-metric-critical">
                    {tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'completato').length}
                  </div>
                </div>
                <div className="admin-metric">
                  <div className="admin-metric-label">Priorità Alta</div>
                  <div className="admin-metric-value">{tasks.filter(t => t.priority === 'alta').length}</div>
                </div>
                <div className="admin-metric">
                  <div className="admin-metric-label">Produttività Media</div>
                  <div className="admin-metric-value">{stats.totalTasks > 0 ? Math.round(stats.totalTasks / 7) : 0}/giorno</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="admin-reports-footer">
        <div className="admin-reports-footer-content">
          <div className="admin-reports-footer-info">
            <p className="admin-reports-footer-text">
              Sistema di Analisi Report • Versione 2.0 • 
              Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT')}
            </p>
            <p className="admin-reports-footer-subtext">
              {tasks.length} task • {users.length} utenti • {reports.length} report generati
            </p>
          </div>
          
          <button
            onClick={loadData}
            className="admin-btn-refresh"
          >
            <span className="admin-btn-icon">🔄</span>
            Aggiorna Dati
          </button>
        </div>
      </footer>

      {/* Modal Anteprima Report */}
      {selectedReport && (
        <div className="admin-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Anteprima Report</h3>
              <button 
                onClick={() => setSelectedReport(null)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="admin-modal-content">
              <div className="admin-modal-report-info">
                <div className="admin-modal-report-icon">
                  {reportTypes.find(r => r.id === selectedReport.type)?.icon || '📄'}
                </div>
                <div>
                  <h4 className="admin-modal-report-title">{selectedReport.title}</h4>
                  <p className="admin-modal-report-description">{selectedReport.description}</p>
                  <div className="admin-modal-report-meta">
                    <div>📅 {formatDateTime(selectedReport.createdAt)}</div>
                    <div>💾 {selectedReport.size || 'N/A'}</div>
                    <div>👤 {selectedReport.generatedByName || 'Admin'}</div>
                  </div>
                </div>
              </div>
              
              <div className="admin-modal-actions">
                <button
                  onClick={() => downloadReport(selectedReport)}
                  className="admin-btn-primary"
                >
                  📥 Scarica Report
                </button>
                <button
                  onClick={() => {
                    alert('Funzionalità di stampa in sviluppo...');
                  }}
                  className="admin-btn-secondary"
                >
                  🖨️ Stampa
                </button>
                <button
                  onClick={() => {
                    alert('Funzionalità di condivisione in sviluppo...');
                  }}
                  className="admin-btn-secondary"
                >
                  📤 Condividi
                </button>
              </div>
              
              <div className="admin-modal-preview">
                <p className="admin-modal-preview-text">
                  <strong>Anteprima dati:</strong> Il report contiene dati analitici completi.
                  Per visualizzare il contenuto completo, scarica il report in formato JSON.
                </p>
                <div className="admin-modal-preview-code">
                  {JSON.stringify({
                    tipo: selectedReport.type,
                    titolo: selectedReport.title,
                    periodo: selectedReport.timeRange,
                    generatoDa: selectedReport.generatedByName,
                    timestamp: formatDateTime(selectedReport.createdAt)
                  }, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;