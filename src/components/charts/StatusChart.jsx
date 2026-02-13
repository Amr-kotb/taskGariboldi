import React, { useEffect, useRef } from 'react';
import { 
  TASK_STATUS, 
  getStatusName, 
  getStatusColor,
  getStatusIcon 
} from '../../constants/statuses';

/**
 * Componente specializzato per visualizzazione stati dei task
 */

const StatusChart = ({
  data = {},
  type = 'radial', // 'radial', 'horizontal', 'vertical', 'progress'
  title = 'Distribuzione Stati',
  height = 300,
  showValues = true,
  showIcons = true,
  compact = false,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  // Ordine predefinito degli stati
  const statusOrder = [
    TASK_STATUS.ASSEGNATO,
    TASK_STATUS.IN_CORSO,
    TASK_STATUS.COMPLETATO,
    TASK_STATUS.BLOCCATO
  ];

  // Normalizza i dati
  const normalizedData = () => {
    // Assicurati che tutti gli stati siano presenti
    const result = { ...data };
    statusOrder.forEach(status => {
      if (result[status] === undefined) {
        result[status] = 0;
      }
    });
    return result;
  };

  // Prepara i dati per il grafico
  const prepareChartData = () => {
    const normalized = normalizedData();
    const labels = statusOrder.map(status => getStatusName(status));
    const values = statusOrder.map(status => normalized[status] || 0);
    const colors = statusOrder.map(status => getStatusColor(status));
    const icons = statusOrder.map(status => getStatusIcon(status));
    
    return { labels, values, colors, icons };
  };

  // Inizializza grafico a barre orizzontali
  const initHorizontalBarChart = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const { labels, values, colors, icons } = prepareChartData();
    const total = values.reduce((a, b) => a + b, 0);
    
    // Crea gradiente per ogni barra
    const gradients = colors.map(color => {
      const gradient = ctx.createLinearGradient(0, 0, canvasRef.current.width, 0);
      gradient.addColorStop(0, adjustColor(color, 20));
      gradient.addColorStop(1, color);
      return gradient;
    });
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: gradients,
          borderColor: colors.map(color => adjustColor(color, -30)),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: !!title,
            text: title,
            font: { size: 16, weight: '600' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.x;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${value} task (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return value;
              }
            }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  };

  // Inizializza grafico radiale/progress
  const initRadialChart = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const { labels, values, colors } = prepareChartData();
    const total = values.reduce((a, b) => a + b, 0);
    
    // Crea dati per grafico radiale
    const percentages = total > 0 ? values.map(v => Math.round((v / total) * 100)) : values;
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: percentages,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: compact ? 1 : 2,
          cutout: compact ? '70%' : '60%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !compact,
            position: 'right',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: !!title && !compact,
            text: title,
            font: { size: 16, weight: '600' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label;
                const percentage = context.parsed;
                const value = values[context.dataIndex];
                return `${label}: ${value} task (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  };

  // Inizializza grafico progressivo
  const initProgressChart = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const { values } = prepareChartData();
    const completed = values[statusOrder.indexOf(TASK_STATUS.COMPLETATO)] || 0;
    const total = values.reduce((a, b) => a + b, 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completati', 'Restanti'],
        datasets: [{
          data: [percentage, 100 - percentage],
          backgroundColor: [getStatusColor(TASK_STATUS.COMPLETATO), '#e5e7eb'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    
    // Aggiungi testo al centro
    ctx.save();
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.fillStyle = getStatusColor(TASK_STATUS.COMPLETATO);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${percentage}%`, centerX, centerY - 10);
    
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Completati', centerX, centerY + 15);
    ctx.restore();
  };

  // Inizializza il grafico appropriato
  const initChart = () => {
    if (!canvasRef.current || typeof window.Chart === 'undefined') return;
    
    // Distruggi il grafico esistente
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    switch (type) {
      case 'horizontal':
        initHorizontalBarChart();
        break;
      case 'vertical':
        // Simile a horizontal ma con asse X/Y invertito
        initHorizontalBarChart(); // Per ora usiamo lo stesso
        break;
      case 'progress':
        initProgressChart();
        break;
      case 'radial':
      default:
        initRadialChart();
        break;
    }
  };

  // Effetto per inizializzare il grafico
  useEffect(() => {
    initChart();
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, title, compact]);

  // Funzione di utilità per regolare colori
  const adjustColor = (color, amount) => {
    let usePound = false;
    if (color[0] === "#") {
      color = color.slice(1);
      usePound = true;
    }
    
    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    
    r = Math.min(Math.max(0, r), 255);
    g = Math.min(Math.max(0, g), 255);
    b = Math.min(Math.max(0, b), 255);
    
    return (usePound ? "#" : "") + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
  };

  // Vista compatta senza canvas (per mobile o quando Chart.js non è disponibile)
  const renderCompactView = () => {
    const { labels, values, colors, icons } = prepareChartData();
    const total = values.reduce((a, b) => a + b, 0);
    
    return (
      <div className="status-compact-view">
        <div className="status-bars">
          {values.map((value, index) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            
            return (
              <div key={index} className="status-bar-item mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center">
                    {showIcons && (
                      <i className={`fas ${icons[index]} me-2`} style={{ color: colors[index] }}></i>
                    )}
                    <span className="status-label" style={{ color: colors[index] }}>
                      {labels[index]}
                    </span>
                  </div>
                  {showValues && (
                    <div className="status-values">
                      <span className="status-count fw-bold me-2">{value}</span>
                      <span className="status-percentage text-muted">
                        ({Math.round(percentage)}%)
                      </span>
                    </div>
                  )}
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: colors[index]
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`status-chart ${className}`} style={{ position: 'relative', height: `${height}px` }}>
      {compact ? (
        renderCompactView()
      ) : (
        <>
          <canvas ref={canvasRef}></canvas>
          
          {typeof window.Chart === 'undefined' && (
            <div className="chart-fallback" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              {renderCompactView()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Componenti specifici per diversi tipi di visualizzazione
export const StatusRadialChart = (props) => <StatusChart type="radial" {...props} />;
export const StatusProgressChart = (props) => <StatusChart type="progress" {...props} />;
export const StatusHorizontalChart = (props) => <StatusChart type="horizontal" {...props} />;
export const StatusCompactChart = (props) => <StatusChart type="radial" compact {...props} />;

export default StatusChart;