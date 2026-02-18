/* =====================================================
   FUNÇÕES UTILITÁRIAS (js/utils.js)
   -----------------------------------------------------
   Contém toda a matemática e lógica de tratamento de dados
   ===================================================== */

/* =====================
   1. FORMATAÇÃO
   ===================== */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

/* =====================
   2. EXTRAÇÃO DE DATA
   ===================== */
function extrairMesEAno(dataStr) {
  if (!dataStr) return { mes: null, ano: null };
  const partes = dataStr.split('/'); // Espera dd/mm/aaaa
  if (partes.length !== 3) return { mes: null, ano: null };

  const mes = Number(partes[1]);
  let ano = Number(partes[2]);

  if (ano < 100) ano += 2000; // Trata ano abreviado (24 -> 2024)
  
  return { mes, ano };
}

/* =====================
   3. CÁLCULOS E ESTATÍSTICAS
   ===================== */

// Soma valores de uma coluna
function sumBy(arr, key) {
  return arr.reduce((total, item) => {
    return total + (Number(item[key]) || 0);
  }, 0);
}

// Conta quantos itens únicos existem (Ex: Quantos clientes diferentes?)
function countUnique(arr, key) {
  if (!arr) return 0;
  const unicos = new Set(arr.map(item => item[key]));
  return unicos.size;
}

// Encontra o item mais frequente (Ex: Qual o erro mais comum?)
function getTopFrequent(arr, key) {
  if (!arr || arr.length === 0) return "-";

  const counts = arr.reduce((acc, item) => {
    const val = item[key];
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  // Ordena decrescente
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  // Retorna string formatada "Nome (Qtd)"
  return sorted.length > 0 ? `${sorted[0][0]} (${sorted[0][1]})` : "-";
}

/* =====================
   4. LÓGICA DE FILTRO (CORE)
   ===================== */
function filtrarPorPeriodo(data, anos = [], meses = [], setor = '') {
  if (!data) return [];

  return data.filter(item => {
    // 1. ANO (Converte para string para comparar com o filtro)
    // Se a lista de anos for vazia ou incluir o ano do item, passa.
    const itemAno = String(item.ano);
    const matchAno = anos.length === 0 || anos.includes(itemAno);

    // 2. MÊS
    // O CSV traz mesNum (number), o filtro traz string.
    const itemMes = String(item.mesNum);
    const matchMes = meses.length === 0 || meses.includes(itemMes);

    // 3. SETOR
    // Se o filtro for vazio, aceita tudo.
    const matchSetor = setor === "" || item.setor === setor;

    return matchAno && matchMes && matchSetor;
  });
}

/* =====================
   5. EXPORTAÇÃO GLOBAL
   Isso permite que o dashboard.js use window.nomeDaFuncao
   ===================== */
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.extrairMesEAno = extrairMesEAno;
window.sumBy = sumBy;
window.countUnique = countUnique;     // <--- AQUI ESTAVA O ERRO (Faltava isso)
window.getTopFrequent = getTopFrequent;
window.filtrarPorPeriodo = filtrarPorPeriodo;

// Helpers para gráficos (se precisar depois)
window.gerarSerieMensal = function(data, key) {
   const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
   return labels.map((_, i) => {
     const mesNum = i + 1;
     return data.filter(d => d.mesNum === mesNum)
                .reduce((acc, curr) => acc + (Number(curr[key])||0), 0);
   });
};