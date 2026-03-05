/* =====================================================
   GRÁFICOS – CHART.JS
   FINAL – FORMATADO + VISUAL CORPORATIVO
   ===================================================== */

const FONT_FAMILY = 'Inter, system-ui, -apple-system, Arial, sans-serif';
const TEXT_COLOR = '#374151';
const TITLE_COLOR = '#111827';
const GRID_COLOR = '#e5e7eb';

const COLOR_PALETTE = [
  '#068147',
  '#1d4ed8',
  '#dc2626',
  '#9333ea',
  '#ea580c',
  '#0ea5e9'
];

const charts = {};

if (window.ChartDataLabels) {
  Chart.register(ChartDataLabels);
}

Chart.defaults.font.family = FONT_FAMILY;
Chart.defaults.color = TEXT_COLOR;

/* ===================== OPÇÕES PADRÃO ===================== */
function getDefaultOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: 11 }
        }
      },

      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        borderWidth: 1,
        titleColor: TITLE_COLOR,
        bodyColor: TEXT_COLOR,
        callbacks: {
          label: function(context) {

            const value = context.raw;
            const label = (context.dataset.label || '').toLowerCase();

            if (label.includes('valor')) {
              return 'R$' + Number(value).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
            }

            if (label.includes('volume')) {
              return Number(value).toLocaleString('pt-BR', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
              }) + ' m³';
            }

            return value;
          }
        }
      },

      datalabels: {
        anchor: 'end',
        align: 'end',
        offset: 4,
        color: '#111',
        font: { weight: '600', size: 9 },
        formatter: (value, context) => {

          const label = (context.dataset.label || '').toLowerCase();

          if (label.includes('valor')) {
            return 'R$' + Number(value).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }

          if (label.includes('volume')) {
            return Number(value).toLocaleString('pt-BR', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3
            });
          }

          return value ?? 0;
        }
      }
    },

    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: {
          font: { size: 10 }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID_COLOR },
        ticks: {
          font: { size: 10 },
          callback: function(value) {

            const datasetLabel =
              this.chart.data.datasets[0]?.label?.toLowerCase() || '';

            if (datasetLabel.includes('valor')) {
              return 'R$' + Number(value).toLocaleString('pt-BR');
            }

            if (datasetLabel.includes('volume')) {
              return Number(value).toLocaleString('pt-BR', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
              });
            }

            return value;
          }
        }
      }
    },

    ...extra
  };
}

/* ===================== BASE ===================== */
function createOrUpdateChart(id, config) {

  const canvas = document.getElementById(id);

  if (!canvas) {
    console.warn(`Canvas "${id}" não encontrado.`);
    return;
  }

  if (charts[id]) {
    charts[id].destroy();
  }

  charts[id] = new Chart(canvas, config);
}

/* ===================== BARRA ===================== */
function renderBarChart(id, labels, data, label = '') {

  let datasets = [];

  if (Array.isArray(data) && data.length && typeof data[0] === 'object' && data[0].data) {
    datasets = data.map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
      borderRadius: 6
    }));
  } else {
    datasets = [{
      label,
      data: data || [],
      backgroundColor: COLOR_PALETTE[0],
      borderRadius: 6
    }];
  }

  createOrUpdateChart(id, {
    type: 'bar',
    data: { labels: labels || [], datasets },
    options: getDefaultOptions()
  });
}

/* ===================== BARRA HORIZONTAL ===================== */
function renderHorizontalBarChart(id, labels, data, label = '') {

  createOrUpdateChart(id, {
    type: 'bar',
    data: {
      labels: labels || [],
      datasets: [{
        label,
        data: data || [],
        backgroundColor: COLOR_PALETTE[0],
        borderRadius: 6
      }]
    },
    options: getDefaultOptions({ indexAxis: 'y' })
  });
}

/* ===================== LINHA ===================== */
function renderLineChart(id, labels, data, label = '') {

  let datasets = [];

  if (Array.isArray(data) && data.length && typeof data[0] === 'object' && data[0].data) {
    datasets = data.map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      borderColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
      backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
      tension: 0.35,
      fill: false,
      pointRadius: 4
    }));
  } else {
    datasets = [{
      label,
      data: data || [],
      borderColor: COLOR_PALETTE[0],
      backgroundColor: COLOR_PALETTE[0],
      tension: 0.35,
      fill: false,
      pointRadius: 4
    }];
  }

  createOrUpdateChart(id, {
    type: 'line',
    data: { labels: labels || [], datasets },
    options: getDefaultOptions()
  });
}

/* ===================== EXPORTAÇÃO ===================== */
window.renderBarChart = renderBarChart;
window.renderHorizontalBarChart = renderHorizontalBarChart;
window.renderLineChart = renderLineChart;