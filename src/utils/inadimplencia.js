// Utilitário de Cálculo de Inadimplência e Prazos de Pagamento
// Limpeza Express SP

/**
 * Calcula a situação de adimplência / inadimplência de um cliente
 * baseado em suas faxinas pendentes e modalidade acordada de pagamento.
 * 
 * @param {Object} cliente 
 * @param {Array} agendamentos 
 * @returns {Object} { isInadimplente, totalVencido, totalPendente, diasAtrasoMax, faxinasAtrasadas, statusTexto }
 */
export const calcularInadimplenciaCliente = (cliente, agendamentos = []) => {
  if (!cliente) {
    return {
      isInadimplente: false,
      totalVencido: 0,
      totalPendente: 0,
      diasAtrasoMax: 0,
      faxinasAtrasadas: [],
      statusTexto: 'Em dia'
    };
  }

  const agora = new Date();
  const hojeAno = agora.getFullYear();
  const hojeMes = agora.getMonth();
  const hojeDia = agora.getDate();

  const tipoPagamento = cliente.tipoPagamento || (cliente.planoPadraoId?.includes('mensal') ? 'mensal' : 'diario');
  const diaVencimento = Number(cliente.diaVencimento) || 10;

  // Filtra agendamentos do cliente com pagamento pendente e serviço não cancelado
  const faxinasPendentes = agendamentos.filter(ag => 
    ag.clienteId === cliente.id && 
    ag.statusClientePagamento === 'pendente' &&
    ag.statusServico !== 'cancelado' &&
    ag.dataHoraInicio
  );

  let totalPendente = 0;
  let totalVencido = 0;
  let diasAtrasoMax = 0;
  const faxinasAtrasadas = [];

  faxinasPendentes.forEach(ag => {
    const val = Number(ag.valorCliente || 0);
    totalPendente += val;

    const dataAg = new Date(ag.dataHoraInicio);
    const agAno = dataAg.getFullYear();
    const agMes = dataAg.getMonth();
    const agDia = dataAg.getDate();

    let vencido = false;
    let diasAtraso = 0;

    if (tipoPagamento === 'mensal') {
      // Regra Mensal:
      // Se a faxina foi em mês anterior ao atual, já fechou o mês e venceu no diaVencimento do mês seguinte
      if (agAno < hojeAno || (agAno === hojeAno && agMes < hojeMes)) {
        vencido = true;
        // Data teórica de vencimento: diaVencimento do mês subsequente à faxina
        const dataVenc = new Date(agAno, agMes + 1, diaVencimento);
        const diffMs = agora.getTime() - dataVenc.getTime();
        diasAtraso = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      } else if (agAno === hojeAno && agMes === hojeMes) {
        // Faxina realizada no mês atual: vence no diaVencimento deste mês
        if (hojeDia > diaVencimento && dataAg < agora) {
          vencido = true;
          diasAtraso = hojeDia - diaVencimento;
        }
      }
    } else if (tipoPagamento === 'quinzenal') {
      // Regra Quinzenal: vence 15 dias após a realização da faxina
      const dataLimite = new Date(dataAg.getTime() + (15 * 24 * 60 * 60 * 1000));
      if (agora > dataLimite) {
        vencido = true;
        const diffMs = agora.getTime() - dataLimite.getTime();
        diasAtraso = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    } else {
      // Regra Diária (padrão): o pagamento é devido no dia da faxina ou até 24h após
      // Considera vencido se a faxina já passou da data de realização (dia anterior ou mais)
      const dataFimDiaFaxina = new Date(agAno, agMes, agDia, 23, 59, 59);
      if (agora > dataFimDiaFaxina) {
        vencido = true;
        const diffMs = agora.getTime() - dataFimDiaFaxina.getTime();
        diasAtraso = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    if (vencido) {
      totalVencido += val;
      if (diasAtraso > diasAtrasoMax) diasAtrasoMax = diasAtraso;
      faxinasAtrasadas.push({
        ...ag,
        diasAtraso
      });
    }
  });

  const isInadimplente = faxinasAtrasadas.length > 0;

  let statusTexto = 'Em dia';
  if (isInadimplente) {
    statusTexto = `Inadimplente (${diasAtrasoMax} dia${diasAtrasoMax > 1 ? 's' : ''} de atraso)`;
  } else if (totalPendente > 0) {
    statusTexto = 'Pendente a vencer';
  }

  return {
    isInadimplente,
    totalVencido,
    totalPendente,
    diasAtrasoMax,
    faxinasAtrasadas,
    statusTexto,
    tipoPagamento,
    diaVencimento
  };
};

/**
 * Retorna configurações de cor e rótulo para o Grau de Sujidade
 */
export const getGrauSujidadeInfo = (grau) => {
  switch (grau) {
    case 'baixo':
      return {
        label: 'Sujidade Baixa',
        tag: 'Leve / Rotina',
        icone: '🧹',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
        color: '#34d399'
      };
    case 'alto':
      return {
        label: 'Sujidade Alta / Pesada',
        tag: 'Pesada / Crítica',
        icone: '🔥',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        color: '#f87171'
      };
    case 'medio':
    default:
      return {
        label: 'Sujidade Média',
        tag: 'Padrão Regular',
        icone: '🧼',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        color: '#fbbf24'
      };
  }
};
