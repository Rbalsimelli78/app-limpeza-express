// Utilitário para geração de links e mensagens automáticas do WhatsApp

export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
};

export const getWhatsAppUrl = (phone, text = '') => {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return '#';
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};

/**
 * Gera texto de orçamento detalhado para enviar ao cliente no WhatsApp
 */
export const buildOrcamentoText = ({
  clienteNome,
  plano,
  dormitorios,
  semManutencao,
  valorFinal,
  endereco
}) => {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  
  let resumoExtras = [];
  if (dormitorios > 2) {
    resumoExtras.push(`• Acréscimo 3º Dormitório: +R$ 30,00`);
  }
  if (semManutencao) {
    resumoExtras.push(`• Taxa imóvel sem manutenção (> 2 meses): +R$ 50,00`);
  }

  return `Olá ${clienteNome || 'Cliente'}, tudo bem? Aqui é da *Limpeza Express SP*! ✨

Conforme conversamos, segue a sua proposta personalizada:

📋 *PROPOSTA DE LIMPEZA RESIDENCIAL*
📅 Data da Proposta: ${dataHoje}
🏠 Imóvel: Apartamento (${dormitorios} dormitórios)
${endereco ? `📍 Local: ${endereco}\n` : ''}
⭐️ *${plano.nome.toUpperCase()}*
⏱️ Tempo estimado: ${plano.tempoEstimado}
👥 Equipe: ${plano.profissionais} profissionais de limpeza
💰 *Valor Total: R$ ${valorFinal.toFixed(2).replace('.', ',')}*

${resumoExtras.length > 0 ? `*Adicionais aplicados:*\n${resumoExtras.join('\n')}\n` : ''}
*Serviços Oferecidos neste Pacote:*
1. 🧹 Varrer e Passar Pano em todo piso
2. 🛋️ Limpeza de Móveis e Eletrônicos (pó externo)
3. 🍳 Cozinha: Piso, pia, bancadas, fogão externo, micro-ondas e geladeira externa
4. 🚿 Banheiro: Piso, sanitário, pia, espelhos e box
5. 🛏️ Organização de Quarto: Arrumação ou troca de lençóis
6. 🪟 Janelas: Limpeza interna e externa
7. 🪴 Varanda: Piso e vidros
8. 🗑️ Gestão do Lixo: Retirada e reposição dos sacos
9. 🧺 Organização de Itens Diários

⚠️ *Avisos Importantes:*
• Em caso de cancelamento, avisar com 48hs de antecedência ou será cobrado 50% da reserva.

Podemos confirmar o agendamento da sua faxina? Aguardo seu retorno para reservar na agenda! 📲`;
};

/**
 * Mensagem para enviar para a ajudante/diarista com a escala de trabalho
 */
export const buildEscalaAjudanteText = ({
  ajudanteNome,
  clienteNome,
  condominio,
  torre,
  endereco,
  apartamento,
  bairro,
  dataHoraInicio,
  observacoes,
  valorDiaria
}) => {
  const d = new Date(dataHoraInicio);
  const dataFormatada = d.toLocaleDateString('pt-BR');
  const horaFormatada = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const mapsQuery = condominio ? `${condominio}, ${endereco}, ${bairro}, São Paulo` : `${endereco}, ${bairro}, São Paulo`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  let linhaLocal = '';
  if (condominio) {
    linhaLocal += `🏢 *Condomínio:* ${condominio}\n`;
  }
  if (torre || apartamento) {
    linhaLocal += `🚪 *Torre/Apto:* ${torre ? `${torre} - ` : ''}${apartamento || ''}\n`;
  }
  linhaLocal += `📍 *Endereço:* ${endereco ? `${endereco} - ` : ''}${bairro}`;

  return `Oi ${ajudanteNome}! Segue sua escala de trabalho pela *Limpeza Express SP*:

📅 *Data:* ${dataFormatada} às ${horaFormatada}
👤 *Cliente:* ${clienteNome}
${linhaLocal}
🗺️ *Localização no Maps:* ${mapsLink}
💰 *Sua diária/valor deste serviço:* R$ ${Number(valorDiaria || 0).toFixed(2).replace('.', ',')}
ℹ️ *Avisos/Obs:* ${observacoes || 'Chegar 10 minutos antes.'}

Por favor, confirme o recebimento desta escala! Obrigado! ✨`;
};

/**
 * Mensagem de lembrete para o cliente 24h antes
 */
export const buildLembreteClienteText = ({
  clienteNome,
  dataHoraInicio,
  planoNome,
  valorTotal
}) => {
  const d = new Date(dataHoraInicio);
  const dataFormatada = d.toLocaleDateString('pt-BR');
  const horaFormatada = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return `Olá ${clienteNome}! Passando para lembrar da sua faxina da *Limpeza Express SP* amanhã (${dataFormatada}) às ${horaFormatada} (${planoNome}).
Nossa equipe estará pontualmente no seu endereço! 
Qualquer dúvida ou necessidade, estamos à disposição. Até amanhã! ✨`;
};

/**
 * Mensagem de apresentação completa do plano e catálogo para enviar ao cliente
 */
export const buildApresentacaoPlanoText = (plano, clienteNome = '') => {
  const saudacao = clienteNome ? `Olá ${clienteNome}! Tudo bem?` : `Olá! Tudo bem?`;
  
  const servicosTexto = (plano.servicosOferecidos || [])
    .map((s, idx) => `${idx + 1}. *${s.item}:*\n• ${s.detalhe}`)
    .join('\n\n');

  const acrescimoQuarto = plano.acrescimoPorQuartoExtra 
    ? `👉 *3 dormitórios:* acrescer +R$ ${Number(plano.acrescimoPorQuartoExtra).toFixed(2).replace('.', ',')}\n` 
    : '';

  return `${saudacao} Seguem os detalhes do nosso pacote de limpeza residencial pela *Limpeza Express SP* ✨:

✨ *${(plano.nome || 'Plano de Limpeza').toUpperCase()}*
💰 *Valor:* R$ ${Number(plano.valorBase || 0).toFixed(2).replace('.', ',')}
${acrescimoQuarto}⏱️ *Tempo estimado:* ${plano.tempoEstimado || '3 a 5hs'}
👥 *Equipe:* Faxina completa com ${plano.profissionais || 2} profissionais

📋 *Serviços Oferecidos neste pacote:*

${servicosTexto}

Estamos à disposição para atender às suas necessidades de limpeza! 🏡✨

⚠️ *Aviso importante:*
${plano.avisoCancelamento || 'No caso de cancelamento avisar com 48hs de antecedência ou será cobrado 50% da sua reserva!!!'}`;
};

/**
 * Mensagem de extrato financeiro para o cliente
 */
export const buildExtratoClienteText = ({
  clienteNome,
  periodoDesc,
  agendamentos,
  totalGeral,
  totalPago,
  totalPendente
}) => {
  const listaFaxinas = agendamentos.map((ag) => {
    const data = new Date(ag.dataHoraInicio).toLocaleDateString('pt-BR');
    const valor = Number(ag.valorCliente || 0).toFixed(2).replace('.', ',');
    const status = ag.statusClientePagamento === 'pago' ? '✅ Pago' : '⏳ Pendente';
    return `• *${data}* - ${ag.planoNome || 'Faxina'}: R$ ${valor} (${status})`;
  }).join('\n');

  return `✨ *EXTRATO FINANCEIRO - LIMPEZA EXPRESS SP* ✨

Olá, *${clienteNome}*! Segue o seu demonstrativo de serviços e pagamentos:

📅 *Período:* ${periodoDesc}

📋 *Histórico de Faxinas:*
${listaFaxinas || '• Nenhuma faxina registrada no período.'}

💰 *RESUMO FINANCEIRO:*
✅ Total Quitado: *R$ ${Number(totalPago).toFixed(2).replace('.', ',')}*
⏳ Saldo Pendente: *R$ ${Number(totalPendente).toFixed(2).replace('.', ',')}*
📊 Total Geral: *R$ ${Number(totalGeral).toFixed(2).replace('.', ',')}* (${agendamentos.length} faxinas)

Qualquer dúvida ou comprovante necessário, estamos à disposição! 🧼🧹✨`;
};

/**
 * Mensagem de extrato financeiro para a colaboradora/ajudante
 */
export const buildExtratoAjudanteText = ({
  ajudanteNome,
  periodoDesc,
  historicoDiarias,
  totalGeral,
  totalPago,
  totalPendente,
  chavePix,
  tipoPix
}) => {
  const listaDiarias = historicoDiarias.map((h) => {
    const data = new Date(h.dataHora).toLocaleDateString('pt-BR');
    const valor = Number(h.valor || 0).toFixed(2).replace('.', ',');
    const status = h.statusPagamento === 'pago' ? '✅ Pago' : '⏳ A Pagar';
    return `• *${data}* - Cliente ${h.clienteNome}: R$ ${valor} (${status})`;
  }).join('\n');

  return `✨ *EXTRATO DE DIÁRIAS - LIMPEZA EXPRESS SP* ✨

Olá, *${ajudanteNome}*! Segue o seu extrato de diárias e serviços realizados:

📅 *Período:* ${periodoDesc}
🔑 *Sua Chave PIX cadastrada:* ${chavePix || 'Não informada'} (${tipoPix || 'Chave'})

📋 *Diárias Realizadas:*
${listaDiarias || '• Nenhuma diária registrada no período.'}

💰 *RESUMO DO PERÍODO:*
✅ Total Já Pago / Transferido: *R$ ${Number(totalPago).toFixed(2).replace('.', ',')}*
⏳ Saldo a Pagar: *R$ ${Number(totalPendente).toFixed(2).replace('.', ',')}*
📊 Total de Faxinas: *${historicoDiarias.length} trabalhos*

Muito obrigado pela sua dedicação e excelente trabalho na equipe! ⭐✨`;
};


