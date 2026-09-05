import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck, 
  Calculator, 
  DollarSign 
} from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useApp();

  const items = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'orcamento', label: 'Orçar', icon: Calculator },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ajudantes', label: 'Ajudantes', icon: UserCheck },
    { id: 'financeiro', label: 'Caixa', icon: DollarSign },
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
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
