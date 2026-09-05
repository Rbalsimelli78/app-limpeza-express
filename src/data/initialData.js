// Dados iniciais e catálogo oficial da Limpeza Express SP

export const SERVICOS_CATALOGO_PADRAO = [
  { id: 1, item: 'Varrer e Passar Pano no Piso', detalhe: 'Remoção eficiente de poeira, sujeira e detritos em todo apartamento.' },
  { id: 2, item: 'Limpeza de Móveis e Eletrônicos', detalhe: 'Remoção cuidadosa do pó exterior de móveis.' },
  { id: 3, item: 'Cozinha', detalhe: 'Lavagem do piso, limpeza de pia e bancadas, higienização de fogão e parte externa do forno, limpeza externa de armários, geladeira e micro-ondas.' },
  { id: 4, item: 'Banheiro', detalhe: 'Lavagem piso, higienização de vaso sanitário, pia e espelhos, limpeza de box e piso.' },
  { id: 5, item: 'Organização de Quarto', detalhe: 'Arrumação da cama ou troca de lençóis.' },
  { id: 6, item: 'Janelas', detalhe: 'Limpeza interna e externa dos vidros acessíveis.' },
  { id: 7, item: 'Varanda', detalhe: 'Limpeza piso e vidros de sacada/proteção.' },
  { id: 8, item: 'Gestão do Lixo', detalhe: 'Retirada e reposição de sacos de lixo.' },
  { id: 9, item: 'Organização de Itens Diários', detalhe: 'Arrumação de itens do dia a dia para evitar desordem (vassoura, rodo, aspirador de pó etc).' }
];

export const PLANOS_CATALOGO = [
  {
    id: 'plano-semanal',
    nome: 'Plano Semanal 2 dormitórios',
    dormitoriosBase: 2,
    valorBase: 170.00,
    acrescimoPorQuartoExtra: 30.00,
    taxaSemManutencao: 50.00,
    frequencia: 'Semanal (1x por semana)',
    tempoEstimado: '3 a 5hs',
    profissionais: 2,
    destaque: 'Mais Econômico',
    descricao: 'Faxina completa 2 profissionais, ideal para manter o apartamento sempre impecável.',
    avisoCancelamento: 'No caso de cancelamento avisar com 48hs de antecedência ou será cobrado 50% da sua reserva!!!',
    servicosOferecidos: SERVICOS_CATALOGO_PADRAO
  },
  {
    id: 'plano-quinzenal',
    nome: 'Plano Quinzenal 2 dormitórios',
    dormitoriosBase: 2,
    valorBase: 190.00,
    acrescimoPorQuartoExtra: 30.00,
    taxaSemManutencao: 50.00,
    frequencia: 'Quinzenal (a cada 15 dias)',
    tempoEstimado: '3 a 5hs',
    profissionais: 2,
    destaque: 'Mais Popular',
    descricao: 'Faxina completa 2 profissionais, equilíbrio perfeito para manutenção contínua.',
    avisoCancelamento: 'No caso de cancelamento avisar com 48hs de antecedência ou será cobrado 50% da sua reserva!!!',
    servicosOferecidos: SERVICOS_CATALOGO_PADRAO
  },
  {
    id: 'plano-mensal',
    nome: 'Plano Mensal 2 dormitórios',
    dormitoriosBase: 2,
    valorBase: 200.00,
    acrescimoPorQuartoExtra: 30.00,
    taxaSemManutencao: 50.00,
    frequencia: 'Mensal (1x por mês)',
    tempoEstimado: '3 a 5hs',
    profissionais: 2,
    destaque: 'Faxina Completa',
    descricao: 'Faxina profunda e detalhada com 2 profissionais para renovar o apartamento.',
    avisoCancelamento: 'No caso de cancelamento avisar com 48hs de antecedência ou será cobrado 50% da sua reserva!!!',
    servicosOferecidos: SERVICOS_CATALOGO_PADRAO
  }
];

export const REGRAS_ADICIONAIS = {
  acrescimoPorQuartoExtra: 30.00, // +R$ 30,00 para 3 quartos
  taxaSemManutencao2Meses: 50.00, // +R$ 50,00 se sem faxina > 2 meses
  multaCancelamento48hPercent: 50 // 50% se cancelado com < 48h
};

export const CHECKLIST_PADRAO = [
  { id: 1, item: 'Varrer e Passar Pano no Piso', detalhe: 'Remoção eficiente de poeira, sujeira e detritos em todo apartamento.' },
  { id: 2, item: 'Limpeza de Móveis e Eletrônicos', detalhe: 'Remoção cuidadosa do pó exterior de móveis e superfícies.' },
  { id: 3, item: 'Cozinha', detalhe: 'Lavagem do piso, pia, bancadas, higienização do fogão/forno externo e armários/eletros externos.' },
  { id: 4, item: 'Banheiro', detalhe: 'Lavagem de piso, higienização de vaso sanitário, pia, espelhos, box e metais.' },
  { id: 5, item: 'Organização de Quarto', detalhe: 'Arrumação da cama ou troca completa de lençóis e fronhas.' },
  { id: 6, item: 'Janelas', detalhe: 'Limpeza interna e externa dos vidros acessíveis.' },
  { id: 7, item: 'Varanda', detalhe: 'Lavagem do piso e limpeza dos vidros de proteção/sacada.' },
  { id: 8, item: 'Gestão do Lixo', detalhe: 'Retirada e reposição dos sacos de lixo de todos os cômodos.' },
  { id: 9, item: 'Organização de Itens Diários', detalhe: 'Arrumação de itens do dia a dia para evitar desordem (vassouras, rodos, sapatos).' }
];

export const CLIENTES_INICIAIS = [
  {
    id: 'cli-1',
    nome: 'Mariana Albuquerque',
    telefone: '11987654321',
    endereco: 'Rua Oscar Freire, 1420',
    apartamento: 'Apto 82 - Bloco B',
    bairro: 'Jardins',
    cidade: 'São Paulo - SP',
    cep: '01426-001',
    dormitorios: 2,
    metragem: '85m²',
    planoPadraoId: 'plano-quinzenal',
    observacoes: 'Possui um cachorrinho pequeno dócil (Pipoca). Portaria 24h com liberação facial.',
    criadoEm: '2026-08-10'
  },
  {
    id: 'cli-2',
    nome: 'Rodrigo Fagundes',
    telefone: '11971238899',
    endereco: 'Av. Giovanni Gronchi, 3500',
    apartamento: 'Apto 104',
    bairro: 'Morumbi',
    cidade: 'São Paulo - SP',
    cep: '05724-001',
    dormitorios: 3, // +30 adicionais
    metragem: '100m²',
    planoPadraoId: 'plano-semanal',
    observacoes: 'Deixar chave sempre na portaria social. Solicita foco extra na varanda.',
    criadoEm: '2026-08-15'
  },
  {
    id: 'cli-3',
    nome: 'Camila & Fernando Vasconcelos',
    telefone: '11999881122',
    endereco: 'Rua Pamplona, 980',
    apartamento: 'Apto 51',
    bairro: 'Bela Vista / Jardins',
    cidade: 'São Paulo - SP',
    cep: '01405-001',
    dormitorios: 2,
    metragem: '90m²',
    planoPadraoId: 'plano-mensal',
    observacoes: 'Gostam de produtos sem cheiro forte de eucalipto.',
    criadoEm: '2026-08-20'
  },
  {
    id: 'cli-4',
    nome: 'Lucas & Beatriz Mendes',
    telefone: '11988776655',
    endereco: 'Rua Vergueiro, 2200',
    apartamento: 'Apto 12 - Bloco A',
    bairro: 'Vila Mariana',
    cidade: 'São Paulo - SP',
    cep: '04102-000',
    dormitorios: 2,
    metragem: '80m²',
    planoPadraoId: 'plano-semanal',
    observacoes: 'Atendimento sempre no período da manhã a partir das 08h30.',
    criadoEm: '2026-08-22'
  }
];

export const AJUDANTES_INICIAIS = [
  {
    id: 'ajud-1',
    nome: 'Maria das Dores Silva',
    telefone: '11981112233',
    chavePix: '11981112233',
    tipoPix: 'Telefone',
    tipoRemuneracao: 'diaria', // 'diaria' ou 'hora'
    valorPadrao: 90.00,
    especialidade: 'Cozinha e Banheiros pesados',
    status: 'ativo'
  },
  {
    id: 'ajud-2',
    nome: 'Cleide Souza Rocha',
    telefone: '11982223344',
    chavePix: 'cleide.rocha.limpeza@gmail.com',
    tipoPix: 'E-mail',
    tipoRemuneracao: 'diaria',
    valorPadrao: 90.00,
    especialidade: 'Quartos, Janelas e Varanda',
    status: 'ativo'
  },
  {
    id: 'ajud-3',
    nome: 'Valdirene dos Santos',
    telefone: '11983334455',
    chavePix: '123.456.789-00',
    tipoPix: 'CPF',
    tipoRemuneracao: 'hora',
    valorPadrao: 25.00, // R$ 25/hora
    especialidade: 'Faxinas express e apoio rápido',
    status: 'ativo'
  }
];

// Gera datas dinâmicas próximas a hoje para os testes iniciais
const getHojeIso = (diasOffset = 0, hora = '09:00') => {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${hora}:00`;
};

export const AGENDAMENTOS_INICIAIS = [
  {
    id: 'agend-1',
    clienteId: 'cli-1',
    planoId: 'plano-quinzenal',
    dataHoraInicio: getHojeIso(0, '09:00'),
    dataHoraFim: getHojeIso(0, '13:00'),
    dormitorios: 2,
    semManutencao2Meses: false,
    valorCliente: 190.00,
    statusClientePagamento: 'pago', // 'pendente', 'pago', 'cancelado'
    formaPagamentoCliente: 'PIX',
    ajudantesEscaladas: [
      { ajudanteId: 'ajud-1', tipo: 'diaria', valorAPagar: 85.00, statusPagamento: 'pendente' },
      { ajudanteId: 'ajud-2', tipo: 'diaria', valorAPagar: 85.00, statusPagamento: 'pendente' }
    ],
    statusServico: 'confirmado', // 'agendado', 'confirmado', 'concluido', 'cancelado'
    observacoes: 'Confirmado com o cliente no WhatsApp ontem.',
    googleEventId: null
  },
  {
    id: 'agend-2',
    clienteId: 'cli-2',
    planoId: 'plano-semanal',
    dataHoraInicio: getHojeIso(1, '13:30'),
    dataHoraFim: getHojeIso(1, '17:30'),
    dormitorios: 3, // 170 + 30 = 200
    semManutencao2Meses: false,
    valorCliente: 200.00,
    statusClientePagamento: 'pendente',
    formaPagamentoCliente: 'PIX',
    ajudantesEscaladas: [
      { ajudanteId: 'ajud-1', tipo: 'diaria', valorAPagar: 90.00, statusPagamento: 'pendente' },
      { ajudanteId: 'ajud-2', tipo: 'diaria', valorAPagar: 90.00, statusPagamento: 'pendente' }
    ],
    statusServico: 'agendado',
    observacoes: 'Apartamento de 3 dormitórios (+R$ 30).',
    googleEventId: null
  },
  {
    id: 'agend-3',
    clienteId: 'cli-3',
    planoId: 'plano-mensal',
    dataHoraInicio: getHojeIso(3, '08:30'),
    dataHoraFim: getHojeIso(3, '13:30'),
    dormitorios: 2,
    semManutencao2Meses: true, // 200 + 50 = 250
    valorCliente: 250.00,
    statusClientePagamento: 'pendente',
    formaPagamentoCliente: 'PIX',
    ajudantesEscaladas: [
      { ajudanteId: 'ajud-1', tipo: 'diaria', valorAPagar: 95.00, statusPagamento: 'pendente' },
      { ajudanteId: 'ajud-2', tipo: 'diaria', valorAPagar: 95.00, statusPagamento: 'pendente' }
    ],
    statusServico: 'agendado',
    observacoes: 'Apto sem faxina há mais de 2 meses (+R$ 50 adicionais). Faxina profunda.',
    googleEventId: null
  },
  {
    id: 'agend-4',
    clienteId: 'cli-4',
    planoId: 'plano-semanal',
    dataHoraInicio: getHojeIso(-2, '09:00'),
    dataHoraFim: getHojeIso(-2, '13:00'),
    dormitorios: 2,
    semManutencao2Meses: false,
    valorCliente: 170.00,
    statusClientePagamento: 'pago',
    formaPagamentoCliente: 'PIX',
    ajudantesEscaladas: [
      { ajudanteId: 'ajud-1', tipo: 'diaria', valorAPagar: 80.00, statusPagamento: 'pago' },
      { ajudanteId: 'ajud-3', tipo: 'hora', horasTrabalhadas: 4, valorAPagar: 80.00, statusPagamento: 'pago' }
    ],
    statusServico: 'concluido',
    observacoes: 'Faxina realizada e elogiada pelo cliente.',
    googleEventId: null
  }
];
