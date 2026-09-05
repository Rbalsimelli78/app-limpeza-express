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
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${endereco}, ${bairro}, São Paulo`)}`;

  return `Oi ${ajudanteNome}! Segue sua escala de trabalho pela *Limpeza Express SP*:

📅 *Data:* ${dataFormatada} às ${horaFormatada}
🏢 *Cliente:* ${clienteNome}
📍 *Endereço:* ${endereco}, ${apartamento || ''} - ${bairro}
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
