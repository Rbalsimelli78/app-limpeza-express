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
  Edit2,
  List,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { getWhatsAppUrl, buildLembreteClienteText, buildEscalaAjudanteText } from '../utils/whatsapp';
import { CalendarView } from '../components/CalendarView';
import { ModalDiaAgenda } from '../components/ModalDiaAgenda';
import { ModalViradaMes } from '../components/ModalViradaMes';

export const AgendaView = ({ onNovoAgendamento, onEditarAgendamento }) => {
  const { 
    agendamentos, 
    clientes, 
    ajudantes, 
    planos, 
    deleteAgendamento, 
    setStatusServico,
    setStatusPagamentoCliente,
    setStatusPagamentoAjudante,
    showToast 
  } = useApp();

  const [modoVisualizacao, setModoVisualizacao] = useState('calendario'); // 'calendario' | 'lista'
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  // Estado para o Modal de Detalhes do Dia
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [modalDiaOpen, setModalDiaOpen] = useState(false);
  const [modalViradaMesOpen, setModalViradaMesOpen] = useState(false);

  // Filtragem dos agendamentos
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const cliente = clientes.find(c => c.id === ag.clienteId);
    const termo = busca.toLowerCase();
    const matchBusca = 
      cliente?.nome?.toLowerCase().includes(termo) ||
      cliente?.condominio?.toLowerCase().includes(termo) ||
      cliente?.torre?.toLowerCase().includes(termo) ||
      cliente?.bairro?.toLowerCase().includes(termo) ||
      cliente?.endereco?.toLowerCase().includes(termo);

    if (!matchBusca) return false;

    if (filtroStatus === 'todos') return true;
    return ag.statusServico === filtroStatus;
  }).sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio));

  // Ao clicar em um dia no calendário
  const handleSelectDay = (dataStr) => {
    setDiaSelecionado(dataStr);
    setModalDiaOpen(true);
  };

  // Agendamentos específicos do dia selecionado
  const agendamentosDoDiaSelecionado = diaSelecionado
    ? agendamentos.filter(ag => ag.dataHoraInicio && ag.dataHoraInicio.slice(0, 10) === diaSelecionado)
    : [];

  return (
    <div className="page-wrapper">
      {/* Topo com Título, Alternância de Visualização e Botão de Ação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={24} color="var(--primary-400)" />
            <span>Agenda Operacional</span>
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Controle de escalas com calendário interativo e clientes por dia
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Alternador de Modo: Calendário vs Lista */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-input)', 
            padding: '3px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)' 
          }}>
            <button
              type="button"
              onClick={() => setModoVisualizacao('calendario')}
              className={`btn btn-sm ${modoVisualizacao === 'calendario' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.8rem', 
                border: 'none', 
                borderRadius: 'calc(var(--radius-md) - 3px)',
                gap: '0.35rem' 
              }}
            >
              <CalendarIcon size={14} />
              <span>Calendário</span>
            </button>

            <button
              type="button"
              onClick={() => setModoVisualizacao('lista')}
              className={`btn btn-sm ${modoVisualizacao === 'lista' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.8rem', 
                border: 'none', 
                borderRadius: 'calc(var(--radius-md) - 3px)',
                gap: '0.35rem' 
              }}
            >
              <List size={14} />
              <span>Lista ({agendamentosFiltrados.length})</span>
            </button>
          </div>

          <button 
            onClick={() => setModalViradaMesOpen(true)} 
            className="btn btn-secondary btn-sm" 
            style={{ 
              gap: '0.4rem', 
              background: 'rgba(59, 130, 246, 0.12)', 
              borderColor: 'rgba(59, 130, 246, 0.4)',
              color: '#93c5fd'
            }}
            title="Programar em 1 clique todos os clientes confirmados (semanais, quinzenais e mensais) para o próximo mês"
          >
            <RefreshCw size={15} color="#60a5fa" />
            <span>🔄 Virar Mês (Clientes Confirmados)</span>
          </button>

          <button onClick={() => onNovoAgendamento()} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
            <Plus size={16} />
            <span>Nova Faxina</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca (Visível tanto no Calendário quanto na Lista) */}
      <div className="glass-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por cliente, condomínio ou bairro..."
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select 
              className="form-select"
              style={{ height: '38px', fontSize: '0.85rem' }}
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

      {/* MODO 1: CALENDÁRIO INTERATIVO MENSAL COM DIAS E QUANTIDADE DE CLIENTES */}
      {modoVisualizacao === 'calendario' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <CalendarView 
            agendamentos={agendamentosFiltrados}
            clientes={clientes}
            planos={planos}
            onSelectDay={handleSelectDay}
          />
        </div>
      )}

      {/* MODO 2: LISTA DE FAXINAS DA AGENDA */}
      {modoVisualizacao === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {agendamentosFiltrados.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <CalendarIcon size={44} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Nenhum agendamento encontrado</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
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
              const isPago = ag.statusClientePagamento === 'pago';

              return (
                <div key={ag.id} className="glass-card" style={{ padding: '1.25rem', borderLeft: `4px solid ${isPago ? 'var(--primary-500)' : 'var(--accent-gold)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-info">{plano?.nome || 'Plano de Limpeza'}</span>
                        {cliente?.tipoCliente === 'PJ' && (
                          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Building size={11} />
                            <span>PJ</span>
                          </span>
                        )}
                        {cliente?.emiteNF && (
                          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.45)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} title={`Emitir Nota Fiscal: CNPJ ${cliente?.cnpj || 'Ver cadastro'}`}>
                            <FileText size={11} />
                            <span>Emitir NF</span>
                          </span>
                        )}
                        <span className={`badge ${
                          ag.statusServico === 'concluido' ? 'badge-success' : 
                          ag.statusServico === 'confirmado' ? 'badge-info' : 
                          ag.statusServico === 'cancelado' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {ag.statusServico}
                        </span>
                        {ag.dormitorios > 2 && (
                          <span className="badge badge-warning">
                            {cliente?.tipoCliente === 'PJ' ? `${ag.dormitorios} Salas (+R$30)` : `${ag.dormitorios} Dorms (+R$30)`}
                          </span>
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
                        <span>
                          {cliente?.condominio ? `${cliente.condominio} ` : ''}
                          {cliente?.torre ? `• ${cliente.torre} ` : ''}
                          {cliente?.apartamento ? `(${cliente.apartamento}) • ` : ''}
                          {cliente?.endereco ? `${cliente.endereco} - ` : ''}
                          {cliente?.bairro}
                        </span>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary-400)', fontFamily: 'var(--font-display)' }}>
                        {formatCurrency(ag.valorCliente)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Pagamento: <strong style={{ color: isPago ? 'var(--primary-500)' : 'var(--accent-gold)' }}>{ag.statusClientePagamento?.toUpperCase()}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Bloco de Horário e Ajudantes */}
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

                      <button 
                        type="button"
                        onClick={() => downloadIcsFile(ag, cliente, plano, nomesAjudantes)} 
                        className="btn btn-secondary btn-sm"
                        title="Baixar arquivo .ICS"
                      >
                        <Download size={14} />
                        <span>Baixar .ICS</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => onEditarAgendamento(ag)} 
                        className="btn btn-secondary btn-sm"
                        title="Editar Agendamento"
                      >
                        <Edit2 size={14} />
                        <span>Editar</span>
                      </button>

                      <button 
                        type="button"
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
      )}

      {/* MODAL DE DETALHES DO DIA SELECIONADO NO CALENDÁRIO */}
      <ModalDiaAgenda 
        isOpen={modalDiaOpen}
        onClose={() => setModalDiaOpen(false)}
        dataStr={diaSelecionado}
        agendamentosDoDia={agendamentosDoDiaSelecionado}
        clientes={clientes}
        ajudantes={ajudantes}
        planos={planos}
        onNovoAgendamento={onNovoAgendamento}
        onEditarAgendamento={onEditarAgendamento}
        deleteAgendamento={deleteAgendamento}
        setStatusServico={setStatusServico}
        setStatusPagamentoCliente={setStatusPagamentoCliente}
        setStatusPagamentoAjudante={setStatusPagamentoAjudante}
        showToast={showToast}
      />

      {/* MODAL DE VIRADA DE MÊS AUTOMÁTICA */}
      <ModalViradaMes 
        isOpen={modalViradaMesOpen}
        onClose={() => setModalViradaMesOpen(false)}
      />
    </div>
  );
};
