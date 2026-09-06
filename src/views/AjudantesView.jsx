import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserCheck, 
  Plus, 
  Copy, 
  Phone, 
  MessageCircle, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Edit2, 
  Trash2,
  AlertTriangle,
  TrendingUp,
  Search,
  UserX,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatPhone, formatDate, formatTime } from '../utils/formatters';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { ModalExtratoAjudante } from '../components/ModalExtratoAjudante';

export const AjudantesView = ({ onNovaAjudante, onEditarAjudante }) => {
  const { 
    ajudantes, 
    agendamentos, 
    clientes,
    deleteAjudante, 
    updateAjudante,
    setStatusPagamentoAjudante, 
    showToast 
  } = useApp();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas'); // 'todas', 'ativo', 'inativo'
  const [ajudanteExtrato, setAjudanteExtrato] = useState(null);

  // Contagens para os botões de status
  const qtdAtivas = ajudantes.filter(a => a.status === 'ativo').length;
  const qtdInativas = ajudantes.filter(a => a.status !== 'ativo').length;

  const ajudantesFiltradas = ajudantes.filter(aj => {
    // 1. Filtro de Status
    if (filtroStatus === 'ativo' && aj.status !== 'ativo') return false;
    if (filtroStatus === 'inativo' && aj.status === 'ativo') return false;

    // 2. Filtro de Busca
    const termo = busca.toLowerCase();
    if (!termo) return true;

    return (
      aj.nome?.toLowerCase().includes(termo) ||
      aj.telefone?.includes(termo) ||
      aj.chavePix?.toLowerCase().includes(termo) ||
      aj.especialidade?.toLowerCase().includes(termo)
    );
  });

  const copiarPix = (chave) => {
    navigator.clipboard.writeText(chave);
    showToast(`Chave PIX (${chave}) copiada para a área de transferência!`);
  };

  // Coleta todas as diárias atribuídas a cada ajudante
  const getDadosAjudante = (ajudanteId) => {
    let totalPendente = 0;
    let totalPago = 0;
    let totalServicos = 0;
    const historico = [];

    agendamentos.forEach(ag => {
      const escala = (ag.ajudantesEscaladas || []).find(ae => ae.ajudanteId === ajudanteId);
      if (escala) {
        totalServicos++;
        const valor = Number(escala.valorAPagar || 0);
        if (escala.statusPagamento === 'pago') {
          totalPago += valor;
        } else {
          totalPendente += valor;
        }
        const cliente = clientes.find(c => c.id === ag.clienteId);
        historico.push({
          agendamentoId: ag.id,
          clienteNome: cliente?.nome || 'Cliente',
          bairro: cliente?.bairro || '',
          dataHora: ag.dataHoraInicio,
          valor: valor,
          statusPagamento: escala.statusPagamento
        });
      }
    });

    return { totalPendente, totalPago, totalServicos, historico };
  };

  return (
    <div className="page-wrapper">
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <UserCheck size={24} color="var(--primary-400)" />
            <span>Ajudantes & Controle de Diárias</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Cadastro de colaboradoras, valor por diária/hora, chaves PIX e saldos a pagar
          </p>
        </div>

        <button onClick={onNovaAjudante} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Nova Colaboradora</span>
        </button>
      </div>

      {/* Busca e Filtro por Status */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por nome da colaboradora, chave PIX, especialidade ou WhatsApp..."
            style={{ paddingLeft: '36px' }}
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Filtro por Situação (Todas / Ativas / Inativas) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.25rem' }}>
            <UserCheck size={13} color="var(--primary-400)" />
            <span>Situação:</span>
          </span>

          <button
            type="button"
            onClick={() => setFiltroStatus('todas')}
            className={`badge ${filtroStatus === 'todas' ? 'badge-info' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            Todas ({ajudantes.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('ativo')}
            className={`badge ${filtroStatus === 'ativo' ? 'badge-success' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <CheckCircle2 size={12} />
            <span>Ativas ({qtdAtivas})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('inativo')}
            className={`badge ${filtroStatus === 'inativo' ? 'badge-danger' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <UserX size={12} />
            <span>Inativas / Pausadas ({qtdInativas})</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de Ajudantes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {ajudantesFiltradas.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <UserCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nenhuma ajudante encontrada com os filtros atuais.</p>
            <button onClick={onNovaAjudante} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              Cadastrar Nova Ajudante
            </button>
          </div>
        ) : (
          ajudantesFiltradas.map(aj => {
            const { totalPendente, totalPago, totalServicos, historico } = getDadosAjudante(aj.id);
            const waUrl = getWhatsAppUrl(aj.telefone, `Oi ${aj.nome}! Tudo bem? Limpeza Express SP falando ✨`);

            return (
              <div key={aj.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`badge ${aj.status === 'ativo' ? 'badge-success' : 'badge-neutral'}`}>
                        {aj.status === 'ativo' ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="badge badge-info">
                        {aj.tipoRemuneracao === 'diaria' ? 'Diária Fechada' : 'Por Hora'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {aj.nome}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valor Base</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                      {formatCurrency(aj.valorPadrao)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {aj.tipoRemuneracao === 'diaria' ? '/dia' : '/h'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={15} color="var(--accent-cyan)" />
                    <span>{formatPhone(aj.telefone)}</span>
                  </div>

                  {/* Chave PIX em Destaque */}
                  <div style={{ 
                    background: 'var(--bg-input)', 
                    padding: '0.625rem 0.875rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.25rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                        CHAVE PIX ({aj.tipoPix})
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {aj.chavePix || 'Não informada'}
                      </strong>
                    </div>
                    {aj.chavePix && (
                      <button 
                        onClick={() => copiarPix(aj.chavePix)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        title="Copiar Chave PIX"
                      >
                        <Copy size={13} />
                        <span>Copiar</span>
                      </button>
                    )}
                  </div>

                  {aj.especialidade && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      ✨ Especialidade: {aj.especialidade}
                    </div>
                  )}
                </div>

                {/* Resumo Financeiro da Ajudante */}
                <div style={{ 
                  background: totalPendente > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.06)',
                  border: totalPendente > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Pendente a Pagar
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: totalPendente > 0 ? 'var(--accent-gold)' : 'var(--primary-400)' }}>
                      {formatCurrency(totalPendente)}
                    </strong>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Já Pago / Concluído
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {formatCurrency(totalPago)} ({totalServicos} faxinas)
                    </span>
                  </div>
                </div>

                {/* Histórico Recente de Diárias */}
                {historico.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                      Últimos Trabalhos:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.375rem' }}>
                      {historico.slice(0, 3).map((h, i) => (
                        <div 
                          key={i} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            fontSize: '0.8rem',
                            padding: '0.35rem 0.5rem',
                            background: 'var(--bg-card-hover)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{h.clienteNome}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.375rem' }}>
                              ({formatDate(h.dataHora)})
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '600' }}>{formatCurrency(h.valor)}</span>
                            {h.statusPagamento === 'pago' ? (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Pago</span>
                            ) : (
                              <button 
                                onClick={() => setStatusPagamentoAjudante(h.agendamentoId, aj.id, 'pago')}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.15rem 0.35rem', fontSize: '0.68rem' }}
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botão de Extrato de Diárias & Gráfico */}
                <button
                  type="button"
                  onClick={() => setAjudanteExtrato(aj)}
                  className="btn btn-secondary btn-sm"
                  style={{ 
                    width: '100%', 
                    marginBottom: '0.625rem', 
                    gap: '0.4rem', 
                    justifyContent: 'center',
                    background: 'rgba(6, 182, 212, 0.08)',
                    borderColor: 'rgba(6, 182, 212, 0.25)',
                    color: 'var(--accent-cyan)',
                    fontWeight: '600'
                  }}
                  title="Ver extrato completo de diárias e gráfico de evolução"
                >
                  <TrendingUp size={15} />
                  <span>Ver Extrato de Diárias & Gráfico</span>
                </button>

                {/* Botões de Ação */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <a 
                    href={waUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-whatsapp btn-sm"
                    title="Conversar no WhatsApp"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => updateAjudante(aj.id, { status: aj.status === 'ativo' ? 'inativo' : 'ativo' })}
                      className="btn btn-secondary btn-icon btn-sm"
                      title={aj.status === 'ativo' ? 'Pausar / Inativar Colaboradora' : 'Reativar Colaboradora para Escalas'}
                      style={{ color: aj.status === 'ativo' ? '#f43f5e' : '#10b981' }}
                    >
                      {aj.status === 'ativo' ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button 
                      onClick={() => onEditarAjudante(aj)} 
                      className="btn btn-secondary btn-icon btn-sm"
                      title="Editar ajudante"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Excluir a colaboradora ${aj.nome}?`)) {
                          deleteAjudante(aj.id);
                        }
                      }} 
                      className="btn btn-danger btn-icon btn-sm"
                      title="Excluir ajudante"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Extrato da Ajudante */}
      <ModalExtratoAjudante 
        isOpen={!!ajudanteExtrato} 
        onClose={() => setAjudanteExtrato(null)} 
        ajudante={ajudanteExtrato} 
      />
    </div>
  );
};
