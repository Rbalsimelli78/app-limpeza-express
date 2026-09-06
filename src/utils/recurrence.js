// Utilitário de Cálculo de Recorrência e Virada de Mês - Limpeza Express SP

export const DIAS_SEMANA_NOMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export const DIAS_SEMANA_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Converte um objeto Date para string no formato do input datetime-local (YYYY-MM-DDTHH:mm)
 */
export const toDatetimeLocalString = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Retorna o dia da semana por extenso em português
 */
export const getDiaSemanaExtenso = (date) => {
  const d = new Date(date);
  return DIAS_SEMANA_NOMES[d.getDay()] || '';
};

/**
 * Formata data curta com dia da semana (ex: "Terça, 08/09")
 */
export const formatDateWithWeekday = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const diaSemana = DIAS_SEMANA_NOMES[d.getDay()].split('-')[0];
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${diaSemana}, ${dia}/${mes}`;
};

/**
 * Gera lista de datas recorrentes a partir de uma data/hora inicial
 */
export const generateRecurrenceDates = ({
  dataHoraInicio,
  dataHoraFim,
  tipoRecorrencia = 'semanal',
  limiteTipo = 'fim_mes',
  qtdOcorrencias = 4
}) => {
  if (!dataHoraInicio) return [];

  const startInitial = new Date(dataHoraInicio);
  if (isNaN(startInitial.getTime())) return [];

  const durationMs = dataHoraFim 
    ? Math.max(1 * 60 * 60 * 1000, new Date(dataHoraFim).getTime() - startInitial.getTime())
    : 4 * 60 * 60 * 1000; // 4h padrão

  const startMonth = startInitial.getMonth();
  const startYear = startInitial.getFullYear();

  const resultados = [];
  let currentStart = new Date(startInitial);
  let index = 0;

  const maxOcorrencias = limiteTipo === '4_semanas' ? 4 
    : limiteTipo === '8_semanas' ? 8 
    : limiteTipo === 'qtd' ? qtdOcorrencias 
    : 20; // limite de segurança para fim_mes

  while (index < maxOcorrencias) {
    if (limiteTipo === 'fim_mes' && (currentStart.getMonth() !== startMonth || currentStart.getFullYear() !== startYear)) {
      break;
    }

    const currentEnd = new Date(currentStart.getTime() + durationMs);

    resultados.push({
      idTemp: `rec_${index}_${currentStart.getTime()}`,
      dataHoraInicio: toDatetimeLocalString(currentStart),
      dataHoraFim: toDatetimeLocalString(currentEnd),
      dataObj: new Date(currentStart),
      diaSemana: getDiaSemanaExtenso(currentStart),
      diaFormatado: formatDateWithWeekday(currentStart),
      horaFormatada: `${String(currentStart.getHours()).padStart(2, '0')}:${String(currentStart.getMinutes()).padStart(2, '0')}`,
      selecionada: true
    });

    index++;

    if (tipoRecorrencia === 'semanal') {
      currentStart.setDate(currentStart.getDate() + 7);
    } else if (tipoRecorrencia === 'quinzenal') {
      currentStart.setDate(currentStart.getDate() + 14);
    } else if (tipoRecorrencia === 'mensal') {
      currentStart.setMonth(currentStart.getMonth() + 1);
    } else {
      break;
    }
  }

  return resultados;
};

/**
 * Gera todas as datas de um dia da semana específico dentro de um determinado mês
 */
export const getDatasDoMesPorDiaSemana = (
  ano, 
  mes, 
  diaSemana, 
  horaInicio = 9, 
  minutoInicio = 0, 
  duracaoHoras = 4
) => {
  const datas = [];
  const data = new Date(ano, mes, 1, horaInicio, minutoInicio, 0);

  while (data.getMonth() === mes) {
    if (data.getDay() === diaSemana) {
      const inicio = new Date(data);
      const fim = new Date(data.getTime() + duracaoHoras * 60 * 60 * 1000);

      datas.push({
        dataHoraInicio: toDatetimeLocalString(inicio),
        dataHoraFim: toDatetimeLocalString(fim),
        dataObj: new Date(inicio),
        diaSemana: getDiaSemanaExtenso(inicio),
        diaFormatado: formatDateWithWeekday(inicio),
        horaFormatada: `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`
      });
    }
    data.setDate(data.getDate() + 1);
  }

  return datas;
};

/**
 * Analisa a agenda existente e detecta o padrão semanal/quinzenal dos clientes confirmados
 * para projetar automaticamente o próximo mês (Virada de Mês)
 */
export const projetarViradaDeMes = ({
  clientes = [],
  agendamentos = [],
  planos = [],
  anoDestino,
  mesDestino // 0 a 11
}) => {
  const clientesAtivos = clientes.filter(c => c.status !== 'inativo');
  const clientesProjetados = [];

  clientesAtivos.forEach(cliente => {
    const faxinasCliente = agendamentos
      .filter(a => a.clienteId === cliente.id && a.statusServico !== 'cancelado')
      .sort((a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio));

    const ultimaFaxina = faxinasCliente[0];

    const planoId = cliente.planoPadraoId || ultimaFaxina?.planoId || 'plano-quinzenal';
    const planoObj = planos.find(p => p.id === planoId);

    let frequencia = 'semanal';
    if (planoId.includes('quinzenal')) {
      frequencia = 'quinzenal';
    } else if (planoId.includes('mensal')) {
      frequencia = 'mensal';
    } else if (planoId.includes('semanal') || planoId.includes('comercial')) {
      frequencia = 'semanal';
    } else if (faxinasCliente.length >= 2) {
      const diffDias = Math.round(
        Math.abs(new Date(faxinasCliente[0].dataHoraInicio) - new Date(faxinasCliente[1].dataHoraInicio)) / (1000 * 60 * 60 * 24)
      );
      if (diffDias >= 11 && diffDias <= 18) frequencia = 'quinzenal';
      else if (diffDias > 18) frequencia = 'mensal';
      else frequencia = 'semanal';
    }

    let diaSemanaAlvo = 2; // Padrão: Terça-feira
    let horaInicio = 9;
    let minutoInicio = 0;
    let duracaoHoras = 4;
    let ajudantesEscaladas = ultimaFaxina?.ajudantesEscaladas || [];
    let dormitorios = cliente.dormitorios || ultimaFaxina?.dormitorios || 2;
    let valorCobrado = cliente.valorFechado || ultimaFaxina?.valorCliente || planoObj?.valorBase || 190;
    let formaPagamento = ultimaFaxina?.formaPagamentoCliente || 'PIX';
    let observacoes = ultimaFaxina?.observacoes || cliente.observacoes || '';

    if (ultimaFaxina?.dataHoraInicio) {
      const dUltima = new Date(ultimaFaxina.dataHoraInicio);
      diaSemanaAlvo = dUltima.getDay();
      horaInicio = dUltima.getHours();
      minutoInicio = dUltima.getMinutes();

      if (ultimaFaxina.dataHoraFim) {
        const dFim = new Date(ultimaFaxina.dataHoraFim);
        duracaoHoras = Math.max(2, Math.round((dFim.getTime() - dUltima.getTime()) / (1000 * 60 * 60)));
      }
    }

    const todasDatasNoMes = getDatasDoMesPorDiaSemana(
      anoDestino,
      mesDestino,
      diaSemanaAlvo,
      horaInicio,
      minutoInicio,
      duracaoHoras
    );

    let datasSelecionadas = [];
    if (frequencia === 'semanal') {
      datasSelecionadas = todasDatasNoMes;
    } else if (frequencia === 'quinzenal') {
      datasSelecionadas = todasDatasNoMes.filter((_, idx) => idx % 2 === 0);
    } else if (frequencia === 'mensal') {
      datasSelecionadas = todasDatasNoMes.slice(0, 1);
    }

    const agendamentosJaExistentesNoMes = agendamentos.filter(a => {
      if (a.clienteId !== cliente.id) return false;
      if (!a.dataHoraInicio) return false;
      const d = new Date(a.dataHoraInicio);
      return d.getFullYear() === anoDestino && d.getMonth() === mesDestino;
    });

    const datasNaoAgendadas = datasSelecionadas.filter(novaData => {
      const diaNova = novaData.dataHoraInicio.slice(0, 10);
      return !agendamentosJaExistentesNoMes.some(existente => existente.dataHoraInicio.slice(0, 10) === diaNova);
    });

    if (datasNaoAgendadas.length > 0) {
      clientesProjetados.push({
        cliente,
        planoObj,
        planoId,
        frequencia,
        diaSemanaNome: DIAS_SEMANA_NOMES[diaSemanaAlvo],
        diaSemanaAlvo,
        horaFormatada: `${String(horaInicio).padStart(2, '0')}:${String(minutoInicio).padStart(2, '0')}`,
        dormitorios,
        valorPorFaxina: Number(valorCobrado),
        formaPagamento,
        ajudantesEscaladas,
        observacoes,
        datasCalculadas: datasNaoAgendadas,
        totalFaxinas: datasNaoAgendadas.length,
        totalPrevisto: datasNaoAgendadas.length * Number(valorCobrado),
        jaTemAgendamentosNoMes: agendamentosJaExistentesNoMes.length > 0,
        selecionado: true
      });
    }
  });

  return clientesProjetados;
};
