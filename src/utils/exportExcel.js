// Utilitário para Exportação em Formato CSV / Excel (.csv com BOM e separador ;)
// Compatível com Microsoft Excel no Brasil, LibreOffice e Google Planilhas.

export const downloadCsv = (filename, content) => {
  // \uFEFF é o Byte Order Mark (BOM) que informa ao Excel que o arquivo está em UTF-8
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Exportar Extrato de Cliente
export const exportExtratoClienteCsv = ({ cliente, agendamentos, totalGeral, totalPago, totalPendente, periodoDesc }) => {
  const rows = [];

  // Cabeçalho institucional
  rows.push(['LIMPEZA EXPRESS SP - EXTRATO FINANCEIRO DE CLIENTE']);
  rows.push([`Cliente: ${cliente.nome}`]);
  rows.push([`Telefone: ${cliente.telefone || 'Não informado'}`]);
  rows.push([`Endereço: ${cliente.endereco || ''} ${cliente.apartamento || ''} - ${cliente.bairro || ''}`]);
  rows.push([`Período: ${periodoDesc}`]);
  rows.push([`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`]);
  rows.push([]); // Linha em branco

  // Cabeçalho da Tabela
  rows.push(['Data da Faxina', 'Dia da Semana', 'Plano / Serviço', 'Dormitórios', 'Status Pagamento', 'Valor (R$)']);

  // Linhas de dados
  agendamentos.forEach((ag) => {
    const dataObj = new Date(ag.dataHoraInicio);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const statusText = ag.statusClientePagamento === 'pago' ? 'PAGO' : 'PENDENTE';
    const valorNum = Number(ag.valorCliente || 0).toFixed(2).replace('.', ',');

    rows.push([
      dataFormatada,
      diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      ag.planoNome || 'Plano de Limpeza',
      `${ag.dormitorios || 2} dorms`,
      statusText,
      `R$ ${valorNum}`
    ]);
  });

  rows.push([]); // Linha em branco
  // Resumo Financeiro
  rows.push(['RESUMO DO PERÍODO', '', '', '', '', '']);
  rows.push(['Total de Faxinas Realizadas:', `${agendamentos.length}`, '', '', '', '']);
  rows.push(['Total Já Pago / Quitado:', `R$ ${Number(totalPago).toFixed(2).replace('.', ',')}`, '', '', '', '']);
  rows.push(['Saldo Pendente:', `R$ ${Number(totalPendente).toFixed(2).replace('.', ',')}`, '', '', '', '']);
  rows.push(['TOTAL GERAL NO PERÍODO:', `R$ ${Number(totalGeral).toFixed(2).replace('.', ',')}`, '', '', '', '']);

  const csvString = rows
    .map(row => row.map(escapeCell).join(';'))
    .join('\r\n');

  const safeName = cliente.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadCsv(`extrato_cliente_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, csvString);
};

// Exportar Extrato de Ajudante
export const exportExtratoAjudanteCsv = ({ ajudante, historicoDiarias, totalGeral, totalPago, totalPendente, periodoDesc }) => {
  const rows = [];

  // Cabeçalho institucional
  rows.push(['LIMPEZA EXPRESS SP - EXTRATO DE DIÁRIAS DA COLABORADORA']);
  rows.push([`Colaboradora: ${ajudante.nome}`]);
  rows.push([`Telefone: ${ajudante.telefone || 'Não informado'}`]);
  rows.push([`Chave PIX: ${ajudante.chavePix || 'Não informada'} (${ajudante.tipoPix || 'Chave'})`]);
  rows.push([`Remuneração Base: R$ ${Number(ajudante.valorPadrao || 0).toFixed(2).replace('.', ',')} / ${ajudante.tipoRemuneracao === 'diaria' ? 'diária' : 'hora'}`]);
  rows.push([`Período: ${periodoDesc}`]);
  rows.push([`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`]);
  rows.push([]); // Linha em branco

  // Cabeçalho da Tabela
  rows.push(['Data da Diária', 'Dia da Semana', 'Cliente Atendido', 'Endereço', 'Status Diária', 'Chave PIX Destino', 'Valor da Diária (R$)']);

  // Linhas de dados
  historicoDiarias.forEach((h) => {
    const dataObj = new Date(h.dataHora);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const statusText = h.statusPagamento === 'pago' ? 'PAGO' : 'A PAGAR';
    const valorNum = Number(h.valor || 0).toFixed(2).replace('.', ',');

    rows.push([
      dataFormatada,
      diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      h.clienteNome || 'Cliente',
      h.endereco || 'São Paulo - SP',
      statusText,
      ajudante.chavePix || '',
      `R$ ${valorNum}`
    ]);
  });

  rows.push([]); // Linha em branco
  // Resumo Financeiro
  rows.push(['RESUMO DO PERÍODO', '', '', '', '', '', '']);
  rows.push(['Total de Diárias Realizadas:', `${historicoDiarias.length}`, '', '', '', '', '']);
  rows.push(['Total Já Pago / Transferido:', `R$ ${Number(totalPago).toFixed(2).replace('.', ',')}`, '', '', '', '', '']);
  rows.push(['Saldo Pendente a Pagar (PIX):', `R$ ${Number(totalPendente).toFixed(2).replace('.', ',')}`, '', '', '', '', '']);
  rows.push(['TOTAL GERAL APURADO:', `R$ ${Number(totalGeral).toFixed(2).replace('.', ',')}`, '', '', '', '', '']);

  const safeName = ajudante.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadCsv(`extrato_diarias_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, csvString);
};
