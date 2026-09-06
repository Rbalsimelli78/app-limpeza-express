import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle, 
  CalendarPlus, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Building, 
  MapPin, 
  Phone,
  ArrowRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import { formatPhone, formatCurrency } from '../utils/formatters';
import { getWhatsAppUrl, buildVerificacaoAgendamentoText } from '../utils/whatsapp';
import { exportMapaLimpezasXlsx } from '../utils/exportExcel';

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const MapaLimpezasClientes = ({
  clientes = [],
  agendamentos = [],
  planos = [],
  onAgendarParaCliente,
  onVerExtratoCliente
}) => {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear()); // 2026
  const [mesSelecionado, setMesSelecionado] = useState(agora.getMonth()); // 0 a 11
  const [filtroAgendamento, setFiltroAgendamento] = useState('sem_agendamento'); // 'sem_agendamento' | 'com_agendamento' | 'todos'
  const [filtroRecorrencia, setFiltroRecorrencia] = useState('todos'); // 'todos' | 'semanal' | 'quinzenal' | 'mensal' | 'esporadico'
  const [busca, setBusca] = useState('');

  // Identifica a categoria de recorrência do cliente a partir do plano padrão ou nome
  const getCategoriaRecorrencia = (cli) => {
    const pId = (cli.planoPadraoId || '').toLowerCase();
    const pObj = planos.find(p => p.id === cli.planoPadraoId);
    const pNome = (pObj?.nome || '').toLowerCase();

    if (pId.includes('semanal') || pNome.includes('semanal')) return 'semanal';
    if (pId.includes('quinzenal') || pNome.includes('quinzenal')) return 'quinzenal';
    if (pId.includes('mensal') || pNome.includes('mensal')) return 'mensal';
    return 'esporadico';
  };

  const getNomeRecorrenciaBadge = (cat) => {
    switch (cat) {
      case 'semanal': return 'Semanal';
      case 'quinzenal': return 'Quinzenal';
      case 'mensal': return 'Mensalista';
      default: return 'Esporádico / PJ';
    }
  };

  // Clientes ativos
  const clientesAtivos = useMemo(() => {
    return clientes.filter(c => c.status !== 'inativo');
  }, [clientes]);

  // Agrupa contagem de faxinas por cliente e por mês do ano selecionado
  const dadosMatriz = useMemo(() => {
    return clientesAtivos.map(cli => {
      const categoria = getCategoriaRecorrencia(cli);
      const agsCliente = agendamentos.filter(ag => ag.clienteId === cli.id);

      // Contagem nos 12 meses do ano selecionado
      const mesesQtd = Array(12).fill(0);
      let totalAno = 0;

      agsCliente.forEach(ag => {
        if (!ag.dataHoraInicio) return;
        const d = new Date(ag.dataHoraInicio);
        if (d.getFullYear() === ano) {
          const m = d.getMonth();
          mesesQtd[m]++;
          totalAno++;
        }
      });

      const qtdNoMesAtual = mesesQtd[mesSelecionado] || 0;
      const semAgendamentoNoMes = qtdNoMesAtual === 0;

      return {
        ...cli,
        categoriaRecorrencia: categoria,
        categoriaLabel: getNomeRecorrenciaBadge(categoria),
        mesesQtd,
        totalAno,
        qtdNoMesAtual,
        semAgendamentoNoMes
      };
    });
  }, [clientesAtivos, agendamentos, planos, ano, mesSelecionado]);

  // Totais mensais gerais para o rodapé da tabela
  const totaisMeses = useMemo(() => {
    const totais = Array(12).fill(0);
    dadosMatriz.forEach(item => {
      item.mesesQtd.forEach((qtd, m) => {
        totais[m] += qtd;
      });
    });
    return totais;
  }, [dadosMatriz]);

  const totalGeralAno = useMemo(() => {
    return totaisMeses.reduce((acc, v) => acc + v, 0);
  }, [totaisMeses]);

  // Métricas do Mês Selecionado
  const totalSemAgendamentoMes = useMemo(() => {
    return dadosMatriz.filter(d => d.semAgendamentoNoMes).length;
  }, [dadosMatriz]);

  const totalComAgendamentoMes = useMemo(() => {
    return dadosMatriz.filter(d => !d.semAgendamentoNoMes).length;
  }, [dadosMatriz]);

  const totalFaxinasMes = useMemo(() => {
    return totaisMeses[mesSelecionado] || 0;
  }, [totaisMeses, mesSelecionado]);

  // Filtragem dos clientes para exibição
  const dadosFiltrados = useMemo(() => {
    return dadosMatriz.filter(item => {
      // 1. Filtro de Agendamento no Mês Selecionado
      if (filtroAgendamento === 'sem_agendamento' && !item.semAgendamentoNoMes) return false;
      if (filtroAgendamento === 'com_agendamento' && item.semAgendamentoNoMes) return false;

      // 2. Filtro de Recorrência
      if (filtroRecorrencia !== 'todos' && item.categoriaRecorrencia !== filtroRecorrencia) return false;

      // 3. Busca Textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const match = 
          item.nome?.toLowerCase().includes(termo) ||
          item.condominio?.toLowerCase().includes(termo) ||
          item.torre?.toLowerCase().includes(termo) ||
          item.bairro?.toLowerCase().includes(termo) ||
          item.telefone?.includes(termo);
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioriza quem está sem agendamento no mês se estiver vendo todos
      if (filtroAgendamento === 'todos') {
        if (a.semAgendamentoNoMes && !b.semAgendamentoNoMes) return -1;
        if (!a.semAgendamentoNoMes && b.semAgendamentoNoMes) return 1;
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [dadosMatriz, filtroAgendamento, filtroRecorrencia, busca]);

  // Ação de encaminhar mensagem no WhatsApp
  const handleChamarWhatsApp = (cliente) => {
    const texto = buildVerificacaoAgendamentoText({
      clienteNome: cliente.nome,
      mesNome: MESES_NOMES[mesSelecionado],
      ano
    });
    const url = getWhatsAppUrl(cliente.telefone, texto);
    window.open(url, '_blank');
  };

  // Exportar matriz para Excel (.xlsx)
  const handleExportarExcel = async () => {
    await exportMapaLimpezasXlsx({
      dadosClientes: dadosFiltrados.map(d => ({
        nome: d.nome,
        tipoRecorrencia: d.categoriaLabel,
        mesesQtd: d.mesesQtd,
        totalAno: d.totalAno
      })),
      ano,
      totaisMeses,
      totalGeralAno
    });
  };

  const sufixoAno = String(ano).slice(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. SELETOR DE MÊS/ANO E EXPORTAÇÃO EXCEL */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        {/* Navegação de Mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => {
                if (mesSelecionado === 0) {
                  setMesSelecionado(11);
                  setAno(a => a - 1);
                } else {
                  setMesSelecionado(m => m - 1);
                }
              }}
              className="btn btn-secondary btn-icon btn-sm"
              title="Mês Anterior"
              style={{ width: '32px', height: '32px' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (mesSelecionado === 11) {
                  setMesSelecionado(0);
                  setAno(a => a + 1);
                } else {
                  setMesSelecionado(m => m + 1);
                }
              }}
              className="btn btn-secondary btn-icon btn-sm"
              title="Próximo Mês"
              style={{ width: '32px', height: '32px' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setAno(agora.getFullYear());
              setMesSelecionado(agora.getMonth());
            }}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Mês Atual
          </button>

          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginLeft: '0.35rem' }}>
            {MESES_NOMES[mesSelecionado]} de {ano}
          </h3>
        </div>

        {/* Botão de Exportar para Excel (.xlsx) */}
        <button
          type="button"
          onClick={handleExportarExcel}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.4rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)' }}
          title="Baixar planilha anual completa com fórmulas no Microsoft Excel"
        >
          <FileSpreadsheet size={16} color="#10b981" />
          <span style={{ fontWeight: '600', color: '#34d399' }}>Exportar Tabela (.xlsx)</span>
        </button>
      </div>

      {/* 2. CARDS DE KPI: RESUMO DO MÊS SELECIONADO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Card 1: Sem Agendamento (Alerta para Ação!) */}
        <div 
          onClick={() => setFiltroAgendamento('sem_agendamento')}
          className="glass-card" 
          style={{
            padding: '1rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--accent-gold)',
            background: filtroAgendamento === 'sem_agendamento' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-gold)' }}>
              Sem Faxina no Mês
            </span>
            <AlertTriangle size={16} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
            {totalSemAgendamentoMes} cliente(s)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Ativos precisando de contato no WhatsApp
          </div>
        </div>

        {/* Card 2: Com Agendamento */}
        <div 
          onClick={() => setFiltroAgendamento('com_agendamento')}
          className="glass-card" 
          style={{
            padding: '1rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--primary-500)',
            background: filtroAgendamento === 'com_agendamento' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-400)' }}>
              Com Faxinas no Mês
            </span>
            <CheckCircle2 size={16} color="var(--primary-400)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary-400)' }}>
            {totalComAgendamentoMes} cliente(s)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Já agendados e confirmados
          </div>
        </div>

        {/* Card 3: Total de Faxinas Programadas */}
        <div 
          className="glass-card" 
          style={{
            padding: '1rem',
            borderLeft: '4px solid var(--accent-cyan)',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
              Total de Limpezas
            </span>
            <TrendingUp size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
            {totalFaxinasMes} faxina(s)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Em {MESES_NOMES[mesSelecionado]}/{ano}
          </div>
        </div>

        {/* Card 4: Base de Clientes Ativos */}
        <div 
          onClick={() => setFiltroAgendamento('todos')}
          className="glass-card" 
          style={{
            padding: '1rem',
            cursor: 'pointer',
            borderLeft: '4px solid #94a3b8',
            background: filtroAgendamento === 'todos' ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Base de Clientes
            </span>
            <Users size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {clientesAtivos.length} ativos
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Clique para exibir todos
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS E BUSCA (COMO NA PLANILHA DO USUÁRIO) */}
      <div className="glass-card" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Filtros de Recorrência / Planos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
              Frequência:
            </span>

            {[
              { id: 'todos', label: 'Todos' },
              { id: 'mensal', label: 'Mensalista' },
              { id: 'quinzenal', label: 'Quinzenal' },
              { id: 'semanal', label: 'Semanal' },
              { id: 'esporadico', label: 'Esporádico / PJ' }
            ].map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setFiltroRecorrencia(b.id)}
                className={`btn btn-sm ${filtroRecorrencia === b.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', height: 'auto', minHeight: '28px' }}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Filtro de Status de Agendamento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
              Status em {MESES_CURTOS[mesSelecionado]}/{sufixoAno}:
            </span>

            <button
              type="button"
              onClick={() => setFiltroAgendamento('sem_agendamento')}
              className={`btn btn-sm ${filtroAgendamento === 'sem_agendamento' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                height: 'auto',
                minHeight: '28px',
                background: filtroAgendamento === 'sem_agendamento' ? '#d97706' : undefined,
                borderColor: '#d97706',
                color: '#fff'
              }}
            >
              ⚠️ Sem Agendamento ({totalSemAgendamentoMes})
            </button>

            <button
              type="button"
              onClick={() => setFiltroAgendamento('com_agendamento')}
              className={`btn btn-sm ${filtroAgendamento === 'com_agendamento' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', height: 'auto', minHeight: '28px' }}
            >
              ✓ Com Agendamento ({totalComAgendamentoMes})
            </button>

            <button
              type="button"
              onClick={() => setFiltroAgendamento('todos')}
              className={`btn btn-sm ${filtroAgendamento === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', height: 'auto', minHeight: '28px' }}
            >
              Todos ({clientesAtivos.length})
            </button>
          </div>
        </div>

        {/* Campo de Busca Rápida */}
        <div style={{ position: 'relative', marginTop: '0.75rem' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por cliente, condomínio, torre ou telefone..."
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* 4. SEÇÃO DE AÇÃO RÁPIDA: CLIENTES SEM AGENDAMENTO (DISPARO DE WHATSAPP) */}
      {filtroAgendamento === 'sem_agendamento' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}>
                <AlertTriangle size={18} />
                <span>Atenção: Clientes Ativos Sem Faxina em {MESES_NOMES[mesSelecionado]} ({dadosFiltrados.length})</span>
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Clique no botão verde de WhatsApp para enviar a mensagem automática de verificação e agendar em seguida.
              </p>
            </div>
          </div>

          {dadosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              🎉 Parabéns! Todos os clientes desta categoria já possuem faxinas agendadas para {MESES_NOMES[mesSelecionado]}!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.75rem'
            }}>
              {dadosFiltrados.map(cli => (
                <div 
                  key={cli.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.6rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {cli.nome}
                      </strong>
                      <span className="badge" style={{
                        fontSize: '0.68rem',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        whiteSpace: 'nowrap'
                      }}>
                        {cli.categoriaLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {cli.condominio && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building size={12} color="var(--primary-400)" />
                          <span>{cli.condominio} {cli.torre ? `(Torre ${cli.torre})` : ''} {cli.apartamento ? `- Apto ${cli.apartamento}` : ''}</span>
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} color="var(--text-muted)" />
                        <span>{formatPhone(cli.telefone)}</span>
                      </span>
                      {cli.valorFechado && (
                        <span style={{ color: 'var(--primary-400)', fontWeight: '600' }}>
                          💰 Valor Fechado: {formatCurrency(cli.valorFechado)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações: Chamar no WhatsApp e Agendar */}
                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => handleChamarWhatsApp(cli)}
                      className="btn btn-whatsapp btn-sm"
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.5rem', justifyContent: 'center' }}
                      title="Enviar mensagem amigável no WhatsApp verificando as datas do mês"
                    >
                      <MessageCircle size={14} />
                      <span>Chamar no WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAgendarParaCliente && onAgendarParaCliente(cli)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      title="Abrir tela para agendar faxina para este cliente"
                    >
                      <CalendarPlus size={14} />
                      <span>Agendar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. A TABELA MATRIZ ANUAL (EXATAMENTE COMO NA PLANILHA DO USUÁRIO) */}
      <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Quantidade de Limpezas Efetuadas por Cliente ({ano})</span>
              <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>
                {dadosFiltrados.length} cliente(s)
              </span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Coluna <span style={{ color: 'var(--primary-400)', fontWeight: '700' }}>{MESES_CURTOS[mesSelecionado]}/{sufixoAno}</span> em destaque referente ao mês selecionado.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                {/* Coluna Cliente Fixa */}
                <th style={{
                  padding: '0.65rem 0.85rem',
                  textAlign: 'left',
                  position: 'sticky',
                  left: 0,
                  background: 'var(--bg-input)',
                  zIndex: 2,
                  width: '220px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}>
                  Clientes ({dadosFiltrados.length})
                </th>

                {/* 12 Meses do Ano */}
                {MESES_CURTOS.map((m, idx) => {
                  const isMesAtivo = idx === mesSelecionado;
                  return (
                    <th 
                      key={m} 
                      onClick={() => setMesSelecionado(idx)}
                      style={{
                        padding: '0.65rem 0.35rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        textTransform: 'lowercase',
                        width: '45px',
                        background: isMesAtivo ? 'rgba(16, 185, 129, 0.18)' : undefined,
                        color: isMesAtivo ? '#34d399' : 'var(--text-secondary)',
                        borderBottom: isMesAtivo ? '3px solid #10b981' : undefined
                      }}
                      title={`Clique para selecionar ${MESES_NOMES[idx]}`}
                    >
                      {m}/{sufixoAno}
                    </th>
                  );
                })}

                {/* Total Ano */}
                <th style={{
                  padding: '0.65rem 0.75rem',
                  textAlign: 'center',
                  fontWeight: '800',
                  color: 'var(--primary-400)',
                  width: '60px'
                }}>
                  Total
                </th>

                {/* Ações */}
                <th style={{
                  padding: '0.65rem 0.75rem',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                  width: '100px'
                }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum cliente encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((item, rowIdx) => {
                  const isEven = rowIdx % 2 === 0;
                  const semNoMesAtivo = item.semAgendamentoNoMes;

                  return (
                    <tr 
                      key={item.id}
                      style={{
                        background: isEven ? 'var(--bg-card)' : 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Nome do Cliente com Sticky */}
                      <td style={{
                        padding: '0.65rem 0.85rem',
                        position: 'sticky',
                        left: 0,
                        background: isEven ? 'var(--bg-card)' : '#101726',
                        zIndex: 1,
                        borderRight: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong 
                            onClick={() => onVerExtratoCliente && onVerExtratoCliente(item)}
                            style={{ 
                              color: 'var(--text-primary)', 
                              cursor: 'pointer',
                              display: 'inline-block' 
                            }}
                            title="Ver Extrato & Histórico Financeiro"
                          >
                            {item.nome}
                          </strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {item.condominio ? `${item.condominio}` : item.bairro || 'São Paulo'} • {item.categoriaLabel}
                          </span>
                        </div>
                      </td>

                      {/* 12 Meses com Números de Faxinas */}
                      {item.mesesQtd.map((qtd, mIdx) => {
                        const isMesAtivo = mIdx === mesSelecionado;
                        const isZeroNoMesAtivo = isMesAtivo && qtd === 0;

                        return (
                          <td 
                            key={mIdx}
                            style={{
                              padding: '0.5rem 0.2rem',
                              textAlign: 'center',
                              background: isMesAtivo ? 'rgba(16, 185, 129, 0.08)' : undefined,
                              borderLeft: isMesAtivo ? '1px solid rgba(16, 185, 129, 0.2)' : undefined,
                              borderRight: isMesAtivo ? '1px solid rgba(16, 185, 129, 0.2)' : undefined
                            }}
                          >
                            {qtd > 0 ? (
                              <span style={{
                                display: 'inline-block',
                                minWidth: '22px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.4)'
                              }}>
                                {qtd}
                              </span>
                            ) : isZeroNoMesAtivo ? (
                              <span style={{
                                display: 'inline-block',
                                minWidth: '22px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.5)'
                              }} title={`Ainda sem limpeza agendada em ${MESES_NOMES[mIdx]}`}>
                                0
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.4 }}>
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total do Ano */}
                      <td style={{
                        padding: '0.65rem 0.75rem',
                        textAlign: 'center',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        color: item.totalAno > 0 ? 'var(--primary-400)' : 'var(--text-muted)'
                      }}>
                        {item.totalAno}
                      </td>

                      {/* Botões Rápidos de Contato e Agendamento */}
                      <td style={{
                        padding: '0.5rem 0.6rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleChamarWhatsApp(item)}
                            className="btn btn-whatsapp btn-icon btn-sm"
                            style={{ width: '28px', height: '28px' }}
                            title="Enviar WhatsApp verificando agendamento deste mês"
                          >
                            <MessageCircle size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onAgendarParaCliente && onAgendarParaCliente(item)}
                            className="btn btn-primary btn-icon btn-sm"
                            style={{ width: '28px', height: '28px' }}
                            title="Agendar faxina para este cliente"
                          >
                            <CalendarPlus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Linha de Total Geral (Rodapé) */}
              {dadosFiltrados.length > 0 && (
                <tr style={{
                  background: 'var(--bg-input)',
                  borderTop: '2px solid var(--border-color)',
                  fontWeight: '800'
                }}>
                  <td style={{
                    padding: '0.75rem 0.85rem',
                    position: 'sticky',
                    left: 0,
                    background: 'var(--bg-input)',
                    zIndex: 1,
                    color: 'var(--text-primary)'
                  }}>
                    TOTAL DE FAXINAS:
                  </td>

                  {totaisMeses.map((tot, idx) => {
                    const isMesAtivo = idx === mesSelecionado;
                    return (
                      <td 
                        key={idx}
                        style={{
                          padding: '0.75rem 0.2rem',
                          textAlign: 'center',
                          color: isMesAtivo ? '#34d399' : 'var(--text-primary)',
                          background: isMesAtivo ? 'rgba(16, 185, 129, 0.15)' : undefined,
                          fontSize: '0.85rem'
                        }}
                      >
                        {tot}
                      </td>
                    );
                  })}

                  <td style={{
                    padding: '0.75rem 0.75rem',
                    textAlign: 'center',
                    color: 'var(--primary-400)',
                    fontSize: '0.95rem'
                  }}>
                    {totalGeralAno}
                  </td>

                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
