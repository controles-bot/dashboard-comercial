/* =====================================================
   DASHBOARD RRC - ISOPACK
   Arquivo: js/dashboard.js

   Responsável por:
   - Filtros
   - KPIs
   - Ranking Top 5 Erros
   - Gráficos
   - Últimas Reclamações
   - Busca na tabela
   ===================================================== */

/* =====================================================
   1. ELEMENTOS
   ===================================================== */

const btnReset =
  document.getElementById("btnReset");

/* PERÍODO */

const periodDropdown =
  document.getElementById(
    "periodDropdown"
  );

const periodSelected =
  document.getElementById(
    "periodSelected"
  );

const periodSelectedText =
  document.getElementById(
    "periodSelectedText"
  );

const periodMenu =
  document.getElementById(
    "periodMenu"
  );

/* SETOR */

const setorDropdown =
  document.getElementById(
    "setorDropdown"
  );

const setorSelected =
  document.getElementById(
    "setorSelected"
  );

const setorSelectedText =
  document.getElementById(
    "setorSelectedText"
  );

const setorMenu =
  document.getElementById(
    "setorMenu"
  );

/* VENDEDOR */

const filtroVendedor =
  document.getElementById(
    "filtroVendedor"
  );

/* REPRESENTANTE */

const filtroRepresentante =
  document.getElementById(
    "filtroRepresentante"
  );

/* CLIENTE */

const filtroCliente =
  document.getElementById(
    "filtroCliente"
  );

/* TABELA */

const buscaTabela =
  document.getElementById(
    "buscaTabela"
  );

const tabelaBody =
  document.getElementById(
    "tabelaReclamacoesBody"
  );

/* =====================================================
   2. ESTADO INTERNO
   ===================================================== */

let filtrosGerados = false;

let assinaturaFiltros = "";

let dadosFiltradosAtuais = [];

let timerBuscaCliente = null;

let timerBuscaTabela = null;
let assinaturaFiltrosTabela = "";
const estadoTabela = { coluna: "rrc", direcao: "desc", pagina: 1, tamanho: 25 };

/* =====================================================
   3. FUNÇÃO PRINCIPAL

   O data.js chama esta função depois de carregar o CSV.
   ===================================================== */

window.atualizarDashboard =
  function atualizarDashboard() {

    const dados =
      Array.isArray(
        window.DADOS_RC
      )
        ? window.DADOS_RC
        : [];

    /* ===============================================
       GERA / ATUALIZA FILTROS
       =============================================== */

    sincronizarFiltrosDinamicos(
      dados
    );

    /* ===============================================
       LÊ FILTROS
       =============================================== */

    const filtros =
      lerFiltrosAtivos();

    /* ===============================================
       APLICA FILTROS
       =============================================== */

    const dadosFiltrados =
      aplicarFiltrosDashboard(
        dados,
        filtros
      );

    dadosFiltradosAtuais =
      dadosFiltrados;

    window.DADOS_RC_FILTRADOS =
      dadosFiltrados;

    /* ===============================================
       ATUALIZA DASHBOARD
       =============================================== */

    atualizarKPIs(
      dadosFiltrados
    );

    atualizarGraficos(
      dadosFiltrados,
      filtros
    );

    atualizarRankingErros(
      dadosFiltrados
    );

    sincronizarFiltrosTabela(dadosFiltrados);
    atualizarTabela(dadosFiltrados, true);

    atualizarTextoPeriodo();

    atualizarTextoSetor();

  };

/* =====================================================
   4. ASSINATURA DOS FILTROS

   Serve para detectar novos anos, setores,
   vendedores ou representantes após atualizar o CSV.
   ===================================================== */

function gerarAssinaturaFiltros(
  dados
) {

  const anos =
    typeof getAvailableYears ===
      "function"
      ? getAvailableYears(dados)
      : [];

  const setores =
    typeof getUniqueValues ===
      "function"
      ? getUniqueValues(
          dados,
          "setor"
        )
      : [];

  const vendedores =
    typeof getUniqueValues ===
      "function"
      ? getUniqueValues(
          dados,
          "vendedor"
        )
      : [];

  const representantes =
    typeof getUniqueValues ===
      "function"
      ? getUniqueValues(
          dados,
          "representante"
        )
      : [];

  return JSON.stringify({
    anos,
    setores,
    vendedores,
    representantes
  });

}

/* =====================================================
   5. SINCRONIZA FILTROS DINÂMICOS
   ===================================================== */

function sincronizarFiltrosDinamicos(
  dados
) {

  const novaAssinatura =
    gerarAssinaturaFiltros(
      dados
    );

  if (
    filtrosGerados &&
    novaAssinatura ===
      assinaturaFiltros
  ) {
    return;
  }

  const estadoAnterior =
    filtrosGerados
      ? capturarEstadoFiltros()
      : null;

  gerarFiltroPeriodo(
    dados,
    estadoAnterior
  );

  gerarFiltroSetores(
    dados,
    estadoAnterior
  );

  gerarFiltroSelect(
    filtroVendedor,
    dados,
    "vendedor",
    "Todos",
    estadoAnterior
      ? estadoAnterior.vendedor
      : ""
  );

  gerarFiltroSelect(
    filtroRepresentante,
    dados,
    "representante",
    "Todos",
    estadoAnterior
      ? estadoAnterior.representante
      : ""
  );

  filtrosGerados = true;

  assinaturaFiltros =
    novaAssinatura;

}

/* =====================================================
   6. CAPTURA ESTADO DOS FILTROS
   ===================================================== */

function capturarEstadoFiltros() {

  const anos =
    Array.from(
      document.querySelectorAll(
        ".filtro-ano-auto:checked"
      )
    ).map(function(cb) {
      return cb.value;
    });

  const meses =
    Array.from(
      document.querySelectorAll(
        ".filtro-mes-auto:checked"
      )
    ).map(function(cb) {
      return cb.value;
    });

  const setores =
    Array.from(
      document.querySelectorAll(
        ".filtro-setor-auto:checked"
      )
    ).map(function(cb) {
      return cb.value;
    });

  const todosAnos =
    document.getElementById(
      "todosAnos"
    );

  const todosMeses =
    document.getElementById(
      "todosMeses"
    );

  const todosSetores =
    document.getElementById(
      "todosSetores"
    );

  return {

    anos:
      anos,

    meses:
      meses,

    setores:
      setores,

    todosAnos:
      todosAnos
        ? todosAnos.checked
        : true,

    todosMeses:
      todosMeses
        ? todosMeses.checked
        : true,

    todosSetores:
      todosSetores
        ? todosSetores.checked
        : true,

    vendedor:
      filtroVendedor
        ? filtroVendedor.value
        : "",

    representante:
      filtroRepresentante
        ? filtroRepresentante.value
        : ""

  };

}

/* =====================================================
   7. CRIA UMA LINHA DE CHECKBOX
   ===================================================== */

function criarCheckbox(
  container,
  {
    id = "",
    classe = "",
    valor = "",
    texto = "",
    checked = true,
    destaque = false
  }
) {

  const label =
    document.createElement(
      "label"
    );

  label.className =
    destaque
      ? "filter-checkbox filter-checkbox-all"
      : "filter-checkbox";

  const input =
    document.createElement(
      "input"
    );

  input.type =
    "checkbox";

  if (id) {
    input.id = id;
  }

  if (classe) {
    input.className =
      classe;
  }

  input.value =
    valor;

  input.checked =
    checked;

  const span =
    document.createElement(
      "span"
    );

  span.textContent =
    texto;

  label.appendChild(
    input
  );

  label.appendChild(
    span
  );

  container.appendChild(
    label
  );

  return input;

}

/* =====================================================
   8. FILTRO DE PERÍODO
   ===================================================== */

function gerarFiltroPeriodo(
  dados,
  estadoAnterior
) {

  if (!periodMenu) {
    return;
  }

  periodMenu.innerHTML =
    "";

  const anos =
    typeof getAvailableYears ===
      "function"
      ? getAvailableYears(
          dados
        )
      : [];

  /* ===============================================
     ANOS
     =============================================== */

  const blocoAnos =
    document.createElement(
      "div"
    );

  blocoAnos.className =
    "filter-menu-section";

  const tituloAnos =
    document.createElement(
      "div"
    );

  tituloAnos.className =
    "filter-menu-title";

  tituloAnos.textContent =
    "Anos";

  blocoAnos.appendChild(
    tituloAnos
  );

  const marcarTodosAnos =
    !estadoAnterior ||
    estadoAnterior.todosAnos;

  const todosAnos =
    criarCheckbox(
      blocoAnos,
      {
        id:
          "todosAnos",

        texto:
          "Todos os anos",

        checked:
          marcarTodosAnos,

        destaque:
          true
      }
    );

  anos.forEach(function(ano) {

    let checked = true;

    if (estadoAnterior) {

      checked =
        estadoAnterior.todosAnos ||
        estadoAnterior.anos.includes(
          String(ano)
        );

    }

    const input =
      criarCheckbox(
        blocoAnos,
        {
          classe:
            "filtro-ano-auto",

          valor:
            String(ano),

          texto:
            String(ano),

          checked:
            checked
        }
      );

    input.addEventListener(
      "change",
      function() {

        sincronizarCheckboxTodos(
          ".filtro-ano-auto",
          todosAnos
        );

        atualizarDashboard();

      }
    );

  });

  todosAnos.addEventListener(
    "change",
    function() {

      marcarCheckboxes(
        ".filtro-ano-auto",
        todosAnos.checked
      );

      atualizarDashboard();

    }
  );

  periodMenu.appendChild(
    blocoAnos
  );

  /* ===============================================
     MESES
     =============================================== */

  const blocoMeses =
    document.createElement(
      "div"
    );

  blocoMeses.className =
    "filter-menu-section";

  const tituloMeses =
    document.createElement(
      "div"
    );

  tituloMeses.className =
    "filter-menu-title";

  tituloMeses.textContent =
    "Meses";

  blocoMeses.appendChild(
    tituloMeses
  );

  const marcarTodosMeses =
    !estadoAnterior ||
    estadoAnterior.todosMeses;

  const todosMeses =
    criarCheckbox(
      blocoMeses,
      {
        id:
          "todosMeses",

        texto:
          "Todos os meses",

        checked:
          marcarTodosMeses,

        destaque:
          true
      }
    );

  const meses = window.MESES_ORDEM;

  meses.forEach(
    function(nome, index) {

      const numeroMes =
        String(index + 1);

      let checked = true;

      if (estadoAnterior) {

        checked =
          estadoAnterior.todosMeses ||
          estadoAnterior.meses.includes(
            numeroMes
          );

      }

      const input =
        criarCheckbox(
          blocoMeses,
          {
            classe:
              "filtro-mes-auto",

            valor:
              numeroMes,

            texto:
              nome,

            checked:
              checked
          }
        );

      input.addEventListener(
        "change",
        function() {

          sincronizarCheckboxTodos(
            ".filtro-mes-auto",
            todosMeses
          );

          atualizarDashboard();

        }
      );

    }
  );

  todosMeses.addEventListener(
    "change",
    function() {

      marcarCheckboxes(
        ".filtro-mes-auto",
        todosMeses.checked
      );

      atualizarDashboard();

    }
  );

  periodMenu.appendChild(
    blocoMeses
  );

}

/* =====================================================
   9. FILTRO DE SETORES
   ===================================================== */

function gerarFiltroSetores(
  dados,
  estadoAnterior
) {

  if (!setorMenu) {
    return;
  }

  setorMenu.innerHTML =
    "";

  const setores =
    typeof getUniqueValues ===
      "function"
      ? getUniqueValues(
          dados,
          "setor"
        )
      : [];

  const marcarTodos =
    !estadoAnterior ||
    estadoAnterior.todosSetores;

  const todosSetores =
    criarCheckbox(
      setorMenu,
      {
        id:
          "todosSetores",

        texto:
          "Todos os setores",

        checked:
          marcarTodos,

        destaque:
          true
      }
    );

  setores.forEach(
    function(setor) {

      let checked = true;

      if (estadoAnterior) {

        checked =
          estadoAnterior.todosSetores ||
          estadoAnterior.setores.some(valor => normalizeText(valor) === normalizeText(setor));

      }

      const input =
        criarCheckbox(
          setorMenu,
          {
            classe:
              "filtro-setor-auto",

            valor:
              setor,

            texto:
              setor,

            checked:
              checked
          }
        );

      input.addEventListener(
        "change",
        function() {

          sincronizarCheckboxTodos(
            ".filtro-setor-auto",
            todosSetores
          );

          atualizarTextoSetor();

          atualizarDashboard();

        }
      );

    }
  );

  todosSetores.addEventListener(
    "change",
    function() {

      marcarCheckboxes(
        ".filtro-setor-auto",
        todosSetores.checked
      );

      atualizarTextoSetor();

      atualizarDashboard();

    }
  );

}

/* =====================================================
   10. FILTROS SELECT
   ===================================================== */

function gerarFiltroSelect(
  select,
  dados,
  key,
  textoTodos,
  valorAnterior = ""
) {

  if (!select) {
    return;
  }

  const valores =
    typeof getUniqueValues ===
      "function"
      ? getUniqueValues(
          dados,
          key
        )
      : [];

  select.innerHTML =
    "";

  const opcaoTodos =
    document.createElement(
      "option"
    );

  opcaoTodos.value =
    "";

  opcaoTodos.textContent =
    textoTodos;

  select.appendChild(
    opcaoTodos
  );

  valores.forEach(
    function(valor) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        valor;

      option.textContent =
        valor;

      select.appendChild(
        option
      );

    }
  );

  select.value = valores.find(valor => normalizeText(valor) === normalizeText(valorAnterior)) || "";

}

/* =====================================================
   11. MARCA / DESMARCA CHECKBOXES
   ===================================================== */

function marcarCheckboxes(
  seletor,
  checked
) {

  document
    .querySelectorAll(
      seletor
    )
    .forEach(
      function(cb) {

        cb.checked =
          checked;

      }
    );

}

/* =====================================================
   12. SINCRONIZA "TODOS"
   ===================================================== */

function sincronizarCheckboxTodos(
  seletor,
  checkboxTodos
) {

  if (!checkboxTodos) {
    return;
  }

  const checkboxes =
    Array.from(
      document.querySelectorAll(
        seletor
      )
    );

  if (
    checkboxes.length === 0
  ) {

    checkboxTodos.checked =
      false;

    return;

  }

  checkboxTodos.checked =
    checkboxes.every(
      function(cb) {
        return cb.checked;
      }
    );

}

/* =====================================================
   13. LÊ FILTROS ATIVOS
   ===================================================== */

function lerFiltrosAtivos() {
  return {
    ...capturarEstadoFiltros(),
    cliente: filtroCliente ? filtroCliente.value.trim() : ""
  };
}

/* =====================================================
   14. APLICA FILTROS

   Diferente do utils.js:
   aqui "nenhum checkbox marcado" significa SEM DADOS.
   ===================================================== */

function aplicarFiltrosDashboard(dados, filtros) {
  if (!Array.isArray(dados)) return [];
  const grupos = [
    [".filtro-ano-auto", "anos", "todosAnos"],
    [".filtro-mes-auto", "meses", "todosMeses"],
    [".filtro-setor-auto", "setores", "todosSetores"]
  ];
  if (grupos.some(([seletor, chave, todos]) =>
    !filtros[todos] && document.querySelectorAll(seletor).length > 0 && !filtros[chave].length
  )) return [];
  // Todos inclui também registros sem data/setor, evitando totais incompletos.
  return filtrarDados(dados, {
    ...filtros,
    anos: filtros.todosAnos ? [] : filtros.anos,
    meses: filtros.todosMeses ? [] : filtros.meses,
    setores: filtros.todosSetores ? [] : filtros.setores
  });
}

/* =====================================================
   15. ATUALIZA UM ELEMENTO
   ===================================================== */

function setTexto(
  id,
  valor
) {

  const elemento =
    document.getElementById(
      id
    );

  if (elemento) {

    elemento.textContent =
      valor;

  }

}

/* =====================================================
   16. KPIs
   ===================================================== */

function atualizarKPIs(
  dados
) {

  const resumo =
    typeof calcularResumoDashboard ===
      "function"
      ? calcularResumoDashboard(
          dados
        )
      : null;

  if (!resumo) {

    limparKPIs();

    return;

  }

  /* ===============================================
     VISÃO GERAL
     =============================================== */

  setTexto(
    "totalQtd",
    resumo.totalReclamacoes
  );

  setTexto(
    "clientesAtingidos",
    resumo.clientesAfetados
  );

  setTexto(
    "topErroQtd",
    resumo.erroTop.qtd > 0
      ? resumo.erroTop.nome +
        " (" +
        resumo.erroTop.qtd +
        ")"
      : "-"
  );

  setTexto(
    "setorTop",
    resumo.setorTop.qtd > 0
      ? resumo.setorTop.nome +
        " (" +
        resumo.setorTop.qtd +
        ")"
      : "-"
  );

  /* ===============================================
     SETORES
     =============================================== */

  setTexto(
    "totalSetores",
    resumo.totalSetores
  );

  setTexto(
    "setorTopCard",
    resumo.setorTop.qtd > 0
      ? resumo.setorTop.nome
      : "-"
  );

  setTexto(
    "setorParticipacao",
    typeof formatPercent ===
      "function"
      ? formatPercent(
          resumo.participacaoSetorTop,
          1
        )
      : resumo.participacaoSetorTop
          .toFixed(1) + "%"
  );

  /* ===============================================
     CLIENTES
     =============================================== */

  setTexto(
    "topClienteNome",
    resumo.clienteTop.qtd > 0
      ? resumo.clienteTop.nome
      : "-"
  );

  setTexto(
    "topClienteQtd",
    resumo.clienteTop.qtd
  );

  setTexto(
    "totalClientes",
    resumo.totalClientes
  );

  /* ===============================================
     EVOLUÇÃO
     =============================================== */

  setTexto(
    "totalPeriodo",
    resumo.totalReclamacoes
  );

  setTexto(
    "mediaMensal",
    typeof formatNumber ===
      "function"
      ? formatNumber(
          resumo.mediaMensal,
          1
        )
      : resumo.mediaMensal
          .toFixed(1)
  );

  const variacao = resumo.variacaoMensal;

  let textoVariacao;

  if (variacao === null) {
    textoVariacao = "Sem base";
  } else if (variacao > 0) {

    textoVariacao =
      "+" +
      variacao.toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits: 1
        }
      ) +
      "%";

  } else {

    textoVariacao =
      variacao.toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits: 1
        }
      ) +
      "%";

  }

  setTexto(
    "variacaoMensal",
    textoVariacao
  );

}
/* =====================================================
   17. LIMPA KPIs
   ===================================================== */

function limparKPIs() {

  setTexto(
    "totalQtd",
    0
  );

  setTexto(
    "clientesAtingidos",
    0
  );

  setTexto(
    "topErroQtd",
    "-"
  );

  setTexto(
    "setorTop",
    "-"
  );

  setTexto(
    "totalSetores",
    0
  );

  setTexto(
    "setorTopCard",
    "-"
  );

  setTexto(
    "setorParticipacao",
    "0%"
  );

  setTexto(
    "topClienteNome",
    "-"
  );

  setTexto(
    "topClienteQtd",
    0
  );

  setTexto(
    "totalClientes",
    0
  );

  setTexto(
    "totalPeriodo",
    0
  );

  setTexto(
    "mediaMensal",
    0
  );

  setTexto(
    "variacaoMensal",
    "0%"
  );

}

/* =====================================================
   18. GRÁFICOS
   ===================================================== */

function atualizarGraficos(
  dados,
  filtros
) {

  if (
    typeof renderChartSetores ===
    "function"
  ) {

    renderChartSetores(
      dados
    );

  }

  if (
    typeof renderChartClientes ===
    "function"
  ) {

    renderChartClientes(
      dados,
      10
    );

  }

  if (
    typeof renderChartEvolucao ===
    "function"
  ) {

    const serie =
      gerarSerieEvolucao(
        dados,
        filtros
      );

    renderChartEvolucao(
      dados,
      serie.labels,
      serie.valores
    );

  }

}

/* =====================================================
   19. SÉRIE CRONOLÓGICA DA EVOLUÇÃO

   Se vários anos forem selecionados:
   Jan/2025, Fev/2025 ... Jan/2026 etc.
   ===================================================== */

function gerarSerieEvolucao(
  dados,
  filtros
) {

  const mesesAbreviados = MESES_ABREVIADOS;

  const anos =
    filtros.anos
      .map(Number)
      .filter(
        function(ano) {
          return Number.isFinite(
            ano
          );
        }
      )
      .sort(
        function(a, b) {
          return a - b;
        }
      );

  const meses =
    filtros.meses
      .map(Number)
      .filter(
        function(mes) {
          return (
            mes >= 1 &&
            mes <= 12
          );
        }
      )
      .sort(
        function(a, b) {
          return a - b;
        }
      );

  const contagem = {};

  dados.forEach(
    function(item) {

      if (
        !item.ano ||
        !item.mesNum
      ) {
        return;
      }

      const chave =
        item.ano +
        "-" +
        String(
          item.mesNum
        ).padStart(
          2,
          "0"
        );

      contagem[chave] =
        (contagem[chave] || 0) + 1;

    }
  );

  const labels = [];

  const valores = [];

  anos.forEach(
    function(ano) {

      meses.forEach(
        function(mes) {

          const chave =
            ano +
            "-" +
            String(mes)
              .padStart(
                2,
                "0"
              );

          let label;

          if (
            anos.length === 1
          ) {

            label =
              mesesAbreviados[
                mes - 1
              ];

          } else {

            label =
              mesesAbreviados[
                mes - 1
              ] +
              "/" +
              ano;

          }

          labels.push(
            label
          );

          valores.push(
            contagem[chave] || 0
          );

        }
      );

    }
  );

  return {
    labels,
    valores
  };

}

/* =====================================================
   20. TOP 5 ERROS
   ===================================================== */

function atualizarRankingErros(
  dados
) {

  const container =
    document.getElementById(
      "rankingErros"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    "";

  if (
    !Array.isArray(dados) ||
    dados.length === 0
  ) {

    const vazio =
      document.createElement(
        "p"
      );

    vazio.className =
      "ranking-empty";

    vazio.textContent =
      "Sem dados para os filtros selecionados.";

    container.appendChild(
      vazio
    );

    return;

  }

  const ranking =
    typeof getRanking ===
      "function"
      ? getRanking(
          dados,
          "erro",
          5
        )
      : [];

  if (
    ranking.length === 0
  ) {

    const vazio =
      document.createElement(
        "p"
      );

    vazio.className =
      "ranking-empty";

    vazio.textContent =
      "Nenhum erro informado.";

    container.appendChild(
      vazio
    );

    return;

  }

  const total =
    dados.length;

  ranking.forEach(
    function(item) {

      const percentual =
        total > 0
          ? (
              item.qtd /
              total
            ) * 100
          : 0;

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "ranking-item";

      /* POSIÇÃO */

      const posicao =
        document.createElement(
          "div"
        );

      posicao.className =
        "ranking-pos";

      posicao.textContent =
        item.posicao + "º";

      /* INFORMAÇÕES */

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "ranking-info";

      const nome =
        document.createElement(
          "div"
        );

      nome.className =
        "ranking-nome";

      nome.textContent =
        item.nome;

      const barra =
        document.createElement(
          "div"
        );

      barra.className =
        "ranking-bar";

      const preenchimento =
        document.createElement(
          "div"
        );

      preenchimento.className =
        "ranking-fill";

      preenchimento.style.width =
        Math.min(
          percentual,
          100
        ) + "%";

      barra.appendChild(
        preenchimento
      );

      info.appendChild(
        nome
      );

      info.appendChild(
        barra
      );

      /* QUANTIDADE */

      const quantidade =
        document.createElement(
          "div"
        );

      quantidade.className =
        "ranking-qtd";

      const numero =
        document.createElement(
          "strong"
        );

      numero.textContent =
        item.qtd;

      const percentualSpan =
        document.createElement(
          "span"
        );

      percentualSpan.textContent =
        percentual.toLocaleString(
          "pt-BR",
          {
            minimumFractionDigits:
              1,

            maximumFractionDigits:
              1
          }
        ) + "%";

      quantidade.appendChild(
        numero
      );

      quantidade.appendChild(
        percentualSpan
      );

      /* MONTA */

      div.appendChild(
        posicao
      );

      div.appendChild(
        info
      );

      div.appendChild(
        quantidade
      );

      container.appendChild(
        div
      );

    }
  );

}

/* =====================================================
   21. TABELA DE ÚLTIMAS RECLAMAÇÕES
   ===================================================== */

function atualizarTabela(dados, resetarPagina = false) {
  if (!tabelaBody) return;
  if (resetarPagina) estadoTabela.pagina = 1;
  const inicio = document.getElementById("tabelaDataInicio").value;
  const fim = document.getElementById("tabelaDataFim").value;
  const intervaloInvalido = Boolean(inicio && fim && inicio > fim);
  const aviso = document.getElementById("tabelaFiltroAviso");
  aviso.hidden = !intervaloInvalido;
  aviso.textContent = intervaloInvalido ? "A data inicial deve ser anterior ou igual à data final." : "";

  const filtrados = intervaloInvalido ? [] : filtrarTabelaReclamacoes(dados, {
    termo: buscaTabela?.value || "",
    setor: document.getElementById("tabelaFiltroSetor").value,
    erro: document.getElementById("tabelaFiltroErro").value,
    inicio, fim
  });
  const resultado = ordenarReclamacoes(filtrados, estadoTabela.coluna, estadoTabela.direcao);
  const paginas = Math.max(1, Math.ceil(resultado.length / estadoTabela.tamanho));
  estadoTabela.pagina = Math.min(estadoTabela.pagina, paginas);
  const primeiro = (estadoTabela.pagina - 1) * estadoTabela.tamanho;
  const visiveis = resultado.slice(primeiro, primeiro + estadoTabela.tamanho);
  tabelaBody.replaceChildren();
  const fragmento = document.createDocumentFragment();

  if (!visiveis.length) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    adicionarCelula(tr, intervaloInvalido
      ? "Ajuste o intervalo de datas para consultar as reclamações."
      : "Nenhuma reclamação encontrada para os filtros selecionados.");
    tr.firstElementChild.colSpan = 8;
    fragmento.appendChild(tr);
  }
  visiveis.forEach(function(item) {
    const tr = document.createElement("tr");
    adicionarCelula(tr, item.rrc || "-");
    adicionarCelula(tr, formatDateBR(getDataReclamacao(item)));
    adicionarCelula(tr, item.cliente || "-", 45);
    adicionarCelula(tr, item.produto || "-", 65);
    adicionarCelula(tr, item.setor || "-", 35);
    adicionarCelula(tr, item.erro || "-", 65);
    adicionarCelula(tr, getResponsavelComercial(item), 40);
    adicionarCelula(tr, item.nf || "-");
    fragmento.appendChild(tr);
  });
  tabelaBody.appendChild(fragmento);

  const total = resultado.length;
  document.getElementById("tabelaResumo").textContent =
    (total ? (primeiro + 1) + "–" + (primeiro + visiveis.length) : "0") +
    " de " + formatNumber(total) + " reclamações · " +
    formatNumber(Array.isArray(dados) ? dados.length : 0) + " no dashboard";
  document.getElementById("tabelaPagina").textContent =
    "Página " + estadoTabela.pagina + " de " + paginas;
  document.getElementById("tabelaAnterior").disabled = estadoTabela.pagina <= 1;
  document.getElementById("tabelaProxima").disabled = estadoTabela.pagina >= paginas;
  atualizarCabecalhosTabela();
}

/* =====================================================
   22. CRIA CÉLULA DA TABELA
   ===================================================== */

function adicionarCelula(
  tr,
  valor,
  limite = 0
) {

  const td =
    document.createElement(
      "td"
    );

  const texto =
    String(
      valor === null ||
      valor === undefined
        ? ""
        : valor
    );

  if (
    limite > 0 &&
    texto.length > limite
  ) {

    td.textContent =
      texto.substring(
        0,
        limite
      ) + "…";

    td.title =
      texto;

  } else {

    td.textContent =
      texto;

  }

  tr.appendChild(
    td
  );

}

/* =====================================================
   23. TEXTO DO FILTRO DE PERÍODO
   ===================================================== */

function atualizarTextoPeriodo() {

  if (!periodSelectedText) {
    return;
  }

  const filtros =
    lerFiltrosAtivos();

  const totalAnos =
    document.querySelectorAll(
      ".filtro-ano-auto"
    ).length;

  const totalMeses =
    document.querySelectorAll(
      ".filtro-mes-auto"
    ).length;

  /* ===============================================
     ANOS
     =============================================== */

  let textoAno;

  if (
    filtros.anos.length === 0
  ) {

    textoAno =
      "Nenhum ano";

  } else if (
    filtros.anos.length ===
    totalAnos
  ) {

    textoAno =
      "Todos os anos";

  } else if (
    filtros.anos.length <= 2
  ) {

    textoAno =
      filtros.anos.join(
        ", "
      );

  } else {

    textoAno =
      filtros.anos.length +
      " anos";

  }

  /* ===============================================
     MESES
     =============================================== */

  const meses = window.MESES_ORDEM;

  let textoMes;

  if (
    filtros.meses.length === 0
  ) {

    textoMes =
      "Nenhum mês";

  } else if (
    filtros.meses.length ===
    totalMeses
  ) {

    textoMes =
      "Todos os meses";

  } else if (
    filtros.meses.length === 1
  ) {

    textoMes =
      meses[
        Number(
          filtros.meses[0]
        ) - 1
      ];

  } else if (
    filtros.meses.length <= 3
  ) {

    textoMes =
      filtros.meses
        .map(
          function(mes) {

            return meses[
              Number(mes) - 1
            ];

          }
        )
        .join(
          ", "
        );

  } else {

    textoMes =
      filtros.meses.length +
      " meses";

  }

  if (
    filtros.anos.length ===
      totalAnos &&
    filtros.meses.length ===
      totalMeses
  ) {

    periodSelectedText.textContent =
      "Todos os períodos";

  } else {

    periodSelectedText.textContent =
      textoAno +
      " • " +
      textoMes;

  }

}

/* =====================================================
   24. TEXTO DO FILTRO DE SETOR
   ===================================================== */

function atualizarTextoSetor() {

  if (!setorSelectedText) {
    return;
  }

  const setores =
    Array.from(
      document.querySelectorAll(
        ".filtro-setor-auto:checked"
      )
    ).map(
      function(cb) {
        return cb.value;
      }
    );

  const totalSetores =
    document.querySelectorAll(
      ".filtro-setor-auto"
    ).length;

  let texto;

  if (
    setores.length === 0
  ) {

    texto =
      "Nenhum setor";

  } else if (
    setores.length ===
    totalSetores
  ) {

    texto =
      "Todos os setores";

  } else if (
    setores.length <= 2
  ) {

    texto =
      setores.join(
        ", "
      );

  } else {

    texto =
      setores.length +
      " setores";

  }

  setorSelectedText.textContent =
    texto;

}

/* =====================================================
   25. RESET DOS FILTROS
   ===================================================== */

function resetarFiltros() {
  clearTimeout(timerBuscaCliente);
  limparFiltrosTabela(false);

  /* ANOS */

  marcarCheckboxes(
    ".filtro-ano-auto",
    true
  );

  const todosAnos =
    document.getElementById(
      "todosAnos"
    );

  if (todosAnos) {
    todosAnos.checked =
      true;
  }

  /* MESES */

  marcarCheckboxes(
    ".filtro-mes-auto",
    true
  );

  const todosMeses =
    document.getElementById(
      "todosMeses"
    );

  if (todosMeses) {
    todosMeses.checked =
      true;
  }

  /* SETORES */

  marcarCheckboxes(
    ".filtro-setor-auto",
    true
  );

  const todosSetores =
    document.getElementById(
      "todosSetores"
    );

  if (todosSetores) {
    todosSetores.checked =
      true;
  }

  /* VENDEDOR */

  if (filtroVendedor) {

    filtroVendedor.value =
      "";

  }

  /* REPRESENTANTE */

  if (filtroRepresentante) {

    filtroRepresentante.value =
      "";

  }

  /* CLIENTE */

  if (filtroCliente) {

    filtroCliente.value =
      "";

  }

  /* BUSCA TABELA */

  if (buscaTabela) {

    buscaTabela.value =
      "";

  }

  atualizarTextoPeriodo();

  atualizarTextoSetor();

  atualizarDashboard();

}

/* =====================================================
   26. ABRIR / FECHAR DROPDOWN
   ===================================================== */

function abrirFecharDropdown(
  dropdown,
  menu,
  botao
) {

  if (
    !dropdown ||
    !menu
  ) {
    return;
  }

  const aberto =
    dropdown.classList.contains(
      "open"
    );

  fecharDropdowns();

  if (!aberto) {

    dropdown.classList.add(
      "open"
    );

    menu.style.display =
      "block";

    if (botao) {

      botao.setAttribute(
        "aria-expanded",
        "true"
      );

    }

  }

}

/* =====================================================
   27. FECHAR DROPDOWNS
   ===================================================== */

function fecharDropdowns() {

  if (
    periodDropdown &&
    periodMenu
  ) {

    periodDropdown.classList.remove(
      "open"
    );

    periodMenu.style.display =
      "none";

    if (periodSelected) {

      periodSelected.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  }

  if (
    setorDropdown &&
    setorMenu
  ) {

    setorDropdown.classList.remove(
      "open"
    );

    setorMenu.style.display =
      "none";

    if (setorSelected) {

      setorSelected.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  }

}

/* =====================================================
   28. EVENTOS GERAIS
   ===================================================== */

function configurarEventosDashboard() {

  /* ===============================================
     PERÍODO
     =============================================== */

  if (
    periodSelected &&
    periodDropdown &&
    periodMenu
  ) {

    periodSelected.addEventListener(
      "click",
      function(event) {

        event.stopPropagation();

        abrirFecharDropdown(
          periodDropdown,
          periodMenu,
          periodSelected
        );

      }
    );

    periodMenu.addEventListener(
      "click",
      function(event) {

        event.stopPropagation();

      }
    );

  }

  /* ===============================================
     SETOR
     =============================================== */

  if (
    setorSelected &&
    setorDropdown &&
    setorMenu
  ) {

    setorSelected.addEventListener(
      "click",
      function(event) {

        event.stopPropagation();

        abrirFecharDropdown(
          setorDropdown,
          setorMenu,
          setorSelected
        );

      }
    );

    setorMenu.addEventListener(
      "click",
      function(event) {

        event.stopPropagation();

      }
    );

  }

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") fecharDropdowns();
  });

  /* ===============================================
     FECHA AO CLICAR FORA
     =============================================== */

  document.addEventListener(
    "click",
    function() {

      fecharDropdowns();

    }
  );

  /* ===============================================
     VENDEDOR
     =============================================== */

  if (filtroVendedor) {

    filtroVendedor.addEventListener(
      "change",
      function() {

        atualizarDashboard();

      }
    );

  }

  /* ===============================================
     REPRESENTANTE
     =============================================== */

  if (filtroRepresentante) {

    filtroRepresentante.addEventListener(
      "change",
      function() {

        atualizarDashboard();

      }
    );

  }

  /* ===============================================
     CLIENTE

     Pequeno debounce para não atualizar a cada
     milissegundo enquanto a pessoa digita.
     =============================================== */

  if (filtroCliente) {

    filtroCliente.addEventListener(
      "input",
      function() {

        clearTimeout(
          timerBuscaCliente
        );

        timerBuscaCliente =
          setTimeout(
            function() {

              atualizarDashboard();

            },
            250
          );

      }
    );

  }

  /* ===============================================
     BUSCA DA TABELA
     =============================================== */

  if (buscaTabela) {

    buscaTabela.addEventListener(
      "input",
      function() {

        clearTimeout(
          timerBuscaTabela
        );

        timerBuscaTabela =
          setTimeout(
            function() {

              atualizarTabela(dadosFiltradosAtuais, true);

            },
            180
          );

      }
    );

  }

  /* ===============================================
     RESET
     =============================================== */

  if (btnReset) {

    btnReset.addEventListener(
      "click",
      function() {

        resetarFiltros();

      }
    );

  }

}

/* =====================================================
   29. INICIALIZAÇÃO
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    configurarEventosDashboard();
    configurarEventosTabela();

    fecharDropdowns();

    /*
      Normalmente o data.js chama atualizarDashboard()
      depois que o CSV termina de carregar.

      Este trecho serve apenas caso os dados já estejam
      disponíveis antes deste script inicializar.
    */

    if (
      Array.isArray(
        window.DADOS_RC
      ) &&
      window.DADOS_RC.length > 0
    ) {

      atualizarDashboard();

    }

  }
);

/* Filtros locais não alteram os KPIs nem os gráficos. */
function sincronizarFiltrosTabela(dados) {
  const assinatura = JSON.stringify([
    getUniqueValues(dados, "setor"), getUniqueValues(dados, "erro")
  ]);
  if (assinatura === assinaturaFiltrosTabela) return;
  [
    ["tabelaFiltroSetor", "setor", "Todos os setores"],
    ["tabelaFiltroErro", "erro", "Todos os erros"]
  ].forEach(function([id, chave, rotulo]) {
    const select = document.getElementById(id);
    gerarFiltroSelect(select, dados, chave, rotulo, select.value);
  });
  assinaturaFiltrosTabela = assinatura;
}

function atualizarCabecalhosTabela() {
  document.querySelectorAll(".table-sort").forEach(function(botao) {
    const ativo = botao.dataset.sort === estadoTabela.coluna;
    const crescente = estadoTabela.direcao === "asc";
    botao.closest("th").setAttribute("aria-sort",
      ativo ? (crescente ? "ascending" : "descending") : "none");
    botao.querySelector(".sort-arrow").textContent = ativo ? (crescente ? "↑" : "↓") : "↕";
    const nome = botao.firstChild.textContent.trim();
    botao.setAttribute("aria-label", "Ordenar por " + nome +
      (ativo && crescente ? " em ordem decrescente" : " em ordem crescente"));
  });
}

function limparFiltrosTabela(atualizar = true) {
  clearTimeout(timerBuscaTabela);
  ["buscaTabela", "tabelaFiltroSetor", "tabelaFiltroErro", "tabelaDataInicio", "tabelaDataFim"]
    .forEach(id => { document.getElementById(id).value = ""; });
  estadoTabela.pagina = 1;
  if (atualizar) atualizarTabela(dadosFiltradosAtuais, true);
}

function configurarEventosTabela() {
  document.querySelectorAll(".table-sort").forEach(function(botao) {
    botao.addEventListener("click", function() {
      const coluna = botao.dataset.sort;
      estadoTabela.direcao = estadoTabela.coluna === coluna && estadoTabela.direcao === "asc"
        ? "desc" : "asc";
      estadoTabela.coluna = coluna;
      atualizarTabela(dadosFiltradosAtuais, true);
    });
  });
  ["tabelaFiltroSetor", "tabelaFiltroErro", "tabelaDataInicio", "tabelaDataFim"]
    .forEach(id => document.getElementById(id).addEventListener("change",
      () => atualizarTabela(dadosFiltradosAtuais, true)));
  document.getElementById("btnLimparTabela").addEventListener("click", () => limparFiltrosTabela());
  document.getElementById("tabelaPorPagina").addEventListener("change", function(event) {
    estadoTabela.tamanho = Number(event.target.value);
    atualizarTabela(dadosFiltradosAtuais, true);
  });
  document.getElementById("tabelaAnterior").addEventListener("click", function() {
    estadoTabela.pagina = Math.max(1, estadoTabela.pagina - 1);
    atualizarTabela(dadosFiltradosAtuais);
  });
  document.getElementById("tabelaProxima").addEventListener("click", function() {
    estadoTabela.pagina++;
    atualizarTabela(dadosFiltradosAtuais);
  });
  atualizarCabecalhosTabela();
}
