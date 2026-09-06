import React, { useState } from 'react';
import { BookOpen, RefreshCw, Share2, Sparkles, Heart } from 'lucide-react';
import { getVersiculoDoDia, getVersiculoAleatorio } from '../data/versiculos';
import { useApp } from '../context/AppContext';

export const MensagemBiblica = () => {
  const { showToast } = useApp();
  const [data, setData] = useState(() => getVersiculoDoDia());
  const [animating, setAnimating] = useState(false);

  const trocarVersiculo = () => {
    setAnimating(true);
    setTimeout(() => {
      const proximo = getVersiculoAleatorio(data.index);
      setData(proximo);
      setAnimating(false);
      showToast('Nova mensagem de fé carregada! 🙏');
    }, 200);
  };

  const compartilharVersiculo = () => {
    const v = data.versiculo;
    const msg = `📖 *Mensagem de Fé • Limpeza Express SP* ✨\n\n“${v.texto}”\n— *${v.referencia}*\n\n🙏 *Reflexão:* ${v.reflexao}\n\n_Que o Senhor Jesus abençoe ricamente o seu dia e seu trabalho!_ ✝️💙`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const { versiculo } = data;

  return (
    <div 
      className="glass-card" 
      style={{
        marginBottom: '1.25rem',
        padding: '1.1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.06) 50%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Detalhe de Brilho Sutil Superior */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 50%, #3b82f6 100%)'
      }} />

      {/* Cabeçalho do Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.65rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ 
            fontSize: '1.25rem', 
            background: 'rgba(245, 158, 11, 0.15)', 
            padding: '0.2rem 0.45rem', 
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            ✝️
          </span>
          <div>
            <h4 style={{ 
              fontSize: '0.9rem', 
              fontWeight: '700', 
              color: 'var(--accent-gold, #f59e0b)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem',
              margin: 0 
            }}>
              <span>Palavra do Dia</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 'normal', color: 'var(--text-muted)' }}>
                • Deus & Jesus em 1º Lugar
              </span>
            </h4>
          </div>
        </div>

        {/* Botões de Ação da Mensagem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={trocarVersiculo}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.25rem 0.55rem', 
              gap: '0.3rem',
              borderColor: 'rgba(245, 158, 11, 0.35)',
              color: 'var(--accent-gold)'
            }}
            title="Sortear outro versículo bíblico"
          >
            <RefreshCw size={12} className={animating ? 'spin' : ''} />
            <span>Outro Versículo</span>
          </button>

          <button
            onClick={compartilharVersiculo}
            type="button"
            className="btn btn-whatsapp btn-sm"
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.25rem 0.55rem', 
              gap: '0.3rem' 
            }}
            title="Compartilhar este versículo no WhatsApp"
          >
            <Share2 size={12} />
            <span className="hide-on-mobile-extra">Compartilhar</span>
          </button>
        </div>
      </div>

      {/* Conteúdo do Versículo */}
      <div style={{ 
        opacity: animating ? 0.3 : 1, 
        transform: animating ? 'translateY(4px)' : 'translateY(0)', 
        transition: 'all 0.2s ease' 
      }}>
        <blockquote style={{
          margin: 0,
          paddingLeft: '0.85rem',
          borderLeft: '3px solid var(--accent-gold, #f59e0b)',
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
          lineHeight: '1.45',
          fontWeight: '500'
        }}>
          "{versiculo.texto}"
        </blockquote>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '0.5rem',
          marginTop: '0.55rem',
          paddingLeft: '0.85rem'
        }}>
          <span style={{ 
            fontSize: '0.82rem', 
            fontWeight: '700', 
            color: 'var(--primary-400)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.3rem' 
          }}>
            <BookOpen size={13} color="var(--primary-400)" />
            <span>{versiculo.referencia}</span>
          </span>

          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Heart size={12} color="#f43f5e" fill="#f43f5e" />
            <span>{versiculo.reflexao}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
