/* =====================================================
   DASHBOARD INTELIGENTE – FINAL ESTÁVEL (COM TODOS OS MESES)
   ===================================================== */

// ===================== ELEMENTOS =====================
const btnReset = document.getElementById('btnReset');
const periodDropdown = document.getElementById('periodDropdown');
const periodSelected = document.getElementById('periodSelected');
const menuFiltros = document.querySelector('.period-menu');
const setorDropdown = document.getElementById('setorDropdown');
const setorSelected = document.getElementById('setorSelected');
const setorMenu = document.getElementById('setorMenu');

let filtrosGerados = false;

// ===================== ATUALIZA DASHBOARD =====================
window.atualizarDashboard = function () {

  const dados = window.DADOS_RC || [];
  if (!dados.length) return;

  if (!filtrosGerados) {
    gerarFiltrosDinamicos(dados);
    filtrosGerados = true;
  }

  const filtros = lerFiltrosAtivos();

  const dadosFiltrados = window.filtrarPorPeriodo(
    dados,
    filtros.anos,
    filtros.meses,
    filtros.setores
  );

  atualizarKPIs(dadosFiltrados);
  atualizarGraficos(dadosFiltrados);

  const status = document.getElementById('status');
  if (status)
    status.innerText = `Atualizado às ${new Date().toLocaleTimeString()}`;
  atualizarTextoPeriodo();
atualizarTextoSetor();
};

// ===================== GERAR FILTROS =====================
function gerarFiltrosDinamicos(dados) {

  // ================= SETOR =================
// ================= SETOR =================
const setores = [...new Set(dados.map(d => d.setor))].sort();

setorMenu.innerHTML = "";

setores.forEach(setor => {
  if (!setor) return;

  setorMenu.innerHTML += `
    <label>
      <input type="checkbox" class="filtro-setor-auto" value="${setor}" checked>
      ${setor}
    </label>
  `;
});
  // ================= ANOS =================
  const anosUnicos = [...new Set(dados.map(d => d.ano))].sort((a, b) => b - a);

  menuFiltros.innerHTML = "";

  const divAnos = document.createElement('div');
  divAnos.innerHTML = "<h4>Anos</h4>";

  anosUnicos.forEach(ano => {
    divAnos.innerHTML += `
      <label style="display:block">
        <input type="checkbox" class="filtro-ano-auto" value="${ano}" checked>
        ${ano}
      </label>`;
  });

  menuFiltros.appendChild(divAnos);

  // ================= MESES =================
  const meses = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  const divMeses = document.createElement('div');
  divMeses.style.marginTop = "15px";
  divMeses.innerHTML = "<h4>Meses</h4>";

  // 🔥 TODOS OS MESES
  divMeses.innerHTML += `
    <label style="display:block;font-weight:bold;margin-bottom:5px">
      <input type="checkbox" id="todosMeses" checked>
      Todos os meses
    </label>
  `;

  meses.forEach((nome, i) => {
    divMeses.innerHTML += `
      <label style="display:inline-block;width:45%">
        <input type="checkbox" class="filtro-mes-auto" value="${i+1}" checked>
        ${nome}
      </label>`;
  });

  menuFiltros.appendChild(divMeses);

  adicionarEventos();
}

// ===================== EVENTOS =====================
function adicionarEventos() {

  // Evento geral
  document.querySelectorAll('.period-menu input')
    .forEach(input => {
      input.addEventListener('change', atualizarDashboard);
    });

  // 🔥 LÓGICA DO TODOS OS MESES
  const todosMeses = document.getElementById('todosMeses');
  const mesesCheckbox = document.querySelectorAll('.filtro-mes-auto');

  todosMeses.addEventListener('change', () => {
    mesesCheckbox.forEach(cb => cb.checked = todosMeses.checked);
    atualizarDashboard();
  });

  mesesCheckbox.forEach(cb => {
    cb.addEventListener('change', () => {
      const marcados = Array.from(mesesCheckbox).filter(m => m.checked);
      todosMeses.checked = marcados.length === mesesCheckbox.length;
      atualizarDashboard();
    });
  });

  periodSelected.addEventListener('click', (e) => {
    e.stopPropagation();
    menuFiltros.style.display =
      menuFiltros.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!periodDropdown.contains(e.target)) {
      menuFiltros.style.display = 'none';
    }
  });

  btnReset.addEventListener('click', () => {

  // Marca todos os checkboxes
  document.querySelectorAll('input[type="checkbox"]')
    .forEach(cb => cb.checked = true);

  atualizarTextoSetor();
  atualizarDashboard();
});
  

  // Abrir / fechar dropdown setor
setorSelected.addEventListener('click', (e) => {
  e.stopPropagation();
  setorDropdown.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!setorDropdown.contains(e.target)) {
    setorDropdown.classList.remove('open');
  }
});

// Atualizar ao mudar setor
document.querySelectorAll('.filtro-setor-auto')
  .forEach(cb => {
    cb.addEventListener('change', () => {
      atualizarTextoSetor();
      atualizarDashboard();
    });
  });
}

// ===================== LER FILTROS =====================
function lerFiltrosAtivos() {

  const anos = Array.from(
    document.querySelectorAll('.filtro-ano-auto:checked')
  ).map(cb => cb.value);

  const meses = Array.from(
    document.querySelectorAll('.filtro-mes-auto:checked')
  ).map(cb => cb.value);

const setores = Array.from(
  document.querySelectorAll('.filtro-setor-auto:checked')
).map(cb => cb.value);

return { anos, meses, setores };
}

// ===================== KPIs =====================
function atualizarKPIs(dados) {

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  set('totalQtd', dados.length);
  set('clientesAtingidos', window.countUnique(dados, 'cliente'));
  set('totalClientes', window.countUnique(dados, 'cliente'));
  set('totalSetores', window.countUnique(dados, 'setor'));

  const totalValor = window.sumBy(dados, 'valor');
  const totalM3 = window.sumBy(dados, 'volume');

  set('totalValor', window.formatCurrency(totalValor));
  set('totalM3', window.formatNumber(totalM3) + " m³");

  const mediaValor = dados.length ? totalValor / dados.length : 0;
  set('mediaValor', window.formatCurrency(mediaValor));

  if (window.getTopFrequent) {
    set('topErroQtd', window.getTopFrequent(dados, 'erro'));
    set('topClienteNome', window.getTopFrequent(dados, 'cliente'));
    set('setorTop', window.getTopFrequent(dados, 'setor'));
  }
}

// ===================== GRÁFICOS =====================
function atualizarGraficos(dados) {

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const mesesSelecionados = lerFiltrosAtivos().meses.map(m => Number(m));

  console.log("Meses selecionados:", mesesSelecionados);
  console.log("Total dados recebidos:", dados.length);

  // 🔥 Se nenhum mês estiver marcado → limpa gráficos
  if (!mesesSelecionados.length) {
    renderBarChart('chartQtd', [], []);
    renderLineChart('chartVolume', [], []);
    renderBarChart('chartValor', [], []);
    renderHorizontalBarChart('chartClientes', [], []);
    renderBarChart('chartSetores', [], []);
    return;
  }

  const labelsMes = mesesSelecionados.map(m => meses[m - 1]);

  // ===================== QTD =====================
  const qtdMes = mesesSelecionados.map(m =>
    dados.filter(d => d.mesNum == m).length
  );

  renderBarChart('chartQtd', labelsMes, qtdMes, 'Reclamações');


  // ===================== VOLUME =====================
  const volMes = mesesSelecionados.map(m => {

    const soma = dados
      .filter(d => d.mesNum == m)
      .reduce((a, b) => a + (Number(b.volume) || 0), 0);

    return Number(soma.toFixed(3));

  });

  renderLineChart(
    'chartVolume',
    labelsMes,
    volMes,
    'Volume m³'
  );


  // ===================== VALOR =====================
  const valMes = mesesSelecionados.map(m => {

    const soma = dados
      .filter(d => d.mesNum == m)
      .reduce((a, b) => a + (Number(b.valor) || 0), 0);

    return Number(soma.toFixed(2));

  });

  console.log("Valores por mês:", valMes);

  renderBarChart(
    'chartValor',
    labelsMes,
    valMes,
    'Valor R$'
  );


  // ===================== CLIENTES =====================
  const cli = {};
  dados.forEach(d => {
    if (!d.cliente) return;
    cli[d.cliente] = (cli[d.cliente] || 0) + 1;
  });

  const top = Object.entries(cli)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  renderHorizontalBarChart(
    'chartClientes',
    top.map(t => t[0]),
    top.map(t => t[1]),
    'Top Clientes'
  );


  // ===================== SETORES =====================
  const setAgr = {};
  dados.forEach(d => {
    if (!d.setor) return;
    setAgr[d.setor] = (setAgr[d.setor] || 0) + 1;
  });

  const setoresLabels = Object.keys(setAgr);
  const setoresValores = Object.values(setAgr);

  if (!setoresLabels.length) {
    renderBarChart('chartSetores', ['Sem dados'], [0], 'Setores');
  } else {
    renderBarChart('chartSetores', setoresLabels, setoresValores, 'Setores');
  }

}
// ===================== INÍCIO =====================
document.addEventListener('DOMContentLoaded', () => {
  if (window.DADOS_RC) atualizarDashboard();
});

function atualizarTextoPeriodo() {
  const { anos, meses } = lerFiltrosAtivos();

  let textoAno = anos.length ? anos.join(", ") : "Nenhum ano";

  const nomesMeses = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  let textoMes;

  if (!meses.length) {
    textoMes = "Nenhum mês";
  } else if (meses.length === 12) {
    textoMes = "Todos os meses";
  } else if (meses.length === 1) {
    textoMes = nomesMeses[meses[0] - 1];
  } else if (meses.length <= 3) {
    textoMes = meses.map(m => nomesMeses[m - 1]).join(", ");
  } else {
    textoMes = meses.length + " meses";
  }

  periodSelected.innerHTML =
    `${textoAno} • ${textoMes} <span class="arrow">▾</span>`;
}

function atualizarTextoSetor() {

  const setores = Array.from(
    document.querySelectorAll('.filtro-setor-auto:checked')
  ).map(cb => cb.value);

  let texto;

  if (!setores.length) {
    texto = "Nenhum setor";
  } else if (setores.length === document.querySelectorAll('.filtro-setor-auto').length) {
    texto = "Todos os setores";
  } else if (setores.length <= 2) {
    texto = setores.join(", ");
  } else {
    texto = setores.length + " setores";
  }

  setorSelected.innerHTML =
    `${texto} <span class="arrow">▾</span>`;
}