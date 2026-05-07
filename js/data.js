console.log('data.js carregado (CSV)');

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQB0h9o41ixlA5A79GS6gJk56ubMd_wfvOkYgC0ttKPmddmgNuSa9F_NDK2KIqnUrnHPdiatYyVyxyO/pub?gid=1507914961&single=true&output=csv';

const MESES_ORDEM = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

/* =====================================================
   CSV ROBUSTO
   ===================================================== */
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

  const linhas = csv
    .split('\n')
    .filter(l => l.trim() !== '');

  const sep =
    linhas[0].includes(';') ? ';' : ',';

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

      obj[h] =
        cols[i]
          ? cols[i].trim()
          : '';

    });

    return obj;
  });
}

/* =====================================================
   NUMERO BR ROBUSTO
   ===================================================== */
function parseSafeNumber(valor) {

  if (valor === null || valor === undefined) {
    return 0;
  }

  let texto = String(valor)
    .replace(/\s/g, '')
    .replace(/[R$\u00A0]/g, '')
    .replace(/"/g, '')
    .trim();

  texto = texto
    .replace(/\./g, '')
    .replace(',', '.');

  const numero = parseFloat(texto);

  return isNaN(numero)
    ? 0
    : numero;
}

/* =====================================================
   DATA FLEXÍVEL
   ===================================================== */
function extrairDataInfo(valor) {

  if (!valor) {
    return {
      mesNum: null,
      ano: null
    };
  }

  valor = String(valor).trim();

  // ================= DD/MM/YYYY =================
  if (valor.includes('/')) {

    const partes = valor.split('/');

    if (partes.length === 3) {

      return {
        mesNum: Number(partes[1]),
        ano: Number(partes[2])
      };

    }
  }

  // ================= YYYY-MM-DD =================
  if (valor.includes('-')) {

    const partes = valor.split('-');

    if (partes.length >= 3) {

      return {
        mesNum: Number(partes[1]),
        ano: Number(partes[0])
      };

    }
  }

  // ================= SERIAL GOOGLE SHEETS =================
  const serial = Number(valor);

  if (!isNaN(serial) && serial > 40000) {

    const data = new Date(
      (serial - 25569) * 86400 * 1000
    );

    return {
      mesNum: data.getMonth() + 1,
      ano: data.getFullYear()
    };
  }

  return {
    mesNum: null,
    ano: null
  };
}

/* =====================================================
   NORMALIZA
   ===================================================== */
function normalizarDados(raw) {

  console.log(
    'Headers detectados:',
    Object.keys(raw[0])
  );

  const normalizados = raw.map(r => {

    const dataInfo =
      extrairDataInfo(r['data da ocorrencia']);

    return {

      mes:
        dataInfo.mesNum
          ? MESES_ORDEM[dataInfo.mesNum - 1]
          : null,

      cliente:
        (r['nome do cliente'] || '').trim(),

      erro:
        (r['qual o erro ocorreu?'] || '').trim(),

      setor:
        (r['setor da ocorrencia'] || '').trim(),

      qtd: 1,

volume: parseSafeNumber(
  r['m3 calculado'] ||
  r['qtd x medidas = m³']
),

      valor:
        parseSafeNumber(r['r$']),

      ano:
        dataInfo.ano,

      mesNum:
        dataInfo.mesNum

    };

  })

  // ================= FILTRO MAIS FLEXÍVEL =================
  .filter(d => d.cliente !== '');

  console.log('📊 Linhas CSV:', raw.length);

  console.log(
    '📊 Linhas válidas:',
    normalizados.length
  );

  // ================= DEBUG DATAS =================
  console.log(
    'Linhas com data inválida:',
    normalizados.filter(d =>
      d.ano === null ||
      d.mesNum === null
    )
  );

  // ================= DEBUG VALOR =================
  const totalValor = normalizados.reduce(
    (acc, item) => acc + (item.valor || 0),
    0
  );

  console.log(
    '💰 Valor total encontrado:',
    totalValor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );

  return normalizados;
}

/* =====================================================
   LOAD PRINCIPAL
   ===================================================== */
async function carregarDados() {

  try {

    const btn =
      document.getElementById('btnRefresh');

    if (btn) {

      btn.disabled = true;
      btn.innerText = 'Atualizando...';

    }

    const res = await fetch(
      CSV_URL + '&t=' + new Date().getTime()
    );

    const csv = await res.text();

    console.log('CSV bruto:', csv);

    const bruto = csvToJson(csv);

    const dados = normalizarDados(bruto);

    window.DADOS_RC = dados;

    window.MESES_ORDEM = MESES_ORDEM;

    console.log(
      '✅ Dados carregados corretamente'
    );

    if (typeof atualizarDashboard === 'function') {

      atualizarDashboard();

    }

    if (btn) {

      btn.disabled = false;
      btn.innerText = 'Atualizar';

    }

  } catch (e) {

    console.error(
      '❌ Erro ao carregar CSV:',
      e
    );

    window.DADOS_RC = [];

    const btn =
      document.getElementById('btnRefresh');

    if (btn) {

      btn.disabled = false;
      btn.innerText = 'Atualizar';

    }
  }
}

/* =====================================================
   BOTÃO REFRESH
   ===================================================== */
document.addEventListener(
  'DOMContentLoaded',
  () => {

    carregarDados();

    const btnRefresh =
      document.getElementById('btnRefresh');

    if (btnRefresh) {

      btnRefresh.addEventListener(
        'click',
        () => {
          carregarDados();
        }
      );

    }

  }
);