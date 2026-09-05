import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  Filter, 
  Download, 
  ExternalLink,
  MessageCircle,
  Trash2,
  Edit2
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { getWhatsAppUrl, buildLembreteClienteText, buildEscalaAjudanteText } from '../utils/whatsapp';

export const AgendaView = ({ onNovoAgendamento, onEditarAgendamento }) => {
  const { 
    agendamentos, 
    clientes, 
    ajudantes, 
    planos, 
    deleteAgendamento, 
    setStatusServico,
    showToast 
  } = useApp();

  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const agendamentosFiltrados = agendamentos.filter(ag => {
    const cliente = clientes.find(c => c.id === ag.clienteId);
    const termo = busca.toLowerCase();
    const matchBusca = 
      cliente?.nome?.toLowerCase().includes(termo) ||
      cliente?.bairro?.toLowerCase().includes(termo) ||
      cliente?.endereco?.toLowerCase().includes(termo);

    if (!matchBusca) return false;

    if (filtroStatus === 'todos') return true;
    return ag.statusServico === filtroStatus;
  }).sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio));

  return (
    <div className="page-wrapper">
      {/* Topo com Título e Ação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <CalendarIcon size={24} color="var(--primary-400)" />
            <span>Agenda Operacional</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Controle de escalas com sincronização direta no Google Agenda
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={onNovoAgendamento} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Nova Faxina</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por cliente, condomínio ou bairro..."
              style={{ paddingLeft: '36px' }}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select 
              className="form-select"
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="confirmado">Confirmados</option>
              <option value="agendado">Agendados</option>
              <option value="concluido">Concluídos</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Faxinas da Agenda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {agendamentosFiltrados.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <CalendarIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nenhum agendamento encontrado</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Tente alterar os filtros de busca ou cadastre uma nova faxina.
            </p>
          </div>
        ) : (
          agendamentosFiltrados.map(ag => {
            const cliente = clientes.find(c => c.id === ag.clienteId);
            const plano = planos.find(p => p.id === ag.planoId);
            const nomesAjudantes = (ag.ajudantesEscaladas || []).map(ae => {
              const a = ajudantes.find(aj => aj.id === ae.ajudanteId);
              return a ? a.nome : 'Ajudante';
            });

            const googleUrl = generateGoogleCalendarUrl(ag, cliente, plano, nomesAjudantes);

            return (
              <div key={ag.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <span className="badge badge-info">{plano?.nome}</span>
                      <span className={`badge ${
                        ag.statusServico === 'concluido' ? 'badge-success' : 
                        ag.statusServico === 'confirmado' ? 'badge-info' : 
                        ag.statusServico === 'cancelado' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {ag.statusServico}
                      </span>
                      {ag.dormitorios > 2 && (
                        <span className="badge badge-warning">{ag.dormitorios} Dorms (+R$30)</span>
                      )}
                      {ag.semManutencao2Meses && (
                        <span className="badge badge-danger">Sem manutenção (+R$50)</span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {cliente?.nome || 'Cliente não encontrado'}
                    </h4>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <MapPin size={15} color="var(--primary-400)" />
                      <span>{cliente?.endereco}, {cliente?.apartamento} - {cliente?.bairro}</span>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary-400)', fontFamily: 'var(--font-display)' }}>
                      {formatCurrency(ag.valorCliente)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Pagamento: <strong>{ag.statusClientePagamento?.toUpperCase()}</strong>
                    </span>
                  </div>
                </div>

                {/* Bloco de Informações de Horário e Ajudantes */}
                <div style={{ 
                  background: 'var(--bg-input)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  margin: '1rem 0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Data e Horário</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={15} color="var(--accent-cyan)" />
                      {formatDate(ag.dataHoraInicio)} das {formatTime(ag.dataHoraInicio)} às {formatTime(ag.dataHoraFim)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Equipe Escalada ({ag.ajudantesEscaladas?.length || 0} profissionais)
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {nomesAjudantes.length > 0 ? nomesAjudantes.join(' e ') : 'Nenhuma ajudante escalada'}
                    </span>
                  </div>
                </div>

                {ag.observacoes && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                    Obs: {ag.observacoes}
                  </div>
                )}

                {/* Botões de Ação */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Google Calendar Link Direto */}
                    <a 
                      href={googleUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-google btn-sm"
                      title="Adicionar ao Google Agenda"
                    >
                      <CalendarIcon size={14} />
                      <span>Google Agenda</span>
                    </a>

                    {/* Download do .ics */}
                    <button 
                      onClick={() => downloadIcsFile(ag, cliente, plano, nomesAjudantes)} 
                      className="btn btn-secondary btn-sm"
                      title="Baixar arquivo .ICS para qualquer aplicativo de calendário"
                    >
                      <Download size={14} />
                      <span>Baixar .ICS</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => onEditarAgendamento(ag)} 
                      className="btn btn-secondary btn-sm"
                      title="Editar Agendamento"
                    >
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </button>

                    <button 
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir a faxina de ${cliente?.nome}?`)) {
                          deleteAgendamento(ag.id);
                        }
                      }} 
                      className="btn btn-danger btn-sm"
                      title="Excluir Agendamento"
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
