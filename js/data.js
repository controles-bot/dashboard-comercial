console.log("data.js carregado - Dashboard RRC");

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQB0h9o41ixlA5A79GS6gJk56ubMd_wfvOkYgC0ttKPmddmgNuSa9F_NDK2KIqnUrnHPdiatYyVyxyO/pub?gid=1931971393&single=true&output=csv";

const MESES_ORDEM = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

/* =====================================================
   1. NORMALIZA CABEÇALHO
   ===================================================== */

function normalizarCabecalho(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


/* =====================================================
   2. CSV ROBUSTO
   ===================================================== */

function parseCSVLine(line, sep) {
  const result = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {

      // Aspa dupla dentro de campo com aspas
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (
      char === sep &&
      !insideQuotes
    ) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);

  return result;
}


/* =====================================================
   3. CSV PARA JSON
   ===================================================== */

function csvToJson(csv) {
  if (!csv || !String(csv).trim()) {
    return [];
  }

  const linhas = String(csv)
    .replace(/\r/g, "")
    .split("\n")
    .filter(function(linha) {
      return linha.trim() !== "";
    });


  if (linhas.length === 0) {
    return [];
  }


  const primeiraLinha =
    linhas[0];


  const sep =
    primeiraLinha.includes(";")
      ? ";"
      : ",";


  const headers =
    parseCSVLine(
      primeiraLinha,
      sep
    ).map(function(header) {
      return normalizarCabecalho(header);
    });


  console.log(
    "Headers detectados:",
    headers
  );


  return linhas
    .slice(1)
    .map(function(linha) {

      const cols =
        parseCSVLine(
          linha,
          sep
        );


      const obj = {};


      headers.forEach(
        function(header, index) {

          obj[header] =
            cols[index] !== undefined
              ? String(cols[index]).trim()
              : "";

        }
      );


      return obj;
    });
}


/* =====================================================
   4. BUSCA CAMPO PELO CABEÇALHO
   ===================================================== */

function obterCampo(
  registro,
  nomesPossiveis
) {
  for (
    let i = 0;
    i < nomesPossiveis.length;
    i++
  ) {

    const chave =
      normalizarCabecalho(
        nomesPossiveis[i]
      );


    if (
      registro[chave] !== undefined &&
      registro[chave] !== null
    ) {
      return String(
        registro[chave]
      ).trim();
    }
  }

  return "";
}


/* =====================================================
   5. DATA FLEXÍVEL
   ===================================================== */

function extrairDataInfo(valor) {

  const vazio = {
    data: null,
    dia: null,
    mesNum: null,
    mes: null,
    ano: null,
    timestamp: 0
  };


  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ""
  ) {
    return vazio;
  }


  const texto =
    String(valor).trim();


  let data = null;


  /* ================================================
     DD/MM/YYYY
     DD/MM/YYYY HH:mm:ss
     ================================================ */

  if (texto.includes("/")) {

    const parteData =
      texto.split(" ")[0];


    const partes =
      parteData.split("/");


    if (partes.length === 3) {

      const dia =
        Number(partes[0]);

      const mes =
        Number(partes[1]);

      let ano =
        Number(partes[2]);


      if (ano < 100) {
        ano += 2000;
      }


      if (
        dia > 0 &&
        mes > 0 &&
        mes <= 12 &&
        ano > 0
      ) {
        data =
          new Date(
            ano,
            mes - 1,
            dia
          );
      }
    }
  }


  /* ================================================
     YYYY-MM-DD
     YYYY-MM-DDTHH:mm:ss
     ================================================ */

  if (
    !data &&
    texto.includes("-")
  ) {

    const parteData =
      texto.split("T")[0];


    const partes =
      parteData.split("-");


    if (partes.length >= 3) {

      const ano =
        Number(partes[0]);

      const mes =
        Number(partes[1]);

      const dia =
        Number(partes[2]);


      if (
        dia > 0 &&
        mes > 0 &&
        mes <= 12 &&
        ano > 0
      ) {
        data =
          new Date(
            ano,
            mes - 1,
            dia
          );
      }
    }
  }


  /* ================================================
     SERIAL GOOGLE SHEETS
     ================================================ */

  if (!data) {

    const serial =
      Number(texto);


    if (
      !Number.isNaN(serial) &&
      serial > 30000
    ) {

      data =
        new Date(
          (serial - 25569) *
          86400 *
          1000
        );
    }
  }


  if (
    !data ||
    Number.isNaN(
      data.getTime()
    )
  ) {
    return vazio;
  }


  const mesNum =
    data.getMonth() + 1;


  return {
    data: data,

    dia:
      data.getDate(),

    mesNum:
      mesNum,

    mes:
      MESES_ORDEM[
        mesNum - 1
      ],

    ano:
      data.getFullYear(),

    timestamp:
      data.getTime()
  };
}


/* =====================================================
   6. NORMALIZA OS DADOS

   NOVA ESTRUTURA DA ABA:

   A  Nº RRC
   B  DATA/HORA REGISTRO
   C  DATA OCORRÊNCIA
   D  CLIENTE
   E  CNPJ/CPF
   F  CONTATO
   G  CIDADE
   H  ESTADO
   I  VENDEDOR
   J  REPRESENTANTE
   K  NF
   L  TRANSPORTADORA
   M  DATA ENTREGA
   N  DESCRIÇÃO PRODUTO
   O  DESCRIÇÃO PROBLEMA
   P  SETOR OCORRÊNCIA
   Q  ERRO OCORRIDO
   R  IMAGENS
   S  HASH
   ===================================================== */

function normalizarDados(raw) {

  if (
    !Array.isArray(raw) ||
    raw.length === 0
  ) {

    console.warn(
      "Nenhuma linha encontrada no CSV."
    );

    return [];
  }


  console.log(
    "Headers recebidos:",
    Object.keys(raw[0])
  );


  const normalizados =
    raw.map(function(r, index) {


      /* ============================================
         DATAS
         ============================================ */

      const dataOcorrenciaTexto =
        obterCampo(
          r,
          [
            "DATA OCORRÊNCIA",
            "DATA OCORRENCIA"
          ]
        );


      const dataRegistroTexto =
        obterCampo(
          r,
          [
            "DATA/HORA REGISTRO",
            "DATA HORA REGISTRO"
          ]
        );


      const dataEntregaTexto =
        obterCampo(
          r,
          [
            "DATA ENTREGA"
          ]
        );


      const dataOcorrencia =
        extrairDataInfo(
          dataOcorrenciaTexto
        );


      const dataRegistro =
        extrairDataInfo(
          dataRegistroTexto
        );


      const dataEntrega =
        extrairDataInfo(
          dataEntregaTexto
        );


      /* ============================================
         COMERCIAL
         ============================================ */

      const vendedor =
        obterCampo(
          r,
          [
            "VENDEDOR"
          ]
        );


      const representante =
        obterCampo(
          r,
          [
            "REPRESENTANTE"
          ]
        );


      const responsavelComercial =
        vendedor ||
        representante ||
        "Não informado";


      /* ============================================
         Nº RRC
         ============================================ */

      const rrcTexto =
        obterCampo(
          r,
          [
            "Nº RRC",
            "N° RRC",
            "NUMERO RRC",
            "RRC"
          ]
        );


      const numeroSomente =
        String(rrcTexto)
          .replace(/[^\d]/g, "");


      const rrcNumero =
        Number(numeroSomente);


      /* ============================================
         OBJETO NORMALIZADO
         ============================================ */

      return {

        /* CONTROLE */

        indiceOriginal:
          index,


        /* IDENTIFICAÇÃO */

        rrc:
          Number.isFinite(rrcNumero) &&
          rrcNumero > 0
            ? rrcNumero
            : rrcTexto,


        /* DATAS TEXTO */

        dataRegistroTexto:
          dataRegistroTexto,

        dataOcorrenciaTexto:
          dataOcorrenciaTexto,

        dataEntregaTexto:
          dataEntregaTexto,


        /* DATAS */

        dataRegistro:
          dataRegistro.data,

        dataOcorrencia:
          dataOcorrencia.data,

        dataEntrega:
          dataEntrega.data,


        /* USADO PARA ORDENAÇÃO */

        timestamp:
          dataOcorrencia.timestamp ||
          dataRegistro.timestamp ||
          0,


        dia:
          dataOcorrencia.dia,


        mesNum:
          dataOcorrencia.mesNum,


        mes:
          dataOcorrencia.mes,


        ano:
          dataOcorrencia.ano,


        /* CLIENTE */

        cliente:
          obterCampo(
            r,
            [
              "CLIENTE"
            ]
          ),


        cnpjCpf:
          obterCampo(
            r,
            [
              "CNPJ/CPF",
              "CNPJ CPF"
            ]
          ),


        contato:
          obterCampo(
            r,
            [
              "CONTATO"
            ]
          ),


        cidade:
          obterCampo(
            r,
            [
              "CIDADE"
            ]
          ),


        estado:
          obterCampo(
            r,
            [
              "ESTADO"
            ]
          ),


        /* COMERCIAL */

        vendedor:
          vendedor,


        representante:
          representante,


        responsavelComercial:
          responsavelComercial,


        /* DOCUMENTOS */

        nf:
          obterCampo(
            r,
            [
              "NF"
            ]
          ),


        transportadora:
          obterCampo(
            r,
            [
              "TRANSPORTADORA"
            ]
          ),


        /* RECLAMAÇÃO */

        produto:
          obterCampo(
            r,
            [
              "DESCRIÇÃO PRODUTO",
              "DESCRICAO PRODUTO"
            ]
          ),


        descricaoProblema:
          obterCampo(
            r,
            [
              "DESCRIÇÃO PROBLEMA",
              "DESCRICAO PROBLEMA"
            ]
          ),


        setor:
          obterCampo(
            r,
            [
              "SETOR OCORRÊNCIA",
              "SETOR OCORRENCIA"
            ]
          ),


        erro:
          obterCampo(
            r,
            [
              "ERRO OCORRIDO"
            ]
          ),


        imagens:
          obterCampo(
            r,
            [
              "IMAGENS"
            ]
          ),


        /* CADA LINHA = UMA RRC */

        qtd: 1

      };

    })


    /* ================================================
       FILTRO DE LINHAS VÁLIDAS

       Para ser considerada uma reclamação,
       precisa ter Nº RRC ou Cliente.
       ================================================ */

    .filter(function(d) {

      return (
        String(
          d.rrc || ""
        ).trim() !== "" ||

        String(
          d.cliente || ""
        ).trim() !== ""
      );

    });


  /* =====================================================
     DEBUG
     ===================================================== */

  console.log(
    "📊 Linhas CSV:",
    raw.length
  );


  console.log(
    "📊 Reclamações válidas:",
    normalizados.length
  );


  console.log(
    "📋 Dados normalizados:",
    normalizados
  );


  /* =====================================================
     VERIFICA DATAS INVÁLIDAS
     ===================================================== */

  const datasInvalidas =
    normalizados.filter(
      function(d) {

        return (
          d.ano === null ||
          d.mesNum === null
        );

      }
    );


  if (
    datasInvalidas.length > 0
  ) {

    console.warn(
      "⚠️ Linhas com DATA OCORRÊNCIA inválida:",
      datasInvalidas
    );

  }


  /* =====================================================
     ANOS ENCONTRADOS
     ===================================================== */

  const anosDisponiveis =
    Array.from(
      new Set(

        normalizados
          .map(function(d) {
            return d.ano;
          })

          .filter(function(ano) {
            return (
              ano !== null &&
              ano !== undefined
            );
          })

      )
    )

    .sort(function(a, b) {
      return b - a;
    });


  console.log(
    "📅 Anos encontrados:",
    anosDisponiveis
  );


  /* =====================================================
     SETORES ENCONTRADOS
     ===================================================== */

  const setoresDisponiveis =
    Array.from(
      new Set(

        normalizados
          .map(function(d) {
            return d.setor;
          })

          .filter(function(setor) {
            return setor !== "";
          })

      )
    )

    .sort(function(a, b) {
      return a.localeCompare(
        b,
        "pt-BR"
      );
    });


  console.log(
    "🏭 Setores encontrados:",
    setoresDisponiveis
  );


  /* =====================================================
     VENDEDORES
     ===================================================== */

  const vendedores =
    Array.from(
      new Set(

        normalizados
          .map(function(d) {
            return d.vendedor;
          })

          .filter(function(valor) {
            return valor !== "";
          })

      )
    )

    .sort(function(a, b) {
      return a.localeCompare(
        b,
        "pt-BR"
      );
    });


  console.log(
    "👤 Vendedores encontrados:",
    vendedores
  );


  /* =====================================================
     REPRESENTANTES
     ===================================================== */

  const representantes =
    Array.from(
      new Set(

        normalizados
          .map(function(d) {
            return d.representante;
          })

          .filter(function(valor) {
            return valor !== "";
          })

      )
    )

    .sort(function(a, b) {
      return a.localeCompare(
        b,
        "pt-BR"
      );
    });


  console.log(
    "🤝 Representantes encontrados:",
    representantes
  );


  return normalizados;
}


/* =====================================================
   7. STATUS DA ATUALIZAÇÃO
   ===================================================== */

function atualizarStatusDados() {

  const status =
    document.getElementById(
      "status"
    );


  if (!status) {
    return;
  }


  const agora =
    new Date();


  const data =
    agora.toLocaleDateString(
      "pt-BR"
    );


  const hora =
    agora.toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  status.textContent =
    "Última atualização: " +
    data +
    " às " +
    hora;
}


/* =====================================================
   8. LOAD PRINCIPAL
   ===================================================== */

async function carregarDados() {

  const btn =
    document.getElementById(
      "btnRefresh"
    );


  try {

    /* ================================================
       BOTÃO
       ================================================ */

    if (btn) {

      btn.disabled = true;

      btn.innerText =
        "Atualizando...";

    }


    /* ================================================
       EVITA CACHE
       ================================================ */

    const url =
      CSV_URL +
      (
        CSV_URL.includes("?")
          ? "&"
          : "?"
      ) +
      "t=" +
      new Date().getTime();


    console.log(
      "Buscando CSV:",
      url
    );


    /* ================================================
       FETCH
       ================================================ */

    const res =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );


    if (!res.ok) {

      throw new Error(
        "Erro HTTP " +
        res.status +
        " ao carregar o CSV."
      );

    }


    /* ================================================
       CSV
       ================================================ */

    const csv =
      await res.text();


    if (!csv.trim()) {

      throw new Error(
        "O CSV retornou vazio."
      );

    }


    console.log(
      "CSV carregado com sucesso."
    );


    /* ================================================
       CONVERTE
       ================================================ */

    const bruto =
      csvToJson(csv);


    console.log(
      "JSON bruto:",
      bruto
    );


    const dados =
      normalizarDados(bruto);


    /* ================================================
       EXPORTA GLOBALMENTE
       ================================================ */

    window.DADOS_RC =
      dados;


    window.MESES_ORDEM =
      MESES_ORDEM;


    console.log(
      "✅ Dados carregados corretamente"
    );


    /* ================================================
       ATUALIZA DASHBOARD
       ================================================ */

    if (
      typeof atualizarDashboard ===
      "function"
    ) {

      atualizarDashboard();

    }


    /* ================================================
       STATUS
       ================================================ */

    atualizarStatusDados();


  } catch (e) {

    console.error(
      "❌ Erro ao carregar CSV:",
      e
    );


    window.DADOS_RC = [];


    const status =
      document.getElementById(
        "status"
      );


    if (status) {

      status.textContent =
        "Erro ao atualizar os dados";

    }


    /* Mesmo com erro,
       permite o dashboard limpar os cards */

    if (
      typeof atualizarDashboard ===
      "function"
    ) {

      atualizarDashboard();

    }


  } finally {

    /* ================================================
       LIBERA BOTÃO
       ================================================ */

    if (btn) {

      btn.disabled = false;

      btn.innerText =
        "Atualizar";

    }

  }
}


/* =====================================================
   9. INICIALIZAÇÃO
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    /* ================================================
       CARREGA AO ABRIR
       ================================================ */

    carregarDados();


    /* ================================================
       BOTÃO ATUALIZAR
       ================================================ */

    const btnRefresh =
      document.getElementById(
        "btnRefresh"
      );


    if (btnRefresh) {

      btnRefresh.addEventListener(
        "click",
        function() {

          carregarDados();

        }
      );

    }

  }
);