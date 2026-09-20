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
  const inicioMesDestino = new Date(anoDestino, mesDestino, 1, 0, 0, 0);

  clientesAtivos.forEach(cliente => {
    // Busca todas as faxinas válidas do cliente ordenadas da mais recente para a mais antiga
    const faxinasCliente = agendamentos
      .filter(a => a.clienteId === cliente.id && a.statusServico !== 'cancelado')
      .sort((a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio));

    // Identifica a última faxina efetuada ou agendada anterior ao mês de destino
    const faxinasAnteriores = faxinasCliente.filter(a => new Date(a.dataHoraInicio) < inicioMesDestino);
    const ultimaFaxinaReferencia = faxinasAnteriores[0] || faxinasCliente[0] || null;

    // Monta o objeto com informações detalhadas da última faxina para exibição em destaque
    let ultimaFaxinaInfo = null;
    if (ultimaFaxinaReferencia?.dataHoraInicio) {
      const dUlt = new Date(ultimaFaxinaReferencia.dataHoraInicio);
      const isEfetuada = ultimaFaxinaReferencia.statusServico === 'concluido';
      const isAgendada = ultimaFaxinaReferencia.statusServico === 'confirmado' || ultimaFaxinaReferencia.statusServico === 'pendente';
      const statusTexto = isEfetuada 
        ? 'Efetuada (Concluída)' 
        : (isAgendada ? 'Agendada (Pendente de realização)' : 'Agendada');

      ultimaFaxinaInfo = {
        id: ultimaFaxinaReferencia.id,
        dataHoraInicio: ultimaFaxinaReferencia.dataHoraInicio,
        dataHoraFim: ultimaFaxinaReferencia.dataHoraFim,
        dataObj: dUlt,
        diaSemanaExtenso: DIAS_SEMANA_NOMES[dUlt.getDay()],
        diaFormatado: formatDateWithWeekday(dUlt),
        dataCurta: dUlt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        horaFormatada: `${String(dUlt.getHours()).padStart(2, '0')}:${String(dUlt.getMinutes()).padStart(2, '0')}`,
        statusServico: ultimaFaxinaReferencia.statusServico,
        isEfetuada,
        statusTexto,
        statusPagamento: ultimaFaxinaReferencia.statusClientePagamento || 'pendente',
        ajudantesEscaladas: ultimaFaxinaReferencia.ajudantesEscaladas || [],
        valorCliente: ultimaFaxinaReferencia.valorCliente
      };
    }

    const planoId = cliente.planoPadraoId || ultimaFaxinaReferencia?.planoId || 'plano-quinzenal';
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
    let ajudantesEscaladas = ultimaFaxinaReferencia?.ajudantesEscaladas || [];
    let dormitorios = cliente.dormitorios || ultimaFaxinaReferencia?.dormitorios || 2;
    let valorCobrado = cliente.valorFechado || ultimaFaxinaReferencia?.valorCliente || planoObj?.valorBase || 190;
    let formaPagamento = ultimaFaxinaReferencia?.formaPagamentoCliente || 'PIX';
    let observacoes = ultimaFaxinaReferencia?.observacoes || cliente.observacoes || '';

    if (ultimaFaxinaReferencia?.dataHoraInicio) {
      const dUltima = new Date(ultimaFaxinaReferencia.dataHoraInicio);
      diaSemanaAlvo = dUltima.getDay();
      horaInicio = dUltima.getHours();
      minutoInicio = dUltima.getMinutes();

      if (ultimaFaxinaReferencia.dataHoraFim) {
        const dFim = new Date(ultimaFaxinaReferencia.dataHoraFim);
        duracaoHoras = Math.max(2, Math.round((dFim.getTime() - dUltima.getTime()) / (1000 * 60 * 60)));
      }
    }
    const duracaoMs = duracaoHoras * 60 * 60 * 1000;

    let datasCalculadas = [];

    // Se temos a última faxina de referência, calculamos com base no ritmo exato dela:
    if (ultimaFaxinaReferencia?.dataHoraInicio) {
      const dUlt = new Date(ultimaFaxinaReferencia.dataHoraInicio);

      if (frequencia === 'semanal') {
        // Passo semanal: +7 dias a partir da data da última faxina
        let cursor = new Date(dUlt);
        cursor.setHours(horaInicio, minutoInicio, 0, 0);

        // Avança enquanto for anterior ao mês de destino
        while (cursor.getTime() < inicioMesDestino.getTime()) {
          cursor.setDate(cursor.getDate() + 7);
        }

        // Coleta todas as semanas dentro do mês de destino
        while (cursor.getFullYear() === anoDestino && cursor.getMonth() === mesDestino) {
          const inicio = new Date(cursor);
          const fim = new Date(inicio.getTime() + duracaoMs);
          datasCalculadas.push({
            dataHoraInicio: toDatetimeLocalString(inicio),
            dataHoraFim: toDatetimeLocalString(fim),
            dataObj: new Date(inicio),
            diaSemana: getDiaSemanaExtenso(inicio),
            diaFormatado: formatDateWithWeekday(inicio),
            horaFormatada: `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`
          });
          cursor.setDate(cursor.getDate() + 7);
        }
      } else if (frequencia === 'quinzenal') {
        // Passo quinzenal: exatamente +14 dias a partir da última faxina (mantém a cadência sem quebras no início do mês)
        let cursor = new Date(dUlt);
        cursor.setHours(horaInicio, minutoInicio, 0, 0);

        // Avança de 14 em 14 dias até entrar no mês de destino
        while (cursor.getTime() < inicioMesDestino.getTime()) {
          cursor.setDate(cursor.getDate() + 14);
        }

        // Coleta as datas da quinzena dentro do mês de destino
        while (cursor.getFullYear() === anoDestino && cursor.getMonth() === mesDestino) {
          const inicio = new Date(cursor);
          const fim = new Date(inicio.getTime() + duracaoMs);
          datasCalculadas.push({
            dataHoraInicio: toDatetimeLocalString(inicio),
            dataHoraFim: toDatetimeLocalString(fim),
            dataObj: new Date(inicio),
            diaSemana: getDiaSemanaExtenso(inicio),
            diaFormatado: formatDateWithWeekday(inicio),
            horaFormatada: `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`
          });
          cursor.setDate(cursor.getDate() + 14);
        }
      } else if (frequencia === 'mensal') {
        // Passo mensal: busca a data do mesmo dia da semana no mês destino que dista aproximadamente 1 mês da última
        const todasDatasDoDia = getDatasDoMesPorDiaSemana(
          anoDestino,
          mesDestino,
          diaSemanaAlvo,
          horaInicio,
          minutoInicio,
          duracaoHoras
        );

        const alvoAproximado = new Date(dUlt);
        alvoAproximado.setMonth(alvoAproximado.getMonth() + 1);

        let melhorData = todasDatasDoDia[0];
        let menorDiff = Infinity;
        todasDatasDoDia.forEach(dt => {
          const diff = Math.abs(dt.dataObj.getTime() - alvoAproximado.getTime());
          if (diff < menorDiff) {
            menorDiff = diff;
            melhorData = dt;
          }
        });

        if (melhorData) {
          datasCalculadas = [melhorData];
        }
      }
    } else {
      // Cliente novo (sem faxina anterior registrada): fallback no calendário do mês
      const todasDatasNoMes = getDatasDoMesPorDiaSemana(
        anoDestino,
        mesDestino,
        diaSemanaAlvo,
        horaInicio,
        minutoInicio,
        duracaoHoras
      );

      if (frequencia === 'semanal') {
        datasCalculadas = todasDatasNoMes;
      } else if (frequencia === 'quinzenal') {
        datasCalculadas = todasDatasNoMes.filter((_, idx) => idx % 2 === 0);
      } else if (frequencia === 'mensal') {
        datasCalculadas = todasDatasNoMes.slice(0, 1);
      }
    }

    // Exclui datas que já estejam agendadas no mês para este cliente
    const agendamentosJaExistentesNoMes = agendamentos.filter(a => {
      if (a.clienteId !== cliente.id) return false;
      if (!a.dataHoraInicio) return false;
      const d = new Date(a.dataHoraInicio);
      return d.getFullYear() === anoDestino && d.getMonth() === mesDestino;
    });

    const datasNaoAgendadas = datasCalculadas.filter(novaData => {
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
        ultimaFaxinaInfo,
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
