/* Leitura e normalização da planilha pública de reclamações. */
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQB0h9o41ixlA5A79GS6gJk56ubMd_wfvOkYgC0ttKPmddmgNuSa9F_NDK2KIqnUrnHPdiatYyVyxyO/pub?gid=1931971393&single=true&output=csv";

const MESES_ORDEM = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
window.MESES_ORDEM = MESES_ORDEM;

let carregamentoEmAndamento = false;
let ultimaAtualizacaoDados = null;

function normalizarCabecalho(valor) {
  return normalizeText(valor).replace(/^\uFEFF/, "");
}

/* Mantém separadores, aspas escapadas e quebras de linha dentro dos campos. */
function parseCSV(csv, separador) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let entreAspas = false;
  const texto = String(csv).replace(/^\uFEFF/, "");

  for (let i = 0; i < texto.length; i++) {
    const caractere = texto[i];
    if (caractere === '"') {
      if (entreAspas && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (caractere === separador && !entreAspas) {
      linha.push(campo);
      campo = "";
    } else if ((caractere === "\n" || caractere === "\r") && !entreAspas) {
      linha.push(campo);
      if (linha.some(valor => valor.trim() !== "")) linhas.push(linha);
      linha = [];
      campo = "";
      if (caractere === "\r" && texto[i + 1] === "\n") i++;
    } else {
      campo += caractere;
    }
  }

  if (entreAspas) throw new Error("O CSV contém um campo com aspas não fechadas.");
  linha.push(campo);
  if (linha.some(valor => valor.trim() !== "")) linhas.push(linha);
  return linhas;
}

function csvToJson(csv) {
  if (!String(csv ?? "").trim()) return [];
  // O cabeçalho publicado pelo Sheets não contém quebras de linha.
  const primeiraLinha = String(csv).split(/\r?\n/, 1)[0];
  const separador = [",", ";", "\t"].reduce((melhor, candidato) =>
    parseCSV(primeiraLinha, candidato)[0].length >
    parseCSV(primeiraLinha, melhor)[0].length ? candidato : melhor
  );
  const [cabecalho, ...linhas] = parseCSV(csv, separador);
  if (!cabecalho) return [];
  const headers = cabecalho.map(normalizarCabecalho);
  const preenchidos = headers.filter(Boolean);
  if (new Set(preenchidos).size !== preenchidos.length) {
    throw new Error("O CSV contém cabeçalhos duplicados.");
  }
  if (!headers.some(header => ["nº rrc", "n° rrc", "numero rrc", "rrc", "cliente"].includes(header))) {
    throw new Error("A resposta recebida não contém as colunas de reclamações.");
  }
  return linhas.map(colunas => {
    if (colunas.length !== headers.length) {
      throw new Error("O CSV contém uma linha com quantidade de colunas inválida.");
    }
    return Object.fromEntries(headers.flatMap((header, index) =>
      header ? [[header, colunas[index].trim()]] : []
    ));
  });
}

function obterCampo(registro, nomesPossiveis) {
  for (const nome of nomesPossiveis) {
    const valor = String(registro[normalizarCabecalho(nome)] ?? "").trim();
    if (valor) return valor;
  }
  return "";
}

function extrairDataInfo(valor) {
  const vazio = { data: null, dia: null, mesNum: null, mes: null, ano: null, timestamp: 0 };
  const texto = String(valor ?? "").trim();
  if (!texto) return vazio;

  let dia, mes, ano;
  const brasileira = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?=$|[ T])/);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?=$|[ T])/);
  if (brasileira) {
    [, dia, mes, ano] = brasileira.map(Number);
    if (ano < 100) ano += 2000;
  } else if (iso) {
    [, ano, mes, dia] = iso.map(Number);
  } else if (/^\d+(?:\.\d+)?$/.test(texto)) {
    const serial = Number(texto);
    if (serial <= 30000 || serial >= 2958466) return vazio;
    // O serial representa um dia de calendário; UTC serve só para obter suas partes.
    const calendario = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
    ano = calendario.getUTCFullYear();
    mes = calendario.getUTCMonth() + 1;
    dia = calendario.getUTCDate();
  } else {
    return vazio;
  }

  const data = new Date(0);
  data.setFullYear(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  if (!Number.isFinite(data.getTime()) ||
      data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return vazio;
  }
  return {
    data, dia, mesNum: mes, mes: MESES_ORDEM[mes - 1],
    ano, timestamp: data.getTime()
  };
}

function normalizarDados(raw) {
  if (!Array.isArray(raw)) return [];
  const linhasVistas = new Set();
  const dados = [];

  raw.forEach((registro, indiceOriginal) => {
    const rrcTexto = obterCampo(registro, ["Nº RRC", "N° RRC", "NUMERO RRC", "RRC"]);
    const cliente = obterCampo(registro, ["CLIENTE"]);
    if (!rrcTexto && !cliente) return;

    // Remove somente repetições idênticas com RRC identificada.
    // Mesmo número com produto/problema diferente continua sendo uma linha válida.
    const assinatura = JSON.stringify(Object.entries(registro).sort(([a], [b]) => a.localeCompare(b)));
    if (rrcTexto && linhasVistas.has(assinatura)) return;
    if (rrcTexto) linhasVistas.add(assinatura);

    const dataOcorrenciaTexto = obterCampo(registro, ["DATA OCORRÊNCIA"]);
    const dataRegistroTexto = obterCampo(registro, ["DATA/HORA REGISTRO", "DATA HORA REGISTRO"]);
    const dataEntregaTexto = obterCampo(registro, ["DATA ENTREGA"]);
    const ocorrencia = extrairDataInfo(dataOcorrenciaTexto);
    const registroData = extrairDataInfo(dataRegistroTexto);
    const entrega = extrairDataInfo(dataEntregaTexto);
    const dataReferencia = ocorrencia.data ? ocorrencia : registroData;
    const vendedor = obterCampo(registro, ["VENDEDOR"]);
    const representante = obterCampo(registro, ["REPRESENTANTE"]);

    dados.push({
      indiceOriginal,
      rrc: /^\d+$/.test(rrcTexto) && Number.isSafeInteger(Number(rrcTexto))
        ? Number(rrcTexto) : rrcTexto,
      dataRegistroTexto, dataOcorrenciaTexto, dataEntregaTexto,
      dataRegistro: registroData.data,
      dataOcorrencia: ocorrencia.data,
      dataEntrega: entrega.data,
      timestamp: dataReferencia.timestamp,
      dia: dataReferencia.dia,
      mesNum: dataReferencia.mesNum,
      mes: dataReferencia.mes,
      ano: dataReferencia.ano,
      cliente,
      cnpjCpf: obterCampo(registro, ["CNPJ/CPF", "CNPJ CPF"]),
      contato: obterCampo(registro, ["CONTATO"]),
      cidade: obterCampo(registro, ["CIDADE"]),
      estado: obterCampo(registro, ["ESTADO"]),
      vendedor, representante,
      responsavelComercial: getResponsavelComercial({ vendedor, representante }),
      nf: obterCampo(registro, ["NF"]),
      transportadora: obterCampo(registro, ["TRANSPORTADORA"]),
      produto: obterCampo(registro, ["DESCRIÇÃO PRODUTO"]),
      descricaoProblema: obterCampo(registro, ["DESCRIÇÃO PROBLEMA"]),
      setor: obterCampo(registro, ["SETOR OCORRÊNCIA"]),
      erro: obterCampo(registro, ["ERRO OCORRIDO"]),
      imagens: obterCampo(registro, ["IMAGENS"]),
      qtd: 1
    });
  });
  return dados;
}

function atualizarStatusDados() {
  const status = document.getElementById("status");
  if (!status || !ultimaAtualizacaoDados) return;
  status.textContent = "Última atualização: " + ultimaAtualizacaoDados.toLocaleString("pt-BR", {
    dateStyle: "short", timeStyle: "short"
  });
}

async function carregarDados() {
  if (carregamentoEmAndamento) return;
  carregamentoEmAndamento = true;
  const btn = document.getElementById("btnRefresh");
  const status = document.getElementById("status");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Atualizando...";
  }
  try {
    const url = new URL(CSV_URL);
    url.searchParams.set("t", Date.now());
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error("Erro HTTP " + res.status + " ao carregar o CSV.");
    const csv = await res.text();
    if (!csv.trim()) throw new Error("O CSV retornou vazio.");
    const dados = normalizarDados(csvToJson(csv));
    window.DADOS_RC = dados;
    ultimaAtualizacaoDados = new Date();
    atualizarDashboard();
    atualizarStatusDados();
  } catch (erro) {
    console.error("Erro ao carregar as reclamações:", erro);
    const possuiDados = ultimaAtualizacaoDados !== null;
    if (status) {
      status.textContent = possuiDados
        ? "Falha na atualização. Exibindo os dados de " + ultimaAtualizacaoDados.toLocaleString("pt-BR") + "."
        : "Não foi possível carregar os dados. Clique em Atualizar para tentar novamente.";
    }
    // Falhas temporárias não apagam os dados nem as seleções já carregadas.
    if (!possuiDados) {
      window.DADOS_RC = [];
      atualizarDashboard();
    }
  } finally {
    clearTimeout(timeout);
    carregamentoEmAndamento = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Atualizar";
    }
  }
}

document.addEventListener("DOMContentLoaded", function() {
  carregarDados();
  document.getElementById("btnRefresh")?.addEventListener("click", carregarDados);
});

