import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar, User, Clock, DollarSign, Sparkles, AlertTriangle, Users } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../utils/calendar';

export const ModalAgendamento = ({ isOpen, onClose, agendamentoEdicao = null }) => {
  const { 
    clientes, 
    ajudantes, 
    planos, 
    regras, 
    addAgendamento, 
    updateAgendamento, 
    showToast 
  } = useApp();

  const [clienteId, setClienteId] = useState('');
  const [planoId, setPlanoId] = useState('plano-quinzenal');
  const [dataHoraInicio, setDataHoraInicio] = useState('');
  const [dataHoraFim, setDataHoraFim] = useState('');
  const [dormitorios, setDormitorios] = useState(2);
  const [semManutencao, setSemManutencao] = useState(false);
  const [valorCliente, setValorCliente] = useState(190);
  const [statusClientePagamento, setStatusClientePagamento] = useState('pendente');
  const [formaPagamentoCliente, setFormaPagamentoCliente] = useState('PIX');
  const [statusServico, setStatusServico] = useState('agendado');
  const [observacoes, setObservacoes] = useState('');
  const [ajudantesSelecionadas, setAjudantesSelecionadas] = useState([]);

  // Inicialização ao abrir modal
  useEffect(() => {
    if (agendamentoEdicao) {
      setClienteId(agendamentoEdicao.clienteId || '');
      setPlanoId(agendamentoEdicao.planoId || 'plano-quinzenal');
      setDataHoraInicio(agendamentoEdicao.dataHoraInicio || '');
      setDataHoraFim(agendamentoEdicao.dataHoraFim || '');
      setDormitorios(agendamentoEdicao.dormitorios || 2);
      setSemManutencao(agendamentoEdicao.semManutencao2Meses || false);
      setValorCliente(agendamentoEdicao.valorCliente || 190);
      setStatusClientePagamento(agendamentoEdicao.statusClientePagamento || 'pendente');
      setFormaPagamentoCliente(agendamentoEdicao.formaPagamentoCliente || 'PIX');
      setStatusServico(agendamentoEdicao.statusServico || 'agendado');
      setObservacoes(agendamentoEdicao.observacoes || '');
      setAjudantesSelecionadas(agendamentoEdicao.ajudantesEscaladas || []);
    } else {
      // Padrão novo agendamento
      const agora = new Date();
      agora.setMinutes(0, 0, 0);
      agora.setHours(agora.getHours() + 2); // daqui 2h
      const inicio = agora.toISOString().slice(0, 16);
      
      const fimDate = new Date(agora.getTime() + 4 * 60 * 60 * 1000);
      const fim = fimDate.toISOString().slice(0, 16);

      const primeiroCli = clientes[0];
      const dormsInit = primeiroCli?.dormitorios || 2;
      const planoInit = primeiroCli?.planoPadraoId || 'plano-quinzenal';
      let valorInit = 190;
      if (primeiroCli?.valorFechado !== null && primeiroCli?.valorFechado !== undefined && Number(primeiroCli?.valorFechado) > 0) {
        valorInit = Number(primeiroCli.valorFechado);
      } else {
        const pObj = planos.find(p => p.id === planoInit) || planos[0];
        valorInit = pObj ? pObj.valorBase : 190;
      }

      setClienteId(primeiroCli?.id || '');
      setPlanoId(planoInit);
      setDataHoraInicio(inicio);
      setDataHoraFim(fim);
      setDormitorios(dormsInit);
      setSemManutencao(false);
      setValorCliente(valorInit);
      setStatusClientePagamento('pendente');
      setFormaPagamentoCliente('PIX');
      setStatusServico('confirmado');
      setObservacoes('');

      // Pré-selecionar as 2 primeiras ajudantes padrão
      if (ajudantes.length >= 2) {
        setAjudantesSelecionadas([
          { ajudanteId: ajudantes[0].id, tipo: 'diaria', valorAPagar: 85, statusPagamento: 'pendente' },
          { ajudanteId: ajudantes[1].id, tipo: 'diaria', valorAPagar: 85, statusPagamento: 'pendente' }
        ]);
      } else if (ajudantes.length === 1) {
        setAjudantesSelecionadas([
          { ajudanteId: ajudantes[0].id, tipo: 'diaria', valorAPagar: 85, statusPagamento: 'pendente' }
        ]);
      } else {
        setAjudantesSelecionadas([]);
      }
    }
  }, [agendamentoEdicao, isOpen, clientes, ajudantes]);

  // Recálculo automático do valor do cliente conforme plano e adicionais
  const recalcularValor = (pId, numDorms, semManut, cId = clienteId) => {
    const cli = clientes.find(c => c.id === cId);
    // Se o cliente possui um valor fechado cadastrado e está no plano comercial ou customizado, usa o valor fechado
    if (cli?.valorFechado !== null && cli?.valorFechado !== undefined && Number(cli?.valorFechado) > 0 && (pId === 'plano-customizado' || pId === 'plano-comercial-pj' || pId === cli?.planoPadraoId)) {
      setValorCliente(Number(cli.valorFechado));
      return;
    }

    const plano = planos.find(p => p.id === pId) || planos[0];
    let total = plano ? plano.valorBase : 190;

    // +R$ 30 se 3 ou mais quartos para planos padrão
    if (numDorms > 2 && pId !== 'plano-customizado' && pId !== 'plano-comercial-pj') {
      total += (numDorms - 2) * regras.acrescimoPorQuartoExtra;
    }

    // +R$ 50 se sem manutenção há mais de 2 meses
    if (semManut) {
      total += regras.taxaSemManutencao2Meses;
    }

    setValorCliente(total);
  };

  const handlePlanoChange = (e) => {
    const newId = e.target.value;
    setPlanoId(newId);
    const cli = clientes.find(c => c.id === clienteId);
    if (cli?.valorFechado !== null && cli?.valorFechado !== undefined && Number(cli?.valorFechado) > 0 && (newId === 'plano-customizado' || newId === 'plano-comercial-pj' || newId === cli?.planoPadraoId)) {
      setValorCliente(Number(cli.valorFechado));
    } else {
      recalcularValor(newId, dormitorios, semManutencao);
    }
  };

  const handleDormitoriosChange = (e) => {
    const dorms = Number(e.target.value);
    setDormitorios(dorms);
    recalcularValor(planoId, dorms, semManutencao);
  };

  const handleSemManutencaoChange = (e) => {
    const checked = e.target.checked;
    setSemManutencao(checked);
    recalcularValor(planoId, dormitorios, checked);
  };

  const handleClienteChange = (e) => {
    const cId = e.target.value;
    setClienteId(cId);
    const cli = clientes.find(c => c.id === cId);
    if (cli) {
      const dorms = cli.dormitorios || 2;
      const planoCli = cli.planoPadraoId || planoId;
      setDormitorios(dorms);
      setPlanoId(planoCli);

      if (cli.valorFechado !== null && cli.valorFechado !== undefined && Number(cli.valorFechado) > 0) {
        setValorCliente(Number(cli.valorFechado));
      } else {
        recalcularValor(planoCli, dorms, semManutencao, cId);
      }
    }
  };

  const toggleAjudante = (ajudanteId) => {
    const exists = ajudantesSelecionadas.find(a => a.ajudanteId === ajudanteId);
    if (exists) {
      setAjudantesSelecionadas(prev => prev.filter(a => a.ajudanteId !== ajudanteId));
    } else {
      const aj = ajudantes.find(a => a.id === ajudanteId);
      const valorBase = aj ? aj.valorPadrao : 85;
      setAjudantesSelecionadas(prev => [
        ...prev, 
        { ajudanteId, tipo: aj?.tipoRemuneracao || 'diaria', valorAPagar: valorBase, statusPagamento: 'pendente' }
      ]);
    }
  };

  const handleValorAjudanteChange = (ajudanteId, valor) => {
    setAjudantesSelecionadas(prev => prev.map(a => 
      a.ajudanteId === ajudanteId ? { ...a, valorAPagar: Number(valor) } : a
    ));
  };

  const handleSubmit = (e, openGoogleCalendar = false) => {
    e.preventDefault();
    if (!clienteId) {
      showToast('Por favor, selecione um cliente.', 'danger');
      return;
    }
    if (!dataHoraInicio) {
      showToast('Defina a data e horário da faxina.', 'danger');
      return;
    }

    const payload = {
      clienteId,
      planoId,
      dataHoraInicio,
      dataHoraFim: dataHoraFim || dataHoraInicio,
      dormitorios,
      semManutencao2Meses: semManutencao,
      valorCliente: Number(valorCliente),
      statusClientePagamento,
      formaPagamentoCliente,
      statusServico,
      observacoes,
      ajudantesEscaladas: ajudantesSelecionadas
    };

    let savedAgendamento;
    if (agendamentoEdicao) {
      updateAgendamento(agendamentoEdicao.id, payload);
      savedAgendamento = { ...agendamentoEdicao, ...payload };
    } else {
      savedAgendamento = addAgendamento(payload);
    }

    if (openGoogleCalendar) {
      const clienteObj = clientes.find(c => c.id === clienteId);
      const planoObj = planos.find(p => p.id === planoId);
      const nomesAjudantes = ajudantesSelecionadas
        .map(a => ajudantes.find(aj => aj.id === a.ajudanteId)?.nome)
        .filter(Boolean);

      const url = generateGoogleCalendarUrl(savedAgendamento, clienteObj, planoObj, nomesAjudantes);
      window.open(url, '_blank');
      showToast('Google Agenda aberto em nova aba!');
    }

    onClose();
  };

  if (!isOpen) return null;

  const clienteSelecionado = clientes.find(c => c.id === clienteId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Calendar size={20} color="var(--primary-400)" />
            <h3 style={{ fontSize: '1.125rem' }}>
              {agendamentoEdicao ? 'Editar Faxina' : 'Novo Agendamento de Faxina'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={e => handleSubmit(e, false)}>
          <div className="modal-body">
            {/* Seleção do Cliente */}
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select 
                className="form-select" 
                value={clienteId} 
                onChange={handleClienteChange}
                required
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.status === 'inativo' ? '⚠️ [INATIVO] ' : ''}
                    {c.tipoCliente === 'PJ' ? '🏢 [PJ] ' : ''}
                    {c.emiteNF ? '📄 [NF] ' : ''}
                    {c.nome} {c.condominio ? `• ${c.condominio}` : ''} {c.torre ? `(${c.torre} - ${c.apartamento})` : c.apartamento ? `(${c.apartamento})` : ''} - {c.bairro}
                    {c.valorFechado ? ` [Valor Fixo: R$ ${c.valorFechado}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Aviso em Destaque de Nota Fiscal (NF) & PJ */}
            {clienteSelecionado && (clienteSelecionado.emiteNF || clienteSelecionado.tipoCliente === 'PJ') && (
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>📄</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>CLIENTE PJ / ESCRITÓRIO - EMITIR NOTA FISCAL (NF)</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {clienteSelecionado.cnpj ? `CNPJ: ${clienteSelecionado.cnpj}` : 'CNPJ não informado'}
                      {clienteSelecionado.razaoSocial ? ` • Razão: ${clienteSelecionado.razaoSocial}` : ''}
                      {clienteSelecionado.emailFaturamento ? ` • Email NF: ${clienteSelecionado.emailFaturamento}` : ''}
                    </div>
                  </div>
                </div>
                <span className="badge badge-purple" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#f3e8ff', border: '1px solid rgba(168, 85, 247, 0.45)', fontSize: '0.75rem' }}>
                  Emitir NF
                </span>
              </div>
            )}

            {/* Plano de Faxina */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Plano de Faxina *</label>
                <select 
                  className="form-select" 
                  value={planoId} 
                  onChange={handlePlanoChange}
                >
                  {planos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.valorBase > 0 ? `(R$ ${p.valorBase},00)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {clienteSelecionado?.tipoCliente === 'PJ' ? 'Salas / Ambientes' : 'Dormitórios'}
                </label>
                <select 
                  className="form-select" 
                  value={dormitorios} 
                  onChange={handleDormitoriosChange}
                >
                  <option value={1}>{clienteSelecionado?.tipoCliente === 'PJ' ? '1 Sala / Recepção' : '1 Dormitório'}</option>
                  <option value={2}>{clienteSelecionado?.tipoCliente === 'PJ' ? '2 Salas (Padrão)' : '2 Dormitórios (Padrão)'}</option>
                  <option value={3}>{clienteSelecionado?.tipoCliente === 'PJ' ? '3 Salas (+R$ 30,00)' : '3 Dormitórios (+R$ 30,00)'}</option>
                  <option value={4}>{clienteSelecionado?.tipoCliente === 'PJ' ? '4 Salas ou mais (+R$ 60,00)' : '4 Dormitórios (+R$ 60,00)'}</option>
                </select>
              </div>
            </div>

            {/* Checkbox Sem Manutenção */}
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.08)', 
              border: '1px solid rgba(245, 158, 11, 0.25)', 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <input 
                type="checkbox" 
                id="semManut" 
                checked={semManutencao} 
                onChange={handleSemManutencaoChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
              />
              <label htmlFor="semManut" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <strong>Apartamento sem faxina há mais de 2 meses?</strong> (+R$ 50,00 adicional)
              </label>
            </div>

            {/* Data e Horário */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Início *</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={dataHoraInicio} 
                  onChange={e => setDataHoraInicio(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Término Estimado</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={dataHoraFim} 
                  onChange={e => setDataHoraFim(e.target.value)} 
                />
              </div>
            </div>

            {/* Equipe de Ajudantes (Geralmente 2 profissionais) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Equipe de Ajudantes (Geralmente 2 profissionais)</span>
                <span style={{ color: 'var(--primary-400)', fontSize: '0.75rem' }}>
                  {ajudantesSelecionadas.length} selecionada(s)
                </span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ajudantes.map(aj => {
                  const isSelected = ajudantesSelecionadas.some(a => a.ajudanteId === aj.id);
                  const selData = ajudantesSelecionadas.find(a => a.ajudanteId === aj.id);

                  return (
                    <div 
                      key={aj.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                        border: isSelected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                        transition: 'var(--transition)'
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', flex: 1 }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleAjudante(aj.id)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? '600' : '400', color: aj.status === 'inativo' ? 'var(--text-muted)' : 'inherit' }}>
                          {aj.nome} {aj.status === 'inativo' ? '⚠️ (INATIVA)' : ''} ({aj.especialidade || 'Geral'})
                        </span>
                      </label>

                      {isSelected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pagar R$</span>
                          <input 
                            type="number" 
                            value={selData.valorAPagar} 
                            onChange={e => handleValorAjudanteChange(aj.id, e.target.value)}
                            style={{ 
                              width: '75px', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: 'var(--radius-sm)', 
                              background: 'var(--bg-card)', 
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              fontSize: '0.85rem',
                              textAlign: 'right'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Valor e Pagamento do Cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Valor Cobrado (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  value={valorCliente} 
                  onChange={e => setValorCliente(e.target.value)} 
                  style={{ 
                    borderColor: clienteSelecionado?.valorFechado ? 'var(--primary-500)' : 'var(--border-color)',
                    background: clienteSelecionado?.valorFechado ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-input)'
                  }}
                />
                {clienteSelecionado?.valorFechado && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-400)', display: 'block', marginTop: '0.25rem' }}>
                    ✨ Valor fixo/acordado do cliente: R$ {Number(clienteSelecionado.valorFechado).toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status Pagamento</label>
                <select 
                  className="form-select" 
                  value={statusClientePagamento} 
                  onChange={e => setStatusClientePagamento(e.target.value)}
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Forma</label>
                <select 
                  className="form-select" 
                  value={formaPagamentoCliente} 
                  onChange={e => setFormaPagamentoCliente(e.target.value)}
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
            </div>

            {/* Status do Serviço */}
            <div className="form-group">
              <label className="form-label">Status da Faxina</label>
              <select 
                className="form-select" 
                value={statusServico} 
                onChange={e => setStatusServico(e.target.value)}
              >
                <option value="confirmado">Confirmado</option>
                <option value="agendado">Agendado (Aguardando Confirmação)</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Observações */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observações da Faxina</label>
              <textarea 
                className="form-textarea" 
                rows="2" 
                placeholder="Ex: Pet no local, chave na portaria, foco na varanda..."
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={e => handleSubmit(e, true)} 
              className="btn btn-google btn-sm"
              title="Salva a faxina e já abre no Google Agenda com 1 clique"
            >
              <Calendar size={16} />
              <span>Salvar + Google Agenda</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Salvar Faxina
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
