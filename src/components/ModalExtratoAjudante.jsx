import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart } from './LineChart';
import { exportExtratoAjudanteCsv } from '../utils/exportExcel';
import { buildExtratoAjudanteText, getWhatsAppUrl } from '../utils/whatsapp';
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
  UserCheck
} from 'lucide-react';

export const ModalExtratoAjudante = ({ isOpen, onClose, ajudante }) => {
  const { agendamentos, clientes, setStatusPagamentoAjudante, showToast } = useApp();

  // Filtros de Período
  const [periodoTipo, setPeriodoTipo] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pixCopiado, setPixCopiado] = useState(false);

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

  // Montar Histórico Completo de Diárias da Ajudante
  const todasAsDiarias = useMemo(() => {
    if (!ajudante) return [];

    const list = [];
    agendamentos.forEach(ag => {
      if (ag.ajudantesIds && ag.ajudantesIds.includes(ajudante.id)) {
        const cli = clientes.find(c => c.id === ag.clienteId);
        const valorPago = (ag.valoresAjudantes && ag.valoresAjudantes[ajudante.id]) !== undefined
          ? Number(ag.valoresAjudantes[ajudante.id])
          : Number(ajudante.valorPadrao || 90);

        const statusPag = (ag.pagamentosAjudantes && ag.pagamentosAjudantes[ajudante.id]) || 'pendente';

        list.push({
          agendamentoId: ag.id,
          clienteNome: cli?.nome || 'Cliente',
          endereco: cli ? `${cli.endereco}, ${cli.apartamento || ''} - ${cli.bairro || ''}` : 'São Paulo - SP',
          dataHora: ag.dataHoraInicio,
          valor: valorPago,
          statusPagamento: statusPag
        });
      }
    });

    return list;
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

    filtered.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
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
  const handleExportExcel = () => {
    exportExtratoAjudanteCsv({
      ajudante,
      historicoDiarias: diariasFiltradas,
      totalGeral,
      totalPago,
      totalPendente,
      periodoDesc
    });
    showToast('Planilha de diárias exportada com sucesso!');
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

  const handleImprimir = () => {
    window.print();
  };

  if (!isOpen || !ajudante) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho do Extrato */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-info">Extrato de Diárias</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limpeza Express SP</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
              {ajudante.nome}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={13} color="var(--primary-400)" />
                {ajudante.telefone || 'Sem telefone'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CreditCard size={13} color="var(--accent-gold)" />
                PIX: {ajudante.chavePix || 'Não cadastrada'} ({ajudante.tipoPix || 'Chave'})
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon btn-sm"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chave PIX Destacada para Pagamento Rápido */}
        {ajudante.chavePix && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                CHAVE PIX PARA TRANSFERÊNCIA ({ajudante.tipoPix})
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                {ajudante.chavePix}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => copiarPix(ajudante.chavePix)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem' }}
            >
              {pixCopiado ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{pixCopiado ? 'Copiado!' : 'Copiar PIX'}</span>
            </button>
          </div>
        )}

        {/* Filtros de Período */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Calendar size={16} color="var(--primary-400)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Selecione o Período:
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
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
                style={{ fontSize: '0.775rem' }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodoTipo === 'custom' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              marginTop: '0.75rem', 
              background: 'var(--bg-input)', 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>De:</span>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={e => setDataInicio(e.target.value)} 
                  className="input form-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', height: '36px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Até:</span>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={e => setDataFim(e.target.value)} 
                  className="input form-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', height: '36px' }}
                />
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Filtro ativo: {periodoDesc}
              </span>
            </div>
          )}
        </div>

        {/* Cards de KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '0.875rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total de Diárias</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
              {formatCurrency(totalGeral)}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              {diariasFiltradas.length} serviço(s) realizado(s)
            </span>
          </div>

          <div className="glass-card" style={{ padding: '0.875rem', borderLeft: '3px solid var(--primary-500)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Já Pago / Transferido</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--primary-500)' }}>
              {formatCurrency(totalPago)}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              Transferências concluídas
            </span>
          </div>

          <div className="glass-card" style={{ padding: '0.875rem', borderLeft: totalPendente > 0 ? '3px solid var(--accent-gold)' : '3px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Saldo a Pagar (PIX)</span>
            <strong style={{ fontSize: '1.3rem', color: totalPendente > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
              {formatCurrency(totalPendente)}
            </strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              {totalPendente > 0 ? 'Pendente de quitação' : 'Nenhuma diária pendente'}
            </span>
          </div>
        </div>

        {/* Gráfico de Linha: Dia x Valor da Diária */}
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <TrendingUp size={16} color="var(--accent-cyan)" />
              <span>Evolução das Diárias ({periodoDesc})</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Eixo X: Data • Eixo Y: Valor da Diária (R$)
            </span>
          </div>

          <LineChart 
            data={dadosGrafico} 
            height={180} 
            color="#06b6d4" 
            gradientColor="#3b82f6" 
            valuePrefix="R$ " 
            emptyMessage="Nenhuma diária registrada no período selecionado."
          />
        </div>

        {/* Barra de Ações: Exportar Excel, WhatsApp, Imprimir */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Diárias Realizadas ({diariasFiltradas.length})
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button 
              type="button" 
              onClick={handleExportExcel}
              className="btn btn-secondary btn-sm"
              title="Baixar relatório para o Microsoft Excel"
            >
              <FileSpreadsheet size={15} color="#10b981" />
              <span>Exportar Excel (.csv)</span>
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

            <button 
              type="button" 
              onClick={handleImprimir}
              className="btn btn-secondary btn-sm"
              title="Imprimir ou Salvar PDF"
            >
              <Printer size={15} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Tabela de Diárias */}
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.625rem 0.875rem' }}>Data</th>
                <th style={{ padding: '0.625rem 0.875rem' }}>Cliente Atendido</th>
                <th style={{ padding: '0.625rem 0.875rem' }}>Local / Endereço</th>
                <th style={{ padding: '0.625rem 0.875rem' }}>Valor da Diária</th>
                <th style={{ padding: '0.625rem 0.875rem' }}>Status</th>
                <th style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {diariasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma diária encontrada para o período selecionado.
                  </td>
                </tr>
              ) : (
                diariasFiltradas.map((d, index) => {
                  const isPago = d.statusPagamento === 'pago';

                  return (
                    <tr 
                      key={index} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: isPago ? 'transparent' : 'rgba(245, 158, 11, 0.03)'
                      }}
                    >
                      <td style={{ padding: '0.625rem 0.875rem', fontWeight: '500' }}>
                        {formatDate(d.dataHora)}
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                          {new Date(d.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td style={{ padding: '0.625rem 0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {d.clienteNome}
                      </td>

                      <td style={{ padding: '0.625rem 0.875rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.endereco}
                        </span>
                      </td>

                      <td style={{ padding: '0.625rem 0.875rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                        {formatCurrency(d.valor)}
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
                            <span>A Pagar</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const novoStatus = isPago ? 'pendente' : 'pago';
                            setStatusPagamentoAjudante(d.agendamentoId, ajudante.id, novoStatus);
                            showToast(`Diária marcada como: ${novoStatus === 'pago' ? 'Paga' : 'Pendente'}`);
                          }}
                          className={`btn btn-sm ${isPago ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
                        >
                          {isPago ? 'Marcar A Pagar' : 'Pagar Agora'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
