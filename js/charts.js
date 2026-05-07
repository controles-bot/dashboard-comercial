/* =====================================================
   GRÁFICOS – CHART.JS
   FINAL ESTÁVEL + DATALABELS + SAFE RENDER
   ===================================================== */

const FONT_FAMILY =
  'Inter, system-ui, -apple-system, Arial, sans-serif';

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

/* =====================================================
   REGISTRA DATALABELS
   ===================================================== */
if (window.ChartDataLabels) {

  Chart.register(ChartDataLabels);

} else {

  console.warn(
    'ChartDataLabels não carregado.'
  );

}

Chart.defaults.font.family = FONT_FAMILY;
Chart.defaults.color = TEXT_COLOR;

/* =====================================================
   OPÇÕES PADRÃO
   ===================================================== */
function getDefaultOptions(extra = {}) {

  return {

    responsive: true,

    maintainAspectRatio: false,

    animation: {
      duration: 500
    },

    interaction: {
      intersect: false,
      mode: 'index'
    },

    plugins: {

      /* ===================== LEGENDA ===================== */
      legend: {

        display: true,

        position: 'top',

        labels: {

          font: {
            size: 11
          }

        }

      },

      /* ===================== TOOLTIP ===================== */
      tooltip: {

        backgroundColor: '#ffffff',

        borderColor: '#d1d5db',

        borderWidth: 1,

        titleColor: TITLE_COLOR,

        bodyColor: TEXT_COLOR,

        callbacks: {

          label: function(context) {

            const value = context.raw;

            const label =
              (context.dataset.label || '')
                .toLowerCase();

            // ================= VALOR =================
            if (label.includes('valor')) {

              return 'R$ ' +
                Number(value)
                  .toLocaleString('pt-BR', {

                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2

                  });

            }

            // ================= VOLUME =================
            if (label.includes('volume')) {

              return Number(value)
                .toLocaleString('pt-BR', {

                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3

                }) + ' m³';

            }

            return value;

          }

        }

      },

      /* ===================== VALORES NAS BARRAS ===================== */
      datalabels: {

        display: true,

        // ================= POSICIONAMENTO DINÂMICO =================
        anchor: function(context) {

          const isHorizontal =
            context.chart.options.indexAxis === 'y';

          return isHorizontal
            ? 'end'
            : 'end';

        },

        align: function(context) {

          const isHorizontal =
            context.chart.options.indexAxis === 'y';

          return isHorizontal
            ? 'right'
            : 'top';

        },

        offset: function(context) {

          const isHorizontal =
            context.chart.options.indexAxis === 'y';

          return isHorizontal
            ? 8
            : 2;

        },

        clamp: true,

        clip: false,

        color: '#111827',

        font: {

          weight: 'bold',

          size: 10

        },

        formatter: (value, context) => {

          const label =
            (context.dataset.label || '')
              .toLowerCase();

          // ================= VALOR =================
          if (label.includes('valor')) {

            return 'R$ ' +
              Number(value)
                .toLocaleString('pt-BR', {

                  maximumFractionDigits: 0

                });

          }

          // ================= VOLUME =================
          if (label.includes('volume')) {

            return Number(value)
              .toLocaleString('pt-BR', {

                minimumFractionDigits: 2,
                maximumFractionDigits: 2

              }) + ' m³';

          }

          // ================= QUANTIDADE =================
          return value ?? 0;

        }

      }

    },

    /* =====================================================
       ESCALAS
       ===================================================== */
    scales: {

      x: {

        grid: {

          color: GRID_COLOR

        },

        ticks: {

          font: {

            size: 10

          }

        }

      },

      y: {

        beginAtZero: true,

        grid: {

          color: GRID_COLOR

        },

        ticks: {

          font: {

            size: 10

          },

          callback: function(value) {

            const datasetLabel =
              this.chart.data.datasets[0]
                ?.label
                ?.toLowerCase() || '';

            // ================= VALOR =================
            if (datasetLabel.includes('valor')) {

              return 'R$ ' +
                Number(value)
                  .toLocaleString('pt-BR');

            }

            // ================= VOLUME =================
            if (datasetLabel.includes('volume')) {

              return Number(value)
                .toLocaleString('pt-BR', {

                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3

                }) + ' m³';

            }

            return value;

          }

        }

      }

    },

    ...extra

  };

}

/* =====================================================
   CREATE / UPDATE SAFE
   ===================================================== */
function createOrUpdateChart(id, config) {

  const canvas =
    document.getElementById(id);

  // ================= NÃO EXISTE =================
  if (!canvas) {

    console.warn(
      `Canvas "${id}" não encontrado.`
    );

    return;

  }

  const ctx = canvas.getContext('2d');

  if (!ctx) {

    console.warn(
      `Contexto inválido "${id}".`
    );

    return;

  }

  try {

    // ================= DESTROI ANTIGO =================
    if (charts[id]) {

      charts[id].destroy();

      delete charts[id];

    }

    // ================= LIMPA =================
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // ================= NOVO =================
    charts[id] =
      new Chart(ctx, config);

  } catch (err) {

    console.error(
      `Erro gráfico "${id}"`,
      err
    );

  }

}

/* =====================================================
   BARRA
   ===================================================== */
function renderBarChart(
  id,
  labels,
  data,
  label = ''
) {

  let datasets = [];

  // ================= MULTI =================
  if (
    Array.isArray(data) &&
    data.length &&
    typeof data[0] === 'object' &&
    data[0].data
  ) {

    datasets = data.map((ds, index) => ({

      label: ds.label,

      data: ds.data || [],

      backgroundColor:
        COLOR_PALETTE[
          index % COLOR_PALETTE.length
        ],

      borderRadius: 6

    }));

  }

  // ================= SINGLE =================
  else {

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

      datasets

    },

    options: getDefaultOptions()

  });

}

/* =====================================================
   BARRA HORIZONTAL
   ===================================================== */
function renderHorizontalBarChart(
  id,
  labels,
  data,
  label = ''
) {

  createOrUpdateChart(id, {

    type: 'bar',

    data: {

      labels: labels || [],

      datasets: [{

        label,

        data: data || [],

        backgroundColor:
          COLOR_PALETTE[0],

        borderRadius: 6

      }]

    },

    options: getDefaultOptions({

      indexAxis: 'y'

    })

  });

}

/* =====================================================
   LINHA
   ===================================================== */
function renderLineChart(
  id,
  labels,
  data,
  label = ''
) {

  let datasets = [];

  // ================= MULTI =================
  if (
    Array.isArray(data) &&
    data.length &&
    typeof data[0] === 'object' &&
    data[0].data
  ) {

    datasets = data.map((ds, index) => ({

      label: ds.label,

      data: ds.data || [],

      borderColor:
        COLOR_PALETTE[
          index % COLOR_PALETTE.length
        ],

      backgroundColor:
        COLOR_PALETTE[
          index % COLOR_PALETTE.length
        ],

      tension: 0.35,

      fill: false,

      pointRadius: 4,

      pointHoverRadius: 6

    }));

  }

  // ================= SINGLE =================
  else {

    datasets = [{

      label,

      data: data || [],

      borderColor: COLOR_PALETTE[0],

      backgroundColor: COLOR_PALETTE[0],

      tension: 0.35,

      fill: false,

      pointRadius: 4,

      pointHoverRadius: 6

    }];

  }

  createOrUpdateChart(id, {

    type: 'line',

    data: {

      labels: labels || [],

      datasets

    },

    options: getDefaultOptions()

  });

}

/* =====================================================
   EXPORTS
   ===================================================== */
window.renderBarChart = renderBarChart;

window.renderHorizontalBarChart =
  renderHorizontalBarChart;

window.renderLineChart =
  renderLineChart;