import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Plus, LogOut, Lock, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export const Header = ({ onOpenNovoAgendamento }) => {
  const { theme, toggleTheme, activeTab, logout, currentUser, cloudStatus, forcarSincronizacaoNuvem } = useApp();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Painel Geral';
      case 'agenda': return 'Agenda de Faxinas';
      case 'clientes': return 'Gestão de Clientes';
      case 'ajudantes': return 'Controle de Ajudantes & Diárias';
      case 'planos': return 'Catálogo & Planos de Limpeza';
      case 'orcamento': return 'Calculadora de Propostas WhatsApp';
      case 'financeiro': return 'Fluxo de Caixa & Lucro Líquido';
      case 'config': return 'Configurações & Backup';
      default: return 'Limpeza Express SP';
    }
  };

  return (
    <header className="top-header">
      {/* Mobile Brand */}
      <div className="header-brand-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flexShrink: 1 }}>
        <img src="/logo.jpg" alt="Limpeza Express SP" style={{ width: '30px', height: '30px', borderRadius: '6px', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '0.92rem', fontWeight: '700', lineHeight: '1.2', margin: 0, whiteSpace: 'nowrap' }}>Limpeza Express</h2>
          <span style={{ fontSize: '0.65rem', color: 'var(--primary-400)', fontWeight: '600', display: 'block' }}>São Paulo • SP</span>
        </div>
      </div>

      {/* Desktop Title */}
      <div className="header-title-desktop">
        <h1 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Actions */}
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
        {/* Status da Nuvem Firebase em Tempo Real */}
        <button
          onClick={forcarSincronizacaoNuvem}
          title={
            cloudStatus === 'sincronizado' 
              ? 'Nuvem Conectada e Sincronizada em Tempo Real (Clique para sincronizar)' 
              : cloudStatus === 'conectando'
              ? 'Conectando ao banco de dados na nuvem...'
              : 'Modo Offline / Local ativo (Clique para tentar conectar à Nuvem)'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: cloudStatus === 'sincronizado' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
            border: cloudStatus === 'sincronizado' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
            padding: '0.3rem 0.5rem',
            borderRadius: '100px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            color: cloudStatus === 'sincronizado' ? 'var(--primary-400)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          {cloudStatus === 'sincronizado' ? (
            <>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: '#10b981', 
                display: 'inline-block',
                boxShadow: '0 0 6px #10b981'
              }} />
              <Cloud size={14} color="#10b981" />
              <span className="hide-on-mobile" style={{ fontWeight: '600', color: '#10b981' }}>Nuvem</span>
            </>
          ) : cloudStatus === 'conectando' ? (
            <>
              <RefreshCw size={12} className="spin" color="#f59e0b" />
              <span className="hide-on-mobile" style={{ color: '#f59e0b' }}>Conectando</span>
            </>
          ) : (
            <>
              <CloudOff size={14} color="var(--text-muted)" />
              <span className="hide-on-mobile">Local</span>
            </>
          )}
        </button>

        {/* Identificação da Usuária Logada (Desktop) */}
        <div className="hide-on-mobile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'var(--bg-input)',
          padding: '0.35rem 0.75rem',
          borderRadius: '100px',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-400)', display: 'inline-block' }} />
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{currentUser?.name || 'Administradora'}</span>
        </div>

        {/* Botão de Agendamento Harmonizado e com Explicação Clara */}
        <button 
          onClick={onOpenNovoAgendamento}
          className="header-btn-agendar"
          title="Novo Agendamento de Faxina"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.35rem 0.65rem',
            borderRadius: '100px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            flexShrink: 0
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>+ Agendar</span>
        </button>

        {/* Alternador de Tema */}
        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary btn-icon"
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
        </button>

        {/* Botão Sair (Visível no Desktop, no mobile fica no rodapé) */}
        <button 
          onClick={() => {
            if (confirm('Deseja sair e bloquear o aplicativo agora?')) {
              logout();
            }
          }}
          className="btn btn-danger btn-sm hide-on-mobile"
          title="Sair do Aplicativo"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            fontWeight: '700',
            padding: '0.35rem 0.65rem',
            fontSize: '0.8rem',
            flexShrink: 0
          }}
        >
          <LogOut size={15} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};

