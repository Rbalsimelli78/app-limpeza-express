import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart } from './LineChart';
import { exportExtratoClienteXlsx, exportExtratoClienteCsv } from '../utils/exportExcel';
import { imprimirExtratoCliente } from '../utils/printStatement';
import { buildExtratoClienteText, getWhatsAppUrl } from '../utils/whatsapp';
import { 
  X, 
  Calendar, 
  FileSpreadsheet, 
  MessageCircle, 
  Printer, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  User,
  MapPin,
  Phone,
  RotateCcw
} from 'lucide-react';

export const ModalExtratoCliente = ({ isOpen, onClose, cliente }) => {
  const { agendamentos, planos, setStatusPagamentoCliente, showToast } = useApp();

  // Filtros de Período
  const [periodoTipo, setPeriodoTipo] = useState('todos'); // 'mes_atual', 'mes_anterior', 'semana_atual', 'ultimos_30', 'todos', 'custom'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Modo de Exibição: 'extrato' (foco nos lançamentos) | 'grafico' (foco no gráfico) | 'ambos' (ambos visíveis)
  const [modoVisualizacao, setModoVisualizacao] = useState('extrato');

  // Formatação de Valores
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR');
  };

  // Filtragem dos Agendamentos do Cliente
  const { agendamentosFiltrados, periodoDesc } = useMemo(() => {
    if (!cliente) return { agendamentosFiltrados: [], periodoDesc: 'Todo o Histórico' };

    const todosDoCliente = agendamentos.filter(ag => ag.clienteId === cliente.id);

    const now = new Date();
    const hojeStr = now.toISOString().slice(0, 10);

    let filtered = [...todosDoCliente];
    let desc = 'Todo o Histórico';

    if (periodoTipo === 'mes_atual') {
      const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1);
      const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      filtered = todosDoCliente.filter(ag => {
        const d = new Date(ag.dataHoraInicio);
        return d >= primeiroDia && d <= ultimoDia;
      });
      desc = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    } else if (periodoTipo === 'mes_anterior') {
      const primeiroDia = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ultimoDia = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      filtered = todosDoCliente.filter(ag => {
        const d = new Date(ag.dataHoraInicio);
        return d >= primeiroDia && d <= ultimoDia;
      });
      const mesAnt = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      desc = mesAnt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    } else if (periodoTipo === 'semana_atual') {
      const diaSemana = now.getDay(); // 0 = Domingo
      const primeiroDia = new Date(now);
      primeiroDia.setDate(now.getDate() - diaSemana);
      primeiroDia.setHours(0, 0, 0, 0);

      const ultimoDia = new Date(primeiroDia);
      ultimoDia.setDate(primeiroDia.getDate() + 6);
      ultimoDia.setHours(23, 59, 59, 999);

      filtered = todosDoCliente.filter(ag => {
        const d = new Date(ag.dataHoraInicio);
        return d >= primeiroDia && d <= ultimoDia;
      });
      desc = `Esta Semana (${primeiroDia.toLocaleDateString('pt-BR')} a ${ultimoDia.toLocaleDateString('pt-BR')})`;
    } else if (periodoTipo === 'ultimos_30') {
      const limite = new Date();
      limite.setDate(limite.getDate() - 30);
      filtered = todosDoCliente.filter(ag => new Date(ag.dataHoraInicio) >= limite);
      desc = 'Últimos 30 Dias';
    } else if (periodoTipo === 'custom') {
      if (dataInicio || dataFim) {
        filtered = todosDoCliente.filter(ag => {
          const dataAg = ag.dataHoraInicio.slice(0, 10);
          if (dataInicio && dataAg < dataInicio) return false;
          if (dataFim && dataAg > dataFim) return false;
          return true;
        });
        desc = `De ${dataInicio ? formatDate(dataInicio) : 'Início'} até ${dataFim ? formatDate(dataFim) : 'Hoje'}`;
      } else {
        desc = 'Período Personalizado';
      }
    }

    // Ordenar por data (mais recentes primeiro para a tabela)
    filtered.sort((a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio));

    return { agendamentosFiltrados: filtered, periodoDesc: desc };
  }, [cliente, agendamentos, periodoTipo, dataInicio, dataFim]);

  // Cálculos de Totais
  const { totalGeral, totalPago, totalPendente } = useMemo(() => {
    let geral = 0;
    let pago = 0;
    let pendente = 0;

    agendamentosFiltrados.forEach(ag => {
      const val = Number(ag.valorCliente) || 0;
      geral += val;
      if (ag.statusClientePagamento === 'pago') {
        pago += val;
      } else {
        pendente += val;
      }
    });

    return { totalGeral: geral, totalPago: pago, totalPendente: pendente };
  }, [agendamentosFiltrados]);

  // Dados para o Gráfico de Linha (ordenados por data crescente)
  const dadosGrafico = useMemo(() => {
    const ordenadosCrescente = [...agendamentosFiltrados].sort(
      (a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio)
    );

    return ordenadosCrescente.map(ag => {
      const d = new Date(ag.dataHoraInicio);
      const diaMes = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        label: diaMes,
        value: Number(ag.valorCliente) || 0,
        tooltip: `${d.toLocaleDateString('pt-BR')} - ${formatCurrency(ag.valorCliente)} (${ag.statusClientePagamento === 'pago' ? 'Pago' : 'Pendente'})`
      };
    });
  }, [agendamentosFiltrados]);

  // Ações de Exportação
  const handleExportExcel = async () => {
    try {
      showToast('Gerando planilha Excel (.xlsx) com gráfico...');
      await exportExtratoClienteXlsx({
        cliente,
        agendamentos: agendamentosFiltrados.map(ag => {
          const p = planos.find(pl => pl.id === ag.planoId);
          return { ...ag, planoNome: p?.nome || 'Faxina Residencial' };
        }),
        totalGeral,
        totalPago,
        totalPendente,
        periodoDesc,
        dadosGrafico
      });
      showToast('Extrato do cliente exportado para o Excel (.xlsx) com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar XLSX, usando fallback CSV:', err);
      exportExtratoClienteCsv({
        cliente,
        agendamentos: agendamentosFiltrados.map(ag => {
          const p = planos.find(pl => pl.id === ag.planoId);
          return { ...ag, planoNome: p?.nome || 'Faxina Residencial' };
        }),
        totalGeral,
        totalPago,
        totalPendente,
        periodoDesc
      });
      showToast('Extrato exportado para o Excel (.csv) com sucesso!');
    }
  };

  const handleEncaminharWhatsApp = () => {
    const texto = buildExtratoClienteText({
      clienteNome: cliente.nome,
      periodoDesc,
      agendamentos: agendamentosFiltrados.map(ag => {
        const p = planos.find(pl => pl.id === ag.planoId);
        return { ...ag, planoNome: p?.nome || 'Faxina Residencial' };
      }),
      totalGeral,
      totalPago,
      totalPendente
    });

    const url = getWhatsAppUrl(cliente.telefone, texto);
    window.open(url, '_blank');
  };

  const handleImprimir = () => {
    imprimirExtratoCliente({
      cliente,
      agendamentos: agendamentosFiltrados.map(ag => {
        const p = planos.find(pl => pl.id === ag.planoId);
        return { ...ag, planoNome: p?.nome || 'Faxina Residencial' };
      }),
      totalGeral,
      totalPago,
      totalPendente,
      periodoDesc,
      dadosGrafico
    });
  };

  if (!isOpen || !cliente) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '0.5rem' }}>
      <div 
        className="modal-extrato-content" 
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho do Extrato */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>Extrato Financeiro</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limpeza Express SP</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              {cliente.nome}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={12} color="var(--primary-400)" />
                {cliente.telefone || 'Sem telefone'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={12} color="var(--accent-cyan)" />
                {cliente.endereco} {cliente.apartamento ? `, Apto ${cliente.apartamento}` : ''} - {cliente.bairro}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon btn-sm"
            title="Fechar"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filtros de Período */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Calendar size={14} color="var(--primary-400)" />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Selecione o Período:
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {[
              { id: 'todos', label: 'Todo o Histórico' },
              { id: 'mes_atual', label: 'Este Mês' },
              { id: 'mes_anterior', label: 'Mês Anterior' },
              { id: 'semana_atual', label: 'Esta Semana' },
              { id: 'ultimos_30', label: 'Últimos 30 Dias' },
              { id: 'custom', label: 'Período Específico...' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodoTipo(p.id)}
                className={`btn btn-sm ${periodoTipo === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem', height: 'auto', minHeight: '28px' }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Inputs de Data Personalizada */}
          {periodoTipo === 'custom' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginTop: '0.5rem', 
              background: 'var(--bg-input)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>De:</span>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={e => setDataInicio(e.target.value)} 
                  className="input form-input"
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Até:</span>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={e => setDataFim(e.target.value)} 
                  className="input form-input"
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: '32px' }}
                />
              </div>

              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                {periodoDesc}
              </span>
            </div>
          )}
        </div>

        {/* Cards de KPIs do Período (1 Linha com 3 colunas) */}
        <div className="extrato-kpis-grid">
          <div className="extrato-kpi-box" style={{ borderLeft: '3px solid var(--primary-400)' }}>
            <span className="extrato-kpi-title">Total Período</span>
            <strong className="extrato-kpi-number" style={{ color: 'var(--primary-400)' }}>
              {formatCurrency(totalGeral)}
            </strong>
            <span className="extrato-kpi-subtitle">
              {agendamentosFiltrados.length} faxina(s)
            </span>
          </div>

          <div className="extrato-kpi-box" style={{ borderLeft: '3px solid var(--primary-500)' }}>
            <span className="extrato-kpi-title">Total Quitado</span>
            <strong className="extrato-kpi-number" style={{ color: 'var(--primary-500)' }}>
              {formatCurrency(totalPago)}
            </strong>
            <span className="extrato-kpi-subtitle">
              Confirmado
            </span>
          </div>

          <div className="extrato-kpi-box" style={{ borderLeft: totalPendente > 0 ? '3px solid var(--accent-gold)' : '3px solid var(--border-color)' }}>
            <span className="extrato-kpi-title">Saldo Pendente</span>
            <strong className="extrato-kpi-number" style={{ color: totalPendente > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
              {formatCurrency(totalPendente)}
            </strong>
            <span className="extrato-kpi-subtitle">
              {totalPendente > 0 ? 'Aguardando' : 'Tudo em dia'}
            </span>
          </div>
        </div>

        {/* Alternador de Abas / Visualização: Extrato vs Gráfico */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          margin: '0.85rem 0 1rem 0',
          padding: '0.4rem 0.6rem',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setModoVisualizacao('extrato')}
              className={`btn btn-sm ${modoVisualizacao === 'extrato' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', height: 'auto', minHeight: '30px', fontWeight: '600' }}
            >
              📋 Extrato & Lançamentos ({agendamentosFiltrados.length})
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao('grafico')}
              className={`btn btn-sm ${modoVisualizacao === 'grafico' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', height: 'auto', minHeight: '30px', fontWeight: '600' }}
            >
              📈 Gráfico de Evolução
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao('ambos')}
              className={`btn btn-sm ${modoVisualizacao === 'ambos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', height: 'auto', minHeight: '30px', fontWeight: '600' }}
            >
              👁️ Ver Ambos (Gráfico + Extrato)
            </button>
          </div>

          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            {modoVisualizacao === 'extrato' 
              ? 'Lançamentos detalhados em destaque' 
              : modoVisualizacao === 'grafico' 
                ? 'Curva visual dos pagamentos' 
                : 'Exibindo gráfico e extrato completo'}
          </span>
        </div>

        {/* Gráfico de Linha: exibido se modo for 'grafico' ou 'ambos' */}
        {(modoVisualizacao === 'grafico' || modoVisualizacao === 'ambos') && (
          <div className="chart-container-box" style={{ marginBottom: modoVisualizacao === 'ambos' ? '1rem' : '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <TrendingUp size={15} color="var(--primary-400)" />
                <span>Evolução dos Pagamentos ({periodoDesc})</span>
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Eixo X: Data • Eixo Y: R$
              </span>
            </div>

            <LineChart 
              data={dadosGrafico} 
              height={modoVisualizacao === 'ambos' ? 140 : 220} 
              color="#10b981" 
              gradientColor="#06b6d4" 
              valuePrefix="R$ " 
              emptyMessage="Nenhuma faxina registrada no período selecionado."
            />
          </div>
        )}

        {/* Seção da Tabela / Lançamentos: exibida se modo for 'extrato' ou 'ambos' */}
        {(modoVisualizacao === 'extrato' || modoVisualizacao === 'ambos') && (
          <>
            {/* Barra de Ações: Exportar Excel, WhatsApp, Imprimir */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Lançamentos Discriminados</span>
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                  {agendamentosFiltrados.length}
                </span>
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button 
                  type="button" 
                  onClick={handleExportExcel}
                  className="btn btn-secondary btn-sm"
                  title="Baixar planilha nativa (.xlsx) com gráfico para o Microsoft Excel"
                >
                  <FileSpreadsheet size={15} color="#10b981" />
                  <span>Exportar Excel (.xlsx)</span>
                </button>

                <button 
                  type="button" 
                  onClick={handleEncaminharWhatsApp}
                  className="btn btn-whatsapp btn-sm"
                  title="Enviar extrato para o cliente pelo WhatsApp"
                >
                  <MessageCircle size={15} />
                  <span>Encaminhar WhatsApp</span>
                </button>

                <button 
                  type="button" 
                  onClick={handleImprimir}
                  className="btn btn-secondary btn-sm"
                  title="Imprimir ou Salvar em PDF (Formato Oficial A4)"
                >
                  <Printer size={15} />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>

            {/* Tabela de Agendamentos */}
            <div style={{ 
              overflowX: 'auto', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              marginBottom: '1rem'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Data & Horário</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Plano / Pacote</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Dormitórios</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Valor Cobrado</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Status</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {agendamentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma faxina encontrada para o período selecionado.
                      </td>
                    </tr>
                  ) : (
                    agendamentosFiltrados.map((ag) => {
                      const p = planos.find(pl => pl.id === ag.planoId);
                      const isPago = ag.statusClientePagamento === 'pago';

                      return (
                        <tr 
                          key={ag.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)',
                            background: isPago ? 'transparent' : 'rgba(245, 158, 11, 0.03)'
                          }}
                        >
                          <td style={{ padding: '0.625rem 0.875rem', fontWeight: '500' }}>
                            {formatDate(ag.dataHoraInicio)}
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                              {new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {p?.nome || 'Plano de Limpeza'}
                            </span>
                            {ag.semManutencao2Meses && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', display: 'block' }}>
                                + R$ 50 taxa sem manutenção
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem', color: 'var(--text-secondary)' }}>
                            {ag.dormitorios || 2} dorms
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {formatCurrency(ag.valorCliente)}
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem' }}>
                            {isPago ? (
                              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                <CheckCircle2 size={12} />
                                <span>Pago</span>
                              </span>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                <Clock size={12} />
                                <span>Pendente</span>
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (isPago) {
                                  if (window.confirm(`Deseja estornar o pagamento da faxina (${formatCurrency(ag.valorCliente)}) para "Pendente"?`)) {
                                    setStatusPagamentoCliente(ag.id, 'pendente');
                                  }
                                } else {
                                  setStatusPagamentoCliente(ag.id, 'pago');
                                }
                              }}
                              className={`btn btn-sm ${isPago ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ 
                                padding: '0.25rem 0.55rem', 
                                fontSize: '0.725rem',
                                color: isPago ? '#f87171' : '#ffffff',
                                borderColor: isPago ? 'rgba(239, 68, 68, 0.4)' : undefined,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title={isPago ? 'Estornar pagamento e voltar para Pendente' : 'Marcar como pago'}
                            >
                              {isPago ? (
                                <>
                                  <RotateCcw size={12} />
                                  <span>Estornar</span>
                                </>
                              ) : (
                                <span>Receber / Pagar</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Rodapé de Fechamento */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Fechar Extrato
          </button>
        </div>
      </div>
    </div>
  );
};
