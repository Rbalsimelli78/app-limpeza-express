import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Copy, 
  ExternalLink,
  Sparkles,
  AlertCircle,
  FileText,
  Building,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Eye
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '../utils/formatters';
import { getWhatsAppUrl, buildEscalaSemanalAjudanteText } from '../utils/whatsapp';
import { ModalViradaMes } from '../components/ModalViradaMes';
import { MensagemBiblica } from '../components/MensagemBiblica';
import { ModalPreviewEscalaSemanal } from '../components/ModalPreviewEscalaSemanal';

export const DashboardView = ({ onNovoAgendamento, onEditarAgendamento }) => {
  const { 
    agendamentos, 
    clientes, 
    ajudantes, 
    planos, 
    getFinanceiroGeral, 
    setStatusServico, 
    setStatusPagamentoCliente,
    setStatusPagamentoAjudante,
    setActiveTab,
    limparTodosOsDados,
    showToast 
  } = useApp();

  const [modalViradaMesOpen, setModalViradaMesOpen] = useState(false);
  const [modalPreviewEscalaOpen, setModalPreviewEscalaOpen] = useState(false);
  const [ajudantePreviewEscala, setAjudantePreviewEscala] = useState(null);
  const [faxinasPreviewEscala, setFaxinasPreviewEscala] = useState([]);
  const [expandedAjudantes, setExpandedAjudantes] = useState({});

  const toggleExpandAjudante = (id) => {
    setExpandedAjudantes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const abrirPreviewEscala = (item) => {
    if (item.faxinas.length === 0) {
      showToast(`${item.ajudante.nome} não possui faxinas agendadas para os próximos 7 dias.`);
      return;
    }
    setAjudantePreviewEscala(item.ajudante);
    setFaxinasPreviewEscala(item.faxinas);
    setModalPreviewEscalaOpen(true);
  };

  const financeiro = getFinanceiroGeral();

  // Datas de referência para cálculos macro
  const now = new Date();
  const hojeInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const hojeFim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const amanhaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const amanhaFim = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
  const em7DiasFim = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59);

  // 1. Faxinas de Hoje
  const faxinasHoje = agendamentos.filter(ag => {
    const d = new Date(ag.dataHoraInicio);
    return d >= hojeInicio && d <= hojeFim;
  }).sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio));

  // 2. Faxinas de Amanhã
  const faxinasAmanha = agendamentos.filter(ag => {
    const d = new Date(ag.dataHoraInicio);
    return d >= amanhaInicio && d <= amanhaFim;
  }).sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio));

  // 3. Faxinas na Próxima Semana (próximos 7 dias)
  const faxinasProximaSemana = agendamentos.filter(ag => {
    const d = new Date(ag.dataHoraInicio);
    return d >= hojeInicio && d <= em7DiasFim;
  }).sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio));

  // Faturamento total previsto para a próxima semana
  const faturamentoProximaSemana = faxinasProximaSemana.reduce((sum, ag) => sum + (Number(ag.valorCliente) || 0), 0);

  // Custo total de diárias das ajudantes na próxima semana
  const diariasProximaSemana = faxinasProximaSemana.reduce((sum, ag) => {
    return sum + (ag.ajudantesEscaladas || []).reduce((sub, ae) => sub + (Number(ae.valorAPagar) || 0), 0);
  }, 0);

  // Lucro líquido previsto na próxima semana
  const lucroProximaSemana = faturamentoProximaSemana - diariasProximaSemana;
  const margemSemana = faturamentoProximaSemana > 0 ? Math.round((lucroProximaSemana / faturamentoProximaSemana) * 100) : 0;

  // 4. Distribuição da escala por colaboradora nos próximos 7 dias
  const ajudantesAtivas = ajudantes.filter(a => a.status !== 'inativo');
  const escalaPorAjudante = ajudantesAtivas.map(aj => {
    const faxinasDestaAjudante = faxinasProximaSemana.filter(ag => {
      const escalada = (ag.ajudantesEscaladas || []).some(ae => ae.ajudanteId === aj.id);
      const porId = (ag.ajudantesIds || []).includes(aj.id);
      return escalada || porId;
    });

    const totalDiariasAjudante = faxinasDestaAjudante.reduce((sum, ag) => {
      const escalada = (ag.ajudantesEscaladas || []).find(ae => ae.ajudanteId === aj.id);
      if (escalada && escalada.valorAPagar) return sum + Number(escalada.valorAPagar);
      return sum + (Number(aj.valorDiariaBase) || 100);
    }, 0);

    return {
      ajudante: aj,
      faxinas: faxinasDestaAjudante,
      qtd: faxinasDestaAjudante.length,
      totalDiarias: totalDiariasAjudante
    };
  }).sort((a, b) => b.qtd - a.qtd);

  return (
    <div className="page-wrapper">
      {/* Banner Informativo quando ainda houver dados de exemplo */}
      {clientes.some(c => c.id === 'cli-1') && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            <span style={{ fontSize: '1.1rem' }}>🧹</span>
            <span>Você está visualizando <strong>dados de demonstração</strong>.</span>
          </div>
          <button 
            onClick={() => {
              if (confirm('Deseja limpar todos os dados de exemplo para sua esposa começar com o sistema 100% zerado?')) {
                limparTodosOsDados();
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-gold)' }}
          >
            Limpar Dados e Começar do Zero
          </button>
        </div>
      )}

      {/* Banner de Boas-Vindas com Visual Premium */}
      <div 
        className="glass-card" 
        style={{ 
          marginBottom: '1rem',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'relative',
          height: '170px',
          width: '100%',
          overflow: 'hidden'
        }}>
          <img 
            src="/banner.jpg" 
            alt="Limpeza Express SP" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              filter: 'brightness(0.7)'
            }} 
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, var(--bg-secondary) 10%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-success" style={{ background: '#10b981', color: '#fff' }}>
                <Sparkles size={12} /> São Paulo • SP
              </span>
              <span style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: '500' }}>
                Apartamentos de 80 a 100m²
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.6)', margin: 0 }}>
              Limpeza Express SP
            </h2>
          </div>
        </div>

        <div style={{ 
          padding: '0.85rem 1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Controle diário de agendamentos, clientes e diárias das ajudantes parceiras.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTab('orcamento')} 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            >
              <MessageCircle size={15} color="#25d366" />
              <span>Orçar WhatsApp</span>
            </button>
            <button 
              onClick={() => setModalViradaMesOpen(true)} 
              className="btn btn-secondary btn-sm"
              style={{ 
                gap: '0.35rem', 
                background: 'rgba(59, 130, 246, 0.12)', 
                borderColor: 'rgba(59, 130, 246, 0.4)',
                color: '#93c5fd',
                fontSize: '0.8rem',
                padding: '0.35rem 0.65rem'
              }}
              title="Programar em 1 clique todos os clientes confirmados para o próximo mês"
            >
              <RefreshCw size={14} color="#60a5fa" />
              <span>🔄 Virar Mês</span>
            </button>
            <button 
              onClick={onNovoAgendamento} 
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              <span>+ Agendar Faxina</span>
            </button>
          </div>
        </div>
      </div>

      {/* MENSAGEM BÍBLICA MOTIVACIONAL DO DIA (DEUS E JESUS EM 1º LUGAR) */}
      <MensagemBiblica />

      {/* Grid de KPIs Financeiros Gerais */}
      <div className="grid-kpis" style={{ marginBottom: '1.5rem' }}>
        {/* KPI 1: Lucro Líquido Realizado */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Lucro Líquido (Caixa)</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <TrendingUp size={20} color="var(--primary-400)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--primary-400)' }}>
            {formatCurrency(financeiro.lucroRealizado)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Projetado: {formatCurrency(financeiro.lucroProjetado)}
          </span>
        </div>

        {/* KPI 2: Total Recebido de Clientes */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Recebido de Clientes</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <DollarSign size={20} color="var(--accent-cyan)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {formatCurrency(financeiro.totalRecebido)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            A receber: {formatCurrency(financeiro.totalAReceber)}
          </span>
        </div>

        {/* KPI 3: A Pagar a Ajudantes */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">A Pagar Ajudantes</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <Users size={20} color="var(--accent-gold)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-gold)' }}>
            {formatCurrency(financeiro.totalAPagarAjudantes)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Já pago: {formatCurrency(financeiro.totalPagoAjudantes)}
          </span>
        </div>

        {/* KPI 4: Total de Faxinas Cadastradas (Elogiado pelo usuário) */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Faxinas na Escala</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <Calendar size={20} color="var(--accent-purple)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>
            {agendamentos.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {clientes.length} clientes ativos cadastrados
          </span>
        </div>
      </div>

      {/* CABEÇALHO DO PAINEL DE DECISÃO MACRO: PRÓXIMA SEMANA */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem', 
        flexWrap: 'wrap', 
        gap: '0.75rem' 
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Clock size={20} color="var(--primary-400)" />
            <span>Próximas Faxinas & Decisão Macro</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Visão executiva da próxima semana e escala da equipe para tomada de decisão
          </span>
        </div>
        <button 
          onClick={() => setActiveTab('agenda')} 
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.4rem' }}
        >
          <Calendar size={15} color="var(--primary-400)" />
          <span>Ver Todas na Agenda</span>
        </button>
      </div>

      {/* RADAR IMEDIATO: HOJE & AMANHÃ (COMPACTO) */}
      <div 
        className="glass-card" 
        style={{ 
          marginBottom: '1.25rem', 
          padding: '1rem 1.25rem',
          borderLeft: faxinasHoje.length > 0 ? '4px solid var(--primary-500)' : '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              background: faxinasHoje.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)', 
              color: faxinasHoje.length > 0 ? 'var(--primary-400)' : 'var(--text-muted)',
              padding: '0.2rem 0.55rem', 
              borderRadius: '6px', 
              fontSize: '0.75rem', 
              fontWeight: '700' 
            }}>
              {faxinasHoje.length > 0 ? `Hoje (${faxinasHoje.length} faxinas)` : 'Hoje'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </span>
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Amanhã: <strong>{faxinasAmanha.length} faxina(s) agendada(s)</strong>
          </span>
        </div>

        {faxinasHoje.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0' }}>
            <CheckCircle2 size={16} color="var(--primary-400)" />
            <span>Nenhuma faxina programada para hoje. Dia livre para planejamento ou novos contatos!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {faxinasHoje.map(ag => {
              const cli = clientes.find(c => c.id === ag.clienteId);
              const nomesAj = (ag.ajudantesEscaladas || []).map(ae => {
                const a = ajudantes.find(aj => aj.id === ae.ajudanteId);
                return a ? a.nome : 'Ajudante';
              }).join(', ') || 'Sem ajudante';

              return (
                <div 
                  key={ag.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem',
                    background: 'var(--bg-input)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                      {formatTime(ag.dataHoraInicio)}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                      {cli?.nome || 'Cliente'}
                    </span>
                    {cli?.condominio && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({cli.condominio})
                      </span>
                    )}
                    <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      👤 {nomesAj}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-400)' }}>
                      {formatCurrency(ag.valorCliente)}
                    </span>
                    {ag.statusServico === 'concluido' ? (
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>✓ Concluída</span>
                    ) : (
                      <button 
                        onClick={() => setStatusServico(ag.id, 'concluido')} 
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GRADE DE KPIS DA PRÓXIMA SEMANA (PRÓXIMOS 7 DIAS) */}
      <div className="grid-kpis" style={{ marginBottom: '1.5rem' }}>
        {/* KPI 1: Faxinas Próxima Semana */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Faxinas Próx. Semana</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <Calendar size={20} color="#3b82f6" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#60a5fa' }}>
            {faxinasProximaSemana.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Próximos 7 dias programados
          </span>
        </div>

        {/* KPI 2: Faturamento Previsto */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Faturamento Previsto</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <DollarSign size={20} color="#06b6d4" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#06b6d4' }}>
            {formatCurrency(faturamentoProximaSemana)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Receita bruta nos 7 dias
          </span>
        </div>

        {/* KPI 3: Diárias Ajudantes */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Diárias Ajudantes</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <Users size={20} color="#f59e0b" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>
            {formatCurrency(diariasProximaSemana)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Custo total de equipe na semana
          </span>
        </div>

        {/* KPI 4: Lucro Previsto */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Lucro Líquido Previsto</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <TrendingUp size={20} color="#10b981" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>
            {formatCurrency(lucroProximaSemana)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Margem estimada de ~{margemSemana}%
          </span>
        </div>
      </div>

      {/* PAINEL DE ESCALA POR AJUDANTE NA PRÓXIMA SEMANA (SOLICITADO PELO USUÁRIO) */}
      <div 
        className="glass-card" 
        style={{ 
          marginBottom: '1.5rem',
          padding: '1.25rem'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.5rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem'
        }}>
          <div>
            <h4 style={{ 
              fontSize: '1.05rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem',
              margin: 0
            }}>
              <UserCheck size={18} color="var(--primary-400)" />
              <span>Escala da Próxima Semana por Ajudante</span>
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Distribuição de trabalho nos próximos 7 dias para equilibrar a escala da equipe
            </span>
          </div>

          <button 
            onClick={() => setActiveTab('ajudantes')} 
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            Ver Equipe Completa
          </button>
        </div>

        {escalaPorAjudante.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
            Nenhuma colaboradora cadastrada ainda.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {escalaPorAjudante.map(item => {
              const { ajudante, faxinas, qtd, totalDiarias } = item;
              const semEscala = qtd === 0;

              return (
                <div 
                  key={ajudante.id} 
                  style={{
                    background: semEscala ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-input)',
                    border: semEscala ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    {/* Topo do Card da Ajudante */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                          {ajudante.nome}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {ajudante.telefone || 'Sem telefone'} • Base {formatCurrency(ajudante.valorDiariaBase || 100)}
                        </span>
                      </div>

                      {/* Badge de Situação de Escala */}
                      {semEscala ? (
                        <span 
                          className="badge" 
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.2)', 
                            color: '#fca5a5', 
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <AlertTriangle size={12} />
                          <span>Sem faxina</span>
                        </span>
                      ) : qtd === 1 ? (
                        <span 
                          className="badge" 
                          style={{ 
                            background: 'rgba(245, 158, 11, 0.2)', 
                            color: '#fde047', 
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem'
                          }}
                        >
                          1 faxina • Disponível
                        </span>
                      ) : (
                        <span 
                          className="badge badge-success" 
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                        >
                          ✓ {qtd} faxinas • Escalada
                        </span>
                      )}
                    </div>

                    {/* Barra Visual de Carga de Trabalho */}
                    <div style={{ marginTop: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Carga na semana: <strong>{qtd} diária(s)</strong></span>
                        <strong style={{ color: 'var(--accent-gold)' }}>{formatCurrency(totalDiarias)}</strong>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '6px', 
                        background: 'rgba(255,255,255,0.08)', 
                        borderRadius: '3px', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          width: `${Math.min(qtd * 20, 100)}%`, 
                          height: '100%', 
                          background: semEscala ? '#ef4444' : qtd >= 4 ? '#8b5cf6' : '#10b981',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>

                    {/* Resumo das Faxinas Agendadas nos Próximos 7 Dias */}
                    {qtd > 0 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {((expandedAjudantes[ajudante.id] ? faxinas : faxinas.slice(0, 3))).map(f => {
                          const c = clientes.find(cli => cli.id === f.clienteId);
                          const ae = (f.ajudantesEscaladas || []).find(e => e.ajudanteId === ajudante.id);
                          const valorDiaria = ae?.valorAPagar || ajudante.valorDiariaBase || 100;
                          const d = new Date(f.dataHoraInicio);
                          const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' });
                          const diaMes = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                          const local = c?.condominio ? `${c.condominio}` : (c?.bairro || 'São Paulo');

                          return (
                            <div 
                              key={f.id} 
                              style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-secondary)', 
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '0.35rem 0.5rem',
                                borderRadius: '6px',
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
                                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                  {diaSemana}, {diaMes} ({formatTime(f.dataHoraInicio)})
                                </span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  • {c?.nome || 'Cliente'}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                  ({local})
                                </span>
                              </div>
                              <span style={{ color: 'var(--accent-gold)', fontWeight: '700', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                                {formatCurrency(valorDiaria)}
                              </span>
                            </div>
                          );
                        })}

                        {qtd > 3 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandAjudante(ajudante.id)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.25rem 0.5rem',
                              marginTop: '0.25rem',
                              width: '100%',
                              justifyContent: 'center',
                              color: 'var(--primary-400)',
                              borderColor: 'rgba(16, 185, 129, 0.35)',
                              background: 'rgba(16, 185, 129, 0.05)'
                            }}
                          >
                            {expandedAjudantes[ajudante.id] ? `▴ Ver menos (recolher lista)` : `▾ Ver todas as ${qtd} faxinas da semana`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações da Ajudante na Semana */}
                  <div style={{ marginTop: '0.5rem' }}>
                    {qtd > 0 ? (
                      <div style={{ display: 'flex', gap: '0.45rem', width: '100%' }}>
                        <button 
                          type="button"
                          onClick={() => abrirPreviewEscala(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: '0.72rem', padding: '0.35rem 0.45rem', gap: '0.3rem', justifyContent: 'center' }}
                          title="Ver o texto da mensagem e conferir se quer enviar com ou sem valores"
                        >
                          <Eye size={13} color="var(--primary-400)" />
                          <span>Ver Mensagem</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => abrirPreviewEscala(item)}
                          className="btn btn-whatsapp btn-sm"
                          style={{ flex: 1.2, fontSize: '0.72rem', padding: '0.35rem 0.5rem', gap: '0.3rem', justifyContent: 'center' }}
                          title="Abrir pré-visualização e enviar no WhatsApp"
                        >
                          <Send size={13} />
                          <span>Enviar WhatsApp</span>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onNovoAgendamento()}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', fontSize: '0.72rem', padding: '0.35rem 0.5rem', gap: '0.3rem' }}
                      >
                        <span>+ Escalar Faxina Agora</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BANNER / CONVITE PARA ABRIR A AGENDA COMPLETA */}
      <div 
        className="glass-card" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '1rem',
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.2)', 
            padding: '0.65rem', 
            borderRadius: '10px',
            color: '#60a5fa'
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
              Deseja visualizar toda a grade de agendamentos?
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Consulte a Agenda completa em formato Calendário Mensal, Semanal ou Lista diária com horários e rotas.
            </span>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('agenda')}
          className="btn btn-primary"
          style={{ fontSize: '0.85rem', gap: '0.45rem' }}
        >
          <span>Abrir Agenda Completa</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DA ESCALA SEMANAL */}
      <ModalPreviewEscalaSemanal 
        isOpen={modalPreviewEscalaOpen}
        onClose={() => {
          setModalPreviewEscalaOpen(false);
          setAjudantePreviewEscala(null);
          setFaxinasPreviewEscala([]);
        }}
        ajudante={ajudantePreviewEscala}
        faxinas={faxinasPreviewEscala}
        clientes={clientes}
        showToast={showToast}
      />

      {/* MODAL DE VIRADA DE MÊS AUTOMÁTICA */}
      <ModalViradaMes 
        isOpen={modalViradaMesOpen}
        onClose={() => setModalViradaMesOpen(false)}
      />
    </div>
  );
};
