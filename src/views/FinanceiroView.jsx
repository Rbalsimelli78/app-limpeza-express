import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Users, 
  PieChart,
  Filter,
  RotateCcw,
  Search,
  FileSpreadsheet,
  Printer,
  X,
  UserCheck
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportFluxoCaixaXlsx } from '../utils/exportExcel';
import { imprimirFluxoCaixa } from '../utils/printStatement';

export const FinanceiroView = () => {
  const { agendamentos, clientes, ajudantes, getFinanceiroGeral, setStatusPagamentoCliente, setStatusPagamentoAjudante, showToast } = useApp();
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'pendentes', 'pagos'
  const [filtroClienteId, setFiltroClienteId] = useState(''); // '' = todos
  const [buscaTexto, setBuscaTexto] = useState('');

  const financeiroGeral = getFinanceiroGeral();

  // Monta lista completa de lançamentos com metadados detalhados
  const todosLancamentos = useMemo(() => {
    const list = [];

    agendamentos.forEach(ag => {
      const cliente = clientes.find(c => c.id === ag.clienteId);
      
      // Entrada do cliente
      list.push({
        id: `ent-${ag.id}`,
        agendamentoId: ag.id,
        clienteId: ag.clienteId,
        clienteNome: cliente?.nome || 'Cliente',
        tipo: 'entrada',
        descricao: `Faxina: ${cliente?.nome || 'Cliente'} (${ag.dormitorios} dorms)`,
        bairro: cliente?.bairro || '',
        data: ag.dataHoraInicio,
        valor: Number(ag.valorCliente || 0),
        status: ag.statusClientePagamento,
        forma: ag.formaPagamentoCliente || 'PIX',
        origem: 'cliente'
      });

      // Saídas de cada ajudante vinculada à faxina
      (ag.ajudantesEscaladas || []).forEach((ae, idx) => {
        const aj = ajudantes.find(a => a.id === ae.ajudanteId);
        list.push({
          id: `sai-${ag.id}-${idx}`,
          agendamentoId: ag.id,
          clienteId: ag.clienteId,
          clienteNome: cliente?.nome || 'Cliente',
          ajudanteId: ae.ajudanteId,
          ajudanteNome: aj?.nome || 'Ajudante',
          tipo: 'saida',
          descricao: `Diária: ${aj?.nome || 'Ajudante'} (Ref: ${cliente?.nome || 'Cliente'})`,
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

    return list;
  }, [agendamentos, clientes, ajudantes]);

  // Aplicação dos Filtros
  const lancamentosFiltrados = useMemo(() => {
    return todosLancamentos.filter(item => {
      // 1. Filtro de Status
      if (filtroStatus === 'pendentes' && item.status !== 'pendente') return false;
      if (filtroStatus === 'pagos' && item.status !== 'pago') return false;

      // 2. Filtro por Cliente selecionado
      if (filtroClienteId && item.clienteId !== filtroClienteId) return false;

      // 3. Busca Textual (Nome do cliente, descrição, ajudante ou bairro)
      if (buscaTexto.trim()) {
        const termo = buscaTexto.trim().toLowerCase();
        const matchDesc = item.descricao?.toLowerCase().includes(termo);
        const matchCli = item.clienteNome?.toLowerCase().includes(termo);
        const matchAj = item.ajudanteNome?.toLowerCase().includes(termo);
        const matchBairro = item.bairro?.toLowerCase().includes(termo);
        if (!matchDesc && !matchCli && !matchAj && !matchBairro) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [todosLancamentos, filtroStatus, filtroClienteId, buscaTexto]);

  // Cliente selecionado atualmente para o filtro
  const clienteSelecionadoObj = clientes.find(c => c.id === filtroClienteId);

  // Métricas calculadas para a visualização atual (se houver filtro por cliente ou busca)
  const isFiltrado = Boolean(filtroClienteId || buscaTexto.trim());

  const metricasExibicao = useMemo(() => {
    if (!isFiltrado) {
      const faturamentoTotal = financeiroGeral.totalRecebido + financeiroGeral.totalAReceber;
      const custosTotais = financeiroGeral.totalPagoAjudantes + financeiroGeral.totalAPagarAjudantes;
      const margemPercentual = faturamentoTotal > 0 ? Math.round(((faturamentoTotal - custosTotais) / faturamentoTotal) * 100) : 0;
      return {
        ...financeiroGeral,
        margemPercentual,
        isFiltrado: false
      };
    }

    let recRecebido = 0;
    let recPendente = 0;
    let pagRealizado = 0;
    let pagPendente = 0;

    lancamentosFiltrados.forEach(item => {
      const val = Number(item.valor || 0);
      if (item.tipo === 'entrada') {
        if (item.status === 'pago') recRecebido += val;
        else recPendente += val;
      } else {
        if (item.status === 'pago') pagRealizado += val;
        else pagPendente += val;
      }
    });

    const lucroRealizado = recRecebido - pagRealizado;
    const lucroProjetado = (recRecebido + recPendente) - (pagRealizado + pagPendente);
    const faturamentoTotal = recRecebido + recPendente;
    const custosTotais = pagRealizado + pagPendente;
    const margemPercentual = faturamentoTotal > 0 ? Math.round(((faturamentoTotal - custosTotais) / faturamentoTotal) * 100) : 0;

    return {
      totalRecebido: recRecebido,
      totalAReceber: recPendente,
      totalPagoAjudantes: pagRealizado,
      totalAPagarAjudantes: pagPendente,
      lucroRealizado,
      lucroProjetado,
      margemPercentual,
      isFiltrado: true
    };
  }, [isFiltrado, financeiroGeral, lancamentosFiltrados]);

  // Handler para exportar para Excel (.xlsx)
  const handleExportarExcel = async () => {
    try {
      showToast('Gerando planilha Excel (.xlsx) formatada...');
      await exportFluxoCaixaXlsx({
        lancamentos: lancamentosFiltrados,
        clienteFiltroNome: clienteSelecionadoObj?.nome || (buscaTexto ? `Busca: "${buscaTexto}"` : 'Todos os Clientes'),
        totalRecebido: metricasExibicao.totalRecebido,
        totalAReceber: metricasExibicao.totalAReceber,
        totalPagoAjudantes: metricasExibicao.totalPagoAjudantes,
        totalAPagarAjudantes: metricasExibicao.totalAPagarAjudantes,
        lucroRealizado: metricasExibicao.lucroRealizado,
        lucroProjetado: metricasExibicao.lucroProjetado,
        periodoDesc: isFiltrado ? `Filtro: ${clienteSelecionadoObj?.nome || buscaTexto}` : 'Extrato Geral Completo'
      });
      showToast('Planilha de Fluxo de Caixa baixada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      showToast('Erro ao gerar arquivo Excel.', 'danger');
    }
  };

  // Handler para imprimir / exportar PDF
  const handleExportarPdf = () => {
    try {
      showToast('Preparando relatório PDF para impressão...');
      imprimirFluxoCaixa({
        lancamentos: lancamentosFiltrados,
        clienteFiltroNome: clienteSelecionadoObj?.nome || (buscaTexto ? `Busca: "${buscaTexto}"` : null),
        totalRecebido: metricasExibicao.totalRecebido,
        totalAReceber: metricasExibicao.totalAReceber,
        totalPagoAjudantes: metricasExibicao.totalPagoAjudantes,
        totalAPagarAjudantes: metricasExibicao.totalAPagarAjudantes,
        lucroRealizado: metricasExibicao.lucroRealizado,
        lucroProjetado: metricasExibicao.lucroProjetado,
        periodoDesc: isFiltrado ? `Filtrado por: ${clienteSelecionadoObj?.nome || buscaTexto}` : 'Extrato Geral Consolidado'
      });
    } catch (err) {
      console.error('Erro ao gerar impressão:', err);
      showToast('Erro ao abrir visualização de impressão.', 'danger');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Cabeçalho com Botões de Exportação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <DollarSign size={24} color="var(--primary-400)" />
            <span>Fluxo de Caixa & Lucro Líquido</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Balanço financeiro detalhado entre recebimentos de clientes e pagamentos de ajudantes
          </p>
        </div>

        {/* Botões de Exportação Excel e PDF */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={handleExportarExcel}
            className="btn btn-secondary btn-sm"
            style={{ 
              borderColor: 'rgba(16, 185, 129, 0.4)', 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--primary-400)',
              gap: '0.45rem',
              fontWeight: '600'
            }}
            title="Exportar lançamentos atuais para planilha Excel (.xlsx nativo)"
          >
            <FileSpreadsheet size={16} />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button 
            type="button"
            onClick={handleExportarPdf}
            className="btn btn-secondary btn-sm"
            style={{ 
              borderColor: 'rgba(6, 182, 212, 0.4)', 
              background: 'rgba(6, 182, 212, 0.1)', 
              color: 'var(--accent-cyan)',
              gap: '0.45rem',
              fontWeight: '600'
            }}
            title="Imprimir extrato ou salvar em PDF em alta resolução"
          >
            <Printer size={16} />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Alerta de Filtro Ativo */}
      {isFiltrado && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.6rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={16} color="var(--primary-400)" />
            <span>
              Mostrando métricas e lançamentos filtrados para: <strong>{clienteSelecionadoObj?.nome || `"${buscaTexto}"`}</strong> ({lancamentosFiltrados.length} lançamento{lancamentosFiltrados.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFiltroClienteId('');
              setBuscaTexto('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            <X size={14} />
            <span>Limpar Filtro</span>
          </button>
        </div>
      )}

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
            {formatCurrency(metricasExibicao.lucroRealizado)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Margem Líquida Média: <strong>{metricasExibicao.margemPercentual}%</strong>
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
            {formatCurrency(metricasExibicao.totalRecebido)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ainda a receber: {formatCurrency(metricasExibicao.totalAReceber)}
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
            {formatCurrency(metricasExibicao.totalPagoAjudantes)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Pendente a pagar: {formatCurrency(metricasExibicao.totalAPagarAjudantes)}
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
            {formatCurrency(metricasExibicao.lucroProjetado)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Com todas faxinas pagas
          </span>
        </div>
      </div>

      {/* Painel Avançado de Filtros */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--primary-400)" />
            <span>Filtrar Extrato de Lançamentos</span>
          </h3>

          {/* Botões de Status: Todos, Pendentes, Pagos */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
              type="button"
              onClick={() => setFiltroStatus('todos')} 
              className={`btn btn-sm ${filtroStatus === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos
            </button>
            <button 
              type="button"
              onClick={() => setFiltroStatus('pendentes')} 
              className={`btn btn-sm ${filtroStatus === 'pendentes' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Pendentes
            </button>
            <button 
              type="button"
              onClick={() => setFiltroStatus('pagos')} 
              className={`btn btn-sm ${filtroStatus === 'pagos' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Liquidados / Pagos
            </button>
          </div>
        </div>

        {/* Linha de Busca e Seleção de Cliente */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {/* Seletor Rápido por Cliente */}
          <div style={{ position: 'relative' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Filtrar por Cliente Cadastrado:
            </label>
            <select
              className="form-select"
              value={filtroClienteId}
              onChange={e => setFiltroClienteId(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="">-- Todos os Clientes ({clientes.length}) --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.condominio ? `(${c.condominio})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Busca Textual Aberta */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Buscar por Nome, Ajudante ou Bairro:
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: Mariana, Luiza, Moema, Maria..."
                style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                value={buscaTexto}
                onChange={e => setBuscaTexto(e.target.value)}
              />
              {buscaTexto && (
                <button
                  type="button"
                  onClick={() => setBuscaTexto('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {lancamentosFiltrados.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <DollarSign size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum lançamento financeiro encontrado com os filtros selecionados.</p>
            {isFiltrado && (
              <button 
                type="button"
                onClick={() => {
                  setFiltroClienteId('');
                  setBuscaTexto('');
                  setFiltroStatus('todos');
                }}
                className="btn btn-secondary btn-sm" 
                style={{ marginTop: '1rem' }}
              >
                Limpar Todos os Filtros
              </button>
            )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {item.descricao}
                      </h4>
                      {item.clienteNome && item.tipo === 'saida' && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                          Cliente: {item.clienteNome}
                        </span>
                      )}
                    </div>
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

                  {item.status === 'pago' ? (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Deseja estornar este lançamento (${formatCurrency(item.valor)}) para Pendente?`)) {
                          if (item.origem === 'cliente') {
                            setStatusPagamentoCliente(item.agendamentoId, 'pendente');
                          } else if (item.origem === 'ajudante') {
                            setStatusPagamentoAjudante(item.agendamentoId, item.ajudanteId, 'pendente');
                          }
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ 
                        padding: '0.35rem 0.65rem', 
                        fontSize: '0.75rem',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Estornar lançamento para Pendente"
                    >
                      <RotateCcw size={13} />
                      <span>Estornar</span>
                    </button>
                  ) : (
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
