import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { getStatusColor, getStatusName } from '../../constants/statuses';

const TaskChart = ({
  type = 'pie',
  data = {},
  title = 'Distribuzione Task',
  height = 300,
  showLegend = true,
  showTooltips = true,
  responsive = true,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  const chartConfigs = {
    pie: {
      type: 'pie',
      options: {
        responsive: responsive,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: showLegend,
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          title: {
            display: !!title,
            text: title,
            font: { size: 16, weight: '600' },
            padding: 20
          },
          tooltip: {
            enabled: showTooltips,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    },

    bar: {
      type: 'bar',
      options: {
        responsive: responsive,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend, position: 'top' },
          title: {
            display: !!title,
            text: title,
            font: { size: 16, weight: '600' },
            padding: 20
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    },

    line: {
      type: 'line',
      options: {
        responsive: responsive,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: showLegend, position: 'top' },
          title: {
            display: !!title,
            text: title,
            font: { size: 16, weight: '600' },
            padding: 20
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    },

    doughnut: {
      type: 'doughnut',
      options: {
        responsive: responsive,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: showLegend,
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: !!title,
            text: title,
            font: { size: 16, weight: '600' },
            padding: 20
          }
        },
        cutout: '60%'
      }
    }
  };

  const prepareChartData = () => {
    const config = chartConfigs[type] || chartConfigs.pie;

    if (data.labels && data.datasets) {
      return {
        ...data,
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          backgroundColor: dataset.backgroundColor || getDefaultColors(dataset.data.length, type),
          borderColor: dataset.borderColor || (type === 'line' ? getDefaultColors(dataset.data.length, type) : '#ffffff'),
          borderWidth: dataset.borderWidth || (type === 'bar' ? 1 : 2)
        }))
      };
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
      const labels = Object.keys(data);
      const values = Object.values(data);
      const colors = labels.map(label => getStatusColor(label) || getRandomColor(label));

      return {
        labels: labels.map(label => getStatusName(label) || label),
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: type === 'line' ? colors.map(color => adjustColor(color, -20)) : '#ffffff',
          borderWidth: type === 'bar' ? 1 : 2,
          label: 'Task'
        }]
      };
    }

    return {
      labels: ['Nessun dato'],
      datasets: [{
        data: [1],
        backgroundColor: ['#e5e7eb'],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };
  };

  const initChart = () => {
    if (!canvasRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const config = chartConfigs[type] || chartConfigs.pie;
    const chartData = prepareChartData();

    chartInstance.current = new Chart(ctx, {
      type: config.type,
      data: chartData,
      options: config.options
    });
  };

  useEffect(() => {
    initChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, title, showLegend]);

  const getDefaultColors = (count, chartType) => {
    if (chartType === 'line') {
      return [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
      ].slice(0, count);
    }

    return [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#d946ef'
    ].slice(0, count);
  };

  const getRandomColor = (seed) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#d946ef'
    ];
    const index = Math.abs(hashString(seed)) % colors.length;
    return colors[index];
  };

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };

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

  return (
    <div className={`task-chart ${className}`} style={{ position: 'relative', height: `${height}px` }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export const TaskPieChart = (props) => <TaskChart type="pie" {...props} />;
export const TaskBarChart = (props) => <TaskChart type="bar" {...props} />;
export const TaskLineChart = (props) => <TaskChart type="line" {...props} />;
export const TaskDoughnutChart = (props) => <TaskChart type="doughnut" {...props} />;

export default TaskChart;