import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Copy, 
  ExternalLink,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatTime, formatDate } from '../utils/formatters';
import { generateGoogleCalendarUrl } from '../utils/calendar';
import { getWhatsAppUrl, buildLembreteClienteText, buildEscalaAjudanteText } from '../utils/whatsapp';

export const DashboardView = ({ onNovoAgendamento, onEditarAgendamento }) => {
  const { 
    agendamentos, 
    clientes, 
    ajudantes, 
    planos, 
    getFinanceiroGeral, 
    setStatusServico, 
    setStatusPagamentoCliente,
    setStatusPagamentoAjudante,
    setActiveTab,
    limparTodosOsDados,
    showToast 
  } = useApp();

  const financeiro = getFinanceiroGeral();

  // Filtrar próximas faxinas ordenadas por data
  const proximasFaxinas = [...agendamentos].sort((a, b) => 
    new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio)
  );

  const copiarPix = (chave) => {
    navigator.clipboard.writeText(chave);
    showToast(`Chave PIX (${chave}) copiada com sucesso!`);
  };

  return (
    <div className="page-wrapper">
      {/* Banner Informativo quando ainda houver dados de exemplo */}
      {clientes.some(c => c.id === 'cli-1') && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            <span style={{ fontSize: '1.1rem' }}>🧹</span>
            <span>Você está visualizando <strong>dados de demonstração</strong>.</span>
          </div>
          <button 
            onClick={() => {
              if (confirm('Deseja limpar todos os dados de exemplo para sua esposa começar com o sistema 100% zerado?')) {
                limparTodosOsDados();
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-gold)' }}
          >
            Limpar Dados e Começar do Zero
          </button>
        </div>
      )}

      {/* Banner de Boas-Vindas com Visual Premium */}
      <div 
        className="glass-card" 
        style={{ 
          marginBottom: '1.5rem',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'relative',
          height: '180px',
          width: '100%',
          overflow: 'hidden'
        }}>
          <img 
            src="/banner.jpg" 
            alt="Limpeza Express SP" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              filter: 'brightness(0.7)'
            }} 
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, var(--bg-secondary) 10%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-success" style={{ background: '#10b981', color: '#fff' }}>
                <Sparkles size={12} /> São Paulo • SP
              </span>
              <span style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: '500' }}>
                Apartamentos de 80 a 100m²
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              Limpeza Express SP
            </h2>
          </div>
        </div>

        <div style={{ 
          padding: '1rem 1.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Controle diário de agendamentos, clientes e diárias das ajudantes parceiras.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('orcamento')} 
              className="btn btn-secondary btn-sm"
            >
              <MessageCircle size={16} color="#25d366" />
              <span>Orçar via WhatsApp</span>
            </button>
            <button 
              onClick={onNovoAgendamento} 
              className="btn btn-primary btn-sm"
            >
              <span>+ Agendar Faxina</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Financeiros */}
      <div className="grid-kpis">
        {/* KPI 1: Lucro Líquido Realizado */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Lucro Líquido (Caixa)</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <TrendingUp size={20} color="var(--primary-400)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--primary-400)' }}>
            {formatCurrency(financeiro.lucroRealizado)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Projetado: {formatCurrency(financeiro.lucroProjetado)}
          </span>
        </div>

        {/* KPI 2: Total Recebido de Clientes */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Recebido de Clientes</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <DollarSign size={20} color="var(--accent-cyan)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
            {formatCurrency(financeiro.totalRecebido)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            A receber: {formatCurrency(financeiro.totalAReceber)}
          </span>
        </div>

        {/* KPI 3: A Pagar a Ajudantes */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">A Pagar Ajudantes</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <Users size={20} color="var(--accent-gold)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-gold)' }}>
            {formatCurrency(financeiro.totalAPagarAjudantes)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Já pago: {formatCurrency(financeiro.totalPagoAjudantes)}
          </span>
        </div>

        {/* KPI 4: Total de Faxinas Cadastradas */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="kpi-label">Faxinas na Escala</span>
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <Calendar size={20} color="var(--accent-purple)" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>
            {agendamentos.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {clientes.length} clientes ativos
          </span>
        </div>
      </div>

      {/* Lista das Próximas Faxinas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--primary-400)" />
          <span>Próximas Faxinas Agendadas</span>
        </h3>
        <button 
          onClick={() => setActiveTab('agenda')} 
          className="btn btn-secondary btn-sm"
        >
          Ver Todas na Agenda
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {proximasFaxinas.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nenhuma faxina agendada no momento.</p>
            <button onClick={onNovoAgendamento} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              Agendar Primeira Faxina
            </button>
          </div>
        ) : (
          proximasFaxinas.map(ag => {
            const cliente = clientes.find(c => c.id === ag.clienteId);
            const plano = planos.find(p => p.id === ag.planoId);
            const dataObj = new Date(ag.dataHoraInicio);
            const isHoje = dataObj.toDateString() === new Date().toDateString();

            const nomesAjudantes = (ag.ajudantesEscaladas || []).map(ae => {
              const a = ajudantes.find(aj => aj.id === ae.ajudanteId);
              return a ? a.nome : 'Ajudante';
            });

            const googleUrl = generateGoogleCalendarUrl(ag, cliente, plano, nomesAjudantes);
            const lembreteText = buildLembreteClienteText({
              clienteNome: cliente?.nome,
              dataHoraInicio: ag.dataHoraInicio,
              planoNome: plano?.nome,
              valorTotal: ag.valorCliente
            });
            const waClienteUrl = getWhatsAppUrl(cliente?.telefone, lembreteText);

            return (
              <div 
                key={ag.id} 
                className="glass-card" 
                style={{ 
                  borderLeft: isHoje ? '4px solid var(--primary-500)' : '1px solid var(--border-color)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      {isHoje && (
                        <span className="badge badge-success">Hoje!</span>
                      )}
                      <span className="badge badge-info">{plano?.nome || 'Plano'}</span>
                      {ag.dormitorios > 2 && (
                        <span className="badge badge-warning">{ag.dormitorios} Dormitórios (+R$30)</span>
                      )}
                      {ag.semManutencao2Meses && (
                        <span className="badge badge-danger">Sem manutenção (+R$50)</span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {cliente?.nome || 'Cliente'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                      <MapPin size={15} color="var(--primary-400)" />
                      <span>{cliente?.endereco}, {cliente?.apartamento} - {cliente?.bairro}</span>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary-400)', fontFamily: 'var(--font-display)' }}>
                      {formatCurrency(ag.valorCliente)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliente:</span>
                      {ag.statusClientePagamento === 'pago' ? (
                        <span className="badge badge-success" style={{ cursor: 'pointer' }} onClick={() => setStatusPagamentoCliente(ag.id, 'pendente')}>
                          Pago ({ag.formaPagamentoCliente || 'PIX'})
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ cursor: 'pointer' }} onClick={() => setStatusPagamentoCliente(ag.id, 'pago')}>
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linha de Horário e Ajudantes */}
                <div style={{ 
                  background: 'var(--bg-input)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Data e Horário</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Calendar size={15} color="var(--accent-cyan)" />
                      {formatDate(ag.dataHoraInicio)} das {formatTime(ag.dataHoraInicio)} às {formatTime(ag.dataHoraFim)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Equipe Escalada ({ag.ajudantesEscaladas?.length || 0} profissionais)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {(ag.ajudantesEscaladas || []).map(ae => {
                        const aj = ajudantes.find(a => a.id === ae.ajudanteId);
                        if (!aj) return null;

                        const escalaText = buildEscalaAjudanteText({
                          ajudanteNome: aj.nome,
                          clienteNome: cliente?.nome,
                          endereco: cliente?.endereco,
                          apartamento: cliente?.apartamento,
                          bairro: cliente?.bairro,
                          dataHoraInicio: ag.dataHoraInicio,
                          observacoes: ag.observacoes,
                          valorDiaria: ae.valorAPagar
                        });
                        const waAjudanteUrl = getWhatsAppUrl(aj.telefone, escalaText);

                        return (
                          <div key={ae.ajudanteId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                            <span style={{ color: 'var(--text-primary)' }}>
                              • {aj.nome} <strong>({formatCurrency(ae.valorAPagar)})</strong>
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              {ae.statusPagamento === 'pago' ? (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Pago</span>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => copiarPix(aj.chavePix)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                    title={`Copiar PIX: ${aj.chavePix}`}
                                  >
                                    <Copy size={12} /> Copiar PIX
                                  </button>
                                  <button 
                                    onClick={() => setStatusPagamentoAjudante(ag.id, ae.ajudanteId, 'pago')}
                                    className="btn btn-primary btn-sm"
                                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                    title="Marcar diária como paga"
                                  >
                                    Pagar
                                  </button>
                                </>
                              )}
                              <a 
                                href={waAjudanteUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-whatsapp btn-sm"
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                title="Enviar escala no WhatsApp da ajudante"
                              >
                                Escala
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Botão Sincronizar Google Agenda */}
                    <a 
                      href={googleUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-google btn-sm"
                      title="Adiciona este evento diretamente no Google Agenda do seu celular ou PC"
                    >
                      <Calendar size={14} />
                      <span>Google Agenda</span>
                    </a>

                    {/* Botão Lembrete WhatsApp Cliente */}
                    {cliente?.telefone && (
                      <a 
                        href={waClienteUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-whatsapp btn-sm"
                        title="Enviar lembrete para o cliente"
                      >
                        <MessageCircle size={14} />
                        <span>Avisar Cliente</span>
                      </a>
                    )}

                    {/* Maps */}
                    {cliente?.endereco && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cliente.endereco}, ${cliente.bairro}, São Paulo`)}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="Abrir endereço no Google Maps"
                      >
                        <MapPin size={14} />
                        <span>Ver no Maps</span>
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => onEditarAgendamento(ag)} 
                      className="btn btn-secondary btn-sm"
                    >
                      Editar
                    </button>
                    {ag.statusServico !== 'concluido' ? (
                      <button 
                        onClick={() => setStatusServico(ag.id, 'concluido')} 
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} />
                        <span>Concluir Faxina</span>
                      </button>
                    ) : (
                      <span className="badge badge-success">Concluído</span>
                    )}
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
