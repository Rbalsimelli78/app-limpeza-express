import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck, 
  Calculator, 
  DollarSign, 
  Settings,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda & Google Cal', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ajudantes', label: 'Ajudantes & Diárias', icon: UserCheck },
    { id: 'orcamento', label: 'Calculadora WhatsApp', icon: Calculator },
    { id: 'financeiro', label: 'Financeiro & Lucro', icon: DollarSign },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.jpg" alt="Limpeza Express SP" className="sidebar-logo" />
        <div className="sidebar-brand">
          <h1>Limpeza Express</h1>
          <span>São Paulo • SP</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ 
        padding: '1rem', 
        background: 'rgba(16, 185, 129, 0.08)', 
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 'var(--radius-md)',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Sparkles size={16} color="var(--primary-400)" />
          <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Limpeza Express</strong>
        </div>
        <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
          Aptos de 80 a 100m² com 2 profissionais em SP.
        </p>
      </div>
    </aside>
  );
};
