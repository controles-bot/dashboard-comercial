console.log('data.js carregado (CSV)');

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQB0h9o41ixlA5A79GS6gJk56ubMd_wfvOkYgC0ttKPmddmgNuSa9F_NDK2KIqnUrnHPdiatYyVyxyO/pub?gid=1507914961&single=true&output=csv';

const MESES_ORDEM = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

/* ===================== CSV ROBUSTO ===================== */
function parseCSVLine(line, sep) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === sep && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function csvToJson(csv) {
  const linhas = csv.split('\n').filter(l => l.trim() !== '');
  const sep = linhas[0].includes(';') ? ';' : ',';

  const headers = parseCSVLine(linhas[0], sep)
    .map(h =>
      h.toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .trim()
    );

  return linhas.slice(1).map(l => {
    const cols = parseCSVLine(l, sep);
    const obj = {};

    headers.forEach((h, i) => {
      obj[h] = cols[i] ? cols[i].trim() : '';
    });

    return obj;
  });
}

/* ===================== NUMERO BR ===================== */
function parseSafeNumber(valor) {
  if (!valor) return 0;

  const texto = String(valor)
    .replace(/"/g, '')
    .trim()
    .replace(/\./g, '')      // remove milhar
    .replace(',', '.');      // vírgula decimal

  const numero = Number(texto);
  return isNaN(numero) ? 0 : numero;
}

/* ===================== DATA FLEXÍVEL ===================== */
function extrairDataInfo(valor) {
  if (!valor) return { mesNum: null, ano: null };

  if (valor.includes('/')) {
    const partes = valor.split('/');
    if (partes.length === 3) {
      return {
        mesNum: Number(partes[1]),
        ano: Number(partes[2])
      };
    }
  }

  if (valor.includes('-')) {
    const partes = valor.split('-');
    if (partes.length === 3) {
      return {
        mesNum: Number(partes[1]),
        ano: Number(partes[0])
      };
    }
  }

  return { mesNum: null, ano: null };
}

/* ===================== NORMALIZA ===================== */
function normalizarDados(raw) {

  const normalizados = raw
    .map(r => {

      const dataInfo = extrairDataInfo(r['data da ocorrencia']);

      return {
        mes: dataInfo.mesNum ? MESES_ORDEM[dataInfo.mesNum - 1] : null,
        cliente: (r['nome do cliente'] || '').trim(),
        erro: (r['qual o erro ocorreu?'] || '').trim(),
        setor: (r['setor da ocorrencia'] || '').trim(),
        qtd: 1,
        volume: parseSafeNumber(r['m3 calculado']),
        valor: parseSafeNumber(r['r$']),
        ano: dataInfo.ano,
        mesNum: dataInfo.mesNum
      };

    })
    .filter(d =>
      d.cliente !== '' &&
      d.ano !== null &&
      d.mesNum !== null
    );

  console.log('📊 Linhas CSV:', raw.length);
  console.log('📊 Linhas válidas:', normalizados.length);
  console.log('📦 Volume total:',
    normalizados.reduce((acc, d) => acc + d.volume, 0)
  );

  return normalizados;
}

/* ===================== LOAD ===================== */
async function carregarDados() {
  try {
    const res = await fetch(CSV_URL);
    const csv = await res.text();

    const bruto = csvToJson(csv);
    const dados = normalizarDados(bruto);

    window.DADOS_RC = dados;
    window.MESES_ORDEM = MESES_ORDEM;

    console.log('✅ Dados carregados corretamente');

    if (typeof atualizarDashboard === 'function') {
      atualizarDashboard();
    }

  } catch (e) {
    console.error('❌ Erro ao carregar CSV:', e);
    window.DADOS_RC = [];
  }
}

carregarDados();
