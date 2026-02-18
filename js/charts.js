/* =====================================================
   GRÁFICOS – CHART.JS
   FINAL – Suporte a comparação por ano + labels externos
   ===================================================== */

const FONT_FAMILY = 'Inter, system-ui, -apple-system, Arial, sans-serif';
const TEXT_COLOR = '#374151';
const TITLE_COLOR = '#111827';
const GRID_COLOR = '#e5e7eb';

// Paleta automática para múltiplos anos
const COLOR_PALETTE = [
  '#068147',
  '#1d4ed8',
  '#dc2626',
  '#9333ea',
  '#ea580c',
  '#0ea5e9'
];

const charts = {};

// Registrar plugin DataLabels
if (window.ChartDataLabels) {
  Chart.register(ChartDataLabels);
}

// Configuração global
Chart.defaults.font.family = FONT_FAMILY;
Chart.defaults.color = TEXT_COLOR;

// ===================== OPÇÕES PADRÃO =====================
function getDefaultOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: 'top'
      },

      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        borderWidth: 1,
        titleColor: TITLE_COLOR,
        bodyColor: TEXT_COLOR
      },

      // 🔥 VALORES FORA DAS BARRAS
      datalabels: {
        anchor: 'end',
        align: 'end',
        offset: 6,
        color: '#111',
        font: { weight: 'bold', size: 11 },
        formatter: value => value ?? 0
      }
    },

    scales: {
      x: {
        grid: { color: GRID_COLOR }
      },
      y: {
        beginAtZero: true,
        grid: { color: GRID_COLOR }
      }
    },

    ...extra
  };
}

// ===================== BASE =====================
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

// ===================== BARRA (SUPORTA 1 OU VÁRIOS DATASETS) =====================
function renderBarChart(id, labels, data, label = '') {

  let datasets = [];

  // 🔥 Se data já vier como array de datasets (comparação por ano)
  if (Array.isArray(data) && data.length && typeof data[0] === 'object' && data[0].data) {
    datasets = data.map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length],
      borderRadius: 6
    }));
  } else {
    // Caso normal (apenas um dataset)
    datasets = [{
      label,
      data: data || [],
      backgroundColor: COLOR_PALETTE[0],
      borderRadius: 6
    }];
  }

  createOrUpdateChart(id, {
    type: 'bar',
    data: {
      labels: labels || [],
      datasets: datasets
    },
    options: getDefaultOptions()
  });
}

// ===================== BARRA HORIZONTAL =====================
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
    options: getDefaultOptions({
      indexAxis: 'y'
    })
  });
}

// ===================== LINHA (SUPORTA MÚLTIPLOS ANOS) =====================
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
    data: {
      labels: labels || [],
      datasets: datasets
    },
    options: getDefaultOptions()
  });
}

// ===================== EXPORTAÇÃO GLOBAL =====================
window.renderBarChart = renderBarChart;
window.renderHorizontalBarChart = renderHorizontalBarChart;
window.renderLineChart = renderLineChart;
