// Utilitário de Sincronização com Google Agenda e Calendário iCal

const formatToGoogleUtc = (date) => {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Gera URL direta para criar evento no Google Calendar (Web ou App móvel)
 */
export const generateGoogleCalendarUrl = (agendamento, cliente, plano, ajudantesNomes = []) => {
  if (!agendamento || !cliente) return '';

  const startDate = new Date(agendamento.dataHoraInicio);
  // Se não houver fim, calcula 4 horas de duração padrão
  const endDate = agendamento.dataHoraFim 
    ? new Date(agendamento.dataHoraFim) 
    : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

  const title = `🧹 Limpeza Express SP - ${cliente.nome}`;
  const location = `${cliente.endereco || ''}, ${cliente.apartamento || ''} - ${cliente.bairro || 'São Paulo - SP'}`;
  
  const equipeStr = ajudantesNomes.length > 0 
    ? ajudantesNomes.join(' e ') 
    : '2 Profissionais Limpeza Express';

  const details = [
    `🏢 CLIENTE: ${cliente.nome}`,
    `📱 WHATSAPP: ${cliente.telefone || 'Não informado'}`,
    `📍 ENDEREÇO: ${location}`,
    `📋 PLANO: ${plano?.nome || 'Limpeza Residencial'}`,
    `🛏️ DORMITÓRIOS: ${agendamento.dormitorios || 2} dorms`,
    `👥 EQUIPE ESCALADA: ${equipeStr}`,
    `💰 VALOR TOTAL: R$ ${Number(agendamento.valorCliente || 0).toFixed(2)}`,
    `ℹ️ OBSERVAÇÕES: ${agendamento.observacoes || cliente.observacoes || 'Nenhuma'}`,
    `-----------------------------`,
    `✨ Limpeza Express SP - O Toque Final na Sua Casa`
  ].join('\n');

  const startIso = formatToGoogleUtc(startDate);
  const endIso = formatToGoogleUtc(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startIso}/${endIso}`,
    details: details,
    location: location,
    sf: 'true',
    output: 'xml'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Faz o download de um arquivo .ics (formato padrão do Google Agenda, Outlook e Apple Calendar)
 */
export const downloadIcsFile = (agendamento, cliente, plano, ajudantesNomes = []) => {
  const startDate = new Date(agendamento.dataHoraInicio);
  const endDate = agendamento.dataHoraFim 
    ? new Date(agendamento.dataHoraFim) 
    : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

  const startIso = formatToGoogleUtc(startDate);
  const endIso = formatToGoogleUtc(endDate);
  const title = `Limpeza Express SP - ${cliente.nome}`;
  const location = `${cliente.endereco || ''}, ${cliente.apartamento || ''} - ${cliente.bairro || 'São Paulo'}`;
  const description = `Plano: ${plano?.nome || 'Express'} | Equipe: ${ajudantesNomes.join(', ')} | Tel: ${cliente.telefone}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Limpeza Express SP//Gestao Operacional//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:limpeza-express-${agendamento.id}-${Date.now()}@limpezaexpress.sp`,
    `DTSTAMP:${formatToGoogleUtc(new Date())}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `faxina-${cliente.nome.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
