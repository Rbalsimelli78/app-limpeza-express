import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Sparkles, 
  Building, 
  FileText, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { 
  MESES_NOMES, 
  projetarViradaDeMes, 
  DIAS_SEMANA_NOMES 
} from '../utils/recurrence';

export const ModalViradaMes = ({ isOpen, onClose, onMesAgendado }) => {
  const { 
    clientes, 
    agendamentos, 
    planos, 
    ajudantes, 
    addAgendamentosMultiplos, 
    showToast 
  } = useApp();

  // Mês e Ano de Destino (Padrão: Próximo mês a partir de hoje)
  const [dataAlvo, setDataAlvo] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  });

  const anoDestino = dataAlvo.getFullYear();
  const mesDestino = dataAlvo.getMonth(); // 0 a 11

  // Gerar opções dos próximos 6 meses para o select
  const opcoesMeses = useMemo(() => {
    const hoje = new Date();
    const lista = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const a = d.getFullYear();
      const m = d.getMonth();
      const rotulo = `${MESES_NOMES[m]} de ${a}`;
      lista.push({ ano: a, mes: m, rotulo, key: `${a}-${m}` });
    }
    return lista;
  }, []);

  // Projeção dos clientes confirmados para o mês selecionado
  const clientesProjetadosIniciais = useMemo(() => {
    if (!isOpen) return [];
    return projetarViradaDeMes({
      clientes,
      agendamentos,
      planos,
      anoDestino,
      mesDestino
    });
  }, [clientes, agendamentos, planos, anoDestino, mesDestino, isOpen]);

  // Estado local para permitir marcar/desmarcar clientes individualmente
  const [selecionadosMap, setSelecionadosMap] = useState({});

  // Atualiza os selecionados sempre que muda a lista inicial
  React.useEffect(() => {
    const novoMap = {};
    clientesProjetadosIniciais.forEach(item => {
      novoMap[item.cliente.id] = true; // todos marcados por padrão
    });
    setSelecionadosMap(novoMap);
  }, [clientesProjetadosIniciais]);

  const toggleCliente = (clienteId) => {
    setSelecionadosMap(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  const selecionarTodos = () => {
    const novoMap = {};
    clientesProjetadosIniciais.forEach(item => {
      novoMap[item.cliente.id] = true;
    });
    setSelecionadosMap(novoMap);
  };

  const desmarcarTodos = () => {
    const novoMap = {};
    clientesProjetadosIniciais.forEach(item => {
      novoMap[item.cliente.id] = false;
    });
    setSelecionadosMap(novoMap);
  };

  // Cálculos de totais selecionados
  const clientesAtivosSelecionados = clientesProjetadosIniciais.filter(item => selecionadosMap[item.cliente.id]);
  const totalFaxinasAGerar = clientesAtivosSelecionados.reduce((acc, item) => acc + item.totalFaxinas, 0);
  const totalFaturamentoPrevisto = clientesAtivosSelecionados.reduce((acc, item) => acc + item.totalPrevisto, 0);

  // Executar virada de mês
  const handleConfirmarVirada = () => {
    if (totalFaxinasAGerar === 0) {
      showToast('Selecione ao menos 1 cliente para programar.', 'danger');
      return;
    }

    const agendamentosParaCriar = [];

    clientesAtivosSelecionados.forEach(item => {
      item.datasCalculadas.forEach(dataItem => {
        agendamentosParaCriar.push({
          clienteId: item.cliente.id,
          planoId: item.planoId,
          dataHoraInicio: dataItem.dataHoraInicio,
          dataHoraFim: dataItem.dataHoraFim,
          dormitorios: item.dormitorios,
          semManutencao2Meses: false,
          valorCliente: item.valorPorFaxina,
          statusClientePagamento: 'pendente',
          formaPagamentoCliente: item.formaPagamento || 'PIX',
          statusServico: 'confirmado',
          observacoes: item.observacoes || '',
          ajudantesEscaladas: item.ajudantesEscaladas || []
        });
      });
    });

    addAgendamentosMultiplos(agendamentosParaCriar);

    const nomeMesExtenso = `${MESES_NOMES[mesDestino]} de ${anoDestino}`;
    if (onMesAgendado) {
      onMesAgendado(dataAlvo);
    }

    onClose();
  };

  if (!isOpen) return null;

  const nomeMesSelecionado = `${MESES_NOMES[mesDestino]} de ${anoDestino}`;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '0.5rem' }}>
      <div 
        className="modal-extrato-content" 
        style={{ maxWidth: '850px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <RefreshCw size={13} />
                <span>Virada de Mês & Recorrência</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limpeza Express SP</span>
            </div>

            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: '700' }}>
              Programar Agenda para o Próximo Mês
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              O sistema detecta os clientes frequentes e confirmados (semanais, quinzenais e PJ) e projeta todas as datas do novo mês automaticamente!
            </p>
          </div>

          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Barra de Seleção de Mês e Controles Rápidos */}
        <div style={{ 
          background: 'var(--bg-input)', 
          padding: '0.85rem 1.1rem', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} color="var(--primary-400)" />
            <div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Mês de Destino da Programação</span>
              <select
                className="form-select"
                style={{ fontWeight: '600', padding: '0.35rem 0.75rem', fontSize: '0.9rem' }}
                value={`${anoDestino}-${mesDestino}`}
                onChange={e => {
                  const [a, m] = e.target.value.split('-').map(Number);
                  setDataAlvo(new Date(a, m, 1));
                }}
              >
                {opcoesMeses.map(op => (
                  <option key={op.key} value={`${op.ano}-${op.mes}`}>
                    {op.rotulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={selecionarTodos}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <CheckSquare size={13} />
              <span>Marcar Todos</span>
            </button>
            <button
              type="button"
              onClick={desmarcarTodos}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <Square size={13} />
              <span>Desmarcar Todos</span>
            </button>
          </div>
        </div>

        {/* Resumo Estatístico da Projeção */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '0.75rem', 
          marginBottom: '1.25rem' 
        }}>
          <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Clientes Selecionados</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              {clientesAtivosSelecionados.length} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>de {clientesProjetadosIniciais.length}</span>
            </strong>
          </div>

          <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Faxinas a Agendar em {MESES_NOMES[mesDestino]}</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--primary-400)' }}>
              {totalFaxinasAGerar} faxinas
            </strong>
          </div>

          <div className="glass-card" style={{ padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Faturamento Previsto</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--accent-gold)' }}>
              {formatCurrency(totalFaturamentoPrevisto)}
            </strong>
          </div>
        </div>

        {/* Lista de Clientes Projetados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {clientesProjetadosIniciais.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Nenhum cliente recorrente ou com histórico pendente de agendamento para {nomeMesSelecionado}.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Todos os clientes ativos já possuem suas faxinas agendadas para este mês ou não possuem atendimentos regulares cadastrados.
              </p>
            </div>
          ) : (
            clientesProjetadosIniciais.map(item => {
              const isMarcado = Boolean(selecionadosMap[item.cliente.id]);
              const nomesAjudantes = (item.ajudantesEscaladas || [])
                .map(ae => ajudantes.find(a => a.id === ae.ajudanteId)?.nome)
                .filter(Boolean);

              return (
                <div
                  key={item.cliente.id}
                  onClick={() => toggleCliente(item.cliente.id)}
                  style={{
                    background: isMarcado ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                    border: isMarcado ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <input 
                        type="checkbox"
                        checked={isMarcado}
                        onChange={() => {}} // controlado pelo onClick do container
                        style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                          <h4 style={{ fontSize: '1rem', color: isMarcado ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: '700' }}>
                            {item.cliente.nome}
                          </h4>
                          {item.cliente.tipoCliente === 'PJ' && (
                            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff' }}>
                              <Building size={10} /> PJ
                            </span>
                          )}
                          {item.cliente.emiteNF && (
                            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe' }}>
                              <FileText size={10} /> Emite NF
                            </span>
                          )}
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                            {item.planoObj?.nome || item.frequencia}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                          {item.cliente.condominio ? `${item.cliente.condominio} ` : ''}
                          {item.cliente.torre ? `• ${item.cliente.torre} ` : ''}
                          {item.cliente.apartamento ? `(${item.cliente.apartamento}) • ` : ''}
                          {item.cliente.bairro}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary-400)' }}>
                        {formatCurrency(item.totalPrevisto)}
                      </div>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {item.totalFaxinas}x de {formatCurrency(item.valorPorFaxina)}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes da Escala e Datas Calculadas */}
                  <div style={{ 
                    background: 'var(--bg-input)', 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.775rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Padrão: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        Toda {item.diaSemanaNome} às {item.horaFormatada}
                      </strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        • Equipe: {nomesAjudantes.length > 0 ? nomesAjudantes.join(' e ') : 'A definir'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {item.datasCalculadas.map((dt, idx) => (
                        <span 
                          key={idx}
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--primary-400)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '3px',
                            fontWeight: '600',
                            fontSize: '0.725rem'
                          }}
                        >
                          {dt.diaFormatado}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Ações */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmarVirada}
            disabled={totalFaxinasAGerar === 0}
            className="btn btn-primary btn-sm"
            style={{ 
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: '700'
            }}
          >
            <Sparkles size={16} />
            <span>Confirmar e Agendar {totalFaxinasAGerar} Faxinas em {MESES_NOMES[mesDestino]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
