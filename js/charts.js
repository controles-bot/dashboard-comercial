/* =====================================================
   GRÁFICOS - CHART.JS
   Arquivo: js/charts.js

   Dashboard RRC - Isopack

   Gráficos utilizados:
   - Reclamações por Setor
   - Top Clientes
   - Evolução das Reclamações
   - Responsável Comercial
   ===================================================== */

console.log("charts.js carregado");


/* =====================================================
   1. CONFIGURAÇÕES GERAIS
   ===================================================== */

const FONT_FAMILY =
  "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";


const TEXT_COLOR =
  "#374151";


const TITLE_COLOR =
  "#111827";


const GRID_COLOR =
  "#e5e7eb";


const PRIMARY_COLOR =
  "#068147";


const SECONDARY_COLOR =
  "#0B8043";


const COLOR_PALETTE = [
  "#068147",
  "#1d4ed8",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0ea5e9",
  "#16a34a",
  "#7c3aed",
  "#0891b2",
  "#ca8a04"
];


/* =====================================================
   2. CONTROLE DOS GRÁFICOS
   ===================================================== */

const charts = {};


/* =====================================================
   3. REGISTRA O PLUGIN DATALABELS
   ===================================================== */

if (window.ChartDataLabels) {

  Chart.register(
    ChartDataLabels
  );

} else {

  console.warn(
    "ChartDataLabels não carregado."
  );

}


/* =====================================================
   4. CONFIGURAÇÕES GLOBAIS
   ===================================================== */

if (window.Chart) {

  Chart.defaults.font.family =
    FONT_FAMILY;


  Chart.defaults.color =
    TEXT_COLOR;

}


/* =====================================================
   5. FORMATAÇÃO DE VALORES
   ===================================================== */

function formatChartNumber(value) {

  return Number(
    value || 0
  ).toLocaleString(
    "pt-BR"
  );

}


/* =====================================================
   6. OPÇÕES PADRÃO
   ===================================================== */

function getDefaultOptions(extra = {}) {

  const base = {

    responsive: true,

    maintainAspectRatio: false,


    /* ===============================================
       ANIMAÇÃO
       =============================================== */

    animation: {

      duration: 450

    },


    /* ===============================================
       INTERAÇÃO
       =============================================== */

    interaction: {

      intersect: false,

      mode: "nearest"

    },


    /* ===============================================
       LAYOUT
       Dá espaço para os números exibidos nas barras.
       =============================================== */

    layout: {

      padding: {

        top: 20,

        right: 30,

        bottom: 5,

        left: 5

      }

    },


    /* ===============================================
       PLUGINS
       =============================================== */

    plugins: {


      /* ===========================================
         LEGENDA
         =========================================== */

      legend: {

        display: false,

        position: "top",

        labels: {

          usePointStyle: true,

          boxWidth: 8,

          padding: 16,

          font: {

            size: 11

          }

        }

      },


      /* ===========================================
         TOOLTIP
         =========================================== */

      tooltip: {

        enabled: true,

        backgroundColor:
          "#ffffff",

        borderColor:
          "#d1d5db",

        borderWidth: 1,

        titleColor:
          TITLE_COLOR,

        bodyColor:
          TEXT_COLOR,

        padding: 10,

        displayColors: false,


        callbacks: {

          label: function(context) {

            const value =
              context.raw || 0;


            return (
              "Reclamações: " +
              formatChartNumber(value)
            );

          }

        }

      },


      /* ===========================================
         VALORES NOS GRÁFICOS
         =========================================== */

      datalabels: {

        display: true,

        color:
          "#111827",

        clamp: true,

        clip: false,


        font: {

          weight: "bold",

          size: 10

        },


        formatter: function(value) {

          if (
            value === null ||
            value === undefined ||
            Number(value) === 0
          ) {
            return "";
          }


          return formatChartNumber(
            value
          );

        }

      }

    },


    /* ===============================================
       ESCALAS
       =============================================== */

    scales: {


      /* ===========================================
         EIXO X
         =========================================== */

      x: {

        beginAtZero: true,

        grid: {

          color:
            GRID_COLOR,

          drawBorder: false

        },


        border: {

          display: false

        },


        ticks: {

          color:
            TEXT_COLOR,

          font: {

            size: 10

          }

        }

      },


      /* ===========================================
         EIXO Y
         =========================================== */

      y: {

        beginAtZero: true,

        grid: {

          color:
            GRID_COLOR,

          drawBorder: false

        },


        border: {

          display: false

        },


        ticks: {

          color:
            TEXT_COLOR,

          precision: 0,

          font: {

            size: 10

          }

        }

      }

    }

  };


  return deepMerge(
    base,
    extra
  );

}


/* =====================================================
   7. MERGE DE OBJETOS

   Permite alterar somente partes específicas das
   configurações sem destruir as opções padrão.
   ===================================================== */

function deepMerge(target, source) {

  const output = {
    ...target
  };


  if (
    !source ||
    typeof source !== "object"
  ) {
    return output;
  }


  Object.keys(source)
    .forEach(function(key) {

      const valorSource =
        source[key];


      const valorTarget =
        output[key];


      if (
        valorSource &&
        typeof valorSource === "object" &&
        !Array.isArray(valorSource)
      ) {

        output[key] =
          deepMerge(
            valorTarget &&
            typeof valorTarget === "object"
              ? valorTarget
              : {},
            valorSource
          );

      } else {

        output[key] =
          valorSource;

      }

    });


  return output;

}


/* =====================================================
   8. CRIA / ATUALIZA GRÁFICO COM SEGURANÇA
   ===================================================== */

function createOrUpdateChart(
  id,
  config
) {

  const canvas =
    document.getElementById(id);


  if (!canvas) {

    console.warn(
      'Canvas "' +
      id +
      '" não encontrado.'
    );

    return null;

  }


  if (
    typeof Chart ===
    "undefined"
  ) {

    console.error(
      "Chart.js não foi carregado."
    );

    return null;

  }


  const ctx =
    canvas.getContext("2d");


  if (!ctx) {

    console.warn(
      'Contexto inválido para "' +
      id +
      '".'
    );

    return null;

  }


  try {


    /* ===============================================
       DESTROI INSTÂNCIA ANTIGA
       =============================================== */

    if (charts[id]) {

      charts[id].destroy();

      delete charts[id];

    }


    /* ===============================================
       GARANTIA EXTRA

       Caso exista alguma instância Chart associada
       ao mesmo canvas.
       =============================================== */

    const instanciaExistente =
      Chart.getChart(canvas);


    if (instanciaExistente) {

      instanciaExistente.destroy();

    }


    /* ===============================================
       CRIA NOVO
       =============================================== */

    charts[id] =
      new Chart(
        ctx,
        config
      );


    return charts[id];


  } catch (erro) {

    console.error(
      'Erro ao renderizar gráfico "' +
      id +
      '":',
      erro
    );


    return null;

  }

}


/* =====================================================
   9. DESTRÓI UM GRÁFICO
   ===================================================== */

function destroyChart(id) {

  if (!charts[id]) {
    return;
  }


  charts[id].destroy();

  delete charts[id];

}


/* =====================================================
   10. DESTRÓI TODOS OS GRÁFICOS
   ===================================================== */

function destroyAllCharts() {

  Object.keys(charts)
    .forEach(function(id) {

      destroyChart(id);

    });

}


/* =====================================================
   11. GRÁFICO DE BARRAS VERTICAIS
   ===================================================== */

function renderBarChart(
  id,
  labels,
  data,
  label = "Reclamações",
  options = {}
) {

  const valores =
    Array.isArray(data)
      ? data
      : [];


  createOrUpdateChart(
    id,
    {

      type: "bar",


      data: {

        labels:
          labels || [],


        datasets: [

          {

            label:
              label,

            data:
              valores,

            backgroundColor:
              PRIMARY_COLOR,

            borderColor:
              PRIMARY_COLOR,

            borderWidth:
              0,

            borderRadius:
              6,

            borderSkipped:
              false,

            maxBarThickness:
              55

          }

        ]

      },


      options:
        getDefaultOptions(

          deepMerge(
            {

              plugins: {

                legend: {

                  display:
                    false

                },


                datalabels: {

                  anchor:
                    "end",

                  align:
                    "top",

                  offset:
                    2

                }

              },


              scales: {

                y: {

                  beginAtZero:
                    true,

                  ticks: {

                    precision:
                      0

                  }

                }

              }

            },

            options

          )

        )

    }
  );

}


/* =====================================================
   12. BARRAS COM CORES DIFERENTES
   ===================================================== */

function renderColoredBarChart(
  id,
  labels,
  data,
  label = "Reclamações",
  options = {}
) {

  const valores =
    Array.isArray(data)
      ? data
      : [];


  const cores =
    valores.map(
      function(_, index) {

        return COLOR_PALETTE[
          index %
          COLOR_PALETTE.length
        ];

      }
    );


  createOrUpdateChart(
    id,
    {

      type:
        "bar",


      data: {

        labels:
          labels || [],


        datasets: [

          {

            label:
              label,

            data:
              valores,

            backgroundColor:
              cores,

            borderColor:
              cores,

            borderWidth:
              0,

            borderRadius:
              6,

            borderSkipped:
              false,

            maxBarThickness:
              55

          }

        ]

      },


      options:
        getDefaultOptions(

          deepMerge(
            {

              plugins: {

                legend: {

                  display:
                    false

                },

                datalabels: {

                  anchor:
                    "end",

                  align:
                    "top",

                  offset:
                    2

                }

              }

            },

            options

          )

        )

    }
  );

}


/* =====================================================
   13. BARRA HORIZONTAL

   Usada principalmente para:
   - Top Clientes
   - Responsável Comercial
   ===================================================== */

function renderHorizontalBarChart(
  id,
  labels,
  data,
  label = "Reclamações",
  options = {}
) {

  const valores =
    Array.isArray(data)
      ? data
      : [];


  const cores =
    valores.map(
      function(_, index) {

        return COLOR_PALETTE[
          index %
          COLOR_PALETTE.length
        ];

      }
    );


  createOrUpdateChart(
    id,
    {

      type:
        "bar",


      data: {

        labels:
          labels || [],


        datasets: [

          {

            label:
              label,

            data:
              valores,

            backgroundColor:
              cores,

            borderColor:
              cores,

            borderWidth:
              0,

            borderRadius:
              6,

            borderSkipped:
              false,

            maxBarThickness:
              38

          }

        ]

      },


      options:
        getDefaultOptions(

          deepMerge(
            {

              indexAxis:
                "y",


              layout: {

                padding: {

                  top:
                    5,

                  right:
                    45,

                  bottom:
                    5,

                  left:
                    5

                }

              },


              plugins: {

                legend: {

                  display:
                    false

                },


                datalabels: {

                  anchor:
                    "end",

                  align:
                    "right",

                  offset:
                    6

                }

              },


              scales: {

                x: {

                  beginAtZero:
                    true,

                  ticks: {

                    precision:
                      0

                  }

                },


                y: {

                  grid: {

                    display:
                      false

                  },


                  ticks: {

                    autoSkip:
                      false,

                    font: {

                      size:
                        10

                    }

                  }

                }

              }

            },

            options

          )

        )

    }
  );

}


/* =====================================================
   14. GRÁFICO DE LINHA

   Usado para Evolução das Reclamações.
   ===================================================== */

function renderLineChart(
  id,
  labels,
  data,
  label = "Reclamações",
  options = {}
) {

  const valores =
    Array.isArray(data)
      ? data
      : [];


  createOrUpdateChart(
    id,
    {

      type:
        "line",


      data: {

        labels:
          labels || [],


        datasets: [

          {

            label:
              label,

            data:
              valores,

            borderColor:
              PRIMARY_COLOR,

            backgroundColor:
              "rgba(6, 129, 71, 0.12)",

            borderWidth:
              3,

            tension:
              0.3,

            fill:
              true,

            pointRadius:
              4,

            pointHoverRadius:
              6,

            pointBackgroundColor:
              PRIMARY_COLOR,

            pointBorderColor:
              "#ffffff",

            pointBorderWidth:
              2

          }

        ]

      },


      options:
        getDefaultOptions(

          deepMerge(
            {

              interaction: {

                intersect:
                  false,

                mode:
                  "index"

              },


              plugins: {

                legend: {

                  display:
                    false

                },


                datalabels: {

                  anchor:
                    "end",

                  align:
                    "top",

                  offset:
                    4

                }

              },


              scales: {

                x: {

                  grid: {

                    display:
                      false

                  }

                },


                y: {

                  beginAtZero:
                    true,

                  ticks: {

                    precision:
                      0

                  }

                }

              }

            },

            options

          )

        )

    }
  );

}


/* =====================================================
   15. GRÁFICO POR SETOR

   Recebe os dados já filtrados.
   ===================================================== */

function renderChartSetores(data) {

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {

    renderColoredBarChart(
      "chartSetores",
      [],
      [],
      "Reclamações"
    );

    return;

  }


  const contagem =
    typeof countBy === "function"
      ? countBy(
          data,
          "setor"
        )
      : {};


  const ranking =
    typeof sortCountEntries ===
      "function"
      ? sortCountEntries(
          contagem
        )
      : Object.entries(
          contagem
        );


  const labels =
    ranking.map(
      function(item) {
        return item[0];
      }
    );


  const valores =
    ranking.map(
      function(item) {
        return item[1];
      }
    );


  renderColoredBarChart(
    "chartSetores",
    labels,
    valores,
    "Reclamações por Setor"
  );

}


/* =====================================================
   16. GRÁFICO TOP CLIENTES

   Por padrão mostra os 10 clientes com mais RRC.
   ===================================================== */

function renderChartClientes(
  data,
  limite = 10
) {

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {

    renderHorizontalBarChart(
      "chartClientes",
      [],
      [],
      "Reclamações"
    );

    return;

  }


  const ranking =
    typeof getRanking ===
      "function"
      ? getRanking(
          data,
          "cliente",
          limite
        )
      : [];


  const labels =
    ranking.map(
      function(item) {

        return item.nome;

      }
    );


  const valores =
    ranking.map(
      function(item) {

        return item.qtd;

      }
    );


  renderHorizontalBarChart(
    "chartClientes",
    labels,
    valores,
    "Reclamações por Cliente"
  );

}


/* =====================================================
   17. GRÁFICO EVOLUÇÃO

   Se houver apenas um ano filtrado:
   Jan até Dez.

   O dashboard.js poderá futuramente enviar labels
   personalizados caso sejam selecionados vários anos.
   ===================================================== */

function renderChartEvolucao(
  data,
  labelsPersonalizados = null,
  valoresPersonalizados = null
) {

  let labels = [];
  let valores = [];


  if (
    Array.isArray(
      labelsPersonalizados
    ) &&
    Array.isArray(
      valoresPersonalizados
    )
  ) {

    labels =
      labelsPersonalizados;

    valores =
      valoresPersonalizados;

  } else {

    const serie =
      typeof gerarSerieMensalDetalhada ===
        "function"
        ? gerarSerieMensalDetalhada(
            data || []
          )
        : {
            labels: [
              "Jan",
              "Fev",
              "Mar",
              "Abr",
              "Mai",
              "Jun",
              "Jul",
              "Ago",
              "Set",
              "Out",
              "Nov",
              "Dez"
            ],
            valores:
              Array(12).fill(0)
          };


    labels =
      serie.labels;

    valores =
      serie.valores;

  }


  renderLineChart(
    "chartEvolucao",
    labels,
    valores,
    "Reclamações"
  );

}

/* =====================================================
   18. RENDERIZA TODOS OS GRÁFICOS

   O dashboard.js poderá chamar apenas:

   renderDashboardCharts(dadosFiltrados);
   ===================================================== */

function renderDashboardCharts(data) {

  const dados =
    Array.isArray(data)
      ? data
      : [];


  renderChartSetores(
    dados
  );


  renderChartClientes(
    dados
  );


  renderChartEvolucao(
    dados
  );

}


/* =====================================================
   19. LIMPA TODOS OS GRÁFICOS
   ===================================================== */

function clearDashboardCharts() {

  renderChartSetores([]);

  renderChartClientes([]);

  renderChartEvolucao([]);

}


/* =====================================================
   20. EXPORTAÇÃO GLOBAL
   ===================================================== */

window.createOrUpdateChart =
  createOrUpdateChart;


window.destroyChart =
  destroyChart;


window.destroyAllCharts =
  destroyAllCharts;


window.renderBarChart =
  renderBarChart;


window.renderColoredBarChart =
  renderColoredBarChart;


window.renderHorizontalBarChart =
  renderHorizontalBarChart;


window.renderLineChart =
  renderLineChart;


window.renderChartSetores =
  renderChartSetores;


window.renderChartClientes =
  renderChartClientes;


window.renderChartEvolucao =
  renderChartEvolucao;


window.renderDashboardCharts =
  renderDashboardCharts;


window.clearDashboardCharts =
  clearDashboardCharts;