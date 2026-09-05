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
  Sparkles,
  Layers,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, currentUser, logout } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda & Google Cal', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ajudantes', label: 'Ajudantes & Diárias', icon: UserCheck },
    { id: 'planos', label: 'Planos & Catálogo', icon: Layers },
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
        padding: '0.875rem', 
        background: 'var(--bg-input)', 
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}>
              {(currentUser?.name || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {currentUser?.name || 'Administradora'}
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                @{currentUser?.username || 'admin'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Deseja sair e bloquear o sistema?')) {
                logout();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-rose)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Sair e Bloquear"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ShieldCheck size={12} />
          <span>Acesso Administrativo Seguro</span>
        </div>
      </div>
    </aside>
  );
};
