import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Eye, Check, AlertCircle, ShieldCheck, DollarSign, MapPin, Calendar } from 'lucide-react';
import { buildEscalaSemanalAjudanteText, getWhatsAppUrl } from '../utils/whatsapp';
import { formatCurrency } from '../utils/formatters';

export const ModalPreviewEscalaSemanal = ({
  isOpen,
  onClose,
  ajudante,
  faxinas,
  clientes,
  showToast
}) => {
  if (!isOpen || !ajudante) return null;

  const [incluirPreco, setIncluirPreco] = useState(true);
  const [incluirEndereco, setIncluirEndereco] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [textoPersonalizado, setTextoPersonalizado] = useState('');

  // Prepara os dados das faxinas da semana para o texto
  const payloadFaxinas = (faxinas || []).map(ag => {
    const cli = (clientes || []).find(c => c.id === ag.clienteId);
    const ae = (ag.ajudantesEscaladas || []).find(e => e.ajudanteId === ajudante.id);
    return {
      dataHoraInicio: ag.dataHoraInicio,
      clienteNome: cli?.nome || 'Cliente',
      condominio: cli?.condominio || '',
      torre: cli?.torre || '',
      apartamento: cli?.apartamento || '',
      endereco: cli?.endereco || '',
      bairro: cli?.bairro || '',
      valorDiaria: ae?.valorAPagar || ajudante.valorDiariaBase || 100
    };
  });

  const totalDiarias = payloadFaxinas.reduce((acc, f) => acc + Number(f.valorDiaria || 0), 0);

  // Recalcula o texto quando as opções mudam
  useEffect(() => {
    const textoGerado = buildEscalaSemanalAjudanteText({
      ajudanteNome: ajudante.nome,
      faxinas: payloadFaxinas,
      totalDiarias,
      incluirPreco,
      incluirEndereco
    });
    setTextoPersonalizado(textoGerado);
  }, [incluirPreco, incluirEndereco, ajudante]);

  const handleCopiar = () => {
    navigator.clipboard.writeText(textoPersonalizado);
    setCopiado(true);
    if (showToast) showToast('Mensagem copiada para a área de transferência! 📋');
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleEnviarWhatsApp = () => {
    const url = getWhatsAppUrl(ajudante.telefone, textoPersonalizado);
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content glass-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          marginBottom: '0.85rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
                Escala Semanal • {ajudante.nome}
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Confira exatamente o que será encaminhado no WhatsApp antes de enviar
            </span>
          </div>

          <button 
            onClick={onClose} 
            className="btn btn-secondary btn-icon"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Alerta de Segurança e Transparência de Valores */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          marginBottom: '0.85rem',
          fontSize: '0.78rem',
          color: 'var(--text-primary)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Transparência Total:</strong> O valor que consta na mensagem é <u>apenas a diária a receber da colaboradora</u> ({formatCurrency(ajudante.valorDiariaBase || 100)}). O valor total cobrado do cliente <strong>NUNCA é enviado</strong>.
          </div>
        </div>

        {/* Opções de Personalização do Envio */}
        <div style={{ 
          background: 'var(--bg-input)', 
          padding: '0.65rem 0.85rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Opções do que enviar:
          </span>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={incluirPreco} 
              onChange={(e) => setIncluirPreco(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
            />
            <span>
              Incluir <strong>valor das diárias</strong> (R$ {totalDiarias.toFixed(2).replace('.', ',')})
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={incluirEndereco} 
              onChange={(e) => setIncluirEndereco(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
            />
            <span>
              Incluir <strong>endereço / condomínio</strong> detalhado
            </span>
          </label>
        </div>

        {/* Pré-visualização da Mensagem (Estilo WhatsApp) */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', minHeight: '160px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              💬 Pré-visualização da mensagem (você pode editar antes de enviar):
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
              {payloadFaxinas.length} faxina(s) na semana
            </span>
          </div>

          <div style={{
            background: '#0b141a',
            border: '1px solid #1f2c34',
            borderRadius: '12px',
            padding: '0.85rem',
            position: 'relative'
          }}>
            <textarea
              value={textoPersonalizado}
              onChange={(e) => setTextoPersonalizado(e.target.value)}
              rows={10}
              style={{
                width: '100%',
                background: '#111b21',
                color: '#e9edef',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.82rem',
                fontFamily: 'monospace, sans-serif',
                lineHeight: '1.45',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '0.5rem',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem'
        }}>
          <button 
            type="button"
            onClick={handleCopiar} 
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', gap: '0.35rem' }}
          >
            {copiado ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button 
              type="button"
              onClick={onClose} 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Fechar
            </button>

            <button 
              type="button"
              onClick={handleEnviarWhatsApp} 
              className="btn btn-whatsapp btn-sm"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.4rem' }}
            >
              <Send size={14} />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
