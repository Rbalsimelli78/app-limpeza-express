import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Sparkles,
  MessageCircle,
  Edit2,
  Check,
  RotateCcw,
  MapPin,
  Building,
  FileText
} from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/formatters';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { 
  toDatetimeLocalString, 
  DIAS_SEMANA_NOMES, 
  DIAS_SEMANA_CURTOS, 
  MESES_NOMES 
} from '../utils/recurrence';
import { checkHasConflict } from '../utils/conflicts';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { getAgendamentoStatusPagamento } from '../utils/inadimplencia';

export const CalendarView = ({ 
  agendamentos = [], 
  clientes = [], 
  ajudantes = [], 
  planos = [], 
  onSelectDay,
  onNovoAgendamento,
  onEditarAgendamento,
  setStatusServico
}) => {
  // Data de referência do calendário
  const [dataAtual, setDataAtual] = useState(new Date());
  // Modelo de visualização tipo Google Calendar: 'mes' | 'semana' | 'dia'
  const [visualizacao, setVisualizacao] = useState('mes');

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth(); // 0 a 11
  const dia = dataAtual.getDate();

  // Navegação Temporal
  const navegarAnterior = () => {
    if (visualizacao === 'mes') {
      setDataAtual(new Date(ano, mes - 1, 1));
    } else if (visualizacao === 'semana') {
      const d = new Date(dataAtual);
      d.setDate(d.getDate() - 7);
      setDataAtual(d);
    } else {
      const d = new Date(dataAtual);
      d.setDate(d.getDate() - 1);
      setDataAtual(d);
    }
  };

  const navegarProximo = () => {
    if (visualizacao === 'mes') {
      setDataAtual(new Date(ano, mes + 1, 1));
    } else if (visualizacao === 'semana') {
      const d = new Date(dataAtual);
      d.setDate(d.getDate() + 7);
      setDataAtual(d);
    } else {
      const d = new Date(dataAtual);
      d.setDate(d.getDate() + 1);
      setDataAtual(d);
    }
  };

  const irParaHoje = () => {
    setDataAtual(new Date());
  };

  // Helper para obter nomes das ajudantes escaladas
  const getAjudantesTexto = (ag, formato = 'curto') => {
    if (!ag || !ag.ajudantesEscaladas || !Array.isArray(ag.ajudantesEscaladas) || ag.ajudantesEscaladas.length === 0) return '';
    const nomes = ag.ajudantesEscaladas
      .map(ae => {
        if (!ae) return '';
        const ajId = ae.ajudanteId || ae;
        const aj = ajudantes.find(a => a.id === ajId);
        if (!aj || !aj.nome) return '';
        return formato === 'curto' ? aj.nome.split(' ')[0] : aj.nome;
      })
      .filter(Boolean);
    return nomes.join(', ');
  };

  // Helper de status da faxina (Concluída vs Pendente)
  const isConcluida = (ag) => ag?.statusServico === 'concluido';

  // Título Dinâmico do Cabeçalho conforme o Modo
  const tituloCabecalho = useMemo(() => {
    if (visualizacao === 'mes') {
      return `${MESES_NOMES[mes] || ''} de ${ano}`;
    }

    if (visualizacao === 'semana') {
      // Encontra o domingo e sábado da semana atual
      const d = new Date(dataAtual);
      const diaSemana = d.getDay();
      const dom = new Date(d);
      dom.setDate(d.getDate() - diaSemana);
      const sab = new Date(dom);
      sab.setDate(dom.getDate() + 6);

      const mesDom = dom.getMonth();
      const mesSab = sab.getMonth();
      const anoDom = dom.getFullYear();
      const anoSab = sab.getFullYear();

      if (mesDom === mesSab && anoDom === anoSab) {
        return `${String(dom.getDate()).padStart(2, '0')} a ${String(sab.getDate()).padStart(2, '0')} de ${MESES_NOMES[mesDom] || ''} de ${anoDom}`;
      } else if (anoDom === anoSab) {
        return `${String(dom.getDate()).padStart(2, '0')} de ${MESES_NOMES[mesDom] || ''} a ${String(sab.getDate()).padStart(2, '0')} de ${MESES_NOMES[mesSab] || ''} de ${anoDom}`;
      } else {
        return `${String(dom.getDate()).padStart(2, '0')}/${mesDom + 1}/${anoDom} a ${String(sab.getDate()).padStart(2, '0')}/${mesSab + 1}/${anoSab}`;
      }
    }

    // visualizacao === 'dia'
    try {
      const formatador = new Intl.DateTimeFormat('pt-BR', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      const str = formatador.format(dataAtual);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (e) {
      return `${dia}/${mes + 1}/${ano}`;
    }
  }, [visualizacao, dataAtual, ano, mes, dia]);

  // Agrupar agendamentos por data ISO (YYYY-MM-DD)
  const agendamentosPorDia = useMemo(() => {
    const mapa = {};
    if (!Array.isArray(agendamentos)) return mapa;
    agendamentos.forEach(ag => {
      if (!ag || !ag.dataHoraInicio || typeof ag.dataHoraInicio !== 'string') return;
      const dataStr = ag.dataHoraInicio.slice(0, 10);
      if (!mapa[dataStr]) {
        mapa[dataStr] = [];
      }
      mapa[dataStr].push(ag);
    });
    // Ordenar agendamentos do dia por horário de início
    Object.keys(mapa).forEach(k => {
      mapa[k].sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio));
    });
    return mapa;
  }, [agendamentos]);

  // Estatísticas do Mês Atual para o Topo (Serviço e Financeiro)
  const estatisticasMes = useMemo(() => {
    let totalFaxinas = 0;
    let concluidas = 0;
    let pendentes = 0;
    let totalPagos = 0;
    let totalPendentesPagamento = 0;
    let totalInadimplentes = 0;

    Object.entries(agendamentosPorDia).forEach(([dataStr, lista]) => {
      const [a, m] = dataStr.split('-').map(Number);
      if (a === ano && m - 1 === mes) {
        totalFaxinas += lista.length;
        lista.forEach(ag => {
          if (ag.statusServico === 'concluido') {
            concluidas++;
          } else {
            pendentes++;
          }

          const cli = clientes.find(c => c.id === ag.clienteId);
          const stPag = getAgendamentoStatusPagamento(ag, cli);
          if (stPag.status === 'pago') totalPagos++;
          else if (stPag.status === 'inadimplente') totalInadimplentes++;
          else if (stPag.status === 'pendente') totalPendentesPagamento++;
        });
      }
    });

    return { totalFaxinas, concluidas, pendentes, totalPagos, totalPendentesPagamento, totalInadimplentes };
  }, [agendamentosPorDia, ano, mes, clientes]);

  // 1. DADOS DA VISÃO MENSAL (Grade de 35 a 42 dias)
  const diasCalendarioMensal = useMemo(() => {
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Domingo
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

    const hoje = new Date();
    const hojeStr = toDatetimeLocalString(hoje).slice(0, 10);

    const dias = [];

    // Dias do mês anterior
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const diaNum = totalDiasMesAnterior - i;
      const mesAnt = mes === 0 ? 11 : mes - 1;
      const anoAnt = mes === 0 ? ano - 1 : ano;
      const dataStr = `${anoAnt}-${String(mesAnt + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
      const ags = agendamentosPorDia[dataStr] || [];

      dias.push({
        numero: diaNum,
        dataStr,
        isMesAtual: false,
        isHoje: dataStr === hojeStr,
        agendamentos: ags
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDiasMes; i++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const ags = agendamentosPorDia[dataStr] || [];

      dias.push({
        numero: i,
        dataStr,
        isMesAtual: true,
        isHoje: dataStr === hojeStr,
        agendamentos: ags
      });
    }

    // Dias do próximo mês para fechar a grade (múltiplo de 7)
    const restante = (7 - (dias.length % 7)) % 7;
    for (let i = 1; i <= restante; i++) {
      const mesProx = mes === 11 ? 0 : mes + 1;
      const anoProx = mes === 11 ? ano + 1 : ano;
      const dataStr = `${anoProx}-${String(mesProx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const ags = agendamentosPorDia[dataStr] || [];

      dias.push({
        numero: i,
        dataStr,
        isMesAtual: false,
        isHoje: dataStr === hojeStr,
        agendamentos: ags
      });
    }

    return dias;
  }, [ano, mes, agendamentosPorDia]);

  // 2. DADOS DA VISÃO SEMANAL (7 dias de Domingo a Sábado)
  const diasSemanaAtual = useMemo(() => {
    const d = new Date(dataAtual);
    const diaSemana = d.getDay();
    const domingo = new Date(d);
    domingo.setDate(d.getDate() - diaSemana);
    domingo.setHours(0, 0, 0, 0);

    const hoje = new Date();
    const hojeStr = toDatetimeLocalString(hoje).slice(0, 10);

    const semana = [];
    for (let i = 0; i < 7; i++) {
      const diaObj = new Date(domingo);
      diaObj.setDate(domingo.getDate() + i);
      const dataStr = toDatetimeLocalString(diaObj).slice(0, 10);
      const ags = agendamentosPorDia[dataStr] || [];

      semana.push({
        dataObj: diaObj,
        dataStr,
        diaNum: diaObj.getDate(),
        mesNum: diaObj.getMonth() + 1,
        nomeDia: (DIAS_SEMANA_NOMES[i] || '').split('-')[0],
        nomeDiaCurto: DIAS_SEMANA_CURTOS[i] || '',
        isHoje: dataStr === hojeStr,
        agendamentos: ags
      });
    }
    return semana;
  }, [dataAtual, agendamentosPorDia]);

  // 3. DADOS DA VISÃO DIÁRIA (Dia selecionado)
  const dataSelecionadaStr = useMemo(() => {
    return toDatetimeLocalString(dataAtual).slice(0, 10);
  }, [dataAtual]);

  const agendamentosDoDiaSelecionado = useMemo(() => {
    return agendamentosPorDia[dataSelecionadaStr] || [];
  }, [agendamentosPorDia, dataSelecionadaStr]);

  const hojeDataStr = toDatetimeLocalString(new Date()).slice(0, 10);
  const isDiaHoje = dataSelecionadaStr === hojeDataStr;

  // Grade de Horários padrão para visão diária (07:00 às 20:00)
  const horasDoDia = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  return (
    <div className="calendar-wrapper">
      {/* BARRA SUPERIOR: NAVEGAÇÃO, SELETOR DE MODELOS (MÊS / SEMANA / DIA) E MÉTRICAS */}
      <div className="calendar-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Lado Esquerdo: Controles de Navegação (< Hoje >) e Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              type="button" 
              onClick={navegarAnterior} 
              className="btn btn-secondary btn-icon btn-sm"
              title="Período Anterior"
              style={{ width: '32px', height: '32px' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              type="button" 
              onClick={navegarProximo} 
              className="btn btn-secondary btn-icon btn-sm"
              title="Próximo Período"
              style={{ width: '32px', height: '32px' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            type="button" 
            onClick={irParaHoje} 
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Hoje
          </button>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginLeft: '0.25rem' }}>
            {tituloCabecalho}
          </h3>
        </div>

        {/* Lado Direito: Alternador de Modelo (Google Calendar Style) + Resumo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Seletor de Modelo de Calendário */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-input)', 
            padding: '3px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)' 
          }}>
            <button
              type="button"
              onClick={() => setVisualizacao('mes')}
              className={`btn btn-sm ${visualizacao === 'mes' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.35rem 0.85rem', 
                fontSize: '0.8rem', 
                border: 'none', 
                borderRadius: 'calc(var(--radius-md) - 3px)' 
              }}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao('semana')}
              className={`btn btn-sm ${visualizacao === 'semana' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.35rem 0.85rem', 
                fontSize: '0.8rem', 
                border: 'none', 
                borderRadius: 'calc(var(--radius-md) - 3px)' 
              }}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao('dia')}
              className={`btn btn-sm ${visualizacao === 'dia' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.35rem 0.85rem', 
                fontSize: '0.8rem', 
                border: 'none', 
                borderRadius: 'calc(var(--radius-md) - 3px)' 
              }}
            >
              Dia
            </button>
          </div>

          {/* Badges de Status Geral do Mês e Legenda de Pagamentos */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span 
                className="badge" 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#34d399', 
                  border: '1px solid rgba(16, 185, 129, 0.35)', 
                  fontSize: '0.75rem', 
                  padding: '0.3rem 0.55rem' 
                }}
                title="Faxinas com limpeza já concluída"
              >
                ✓ {estatisticasMes.concluidas} concluída(s)
              </span>

              <span 
                className="badge" 
                style={{ 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  color: '#fbbf24', 
                  border: '1px solid rgba(245, 158, 11, 0.35)', 
                  fontSize: '0.75rem', 
                  padding: '0.3rem 0.55rem' 
                }}
                title="Faxinas agendadas e confirmadas a realizar"
              >
                ⏳ {estatisticasMes.pendentes} a realizar
              </span>
            </div>

            {/* Legenda Explicativa dos Ícones de $ no Calendário */}
            <div 
              className="payment-legend-bar"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                flexWrap: 'wrap', 
                fontSize: '0.7rem', 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '3px 8px', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}
            >
              <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>Pagamento:</span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Cliente já pagou a faxina">
                <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: '0.6rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>$</span>
                <span style={{ color: '#34d399', fontWeight: '600' }}>Pago ({estatisticasMes.totalPagos})</span>
              </span>

              <span>•</span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Pendente dentro do prazo acordado">
                <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#f59e0b', color: '#1e293b', fontSize: '0.6rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>$</span>
                <span style={{ color: '#fbbf24', fontWeight: '600' }}>Pendente ({estatisticasMes.totalPendentesPagamento})</span>
              </span>

              {estatisticasMes.totalInadimplentes > 0 && (
                <>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Pagamento em atraso / vencido">
                    <span style={{ minWidth: '15px', height: '13px', padding: '0 1.5px', borderRadius: '3px', background: '#ef4444', color: '#fff', fontSize: '0.56rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2' }}>$!</span>
                    <span style={{ color: '#f87171', fontWeight: '700' }}>Inadimplente ({estatisticasMes.totalInadimplentes})</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODELO 1: VISÃO MENSAL (Grade de Dias com Status Verde/Amarelo e Ajudante) */}
      {/* ========================================================================= */}
      {visualizacao === 'mes' && (
        <>
          {/* Cabeçalho dos Dias da Semana */}
          <div className="calendar-weekdays-grid">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((diaNome, idx) => (
              <div 
                key={diaNome} 
                className="calendar-weekday-cell"
                style={{ color: idx === 0 || idx === 6 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
              >
                {diaNome}
              </div>
            ))}
          </div>

          {/* Grade dos Dias do Mês */}
          <div className="calendar-days-grid">
            {diasCalendarioMensal.map((d, index) => {
              const qtd = d.agendamentos.length;
              const temAgendamentos = qtd > 0;
              const concluidas = d.agendamentos.filter(isConcluida).length;
              const pendentes = qtd - concluidas;
              const todasConcluidas = temAgendamentos && pendentes === 0;

              return (
                <div
                  key={`${d.dataStr}-${index}`}
                  className={`calendar-day-cell ${!d.isMesAtual ? 'day-muted' : ''} ${d.isHoje ? 'day-today' : ''} ${temAgendamentos ? 'day-has-events' : ''}`}
                  onClick={() => onSelectDay ? onSelectDay(d.dataStr, d.agendamentos) : null}
                  style={{
                    borderColor: temAgendamentos 
                      ? (todasConcluidas ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)')
                      : undefined
                  }}
                  title={temAgendamentos ? `Ver ${qtd} cliente(s) agendado(s) em ${d.dataStr}` : `Ver dia ${d.numero}`}
                >
                  {/* Número do Dia e Badge Hoje */}
                  <div className="day-cell-top">
                    <span className={`day-number ${d.isHoje ? 'day-number-today' : ''}`}>
                      {d.numero}
                    </span>

                    {d.isHoje && (
                      <span className="badge-today">Hoje</span>
                    )}
                  </div>

                  {/* Conteúdo do Dia: SEM EXIBIR VALOR MONETÁRIO DIÁRIO */}
                  {temAgendamentos && (
                    <div className="day-cell-content">
                      {/* Badge Resumo do Dia por Status */}
                      <div 
                        className="day-status-badge"
                        style={{
                          background: todasConcluidas ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.18)',
                          border: `1px solid ${todasConcluidas ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                          color: todasConcluidas ? '#34d399' : '#fbbf24',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          borderRadius: 'var(--radius-sm)',
                          padding: '1px 3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          justifyContent: 'center',
                          width: '100%',
                          minWidth: 0,
                          overflow: 'hidden',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{ 
                          width: '4px', 
                          height: '4px', 
                          borderRadius: '50%', 
                          background: todasConcluidas ? '#10b981' : '#f59e0b',
                          flexShrink: 0 
                        }}></span>

                        {/* Versão Compacta no Celular: ex: ✓2 ou ⏳3 */}
                        <span className="badge-text-mobile" style={{ fontSize: '0.62rem', fontWeight: '800' }}>
                          {todasConcluidas ? `✓${qtd}` : `⏳${qtd}`}
                        </span>

                        {/* Versão Completa no Computador/Tablet */}
                        <span className="badge-text-full">
                          {todasConcluidas 
                            ? `✓ ${qtd} feita(s)` 
                            : concluidas > 0 
                              ? `${concluidas} ok • ${pendentes} pend` 
                              : `⏳ ${qtd} ${qtd === 1 ? 'faxina' : 'faxinas'}`}
                        </span>

                        {qtd > 1 && d.agendamentos.some(ag => checkHasConflict(ag, d.agendamentos, ajudantes)) && (
                          <span 
                            title="Atenção: Choque de horário ou ajudante detectado neste dia!"
                            style={{
                              fontSize: '0.58rem',
                              background: '#ef4444',
                              color: '#fff',
                              borderRadius: '2px',
                              padding: '0 2px',
                              fontWeight: '800',
                              flexShrink: 0
                            }}
                          >
                            ⚠️
                          </span>
                        )}
                      </div>

                      {/* Lista com Nome do Cliente e Nome da Ajudante com Cores por Status */}
                      <div className="day-client-previews">
                        {d.agendamentos.slice(0, 3).map((ag, i) => {
                          const cli = clientes.find(c => c.id === ag.clienteId);
                          const nomeCli = cli?.nome ? cli.nome.split(' ')[0] : 'Cliente';
                          const ajudanteTxt = getAjudantesTexto(ag, 'curto');
                          const feita = isConcluida(ag);

                          return (
                            <div 
                              key={ag.id || i} 
                              style={{
                                fontSize: '0.65rem',
                                background: feita ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.18)',
                                border: `1px solid ${feita ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.45)'}`,
                                color: feita ? '#a7f3d0' : '#fde68a',
                                borderRadius: '3px',
                                padding: '1.5px 4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <span style={{ 
                                width: '4px', 
                                height: '4px', 
                                borderRadius: '50%', 
                                background: feita ? '#10b981' : '#f59e0b',
                                flexShrink: 0
                              }}></span>
                              {/* Ícone de Pagamento ($ Pago / $ Pendente / $! Inadimplente) */}
                              <PaymentStatusBadge agendamento={ag} cliente={cli} variant="icon" />
                              <span style={{ fontWeight: '600' }}>{nomeCli}</span>
                              {ajudanteTxt && (
                                <span style={{ opacity: 0.85, fontSize: '0.62rem' }}>
                                  ({ajudanteTxt})
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {qtd > 3 && (
                          <span className="client-preview-more" style={{ color: 'var(--text-muted)' }}>
                            +{qtd - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODELO 2: VISÃO SEMANAL (7 Colunas de Domingo a Sábado com Horários)      */}
      {/* ========================================================================= */}
      {visualizacao === 'semana' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(135px, 1fr))', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {diasSemanaAtual.map((diaItem) => {
            const qtd = diaItem.agendamentos.length;
            const concluidas = diaItem.agendamentos.filter(isConcluida).length;

            return (
              <div 
                key={diaItem.dataStr}
                style={{
                  background: diaItem.isHoje ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-card)',
                  border: diaItem.isHoje ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '480px'
                }}
              >
                {/* Topo do Dia na Semana */}
                <div style={{
                  padding: '0.625rem',
                  borderBottom: '1px solid var(--border-color)',
                  background: diaItem.isHoje ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: diaItem.isHoje ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                    {diaItem.nomeDiaCurto.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: diaItem.isHoje ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                    {diaItem.diaNum}
                  </div>
                  <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span 
                      style={{ 
                        fontSize: '0.675rem', 
                        padding: '1px 6px', 
                        borderRadius: '4px',
                        background: qtd > 0 ? (concluidas === qtd ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)') : 'transparent',
                        color: qtd > 0 ? (concluidas === qtd ? '#34d399' : '#fbbf24') : 'var(--text-muted)'
                      }}
                    >
                      {qtd === 0 ? 'Sem faxinas' : `${qtd} faxina(s)`}
                    </span>
                    {qtd > 1 && diaItem.agendamentos.some(ag => checkHasConflict(ag, diaItem.agendamentos, ajudantes)) && (
                      <span 
                        title="Há choque de horário ou de ajudante neste dia!"
                        style={{
                          fontSize: '0.62rem',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.25)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#f87171',
                          fontWeight: '800'
                        }}
                      >
                        ⚠️ Choque
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de Faxinas do Dia (Ordenadas por Horário) */}
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  {qtd === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2rem 0.25rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} style={{ marginBottom: '0.35rem', opacity: 0.4 }} />
                      <span>Livre</span>
                      <button 
                        type="button"
                        onClick={() => onNovoAgendamento && onNovoAgendamento({ dataHoraInicio: `${diaItem.dataStr}T09:00:00` })}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '0.75rem', fontSize: '0.675rem', padding: '0.2rem 0.5rem' }}
                      >
                        + Agendar
                      </button>
                    </div>
                  ) : (
                    diaItem.agendamentos.map((ag) => {
                      const cli = clientes.find(c => c.id === ag.clienteId);
                      const plano = planos.find(p => p.id === ag.planoId);
                      const ajudantesTxt = getAjudantesTexto(ag, 'curto');
                      const feita = isConcluida(ag);
                      const horaIni = ag.dataHoraInicio ? ag.dataHoraInicio.slice(11, 16) : '08:00';
                      const horaFim = ag.dataHoraFim ? ag.dataHoraFim.slice(11, 16) : '';
                      const conflito = checkHasConflict(ag, diaItem.agendamentos, ajudantes);

                      return (
                        <div
                          key={ag.id}
                          onClick={() => onEditarAgendamento ? onEditarAgendamento(ag) : (onSelectDay ? onSelectDay(diaItem.dataStr) : null)}
                          style={{
                            background: feita ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                            borderLeft: conflito ? (conflito.tipo === 'ajudante' ? '3px solid #ef4444' : '3px solid #f59e0b') : (feita ? '3px solid #10b981' : '3px solid #f59e0b'),
                            borderTop: '1px solid var(--border-color)',
                            borderRight: '1px solid var(--border-color)',
                            borderBottom: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                          className="hover-card"
                          title={conflito ? `⚠️ Choque detectado! Clique para editar ou ver detalhes` : 'Clique para editar ou ver detalhes'}
                        >
                          {/* Horário, Status do Serviço e Status de Pagamento */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: feita ? '#34d399' : '#fbbf24' }}>
                              🕒 {horaIni}{horaFim ? ` - ${horaFim}` : ''}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span 
                                style={{ 
                                  fontSize: '0.6rem', 
                                  padding: '1px 4px', 
                                  borderRadius: '3px', 
                                  background: feita ? '#10b981' : '#f59e0b',
                                  color: '#000',
                                  fontWeight: '700'
                                }}
                              >
                                {feita ? 'FEITA' : 'PEND'}
                              </span>
                              <PaymentStatusBadge agendamento={ag} cliente={cli} variant="icon" />
                            </div>
                          </div>

                          {/* Alerta de Choque de Horário / Ajudante no card */}
                          {conflito && (
                            <div 
                              title={conflito.tipo === 'ajudante' ? `Choque de ajudante: ${conflito.ajudantes.join(', ')}` : 'Choque de horário no mesmo intervalo'}
                              style={{
                                margin: '0.2rem 0 0.35rem 0',
                                fontSize: '0.62rem',
                                background: conflito.tipo === 'ajudante' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                                border: `1px solid ${conflito.tipo === 'ajudante' ? '#ef4444' : '#f59e0b'}`,
                                color: conflito.tipo === 'ajudante' ? '#fca5a5' : '#fde68a',
                                padding: '1.5px 4px',
                                borderRadius: '3px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              <span>⚠️</span>
                              <span>{conflito.tipo === 'ajudante' ? `Choque: ${conflito.ajudantes.join(', ')}` : 'Horário Sobreposto'}</span>
                            </div>
                          )}

                          {/* Nome do Cliente */}
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cli?.nome || 'Cliente'}
                          </div>

                          {/* Ajudante Escalada */}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.15rem' }}>
                            <span>🧹</span>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {ajudantesTxt || 'Sem ajudante'}
                            </span>
                          </div>

                          {/* Condomínio / Bairro */}
                          {(cli?.condominio || cli?.bairro) && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              📍 {cli.condominio ? `${cli.condominio} ` : ''}{cli.bairro ? `• ${cli.bairro}` : ''}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODELO 3: VISÃO DIÁRIA (Hoje / Dia Específico com Linha de Horários)       */}
      {/* ========================================================================= */}
      {visualizacao === 'dia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Card Resumo do Dia Selecionado */}
          <div className="glass-card" style={{ padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${isDiaHoje ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.75rem' }}>
                  {isDiaHoje ? 'Hoje' : 'Dia Selecionado'}
                </span>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {agendamentosDoDiaSelecionado.length} faxina(s) agendada(s)
                </span>
              </div>
              <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {tituloCabecalho}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => onNovoAgendamento && onNovoAgendamento({ dataHoraInicio: `${dataSelecionadaStr}T09:00:00` })}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <Plus size={16} />
              <span>+ Agendar Faxina neste Dia</span>
            </button>
          </div>

          {/* Se não houver faxinas no dia */}
          {agendamentosDoDiaSelecionado.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <CalendarIcon size={44} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Nenhuma faxina agendada para este dia
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Você pode utilizar os botões de navegação acima para ver outros dias ou agendar uma nova faxina agora.
              </p>
              <button
                type="button"
                onClick={() => onNovoAgendamento && onNovoAgendamento({ dataHoraInicio: `${dataSelecionadaStr}T09:00:00` })}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                <span>Agendar Faxina</span>
              </button>
            </div>
          ) : (
            /* Lista detalhada das faxinas do dia com horários e ações */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {agendamentosDoDiaSelecionado.length > 1 && agendamentosDoDiaSelecionado.some(ag => checkHasConflict(ag, agendamentosDoDiaSelecionado, ajudantes)) && (
                <div style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  color: '#fca5a5',
                  fontSize: '0.825rem',
                  fontWeight: '600'
                }}>
                  <AlertCircle size={17} color="#ef4444" />
                  <span>Atenção: Existem faxinas com choque de horário e/ou ajudantes sobrepostas neste dia.</span>
                </div>
              )}

              {agendamentosDoDiaSelecionado.map((ag) => {
                const cli = clientes.find(c => c.id === ag.clienteId);
                const plano = planos.find(p => p.id === ag.planoId);
                const ajudantesCompletas = getAjudantesTexto(ag, 'completo');
                const feita = isConcluida(ag);
                const horaIni = ag.dataHoraInicio ? ag.dataHoraInicio.slice(11, 16) : '08:00';
                const horaFim = ag.dataHoraFim ? ag.dataHoraFim.slice(11, 16) : '12:00';
                const waUrl = cli ? getWhatsAppUrl(cli.telefone, `Olá ${cli.nome}! Aqui é da Limpeza Express SP sobre sua faxina de hoje ✨`) : '';
                const conflito = checkHasConflict(ag, agendamentosDoDiaSelecionado, ajudantes);

                return (
                  <div
                    key={ag.id}
                    className="glass-card"
                    style={{
                      padding: '1.125rem',
                      borderLeft: conflito ? (conflito.tipo === 'ajudante' ? '5px solid #ef4444' : '5px solid #f59e0b') : (feita ? '5px solid #10b981' : '5px solid #f59e0b'),
                      background: feita ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      
                      {/* Lado Esquerdo: Horário, Status, Cliente, Ajudantes e Local */}
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span 
                            style={{ 
                              background: feita ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              border: `1px solid ${feita ? '#10b981' : '#f59e0b'}`,
                              color: feita ? '#34d399' : '#fbbf24',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Clock size={12} />
                            <span>{horaIni} às {horaFim}</span>
                          </span>

                          <span 
                            className={`badge ${feita ? 'badge-success' : 'badge-warning'}`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {feita ? '✓ Faxina Concluída' : '⏳ A Realizar / Confirmada'}
                          </span>

                          <PaymentStatusBadge agendamento={ag} cliente={cli} variant="badge" showValor={true} />

                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            {plano?.nome || 'Plano Padrão'}
                          </span>

                          {conflito && (
                            <span 
                              style={{ 
                                background: conflito.tipo === 'ajudante' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                                border: `1px solid ${conflito.tipo === 'ajudante' ? '#ef4444' : '#f59e0b'}`,
                                color: conflito.tipo === 'ajudante' ? '#fca5a5' : '#fde68a',
                                fontSize: '0.725rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              ⚠️ {conflito.tipo === 'ajudante' ? `Choque Ajudante: ${conflito.ajudantes.join(', ')}` : 'Horário Sobreposto'}
                            </span>
                          )}
                        </div>

                        {conflito && (
                          <div style={{
                            margin: '0.4rem 0',
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            background: conflito.tipo === 'ajudante' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            border: `1px solid ${conflito.tipo === 'ajudante' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                            color: conflito.tipo === 'ajudante' ? '#fca5a5' : '#fde68a',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {conflito.tipo === 'ajudante'
                              ? `⚠️ Ajudante (${conflito.ajudantes.join(', ')}) escalada em 2 ou mais faxinas com horários sobrepostos neste dia.`
                              : '⚠️ Há outra faxina cadastrada para este mesmo horário.'}
                          </div>
                        )}

                        {/* Nome do Cliente */}
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '0.25rem' }}>
                          {cli?.nome || 'Cliente'}
                        </h3>

                        {/* Ajudantes Escaladas */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '1rem' }}>🧹</span>
                          <span><strong>Ajudante(s):</strong> {ajudantesCompletas || 'Nenhuma ajudante escalada'}</span>
                        </div>

                        {/* Endereço / Condomínio */}
                        {(cli?.condominio || cli?.endereco) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={14} color="var(--primary-400)" />
                            <span>
                              {cli.condominio ? `${cli.condominio} ` : ''}
                              {cli.torre ? `(Torre ${cli.torre} - ${cli.apartamento}) ` : cli.apartamento ? `(${cli.apartamento}) ` : ''}
                              {cli.endereco ? `• ${cli.endereco} ` : ''}
                              {cli.bairro ? `- ${cli.bairro}` : ''}
                            </span>
                          </div>
                        )}

                        {/* Observações da Faxina */}
                        {ag.observacoes && (
                          <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Obs: {ag.observacoes}
                          </div>
                        )}
                      </div>

                      {/* Lado Direito: Botões de Ação Imediata */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {setStatusServico && (
                          <button
                            type="button"
                            onClick={() => setStatusServico(ag.id, feita ? 'confirmado' : 'concluido')}
                            className={`btn btn-sm ${feita ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ gap: '0.35rem' }}
                            title={feita ? 'Reabrir faxina como pendente' : 'Marcar faxina como concluída'}
                          >
                            {feita ? <RotateCcw size={14} /> : <Check size={14} />}
                            <span>{feita ? 'Reabrir' : 'Concluir Faxina'}</span>
                          </button>
                        )}

                        {cli?.telefone && (
                          <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn btn-whatsapp btn-sm"
                            title="Abrir WhatsApp direto do cliente"
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {onEditarAgendamento && (
                          <button
                            type="button"
                            onClick={() => onEditarAgendamento(ag)}
                            className="btn btn-secondary btn-sm"
                            title="Editar agendamento"
                          >
                            <Edit2 size={14} />
                            <span>Editar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
