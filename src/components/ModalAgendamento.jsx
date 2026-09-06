import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, User, Clock, DollarSign, Sparkles, AlertTriangle, Users, Repeat } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../utils/calendar';
import { generateRecurrenceDates, toDatetimeLocalString } from '../utils/recurrence';
import { formatCurrency } from '../utils/formatters';

export const ModalAgendamento = ({ 
  isOpen, 
  onClose, 
  agendamentoEdicao = null,
  dadosIniciais = null
}) => {
  const { 
    clientes, 
    agendamentos,
    ajudantes, 
    planos, 
    regras, 
    addAgendamento, 
    addAgendamentosMultiplos,
    updateAgendamento, 
    showToast 
  } = useApp();

  // É edição real apenas se existir ID cadastrado no banco
  const isEdicao = Boolean(agendamentoEdicao && agendamentoEdicao.id);
  const dadosIniciaisEfetivos = dadosIniciais || (!isEdicao && agendamentoEdicao ? agendamentoEdicao : null);

  const [clienteId, setClienteId] = useState('');
  const [planoId, setPlanoId] = useState('plano-quinzenal');
  const [dataHoraInicio, setDataHoraInicio] = useState('');
  const [dataHoraFim, setDataHoraFim] = useState('');
  const [dormitorios, setDormitorios] = useState(2);
  const [semManutencao, setSemManutencao] = useState(false);
  const [valorCliente, setValorCliente] = useState(190);
  const [statusClientePagamento, setStatusClientePagamento] = useState('pendente');
  const [formaPagamentoCliente, setFormaPagamentoCliente] = useState('PIX');
  const [statusServico, setStatusServico] = useState('confirmado');
  const [observacoes, setObservacoes] = useState('');
  const [ajudantesSelecionadas, setAjudantesSelecionadas] = useState([]);

  // Recorrência / Programação do Mês Todo
  const [agendarMesTodo, setAgendarMesTodo] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState('semanal'); // 'semanal' | 'quinzenal' | 'mensal'
  const [limiteRecorrencia, setLimiteRecorrencia] = useState('fim_mes'); // 'fim_mes' | '4_semanas' | '8_semanas'
  const [datasRecorrentes, setDatasRecorrentes] = useState([]);

  // Inicialização ao abrir modal
  useEffect(() => {
    if (!isOpen) return;

    if (isEdicao) {
      setClienteId(agendamentoEdicao.clienteId || '');
      setPlanoId(agendamentoEdicao.planoId || 'plano-quinzenal');
      setDataHoraInicio(agendamentoEdicao.dataHoraInicio || '');
      setDataHoraFim(agendamentoEdicao.dataHoraFim || '');
      setDormitorios(agendamentoEdicao.dormitorios || 2);
      setSemManutencao(agendamentoEdicao.semManutencao2Meses || false);
      setValorCliente(agendamentoEdicao.valorCliente || 190);
      setStatusClientePagamento(agendamentoEdicao.statusClientePagamento || 'pendente');
      setFormaPagamentoCliente(agendamentoEdicao.formaPagamentoCliente || 'PIX');
      setStatusServico(agendamentoEdicao.statusServico || 'confirmado');
      setObservacoes(agendamentoEdicao.observacoes || '');
      setAjudantesSelecionadas(agendamentoEdicao.ajudantesEscaladas || []);
      setAgendarMesTodo(false);
    } else {
      // Novo agendamento (pode vir pré-definido pelo botão Agendar da tela de Clientes)
      const cId = dadosIniciaisEfetivos?.clienteId || (clientes.length > 0 ? clientes[0].id : '');
      const cli = clientes.find(c => c.id === cId);

      const dormsInit = dadosIniciaisEfetivos?.dormitorios || cli?.dormitorios || 2;
      const planoInit = dadosIniciaisEfetivos?.planoId || cli?.planoPadraoId || 'plano-quinzenal';
      const semManutInit = dadosIniciaisEfetivos?.semManutencao2Meses || false;

      // CÁLCULO PRECISO DO VALOR:
      // Se o cliente tem valor fixo acordado, PREENCHE O VALOR ACORDADO AUTOMATICAMENTE!
      let valorInit = 190;
      if (cli?.valorFechado !== null && cli?.valorFechado !== undefined && Number(cli?.valorFechado) > 0) {
        valorInit = Number(cli.valorFechado);
      } else if (dadosIniciaisEfetivos?.valorCliente !== null && dadosIniciaisEfetivos?.valorCliente !== undefined && Number(dadosIniciaisEfetivos?.valorCliente) > 0) {
        valorInit = Number(dadosIniciaisEfetivos.valorCliente);
      } else {
        const pObj = planos.find(p => p.id === planoInit) || planos[0];
        let total = pObj ? pObj.valorBase : 190;
        if (dormsInit > 2 && planoInit !== 'plano-customizado' && planoInit !== 'plano-comercial-pj') {
          total += (dormsInit - 2) * (regras?.acrescimoPorQuartoExtra || 30);
        }
        if (semManutInit) {
          total += (regras?.taxaSemManutencao2Meses || 50);
        }
        valorInit = total;
      }

      // Horário inicial
      let inicio = '';
      let fim = '';
      if (dadosIniciaisEfetivos?.dataHoraInicio) {
        inicio = dadosIniciaisEfetivos.dataHoraInicio;
        fim = dadosIniciaisEfetivos.dataHoraFim || '';
      } else {
        // Verifica se cliente já tem histórico de agendamentos para manter mesmo dia da semana e horário habitual
        const agsCli = agendamentos.filter(a => a.clienteId === cId);
        const ultimoAg = agsCli.sort((a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio))[0];

        const agora = new Date();
        agora.setMinutes(0, 0, 0);

        if (ultimoAg?.dataHoraInicio) {
          const uDate = new Date(ultimoAg.dataHoraInicio);
          const horaHabitual = uDate.getHours();
          const minutoHabitual = uDate.getMinutes();
          const diaSemanaHabitual = uDate.getDay();

          const prox = new Date(agora);
          prox.setHours(horaHabitual, minutoHabitual, 0, 0);
          let diasAte = (diaSemanaHabitual - agora.getDay() + 7) % 7;
          if (diasAte === 0 && prox.getTime() <= agora.getTime()) {
            diasAte = 7;
          }
          prox.setDate(prox.getDate() + diasAte);
          inicio = toDatetimeLocalString(prox);
          const proxFim = new Date(prox.getTime() + 4 * 60 * 60 * 1000);
          fim = toDatetimeLocalString(proxFim);
        } else {
          agora.setHours(agora.getHours() + 2);
          inicio = toDatetimeLocalString(agora);
          const fimDate = new Date(agora.getTime() + 4 * 60 * 60 * 1000);
          fim = toDatetimeLocalString(fimDate);
        }
      }

      setClienteId(cId);
      setPlanoId(planoInit);
      setDataHoraInicio(inicio);
      setDataHoraFim(fim);
      setDormitorios(dormsInit);
      setSemManutencao(semManutInit);
      setValorCliente(valorInit);
      setStatusClientePagamento(dadosIniciaisEfetivos?.statusClientePagamento || 'pendente');
      setFormaPagamentoCliente(dadosIniciaisEfetivos?.formaPagamentoCliente || 'PIX');
      setStatusServico(dadosIniciaisEfetivos?.statusServico || 'confirmado');
      setObservacoes(dadosIniciaisEfetivos?.observacoes || '');

      // Recorrência
      let recTipo = 'semanal';
      if (planoInit.includes('quinzenal')) recTipo = 'quinzenal';
      else if (planoInit.includes('mensal')) recTipo = 'mensal';
      else if (planoInit.includes('semanal')) recTipo = 'semanal';
      setTipoRecorrencia(recTipo);
      setLimiteRecorrencia('fim_mes');

      // Se for plano regular, já deixa o mês todo ativado para visualização e agendamento instantâneo!
      const isPlanoRec = planoInit.includes('semanal') || planoInit.includes('quinzenal') || planoInit.includes('mensal');
      setAgendarMesTodo(isPlanoRec);

      // Ajudantes: seleciona ajudantes habituais do cliente se existirem
      const agsCli = agendamentos.filter(a => a.clienteId === cId);
      const ultimoAg = agsCli.sort((a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio))[0];

      if (ultimoAg && ultimoAg.ajudantesEscaladas && ultimoAg.ajudantesEscaladas.length > 0) {
        setAjudantesSelecionadas(ultimoAg.ajudantesEscaladas.map(a => ({ ...a, statusPagamento: 'pendente' })));
      } else if (ajudantes.length >= 2) {
        setAjudantesSelecionadas([
          { ajudanteId: ajudantes[0].id, tipo: 'diaria', valorAPagar: ajudantes[0].valorPadrao || 85, statusPagamento: 'pendente' },
          { ajudanteId: ajudantes[1].id, tipo: 'diaria', valorAPagar: ajudantes[1].valorPadrao || 85, statusPagamento: 'pendente' }
        ]);
      } else if (ajudantes.length === 1) {
        setAjudantesSelecionadas([
          { ajudanteId: ajudantes[0].id, tipo: 'diaria', valorAPagar: ajudantes[0].valorPadrao || 85, statusPagamento: 'pendente' }
        ]);
      } else {
        setAjudantesSelecionadas([]);
      }
    }
  }, [isOpen, agendamentoEdicao, dadosIniciais, isEdicao, clientes, agendamentos, ajudantes, planos, regras]);

  // Recálculo automático do valor do cliente conforme plano e adicionais
  const recalcularValor = (pId, numDorms, semManut, cId = clienteId) => {
    const cli = clientes.find(c => c.id === cId);
    // Se o cliente possui um valor fixo/acordado cadastrado, mantém o valor fechado
    if (cli?.valorFechado !== null && cli?.valorFechado !== undefined && Number(cli?.valorFechado) > 0) {
      setValorCliente(Number(cli.valorFechado));
      return;
    }

    const plano = planos.find(p => p.id === pId) || planos[0];
    let total = plano ? plano.valorBase : 190;

    // +R$ 30 se 3 ou mais quartos para planos padrão
    if (numDorms > 2 && pId !== 'plano-customizado' && pId !== 'plano-comercial-pj') {
      total += (numDorms - 2) * regras.acrescimoPorQuartoExtra;
    }

    // +R$ 50 se sem manutenção há mais de 2 meses
    if (semManut) {
      total += regras.taxaSemManutencao2Meses;
    }

    setValorCliente(total);
  };

  const handlePlanoChange = (e) => {
    const newId = e.target.value;
    setPlanoId(newId);

    // Ajusta tipo de recorrência automaticamente com base no plano
    if (newId.includes('semanal')) {
      setTipoRecorrencia('semanal');
      setAgendarMesTodo(true);
    } else if (newId.includes('quinzenal')) {
      setTipoRecorrencia('quinzenal');
      setAgendarMesTodo(true);
    } else if (newId.includes('mensal')) {
      setTipoRecorrencia('mensal');
      setAgendarMesTodo(true);
    }

    const cli = clientes.find(c => c.id === clienteId);
    if (cli?.valorFechado !== null && cli?.valorFechado !== undefined && Number(cli?.valorFechado) > 0) {
      setValorCliente(Number(cli.valorFechado));
    } else {
      recalcularValor(newId, dormitorios, semManutencao);
    }
  };

  const handleDormitoriosChange = (e) => {
    const dorms = Number(e.target.value);
    setDormitorios(dorms);
    recalcularValor(planoId, dorms, semManutencao);
  };

  const handleSemManutencaoChange = (e) => {
    const checked = e.target.checked;
    setSemManutencao(checked);
    recalcularValor(planoId, dormitorios, checked);
  };

  const handleClienteChange = (e) => {
    const cId = e.target.value;
    setClienteId(cId);
    const cli = clientes.find(c => c.id === cId);
    if (cli) {
      const dorms = cli.dormitorios || 2;
      const planoCli = cli.planoPadraoId || planoId;
      setDormitorios(dorms);
      setPlanoId(planoCli);

      // Ajusta tipo de recorrência automaticamente com base no plano do cliente
      let recTipo = 'semanal';
      if (planoCli.includes('quinzenal')) recTipo = 'quinzenal';
      else if (planoCli.includes('mensal')) recTipo = 'mensal';
      else if (planoCli.includes('semanal')) recTipo = 'semanal';
      setTipoRecorrencia(recTipo);

      // Se for plano regular, já ativa a opção de programar o mês
      const isPlanoRec = planoCli.includes('semanal') || planoCli.includes('quinzenal') || planoCli.includes('mensal');
      setAgendarMesTodo(isPlanoRec);

      // Preenche o valor acordado com prioridade máxima
      if (cli.valorFechado !== null && cli.valorFechado !== undefined && Number(cli.valorFechado) > 0) {
        setValorCliente(Number(cli.valorFechado));
      } else {
        recalcularValor(planoCli, dorms, semManutencao, cId);
      }

      // Reaproveita ajudantes habituais do cliente se houver
      const agsCli = agendamentos.filter(a => a.clienteId === cId);
      const ultimoAg = agsCli.sort((a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio))[0];
      if (ultimoAg && ultimoAg.ajudantesEscaladas && ultimoAg.ajudantesEscaladas.length > 0) {
        setAjudantesSelecionadas(ultimoAg.ajudantesEscaladas.map(a => ({ ...a, statusPagamento: 'pendente' })));
      }
    }
  };

  // Recalcular datas da recorrência quando parâmetros mudam
  useEffect(() => {
    if (!isEdicao && agendarMesTodo && dataHoraInicio) {
      try {
        const datas = generateRecurrenceDates({
          dataHoraInicio,
          dataHoraFim,
          tipoRecorrencia,
          limiteTipo: limiteRecorrencia
        });
        setDatasRecorrentes(datas);
      } catch (err) {
        console.error('Erro ao gerar datas recorrentes:', err);
      }
    } else if (!agendarMesTodo) {
      setDatasRecorrentes([]);
    }
  }, [agendarMesTodo, dataHoraInicio, dataHoraFim, tipoRecorrencia, limiteRecorrencia, isEdicao]);

  const toggleDataRecorrente = (index) => {
    setDatasRecorrentes(prev => prev.map((item, idx) => 
      idx === index ? { ...item, selecionada: !item.selecionada } : item
    ));
  };

  const toggleAjudante = (ajudanteId) => {
    const exists = ajudantesSelecionadas.find(a => a.ajudanteId === ajudanteId);
    if (exists) {
      setAjudantesSelecionadas(prev => prev.filter(a => a.ajudanteId !== ajudanteId));
    } else {
      const aj = ajudantes.find(a => a.id === ajudanteId);
      const valorBase = aj ? aj.valorPadrao : 85;
      setAjudantesSelecionadas(prev => [
        ...prev, 
        { ajudanteId, tipo: aj?.tipoRemuneracao || 'diaria', valorAPagar: valorBase, statusPagamento: 'pendente' }
      ]);
    }
  };

  const handleValorAjudanteChange = (ajudanteId, valor) => {
    setAjudantesSelecionadas(prev => prev.map(a => 
      a.ajudanteId === ajudanteId ? { ...a, valorAPagar: Number(valor) } : a
    ));
  };

  const handleSubmit = (e, openGoogleCalendar = false) => {
    e.preventDefault();
    if (!clienteId) {
      showToast('Por favor, selecione um cliente.', 'danger');
      return;
    }
    if (!dataHoraInicio) {
      showToast('Defina a data e horário da faxina.', 'danger');
      return;
    }

    // Se optou por agendar o mês todo / recorrente em um novo agendamento
    if (agendarMesTodo && !isEdicao && datasRecorrentes.length > 0) {
      const selecionadas = datasRecorrentes.filter(d => d.selecionada);
      if (selecionadas.length === 0) {
        showToast('Selecione pelo menos uma data para agendar.', 'danger');
        return;
      }

      const listaPayloads = selecionadas.map(d => ({
        clienteId,
        planoId,
        dataHoraInicio: d.dataHoraInicio,
        dataHoraFim: d.dataHoraFim || d.dataHoraInicio,
        dormitorios,
        semManutencao2Meses: semManutencao,
        valorCliente: Number(valorCliente),
        statusClientePagamento,
        formaPagamentoCliente,
        statusServico,
        observacoes,
        ajudantesEscaladas: ajudantesSelecionadas.map(a => ({ ...a }))
      }));

      addAgendamentosMultiplos(listaPayloads);
      showToast(`🎉 ${listaPayloads.length} faxinas agendadas com sucesso para o mês todo!`, 'success');

      if (openGoogleCalendar && listaPayloads.length > 0) {
        const clienteObj = clientes.find(c => c.id === clienteId);
        const planoObj = planos.find(p => p.id === planoId);
        const nomesAjudantes = ajudantesSelecionadas
          .map(a => ajudantes.find(aj => aj.id === a.ajudanteId)?.nome)
          .filter(Boolean);

        const url = generateGoogleCalendarUrl(listaPayloads[0], clienteObj, planoObj, nomesAjudantes);
        window.open(url, '_blank');
      }

      onClose();
      return;
    }

    const payload = {
      clienteId,
      planoId,
      dataHoraInicio,
      dataHoraFim: dataHoraFim || dataHoraInicio,
      dormitorios,
      semManutencao2Meses: semManutencao,
      valorCliente: Number(valorCliente),
      statusClientePagamento,
      formaPagamentoCliente,
      statusServico,
      observacoes,
      ajudantesEscaladas: ajudantesSelecionadas
    };

    let savedAgendamento;
    if (isEdicao) {
      updateAgendamento(agendamentoEdicao.id, payload);
      savedAgendamento = { ...agendamentoEdicao, ...payload };
    } else {
      savedAgendamento = addAgendamento(payload);
    }

    if (openGoogleCalendar) {
      const clienteObj = clientes.find(c => c.id === clienteId);
      const planoObj = planos.find(p => p.id === planoId);
      const nomesAjudantes = ajudantesSelecionadas
        .map(a => ajudantes.find(aj => aj.id === a.ajudanteId)?.nome)
        .filter(Boolean);

      const url = generateGoogleCalendarUrl(savedAgendamento, clienteObj, planoObj, nomesAjudantes);
      window.open(url, '_blank');
      showToast('Google Agenda aberto em nova aba!');
    }

    onClose();
  };

  if (!isOpen) return null;

  const clienteSelecionado = clientes.find(c => c.id === clienteId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Calendar size={20} color="var(--primary-400)" />
            <h3 style={{ fontSize: '1.125rem' }}>
              {isEdicao ? 'Editar Faxina' : 'Novo Agendamento de Faxina'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={e => handleSubmit(e, false)}>
          <div className="modal-body">
            {/* Seleção do Cliente */}
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select 
                className="form-select" 
                value={clienteId} 
                onChange={handleClienteChange}
                required
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.status === 'inativo' ? '⚠️ [INATIVO] ' : ''}
                    {c.tipoCliente === 'PJ' ? '🏢 [PJ] ' : ''}
                    {c.emiteNF ? '📄 [NF] ' : ''}
                    {c.nome} {c.condominio ? `• ${c.condominio}` : ''} {c.torre ? `(${c.torre} - ${c.apartamento})` : c.apartamento ? `(${c.apartamento})` : ''} - {c.bairro}
                    {c.valorFechado ? ` [Valor Fixo: R$ ${c.valorFechado}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Aviso em Destaque de Nota Fiscal (NF) & PJ */}
            {clienteSelecionado && (clienteSelecionado.emiteNF || clienteSelecionado.tipoCliente === 'PJ') && (
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📄</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>CLIENTE PJ / ESCRITÓRIO - EMITIR NOTA FISCAL (NF)</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {clienteSelecionado.cnpj ? `CNPJ: ${clienteSelecionado.cnpj}` : 'CNPJ não informado'}
                      {clienteSelecionado.razaoSocial ? ` • Razão: ${clienteSelecionado.razaoSocial}` : ''}
                      {clienteSelecionado.emailFaturamento ? ` • Email NF: ${clienteSelecionado.emailFaturamento}` : ''}
                    </div>
                  </div>
                </div>
                <span className="badge badge-purple" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#f3e8ff', border: '1px solid rgba(168, 85, 247, 0.45)', fontSize: '0.75rem' }}>
                  Emitir NF
                </span>
              </div>
            )}

            {/* Plano de Faxina */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Plano de Faxina *</label>
                <select 
                  className="form-select" 
                  value={planoId} 
                  onChange={handlePlanoChange}
                >
                  {planos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.valorBase > 0 ? `(R$ ${p.valorBase},00)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {clienteSelecionado?.tipoCliente === 'PJ' ? 'Salas / Ambientes' : 'Dormitórios'}
                </label>
                <select 
                  className="form-select" 
                  value={dormitorios} 
                  onChange={handleDormitoriosChange}
                >
                  <option value={1}>{clienteSelecionado?.tipoCliente === 'PJ' ? '1 Sala / Recepção' : '1 Dormitório'}</option>
                  <option value={2}>{clienteSelecionado?.tipoCliente === 'PJ' ? '2 Salas (Padrão)' : '2 Dormitórios (Padrão)'}</option>
                  <option value={3}>{clienteSelecionado?.tipoCliente === 'PJ' ? '3 Salas (+R$ 30,00)' : '3 Dormitórios (+R$ 30,00)'}</option>
                  <option value={4}>{clienteSelecionado?.tipoCliente === 'PJ' ? '4 Salas ou mais (+R$ 60,00)' : '4 Dormitórios (+R$ 60,00)'}</option>
                </select>
              </div>
            </div>

            {/* Checkbox Sem Manutenção */}
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.08)', 
              border: '1px solid rgba(245, 158, 11, 0.25)', 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <input 
                type="checkbox" 
                id="semManut" 
                checked={semManutencao} 
                onChange={handleSemManutencaoChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
              />
              <label htmlFor="semManut" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <strong>Apartamento sem faxina há mais de 2 meses?</strong> (+R$ 50,00 adicional)
              </label>
            </div>

            {/* Data e Horário */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Início *</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={dataHoraInicio} 
                  onChange={e => setDataHoraInicio(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Término Estimado</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={dataHoraFim} 
                  onChange={e => setDataHoraFim(e.target.value)} 
                />
              </div>
            </div>

            {/* Recorrência / Programação do Mês Todo */}
            {!isEdicao && (
              <div style={{
                background: agendarMesTodo ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-input)',
                border: agendarMesTodo ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
                marginBottom: '1rem',
                transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', margin: 0, fontWeight: '600', color: agendarMesTodo ? '#60a5fa' : 'var(--text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={agendarMesTodo} 
                      onChange={e => setAgendarMesTodo(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                    />
                    <Repeat size={16} />
                    <span>📅 Programar Faxinas do Mês Todo (Recorrência)</span>
                  </label>
                  {agendarMesTodo && (
                    <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                      {datasRecorrentes.filter(d => d.selecionada).length} datas selecionadas
                    </span>
                  )}
                </div>

                {agendarMesTodo && (
                  <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frequência</label>
                        <select 
                          className="form-select" 
                          value={tipoRecorrencia} 
                          onChange={e => setTipoRecorrencia(e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                        >
                          <option value="semanal">Semanal (Toda semana)</option>
                          <option value="quinzenal">Quinzenal (A cada 15 dias)</option>
                          <option value="mensal">Mensal (1x ao mês)</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Período a Programar</label>
                        <select 
                          className="form-select" 
                          value={limiteRecorrencia} 
                          onChange={e => setLimiteRecorrencia(e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                        >
                          <option value="fim_mes">Até o final deste mês</option>
                          <option value="4_semanas">Próximas 4 semanas</option>
                          <option value="8_semanas">Próximas 8 semanas</option>
                        </select>
                      </div>
                    </div>

                    {/* Checklist das datas geradas */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Datas calculadas para este cliente (desmarque se houver algum dia sem faxina):
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      paddingRight: '0.25rem'
                    }}>
                      {datasRecorrentes.map((item, idx) => (
                        <div 
                          key={item.idTemp || idx}
                          onClick={() => toggleDataRecorrente(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            background: item.selecionada ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                            border: item.selecionada ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            transition: 'var(--transition)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="checkbox" 
                              checked={item.selecionada} 
                              onChange={() => toggleDataRecorrente(idx)}
                              onClick={e => e.stopPropagation()}
                              style={{ width: '15px', height: '15px', accentColor: '#3b82f6' }}
                            />
                            <span style={{ fontWeight: item.selecionada ? '600' : '400', color: item.selecionada ? '#93c5fd' : 'var(--text-secondary)' }}>
                              {item.diaSemana}, {item.diaFormatado.split(', ')[1]} • {item.horaFormatada}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatCurrency(Number(valorCliente))}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Resumo do Mês */}
                    {datasRecorrentes.filter(d => d.selecionada).length > 0 && (
                      <div style={{
                        marginTop: '0.625rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.78rem',
                        color: 'var(--primary-400)'
                      }}>
                        <span>
                          <strong>{datasRecorrentes.filter(d => d.selecionada).length} faxinas</strong> programadas no mês
                        </span>
                        <strong>
                          Total Cliente: {formatCurrency(datasRecorrentes.filter(d => d.selecionada).length * Number(valorCliente))}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Equipe de Ajudantes (Geralmente 2 profissionais) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Equipe de Ajudantes (Geralmente 2 profissionais)</span>
                <span style={{ color: 'var(--primary-400)', fontSize: '0.75rem' }}>
                  {ajudantesSelecionadas.length} selecionada(s)
                </span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ajudantes.map(aj => {
                  const isSelected = ajudantesSelecionadas.some(a => a.ajudanteId === aj.id);
                  const selData = ajudantesSelecionadas.find(a => a.ajudanteId === aj.id);

                  return (
                    <div 
                      key={aj.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                        border: isSelected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', flex: 1 }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleAjudante(aj.id)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? '600' : '400', color: aj.status === 'inativo' ? 'var(--text-muted)' : 'inherit' }}>
                          {aj.nome} {aj.status === 'inativo' ? '⚠️ (INATIVA)' : ''} ({aj.especialidade || 'Geral'})
                        </span>
                      </label>

                      {isSelected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pagar R$</span>
                          <input 
                            type="number" 
                            value={selData.valorAPagar} 
                            onChange={e => handleValorAjudanteChange(aj.id, e.target.value)}
                            style={{ 
                              width: '75px', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: 'var(--radius-sm)', 
                              background: 'var(--bg-card)', 
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              textAlign: 'right'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Valor e Pagamento do Cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Valor Cobrado (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  value={valorCliente} 
                  onChange={e => setValorCliente(e.target.value)} 
                  style={{ 
                    borderColor: clienteSelecionado?.valorFechado ? 'var(--primary-500)' : 'var(--border-color)',
                    background: clienteSelecionado?.valorFechado ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-input)'
                  }}
                />
                {clienteSelecionado?.valorFechado && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-400)', display: 'block', marginTop: '0.25rem' }}>
                    ✨ Valor fixo/acordado do cliente: R$ {Number(clienteSelecionado.valorFechado).toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status Pagamento</label>
                <select 
                  className="form-select" 
                  value={statusClientePagamento} 
                  onChange={e => setStatusClientePagamento(e.target.value)}
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Forma</label>
                <select 
                  className="form-select" 
                  value={formaPagamentoCliente} 
                  onChange={e => setFormaPagamentoCliente(e.target.value)}
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
            </div>

            {/* Status do Serviço */}
            <div className="form-group">
              <label className="form-label">Status da Faxina</label>
              <select 
                className="form-select" 
                value={statusServico} 
                onChange={e => setStatusServico(e.target.value)}
              >
                <option value="confirmado">Confirmado</option>
                <option value="agendado">Agendado (Aguardando Confirmação)</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Observações */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observações da Faxina</label>
              <textarea 
                className="form-textarea" 
                rows="2" 
                placeholder="Ex: Pet no local, chave na portaria, foco na varanda..."
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={e => handleSubmit(e, true)} 
              className="btn btn-google btn-sm"
              title="Salva a faxina e já abre no Google Agenda com 1 clique"
            >
              <Calendar size={16} />
              <span>Salvar + Google Agenda</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                {isEdicao ? 'Salvar Alterações' : (agendarMesTodo && datasRecorrentes.filter(d => d.selecionada).length > 1) ? `Salvar ${datasRecorrentes.filter(d => d.selecionada).length} Faxinas do Mês` : 'Salvar Faxina'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
