import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart } from './LineChart';
import { exportExtratoAjudanteXlsx, exportExtratoAjudanteCsv } from '../utils/exportExcel';
import { imprimirExtratoAjudante, imprimirReciboPagamentoAjudante } from '../utils/printStatement';
import { buildExtratoAjudanteText, buildReciboPagamentoAjudanteText, getWhatsAppUrl } from '../utils/whatsapp';
import { 
  X, 
  Calendar, 
  FileSpreadsheet, 
  MessageCircle, 
  Printer, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Phone,
  Copy,
  Check,
  CreditCard,
  Search,
  RotateCcw,
  ChevronDown,
  FileText
} from 'lucide-react';

export const ModalExtratoAjudante = ({ isOpen, onClose, ajudante }) => {
  const { agendamentos, clientes, setStatusPagamentoAjudante, setBatchStatusPagamentoAjudante, showToast } = useApp();

  // Filtros de Período e Busca
  const [periodoTipo, setPeriodoTipo] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Dropdown de Opções de Impressão (com ou sem gráfico)
  const [menuImprimirAberto, setMenuImprimirAberto] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState('todos'); // 'todos' | 'pendente' | 'pago' | 'concluidas'
  const [buscaTabela, setBuscaTabela] = useState('');

  // Seleção de Diárias para Fechamento & Pagamento
  const [selecionadosIds, setSelecionadosIds] = useState(new Set());
  const [dataCorteFechamento, setDataCorteFechamento] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [reciboCopiado, setReciboCopiado] = useState(false);
  const [valorPixCopiado, setValorPixCopiado] = useState(false);

  // Modo de Exibição: 'extrato' (foco nas diárias) | 'grafico' (foco no gráfico) | 'ambos' (ambos visíveis)
  const [modoVisualizacao, setModoVisualizacao] = useState('extrato');

  // Formatação
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR');
  };

  const copiarPix = (chave) => {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setPixCopiado(true);
    showToast('Chave PIX copiada!');
    setTimeout(() => setPixCopiado(false), 2500);
  };

  // Montar Histórico Completo de Diárias da Ajudante (suporta ajudantesEscaladas oficial e ajudantesIds legado)
  const todasAsDiarias = useMemo(() => {
    if (!ajudante) return [];

    const list = [];
    agendamentos.forEach(ag => {
      const escala = (ag.ajudantesEscaladas || []).find(ae => ae.ajudanteId === ajudante.id);
      const hasIdLegado = (ag.ajudantesIds || []).includes(ajudante.id);

      if (escala || hasIdLegado) {
        const cli = clientes.find(c => c.id === ag.clienteId);
        const valorPago = escala?.valorAPagar !== undefined
          ? Number(escala.valorAPagar)
          : (ag.valoresAjudantes && ag.valoresAjudantes[ajudante.id]) !== undefined
            ? Number(ag.valoresAjudantes[ajudante.id])
            : Number(ajudante.valorPadrao || 100);

        const statusPag = escala?.statusPagamento 
          || (ag.pagamentosAjudantes && ag.pagamentosAjudantes[ajudante.id]) 
          || 'pendente';

        list.push({
          agendamentoId: ag.id,
          clienteNome: cli?.nome || 'Cliente',
          clienteLocal: cli ? `${cli.condominio ? cli.condominio + (cli.torre ? ` (Torre ${cli.torre})` : '') + ' • ' : ''}${cli.bairro || cli.endereco || 'São Paulo - SP'}` : 'São Paulo - SP',
          dataHora: ag.dataHoraInicio,
          dataHoraFim: ag.dataHoraFim || '',
          valor: valorPago,
          statusPagamento: statusPag,
          statusServico: ag.statusServico || ag.status || 'agendado'
        });
      }
    });

    // Ordenação do dia 01 ao dia 31 (ordem cronológica crescente)
    return list.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));
  }, [ajudante, agendamentos, clientes]);

  // Filtragem por Período
  const { diariasFiltradas, periodoDesc } = useMemo(() => {
    if (!ajudante) return { diariasFiltradas: [], periodoDesc: 'Todo o Histórico' };

    const now = new Date();
    let filtered = [...todasAsDiarias];
    let desc = 'Todo o Histórico';

    if (periodoTipo === 'mes_atual') {
      const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1);
      const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      filtered = todasAsDiarias.filter(d => {
        const dt = new Date(d.dataHora);
        return dt >= primeiroDia && dt <= ultimoDia;
      });
      desc = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    } else if (periodoTipo === 'mes_anterior') {
      const primeiroDia = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ultimoDia = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      filtered = todasAsDiarias.filter(d => {
        const dt = new Date(d.dataHora);
        return dt >= primeiroDia && dt <= ultimoDia;
      });
      const mesAnt = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      desc = mesAnt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    } else if (periodoTipo === 'semana_atual') {
      const diaSemana = now.getDay();
      const primeiroDia = new Date(now);
      primeiroDia.setDate(now.getDate() - diaSemana);
      primeiroDia.setHours(0, 0, 0, 0);

      const ultimoDia = new Date(primeiroDia);
      ultimoDia.setDate(primeiroDia.getDate() + 6);
      ultimoDia.setHours(23, 59, 59, 999);

      filtered = todasAsDiarias.filter(d => {
        const dt = new Date(d.dataHora);
        return dt >= primeiroDia && dt <= ultimoDia;
      });
      desc = `Esta Semana (${primeiroDia.toLocaleDateString('pt-BR')} a ${ultimoDia.toLocaleDateString('pt-BR')})`;
    } else if (periodoTipo === 'ultimos_30') {
      const limite = new Date();
      limite.setDate(limite.getDate() - 30);
      filtered = todasAsDiarias.filter(d => new Date(d.dataHora) >= limite);
      desc = 'Últimos 30 Dias';
    } else if (periodoTipo === 'custom') {
      if (dataInicio || dataFim) {
        filtered = todasAsDiarias.filter(d => {
          const dataStr = d.dataHora.slice(0, 10);
          if (dataInicio && dataStr < dataInicio) return false;
          if (dataFim && dataStr > dataFim) return false;
          return true;
        });
        desc = `De ${dataInicio ? formatDate(dataInicio) : 'Início'} até ${dataFim ? formatDate(dataFim) : 'Hoje'}`;
      } else {
        desc = 'Período Personalizado';
      }
    }

    // Ordenação do dia 01 ao dia 31 (ordem cronológica crescente)
    filtered.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));
    return { diariasFiltradas: filtered, periodoDesc: desc };
  }, [todasAsDiarias, periodoTipo, dataInicio, dataFim, ajudante]);

  // Totais
  const { totalGeral, totalPago, totalPendente } = useMemo(() => {
    let geral = 0;
    let pago = 0;
    let pendente = 0;

    diariasFiltradas.forEach(d => {
      const val = Number(d.valor) || 0;
      geral += val;
      if (d.statusPagamento === 'pago') {
        pago += val;
      } else {
        pendente += val;
      }
    });

    return { totalGeral: geral, totalPago: pago, totalPendente: pendente };
  }, [diariasFiltradas]);

  // Diárias filtradas por status e busca textual para a tabela
  const diariasExibidas = useMemo(() => {
    return diariasFiltradas.filter(d => {
      if (statusFiltro === 'pendente' && d.statusPagamento === 'pago') return false;
      if (statusFiltro === 'pago' && d.statusPagamento !== 'pago') return false;
      if (statusFiltro === 'concluidas' && d.statusServico !== 'concluido') return false;
      if (buscaTabela.trim()) {
        const t = buscaTabela.toLowerCase();
        const m = d.clienteNome?.toLowerCase().includes(t) || d.clienteLocal?.toLowerCase().includes(t);
        if (!m) return false;
      }
      return true;
    });
  }, [diariasFiltradas, statusFiltro, buscaTabela]);

  // Gestão de Seleção de Diárias
  const toggleSelecionado = (agId) => {
    setSelecionadosIds(prev => {
      const next = new Set(prev);
      if (next.has(agId)) {
        next.delete(agId);
      } else {
        next.add(agId);
      }
      return next;
    });
  };

  const selecionarConcluidasAteData = () => {
    const novos = new Set(selecionadosIds);
    let count = 0;
    diariasFiltradas.forEach(d => {
      const dataStr = (d.dataHora || '').slice(0, 10);
      const isConcluida = d.statusServico === 'concluido';
      const isPendente = d.statusPagamento !== 'pago';
      const ateData = !dataCorteFechamento || dataStr <= dataCorteFechamento;
      if (isConcluida && isPendente && ateData) {
        novos.add(d.agendamentoId);
        count++;
      }
    });
    setSelecionadosIds(novos);
    showToast(`${count} diária(s) concluída(s) a pagar selecionada(s)!`);
  };

  const selecionarTodasAPagar = () => {
    const novos = new Set();
    diariasFiltradas.forEach(d => {
      if (d.statusPagamento !== 'pago') {
        novos.add(d.agendamentoId);
      }
    });
    setSelecionadosIds(novos);
    showToast(`${novos.size} diária(s) a pagar selecionada(s)!`);
  };

  const limparSelecao = () => {
    setSelecionadosIds(new Set());
  };

  const itensSelecionados = useMemo(() => {
    return todasAsDiarias.filter(d => selecionadosIds.has(d.agendamentoId));
  }, [todasAsDiarias, selecionadosIds]);

  const totalSelecionado = useMemo(() => {
    return itensSelecionados.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  }, [itensSelecionados]);

  // Itens para compor o recibo oficial
  const itensParaRecibo = useMemo(() => {
    if (itensSelecionados.length > 0) {
      return itensSelecionados;
    }
    // Se nada selecionado explicitamente, pega as diárias do período filtrado
    return diariasFiltradas;
  }, [itensSelecionados, diariasFiltradas]);

  const totalRecibo = useMemo(() => {
    return itensParaRecibo.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  }, [itensParaRecibo]);

  const todosExibidosSelecionados = diariasExibidas.length > 0 && diariasExibidas.every(d => selecionadosIds.has(d.agendamentoId));

  const toggleSelectAllVisible = () => {
    setSelecionadosIds(prev => {
      const next = new Set(prev);
      if (todosExibidosSelecionados) {
        diariasExibidas.forEach(d => next.delete(d.agendamentoId));
      } else {
        diariasExibidas.forEach(d => next.add(d.agendamentoId));
      }
      return next;
    });
  };

  const handlePagarSelecionadas = () => {
    if (itensSelecionados.length === 0) return;
    const pendentes = itensSelecionados.filter(it => it.statusPagamento !== 'pago');
    if (pendentes.length === 0) {
      showToast('Todas as diárias selecionadas já constam como pagas!');
      return;
    }

    const valorTot = pendentes.reduce((a, b) => a + Number(b.valor || 0), 0);
    if (window.confirm(`Confirma o pagamento de ${pendentes.length} diária(s) para ${ajudante.nome} no valor total de ${formatCurrency(valorTot)}?`)) {
      const itensParaPagar = pendentes.map(p => ({
        agendamentoId: p.agendamentoId,
        ajudanteId: ajudante.id
      }));
      if (setBatchStatusPagamentoAjudante) {
        setBatchStatusPagamentoAjudante(itensParaPagar, 'pago');
      } else {
        itensParaPagar.forEach(it => setStatusPagamentoAjudante(it.agendamentoId, it.ajudanteId, 'pago'));
      }
      setSelecionadosIds(new Set());
    }
  };

  // Dados para o Gráfico de Linhas (ordenados crescente)
  const dadosGrafico = useMemo(() => {
    const ordenadosCrescente = [...diariasFiltradas].sort(
      (a, b) => new Date(a.dataHora) - new Date(b.dataHora)
    );

    return ordenadosCrescente.map(d => {
      const dt = new Date(d.dataHora);
      const diaMes = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
      return {
        label: diaMes,
        value: Number(d.valor) || 0,
        tooltip: `${dt.toLocaleDateString('pt-BR')} - ${d.clienteNome}: ${formatCurrency(d.valor)} (${d.statusPagamento === 'pago' ? 'Pago' : 'A Pagar'})`
      };
    });
  }, [diariasFiltradas]);

  // Ações de Exportação
  const handleExportExcel = async () => {
    try {
      showToast('Gerando planilha Excel (.xlsx) com gráfico...');
      await exportExtratoAjudanteXlsx({
        ajudante,
        historicoDiarias: diariasFiltradas,
        totalGeral,
        totalPago,
        totalPendente,
        periodoDesc,
        dadosGrafico
      });
      showToast('Extrato de diárias exportado para o Excel (.xlsx) com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar XLSX, usando fallback CSV:', err);
      exportExtratoAjudanteCsv({
        ajudante,
        historicoDiarias: diariasFiltradas,
        totalGeral,
        totalPago,
        totalPendente,
        periodoDesc
      });
      showToast('Planilha de diárias exportada em CSV com sucesso!');
    }
  };

  const handleEncaminharWhatsApp = () => {
    const texto = buildExtratoAjudanteText({
      ajudanteNome: ajudante.nome,
      periodoDesc,
      historicoDiarias: diariasFiltradas,
      totalGeral,
      totalPago,
      totalPendente,
      chavePix: ajudante.chavePix,
      tipoPix: ajudante.tipoPix
    });

    const url = getWhatsAppUrl(ajudante.telefone, texto);
    window.open(url, '_blank');
  };

  const handleImprimir = (comGrafico = false) => {
    imprimirExtratoAjudante({
      ajudante,
      historicoDiarias: diariasFiltradas,
      totalGeral,
      totalPago,
      totalPendente,
      periodoDesc,
      dadosGrafico,
      incluirGrafico: comGrafico
    });
  };

  if (!isOpen || !ajudante) return null;

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
              <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>Extrato de Diárias</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limpeza Express SP</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              {ajudante.nome}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={12} color="var(--primary-400)" />
                {ajudante.telefone || 'Sem telefone'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CreditCard size={12} color="var(--accent-gold)" />
                PIX: {ajudante.chavePix || 'Não cadastrada'} ({ajudante.tipoPix || 'Chave'})
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

        {/* Chave PIX Destacada para Pagamento Rápido */}
        {ajudante.chavePix && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.85rem'
          }}>
            <div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', display: 'block' }}>
                CHAVE PIX ({ajudante.tipoPix})
              </span>
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                {ajudante.chavePix}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => copiarPix(ajudante.chavePix)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.3rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            >
              {pixCopiado ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{pixCopiado ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        )}

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

        {/* Cards de KPIs (1 Linha com 3 colunas) */}
        <div className="extrato-kpis-grid">
          <div className="extrato-kpi-box" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
            <span className="extrato-kpi-title">Total Diárias</span>
            <strong className="extrato-kpi-number" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(totalGeral)}
            </strong>
            <span className="extrato-kpi-subtitle">
              {diariasFiltradas.length} serviço(s)
            </span>
          </div>

          <div className="extrato-kpi-box" style={{ borderLeft: '3px solid var(--primary-500)' }}>
            <span className="extrato-kpi-title">Já Pago</span>
            <strong className="extrato-kpi-number" style={{ color: 'var(--primary-500)' }}>
              {formatCurrency(totalPago)}
            </strong>
            <span className="extrato-kpi-subtitle">
              Transferido
            </span>
          </div>

          <div className="extrato-kpi-box" style={{ borderLeft: totalPendente > 0 ? '3px solid var(--accent-gold)' : '3px solid var(--border-color)' }}>
            <span className="extrato-kpi-title">Saldo a Pagar</span>
            <strong className="extrato-kpi-number" style={{ color: totalPendente > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
              {formatCurrency(totalPendente)}
            </strong>
            <span className="extrato-kpi-subtitle">
              {totalPendente > 0 ? 'PIX Pendente' : 'Quitado'}
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
              📋 Diárias Realizadas ({diariasFiltradas.length})
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
              👁️ Ver Ambos (Gráfico + Diárias)
            </button>
          </div>

          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            {modoVisualizacao === 'extrato' 
              ? 'Tabela de diárias em destaque' 
              : modoVisualizacao === 'grafico' 
                ? 'Curva visual dos pagamentos' 
                : 'Exibindo gráfico e tabela completa'}
          </span>
        </div>

        {/* Gráfico de Linha: exibido quando modo é 'grafico' ou 'ambos' */}
        {(modoVisualizacao === 'grafico' || modoVisualizacao === 'ambos') && (
          <div className="chart-container-box" style={{ marginBottom: modoVisualizacao === 'ambos' ? '1rem' : '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <TrendingUp size={15} color="var(--accent-cyan)" />
                <span>Evolução das Diárias ({periodoDesc})</span>
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Eixo X: Data • Eixo Y: R$
              </span>
            </div>

            <LineChart 
              data={dadosGrafico} 
              height={modoVisualizacao === 'ambos' ? 140 : 220} 
              color="#06b6d4" 
              gradientColor="#3b82f6" 
              valuePrefix="R$ " 
              emptyMessage="Nenhuma diária registrada no período selecionado."
            />
          </div>
        )}

        {/* Seção da Tabela de Diárias: exibida quando modo é 'extrato' ou 'ambos' */}
        {(modoVisualizacao === 'extrato' || modoVisualizacao === 'ambos') && (
          <>
            {/* Barra de Ações: Exportar Excel, WhatsApp, Imprimir */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Diárias Realizadas</span>
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                  {diariasFiltradas.length}
                </span>
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button 
                  type="button" 
                  onClick={handleExportExcel}
                  className="btn btn-secondary btn-sm"
                  title="Baixar relatório (.xlsx) com gráfico para o Microsoft Excel"
                >
                  <FileSpreadsheet size={15} color="#10b981" />
                  <span>Exportar Excel (.xlsx)</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => {
                    if (selecionadosIds.size === 0) {
                      selecionarTodasAPagar();
                    }
                    setModalReciboAberto(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Gerar recibo detalhado de fechamento com chave PIX e relação de limpezas"
                  style={{ gap: '0.35rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                >
                  <FileText size={15} />
                  <span>Recibo de Pagamento</span>
                </button>

                <button 
                  type="button" 
                  onClick={handleEncaminharWhatsApp}
                  className="btn btn-whatsapp btn-sm"
                  title="Enviar extrato para a colaboradora pelo WhatsApp"
                >
                  <MessageCircle size={15} />
                  <span>Encaminhar WhatsApp</span>
                </button>

                {/* Botão de Impressão com Opção de Imprimir com ou sem Gráfico */}
                <div style={{ position: 'relative' }}>
                  <button 
                    type="button" 
                    onClick={() => setMenuImprimirAberto(prev => !prev)}
                    className="btn btn-secondary btn-sm"
                    title="Imprimir ou Salvar em PDF (Formato Oficial A4)"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Printer size={15} />
                    <span>Imprimir / PDF</span>
                    <ChevronDown size={13} style={{ transform: menuImprimirAberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {menuImprimirAberto && (
                    <>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
                        onClick={() => setMenuImprimirAberto(false)} 
                      />
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 6px)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '0.4rem',
                        minWidth: '260px',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuImprimirAberto(false);
                            handleImprimir(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.8rem',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FileText size={16} color="var(--primary-400)" />
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-primary)' }}>📄 Imprimir sem Gráfico</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recomendado para envio e comprovante</span>
                          </div>
                        </button>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.15rem 0' }} />

                        <button
                          type="button"
                          onClick={() => {
                            setMenuImprimirAberto(false);
                            handleImprimir(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.8rem',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'rgba(6, 182, 212, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <TrendingUp size={16} color="var(--accent-cyan)" />
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-primary)' }}>📊 Imprimir com Gráfico</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Inclui curva visual de diárias</span>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de Fechamento e Seleção de Diárias */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} color="var(--primary-400)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Pagar limpezas até:
                  </span>
                </div>

                <input 
                  type="date"
                  value={dataCorteFechamento}
                  onChange={e => setDataCorteFechamento(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', height: '30px', width: '145px' }}
                />

                <button
                  type="button"
                  onClick={selecionarConcluidasAteData}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', height: '30px' }}
                  title="Selecionar apenas diárias concluídas e não pagas até a data informada"
                >
                  <Check size={14} />
                  <span>Selecionar Concluídas até {dataCorteFechamento ? formatDate(dataCorteFechamento) : 'Hoje'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={selecionarTodasAPagar}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', height: '30px' }}
                >
                  <span>Selecionar Todas a Pagar</span>
                </button>

                {selecionadosIds.size > 0 && (
                  <button
                    type="button"
                    onClick={limparSelecao}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', height: '30px', color: '#f87171' }}
                  >
                    <span>✕ Desmarcar ({selecionadosIds.size})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Barra de Filtro de Status e Busca na Tabela */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Exibir:</span>
                <button
                  type="button"
                  onClick={() => setStatusFiltro('todos')}
                  className={`badge ${statusFiltro === 'todos' ? 'badge-info' : 'badge-neutral'}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.25rem 0.55rem', fontSize: '0.725rem' }}
                >
                  Todas ({diariasFiltradas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFiltro('concluidas')}
                  className={`badge ${statusFiltro === 'concluidas' ? 'badge-success' : 'badge-neutral'}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.25rem 0.55rem', fontSize: '0.725rem' }}
                >
                  ✓ Concluídas ({diariasFiltradas.filter(d => d.statusServico === 'concluido').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFiltro('pendente')}
                  className={`badge ${statusFiltro === 'pendente' ? 'badge-warning' : 'badge-neutral'}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.25rem 0.55rem', fontSize: '0.725rem' }}
                >
                  ⏳ A Pagar ({diariasFiltradas.filter(d => d.statusPagamento !== 'pago').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFiltro('pago')}
                  className={`badge ${statusFiltro === 'pago' ? 'badge-success' : 'badge-neutral'}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.25rem 0.55rem', fontSize: '0.725rem' }}
                >
                  ✓ Pagas ({diariasFiltradas.filter(d => d.statusPagamento === 'pago').length})
                </button>
              </div>

              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar cliente ou local..."
                  value={buscaTabela}
                  onChange={e => setBuscaTabela(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.78rem', height: '30px' }}
                />
              </div>
            </div>

            {/* Tabela de Diárias */}
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
                    <th style={{ padding: '0.625rem 0.6rem', width: '38px', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={todosExibidosSelecionados}
                        onChange={toggleSelectAllVisible}
                        title="Selecionar / Desmarcar todas as diárias visíveis"
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Data</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Cliente Atendido</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Local / Endereço</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Valor da Diária</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Status Serviço</th>
                    <th style={{ padding: '0.625rem 0.875rem' }}>Status Pagamento</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {diariasExibidas.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma diária encontrada para o período selecionado.
                      </td>
                    </tr>
                  ) : (
                    diariasExibidas.map((d, index) => {
                      const isPago = d.statusPagamento === 'pago';
                      const isSelected = selecionadosIds.has(d.agendamentoId);

                      return (
                        <tr 
                          key={index} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)',
                            background: isSelected 
                              ? 'rgba(16, 185, 129, 0.12)' 
                              : isPago 
                                ? 'transparent' 
                                : 'rgba(245, 158, 11, 0.03)'
                          }}
                        >
                          <td style={{ padding: '0.625rem 0.6rem', textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelecionado(d.agendamentoId)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem', fontWeight: '500' }}>
                            {formatDate(d.dataHora)}
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                              {new Date(d.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {d.clienteNome}
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem', color: 'var(--text-secondary)' }}>
                            {d.clienteLocal || 'Endereço cadastrado'}
                          </td>

                          <td style={{ padding: '0.625rem 0.875rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                            {formatCurrency(d.valor)}
                          </td>

                          {/* Status do Serviço */}
                          <td style={{ padding: '0.625rem 0.875rem' }}>
                            {d.statusServico === 'concluido' ? (
                              <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle2 size={12} />
                                <span>Concluída</span>
                              </span>
                            ) : d.statusServico === 'cancelado' ? (
                              <span className="badge badge-danger" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <X size={12} />
                                <span>Cancelada</span>
                              </span>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={12} />
                                <span>Agendada</span>
                              </span>
                            )}
                          </td>

                          {/* Status do Pagamento */}
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
                                  if (window.confirm(`Deseja estornar o pagamento desta diária (${formatCurrency(d.valor)}) para "A Pagar"?`)) {
                                    setStatusPagamentoAjudante(d.agendamentoId, ajudante.id, 'pendente');
                                  }
                                } else {
                                  setStatusPagamentoAjudante(d.agendamentoId, ajudante.id, 'pago');
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
                              title={isPago ? 'Estornar pagamento e voltar para A Pagar' : 'Marcar diária como paga'}
                            >
                              {isPago ? (
                                <>
                                  <RotateCcw size={12} />
                                  <span>Estornar</span>
                                </>
                              ) : (
                                <span>Pagar Agora</span>
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

            {/* Barra de Ação Flutuante / Resumo da Seleção de Diárias */}
            {selecionadosIds.size > 0 && (
              <div style={{
                position: 'sticky',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--primary-500)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                zIndex: 20,
                marginTop: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--primary-500)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.85rem'
                    }}>
                      {itensSelecionados.length}
                    </span>
                    <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                      {itensSelecionados.length === 1 ? '1 diária selecionada' : `${itensSelecionados.length} diárias selecionadas`}
                    </strong>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total a pagar: <strong style={{ fontSize: '1.15rem', color: 'var(--accent-gold)' }}>{formatCurrency(totalSelecionado)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setModalReciboAberto(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', gap: '0.35rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                  >
                    <FileText size={15} />
                    <span>🧾 Gerar Recibo de Pagamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePagarSelecionadas}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', gap: '0.35rem' }}
                  >
                    <CreditCard size={15} />
                    <span>Pagar Selecionadas ({formatCurrency(totalSelecionado)})</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Rodapé de Fechamento */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Fechar Extrato
          </button>
        </div>

        {/* MODAL OFICIAL: RECIBO DE PAGAMENTO DE DIÁRIAS */}
        {modalReciboAberto && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setModalReciboAberto(false)}
          >
            <div 
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem',
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Topo do Recibo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary-500)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.725rem' }}>Recibo de Pagamento</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limpeza Express SP</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '800' }}>
                    Recibo de Diárias - {ajudante.nome}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Fechamento: <strong>{periodoDesc}</strong> • Emissão: {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalReciboAberto(false)}
                  className="btn btn-secondary btn-icon btn-sm"
                  title="Fechar Recibo"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Informações da Colaboradora e Chave PIX */}
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>
                    Colaboradora / Diarista
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {ajudante.nome}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {ajudante.telefone || 'Sem telefone cadastrado'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>
                    Chave PIX para Transferência ({ajudante.tipoPix || 'Chave'})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>
                      {ajudante.chavePix || 'Não cadastrada'}
                    </strong>
                    {ajudante.chavePix && (
                      <button
                        type="button"
                        onClick={() => copiarPix(ajudante.chavePix)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                        title="Copiar Chave PIX"
                      >
                        {pixCopiado ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: '700' }}>
                    Valor Total Líquido
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--primary-400)' }}>
                      {formatCurrency(totalRecibo)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(Number(totalRecibo).toFixed(2));
                        setValorPixCopiado(true);
                        showToast('Valor em R$ copiado para a área de transferência!');
                        setTimeout(() => setValorPixCopiado(false), 2000);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                      title="Copiar valor exato do PIX"
                    >
                      {valorPixCopiado ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{valorPixCopiado ? 'Copiado!' : 'Copiar R$'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Composição das Diárias */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Composição das Diárias ({itensParaRecibo.length} serviço{itensParaRecibo.length === 1 ? '' : 's'}):
                  </h4>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Ordem Cronológica (01 ao 31)
                  </span>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0.6rem', width: '30px' }}>#</th>
                        <th style={{ padding: '0.5rem 0.6rem' }}>Data & Horário</th>
                        <th style={{ padding: '0.5rem 0.6rem' }}>Cliente</th>
                        <th style={{ padding: '0.5rem 0.6rem' }}>Local / Condomínio</th>
                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>Serviço</th>
                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensParaRecibo.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ padding: '0.5rem 0.6rem', fontWeight: '600' }}>
                            {formatDate(it.dataHora)} {new Date(it.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {it.clienteNome}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-secondary)' }}>
                            {it.clienteLocal}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                              {it.statusServico === 'concluido' ? 'Concluída' : it.statusServico}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: '700', color: 'var(--primary-400)' }}>
                            {formatCurrency(it.valor)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'rgba(16, 185, 129, 0.08)', fontWeight: '800' }}>
                        <td colSpan="5" style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                          VALOR TOTAL A PAGAR:
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', color: 'var(--primary-400)', fontSize: '0.95rem' }}>
                          {formatCurrency(totalRecibo)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ações do Recibo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const texto = buildReciboPagamentoAjudanteText({
                        ajudanteNome: ajudante.nome,
                        chavePix: ajudante.chavePix,
                        tipoPix: ajudante.tipoPix,
                        periodoDesc,
                        itens: itensParaRecibo,
                        total: totalRecibo
                      });
                      const url = getWhatsAppUrl(ajudante.telefone, texto);
                      window.open(url, '_blank');
                    }}
                    className="btn btn-whatsapp btn-sm"
                    style={{ gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <MessageCircle size={15} />
                    <span>Enviar Recibo WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const texto = buildReciboPagamentoAjudanteText({
                        ajudanteNome: ajudante.nome,
                        chavePix: ajudante.chavePix,
                        tipoPix: ajudante.tipoPix,
                        periodoDesc,
                        itens: itensParaRecibo,
                        total: totalRecibo
                      });
                      navigator.clipboard.writeText(texto);
                      setReciboCopiado(true);
                      showToast('Texto do recibo copiado com sucesso!');
                      setTimeout(() => setReciboCopiado(false), 2500);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    {reciboCopiado ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{reciboCopiado ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      imprimirReciboPagamentoAjudante({
                        ajudante,
                        itens: itensParaRecibo,
                        total: totalRecibo,
                        periodoDesc
                      });
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <Printer size={15} />
                    <span>Imprimir Recibo (PDF A4)</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {itensParaRecibo.some(i => i.statusPagamento !== 'pago') && (
                    <button
                      type="button"
                      onClick={() => {
                        const pendentes = itensParaRecibo.filter(i => i.statusPagamento !== 'pago');
                        if (window.confirm(`Confirma a quitação de ${pendentes.length} diária(s) para ${ajudante.nome} no valor total de ${formatCurrency(pendentes.reduce((a, b) => a + Number(b.valor || 0), 0))}?`)) {
                          const lista = pendentes.map(p => ({ agendamentoId: p.agendamentoId, ajudanteId: ajudante.id }));
                          if (setBatchStatusPagamentoAjudante) {
                            setBatchStatusPagamentoAjudante(lista, 'pago');
                          } else {
                            lista.forEach(it => setStatusPagamentoAjudante(it.agendamentoId, it.ajudanteId, 'pago'));
                          }
                          setModalReciboAberto(false);
                          setSelecionadosIds(new Set());
                        }
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Confirmar Pagamento e Baixar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setModalReciboAberto(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
