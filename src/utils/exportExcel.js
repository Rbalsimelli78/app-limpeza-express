// Utilitário para Exportação em Formato Excel (.xlsx nativo com gráfico) e CSV (.csv legado)
// Totalmente compatível com Microsoft Excel no Brasil, Google Planilhas e LibreOffice.

import ExcelJS from 'exceljs';
import { generateChartImageBase64 } from './chartImageGenerator';

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

// ==========================================
// EXPORTAÇÃO EXCEL (.XLSX COM GRÁFICO EMBUTIDO) - CLIENTE
// ==========================================
export const exportExtratoClienteXlsx = async ({
  cliente,
  agendamentos = [],
  totalGeral = 0,
  totalPago = 0,
  totalPendente = 0,
  periodoDesc = 'Todo o Histórico',
  dadosGrafico = []
}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Limpeza Express SP';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Extrato Financeiro');

  // Configuração das larguras das colunas
  worksheet.columns = [
    { key: 'colA', width: 16 }, // Data
    { key: 'colB', width: 18 }, // Dia da Semana
    { key: 'colC', width: 34 }, // Plano / Serviço
    { key: 'colD', width: 16 }, // Dormitórios
    { key: 'colE', width: 18 }, // Status
    { key: 'colF', width: 20 }, // Valor (R$)
  ];

  // 1. Título Institucional da Empresa
  const titleRow = worksheet.addRow(['LIMPEZA EXPRESS SP - EXTRATO FINANCEIRO']);
  titleRow.height = 32;
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Metadados do Cliente
  worksheet.addRow([]);
  const rCli = worksheet.addRow(['Cliente:', cliente.nome]);
  rCli.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
  rCli.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };

  const rTel = worksheet.addRow(['Telefone / WhatsApp:', cliente.telefone || 'Não informado']);
  rTel.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };

  const endStr = `${cliente.endereco || 'São Paulo - SP'} ${cliente.apartamento ? `, Apto ${cliente.apartamento}` : ''} ${cliente.bairro ? ` - ${cliente.bairro}` : ''}`;
  const rEnd = worksheet.addRow(['Endereço:', endStr]);
  rEnd.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };

  const rPer = worksheet.addRow(['Período de Apuração:', periodoDesc]);
  rPer.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
  rPer.getCell(2).font = { bold: true, color: { argb: 'FF059669' } };

  const rData = worksheet.addRow(['Data de Emissão:', new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR')]);
  rData.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };

  worksheet.addRow([]); // Espaçamento

  // 3. Resumo Financeiro (KPIs)
  const kpiHeaderRow = worksheet.addRow(['RESUMO FINANCEIRO DO PERÍODO']);
  kpiHeaderRow.font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
  worksheet.mergeCells(`A${kpiHeaderRow.number}:F${kpiHeaderRow.number}`);

  const kpiRow1 = worksheet.addRow(['Total de Faxinas Realizadas:', `${agendamentos.length} faxina(s)`]);
  kpiRow1.getCell(1).font = { bold: true };

  const kpiRow2 = worksheet.addRow(['Total Já Quitado:', Number(totalPago)]);
  kpiRow2.getCell(1).font = { bold: true };
  kpiRow2.getCell(2).numFmt = '"R$ "#,##0.00';
  kpiRow2.getCell(2).font = { bold: true, color: { argb: 'FF065F46' } };

  const kpiRow3 = worksheet.addRow(['Saldo Pendente:', Number(totalPendente)]);
  kpiRow3.getCell(1).font = { bold: true };
  kpiRow3.getCell(2).numFmt = '"R$ "#,##0.00';
  kpiRow3.getCell(2).font = { bold: true, color: { argb: totalPendente > 0 ? 'FFB45309' : 'FF64748B' } };

  const kpiRow4 = worksheet.addRow(['TOTAL GERAL APURADO:', Number(totalGeral)]);
  kpiRow4.getCell(1).font = { bold: true, size: 11 };
  kpiRow4.getCell(2).numFmt = '"R$ "#,##0.00';
  kpiRow4.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };

  worksheet.addRow([]); // Espaçamento

  // 4. Inserção do Gráfico de Evolução
  try {
    const chartImgBase64 = generateChartImageBase64(dadosGrafico, {
      title: `Evolução dos Pagamentos - ${cliente.nome}`,
      width: 720,
      height: 250
    });

    if (chartImgBase64) {
      const imgId = workbook.addImage({
        base64: chartImgBase64,
        extension: 'png'
      });

      const chartStartRow = worksheet.lastRow.number + 1;
      worksheet.addImage(imgId, {
        tl: { col: 0, row: chartStartRow - 1 },
        ext: { width: 620, height: 215 }
      });

      // Pula linhas para que a tabela não sobreponha a imagem do gráfico
      for (let i = 0; i < 12; i++) {
        worksheet.addRow([]);
      }
    }
  } catch (err) {
    console.error('Erro ao embutir imagem do gráfico no Excel:', err);
  }

  // 5. Cabeçalho da Tabela de Lançamentos
  const tableTitle = worksheet.addRow(['LANÇAMENTOS DISCRIMINADOS']);
  tableTitle.font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
  worksheet.mergeCells(`A${tableTitle.number}:F${tableTitle.number}`);

  const headerRow = worksheet.addRow([
    'Data da Faxina',
    'Dia da Semana',
    'Plano / Serviço',
    'Dormitórios',
    'Status Pagamento',
    'Valor Cobrado'
  ]);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const startDataRow = worksheet.lastRow.number + 1;

  // 6. Dados da Tabela
  agendamentos.forEach((ag, idx) => {
    const d = new Date(ag.dataHoraInicio);
    const dataStr = d.toLocaleDateString('pt-BR');
    const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const statusText = ag.statusClientePagamento === 'pago' ? 'PAGO' : 'PENDENTE';
    const valorNum = Number(ag.valorCliente || 0);

    const row = worksheet.addRow([
      dataStr,
      diaCap,
      ag.planoNome || 'Plano de Limpeza',
      `${ag.dormitorios || 2} dorms`,
      statusText,
      valorNum
    ]);

    row.height = 20;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, color: { argb: statusText === 'PAGO' ? 'FF166534' : 'FF92400E' } };
      } else if (colNumber === 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"R$ "#,##0.00';
        cell.font = { bold: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  const endDataRow = worksheet.lastRow.number;

  // 7. Linha de Total com Fórmula do Excel
  if (agendamentos.length > 0) {
    const totalRow = worksheet.addRow([
      'TOTAL GERAL',
      '',
      '',
      '',
      '',
      { formula: `SUM(F${startDataRow}:F${endDataRow})`, result: totalGeral }
    ]);
    totalRow.height = 24;
    worksheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);
    const totalLabelCell = totalRow.getCell(1);
    totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalLabelCell.font = { bold: true, size: 11 };

    const totalValCell = totalRow.getCell(6);
    totalValCell.numFmt = '"R$ "#,##0.00';
    totalValCell.font = { bold: true, size: 11, color: { argb: 'FF065F46' } };
    totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };

    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }
      };
    });
  }

  // Download do arquivo .xlsx
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const safeName = cliente.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `extrato_cliente_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ==========================================
// EXPORTAÇÃO EXCEL (.XLSX COM GRÁFICO EMBUTIDO) - AJUDANTE
// ==========================================
export const exportExtratoAjudanteXlsx = async ({
  ajudante,
  historicoDiarias = [],
  totalGeral = 0,
  totalPago = 0,
  totalPendente = 0,
  periodoDesc = 'Todo o Histórico',
  dadosGrafico = []
}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Limpeza Express SP';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Extrato de Diárias');

  worksheet.columns = [
    { key: 'colA', width: 16 }, // Data
    { key: 'colB', width: 18 }, // Dia da Semana
    { key: 'colC', width: 28 }, // Cliente Atendido
    { key: 'colD', width: 32 }, // Endereço / Local
    { key: 'colE', width: 18 }, // Status
    { key: 'colF', width: 20 }, // Valor Diária (R$)
  ];

  // 1. Título Institucional
  const titleRow = worksheet.addRow(['LIMPEZA EXPRESS SP - EXTRATO DE DIÁRIAS DA COLABORADORA']);
  titleRow.height = 32;
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Metadados da Ajudante
  worksheet.addRow([]);
  const rAj = worksheet.addRow(['Colaboradora:', ajudante.nome]);
  rAj.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
  rAj.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };

  const rTel = worksheet.addRow(['Telefone / WhatsApp:', ajudante.telefone || 'Não informado']);
  rTel.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };

  const rPix = worksheet.addRow(['Chave PIX Destino:', `${ajudante.chavePix || 'Não informada'} (${ajudante.tipoPix || 'Chave'})`]);
  rPix.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
  rPix.getCell(2).font = { bold: true, color: { argb: 'FF0284C7' } };

  const rPer = worksheet.addRow(['Período de Apuração:', periodoDesc]);
  rPer.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
  rPer.getCell(2).font = { bold: true, color: { argb: 'FF059669' } };

  const rData = worksheet.addRow(['Data de Emissão:', new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR')]);
  rData.getCell(1).font = { bold: true, color: { argb: 'FF475569' } };

  worksheet.addRow([]); // Espaçamento

  // 3. Resumo Financeiro
  const kpiHeaderRow = worksheet.addRow(['RESUMO FINANCEIRO DAS DIÁRIAS']);
  kpiHeaderRow.font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
  worksheet.mergeCells(`A${kpiHeaderRow.number}:F${kpiHeaderRow.number}`);

  const kpiRow1 = worksheet.addRow(['Total de Diárias Realizadas:', `${historicoDiarias.length} diária(s)`]);
  kpiRow1.getCell(1).font = { bold: true };

  const kpiRow2 = worksheet.addRow(['Total Já Pago / Transferido:', Number(totalPago)]);
  kpiRow2.getCell(1).font = { bold: true };
  kpiRow2.getCell(2).numFmt = '"R$ "#,##0.00';
  kpiRow2.getCell(2).font = { bold: true, color: { argb: 'FF065F46' } };

  const kpiRow3 = worksheet.addRow(['Saldo a Pagar (PIX):', Number(totalPendente)]);
  kpiRow3.getCell(1).font = { bold: true };
  kpiRow3.getCell(2).numFmt = '"R$ "#,##0.00';
  kpiRow3.getCell(2).font = { bold: true, color: { argb: totalPendente > 0 ? 'FFB45309' : 'FF64748B' } };

  const kpiRow4 = worksheet.addRow(['TOTAL GERAL APURADO:', Number(totalGeral)]);
  kpiRow4.getCell(1).font = { bold: true, size: 11 };
  kpiRow4.getCell(2).numFmt = '"R$ "#,##0.00';
  kpiRow4.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };

  worksheet.addRow([]);

  // 4. Inserção do Gráfico
  try {
    const chartImgBase64 = generateChartImageBase64(dadosGrafico, {
      title: `Evolução das Diárias - ${ajudante.nome}`,
      width: 720,
      height: 250
    });

    if (chartImgBase64) {
      const imgId = workbook.addImage({
        base64: chartImgBase64,
        extension: 'png'
      });

      const chartStartRow = worksheet.lastRow.number + 1;
      worksheet.addImage(imgId, {
        tl: { col: 0, row: chartStartRow - 1 },
        ext: { width: 620, height: 215 }
      });

      for (let i = 0; i < 12; i++) {
        worksheet.addRow([]);
      }
    }
  } catch (err) {
    console.error('Erro ao embutir imagem do gráfico no Excel:', err);
  }

  // 5. Cabeçalho da Tabela
  const tableTitle = worksheet.addRow(['DIÁRIAS DETALHADAS NO PERÍODO']);
  tableTitle.font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
  worksheet.mergeCells(`A${tableTitle.number}:F${tableTitle.number}`);

  const headerRow = worksheet.addRow([
    'Data da Diária',
    'Dia da Semana',
    'Cliente Atendido',
    'Endereço / Local',
    'Status Diária',
    'Valor Diária'
  ]);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const startDataRow = worksheet.lastRow.number + 1;

  // 6. Dados da Tabela
  historicoDiarias.forEach((h, idx) => {
    const d = new Date(h.dataHora);
    const dataStr = d.toLocaleDateString('pt-BR');
    const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const statusText = h.statusPagamento === 'pago' ? 'PAGO' : 'A PAGAR';
    const valorNum = Number(h.valor || 0);

    const row = worksheet.addRow([
      dataStr,
      diaCap,
      h.clienteNome || 'Cliente',
      h.endereco || 'São Paulo - SP',
      statusText,
      valorNum
    ]);

    row.height = 20;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (colNumber === 1 || colNumber === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, color: { argb: statusText === 'PAGO' ? 'FF166534' : 'FF92400E' } };
      } else if (colNumber === 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"R$ "#,##0.00';
        cell.font = { bold: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  const endDataRow = worksheet.lastRow.number;

  // 7. Total com Fórmula
  if (historicoDiarias.length > 0) {
    const totalRow = worksheet.addRow([
      'TOTAL GERAL',
      '',
      '',
      '',
      '',
      { formula: `SUM(F${startDataRow}:F${endDataRow})`, result: totalGeral }
    ]);
    totalRow.height = 24;
    worksheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);
    const totalLabelCell = totalRow.getCell(1);
    totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalLabelCell.font = { bold: true, size: 11 };

    const totalValCell = totalRow.getCell(6);
    totalValCell.numFmt = '"R$ "#,##0.00';
    totalValCell.font = { bold: true, size: 11, color: { argb: 'FF065F46' } };
    totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };

    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }
      };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const safeName = ajudante.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `extrato_diarias_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ==========================================
// EXPORTAÇÃO CSV LEGADO (TEXTO PURO)
// ==========================================
export const exportExtratoClienteCsv = ({ cliente, agendamentos, totalGeral, totalPago, totalPendente, periodoDesc }) => {
  const rows = [];

  rows.push(['LIMPEZA EXPRESS SP - EXTRATO FINANCEIRO DE CLIENTE']);
  rows.push([`Cliente: ${cliente.nome}`]);
  rows.push([`Telefone: ${cliente.telefone || 'Não informado'}`]);
  rows.push([`Endereço: ${cliente.endereco || ''} ${cliente.apartamento || ''} - ${cliente.bairro || ''}`]);
  rows.push([`Período: ${periodoDesc}`]);
  rows.push([`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`]);
  rows.push([]);

  rows.push(['Data da Faxina', 'Dia da Semana', 'Plano / Serviço', 'Dormitórios', 'Status Pagamento', 'Valor (R$)']);

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

  rows.push([]);
  rows.push(['RESUMO DO PERÍODO', '', '', '', '', '']);
  rows.push(['Total de Faxinas Realizadas:', `${agendamentos.length}`, '', '', '', '']);
  rows.push(['Total Já Quitado:', `R$ ${Number(totalPago).toFixed(2).replace('.', ',')}`, '', '', '', '']);
  rows.push(['Saldo Pendente:', `R$ ${Number(totalPendente).toFixed(2).replace('.', ',')}`, '', '', '', '']);
  rows.push(['TOTAL GERAL NO PERÍODO:', `R$ ${Number(totalGeral).toFixed(2).replace('.', ',')}`, '', '', '', '']);

  const csvString = rows
    .map(row => row.map(escapeCell).join(';'))
    .join('\r\n');

  const safeName = cliente.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadCsv(`extrato_cliente_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, csvString);
};

export const exportExtratoAjudanteCsv = ({ ajudante, historicoDiarias, totalGeral, totalPago, totalPendente, periodoDesc }) => {
  const rows = [];

  rows.push(['LIMPEZA EXPRESS SP - EXTRATO DE DIÁRIAS DA COLABORADORA']);
  rows.push([`Colaboradora: ${ajudante.nome}`]);
  rows.push([`Telefone: ${ajudante.telefone || 'Não informado'}`]);
  rows.push([`Chave PIX: ${ajudante.chavePix || 'Não informada'} (${ajudante.tipoPix || 'Chave'})`]);
  rows.push([`Remuneração Base: R$ ${Number(ajudante.valorPadrao || 0).toFixed(2).replace('.', ',')} / ${ajudante.tipoRemuneracao === 'diaria' ? 'diária' : 'hora'}`]);
  rows.push([`Período: ${periodoDesc}`]);
  rows.push([`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`]);
  rows.push([]);

  rows.push(['Data da Diária', 'Dia da Semana', 'Cliente Atendido', 'Endereço', 'Status Diária', 'Chave PIX Destino', 'Valor da Diária (R$)']);

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

  rows.push([]);
  rows.push(['RESUMO DO PERÍODO', '', '', '', '', '', '']);
  rows.push(['Total de Diárias Realizadas:', `${historicoDiarias.length}`, '', '', '', '', '']);
  rows.push(['Total Já Pago / Transferido:', `R$ ${Number(totalPago).toFixed(2).replace('.', ',')}`, '', '', '', '', '']);
  rows.push(['Saldo Pendente a Pagar (PIX):', `R$ ${Number(totalPendente).toFixed(2).replace('.', ',')}`, '', '', '', '', '']);
  rows.push(['TOTAL GERAL APURADO:', `R$ ${Number(totalGeral).toFixed(2).replace('.', ',')}`, '', '', '', '', '']);

  const safeName = ajudante.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadCsv(`extrato_diarias_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, csvString);
};
