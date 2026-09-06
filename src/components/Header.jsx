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
      <div className="header-brand-mobile">
        <img src="/logo.jpg" alt="Limpeza Express SP" />
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.2' }}>Limpeza Express</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--primary-400)', fontWeight: '600' }}>São Paulo • SP</span>
        </div>
      </div>

      {/* Desktop Title */}
      <div className="header-title-desktop">
        <h1 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Actions */}
      <div className="header-actions">
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
            gap: '0.4rem',
            background: cloudStatus === 'sincronizado' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
            border: cloudStatus === 'sincronizado' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
            padding: '0.35rem 0.65rem',
            borderRadius: '100px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            color: cloudStatus === 'sincronizado' ? 'var(--primary-400)' : 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
          {cloudStatus === 'sincronizado' ? (
            <>
              <span style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                background: '#10b981', 
                display: 'inline-block',
                boxShadow: '0 0 6px #10b981'
              }} />
              <Cloud size={14} color="#10b981" />
              <span className="hide-on-mobile-extra" style={{ fontWeight: '600', color: '#10b981' }}>Nuvem Ativa</span>
            </>
          ) : cloudStatus === 'conectando' ? (
            <>
              <RefreshCw size={13} className="spin" color="#f59e0b" />
              <span className="hide-on-mobile-extra" style={{ color: '#f59e0b' }}>Conectando...</span>
            </>
          ) : (
            <>
              <CloudOff size={14} color="var(--text-muted)" />
              <span className="hide-on-mobile-extra">Local</span>
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

        <button 
          onClick={onOpenNovoAgendamento}
          className="btn btn-primary btn-sm"
          title="Novo Agendamento de Faxina"
        >
          <Plus size={18} />
          <span className="hide-on-mobile-extra">Nova Faxina</span>
        </button>

        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary btn-icon"
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        <button 
          onClick={() => {
            if (confirm('Deseja sair e bloquear o aplicativo agora?')) {
              logout();
            }
          }}
          className="btn btn-danger btn-sm"
          title="Sair do Aplicativo"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            fontWeight: '700',
            padding: '0.35rem 0.65rem',
            fontSize: '0.8rem'
          }}
        >
          <LogOut size={15} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};

