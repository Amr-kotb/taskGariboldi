import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { 
  getAdminDashboardStats,
  getKPIs,
  exportAnalytics,
  getPeriodReport 
} from '../../services/api/analytics';
import { 
  TASK_STATUS, 
  TASK_PRIORITY,
  getStatusName, 
  getStatusColor,
  getPriorityName,
  getPriorityColor
} from '../../constants/statuses';

import TaskChart from '../../components/charts/TaskChart';
import StatusChart from '../../components/charts/StatusChart';
import ProgressChart from '../../components/charts/ProgressChart';

const Statistics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date()
  });

  // Carica le statistiche al montaggio
  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 [Statistics] Loading admin statistics...');
      
      // Carica statistiche dashboard
      const statsResult = await getAdminDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        throw new Error(statsResult.error);
      }
      
      // Carica KPI
      const kpisResult = await getKPIs();
      if (kpisResult.success) {
        setKpis(kpisResult.data);
      }
      
      console.log('✅ [Statistics] Statistics loaded successfully');
      
    } catch (error) {
      console.error('❌ [Statistics] Error loading statistics:', error);
      setError(error.message || 'Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!stats) return;
    
    try {
      setExporting(true);
      
      const result = await exportAnalytics(exportFormat, stats);
      
      if (result.success) {
        // Crea un blob e scarica il file
        const blob = new Blob([result.data], { type: `text/${exportFormat}` });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`Esportazione completata: ${result.filename}`);
        setShowExportModal(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ [Statistics] Export error:', error);
      alert(`Errore nell'esportazione: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    
    // Aggiorna il range date in base al periodo selezionato
    const end = new Date();
    let start = new Date();
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    setDateRange({ start, end });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('it-IT').format(num);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return 'fas fa-arrow-up text-success';
      case 'down': return 'fas fa-arrow-down text-danger';
      case 'stable': return 'fas fa-minus text-warning';
      default: return 'fas fa-minus';
    }
  };

  if (loading && !stats) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <LoadingSpinner size="lg" message="Caricamento statistiche..." />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="alert alert-danger">
        <h4>Errore nel caricamento</h4>
        <p>{error}</p>
        <Button variant="primary" onClick={loadStatistics}>
          Riprova
        </Button>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">Statistiche Dashboard</h1>
          <p className="text-muted mb-0">
            Monitoraggio performance team - Ultimo aggiornamento: {
              stats?.timestamp ? new Date(stats.timestamp).toLocaleString('it-IT') : 'Ora'
            }
          </p>
        </div>
        
        <div className="d-flex gap-2">
          <div className="btn-group">
            <Button 
              variant={selectedPeriod === 'today' ? 'primary' : 'outline-secondary'}
              onClick={() => handlePeriodChange('today')}
              size="sm"
            >
              Oggi
            </Button>
            <Button 
              variant={selectedPeriod === 'week' ? 'primary' : 'outline-secondary'}
              onClick={() => handlePeriodChange('week')}
              size="sm"
            >
              Settimana
            </Button>
            <Button 
              variant={selectedPeriod === 'month' ? 'primary' : 'outline-secondary'}
              onClick={() => handlePeriodChange('month')}
              size="sm"
            >
              Mese
            </Button>
            <Button 
              variant={selectedPeriod === 'quarter' ? 'primary' : 'outline-secondary'}
              onClick={() => handlePeriodChange('quarter')}
              size="sm"
            >
              Trimestre
            </Button>
          </div>
          
          <Button 
            variant="outline-primary"
            onClick={() => setShowExportModal(true)}
            disabled={!stats}
          >
            <i className="fas fa-download me-2"></i>
            Esporta
          </Button>
          
          <Button variant="outline-secondary" onClick={loadStatistics}>
            <i className="fas fa-sync-alt"></i>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="row g-3 mb-4">
          {Object.entries(kpis).map(([key, kpi]) => (
            <div key={key} className="col-lg-3 col-md-6">
              <Card className="h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="text-uppercase text-muted mb-1">
                      {key === 'productivity' && 'Produttività'}
                      {key === 'efficiency' && 'Efficienza'}
                      {key === 'quality' && 'Qualità'}
                      {key === 'timeliness' && 'Puntualità'}
                    </h6>
                    <h2 className="mb-0">{kpi.value}%</h2>
                  </div>
                  <div className={`badge bg-${kpi.trend === 'up' ? 'success' : kpi.trend === 'down' ? 'danger' : 'warning'}-subtle text-${kpi.trend === 'up' ? 'success' : kpi.trend === 'down' ? 'danger' : 'warning'} p-2`}>
                    <i className={getTrendIcon(kpi.trend)}></i>
                    <span className="ms-1">{kpi.change}</span>
                  </div>
                </div>
                
                <div className="progress" style={{ height: '6px' }}>
                  <div 
                    className={`progress-bar bg-${kpi.trend === 'up' ? 'success' : kpi.trend === 'down' ? 'danger' : 'warning'}`}
                    role="progressbar" 
                    style={{ width: `${kpi.value}%` }}
                  ></div>
                </div>
                
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">Target: {kpi.target}%</small>
                  <small className="text-muted">
                    {kpi.value >= kpi.target ? '✅ Raggiunto' : '⚠️ Mancano ' + (kpi.target - kpi.value) + '%'}
                  </small>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Overview Stats */}
      {stats?.overview && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <Card className="h-100">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                  <i className="fas fa-tasks text-primary fs-4"></i>
                </div>
                <div>
                  <h3 className="mb-0">{formatNumber(stats.overview.totalTasks)}</h3>
                  <p className="text-muted mb-0">Task Totali</p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="col-md-3">
            <Card className="h-100">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                  <i className="fas fa-user-friends text-success fs-4"></i>
                </div>
                <div>
                  <h3 className="mb-0">{formatNumber(stats.overview.totalUsers)}</h3>
                  <p className="text-muted mb-0">Utenti Attivi</p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="col-md-3">
            <Card className="h-100">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                  <i className="fas fa-chart-line text-info fs-4"></i>
                </div>
                <div>
                  <h3 className="mb-0">{stats.overview.completionRate}%</h3>
                  <p className="text-muted mb-0">Tasso Completamento</p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="col-md-3">
            <Card className="h-100">
              <div className="d-flex align-items-center">
                <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                  <i className="fas fa-exclamation-triangle text-danger fs-4"></i>
                </div>
                <div>
                  <h3 className="mb-0">{formatNumber(stats.overview.overdueTasks)}</h3>
                  <p className="text-muted mb-0">Task in Ritardo</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        {/* Distribuzione per Stato */}
        <div className="col-lg-6">
          <Card>
            <div className="card-header">
              <h5 className="mb-0">Distribuzione Task per Stato</h5>
            </div>
            <div className="card-body">
              {stats?.chartData?.statusDistribution && stats.chartData.statusDistribution.length > 0 ? (
                <div className="chart-container" style={{ height: '300px' }}>
                  {/* Inserire qui TaskChart component */}
                  <div className="d-flex flex-column justify-content-center align-items-center h-100">
                    <div className="row g-3 w-100">
                      {stats.chartData.statusDistribution.map((item, index) => (
                        <div key={index} className="col-6">
                          <div className="d-flex align-items-center">
                            <div 
                              className="me-2" 
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: item.color,
                                borderRadius: '2px'
                              }}
                            ></div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <span>{getStatusName(item.label)}</span>
                                <strong>{item.value}</strong>
                              </div>
                              <div className="progress mt-1" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar"
                                  style={{ 
                                    width: `${(item.value / stats.overview.totalTasks) * 100}%`,
                                    backgroundColor: item.color
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Nessun dato disponibile per il grafico</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Distribuzione per Priorità */}
        <div className="col-lg-6">
          <Card>
            <div className="card-header">
              <h5 className="mb-0">Distribuzione Task per Priorità</h5>
            </div>
            <div className="card-body">
              {stats?.chartData?.priorityDistribution && stats.chartData.priorityDistribution.length > 0 ? (
                <div className="chart-container" style={{ height: '300px' }}>
                  {/* Inserire qui StatusChart component */}
                  <div className="d-flex flex-column justify-content-center align-items-center h-100">
                    <div className="row g-3 w-100">
                      {stats.chartData.priorityDistribution.map((item, index) => (
                        <div key={index} className="col-4 text-center">
                          <div className="mb-2">
                            <div 
                              className="mx-auto rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: item.color + '20',
                                border: `2px solid ${item.color}`,
                                fontSize: '24px'
                              }}
                            >
                              <i className={`fas ${
                                item.label === 'alta' ? 'fa-arrow-up' :
                                item.label === 'media' ? 'fa-minus' : 'fa-arrow-down'
                              }`} style={{ color: item.color }}></i>
                            </div>
                          </div>
                          <div>
                            <div className="h4 mb-0">{item.value}</div>
                            <small className="text-muted">{getPriorityName(item.label)}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Nessun dato disponibile per il grafico</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Performance Utenti */}
        <div className="col-lg-12">
          <Card>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Performance Dipendenti</h5>
              <small className="text-muted">Questa settimana</small>
            </div>
            <div className="card-body">
              {stats?.performance?.userPerformance && stats.performance.userPerformance.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Dipendente</th>
                        <th className="text-center">Task Completati</th>
                        <th className="text-center">Task in Corso</th>
                        <th className="text-center">Tasso Completamento</th>
                        <th className="text-center">Efficienza</th>
                        <th className="text-center">Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.performance.userPerformance.map((user, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar me-3">
                                <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                                     style={{ width: '36px', height: '36px' }}>
                                  <i className="fas fa-user"></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-medium">{user.name}</div>
                                <small className="text-muted">Dipendente</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success bg-opacity-10 text-success">
                              {user.tasksCompleted}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-warning bg-opacity-10 text-warning">
                              {user.tasksInProgress}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center">
                              <div className="progress flex-grow-1 me-2" style={{ width: '80px', height: '6px' }}>
                                <div 
                                  className="progress-bar bg-info" 
                                  style={{ width: `${user.completionRate}%` }}
                                ></div>
                              </div>
                              <span>{user.completionRate}%</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center">
                              <div className={`badge bg-${user.efficiency > 90 ? 'success' : user.efficiency > 70 ? 'warning' : 'danger'}-subtle text-${user.efficiency > 90 ? 'success' : user.efficiency > 70 ? 'warning' : 'danger'}`}>
                                {user.efficiency}/100
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            {user.completionRate > 90 ? (
                              <span className="badge bg-success">Eccellente</span>
                            ) : user.completionRate > 70 ? (
                              <span className="badge bg-warning">Buona</span>
                            ) : (
                              <span className="badge bg-danger">Da migliorare</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Nessun dato di performance disponibile</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Metriche Avanzate */}
      {stats?.metrics && (
        <div className="row g-4">
          <div className="col-lg-4">
            <Card className="h-100">
              <div className="card-body">
                <h6 className="card-title mb-3">Efficienza Team</h6>
                <div className="text-center py-4">
                  <div className="display-4 fw-bold text-primary">{stats.metrics.efficiency}</div>
                  <p className="text-muted">Task completati per persona</p>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Target: 15</small>
                  <small className={`text-${stats.metrics.efficiency >= 15 ? 'success' : 'danger'}`}>
                    {stats.metrics.efficiency >= 15 ? '✅ Raggiunto' : '⚠️ Sotto target'}
                  </small>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="col-lg-4">
            <Card className="h-100">
              <div className="card-body">
                <h6 className="card-title mb-3">Bilanciamento Carico di Lavoro</h6>
                <div className="text-center py-4">
                  <div className="display-4 fw-bold text-success">{stats.metrics.workloadBalance}%</div>
                  <p className="text-muted">Equilibrio distribuzione task</p>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${stats.metrics.workloadBalance}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">Bilanciato se ≥ 80%</small>
                  <small className={`text-${stats.metrics.workloadBalance >= 80 ? 'success' : 'warning'}`}>
                    {stats.metrics.workloadBalance >= 80 ? '✅ Ottimo' : '⚠️ Da migliorare'}
                  </small>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="col-lg-4">
            <Card className="h-100">
              <div className="card-body">
                <h6 className="card-title mb-3">Rispetto Priorità</h6>
                <div className="text-center py-4">
                  <div className="display-4 fw-bold text-warning">{stats.metrics.priorityAdherence}%</div>
                  <p className="text-muted">Task ad alta priorità completati</p>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{ width: `${stats.metrics.priorityAdherence}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">Target: 90%</small>
                  <small className={`text-${stats.metrics.priorityAdherence >= 90 ? 'success' : 'danger'}`}>
                    {stats.metrics.priorityAdherence >= 90 ? '✅ Ottimo' : '⚠️ Attenzione'}
                  </small>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal Esportazione */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        title="Esporta Statistiche"
        size="md"
      >
        <div className="p-3">
          <div className="mb-3">
            <label className="form-label">Seleziona formato</label>
            <div className="d-flex gap-2">
              {['csv', 'json', 'pdf'].map((format) => (
                <Button
                  key={format}
                  variant={exportFormat === format ? 'primary' : 'outline-secondary'}
                  onClick={() => setExportFormat(format)}
                  className="text-uppercase"
                >
                  {format}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Periodo</label>
            <select className="form-select" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              <option value="today">Oggi</option>
              <option value="week">Ultima settimana</option>
              <option value="month">Ultimo mese</option>
              <option value="quarter">Ultimo trimestre</option>
              <option value="year">Ultimo anno</option>
            </select>
          </div>
          
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Verranno esportati tutti i dati statistici disponibili per il periodo selezionato.
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="outline-secondary" onClick={() => setShowExportModal(false)}>
              Annulla
            </Button>
            <Button 
              variant="primary" 
              onClick={handleExport}
              disabled={exporting || !stats}
            >
              {exporting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Esportazione...
                </>
              ) : (
                <>
                  <i className="fas fa-download me-2"></i>
                  Esporta
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Statistics;