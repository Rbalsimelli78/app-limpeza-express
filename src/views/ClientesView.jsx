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
  Sparkles,
  TrendingUp,
  Building,
  Filter
} from 'lucide-react';
import { formatPhone, formatCurrency } from '../utils/formatters';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { ModalExtratoCliente } from '../components/ModalExtratoCliente';

export const ClientesView = ({ onNovoCliente, onEditarCliente, onAgendarParaCliente }) => {
  const { clientes, agendamentos, planos, deleteCliente } = useApp();
  const [busca, setBusca] = useState('');
  const [filtroCondominio, setFiltroCondominio] = useState('todos');
  const [clienteExtrato, setClienteExtrato] = useState(null);

  // Lista de condomínios únicos cadastrados para filtro rápido
  const condominiosUnicos = Array.from(
    new Set(clientes.map(c => c.condominio?.trim()).filter(Boolean))
  ).sort();

  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    const matchBusca = (
      c.nome?.toLowerCase().includes(termo) ||
      c.condominio?.toLowerCase().includes(termo) ||
      c.torre?.toLowerCase().includes(termo) ||
      c.bairro?.toLowerCase().includes(termo) ||
      c.endereco?.toLowerCase().includes(termo) ||
      c.apartamento?.toLowerCase().includes(termo) ||
      c.telefone?.includes(termo)
    );

    if (!matchBusca) return false;

    if (filtroCondominio !== 'todos') {
      return c.condominio?.trim().toLowerCase() === filtroCondominio.toLowerCase();
    }

    return true;
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
            Controle de clientes, condomínios, torres, endereços e histórico de faxinas em São Paulo
          </p>
        </div>

        <button onClick={onNovoCliente} className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por nome, condomínio (Bragantino...), torre, bairro ou WhatsApp..."
            style={{ paddingLeft: '36px' }}
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Filtro Rápido por Condomínio */}
        {condominiosUnicos.length > 0 && (
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.85rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.25rem' }}>
              <Building size={13} color="var(--primary-400)" />
              <span>Condomínios:</span>
            </span>

            <button
              type="button"
              onClick={() => setFiltroCondominio('todos')}
              className={`badge ${filtroCondominio === 'todos' ? 'badge-info' : 'badge-neutral'}`}
              style={{ cursor: 'pointer', border: 'none', padding: '0.3rem 0.65rem' }}
            >
              Todos ({clientes.length})
            </button>

            {condominiosUnicos.map(condo => {
              const qtd = clientes.filter(c => c.condominio?.trim().toLowerCase() === condo.toLowerCase()).length;
              const isAtivo = filtroCondominio.toLowerCase() === condo.toLowerCase();

              return (
                <button
                  key={condo}
                  type="button"
                  onClick={() => setFiltroCondominio(isAtivo ? 'todos' : condo)}
                  className={`badge ${isAtivo ? 'badge-success' : 'badge-neutral'}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Building size={11} />
                  <span>{condo} ({qtd})</span>
                </button>
              );
            })}
          </div>
        )}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {/* Destaque para Condomínio e Torre */}
                  {(c.condominio || c.torre) && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      background: 'rgba(16, 185, 129, 0.08)', 
                      padding: '0.45rem 0.65rem', 
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--primary-400)', fontWeight: '600' }}>
                        <Building size={15} color="var(--primary-400)" />
                        <span>{c.condominio || 'Condomínio'}</span>
                      </div>
                      {c.torre && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          background: 'var(--bg-input)', 
                          color: 'var(--text-primary)',
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)'
                        }}>
                          {c.torre}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={15} color="var(--primary-400)" />
                    <span>
                      {c.apartamento ? `${c.apartamento} • ` : ''}
                      {c.endereco ? `${c.endereco} - ` : ''}
                      {c.bairro}
                    </span>
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

                {/* Botão de Extrato Financeiro & Gráfico */}
                <button
                  type="button"
                  onClick={() => setClienteExtrato(c)}
                  className="btn btn-secondary btn-sm"
                  style={{ 
                    width: '100%', 
                    marginBottom: '0.625rem', 
                    gap: '0.4rem', 
                    justifyContent: 'center',
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    color: 'var(--primary-400)',
                    fontWeight: '600'
                  }}
                  title="Ver extrato financeiro completo e gráfico de pagamentos"
                >
                  <TrendingUp size={15} />
                  <span>Ver Extrato & Gráfico</span>
                </button>

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

      {/* Modal de Extrato do Cliente */}
      <ModalExtratoCliente 
        isOpen={!!clienteExtrato} 
        onClose={() => setClienteExtrato(null)} 
        cliente={clienteExtrato} 
      />
    </div>
  );
};
