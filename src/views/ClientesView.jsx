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
  Filter,
  UserCheck,
  UserX,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { formatPhone, formatCurrency, formatDate } from '../utils/formatters';
import { getWhatsAppUrl } from '../utils/whatsapp';
import { ModalExtratoCliente } from '../components/ModalExtratoCliente';
import { MapaLimpezasClientes } from '../components/MapaLimpezasClientes';

export const ClientesView = ({ onNovoCliente, onEditarCliente, onAgendarParaCliente }) => {
  const { clientes, agendamentos, planos, deleteCliente, updateCliente, setStatusPagamentoCliente } = useApp();
  const [abaVisao, setAbaVisao] = useState('cartoes'); // 'cartoes' | 'mapa_limpezas'
  const [expandidosCliente, setExpandidosCliente] = useState({});
  const [busca, setBusca] = useState('');
  const [filtroCondominio, setFiltroCondominio] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'ativo', 'inativo', 'pj'
  const [clienteExtrato, setClienteExtrato] = useState(null);

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  // Contagem de clientes ativos sem agendamento no mês corrente para badge
  const qtdSemAgendamentoMesAtual = clientes.filter(c => {
    if (c.status === 'inativo') return false;
    const agsNoMes = agendamentos.filter(ag => {
      if (ag.clienteId !== c.id || !ag.dataHoraInicio) return false;
      const d = new Date(ag.dataHoraInicio);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    return agsNoMes.length === 0;
  }).length;

  // Contagens para os botões de status
  const qtdAtivos = clientes.filter(c => c.status !== 'inativo').length;
  const qtdInativos = clientes.filter(c => c.status === 'inativo').length;
  const qtdPJ = clientes.filter(c => c.tipoCliente === 'PJ' || c.emiteNF || c.cnpj).length;

  // Lista de condomínios únicos cadastrados para filtro rápido
  const condominiosUnicos = Array.from(
    new Set(clientes.map(c => c.condominio?.trim()).filter(Boolean))
  ).sort();

  const clientesFiltrados = clientes.filter(c => {
    // 1. Filtro de Status
    if (filtroStatus === 'ativo' && c.status === 'inativo') return false;
    if (filtroStatus === 'inativo' && c.status !== 'inativo') return false;
    if (filtroStatus === 'pj' && !(c.tipoCliente === 'PJ' || c.emiteNF || c.cnpj)) return false;

    // 2. Filtro de Busca em Texto
    const termo = busca.toLowerCase();
    const matchBusca = (
      c.nome?.toLowerCase().includes(termo) ||
      c.razaoSocial?.toLowerCase().includes(termo) ||
      c.cnpj?.toLowerCase().includes(termo) ||
      c.emailFaturamento?.toLowerCase().includes(termo) ||
      c.condominio?.toLowerCase().includes(termo) ||
      c.torre?.toLowerCase().includes(termo) ||
      c.bairro?.toLowerCase().includes(termo) ||
      c.endereco?.toLowerCase().includes(termo) ||
      c.apartamento?.toLowerCase().includes(termo) ||
      c.telefone?.includes(termo)
    );

    if (!matchBusca) return false;

    // 3. Filtro de Condomínio
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

      {/* Seletor de Visão: Cartões vs Mapa de Limpezas & Ativação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setAbaVisao('cartoes')}
            className={`btn btn-sm ${abaVisao === 'cartoes' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', gap: '0.45rem' }}
          >
            <Users size={15} />
            <span>Cartões de Clientes ({clientes.length})</span>
          </button>
          
          <button
            type="button"
            onClick={() => setAbaVisao('mapa_limpezas')}
            className={`btn btn-sm ${abaVisao === 'mapa_limpezas' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', gap: '0.45rem', position: 'relative' }}
          >
            <Calendar size={15} />
            <span>Mapa de Limpezas & Ativação</span>
            {qtdSemAgendamentoMesAtual > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#1e1b4b',
                fontWeight: '800',
                fontSize: '0.7rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                marginLeft: '0.25rem'
              }}>
                {qtdSemAgendamentoMesAtual} sem faxina
              </span>
            )}
          </button>
        </div>
      </div>

      {abaVisao === 'mapa_limpezas' ? (
        <MapaLimpezasClientes
          clientes={clientes}
          agendamentos={agendamentos}
          planos={planos}
          onAgendarParaCliente={onAgendarParaCliente}
          onVerExtratoCliente={(cli) => setClienteExtrato(cli)}
        />
      ) : (
        <>
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

        {/* Filtro por Status (Ativos / Inativos) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.25rem' }}>
            <UserCheck size={13} color="var(--primary-400)" />
            <span>Situação:</span>
          </span>

          <button
            type="button"
            onClick={() => setFiltroStatus('todos')}
            className={`badge ${filtroStatus === 'todos' ? 'badge-info' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            Todos ({clientes.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('ativo')}
            className={`badge ${filtroStatus === 'ativo' ? 'badge-success' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <CheckCircle2 size={12} />
            <span>Ativos ({qtdAtivos})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('inativo')}
            className={`badge ${filtroStatus === 'inativo' ? 'badge-danger' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <UserX size={12} />
            <span>Inativos / Pausados ({qtdInativos})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroStatus('pj')}
            className={`badge ${filtroStatus === 'pj' ? 'badge-purple' : 'badge-neutral'}`}
            style={{ 
              cursor: 'pointer', 
              border: 'none', 
              padding: '0.35rem 0.75rem', 
              fontSize: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem',
              background: filtroStatus === 'pj' ? 'rgba(168, 85, 247, 0.25)' : undefined,
              color: filtroStatus === 'pj' ? '#e9d5ff' : undefined
            }}
          >
            <Building size={12} />
            <span>Escritórios / PJ ({qtdPJ})</span>
          </button>
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
            const faxinasDoCliente = agendamentos
              .filter(a => a.clienteId === c.id)
              .sort((a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio));
            const totalGasto = faxinasDoCliente.reduce((acc, curr) => acc + Number(curr.valorCliente || 0), 0);
            const waUrl = getWhatsAppUrl(c.telefone, `Olá ${c.nome}! Como você está? Aqui é da Limpeza Express SP ✨`);

            return (
              <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${c.status === 'inativo' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                        {c.status === 'inativo' ? 'Inativo' : 'Ativo'}
                      </span>
                      {c.tipoCliente === 'PJ' && (
                        <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building size={11} />
                          <span>Escritório PJ</span>
                        </span>
                      )}
                      {c.emiteNF && (
                        <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText size={11} />
                          <span>Emite NF</span>
                        </span>
                      )}
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {planoPadrao?.nome || 'Plano Quinzenal'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.15rem', color: c.status === 'inativo' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {c.nome}
                    </h4>
                  </div>
                  <span className="badge badge-neutral">
                    {c.tipoCliente === 'PJ' ? `${c.dormitorios || 2} Salas • ${c.metragem || 'Comercial'}` : `${c.dormitorios || 2} Dorms • ${c.metragem || '80-100m²'}`}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {/* Bloco de Dados PJ e Nota Fiscal */}
                  {(c.cnpj || c.razaoSocial || c.emiteNF) && (
                    <div style={{ 
                      background: 'rgba(168, 85, 247, 0.08)', 
                      border: '1px solid rgba(168, 85, 247, 0.25)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '0.5rem 0.75rem', 
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FileText size={13} />
                          <span>{c.razaoSocial || 'Dados para Nota Fiscal (NF)'}</span>
                        </span>
                        {c.emiteNF && (
                          <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(168, 85, 247, 0.25)', color: '#f3e8ff' }}>
                            Obrigatório NF
                          </span>
                        )}
                      </div>
                      {c.cnpj && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          <strong>CNPJ:</strong> {c.cnpj} {c.inscricaoEstadual ? `• IE: ${c.inscricaoEstadual}` : ''}
                        </div>
                      )}
                      {c.emailFaturamento && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          <strong>E-mail NF:</strong> {c.emailFaturamento}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Valor Fechado Combinado */}
                  {c.valorFechado !== null && c.valorFechado !== undefined && Number(c.valorFechado) > 0 && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.45rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      color: 'var(--primary-400)',
                      fontWeight: '600'
                    }}>
                      <span>💰 Valor Fechado Combinado:</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                        {formatCurrency(c.valorFechado)}
                      </span>
                    </div>
                  )}

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

                {/* Lista das Últimas Faxinas com Status e Ação de Estorno / Pagar */}
                {faxinasDoCliente.length > 0 && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                        {expandidosCliente[c.id] ? `Todas as Faxinas (${faxinasDoCliente.length}):` : 'Últimos Trabalhos:'}
                      </span>
                      {faxinasDoCliente.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setExpandidosCliente(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-400)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, fontWeight: '600' }}
                        >
                          {expandidosCliente[c.id] ? 'Ver menos' : `Ver todas (${faxinasDoCliente.length})`}
                        </button>
                      )}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.35rem', 
                      maxHeight: expandidosCliente[c.id] ? '220px' : 'none', 
                      overflowY: expandidosCliente[c.id] ? 'auto' : 'visible' 
                    }}>
                      {(expandidosCliente[c.id] ? faxinasDoCliente : faxinasDoCliente.slice(0, 2)).map((ag) => {
                        const isPago = ag.statusClientePagamento === 'pago';
                        return (
                          <div 
                            key={ag.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              fontSize: '0.78rem', 
                              padding: '0.35rem 0.5rem', 
                              background: 'var(--bg-card-hover)', 
                              borderRadius: 'var(--radius-sm)' 
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: '500' }}>{formatDate(ag.dataHoraInicio)}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem', fontSize: '0.72rem' }}>
                                ({new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(ag.valorCliente)}</strong>
                              {isPago ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Deseja estornar o pagamento da faxina de ${c.nome} (${formatCurrency(ag.valorCliente)}) para "Pendente"?`)) {
                                      setStatusPagamentoCliente(ag.id, 'pendente');
                                    }
                                  }}
                                  className="badge badge-success"
                                  style={{ 
                                    fontSize: '0.68rem', 
                                    cursor: 'pointer', 
                                    border: '1px solid #10b981',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399',
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '2px', 
                                    padding: '0.15rem 0.45rem' 
                                  }}
                                  title="Clique para estornar este pagamento e voltar para Pendente"
                                >
                                  <CheckCircle2 size={11} />
                                  <span>Pago</span>
                                  <span style={{ fontSize: '0.6rem', color: '#fca5a5', marginLeft: '2px', textDecoration: 'underline' }}>Estornar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setStatusPagamentoCliente(ag.id, 'pago')}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem' }}
                                  title="Marcar faxina como paga pelo cliente"
                                >
                                  Pagar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      onClick={() => updateCliente(c.id, { status: c.status === 'inativo' ? 'ativo' : 'inativo' })}
                      className="btn btn-secondary btn-icon btn-sm"
                      title={c.status === 'inativo' ? 'Reativar Cliente' : 'Pausar / Inativar Cliente'}
                      style={{ color: c.status === 'inativo' ? '#10b981' : '#f43f5e' }}
                    >
                      {c.status === 'inativo' ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
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
        </>
      )}

      {/* Modal de Extrato do Cliente */}
      <ModalExtratoCliente 
        isOpen={!!clienteExtrato} 
        onClose={() => setClienteExtrato(null)} 
        cliente={clienteExtrato} 
      />
    </div>
  );
};
