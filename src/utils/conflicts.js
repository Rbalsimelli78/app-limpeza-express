/**
 * Utilitário de Detecção de Conflitos e Choques de Horários/Escalas - Limpeza Express SP
 */

/**
 * Verifica se dois intervalos de data/hora se sobrepõem no tempo
 */
export const checkIntervalOverlap = (inicioA, fimA, inicioB, fimB) => {
  if (!inicioA || !inicioB) return false;

  const startA = new Date(inicioA).getTime();
  let endA = fimA ? new Date(fimA).getTime() : startA + 4 * 60 * 60 * 1000;
  if (isNaN(endA) || endA <= startA) endA = startA + 4 * 60 * 60 * 1000;

  const startB = new Date(inicioB).getTime();
  let endB = fimB ? new Date(fimB).getTime() : startB + 4 * 60 * 60 * 1000;
  if (isNaN(endB) || endB <= startB) endB = startB + 4 * 60 * 60 * 1000;

  if (isNaN(startA) || isNaN(startB)) return false;

  // Há sobreposição se o início de um for estritamente anterior ao fim do outro e vice-versa
  return startA < endB && endA > startB;
};

/**
 * Encontra todos os conflitos de um agendamento alvo (ou simulação de agendamento)
 * com a lista de agendamentos existentes.
 */
export const findAgendamentoConflicts = ({
  dataHoraInicio,
  dataHoraFim,
  ajudantesSelecionadas = [],
  agendamentoIdIgnorar = null,
  agendamentos = [],
  clientes = [],
  ajudantes = []
}) => {
  if (!dataHoraInicio) return [];

  const conflitos = [];
  const targetAjudanteIds = (ajudantesSelecionadas || [])
    .map(a => a?.ajudanteId || a)
    .filter(Boolean);

  (agendamentos || []).forEach(ag => {
    if (!ag || !ag.dataHoraInicio) return;
    // Ignorar o próprio agendamento na edição
    if (agendamentoIdIgnorar && ag.id === agendamentoIdIgnorar) return;
    // Ignorar faxinas canceladas
    if (ag.statusServico === 'cancelado') return;

    // Verificar se se sobrepõem no tempo
    const sobrepoe = checkIntervalOverlap(
      dataHoraInicio,
      dataHoraFim,
      ag.dataHoraInicio,
      ag.dataHoraFim
    );

    if (!sobrepoe) return;

    // Se houver sobreposição, verificar se há choque de ajudante
    const agAjudanteIds = (ag.ajudantesEscaladas || [])
      .map(a => a?.ajudanteId || a)
      .filter(Boolean);

    const ajudantesComuns = targetAjudanteIds.filter(id => agAjudanteIds.includes(id));
    const nomesAjudantesComuns = ajudantesComuns
      .map(id => ajudantes.find(a => a.id === id)?.nome)
      .filter(Boolean);

    const clienteObj = clientes.find(c => c.id === ag.clienteId);
    const clienteNome = clienteObj?.nome || 'Cliente agendado';
    const clienteLocal = clienteObj?.condominio ? `${clienteObj.condominio}` : clienteObj?.bairro || '';

    const horaIniStr = ag.dataHoraInicio ? ag.dataHoraInicio.slice(11, 16) : '08:00';
    const horaFimStr = ag.dataHoraFim ? ag.dataHoraFim.slice(11, 16) : '';
    const dataStr = ag.dataHoraInicio ? ag.dataHoraInicio.slice(0, 10) : '';

    conflitos.push({
      agendamentoId: ag.id,
      clienteNome,
      clienteLocal,
      dataStr,
      horaInicio: horaIniStr,
      horaFim: horaFimStr,
      temChoqueAjudante: nomesAjudantesComuns.length > 0,
      ajudantesEmConflito: nomesAjudantesComuns,
      agendamentoOriginal: ag
    });
  });

  return conflitos;
};

/**
 * Identifica se um agendamento individual possui algum conflito dentro do grupo de agendamentos
 */
export const checkHasConflict = (ag, todosAgendamentos = [], ajudantes = []) => {
  if (!ag || !ag.dataHoraInicio || ag.statusServico === 'cancelado') return null;

  const targetAjudanteIds = (ag.ajudantesEscaladas || [])
    .map(a => a?.ajudanteId || a)
    .filter(Boolean);

  for (const outro of todosAgendamentos) {
    if (!outro || outro.id === ag.id || outro.statusServico === 'cancelado' || !outro.dataHoraInicio) continue;

    const sobrepoe = checkIntervalOverlap(
      ag.dataHoraInicio,
      ag.dataHoraFim,
      outro.dataHoraInicio,
      outro.dataHoraFim
    );

    if (sobrepoe) {
      const outroAjudanteIds = (outro.ajudantesEscaladas || [])
        .map(a => a?.ajudanteId || a)
        .filter(Boolean);

      const ajudantesComuns = targetAjudanteIds.filter(id => outroAjudanteIds.includes(id));
      const nomesAjudantesComuns = ajudantesComuns
        .map(id => ajudantes.find(a => a.id === id)?.nome)
        .filter(Boolean);

      if (nomesAjudantesComuns.length > 0) {
        return {
          tipo: 'ajudante',
          ajudantes: nomesAjudantesComuns,
          outroAgendamentoId: outro.id
        };
      }

      // Se nenhum tiver ajudante ou ambos tiverem horários sobrepostos
      return {
        tipo: 'horario',
        outroAgendamentoId: outro.id
      };
    }
  }

  return null;
};
