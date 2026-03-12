const API_BASE = '/api';
// ESTADO GLOBAL
let calendar = null;
let periodosSistema = [];

document.addEventListener('DOMContentLoaded', async function () {

  await carregarAmbientes();
  await carregarPeriodos();

  carregarReservasNoCalendario();

  // Elementos
  const modalBackdrop = document.getElementById('modalReserva');
  const btnAbrirModal = document.getElementById('btnAbrirModal');
  const btnFecharModal = document.getElementById('btnFecharModal');
  const btnCancelarModal = document.getElementById('btnCancelarModal');
  const btnEnviar = document.getElementById('btnEnviarReserva');
  // const btnAcessoInterno = document.getElementById('btnAcessoInterno');

  const inputDataInicio = document.getElementById('inputDataInicio');
  const inputDataFim = document.getElementById('inputDataFim');
  const selectPeriodo = document.getElementById('selectPeriodo');
  const selectAmbienteReserva = document.getElementById('selectAmbienteReserva');
  const filtroAmbienteAgenda = document.getElementById('filtroAmbienteAgenda');

  // Modal Termos
  const modalTermos = document.getElementById('modalTermos');
  const chkAceitoTermos = document.getElementById('chkAceitoTermos');
  const btnConfirmarTermos = document.getElementById('btnConfirmarTermos');
  const btnCancelarTermos = document.getElementById('btnCancelarTermos');
  const btnFecharTermos = document.getElementById('btnFecharTermos');

  // Datas mínimas
  const hojeISO = new Date().toISOString().slice(0, 10);
  inputDataInicio.min = hojeISO;
  inputDataFim.min = hojeISO;


  const ambientesPadrao = {
    AUDITORIO: 'Auditório',
    CENTRO_OPERACOES: 'Centro de Operações',
    SALA_CRISE: 'Sala de Crise',
    SALA_REUNIOES: 'Sala de Reuniões'
  };

  const AMBIENTE_PADRAO = '1';
  
  
  // =========================
  // Modais
  // =========================
  function abrirModalReserva(dataISO) {
    modalBackdrop.style.display = 'flex';
    const dataEscolhida = dataISO || hojeISO;
    if (selectAmbienteReserva && filtroAmbienteAgenda) {
      selectAmbienteReserva.value = filtroAmbienteAgenda.value || AMBIENTE_PADRAO;
    }
    inputDataInicio.value = dataEscolhida;
    inputDataFim.value = dataEscolhida;
    montarPeriodosLivresIntervalo();
  }

  function fecharModalReserva() {
    modalBackdrop.style.display = 'none';
  }

  function abrirModalTermos() {
    chkAceitoTermos.checked = false;
    btnConfirmarTermos.disabled = true;
    modalTermos.style.display = 'flex';
  }

  function fecharModalTermos() {
    modalTermos.style.display = 'none';
  }

  // =========================
  // Carrega Períodos
  // =========================
  async function carregarPeriodos() {

    const resp = await fetch('/api/periodos');
    periodosSistema = await resp.json();
  }


  // =========================
  // Carrega Ambientes para o select do formulário e do filtro
  // =========================
  async function carregarAmbientes() {

    const resp = await fetch('/api/ambientes');
    const ambientes = await resp.json();

    const selects = [
      document.getElementById('selectAmbienteReserva'),
      document.getElementById('filtroAmbienteAgenda')
    ];

    selects.forEach(select => {
      if (!select) return;

      select.innerHTML = '';

      ambientes.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.nome;
        select.appendChild(opt);
      });
    });
  }

  // =========================
  // Buscar períodos livres para TODO o intervalo (data inicial -> data final)
  // =========================
  async function montarPeriodosLivresIntervalo() {

    selectPeriodo.innerHTML = '';
    selectPeriodo.disabled = true;

    const data_inicio = inputDataInicio.value;
    const data_fim = inputDataFim.value || data_inicio;

    const ambiente = selectAmbienteReserva.value;

    const resp = await fetch(
      `/api/periodos-livres-intervalo?data_inicio=${data_inicio}&data_fim=${data_fim}&ambiente=${ambiente}`
    );

    const dados = await resp.json();

    const livres = dados.periodos || [];

    if (!livres.length) {

      const opt = document.createElement('option');
      opt.textContent = 'Nenhum horário disponível para o intervalo';
      selectPeriodo.appendChild(opt);

      return;
    }

    livres.forEach(id => {

      const periodo = periodosSistema.find(p => p.id === id);

      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = periodo.label;

      selectPeriodo.appendChild(opt);

    });

    selectPeriodo.disabled = false;
  }
 
  
  // =========================
  // Calendário
  // =========================
  function normalizarDataISO(valor) {
    if (!valor) return null;
    if (typeof valor === 'string') {
      return valor.slice(0, 10);
    }
    const d = new Date(valor);
    return d.toISOString().slice(0, 10);
  }

  function somarUmDia(isoDate) {
    if (!isoDate) return null;
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }


  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    height: '100%',        // ocupa 100% do #calendar
    contentHeight: '100%',
    expandRows: true,
    buttonText: { today: 'Hoje' },

    dateClick: function (info) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataClicada = new Date(info.dateStr + 'T00:00:00');

      if (dataClicada < hoje) {
        alert('Não é permitido solicitar reserva para datas já passadas.');
        return;
      }

      abrirModalReserva(info.dateStr);
    },

    // 🔹 Tooltip nativo usando extendedProps.tooltip
    eventDidMount: function (info) {
      const tooltip = info.event.extendedProps && info.event.extendedProps.tooltip;
      if (tooltip) {
        info.el.setAttribute('title', tooltip);
      }
    },

    events: []
  });

  calendar.render();

  function formatarDataBRFromISO(iso) {
    if (!iso) return '';

    const d = new Date(iso);
    if (isNaN(d)) return iso; // fallback caso venha inválido

    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
  }


  async function carregarReservasNoCalendario() {

    try {

      const ambiente = document.getElementById("filtroAmbienteAgenda").value;

      const resp = await fetch(`/api/reservas-public?ambiente=${ambiente}`);
      const eventos = await resp.json();

      calendar.removeAllEvents();
      calendar.addEventSource(eventos);

    } catch (err) {
      console.error("Erro ao carregar reservas", err);
    }
  }


  // =========================
  // Envio da solicitação
  // =========================
  async function enviarSolicitacao() {
    const form = document.getElementById('formReserva');
    const formData = new FormData(form);

    const ini = inputDataInicio.value;
    const fim = inputDataFim.value;

    if (fim < ini) {
      alert('A data final não pode ser anterior à data inicial.');
      return;
    } 

    // 🔹 NOVO: regra de anexo obrigatório para solicitações EXTERNAS
    const tipo = (formData.get('tipo_solicitacao') || '').toUpperCase();
    const inputAnexo = document.getElementById('anexo_edocs'); // ajuste o ID se o seu for diferente
    const temArquivo = inputAnexo && inputAnexo.files && inputAnexo.files.length > 0;

    if (tipo === 'EXTERNA' && !temArquivo) {
      alert('Para solicitações EXTERNAS é OBRIGATÓRIO anexar o ARQUIVO EDOCs antes de confirmar a solicitação.');
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/reservas`, {
        method: 'POST',
        body: formData
      });

      const resposta = await resp.json();

      if (resp.status === 201) {
        alert('Solicitação registrada com SUCESSO! Seu pedido será analisado pelo CBMES e você recebera o email assim que a análise for realizada.');

        const dIni = formData.get('data_evento');
        const dFim = formData.get('data_fim');

        form.reset();

        if (dIni) inputDataInicio.value = dIni;
        if (dFim) {
          inputDataFim.value = dFim;
        } else if (dIni) {
          inputDataFim.value = dIni;
        }

        // Recalcula períodos livres para o intervalo atual
        montarPeriodosLivresIntervalo();   // ✅ usa a função nova

        fecharModalReserva();
        carregarReservasNoCalendario();
      } else {
        alert(resposta.error || 'Erro ao salvar a solicitação.');
      }

    } catch (err) {
      console.error(err);
      alert('Erro de comunicação com o servidor. Tente novamente mais tarde.');
    }
  }


  // =========================
  // Eventos de UI
  // =========================

  // Botão "Enviar solicitação" agora abre o modal de termos
  btnEnviar.addEventListener('click', () => {
    const form = document.getElementById('formReserva');
    // valida campos obrigatórios
    if (!form.reportValidity()) return;

    const ini = inputDataInicio.value;
    const fim = inputDataFim.value;
    if (fim < ini) {
      alert('A data final não pode ser anterior à data inicial.');
      return;
    }

    abrirModalTermos();
  });

  // Termos: checkbox habilita/desabilita botão
  chkAceitoTermos.addEventListener('change', (e) => {
    btnConfirmarTermos.disabled = !e.target.checked;
  });

  // Confirmar termos -> envia solicitação
  btnConfirmarTermos.addEventListener('click', () => {
    fecharModalTermos();
    enviarSolicitacao();
  });

  // Botões de fechar/cancelar dos modais
  btnAbrirModal.addEventListener('click', () => abrirModalReserva());
  btnFecharModal.addEventListener('click', fecharModalReserva);
  btnCancelarModal.addEventListener('click', fecharModalReserva);

  btnCancelarTermos.addEventListener('click', fecharModalTermos);
  btnFecharTermos.addEventListener('click', fecharModalTermos);

  modalBackdrop.addEventListener('click', e => {
    if (e.target === modalBackdrop) fecharModalReserva();
  });

  modalTermos.addEventListener('click', e => {
    if (e.target === modalTermos) fecharModalTermos();
  });

// btnAcessoInterno.addEventListener('click', () => {
//   window.location.href = btnAcessoInterno.dataset.url;
// });

  if (selectAmbienteReserva) {
    selectAmbienteReserva.addEventListener('change', () => {
      montarPeriodosLivresIntervalo();
    });
  }

  if (filtroAmbienteAgenda) {
    filtroAmbienteAgenda.addEventListener('change', () => {
      carregarReservasNoCalendario();
    });
  }

  inputDataInicio.addEventListener('change', e => {
    const ini = e.target.value;
    if (inputDataFim.value && inputDataFim.value < ini) {
      inputDataFim.value = ini;
    }
    montarPeriodosLivresIntervalo();
  });


  inputDataFim.addEventListener('change', e => {
    const fim = e.target.value;
    const ini = inputDataInicio.value || fim;

    if (fim < ini) {
      alert('A data final não pode ser anterior à data inicial.');
      inputDataFim.value = ini;
    }

    montarPeriodosLivresIntervalo();
  });

});
