/* =====================================================
   FUNÇÕES UTILITÁRIAS
   Arquivo: js/utils.js

   Dashboard RRC - Isopack
   ===================================================== */

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
  if (!value) return "-";
  const data = value instanceof Date ? value : extrairDataInfo(value).data;
  return data && Number.isFinite(data.getTime()) ? data.toLocaleDateString("pt-BR") : "-";
}

/* =====================================================
   2. TEXTO / NORMALIZAÇÃO
   ===================================================== */

function normalizeText(value) {
  return String(value ?? "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
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
  const grupos = new Map();
  if (Array.isArray(arr)) {
    arr.forEach(function(item) {
      const nome = String(item?.[key] ?? "").trim();
      if (!nome) return;
      const chave = normalizeText(nome);
      if (!grupos.has(chave)) grupos.set(chave, { nome, qtd: 0 });
      grupos.get(chave).qtd++;
    });
  }
  return Object.fromEntries(Array.from(grupos.values(), grupo => [grupo.nome, grupo.qtd]));
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
  const nomes = new Map();
  [item?.vendedor, item?.representante].forEach(function(valor) {
    const nome = String(valor ?? "").trim();
    if (nome && !nomes.has(normalizeText(nome))) nomes.set(normalizeText(nome), nome);
  });
  return Array.from(nomes.values()).join(" / ") || "Não informado";
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
  const labels = MESES_ABREVIADOS;

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
  const validos = (Array.isArray(data) ? data : []).filter(item => item.ano && item.mesNum);
  const meses = new Set(validos.map(item => item.ano + "-" + item.mesNum));
  return meses.size ? validos.length / meses.size : 0;
}

/* =====================================================
   13. VARIAÇÃO ENTRE OS DOIS ÚLTIMOS MESES
   ===================================================== */

function calcularVariacaoMensal(data) {
  const contagem = new Map();
  (Array.isArray(data) ? data : []).forEach(function(item) {
    if (!item.ano || !item.mesNum) return;
    const mes = item.ano * 12 + item.mesNum - 1;
    contagem.set(mes, (contagem.get(mes) || 0) + 1);
  });
  if (!contagem.size) return 0;
  const ultimo = Math.max(...contagem.keys());
  const anterior = contagem.get(ultimo - 1) || 0;
  // Sem registros no mês anterior, não há percentual calculável.
  return anterior ? ((contagem.get(ultimo) - anterior) / anterior) * 100 : null;
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
  return ordenarReclamacoes(data, "data", "desc");
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
      item.dataRegistroTexto,
      formatDateBR(getDataReclamacao(item)),
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

/* Operações da tabela: preservam o conjunto de dados usado pelo dashboard. */
const comparadorTabela = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function getDataReclamacao(item) {
  return item.dataOcorrencia || item.dataRegistro || null;
}

function valorColunaReclamacao(item, coluna) {
  if (coluna === "data") return getDataReclamacao(item)?.getTime() ?? null;
  if (coluna === "responsavelComercial") return getResponsavelComercial(item);
  return item[coluna] ?? "";
}

function ordenarReclamacoes(data, coluna = "rrc", direcao = "desc") {
  const colunas = ["rrc", "data", "cliente", "produto", "setor", "erro", "responsavelComercial", "nf"];
  if (!colunas.includes(coluna)) coluna = "rrc";
  const fator = direcao === "asc" ? 1 : -1;
  return [...(Array.isArray(data) ? data : [])].sort(function(a, b) {
    const valorA = valorColunaReclamacao(a, coluna);
    const valorB = valorColunaReclamacao(b, coluna);
    if (isEmpty(valorA) !== isEmpty(valorB)) return isEmpty(valorA) ? 1 : -1;
    const comparacao = coluna === "data"
      ? Number(valorA) - Number(valorB)
      : comparadorTabela.compare(String(valorA), String(valorB));
    return comparacao * fator ||
      comparadorTabela.compare(String(b.rrc ?? ""), String(a.rrc ?? "")) ||
      (a.indiceOriginal ?? 0) - (b.indiceOriginal ?? 0);
  });
}

function filtrarTabelaReclamacoes(data, { termo = "", setor = "", erro = "", inicio = "", fim = "" } = {}) {
  const dataInicio = inicio ? extrairDataInfo(inicio).timestamp : null;
  const dataFim = fim ? extrairDataInfo(fim).timestamp : null;
  return buscarNasReclamacoes(data, termo).filter(function(item) {
    if (setor && normalizeText(item.setor) !== normalizeText(setor)) return false;
    if (erro && normalizeText(item.erro) !== normalizeText(erro)) return false;
    const data = getDataReclamacao(item);
    if ((inicio || fim) && !data) return false;
    if (inicio && data.getTime() < dataInicio) return false;
    if (fim && data.getTime() > dataFim) return false;
    return true;
  });
}

const MESES_ABREVIADOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
