import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Plus, Sparkles } from 'lucide-react';

export const Header = ({ onOpenNovoAgendamento }) => {
  const { theme, toggleTheme, activeTab } = useApp();

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
      </div>
    </header>
  );
};
