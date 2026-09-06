import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck, 
  Calculator, 
  DollarSign,
  Layers,
  Settings,
  LogOut
} from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab, logout } = useApp();

  const items = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ajudantes', label: 'Equipe', icon: UserCheck },
    { id: 'planos', label: 'Planos', icon: Layers },
    { id: 'orcamento', label: 'Orçar', icon: Calculator },
    { id: 'financeiro', label: 'Caixa', icon: DollarSign },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={() => {
          if (confirm('Deseja sair e bloquear o aplicativo agora?')) {
            logout();
          }
        }}
        className="bottom-nav-item"
        style={{ color: '#fb7185' }}
        title="Sair do Aplicativo"
      >
        <LogOut size={18} color="#fb7185" />
        <span style={{ fontWeight: '700', color: '#fb7185' }}>Sair</span>
      </button>
    </nav>
  );
};
