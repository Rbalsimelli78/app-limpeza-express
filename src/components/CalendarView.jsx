import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const CalendarView = ({ 
  agendamentos = [], 
  clientes = [], 
  planos = [], 
  onSelectDay 
}) => {
  const [dataAtual, setDataAtual] = useState(new Date());

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth(); // 0 a 11

  // Navegação de Mês
  const mesAnterior = () => {
    setDataAtual(new Date(ano, mes - 1, 1));
  };

  const proximoMes = () => {
    setDataAtual(new Date(ano, mes + 1, 1));
  };

  const irParaHoje = () => {
    setDataAtual(new Date());
  };

  const nomeMesAno = useMemo(() => {
    const formatador = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
    const str = formatador.format(dataAtual);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [dataAtual]);

  // Agrupar agendamentos por data ISO (YYYY-MM-DD)
  const agendamentosPorDia = useMemo(() => {
    const mapa = {};
    agendamentos.forEach(ag => {
      if (!ag.dataHoraInicio) return;
      const dataStr = ag.dataHoraInicio.slice(0, 10);
      if (!mapa[dataStr]) {
        mapa[dataStr] = [];
      }
      mapa[dataStr].push(ag);
    });
    return mapa;
  }, [agendamentos]);

  // Estatísticas do Mês Atual
  const estatisticasMes = useMemo(() => {
    let totalFaxinas = 0;
    let totalFaturado = 0;
    let diasComServico = new Set();

    Object.entries(agendamentosPorDia).forEach(([dataStr, lista]) => {
      const [a, m] = dataStr.split('-').map(Number);
      if (a === ano && m - 1 === mes) {
        totalFaxinas += lista.length;
        lista.forEach(ag => {
          totalFaturado += Number(ag.valorCliente) || 0;
        });
        diasComServico.add(dataStr);
      }
    });

    return {
      totalFaxinas,
      totalFaturado,
      qtdDias: diasComServico.size
    };
  }, [agendamentosPorDia, ano, mes]);

  // Matriz de Dias do Mês
  const diasCalendario = useMemo(() => {
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Domingo
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const dias = [];

    // Dias do mês anterior para completar o início da grade
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

    // Dias do próximo mês para completar o final da grade (múltiplo de 7)
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

  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  return (
    <div className="calendar-wrapper">
      {/* Barra de Navegação do Mês e Métricas Rápidas */}
      <div className="calendar-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={mesAnterior} 
            className="btn btn-secondary btn-icon btn-sm"
            title="Mês Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', minWidth: '170px' }}>
            {nomeMesAno}
          </h3>

          <button 
            type="button" 
            onClick={proximoMes} 
            className="btn btn-secondary btn-icon btn-sm"
            title="Próximo Mês"
          >
            <ChevronRight size={18} />
          </button>

          <button 
            type="button" 
            onClick={irParaHoje} 
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginLeft: '0.25rem' }}
          >
            Hoje
          </button>
        </div>

        {/* Resumo do Mês */}
        <div className="calendar-month-stats">
          <div className="stat-pill">
            <CalendarIcon size={14} color="var(--primary-400)" />
            <span><strong>{estatisticasMes.totalFaxinas}</strong> faxina(s)</span>
          </div>

          <div className="stat-pill">
            <DollarSign size={14} color="var(--primary-500)" />
            <span><strong>{formatCurrency(estatisticasMes.totalFaturado)}</strong></span>
          </div>
        </div>
      </div>

      {/* Grade de Cabeçalho dos Dias da Semana */}
      <div className="calendar-weekdays-grid">
        {diasSemana.map((dia, idx) => (
          <div 
            key={dia} 
            className="calendar-weekday-cell"
            style={{ color: idx === 0 || idx === 6 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grade de Células dos Dias */}
      <div className="calendar-days-grid">
        {diasCalendario.map((d, index) => {
          const qtd = d.agendamentos.length;
          const temAgendamentos = qtd > 0;

          // Cálculo do valor total do dia
          const totalDia = d.agendamentos.reduce((acc, ag) => acc + (Number(ag.valorCliente) || 0), 0);

          return (
            <div
              key={`${d.dataStr}-${index}`}
              className={`calendar-day-cell ${!d.isMesAtual ? 'day-muted' : ''} ${d.isHoje ? 'day-today' : ''} ${temAgendamentos ? 'day-has-events' : ''}`}
              onClick={() => onSelectDay(d.dataStr, d.agendamentos)}
              title={temAgendamentos ? `Clique para ver ${qtd} cliente(s) agendado(s)` : `Clique para ver o dia ${d.numero}`}
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

              {/* Indicador de Clientes / Faxinas Agendadas */}
              {temAgendamentos && (
                <div className="day-cell-content">
                  <div className="client-count-badge">
                    <span className="badge-dot"></span>
                    <span className="badge-text-full">{qtd} {qtd === 1 ? 'cliente' : 'clientes'}</span>
                    <span className="badge-text-mobile">{qtd}</span>
                  </div>

                  <span className="day-total-val">
                    {formatCurrency(totalDia)}
                  </span>

                  {/* Nomes dos clientes em tela desktop */}
                  <div className="day-client-previews">
                    {d.agendamentos.slice(0, 2).map((ag, i) => {
                      const cli = clientes.find(c => c.id === ag.clienteId);
                      return (
                        <span key={i} className="client-preview-chip">
                          {cli?.nome?.split(' ')[0] || 'Cliente'}
                        </span>
                      );
                    })}
                    {qtd > 2 && (
                      <span className="client-preview-more">+{qtd - 2}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
