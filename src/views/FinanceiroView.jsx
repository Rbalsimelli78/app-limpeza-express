import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Users, 
  PieChart,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const FinanceiroView = () => {
  const { agendamentos, clientes, ajudantes, getFinanceiroGeral, setStatusPagamentoCliente, setStatusPagamentoAjudante } = useApp();
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'pendentes', 'pagos'

  const financeiro = getFinanceiroGeral();

  // Margem de lucro líquido
  const faturamentoTotal = financeiro.totalRecebido + financeiro.totalAReceber;
  const custosTotais = financeiro.totalPagoAjudantes + financeiro.totalAPagarAjudantes;
  const margemPercentual = faturamentoTotal > 0 ? Math.round(((faturamentoTotal - custosTotais) / faturamentoTotal) * 100) : 0;

  // Monta lista de lançamentos
  const lancamentos = [];

  agendamentos.forEach(ag => {
    const cliente = clientes.find(c => c.id === ag.clienteId);
    
    // Entrada do cliente
    lancamentos.push({
      id: `ent-${ag.id}`,
      agendamentoId: ag.id,
      tipo: 'entrada',
      descricao: `Faxina: ${cliente?.nome || 'Cliente'} (${ag.dormitorios} dorms)`,
      bairro: cliente?.bairro || '',
      data: ag.dataHoraInicio,
      valor: Number(ag.valorCliente || 0),
      status: ag.statusClientePagamento,
      forma: ag.formaPagamentoCliente || 'PIX',
      origem: 'cliente'
    });

    // Saídas de cada ajudante
    (ag.ajudantesEscaladas || []).forEach((ae, idx) => {
      const aj = ajudantes.find(a => a.id === ae.ajudanteId);
      lancamentos.push({
        id: `sai-${ag.id}-${idx}`,
        agendamentoId: ag.id,
        ajudanteId: ae.ajudanteId,
        tipo: 'saida',
        descricao: `Diária: ${aj?.nome || 'Ajudante'} (Ref: ${cliente?.nome})`,
        bairro: cliente?.bairro || '',
        data: ag.dataHoraInicio,
        valor: Number(ae.valorAPagar || 0),
        status: ae.statusPagamento,
        forma: 'PIX',
        chavePix: aj?.chavePix,
        origem: 'ajudante'
      });
    });
  });

  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtro === 'pendentes') return l.status === 'pendente';
    if (filtro === 'pagos') return l.status === 'pago';
    return true;
  }).sort((a, b) => new Date(b.data) - new Date(a.data));

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <DollarSign size={24} color="var(--primary-400)" />
          <span>Fluxo de Caixa & Lucro Líquido</span>
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Balanço financeiro detalhado entre recebimentos de clientes e pagamentos de ajudantes
        </p>
      </div>

      {/* Cards de Métricas Financeiras */}
      <div className="grid-kpis">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Lucro Líquido Realizado</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <TrendingUp size={20} color="var(--primary-400)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--primary-400)' }}>
            {formatCurrency(financeiro.lucroRealizado)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Margem Líquida Média: <strong>{margemPercentual}%</strong>
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Entradas Recebidas</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <ArrowUpRight size={20} color="var(--accent-cyan)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {formatCurrency(financeiro.totalRecebido)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ainda a receber: {formatCurrency(financeiro.totalAReceber)}
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Saídas (Ajudantes Pagas)</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <ArrowDownRight size={20} color="var(--accent-gold)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-gold)' }}>
            {formatCurrency(financeiro.totalPagoAjudantes)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Pendente a pagar: {formatCurrency(financeiro.totalAPagarAjudantes)}
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Lucro Total Projetado</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <PieChart size={20} color="var(--accent-purple)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>
            {formatCurrency(financeiro.lucroProjetado)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Com todas faxinas pagas
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem' }}>Extrato de Lançamentos</h3>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setFiltro('todos')} 
            className={`btn btn-sm ${filtro === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFiltro('pendentes')} 
            className={`btn btn-sm ${filtro === 'pendentes' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setFiltro('pagos')} 
            className={`btn btn-sm ${filtro === 'pagos' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Liquidados / Pagos
          </button>
        </div>
      </div>

      {/* Lista de Transações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {lancamentosFiltrados.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <DollarSign size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum lançamento financeiro neste filtro.</p>
          </div>
        ) : (
          lancamentosFiltrados.map(item => {
            const isEntrada = item.tipo === 'entrada';

            return (
              <div 
                key={item.id} 
                className="glass-card" 
                style={{ 
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderLeft: isEntrada ? '4px solid var(--accent-cyan)' : '4px solid var(--accent-gold)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: 'var(--radius-md)', 
                    background: isEntrada ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isEntrada ? (
                      <ArrowUpRight size={20} color="var(--accent-cyan)" />
                    ) : (
                      <ArrowDownRight size={20} color="var(--accent-gold)" />
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                      {item.descricao}
                    </h4>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {formatDate(item.data)} • {item.bairro || 'São Paulo'} • {item.forma}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.15rem', 
                      fontWeight: '700', 
                      color: isEntrada ? 'var(--primary-400)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {isEntrada ? '+' : '-'} {formatCurrency(item.valor)}
                    </div>
                    <span className={`badge ${item.status === 'pago' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                      {item.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  {item.status !== 'pago' && (
                    <button 
                      onClick={() => {
                        if (item.origem === 'cliente') {
                          setStatusPagamentoCliente(item.agendamentoId, 'pago');
                        } else if (item.origem === 'ajudante') {
                          setStatusPagamentoAjudante(item.agendamentoId, item.ajudanteId, 'pago');
                        }
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <CheckCircle size={14} />
                      <span>Liquidar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
