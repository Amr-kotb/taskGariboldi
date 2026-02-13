import React, { useEffect, useRef } from 'react';

/**
 * Componente per grafici di progresso e trend
 * Specializzato in metriche temporali e progresso individuale
 */

const ProgressChart = ({
  type = 'line', // 'line', 'bar', 'area', 'radar'
  data = {},
  title = 'Progresso nel Tempo',
  height = 300,
  showGrid = true,
  showPoints = true,
  fillArea = false,
  stepped = false,
  smooth = true,
  timeUnit = 'day', // 'day', 'week', 'month'
  className = ''
}) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  // Configurazioni per unità temporali
  const timeConfigs = {
    day: {
      labelFormat: (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
      },
      tooltipFormat: (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('it-IT', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    },
    week: {
      labelFormat: (week) => `Settimana ${week}`,
      tooltipFormat: (week) => `Settimana ${week}`
    },
    month: {
      labelFormat: (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('it-IT', { month: 'short' });
      },
      tooltipFormat: (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      }
    }
  };

  // Prepara i dati per il grafico
  const prepareChartData = () => {
    const config = timeConfigs[timeUnit] || timeConfigs.day;
    
    // Se i dati sono già formattati, usali direttamente
    if (data.labels && data.datasets) {
      return {
        labels: data.labels.map(label => 
          typeof label === 'string' ? label : config.labelFormat(label)
        ),
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          fill: fillArea,
          tension: smooth ? 0.4 : 0,
          stepped: stepped ? 'middle' : false,
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: 6,
          borderWidth: 2,
          backgroundColor: dataset.backgroundColor || adjustColor(dataset.borderColor || '#3b82f6', -90)
        }))
      };
    }

    // Se i dati sono trend nel tempo
    if (data.timeline && data.values) {
      const labels = data.timeline.map(config.labelFormat);
      
      return {
        labels,
        datasets: [{
          label: data.label || 'Progresso',
          data: data.values,
          borderColor: '#3b82f6',
          backgroundColor: fillArea ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          fill: fillArea,
          tension: smooth ? 0.4 : 0,
          stepped: stepped ? 'middle' : false,
          pointRadius: showPoints ? 4 : 0,
          pointHoverRadius: 6,
          borderWidth: 2
        }]
      };
    }

    // Se i dati sono per più dataset (comparazione)
    if (Array.isArray(data) && data.every(item => item.label && item.values)) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const labels = data[0]?.values?.map((_, index) => `Punto ${index + 1}`) || [];
      
      return {
        labels,
        datasets: data.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.values,
          borderColor: colors[index % colors.length],
          backgroundColor: fillArea ? adjustColor(colors[index % colors.length], -90) : 'transparent',
          fill: fillArea && index === 0, // Riempie solo il primo dataset per area
          tension: smooth ? 0.4 : 0,
          stepped: stepped ? 'middle' : false,
          pointRadius: showPoints ? 3 : 0,
          pointHoverRadius: 5,
          borderWidth: 2
        }))
      };
    }

    // Default: dati di esempio
    return {
      labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
      datasets: [{
        label: 'Task Completati',
        data: [12, 19, 8, 15, 22, 18],
        borderColor: '#3b82f6',
        backgroundColor: fillArea ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        fill: fillArea,
        tension: smooth ? 0.4 : 0
      }]
    };
  };

  // Inizializza il grafico
  const initChart = () => {
    if (!canvasRef.current) return;
    
    // Distruggi il grafico esistente
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Verifica se Chart.js è disponibile
    if (typeof window.Chart === 'undefined') {
      console.error('Chart.js non è stato caricato.');
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    const chartData = prepareChartData();
    
    // Configurazione in base al tipo
    let chartType = type;
    let options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartData.datasets.length > 1,
          position: 'top',
          labels: {
            padding: 15,
            usePointStyle: true
          }
        },
        title: {
          display: !!title,
          text: title,
          font: {
            family: "'Inter', sans-serif",
            size: 16,
            weight: '600'
          },
          padding: 20
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(tooltipItems) {
              if (timeUnit === 'day' && data.timeline) {
                const index = tooltipItems[0].dataIndex;
                return timeConfigs[timeUnit].tooltipFormat(data.timeline[index]);
              }
              return tooltipItems[0].label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: showGrid,
            drawBorder: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: showGrid,
            drawBorder: false
          },
          ticks: {
            precision: 0
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      elements: {
        line: {
          tension: smooth ? 0.4 : 0
        }
      }
    };
    
    // Configurazioni specifiche per tipo
    if (type === 'area') {
      chartType = 'line';
      options.plugger = {
        ...options.plugger,
        filler: {
          propagate: true
        }
      };
    }
    
    if (type === 'radar') {
      options.scales = {
        r: {
          beginAtZero: true,
          grid: {
            display: showGrid
          },
          ticks: {
            display: false,
            maxTicksLimit: 5
          }
        }
      };
    }
    
    chartInstance.current = new window.Chart(ctx, {
      type: chartType,
      data: chartData,
      options: options
    });
  };

  // Effetto per inizializzare il grafico
  useEffect(() => {
    initChart();
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, title, fillArea, smooth, timeUnit]);

  // Funzione di utilità per regolare colori
  const adjustColor = (color, amount) => {
    if (!color.startsWith('#')) return color;
    
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

  // Vista alternativa senza canvas
  const renderFallbackView = () => {
    const chartData = prepareChartData();
    const { labels, datasets } = chartData;
    
    // Calcola massimo per scaling
    const allValues = datasets.flatMap(dataset => dataset.data);
    const maxValue = Math.max(...allValues, 1);
    
    return (
      <div className="progress-fallback" style={{ height: '100%' }}>
        <div className="d-flex justify-content-between align-items-end h-100">
          {labels.map((label, labelIndex) => (
            <div key={labelIndex} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
              {datasets.map((dataset, datasetIndex) => {
                const value = dataset.data[labelIndex] || 0;
                const heightPercentage = (value / maxValue) * 80;
                const color = dataset.borderColor || '#3b82f6';
                
                return (
                  <div
                    key={datasetIndex}
                    className="mb-1"
                    style={{
                      width: '80%',
                      height: `${heightPercentage}%`,
                      backgroundColor: color,
                      opacity: 0.7,
                      borderRadius: '4px',
                      position: 'relative'
                    }}
                    title={`${dataset.label}: ${value}`}
                  >
                    {datasets.length === 1 && value > 0 && (
                      <div className="position-absolute top-0 start-50 translate-middle mt-n3">
                        <small className="fw-bold" style={{ fontSize: '10px' }}>
                          {value}
                        </small>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="mt-2">
                <small className="text-muted" style={{ 
                  fontSize: '10px',
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }}>
                  {label}
                </small>
              </div>
            </div>
          ))}
        </div>
        
        {datasets.length > 1 && (
          <div className="mt-3">
            <div className="d-flex justify-content-center gap-3">
              {datasets.map((dataset, index) => (
                <div key={index} className="d-flex align-items-center">
                  <div 
                    className="me-2" 
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: dataset.borderColor || '#3b82f6',
                      borderRadius: '2px'
                    }}
                  ></div>
                  <small className="text-muted">{dataset.label}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`progress-chart ${className}`} style={{ position: 'relative', height: `${height}px` }}>
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
          borderRadius: '8px',
          padding: '20px'
        }}>
          {renderFallbackView()}
        </div>
      )}
    </div>
  );
};

// Componenti specifici
export const LineProgressChart = (props) => <ProgressChart type="line" {...props} />;
export const AreaProgressChart = (props) => <ProgressChart type="area" fillArea {...props} />;
export const BarProgressChart = (props) => <ProgressChart type="bar" {...props} />;
export const RadarProgressChart = (props) => <ProgressChart type="radar" {...props} />;
export const SteppedProgressChart = (props) => <ProgressChart type="line" stepped {...props} />;

export default ProgressChart;