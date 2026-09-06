import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Copy, 
  MessageCircle, 
  DollarSign, 
  Users, 
  Building, 
  Filter,
  Check
} from 'lucide-react';
import { formatCurrency, formatDate, formatPhone } from '../utils/formatters';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { exportExtratoAjudanteXlsx } from '../utils/exportExcel';

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const ExtratoAnaliticoAjudantes = () => {
  const { ajudantes, agendamentos, clientes, setStatusPagamentoAjudante, showToast } = useApp();

  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth());
  const [todoOHistorico, setTodoOHistorico] = useState(false);
  const [ajudanteSelecionadaId, setAjudanteSelecionadaId] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState('todos'); // 'todos' | 'pendente' | 'pago'
  const [busca, setBusca] = useState('');
  const [pixCopiadoId, setPixCopiadoId] = useState(null);

  const copiarPix = (chave, ajId) => {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setPixCopiadoId(ajId);
    showToast(`Chave PIX copiada: ${chave}`);
    setTimeout(() => setPixCopiadoId(null), 2500);
  };

  // Coleta todas as diárias de todas as ajudantes a partir dos agendamentos
  const todasAsDiarias = useMemo(() => {
    const lista = [];

    agendamentos.forEach(ag => {
      if (!ag.dataHoraInicio) return;
      const cli = clientes.find(c => c.id === ag.clienteId);

      // 1. Escalas oficiais (ajudantesEscaladas)
      if (ag.ajudantesEscaladas && Array.isArray(ag.ajudantesEscaladas)) {
        ag.ajudantesEscaladas.forEach(ae => {
          const aj = ajudantes.find(a => a.id === ae.ajudanteId);
          if (!aj && !ae.ajudanteId) return;

          const valorDiaria = ae.valorAPagar !== undefined
            ? Number(ae.valorAPagar)
            : Number(aj?.valorPadrao || 100);

          lista.push({
            agendamentoId: ag.id,
            ajudanteId: ae.ajudanteId,
            ajudanteNome: aj?.nome || 'Colaboradora',
            ajudanteTelefone: aj?.telefone || '',
            ajudantePix: aj?.chavePix || '',
            clienteNome: cli?.nome || 'Cliente',
            condominio: cli?.condominio || '',
            torre: cli?.torre || '',
            apartamento: cli?.apartamento || '',
            bairro: cli?.bairro || '',
            enderecoCompleto: cli ? `${cli.condominio ? cli.condominio + (cli.torre ? ` (Torre ${cli.torre})` : '') + ' • ' : ''}${cli.endereco || ''} ${cli.apartamento ? `Apto ${cli.apartamento}` : ''} - ${cli.bairro || ''}` : 'São Paulo - SP',
            dataHora: ag.dataHoraInicio,
            valor: valorDiaria,
            statusPagamento: ae.statusPagamento || 'pendente'
          });
        });
      } 
      // 2. Fallback legado (ajudantesIds)
      else if (ag.ajudantesIds && Array.isArray(ag.ajudantesIds)) {
        ag.ajudantesIds.forEach(ajId => {
          const aj = ajudantes.find(a => a.id === ajId);
          const valorDiaria = (ag.valoresAjudantes && ag.valoresAjudantes[ajId]) !== undefined
            ? Number(ag.valoresAjudantes[ajId])
            : Number(aj?.valorPadrao || 100);

          const statusPag = (ag.pagamentosAjudantes && ag.pagamentosAjudantes[ajId]) || 'pendente';

          lista.push({
            agendamentoId: ag.id,
            ajudanteId: ajId,
            ajudanteNome: aj?.nome || 'Colaboradora',
            ajudanteTelefone: aj?.telefone || '',
            ajudantePix: aj?.chavePix || '',
            clienteNome: cli?.nome || 'Cliente',
            condominio: cli?.condominio || '',
            torre: cli?.torre || '',
            apartamento: cli?.apartamento || '',
            bairro: cli?.bairro || '',
            enderecoCompleto: cli ? `${cli.condominio ? cli.condominio + (cli.torre ? ` (Torre ${cli.torre})` : '') + ' • ' : ''}${cli.endereco || ''} - ${cli.bairro || ''}` : 'São Paulo - SP',
            dataHora: ag.dataHoraInicio,
            valor: valorDiaria,
            statusPagamento: statusPag
          });
        });
      }
    });

    // Ordenação da mais recente para a mais antiga
    return lista.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
  }, [agendamentos, ajudantes, clientes]);

  // Filtragem conforme período, colaboradora, status e busca
  const diariasFiltradas = useMemo(() => {
    return todasAsDiarias.filter(d => {
      // 1. Filtro de Colaboradora
      if (ajudanteSelecionadaId !== 'todas' && d.ajudanteId !== ajudanteSelecionadaId) {
        return false;
      }

      // 2. Filtro de Período (Mês/Ano ou Todo Histórico)
      if (!todoOHistorico) {
        const dt = new Date(d.dataHora);
        if (dt.getFullYear() !== ano || dt.getMonth() !== mes) {
          return false;
        }
      }

      // 3. Filtro de Status de Pagamento
      if (statusFiltro === 'pendente' && d.statusPagamento === 'pago') return false;
      if (statusFiltro === 'pago' && d.statusPagamento !== 'pago') return false;

      // 4. Busca Textual
      if (busca.trim()) {
        const t = busca.toLowerCase();
        const match = 
          d.ajudanteNome?.toLowerCase().includes(t) ||
          d.clienteNome?.toLowerCase().includes(t) ||
          d.condominio?.toLowerCase().includes(t) ||
          d.bairro?.toLowerCase().includes(t) ||
          d.enderecoCompleto?.toLowerCase().includes(t);
        if (!match) return false;
      }

      return true;
    });
  }, [todasAsDiarias, ajudanteSelecionadaId, todoOHistorico, ano, mes, statusFiltro, busca]);

  // Cálculos de KPIs do período filtrado
  const { totalGeral, totalPago, totalPendente, qtdTotal, qtdPagas, qtdPendentes } = useMemo(() => {
    let geral = 0;
    let pago = 0;
    let pendente = 0;
    let pagas = 0;
    let pendentes = 0;

    diariasFiltradas.forEach(d => {
      const v = Number(d.valor) || 0;
      geral += v;
      if (d.statusPagamento === 'pago') {
        pago += v;
        pagas++;
      } else {
        pendente += v;
        pendentes++;
      }
    });

    return {
      totalGeral: geral,
      totalPago: pago,
      totalPendente: pendente,
      qtdTotal: diariasFiltradas.length,
      qtdPagas: pagas,
      qtdPendentes: pendentes
    };
  }, [diariasFiltradas]);

  // Ação de Estornar ou Pagar
  const handleAlternarPagamento = (diaria) => {
    const isPago = diaria.statusPagamento === 'pago';
    if (isPago) {
      if (window.confirm(`Deseja estornar o pagamento da diária de ${diaria.ajudanteNome} (${formatCurrency(diaria.valor)}) para "A Pagar"?`)) {
        setStatusPagamentoAjudante(diaria.agendamentoId, diaria.ajudanteId, 'pendente');
      }
    } else {
      setStatusPagamentoAjudante(diaria.agendamentoId, diaria.ajudanteId, 'pago');
    }
  };

  // Exportar para Excel (.xlsx)
  const handleExportarExcel = async () => {
    const ajObj = ajudantes.find(a => a.id === ajudanteSelecionadaId);
    const periodoLabel = todoOHistorico 
      ? 'Todo o Histórico' 
      : `${MESES_NOMES[mes]} de ${ano}`;

    await exportExtratoAjudanteXlsx({
      ajudante: ajObj || { nome: 'Todas as Colaboradoras', chavePix: 'Diversas', tipoPix: 'Equipe' },
      historicoDiarias: diariasFiltradas.map(d => ({
        dataHora: d.dataHora,
        clienteNome: `${d.clienteNome} (${d.ajudanteNome})`,
        endereco: d.enderecoCompleto,
        statusPagamento: d.statusPagamento,
        valor: d.valor
      })),
      totalGeral,
      totalPago,
      totalPendente,
      periodoDesc: periodoLabel
    });
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. SELETOR DE PERÍODO E COLABORADORA */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          
          {/* Navegação de Mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                disabled={todoOHistorico}
                onClick={() => {
                  if (mes === 0) {
                    setMes(11);
                    setAno(a => a - 1);
                  } else {
                    setMes(m => m - 1);
                  }
                }}
                className="btn btn-secondary btn-icon btn-sm"
                title="Mês Anterior"
                style={{ width: '32px', height: '32px', opacity: todoOHistorico ? 0.4 : 1 }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                disabled={todoOHistorico}
                onClick={() => {
                  if (mes === 11) {
                    setMes(0);
                    setAno(a => a + 1);
                  } else {
                    setMes(m => m + 1);
                  }
                }}
                className="btn btn-secondary btn-icon btn-sm"
                title="Próximo Mês"
                style={{ width: '32px', height: '32px', opacity: todoOHistorico ? 0.4 : 1 }}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setTodoOHistorico(false);
                setAno(agora.getFullYear());
                setMes(agora.getMonth());
              }}
              className={`btn btn-sm ${!todoOHistorico && mes === agora.getMonth() && ano === agora.getFullYear() ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            >
              Mês Atual
            </button>

            <button
              type="button"
              onClick={() => setTodoOHistorico(v => !v)}
              className={`btn btn-sm ${todoOHistorico ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            >
              {todoOHistorico ? '✓ Todo o Histórico' : 'Todo o Histórico'}
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginLeft: '0.35rem' }}>
              {todoOHistorico ? 'Todo o Histórico de Diárias' : `${MESES_NOMES[mes]} de ${ano}`}
            </h3>
          </div>

          {/* Botões de Ação: Excel e Imprimir */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportarExcel}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)' }}
              title="Baixar extrato analítico formatado no Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet size={16} color="#10b981" />
              <span style={{ fontWeight: '600', color: '#34d399' }}>Exportar (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem' }}
              title="Imprimir ou Salvar em PDF"
            >
              <Printer size={16} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtro por Colaboradora e Status */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.85rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Seletor de Colaboradora */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
              Colaboradora:
            </span>
            <select
              value={ajudanteSelecionadaId}
              onChange={e => setAjudanteSelecionadaId(e.target.value)}
              className="form-input"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.825rem', minWidth: '190px' }}
            >
              <option value="todas">Todas as Ajudantes ({ajudantes.length})</option>
              {ajudantes.map(aj => (
                <option key={aj.id} value={aj.id}>
                  {aj.nome} {aj.status !== 'ativo' ? '(Inativa)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
              Situação:
            </span>
            <button
              type="button"
              onClick={() => setStatusFiltro('todos')}
              className={`badge ${statusFiltro === 'todos' ? 'badge-info' : 'badge-neutral'}`}
              style={{ cursor: 'pointer', border: 'none', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              Todas ({qtdTotal})
            </button>
            <button
              type="button"
              onClick={() => setStatusFiltro('pendente')}
              className={`badge ${statusFiltro === 'pendente' ? 'badge-warning' : 'badge-neutral'}`}
              style={{ cursor: 'pointer', border: 'none', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              ⏳ A Pagar ({qtdPendentes})
            </button>
            <button
              type="button"
              onClick={() => setStatusFiltro('pago')}
              className={`badge ${statusFiltro === 'pago' ? 'badge-success' : 'badge-neutral'}`}
              style={{ cursor: 'pointer', border: 'none', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              ✓ Já Pagas ({qtdPagas})
            </button>
          </div>
        </div>

        {/* Busca Textual */}
        <div style={{ position: 'relative', marginTop: '0.75rem' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por colaboradora, cliente, condomínio, torre ou bairro..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* 2. CARDS DE RESUMO FINANCEIRO (KPIs) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Card 1: Saldo Pendente a Pagar */}
        <div 
          onClick={() => setStatusFiltro('pendente')}
          className="glass-card" 
          style={{
            padding: '1rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--accent-gold)',
            background: statusFiltro === 'pendente' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-gold)' }}>
              Pendente a Pagar
            </span>
            <Clock size={16} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-gold)' }}>
            {formatCurrency(totalPendente)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {qtdPendentes} diária(s) aguardando PIX
          </div>
        </div>

        {/* Card 2: Já Pago / Liquidado */}
        <div 
          onClick={() => setStatusFiltro('pago')}
          className="glass-card" 
          style={{
            padding: '1rem',
            cursor: 'pointer',
            borderLeft: '4px solid var(--primary-500)',
            background: statusFiltro === 'pago' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-400)' }}>
              Total Já Pago
            </span>
            <CheckCircle2 size={16} color="var(--primary-400)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary-400)' }}>
            {formatCurrency(totalPago)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {qtdPagas} diária(s) concluídas
          </div>
        </div>

        {/* Card 3: Total Geral da Produção */}
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
              Valor Total Geral
            </span>
            <DollarSign size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
            {formatCurrency(totalGeral)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {qtdTotal} diárias no período
          </div>
        </div>

        {/* Card 4: Total de Faxinas */}
        <div 
          onClick={() => setStatusFiltro('todos')}
          className="glass-card" 
          style={{
            padding: '1rem',
            cursor: 'pointer',
            borderLeft: '4px solid #94a3b8',
            background: statusFiltro === 'todos' ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Diárias Executadas
            </span>
            <Users size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {qtdTotal} faxina(s)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Clique para ver todas
          </div>
        </div>
      </div>

      {/* 3. TABELA ANALÍTICA COMPLETA DE DIÁRIAS */}
      <div className="glass-card" style={{ padding: '1rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Extrato Analítico de Diárias</span>
              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                {diariasFiltradas.length} lançamento(s)
              </span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Clique em <strong style={{ color: '#f87171' }}>"↩ Estornar"</strong> caso tenha marcado como pago por engano para voltar a pendente.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', minWidth: '880px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.875rem' }}>Data / Horário</th>
                <th style={{ padding: '0.75rem 0.875rem' }}>Colaboradora</th>
                <th style={{ padding: '0.75rem 0.875rem' }}>Cliente / Condomínio</th>
                <th style={{ padding: '0.75rem 0.875rem' }}>Endereço / Local</th>
                <th style={{ padding: '0.75rem 0.875rem', textAlign: 'right' }}>Valor Diária</th>
                <th style={{ padding: '0.75rem 0.875rem', textAlign: 'center' }}>Situação</th>
                <th style={{ padding: '0.75rem 0.875rem', textAlign: 'center' }}>Ação (Pagar / Estornar)</th>
              </tr>
            </thead>
            <tbody>
              {diariasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma diária encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                diariasFiltradas.map((d, index) => {
                  const isPago = d.statusPagamento === 'pago';
                  const waUrl = getWhatsAppUrl(d.ajudanteTelefone, `Olá, ${d.ajudanteNome}! Sobre a diária do dia ${formatDate(d.dataHora)} no cliente ${d.clienteNome}:`);

                  return (
                    <tr 
                      key={index} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: isPago ? 'transparent' : 'rgba(245, 158, 11, 0.04)'
                      }}
                    >
                      {/* 1. Data e Horário */}
                      <td style={{ padding: '0.65rem 0.875rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {formatDate(d.dataHora)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(d.dataHora).toLocaleDateString('pt-BR', { weekday: 'short' })} às {new Date(d.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* 2. Colaboradora */}
                      <td style={{ padding: '0.65rem 0.875rem' }}>
                        <div style={{ fontWeight: '700', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{d.ajudanteNome}</span>
                        </div>
                        {d.ajudantePix && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                            <button
                              type="button"
                              onClick={() => copiarPix(d.ajudantePix, `${d.agendamentoId}_${d.ajudanteId}`)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.1rem 0.35rem', fontSize: '0.68rem', height: 'auto', gap: '2px' }}
                              title={`Copiar PIX: ${d.ajudantePix}`}
                            >
                              {pixCopiadoId === `${d.agendamentoId}_${d.ajudanteId}` ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                              <span>PIX: {d.ajudantePix.length > 14 ? `${d.ajudantePix.slice(0, 12)}...` : d.ajudantePix}</span>
                            </button>
                            {d.ajudanteTelefone && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#25d366', display: 'flex', alignItems: 'center' }}
                                title="Chamar colaboradora no WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 3. Cliente / Condomínio */}
                      <td style={{ padding: '0.65rem 0.875rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {d.clienteNome}
                        </div>
                        {d.condominio && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Building size={11} color="var(--primary-400)" />
                            <span>{d.condominio} {d.torre ? `(T. ${d.torre})` : ''} {d.apartamento ? `Apto ${d.apartamento}` : ''}</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Endereço */}
                      <td style={{ padding: '0.65rem 0.875rem', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                        {d.bairro ? `${d.bairro} - São Paulo` : d.enderecoCompleto}
                      </td>

                      {/* 5. Valor Diária */}
                      <td style={{ padding: '0.65rem 0.875rem', textAlign: 'right', fontWeight: '800', fontSize: '0.925rem', color: isPago ? 'var(--text-primary)' : 'var(--accent-gold)' }}>
                        {formatCurrency(d.valor)}
                      </td>

                      {/* 6. Status */}
                      <td style={{ padding: '0.65rem 0.875rem', textAlign: 'center' }}>
                        {isPago ? (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={12} />
                            <span>Pago</span>
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={12} />
                            <span>A Pagar</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Ação: Pagar / Estornar */}
                      <td style={{ padding: '0.65rem 0.875rem', textAlign: 'center' }}>
                        {isPago ? (
                          <button
                            type="button"
                            onClick={() => handleAlternarPagamento(d)}
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              padding: '0.25rem 0.6rem', 
                              fontSize: '0.725rem',
                              color: '#f87171',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Clique para ESTORNAR e voltar para 'A Pagar'"
                          >
                            <RotateCcw size={12} />
                            <span>Estornar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAlternarPagamento(d)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.25rem 0.65rem', fontSize: '0.725rem' }}
                            title="Marcar esta diária como paga"
                          >
                            Pagar Agora
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {diariasFiltradas.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--bg-input)', borderTop: '2px solid var(--border-color)', fontWeight: '700' }}>
                  <td colSpan="4" style={{ padding: '0.75rem 0.875rem', textAlign: 'right' }}>
                    TOTAL DO PERÍODO:
                  </td>
                  <td style={{ padding: '0.75rem 0.875rem', textAlign: 'right', color: 'var(--primary-400)', fontSize: '1rem', fontWeight: '800' }}>
                    {formatCurrency(totalGeral)}
                  </td>
                  <td colSpan="2" style={{ padding: '0.75rem 0.875rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (Pago: <strong style={{ color: '#10b981' }}>{formatCurrency(totalPago)}</strong> • A Pagar: <strong style={{ color: '#f59e0b' }}>{formatCurrency(totalPendente)}</strong>)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
