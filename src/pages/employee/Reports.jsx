import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTasks } from '../../hooks/useTasks.jsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { format, subDays, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';

const EmployeeReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, loadUserTasks } = useTasks();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'quarter', 'year'
  const [reportType, setReportType] = useState('overview'); // 'overview', 'performance', 'completion'

  console.log('📊 [EmployeeReports] Pagina report caricata');

  // Carica task dell'utente
  useEffect(() => {
    const loadData = async () => {
      if (user?.uid) {
        await loadUserTasks(user.uid);
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, loadUserTasks]);

  // Calcola statistiche
  const stats = useMemo(() => {
    const safeTasks = tasks || [];
    
    if (safeTasks.length === 0) {
      return {
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        productivityScore: 0,
        timelinessScore: 0,
        progressScore: 0
      };
    }

    const totalTasks = safeTasks.length;
    const completedTasks = safeTasks.filter(t => t?.status === 'completato');
    const inProgressTasks = safeTasks.filter(t => t?.status === 'in corso');
    const overdueTasks = safeTasks.filter(task => {
      if (!task?.dueDate || task?.status === 'completato') return false;
      try {
        const due = task.dueDate?.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        return due < new Date();
      } catch {
        return false;
      }
    });

    // Calcola tempo medio di completamento
    let totalCompletionTime = 0;
    let completedWithDates = 0;
    
    completedTasks.forEach(task => {
      if (task?.createdAt && task?.completedAt) {
        try {
          const created = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
          const completed = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
          const days = Math.round((completed - created) / (1000 * 60 * 60 * 24));
          if (days > 0) {
            totalCompletionTime += days;
            completedWithDates++;
          }
        } catch {
          // Ignora date non valide
        }
      }
    });

    const averageCompletionTime = completedWithDates > 0 
      ? Math.round(totalCompletionTime / completedWithDates) 
      : 0;

    // Calcola punteggio produttività (0-100)
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks.length / totalTasks) * 100) 
      : 0;
    
    const timelinessScore = totalTasks > 0
      ? Math.round(((totalTasks - overdueTasks.length) / totalTasks) * 100)
      : 100;
    
    const progressScore = totalTasks > 0 
      ? safeTasks.reduce((sum, task) => sum + (task?.progress || 0), 0) / totalTasks
      : 0;
    
    const productivityScore = Math.round(
      (completionRate * 0.5) + (timelinessScore * 0.3) + (progressScore * 0.2)
    );

    return {
      totalTasks,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      overdue: overdueTasks.length,
      completionRate,
      averageCompletionTime,
      productivityScore,
      timelinessScore,
      progressScore: Math.round(progressScore)
    };
  }, [tasks]);

  // Prepara dati per grafici
  const chartData = useMemo(() => {
    const safeTasks = tasks || [];
    
    if (safeTasks.length === 0) {
      return {
        statusData: [],
        priorityData: [],
        dailyData: [],
        weeklyData: [],
        recentTasksCount: 0
      };
    }

    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 7);
    }

    // Filtra task nell'intervallo di tempo
    const recentTasks = safeTasks.filter(task => {
      try {
        const taskDate = task?.createdAt?.toDate ? task.createdAt.toDate() : new Date(task?.createdAt);
        return taskDate >= startDate;
      } catch {
        return false;
      }
    });

    // Dati per status
    const statusData = [
      { name: 'Completati', value: recentTasks.filter(t => t?.status === 'completato').length, color: '#10b981' },
      { name: 'In Corso', value: recentTasks.filter(t => t?.status === 'in corso').length, color: '#f59e0b' },
      { name: 'Assegnati', value: recentTasks.filter(t => t?.status === 'assegnato').length, color: '#3b82f6' },
      { name: 'Bloccati', value: recentTasks.filter(t => t?.status === 'bloccato').length, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Dati per priorità
    const priorityData = [
      { name: 'Critica', value: recentTasks.filter(t => t?.priority === 'critica').length, color: '#dc2626' },
      { name: 'Alta', value: recentTasks.filter(t => t?.priority === 'alta').length, color: '#ef4444' },
      { name: 'Media', value: recentTasks.filter(t => t?.priority === 'media').length, color: '#f59e0b' },
      { name: 'Bassa', value: recentTasks.filter(t => t?.priority === 'bassa').length, color: '#10b981' },
    ].filter(item => item.value > 0);

    // Dati per trend settimanale
    const weekStart = startOfWeek(now, { locale: it });
    const weekDays = eachDayOfInterval({
      start: subDays(weekStart, 6),
      end: weekStart
    });

    const dailyData = weekDays.map(day => {
      const dayStr = format(day, 'EEE', { locale: it });
      const dateStr = format(day, 'dd/MM');
      
      const dayTasks = recentTasks.filter(task => {
        try {
          const taskDate = task?.createdAt?.toDate ? task.createdAt.toDate() : new Date(task?.createdAt);
          return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        } catch {
          return false;
        }
      });

      return {
        name: dayStr,
        date: dateStr,
        total: dayTasks.length,
        completed: dayTasks.filter(t => t?.status === 'completato').length,
        created: dayTasks.length
      };
    });

    // Dati per completamento nel tempo
    const weeks = eachWeekOfInterval({
      start: subWeeks(now, 4),
      end: now
    }).slice(0, 5).reverse();

    const weeklyData = weeks.map((week, index) => {
      const weekStart = startOfWeek(week, { locale: it });
      const weekEnd = endOfWeek(week, { locale: it });
      const weekLabel = `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`;
      
      const weekTasks = recentTasks.filter(task => {
        try {
          const taskDate = task?.createdAt?.toDate ? task.createdAt.toDate() : new Date(task?.createdAt);
          return taskDate >= weekStart && taskDate <= weekEnd;
        } catch {
          return false;
        }
      });

      const completed = weekTasks.filter(t => t?.status === 'completato').length;
      const total = weekTasks.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        name: `Settimana ${weeks.length - index}`,
        week: weekLabel,
        completati: completed,
        total: total,
        rate: completionRate
      };
    });

    return {
      statusData,
      priorityData,
      dailyData,
      weeklyData,
      recentTasksCount: recentTasks.length
    };
  }, [tasks, timeRange]);

  // Funzione per formattare date
  const formatDate = (date) => {
    if (!date) return 'N/D';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return format(d, 'dd/MM/yyyy', { locale: it });
    } catch {
      return 'N/D';
    }
  };

  // Funzione helper per colore priorità
  const getPriorityColor = (priority) => {
    if (!priority) return '#6b7280';
    
    const colors = {
      critica: '#dc2626',
      alta: '#ef4444',
      media: '#f59e0b',
      bassa: '#10b981'
    };
    return colors[priority] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const safeTasks = tasks || [];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button
              onClick={() => navigate('/employee/dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              ← Torna alla Dashboard
            </button>
            <h1 style={{ fontSize: '28px', color: '#1f2937', margin: 0, fontWeight: '700' }}>
              📊 I Miei Report
            </h1>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '15px' }}>
              Analisi delle tue performance e statistiche personali
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🖨️ Stampa Report
            </button>
            <button
              onClick={() => {
                // Genera PDF (simulato)
                alert('Funzionalità di esportazione PDF in sviluppo');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📥 Esporta PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 30px 30px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Filtri e Controlli */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Selezione periodo */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#6b7280', 
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Periodo
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  backgroundColor: 'white',
                  minWidth: '140px'
                }}
              >
                <option value="week">Ultima settimana</option>
                <option value="month">Ultimo mese</option>
                <option value="quarter">Ultimo trimestre</option>
                <option value="year">Ultimo anno</option>
              </select>
            </div>

            {/* Tipo report */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#6b7280', 
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Tipo Report
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  backgroundColor: 'white',
                  minWidth: '160px'
                }}
              >
                <option value="overview">📈 Panoramica</option>
                <option value="performance">⚡ Performance</option>
                <option value="completion">✅ Completamento</option>
              </select>
            </div>

            {/* Ricalcola */}
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                onClick={() => {
                  if (user?.uid) {
                    setLoading(true);
                    loadUserTasks(user.uid).finally(() => setLoading(false));
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔄 Aggiorna Dati
              </button>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
              Ultimo aggiornamento
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
              {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}
            </div>
          </div>
        </div>

        {/* Statistiche Principali */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {[
            { 
              title: 'Task Totali', 
              value: stats.totalTasks, 
              change: '+12%', 
              color: '#3b82f6',
              icon: '📋',
              description: 'Nell\'intervallo selezionato'
            },
            { 
              title: 'Tasso Completamento', 
              value: `${stats.completionRate}%`, 
              change: stats.completionRate >= 80 ? '🎯 Ottimo' : stats.completionRate >= 60 ? '👍 Buono' : '📈 Da migliorare',
              color: '#10b981',
              icon: '✅',
              description: 'Percentuale task completati'
            },
            { 
              title: 'Produttività', 
              value: `${stats.productivityScore}/100`, 
              change: stats.productivityScore >= 80 ? '⭐ Eccellente' : stats.productivityScore >= 60 ? '👍 Buona' : '💪 In crescita',
              color: '#8b5cf6',
              icon: '📈',
              description: 'Punteggio complessivo'
            },
            { 
              title: 'Tempo Medio', 
              value: `${stats.averageCompletionTime} giorni`, 
              change: stats.averageCompletionTime <= 3 ? '🚀 Veloce' : stats.averageCompletionTime <= 7 ? '⏱️ Normale' : '🐌 Lento',
              color: '#f59e0b',
              icon: '⏳',
              description: 'Per completare un task'
            },
            { 
              title: 'Puntualità', 
              value: `${stats.timelinessScore}%`, 
              change: stats.overdue === 0 ? '🎯 Perfetta' : '📅 Da migliorare',
              color: stats.overdue === 0 ? '#10b981' : '#ef4444',
              icon: '🎯',
              description: 'Task completati in tempo'
            },
            { 
              title: 'Task In Ritardo', 
              value: stats.overdue, 
              change: stats.overdue === 0 ? '🎉 Zero!' : '⚠️ Attenzione',
              color: stats.overdue === 0 ? '#10b981' : '#ef4444',
              icon: '⚠️',
              description: 'Da completare urgentemente'
            }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${stat.color}`,
                position: 'relative'
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: '24px', 
                right: '24px',
                fontSize: '28px',
                color: `${stat.color}40`
              }}>
                {stat.icon}
              </div>
              
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                {stat.title}
              </div>
              
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: stat.color,
                marginBottom: '8px'
              }}>
                {stat.value}
              </div>
              
              <div style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: stat.change.includes('🎯') || stat.change.includes('🎉') || stat.change.includes('⭐') ? '#d1fae5' :
                                 stat.change.includes('👍') || stat.change.includes('🚀') || stat.change.includes('⏱️') ? '#fef3c7' : '#fee2e2',
                  color: stat.change.includes('🎯') || stat.change.includes('🎉') || stat.change.includes('⭐') ? '#065f46' :
                        stat.change.includes('👍') || stat.change.includes('🚀') || stat.change.includes('⏱️') ? '#92400e' : '#991b1b',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {stat.change}
                </span>
              </div>
              
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Grafici */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '30px' }}>
          
          {/* Grafico a barre - Task per giorno */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                📅 Attività Giornaliera (Ultimi 7 giorni)
              </h3>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                Totale: {chartData.recentTasksCount} task
              </div>
            </div>
            
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                    formatter={(value, name) => {
                      const labels = {
                        'total': 'Task Totali',
                        'completed': 'Completati',
                        'created': 'Creati'
                      };
                      return [value, labels[name] || name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `Data: ${payload[0].payload.date}`;
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="total" 
                    name="Task Totali" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="completed" 
                    name="Completati" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafico a torta - Distribuzione per status */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px 0' }}>
              📊 Distribuzione per Stato
            </h3>
            
            <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} task`, 'Quantità']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafico a linee - Trend settimanale */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            gridColumn: '1 / -1'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px 0' }}>
              📈 Trend di Completamento Settimanale
            </h3>
            
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                    formatter={(value, name) => {
                      const labels = {
                        'completati': 'Task Completati',
                        'total': 'Task Totali',
                        'rate': 'Tasso Completamento'
                      };
                      const formattedValue = name === 'rate' ? `${value}%` : value;
                      return [formattedValue, labels[name] || name];
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    name="Tasso Completamento" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completati" 
                    name="Task Completati" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Dettaglio Performance */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 24px 0' }}>
            📋 Dettaglio Performance
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Metriche di Performance */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                📊 Metriche Chiave
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Efficienza', value: stats.completionRate, max: 100, color: '#10b981' },
                  { label: 'Velocità', value: 100 - Math.min(stats.averageCompletionTime * 10, 100), max: 100, color: '#3b82f6' },
                  { label: 'Qualità', value: stats.timelinessScore, max: 100, color: '#8b5cf6' },
                  { label: 'Consistenza', value: stats.progressScore, max: 100, color: '#f59e0b' }
                ].map((metric, index) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>{metric.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: metric.color }}>
                        {metric.value}/{metric.max}
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(metric.value / metric.max) * 100}%`,
                          backgroundColor: metric.color,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Recenti Completati */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                ✅ Task Recenti Completati
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {safeTasks && safeTasks.length > 0 ? (
                  safeTasks
                    .filter(t => t?.status === 'completato')
                    .sort((a, b) => {
                      try {
                        const dateA = a?.completedAt?.toDate ? a.completedAt.toDate() : new Date(a?.completedAt);
                        const dateB = b?.completedAt?.toDate ? b.completedAt.toDate() : new Date(b?.completedAt);
                        return (dateB || 0) - (dateA || 0);
                      } catch {
                        return 0;
                      }
                    })
                    .slice(0, 5)
                    .map((task, index) => (
                      <div 
                        key={task?.id || index}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: '#1f2937',
                          marginBottom: '4px'
                        }}>
                          {task?.title || 'Task senza titolo'}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>Completato: {task?.completedAt ? formatDate(task.completedAt) : 'N/D'}</span>
                          <span style={{ 
                            padding: '2px 8px',
                            backgroundColor: getPriorityColor(task?.priority) + '20',
                            color: getPriorityColor(task?.priority),
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {task?.priority || 'N/D'}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    📭 Nessun task trovato
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Riepilogo */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ 
              fontSize: '32px', 
              color: '#0ea5e9',
              flexShrink: 0
            }}>
              💡
            </div>
            <div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#0369a1',
                marginBottom: '12px'
              }}>
                Insights dalle Tue Performance
              </h3>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {[
                  stats.completionRate >= 80 
                    ? '🎯 Ottimo lavoro! Il tuo tasso di completamento è eccellente.'
                    : stats.completionRate >= 60 
                    ? '👍 Stai andando bene! Continua così per migliorare ulteriormente.'
                    : '📈 Hai spazio per migliorare il tasso di completamento.',
                  
                  stats.overdue === 0 
                    ? '🎉 Perfetto! Non hai task in ritardo.'
                    : `⚠️ Hai ${stats.overdue} task in ritardo. Pianifica meglio il tuo tempo.`,
                  
                  stats.averageCompletionTime <= 3 
                    ? '🚀 Sei molto veloce nel completare i task!'
                    : stats.averageCompletionTime <= 7 
                    ? '⏱️ Il tuo tempo di completamento è nella media.'
                    : '🐌 Potresti accelerare il completamento dei task.',
                  
                  `📊 Hai completato ${stats.completed} task su ${stats.totalTasks} assegnati.`
                ].map((insight, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      color: '#0c4a6e'
                    }}
                  >
                    {insight}
                  </div>
                ))}
              </div>
              
              <div style={{ 
                fontSize: '14px', 
                color: '#0284c7',
                fontStyle: 'italic'
              }}>
                Prossimo obiettivo: Aumenta il tasso di completamento al {Math.min(100, stats.completionRate + 10)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeReports;