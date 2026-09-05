import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Home, 
  Edit2, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { formatPhone, formatCurrency } from '../utils/formatters';
import { getWhatsAppUrl } from '../utils/whatsapp';

export const ClientesView = ({ onNovoCliente, onEditarCliente, onAgendarParaCliente }) => {
  const { clientes, agendamentos, planos, deleteCliente } = useApp();
  const [busca, setBusca] = useState('');

  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(termo) ||
      c.bairro?.toLowerCase().includes(termo) ||
      c.endereco?.toLowerCase().includes(termo) ||
      c.apartamento?.toLowerCase().includes(termo) ||
      c.telefone?.includes(termo)
    );
  });

  return (
    <div className="page-wrapper">
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Users size={24} color="var(--primary-400)" />
            <span>Cadastro de Clientes</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Controle de endereços, preferências e histórico de faxinas em São Paulo
          </p>
        </div>

        <button onClick={onNovoCliente} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Busca */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por nome, bairro (Jardins, Moema...), endereço ou WhatsApp..."
            style={{ paddingLeft: '36px' }}
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Cards de Clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {clientesFiltrados.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum cliente encontrado.</p>
            <button onClick={onNovoCliente} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              Cadastrar Primeiro Cliente
            </button>
          </div>
        ) : (
          clientesFiltrados.map(c => {
            const planoPadrao = planos.find(p => p.id === c.planoPadraoId);
            const faxinasDoCliente = agendamentos.filter(a => a.clienteId === c.id);
            const totalGasto = faxinasDoCliente.reduce((acc, curr) => acc + Number(curr.valorCliente || 0), 0);
            const waUrl = getWhatsAppUrl(c.telefone, `Olá ${c.nome}! Como você está? Aqui é da Limpeza Express SP ✨`);

            return (
              <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '0.25rem' }}>
                      {planoPadrao?.nome || 'Plano Quinzenal'}
                    </span>
                    <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      {c.nome}
                    </h4>
                  </div>
                  <span className="badge badge-neutral">
                    {c.dormitorios || 2} Dorms • {c.metragem || '80-100m²'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={15} color="var(--primary-400)" />
                    <span>{c.endereco}, {c.apartamento} - {c.bairro}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={15} color="var(--accent-cyan)" />
                    <span>{formatPhone(c.telefone)}</span>
                  </div>

                  {c.observacoes && (
                    <div style={{ 
                      background: 'var(--bg-input)', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.775rem', 
                      color: 'var(--text-muted)',
                      marginTop: '0.25rem'
                    }}>
                      Obs: {c.observacoes}
                    </div>
                  )}
                </div>

                {/* Estatísticas Rápidas do Cliente */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(16, 185, 129, 0.05)', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  marginBottom: '1rem',
                  fontSize: '0.8rem'
                }}>
                  <span>Faxinas Realizadas: <strong>{faxinasDoCliente.length}</strong></span>
                  <span style={{ color: 'var(--primary-400)', fontWeight: '600' }}>
                    Total: {formatCurrency(totalGasto)}
                  </span>
                </div>

                {/* Botões de Ação */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <a 
                      href={waUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-whatsapp btn-sm"
                      title="Abrir WhatsApp direto"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </a>

                    <button 
                      onClick={() => onAgendarParaCliente(c)}
                      className="btn btn-primary btn-sm"
                      title="Agendar faxina para este cliente"
                    >
                      <Calendar size={14} />
                      <span>Agendar</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      onClick={() => onEditarCliente(c)} 
                      className="btn btn-secondary btn-icon btn-sm"
                      title="Editar dados"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Excluir o cliente ${c.nome}?`)) {
                          deleteCliente(c.id);
                        }
                      }} 
                      className="btn btn-danger btn-icon btn-sm"
                      title="Excluir cliente"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
