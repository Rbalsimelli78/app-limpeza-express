import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Layers, 
  Plus, 
  MessageCircle, 
  Copy, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Users, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Send,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { buildApresentacaoPlanoText, getWhatsAppUrl } from '../utils/whatsapp';

export const PlanosView = ({ onNovoPlano, onEditarPlano }) => {
  const { planos, clientes, deletePlano, resetPlanosPadrao, showToast } = useApp();

  // Estado para controlar expansão de itens do pacote por plano
  const [expandidos, setExpandidos] = useState({});

  // Modal rápido de envio de WhatsApp para cliente específico
  const [modalEnvioOpen, setModalEnvioOpen] = useState(false);
  const [planoParaEnvio, setPlanoParaEnvio] = useState(null);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');
  const [telefoneAvulso, setTelefoneAvulso] = useState('');

  const toggleExpandir = (id) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copiarApresentacao = (plano) => {
    const texto = buildApresentacaoPlanoText(plano);
    navigator.clipboard.writeText(texto);
    showToast(`Apresentação do "${plano.nome}" copiada com sucesso!`);
  };

  const abrirModalEnvio = (plano) => {
    setPlanoParaEnvio(plano);
    setClienteSelecionadoId('');
    setTelefoneAvulso('');
    setModalEnvioOpen(true);
  };

  const handleEnviarWhatsApp = (e) => {
    e.preventDefault();
    if (!planoParaEnvio) return;

    let telFinal = telefoneAvulso;
    let nomeFinal = '';

    if (clienteSelecionadoId) {
      const cli = clientes.find(c => c.id === clienteSelecionadoId);
      if (cli) {
        telFinal = cli.telefone;
        nomeFinal = cli.nome;
      }
    }

    const texto = buildApresentacaoPlanoText(planoParaEnvio, nomeFinal);
    const url = getWhatsAppUrl(telFinal, texto);
    window.open(url, '_blank');
    setModalEnvioOpen(false);
    showToast('WhatsApp aberto com a apresentação do plano!');
  };

  return (
    <div className="page-wrapper">
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Layers size={24} color="var(--primary-400)" />
            <span>Catálogo & Planos de Limpeza</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Gerencie os pacotes de serviço da Limpeza Express SP e envie a apresentação detalhada aos clientes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              if (confirm('Deseja restaurar os planos para o modelo oficial do catálogo?')) {
                resetPlanosPadrao();
              }
            }} 
            className="btn btn-secondary btn-sm"
            title="Restaura os 3 planos padrão com todos os 9 serviços das fotos"
          >
            <RotateCcw size={14} />
            <span>Restaurar Catálogo Oficial</span>
          </button>

          <button onClick={onNovoPlano} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Novo Plano</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de Planos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {planos.map(plano => {
          const isExpandido = expandidos[plano.id] !== false; // Padrão aberto
          const numServicos = (plano.servicosOferecidos || []).length;

          return (
            <div 
              key={plano.id} 
              className="glass-card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                borderTop: plano.destaque ? '4px solid var(--primary-500)' : '1px solid var(--border-color)'
              }}
            >
              {/* Topo do Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    {plano.destaque && (
                      <span className="badge badge-success" style={{ background: '#10b981', color: '#fff' }}>
                        <Sparkles size={12} /> {plano.destaque}
                      </span>
                    )}
                    <span className="badge badge-info">{plano.frequencia || 'Recorrente'}</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    {plano.nome}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.6rem', 
                    fontWeight: '800', 
                    color: 'var(--primary-400)', 
                    fontFamily: 'var(--font-display)',
                    lineHeight: '1.1'
                  }}>
                    {formatCurrency(plano.valorBase)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {plano.dormitoriosBase || 2} dormitórios base
                  </span>
                </div>
              </div>

              {/* Informações de Equipe e Duração */}
              <div style={{ 
                background: 'var(--bg-input)', 
                padding: '0.625rem 0.875rem', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Clock size={15} color="var(--accent-cyan)" />
                  Tempo: <strong>{plano.tempoEstimado || '3 a 5hs'}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Users size={15} color="var(--primary-400)" />
                  Equipe: <strong>{plano.profissionais || 2} profissionais</strong>
                </span>
              </div>

              {/* Regras e Adicionais do Plano */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {plano.acrescimoPorQuartoExtra > 0 && (
                  <div>
                    👉 <strong>3 dormitórios ou mais:</strong> acrescer +{formatCurrency(plano.acrescimoPorQuartoExtra)}
                  </div>
                )}
                {plano.taxaSemManutencao > 0 && (
                  <div>
                    ⚠️ <strong>Sem manutenção há mais de 2 meses:</strong> adicional de +{formatCurrency(plano.taxaSemManutencao)}
                  </div>
                )}
              </div>

              {/* Seção Expansível: Serviços Oferecidos Neste Pacote */}
              <div style={{ 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '0.875rem', 
                marginBottom: '1.25rem' 
              }}>
                <button 
                  type="button"
                  onClick={() => toggleExpandir(plano.id)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    padding: '0.25rem 0'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <CheckCircle size={16} color="var(--primary-400)" />
                    <span>Serviços Oferecidos neste pacote ({numServicos} itens)</span>
                  </span>
                  {isExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpandido && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    marginTop: '0.75rem',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {(plano.servicosOferecidos || []).map((s, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'var(--bg-input)', 
                          padding: '0.5rem 0.75rem', 
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                          {idx + 1}. {s.item}
                        </strong>
                        {s.detalhe && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.15rem' }}>
                            • {s.detalhe}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aviso Importante de Cancelamento */}
              {plano.avisoCancelamento && (
                <div style={{ 
                  background: 'rgba(244, 63, 94, 0.06)', 
                  border: '1px solid rgba(244, 63, 94, 0.25)', 
                  padding: '0.625rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.25rem'
                }}>
                  <span style={{ color: '#fb7185', fontWeight: '600', display: 'block', marginBottom: '0.15rem' }}>
                    Aviso Importante:
                  </span>
                  {plano.avisoCancelamento}
                </div>
              )}

              {/* Ações do Card */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => abrirModalEnvio(plano)}
                    className="btn btn-whatsapp" 
                    style={{ flex: 1 }}
                    title="Encaminhar detalhes deste plano no WhatsApp do cliente"
                  >
                    <Send size={16} />
                    <span>Encaminhar no WhatsApp</span>
                  </button>

                  <button 
                    onClick={() => copiarApresentacao(plano)}
                    className="btn btn-secondary btn-icon"
                    title="Copiar texto da apresentação"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    onClick={() => onEditarPlano(plano)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit2 size={13} />
                    <span>Editar Plano</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o plano "${plano.nome}"?`)) {
                        deletePlano(plano.id);
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    title="Excluir este plano"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Escolha do Destinatário no WhatsApp */}
      {modalEnvioOpen && planoParaEnvio && (
        <div className="modal-overlay" onClick={() => setModalEnvioOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageCircle size={20} color="#25d366" />
                <h3 style={{ fontSize: '1.1rem' }}>Encaminhar Plano no WhatsApp</h3>
              </div>
              <button onClick={() => setModalEnvioOpen(false)} className="btn btn-secondary btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEnviarWhatsApp}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Você está enviando o <strong>{planoParaEnvio.nome}</strong> com todos os {planoParaEnvio.servicosOferecidos?.length || 0} itens do pacote.
                </p>

                {clientes.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Escolher Cliente Cadastrado:</label>
                    <select 
                      className="form-select"
                      value={clienteSelecionadoId}
                      onChange={e => {
                        setClienteSelecionadoId(e.target.value);
                        if (e.target.value) setTelefoneAvulso('');
                      }}
                    >
                      <option value="">Selecione ou digite abaixo...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Ou Digite o WhatsApp (com DDD):</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: 11 98765-4321 (ou deixe em branco para escolher no app)"
                    value={telefoneAvulso}
                    onChange={e => {
                      setTelefoneAvulso(e.target.value);
                      if (e.target.value) setClienteSelecionadoId('');
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalEnvioOpen(false)} className="btn btn-secondary btn-sm">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-whatsapp btn-sm">
                  <Send size={15} />
                  <span>Abrir WhatsApp Agora</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
