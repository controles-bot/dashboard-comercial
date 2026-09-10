/* =====================================================
   FUNÇÕES UTILITÁRIAS
   Arquivo: js/utils.js

   Dashboard RRC - Isopack
   ===================================================== */

console.log("utils.js carregado");


/* =====================================================
   1. FORMATAÇÃO
   ===================================================== */

function formatNumber(value, decimals = 0) {
  const numero = Number(value) || 0;

  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }
  ).format(numero);
}


function formatPercent(value, decimals = 0) {
  const numero = Number(value) || 0;

  return (
    new Intl.NumberFormat(
      "pt-BR",
      {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }
    ).format(numero) + "%"
  );
}


function formatDateBR(value) {
  if (!value) {
    return "-";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "-";
    }

    return value.toLocaleDateString("pt-BR");
  }

  const texto = String(value).trim();

  if (!texto) {
    return "-";
  }

  if (texto.includes("/")) {
    return texto.split(" ")[0];
  }

  if (texto.includes("-")) {
    const dataParte = texto.split("T")[0];
    const partes = dataParte.split("-");

    if (partes.length === 3) {
      return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
      );
    }
  }

  return texto;
}


/* =====================================================
   2. TEXTO / NORMALIZAÇÃO
   ===================================================== */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  );
}


/* =====================================================
   3. CONTAGENS BÁSICAS
   ===================================================== */

function countUnique(arr, key) {
  if (
    !Array.isArray(arr) ||
    arr.length === 0
  ) {
    return 0;
  }

  const unicos = new Set();

  arr.forEach(function(item) {
    const valor = item ? item[key] : "";

    if (!isEmpty(valor)) {
      unicos.add(
        normalizeText(valor)
      );
    }
  });

  return unicos.size;
}


function countBy(arr, key) {
  const contagem = {};

  if (!Array.isArray(arr)) {
    return contagem;
  }

  arr.forEach(function(item) {
    if (!item) {
      return;
    }

    const valor = String(
      item[key] || ""
    ).trim();

    if (!valor) {
      return;
    }

    contagem[valor] =
      (contagem[valor] || 0) + 1;
  });

  return contagem;
}


/* =====================================================
   4. ORDENAÇÃO / RANKINGS
   ===================================================== */

function sortCountEntries(countObject) {
  return Object.entries(
    countObject || {}
  ).sort(function(a, b) {

    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return String(a[0]).localeCompare(
      String(b[0]),
      "pt-BR"
    );
  });
}


function getTopEntry(arr, key) {
  const contagem =
    countBy(arr, key);

  const ranking =
    sortCountEntries(contagem);

  if (ranking.length === 0) {
    return {
      nome: "-",
      qtd: 0
    };
  }

  return {
    nome: ranking[0][0],
    qtd: ranking[0][1]
  };
}


function getTopFrequent(arr, key) {
  const top =
    getTopEntry(arr, key);

  if (
    top.nome === "-" ||
    top.qtd === 0
  ) {
    return "-";
  }

  return (
    top.nome +
    " (" +
    top.qtd +
    ")"
  );
}


function getRanking(arr, key, limit = 5) {
  const contagem =
    countBy(arr, key);

  return sortCountEntries(
    contagem
  )
    .slice(0, limit)
    .map(function(item, index) {
      return {
        posicao: index + 1,
        nome: item[0],
        qtd: item[1]
      };
    });
}


/* =====================================================
   5. RESPONSÁVEL COMERCIAL
   ===================================================== */

function getResponsavelComercial(item) {
  if (!item) {
    return "";
  }

  const vendedor =
    String(
      item.vendedor || ""
    ).trim();

  const representante =
    String(
      item.representante || ""
    ).trim();

  if (vendedor) {
    return vendedor;
  }

  if (representante) {
    return representante;
  }

  return "Não informado";
}


function prepararResponsaveis(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(function(item) {
    return {
      ...item,
      responsavelComercial:
        item.responsavelComercial ||
        getResponsavelComercial(item)
    };
  });
}


/* =====================================================
   6. FILTRO PRINCIPAL
   ===================================================== */

function filtrarDados(
  data,
  {
    anos = [],
    meses = [],
    setores = [],
    vendedor = "",
    representante = "",
    cliente = ""
  } = {}
) {
  if (!Array.isArray(data)) {
    return [];
  }

  const anosNormalizados =
    anos.map(String);

  const mesesNormalizados =
    meses.map(String);

  const setoresNormalizados =
    setores.map(function(setor) {
      return normalizeText(setor);
    });

  const vendedorNormalizado =
    normalizeText(vendedor);

  const representanteNormalizado =
    normalizeText(representante);

  const clienteNormalizado =
    normalizeText(cliente);


  return data.filter(function(item) {

    const matchAno =
      anosNormalizados.length === 0 ||
      anosNormalizados.includes(
        String(item.ano)
      );


    const matchMes =
      mesesNormalizados.length === 0 ||
      mesesNormalizados.includes(
        String(item.mesNum)
      );


    const itemSetor =
      normalizeText(item.setor);

    const matchSetor =
      setoresNormalizados.length === 0 ||
      setoresNormalizados.includes(
        itemSetor
      );


    const matchVendedor =
      !vendedorNormalizado ||
      normalizeText(
        item.vendedor
      ) === vendedorNormalizado;


    const matchRepresentante =
      !representanteNormalizado ||
      normalizeText(
        item.representante
      ) === representanteNormalizado;


    const matchCliente =
      !clienteNormalizado ||
      normalizeText(
        item.cliente
      ).includes(
        clienteNormalizado
      );


    return (
      matchAno &&
      matchMes &&
      matchSetor &&
      matchVendedor &&
      matchRepresentante &&
      matchCliente
    );
  });
}


/* =====================================================
   7. COMPATIBILIDADE COM O CÓDIGO ANTIGO
   ===================================================== */

function filtrarPorPeriodo(
  data,
  anos = [],
  meses = [],
  setores = []
) {
  return filtrarDados(
    data,
    {
      anos: anos,
      meses: meses,
      setores: setores
    }
  );
}


/* =====================================================
   8. ANOS DISPONÍVEIS
   ===================================================== */

function getAvailableYears(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return Array.from(
    new Set(
      data
        .map(function(item) {
          return Number(item.ano);
        })
        .filter(function(ano) {
          return (
            Number.isFinite(ano) &&
            ano > 0
          );
        })
    )
  ).sort(function(a, b) {
    return b - a;
  });
}


/* =====================================================
   9. VALORES ÚNICOS PARA FILTROS
   ===================================================== */

function getUniqueValues(data, key) {
  if (!Array.isArray(data)) {
    return [];
  }

  const mapa = new Map();

  data.forEach(function(item) {
    const valor = String(
      item && item[key]
        ? item[key]
        : ""
    ).trim();

    if (!valor) {
      return;
    }

    const chave =
      normalizeText(valor);

    if (!mapa.has(chave)) {
      mapa.set(
        chave,
        valor
      );
    }
  });

  return Array.from(
    mapa.values()
  ).sort(function(a, b) {
    return a.localeCompare(
      b,
      "pt-BR"
    );
  });
}


/* =====================================================
   10. SÉRIE MENSAL DE RECLAMAÇÕES
   ===================================================== */

function gerarSerieMensal(data) {
  const serie =
    Array(12).fill(0);

  if (!Array.isArray(data)) {
    return serie;
  }

  data.forEach(function(item) {
    const mes =
      Number(item.mesNum);

    if (
      mes >= 1 &&
      mes <= 12
    ) {
      serie[mes - 1]++;
    }
  });

  return serie;
}


/* =====================================================
   11. SÉRIE MENSAL DETALHADA
   ===================================================== */

function gerarSerieMensalDetalhada(data) {
  const labels = [
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
  ];

  const valores =
    gerarSerieMensal(data);

  return {
    labels: labels,
    valores: valores
  };
}


/* =====================================================
   12. MÉDIA MENSAL
   ===================================================== */

function calcularMediaMensal(data) {
  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return 0;
  }

  const mesesComDados =
    new Set();

  data.forEach(function(item) {
    if (
      item.ano &&
      item.mesNum
    ) {
      mesesComDados.add(
        item.ano +
        "-" +
        item.mesNum
      );
    }
  });

  if (mesesComDados.size === 0) {
    return 0;
  }

  return (
    data.length /
    mesesComDados.size
  );
}


/* =====================================================
   13. VARIAÇÃO ENTRE OS DOIS ÚLTIMOS MESES
   ===================================================== */

function calcularVariacaoMensal(data) {
  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return 0;
  }

  const agrupado = {};

  data.forEach(function(item) {
    if (
      !item.ano ||
      !item.mesNum
    ) {
      return;
    }

    const chave =
      String(item.ano) +
      "-" +
      String(item.mesNum)
        .padStart(2, "0");

    agrupado[chave] =
      (agrupado[chave] || 0) + 1;
  });


  const meses =
    Object.keys(agrupado)
      .sort();


  if (meses.length < 2) {
    return 0;
  }


  const mesAtual =
    meses[meses.length - 1];

  const mesAnterior =
    meses[meses.length - 2];


  const atual =
    agrupado[mesAtual] || 0;

  const anterior =
    agrupado[mesAnterior] || 0;


  if (anterior === 0) {
    return atual > 0
      ? 100
      : 0;
  }


  return (
    (
      (atual - anterior) /
      anterior
    ) * 100
  );
}


/* =====================================================
   14. PARTICIPAÇÃO DO TOP NO TOTAL
   ===================================================== */

function calcularParticipacaoTop(
  data,
  key
) {
  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return 0;
  }

  const top =
    getTopEntry(
      data,
      key
    );

  if (top.qtd === 0) {
    return 0;
  }

  return (
    top.qtd /
    data.length
  ) * 100;
}


/* =====================================================
   15. ORDENA RECLAMAÇÕES MAIS RECENTES
   ===================================================== */

function ordenarPorMaisRecentes(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return [...data].sort(function(a, b) {

    const timestampA =
      Number(a.timestamp) || 0;

    const timestampB =
      Number(b.timestamp) || 0;


    if (timestampB !== timestampA) {
      return timestampB - timestampA;
    }


    const rrcA =
      Number(a.rrc) || 0;

    const rrcB =
      Number(b.rrc) || 0;


    return rrcB - rrcA;
  });
}


/* =====================================================
   16. BUSCA LIVRE NA TABELA
   ===================================================== */

function buscarNasReclamacoes(
  data,
  termo
) {
  if (!Array.isArray(data)) {
    return [];
  }

  const busca =
    normalizeText(termo);

  if (!busca) {
    return [...data];
  }


  return data.filter(function(item) {

    const campos = [
      item.rrc,
      item.dataOcorrenciaTexto,
      item.cliente,
      item.produto,
      item.setor,
      item.erro,
      item.vendedor,
      item.representante,
      item.responsavelComercial,
      item.nf,
      item.transportadora,
      item.cidade,
      item.estado
    ];


    return campos.some(function(valor) {
      return normalizeText(
        valor
      ).includes(
        busca
      );
    });
  });
}


/* =====================================================
   17. ARREDONDAMENTO
   ===================================================== */

function round(value, decimals = 2) {
  const numero =
    Number(value) || 0;

  const fator =
    Math.pow(
      10,
      decimals
    );

  return (
    Math.round(
      numero * fator
    ) / fator
  );
}


/* =====================================================
   18. RESUMO DO DASHBOARD
   ===================================================== */

function calcularResumoDashboard(data) {
  const dados =
    Array.isArray(data)
      ? data
      : [];


  const topErro =
    getTopEntry(
      dados,
      "erro"
    );

  const topSetor =
    getTopEntry(
      dados,
      "setor"
    );

  const topCliente =
    getTopEntry(
      dados,
      "cliente"
    );


  const dadosResponsavel =
    prepararResponsaveis(
      dados
    );


  const topResponsavel =
    getTopEntry(
      dadosResponsavel,
      "responsavelComercial"
    );


  return {
    totalReclamacoes:
      dados.length,

    clientesAfetados:
      countUnique(
        dados,
        "cliente"
      ),

    erroTop:
      topErro,

    setorTop:
      topSetor,

    totalSetores:
      countUnique(
        dados,
        "setor"
      ),

    participacaoSetorTop:
      calcularParticipacaoTop(
        dados,
        "setor"
      ),

    clienteTop:
      topCliente,

    totalClientes:
      countUnique(
        dados,
        "cliente"
      ),

    mediaMensal:
      calcularMediaMensal(
        dados
      ),

    variacaoMensal:
      calcularVariacaoMensal(
        dados
      ),

    totalResponsaveis:
      countUnique(
        dadosResponsavel,
        "responsavelComercial"
      ),

    responsavelTop:
      topResponsavel
  };
}


/* =====================================================
   19. EXPORTAÇÃO GLOBAL
   ===================================================== */

window.formatNumber =
  formatNumber;

window.formatPercent =
  formatPercent;

window.formatDateBR =
  formatDateBR;

window.normalizeText =
  normalizeText;

window.isEmpty =
  isEmpty;

window.countUnique =
  countUnique;

window.countBy =
  countBy;

window.sortCountEntries =
  sortCountEntries;

window.getTopEntry =
  getTopEntry;

window.getTopFrequent =
  getTopFrequent;

window.getRanking =
  getRanking;

window.getResponsavelComercial =
  getResponsavelComercial;

window.prepararResponsaveis =
  prepararResponsaveis;

window.filtrarDados =
  filtrarDados;

window.filtrarPorPeriodo =
  filtrarPorPeriodo;

window.getAvailableYears =
  getAvailableYears;

window.getUniqueValues =
  getUniqueValues;

window.gerarSerieMensal =
  gerarSerieMensal;

window.gerarSerieMensalDetalhada =
  gerarSerieMensalDetalhada;

window.calcularMediaMensal =
  calcularMediaMensal;

window.calcularVariacaoMensal =
  calcularVariacaoMensal;

window.calcularParticipacaoTop =
  calcularParticipacaoTop;

window.ordenarPorMaisRecentes =
  ordenarPorMaisRecentes;

window.buscarNasReclamacoes =
  buscarNasReclamacoes;

window.round =
  round;

window.calcularResumoDashboard =
  calcularResumoDashboard;