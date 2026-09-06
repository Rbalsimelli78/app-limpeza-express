import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  DollarSign, 
  MessageCircle, 
  ExternalLink, 
  Download, 
  Edit2, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Copy, 
  Check, 
  CreditCard,
  Navigation,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Building
} from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/formatters';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar';
import { getWhatsAppUrl, buildLembreteClienteText, buildEscalaAjudanteText } from '../utils/whatsapp';

export const ModalDiaAgenda = ({
  isOpen,
  onClose,
  dataStr,
  agendamentosDoDia = [],
  clientes = [],
  ajudantes = [],
  planos = [],
  onNovoAgendamento,
  onEditarAgendamento,
  deleteAgendamento,
  setStatusServico,
  setStatusPagamentoCliente,
  setStatusPagamentoAjudante,
  showToast
}) => {
  const [pixCopiado, setPixCopiado] = useState(null);
  const [expandedAgendamentoId, setExpandedAgendamentoId] = useState(null);

  if (!isOpen || !dataStr) return null;

  // Formatar data do título
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const dataObj = new Date(ano, mes - 1, dia, 12, 0, 0);

  const formatadorData = new Intl.DateTimeFormat('pt-BR', { 
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const dataExtenso = formatadorData.format(dataObj);
  const dataExtensoCapitalizada = dataExtenso.charAt(0).toUpperCase() + dataExtenso.slice(1);

  // Totais do Dia
  const totalFaturadoDia = agendamentosDoDia.reduce((acc, ag) => acc + (Number(ag.valorCliente) || 0), 0);

  const copiarPix = (chave, id) => {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setPixCopiado(id);
    if (showToast) showToast('Chave PIX copiada com sucesso!');
    setTimeout(() => setPixCopiado(null), 2500);
  };

  const toggleExpand = (id) => {
    setExpandedAgendamentoId(prev => prev === id ? null : id);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '0.5rem' }}>
      <div 
        className="modal-extrato-content" 
        style={{ maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho do Dia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem' }}>
                <Calendar size={13} />
                <span>Agenda Diária</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limpeza Express SP</span>
            </div>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>
              {dataExtensoCapitalizada}
            </h2>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              <strong>{agendamentosDoDia.length}</strong> {agendamentosDoDia.length === 1 ? 'cliente agendado' : 'clientes agendados'} • Faturamento previsto: <strong style={{ color: 'var(--primary-400)' }}>{formatCurrency(totalFaturadoDia)}</strong>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon btn-sm"
            title="Fechar"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Barra de Ação Superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Clientes Escalados ({agendamentosDoDia.length}):
          </span>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNovoAgendamento) {
                onNovoAgendamento({
                  dataHoraInicio: `${dataStr}T09:00:00`,
                  dataHoraFim: `${dataStr}T13:00:00`
                });
              }
            }}
            className="btn btn-primary btn-sm"
            style={{ gap: '0.35rem', fontSize: '0.8rem' }}
          >
            <Plus size={15} />
            <span>+ Agendar Faxina neste Dia</span>
          </button>
        </div>

        {/* Lista de Agendamentos do Dia */}
        {agendamentosDoDia.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', margin: '0.5rem 0' }}>
            <Calendar size={42} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
              Nenhum agendamento para este dia
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '1rem' }}>
              Não há nenhuma faxina cadastrada para {dataExtensoCapitalizada}.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNovoAgendamento) {
                  onNovoAgendamento({
                    dataHoraInicio: `${dataStr}T09:00:00`,
                    dataHoraFim: `${dataStr}T13:00:00`
                  });
                }
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={15} />
              <span>Agendar Faxina para este Dia</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {agendamentosDoDia.map((ag) => {
              const cliente = clientes.find(c => c.id === ag.clienteId);
              const plano = planos.find(p => p.id === ag.planoId);
              const isPago = ag.statusClientePagamento === 'pago';

              const nomesAjudantes = (ag.ajudantesEscaladas || []).map(ae => {
                const a = ajudantes.find(aj => aj.id === ae.ajudanteId);
                return a ? a.nome : 'Ajudante';
              });

              const googleUrl = generateGoogleCalendarUrl(ag, cliente, plano, nomesAjudantes);
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cliente?.endereco || ''}, ${cliente?.bairro || ''}, São Paulo`)}`;
              const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(`${cliente?.endereco || ''}, ${cliente?.bairro || ''}, São Paulo`)}`;

              return (
                <div 
                  key={ag.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    borderLeft: `4px solid ${ag.statusServico === 'concluido' ? '#10b981' : '#f59e0b'}` 
                  }}
                >
                  {/* Cabeçalho do Card da Faxina */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>
                          {plano?.nome || 'Plano de Limpeza'}
                        </span>

                        {cliente?.tipoCliente === 'PJ' && (
                          <span className="badge" style={{ fontSize: '0.725rem', background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Building size={11} />
                            <span>PJ</span>
                          </span>
                        )}

                        {cliente?.emiteNF && (
                          <span className="badge" style={{ fontSize: '0.725rem', background: 'rgba(99, 102, 241, 0.25)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.45)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} title={`Emitir NF: CNPJ ${cliente?.cnpj || 'Ver cadastro'}`}>
                            <FileText size={11} />
                            <span>Emitir NF</span>
                          </span>
                        )}

                        <span className={`badge ${
                          ag.statusServico === 'concluido' ? 'badge-success' : 
                          ag.statusServico === 'confirmado' ? 'badge-info' : 
                          ag.statusServico === 'cancelado' ? 'badge-danger' : 'badge-warning'
                        }`} style={{ fontSize: '0.725rem' }}>
                          {ag.statusServico}
                        </span>

                        {ag.dormitorios > 2 && (
                          <span className="badge badge-warning" style={{ fontSize: '0.725rem' }}>
                            {cliente?.tipoCliente === 'PJ' ? `${ag.dormitorios} salas (+R$30)` : `${ag.dormitorios} dorms (+R$30)`}
                          </span>
                        )}

                        {ag.semManutencao2Meses && (
                          <span className="badge badge-danger" style={{ fontSize: '0.725rem' }}>
                            Sem manutenção (+R$50)
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                        {cliente?.nome || 'Cliente'}
                      </h3>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <MapPin size={13} color="var(--primary-400)" />
                        <span>
                          {cliente?.condominio ? `${cliente.condominio} ` : ''}
                          {cliente?.torre ? `• ${cliente.torre} ` : ''}
                          {cliente?.apartamento ? `(${cliente.apartamento}) • ` : ''}
                          {cliente?.endereco ? `${cliente.endereco} - ` : ''}
                          {cliente?.bairro}
                        </span>
                      </div>

                      {cliente?.emiteNF && (
                        <div style={{
                          marginTop: '0.4rem',
                          background: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          color: '#c7d2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.25rem'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FileText size={12} />
                            <strong>NF Requerida:</strong> {cliente.razaoSocial || cliente.nome} {cliente.cnpj ? `(CNPJ: ${cliente.cnpj})` : ''}
                          </span>
                          {cliente.emailFaturamento && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>NF para: {cliente.emailFaturamento}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-400)', fontFamily: 'var(--font-display)' }}>
                        {formatCurrency(ag.valorCliente)}
                      </div>

                      <div style={{ marginTop: '0.2rem' }}>
                        {isPago ? (
                          <span 
                            onClick={() => {
                              if (setStatusPagamentoCliente) {
                                setStatusPagamentoCliente(ag.id, 'pendente');
                                if (showToast) showToast('Marcado como Pendente');
                              }
                            }}
                            className="badge badge-success" 
                            style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                            title="Clique para alternar para Pendente"
                          >
                            <CheckCircle2 size={11} />
                            <span>PAGO</span>
                          </span>
                        ) : (
                          <span 
                            onClick={() => {
                              if (setStatusPagamentoCliente) {
                                setStatusPagamentoCliente(ag.id, 'pago');
                                if (showToast) showToast('Marcado como Pago');
                              }
                            }}
                            className="badge badge-warning" 
                            style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                            title="Clique para alternar para Pago"
                          >
                            <AlertCircle size={11} />
                            <span>A RECEBER</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Horário e Rotas */}
                  <div style={{ 
                    background: 'var(--bg-input)', 
                    padding: '0.6rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    margin: '0.75rem 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={15} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {formatTime(ag.dataHoraInicio)} às {formatTime(ag.dataHoraFim)}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({plano?.tempoEstimado || '3 a 5 horas'})
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <a 
                        href={mapsUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title="Abrir no Google Maps"
                      >
                        <MapPin size={12} color="var(--accent-cyan)" />
                        <span>Maps</span>
                      </a>

                      <a 
                        href={wazeUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title="Abrir no Waze"
                      >
                        <Navigation size={12} color="var(--primary-400)" />
                        <span>Waze</span>
                      </a>
                    </div>
                  </div>

                  {/* Equipe Escalada (Ajudantes para esta faxina) */}
                  <div style={{ margin: '0.75rem 0' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                      👥 Ajudante(s) Escalada(s) para este Trabalho ({ag.ajudantesEscaladas?.length || 0}):
                    </span>

                    {(!ag.ajudantesEscaladas || ag.ajudantesEscaladas.length === 0) ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', background: 'rgba(245, 158, 11, 0.06)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                        ⚠️ Nenhuma colaboradora escalada para esta faxina ainda.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.5rem' }}>
                        {ag.ajudantesEscaladas.map((ae, idx) => {
                          const ajudante = ajudantes.find(a => a.id === ae.ajudanteId);
                          if (!ajudante) return null;

                          const valorDiaria = ae.valorAPagar !== undefined ? ae.valorAPagar : (ajudante.valorPadrao || 90);
                          const isDiariaPaga = ae.statusPagamento === 'pago';

                          const textoEscala = buildEscalaAjudanteText({
                            ajudanteNome: ajudante.nome,
                            clienteNome: cliente?.nome || 'Cliente',
                            condominio: cliente?.condominio || '',
                            torre: cliente?.torre || '',
                            endereco: cliente?.endereco || '',
                            apartamento: cliente?.apartamento || '',
                            bairro: cliente?.bairro || '',
                            dataHoraInicio: ag.dataHoraInicio,
                            observacoes: ag.observacoes,
                            valorDiaria: valorDiaria
                          });

                          const whatsAppAjudanteUrl = getWhatsAppUrl(ajudante.telefone, textoEscala);

                          return (
                            <div 
                              key={idx}
                              style={{ 
                                background: 'rgba(17, 24, 34, 0.65)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: 'var(--radius-md)', 
                                padding: '0.65rem 0.75rem' 
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <div style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '50%', 
                                    background: 'var(--primary-gradient)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: '#fff', 
                                    fontWeight: '700', 
                                    fontSize: '0.75rem' 
                                  }}>
                                    {ajudante.nome?.charAt(0) || 'A'}
                                  </div>

                                  <div>
                                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>
                                      {ajudante.nome}
                                    </strong>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      {ajudante.telefone || 'Sem telefone'}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', display: 'block' }}>
                                    {formatCurrency(valorDiaria)}
                                  </strong>
                                  <span 
                                    onClick={() => {
                                      if (setStatusPagamentoAjudante) {
                                        const novoStatus = isDiariaPaga ? 'pendente' : 'pago';
                                        setStatusPagamentoAjudante(ag.id, ajudante.id, novoStatus);
                                        if (showToast) showToast(`Diária de ${ajudante.nome}: ${novoStatus === 'pago' ? 'Paga' : 'Pendente'}`);
                                      }
                                    }}
                                    className={`badge ${isDiariaPaga ? 'badge-success' : 'badge-warning'}`}
                                    style={{ cursor: 'pointer', fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}
                                    title="Clique para alternar status da diária"
                                  >
                                    {isDiariaPaga ? 'Paga' : 'A Pagar'}
                                  </span>
                                </div>
                              </div>

                              {/* Chave PIX e Envio no WhatsApp */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  🔑 PIX: <strong>{ajudante.chavePix || 'Não informada'}</strong>
                                </div>

                                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                                  {ajudante.chavePix && (
                                    <button
                                      type="button"
                                      onClick={() => copiarPix(ajudante.chavePix, `${ag.id}-${ajudante.id}`)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                                      title="Copiar Chave PIX"
                                    >
                                      {pixCopiado === `${ag.id}-${ajudante.id}` ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                                      <span>{pixCopiado === `${ag.id}-${ajudante.id}` ? 'Copiado' : 'PIX'}</span>
                                    </button>
                                  )}

                                  <a
                                    href={whatsAppAjudanteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-whatsapp btn-sm"
                                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                                    title="Enviar Escala Completa no WhatsApp da Ajudante"
                                  >
                                    <MessageCircle size={11} />
                                    <span>Escala</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {ag.observacoes && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.5rem 0', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                      💬 <strong>Obs:</strong> {ag.observacoes}
                    </div>
                  )}

                  {/* Ações da Faxina */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {/* WhatsApp Lembrete Cliente */}
                      {cliente?.telefone && (
                        <a
                          href={getWhatsAppUrl(cliente.telefone, buildLembreteClienteText({
                            clienteNome: cliente.nome,
                            dataHoraInicio: ag.dataHoraInicio,
                            planoNome: plano?.nome || 'Faxina Residencial',
                            valorFinal: ag.valorCliente
                          }))}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-whatsapp btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          title="Enviar lembrete para o cliente no WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span>Lembrete Cliente</span>
                        </a>
                      )}

                      {/* Google Agenda Link */}
                      <a 
                        href={googleUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-google btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title="Adicionar ao Google Agenda"
                      >
                        <Calendar size={13} />
                        <span>Google Agenda</span>
                      </a>

                      {/* Baixar .ICS */}
                      <button 
                        type="button"
                        onClick={() => downloadIcsFile(ag, cliente, plano, nomesAjudantes)} 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem' }}
                        title="Baixar arquivo .ICS para iPhone / Android"
                      >
                        <Download size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onEditarAgendamento) onEditarAgendamento(ag);
                        }} 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title="Editar Faxina"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a faxina de ${cliente?.nome || 'este cliente'}?`)) {
                            deleteAgendamento(ag.id);
                            if (showToast) showToast('Faxina excluída com sucesso');
                          }
                        }} 
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Excluir Faxina"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé de Fechamento */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Fechar Agenda do Dia
          </button>
        </div>
      </div>
    </div>
  );
};
