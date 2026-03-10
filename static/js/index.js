
document.addEventListener('DOMContentLoaded', function () {
  const API_BASE = '/api';

  // Elementos
  const modalBackdrop = document.getElementById('modalReserva');
  const btnAbrirModal = document.getElementById('btnAbrirModal');
  const btnFecharModal = document.getElementById('btnFecharModal');
  const btnCancelarModal = document.getElementById('btnCancelarModal');
  const btnEnviar = document.getElementById('btnEnviarReserva');
  const btnAcessoInterno = document.getElementById('btnAcessoInterno');

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

  // Períodos
  const periodosPadrao = {
    INTEGRAL: { label: 'Integral (08h às 18h)', inicio: '08:00', fim: '18:00' },
    MANHA: { label: 'Manhã (08h às 12h)', inicio: '08:00', fim: '12:00' },
    TARDE: { label: 'Tarde (13h às 17h)', inicio: '13:00', fim: '17:00' },
    NOITE: { label: 'Noite (18h às 21h)', inicio: '18:00', fim: '21:00' }
  };

  const ambientesPadrao = {
    AUDITORIO: 'Auditório',
    CENTRO_OPERACOES: 'Centro de Operações',
    SALA_CRISE: 'Sala de Crise',
    SALA_REUNIOES: 'Sala de Reuniões'
  };

  let calendar = null;

  const AMBIENTE_PADRAO = 'AUDITORIO';
  
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
  // Buscar períodos livres para TODO o intervalo (data inicial -> data final)
  // =========================
  async function montarPeriodosLivresIntervalo() {
    selectPeriodo.innerHTML = '';
    selectPeriodo.disabled = true;

    const iniStr = inputDataInicio.value;
    const fimStr = inputDataFim.value || iniStr;

    if (!iniStr) {
      return;
    }

    const ini = new Date(iniStr + 'T00:00:00');
    const fim = new Date(fimStr + 'T00:00:00');

    if (isNaN(ini) || isNaN(fim)) {
      return;
    }

    if (fim < ini) {
      // o próprio código já trata isso nos eventos de change, aqui só garantimos
      return;
    }

    // Todos os IDs de período que o sistema conhece
    const todosIds = ['INTEGRAL', 'MANHA', 'TARDE', 'NOITE'];
    let disponiveis = new Set(todosIds);

    try {
      // percorre dia a dia do intervalo
      for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().slice(0, 10);

        const ambiente = (selectAmbienteReserva?.value || filtroAmbienteAgenda?.value || AMBIENTE_PADRAO).toUpperCase();
        const resp = await fetch(`${API_BASE}/periodos-livres?data=${iso}&ambiente=${encodeURIComponent(ambiente)}`);
        if (!resp.ok) {
          throw new Error('Erro ao consultar períodos livres');
        }
        const periodosDia = await resp.json();

        const livresDia = new Set((periodosDia || []).map(p => p.id));

        // interseção: só continua com os períodos que estão livres em TODOS os dias
        disponiveis = new Set(
          [...disponiveis].filter(id => livresDia.has(id))
        );

        // se em algum dia não sobrou nada, já pode parar
        if (disponiveis.size === 0) break;
      }

      if (disponiveis.size === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Nenhum horário disponível para todo o intervalo selecionado';
        selectPeriodo.appendChild(opt);
        return;
      }

      // monta as opções com base no periodosPadrao
      todosIds.forEach(id => {
        if (disponiveis.has(id)) {
          const conf = periodosPadrao[id];
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = conf ? conf.label : id;
          selectPeriodo.appendChild(opt);
        }
      });

      selectPeriodo.disabled = false;
    } catch (err) {
      console.error('Erro ao carregar períodos livres', err);
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Erro ao carregar períodos.';
      selectPeriodo.appendChild(opt);
    }
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
      const ambienteSelecionado = (filtroAmbienteAgenda?.value || AMBIENTE_PADRAO).toUpperCase();
      const resp = await fetch(`${API_BASE}/reservas-public?ambiente=${encodeURIComponent(ambienteSelecionado)}`);
      const reservas = await resp.json();

      if (!Array.isArray(reservas)) {
        console.warn('Resposta não é um array');
        return;
      }

      const events = reservas
        .filter(r => !['NEGADA', 'CANCELADA'].includes((r.status || '').toUpperCase()))
        .map(r => {
          const inicioISO = normalizarDataISO(r.data_evento);
          const fimISO = normalizarDataISO(r.data_fim || r.data_evento);

          if (!inicioISO) return null;

          const statusUpper = (r.status || '').toUpperCase();

          // 🔹 Função auxiliar pra normalizar o texto (remove acento, deixa maiúsculo, tira espaços)
          const normalizarTexto = (txt) =>
            (txt || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toUpperCase()
              .trim();

          // 🔹 Detecta se é o bloqueio interno "Em uso da Corporação"
          const isUsoCorp = normalizarTexto(r.finalidade).includes('EM USO DA CORPORACAO');

          // Cores padrão (aprovada = vermelho, pendente = amarelo)
          let cor;
          let textoCor;

          if (statusUpper === 'APROVADA') {
            // 🔴 Aprovada → vermelho, texto branco
            cor = '#c71c22';
            textoCor = '#ffffff';
          } else {
            // 🟡 Pendente → amarelo, texto escuro
            cor = '#f6c344';
            textoCor = '#111010ff';
          }

          // end exclusivo para eventos allDay
          const endExclusive = somarUmDia(fimISO);

          // Label do período
          const periodoLabel = periodosPadrao[r.periodo]?.label || r.periodo || '';
          const ambienteLabel = ambientesPadrao[r.ambiente] || r.ambiente || 'Auditório';

          // Título do evento
          let titulo;

          if (isUsoCorp) {
            // 🔵 Caso especial: uso interno da corporação
            titulo = `${ambienteLabel} – Em uso da Corporação` + (periodoLabel ? ` (${periodoLabel})` : '');
            cor = '#0d6efd';      // azul
            textoCor = '#ffffff'; // texto branco
          } else {
            // Comportamento normal
            titulo =
              `${ambienteLabel} – ${statusUpper === 'APROVADA' ? 'Confirmado' : 'Solicitado'} – ${r.instituicao}` +
              (periodoLabel ? ` (${periodoLabel})` : '');
          }

          // 🔹 Texto do tooltip (multi-linha)
          const tipoLabel = (r.tipo_solicitacao || '').toUpperCase() === 'EXTERNA'
            ? 'Externa'
            : 'Interna';

          // 🔹 Função para converter YYYY-MM-DD → DD/MM/YYYY
          const formatarDataBR = (iso) => {
            if (!iso) return '';
            const partes = iso.split('-');
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
          };

          const dataIniBR = inicioISO ? formatarDataBRFromISO(inicioISO) : null;
          const dataFimBR = fimISO ? formatarDataBRFromISO(fimISO) : null;


          const linhasTooltip = [
            `Status: ${statusUpper === 'APROVADA' ? 'Confirmado' : 'Solicitado'}`,
            `Tipo: ${tipoLabel}`,
            r.instituicao ? `Instituição: ${r.instituicao}` : null,
            r.responsavel ? `Responsável: ${r.responsavel}` : null,
            `Ambiente: ${ambienteLabel}`,
            periodoLabel ? `Período: ${periodoLabel}` : null,
            dataIniBR ? `Data inicial: ${dataIniBR}` : null,
            dataFimBR ? `Data final: ${dataFimBR}` : null
          ].filter(Boolean);


          const tooltipText = linhasTooltip.join('\n');

          return {
            title: titulo,
            start: inicioISO,
            end: endExclusive,
            allDay: true,
            display: 'block',
            color: cor,
            textColor: textoCor,
            extendedProps: {
              tooltip: tooltipText
            }
          };
        })
        .filter(Boolean);

      calendar.removeAllEvents();
      calendar.addEventSource(events);
    } catch (err) {
      console.error('Erro ao carregar reservas', err);
    }
  }



  carregarReservasNoCalendario();

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

  if (btnAcessoInterno) {
    btnAcessoInterno.addEventListener('click', () =>
      window.location.href = '/login.html'
    );
  }

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
