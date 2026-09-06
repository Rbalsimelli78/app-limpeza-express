import { generateChartImageBase64 } from './chartImageGenerator';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

// Executa a impressão isolada via iframe invisível para evitar duplicação ou vazamento da tela de fundo
const executarImpressaoIframe = (htmlContent) => {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    // Aguarda carregar imagens e estilos antes de disparar o print
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      // Remove o iframe após a impressão ser disparada
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 450);
  } catch (error) {
    console.error('Erro ao imprimir via iframe, tentando janela auxiliar:', error);
    // Fallback caso iframe falhe por alguma restrição
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 450);
    }
  }
};

// Gerar e Imprimir Extrato do Cliente em formato A4 Profissional
export const imprimirExtratoCliente = ({
  cliente,
  agendamentos = [],
  totalGeral = 0,
  totalPago = 0,
  totalPendente = 0,
  periodoDesc = 'Todo o Histórico',
  dadosGrafico = []
}) => {
  const chartImgBase64 = generateChartImageBase64(dadosGrafico, {
    title: `Evolução dos Pagamentos - ${cliente.nome}`,
    width: 720,
    height: 220
  });

  const dataHoraEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Extrato Financeiro - ${cliente.nome}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      padding: 10px;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Cabeçalho Institucional */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #065f46;
      letter-spacing: -0.3px;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #059669;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .doc-info {
      text-align: right;
    }
    .doc-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .doc-date {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Informações do Cliente */
    .client-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 8px;
    }
    .info-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .info-val {
      font-size: 11.5px;
      font-weight: 600;
      color: #0f172a;
    }

    /* KPIs Financeiros */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      text-align: left;
      background: #ffffff;
    }
    .kpi-card.green {
      border-top: 3px solid #10b981;
      background: #f0fdf4;
    }
    .kpi-card.gold {
      border-top: 3px solid #f59e0b;
      background: #fffbeb;
    }
    .kpi-card.blue {
      border-top: 3px solid #0284c7;
      background: #f0f9ff;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9.5px;
      color: #64748b;
    }

    /* Seção do Gráfico */
    .chart-container {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 14px;
      background: #ffffff;
      text-align: center;
      page-break-inside: avoid;
    }
    .chart-container img {
      max-width: 100%;
      height: auto;
      max-height: 180px;
      display: block;
      margin: 0 auto;
    }

    /* Tabela de Lançamentos */
    .table-container {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-pago {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .badge-pendente {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .row-total td {
      font-weight: 800;
      font-size: 11px;
      background: #f1f5f9 !important;
      border-top: 2px solid #cbd5e1;
      border-bottom: 2px solid #0f172a;
    }

    /* Rodapé Institucional */
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">LIMPEZA EXPRESS SP</h1>
      <p class="brand-subtitle">Gestão Operacional e Financeira de Serviços</p>
    </div>
    <div class="doc-info">
      <h2 class="doc-title">Extrato Financeiro</h2>
      <p class="doc-date">Emissão: ${dataHoraEmissao}</p>
    </div>
  </div>

  <div class="client-card">
    <div>
      <div class="info-label">Cliente</div>
      <div class="info-val">${cliente.nome}</div>
      <div style="margin-top: 4px;">
        <span class="info-label">Endereço: </span>
        <span style="font-size: 10.5px; color: #334155;">
          ${cliente.endereco || 'São Paulo - SP'} ${cliente.apartamento ? `, Apto ${cliente.apartamento}` : ''} ${cliente.bairro ? ` - ${cliente.bairro}` : ''}
        </span>
      </div>
    </div>
    <div>
      <div class="info-label">Telefone / WhatsApp</div>
      <div class="info-val">${cliente.telefone || 'Não informado'}</div>
      <div style="margin-top: 4px;">
        <span class="info-label">Período de Apuração: </span>
        <span style="font-size: 10.5px; font-weight: 600; color: #059669;">${periodoDesc}</span>
      </div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card blue">
      <div class="kpi-label">Total do Período</div>
      <div class="kpi-val">${formatCurrency(totalGeral)}</div>
      <div class="kpi-sub">${agendamentos.length} faxina(s) registrada(s)</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Total Quitado</div>
      <div class="kpi-val" style="color: #065f46;">${formatCurrency(totalPago)}</div>
      <div class="kpi-sub">Pagamentos confirmados</div>
    </div>
    <div class="kpi-card gold">
      <div class="kpi-label">Saldo Pendente</div>
      <div class="kpi-val" style="color: ${totalPendente > 0 ? '#b45309' : '#64748b'};">
        ${formatCurrency(totalPendente)}
      </div>
      <div class="kpi-sub">${totalPendente > 0 ? 'Aguardando liquidação' : 'Tudo quitado'}</div>
    </div>
  </div>

  ${chartImgBase64 ? `
  <div class="chart-container">
    <img src="${chartImgBase64}" alt="Gráfico de Evolução Financeira" />
  </div>
  ` : ''}

  <div class="table-container">
    <div class="section-title">
      <span>Lançamentos Discriminados no Período</span>
      <span style="font-size: 10px; color: #64748b;">${agendamentos.length} registro(s)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Data</th>
          <th style="width: 16%;">Dia da Semana</th>
          <th style="width: 28%;">Plano / Serviço</th>
          <th style="width: 14%;">Dormitórios</th>
          <th style="width: 14%; text-align: right;">Valor</th>
          <th style="width: 14%; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${agendamentos.map(ag => {
          const d = new Date(ag.dataHoraInicio);
          const dataStr = d.toLocaleDateString('pt-BR');
          const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
          const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
          const statusPago = ag.statusClientePagamento === 'pago';

          return `
          <tr>
            <td><strong>${dataStr}</strong></td>
            <td>${diaCap}</td>
            <td>${ag.planoNome || 'Plano de Limpeza'}</td>
            <td>${ag.dormitorios || 2} dorms</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(ag.valorCliente)}</td>
            <td style="text-align: center;">
              <span class="badge-status ${statusPago ? 'badge-pago' : 'badge-pendente'}">
                ${statusPago ? 'PAGO' : 'PENDENTE'}
              </span>
            </td>
          </tr>
          `;
        }).join('')}
        <tr class="row-total">
          <td colspan="4" style="text-align: right; text-transform: uppercase;">TOTAL GERAL:</td>
          <td style="text-align: right; color: #065f46;">${formatCurrency(totalGeral)}</td>
          <td style="text-align: center;">-</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>Limpeza Express SP • Sistema de Gestão Financeira</span>
    <span>Documento gerado eletronicamente para simples conferência</span>
  </div>
</body>
</html>
  `;

  executarImpressaoIframe(html);
};

// Gerar e Imprimir Extrato de Diárias da Ajudante em formato A4 Profissional
export const imprimirExtratoAjudante = ({
  ajudante,
  historicoDiarias = [],
  totalGeral = 0,
  totalPago = 0,
  totalPendente = 0,
  periodoDesc = 'Todo o Histórico',
  dadosGrafico = []
}) => {
  const chartImgBase64 = generateChartImageBase64(dadosGrafico, {
    title: `Evolução das Diárias - ${ajudante.nome}`,
    width: 720,
    height: 220
  });

  const dataHoraEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Extrato de Diárias - ${ajudante.nome}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      padding: 10px;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #065f46;
      letter-spacing: -0.3px;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #059669;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .doc-info {
      text-align: right;
    }
    .doc-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .doc-date {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 8px;
    }
    .info-label {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .info-val {
      font-size: 11.5px;
      font-weight: 600;
      color: #0f172a;
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      text-align: left;
      background: #ffffff;
    }
    .kpi-card.green {
      border-top: 3px solid #10b981;
      background: #f0fdf4;
    }
    .kpi-card.gold {
      border-top: 3px solid #f59e0b;
      background: #fffbeb;
    }
    .kpi-card.blue {
      border-top: 3px solid #0284c7;
      background: #f0f9ff;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9.5px;
      color: #64748b;
    }

    .chart-container {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 14px;
      background: #ffffff;
      text-align: center;
      page-break-inside: avoid;
    }
    .chart-container img {
      max-width: 100%;
      height: auto;
      max-height: 180px;
      display: block;
      margin: 0 auto;
    }

    .table-container {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-pago {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .badge-pendente {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .row-total td {
      font-weight: 800;
      font-size: 11px;
      background: #f1f5f9 !important;
      border-top: 2px solid #cbd5e1;
      border-bottom: 2px solid #0f172a;
    }

    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">LIMPEZA EXPRESS SP</h1>
      <p class="brand-subtitle">Gestão Operacional e Financeira de Serviços</p>
    </div>
    <div class="doc-info">
      <h2 class="doc-title">Extrato de Diárias</h2>
      <p class="doc-date">Emissão: ${dataHoraEmissao}</p>
    </div>
  </div>

  <div class="info-card">
    <div>
      <div class="info-label">Colaboradora</div>
      <div class="info-val">${ajudante.nome}</div>
      <div style="margin-top: 4px;">
        <span class="info-label">Chave PIX: </span>
        <span style="font-size: 10.5px; font-weight: 600; color: #0284c7;">
          ${ajudante.chavePix || 'Não informada'} (${ajudante.tipoPix || 'Chave'})
        </span>
      </div>
    </div>
    <div>
      <div class="info-label">Telefone</div>
      <div class="info-val">${ajudante.telefone || 'Não informado'}</div>
      <div style="margin-top: 4px;">
        <span class="info-label">Período de Apuração: </span>
        <span style="font-size: 10.5px; font-weight: 600; color: #059669;">${periodoDesc}</span>
      </div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card blue">
      <div class="kpi-label">Total Apurado</div>
      <div class="kpi-val">${formatCurrency(totalGeral)}</div>
      <div class="kpi-sub">${historicoDiarias.length} diária(s) realizada(s)</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Total Já Pago (PIX)</div>
      <div class="kpi-val" style="color: #065f46;">${formatCurrency(totalPago)}</div>
      <div class="kpi-sub">Transferências concluídas</div>
    </div>
    <div class="kpi-card gold">
      <div class="kpi-label">Saldo a Pagar (PIX)</div>
      <div class="kpi-val" style="color: ${totalPendente > 0 ? '#b45309' : '#64748b'};">
        ${formatCurrency(totalPendente)}
      </div>
      <div class="kpi-sub">${totalPendente > 0 ? 'Pendente de envio PIX' : 'Tudo quitado'}</div>
    </div>
  </div>

  ${chartImgBase64 ? `
  <div class="chart-container">
    <img src="${chartImgBase64}" alt="Gráfico de Evolução de Diárias" />
  </div>
  ` : ''}

  <div class="table-container">
    <div class="section-title">
      <span>Diárias Detalhadas no Período</span>
      <span style="font-size: 10px; color: #64748b;">${historicoDiarias.length} registro(s)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Data</th>
          <th style="width: 16%;">Dia da Semana</th>
          <th style="width: 25%;">Cliente Atendido</th>
          <th style="width: 21%;">Endereço / Local</th>
          <th style="width: 12%; text-align: right;">Valor</th>
          <th style="width: 12%; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${historicoDiarias.map(h => {
          const d = new Date(h.dataHora);
          const dataStr = d.toLocaleDateString('pt-BR');
          const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
          const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
          const statusPago = h.statusPagamento === 'pago';

          return `
          <tr>
            <td><strong>${dataStr}</strong></td>
            <td>${diaCap}</td>
            <td>${h.clienteNome || 'Cliente'}</td>
            <td>${h.endereco || 'São Paulo - SP'}</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(h.valor)}</td>
            <td style="text-align: center;">
              <span class="badge-status ${statusPago ? 'badge-pago' : 'badge-pendente'}">
                ${statusPago ? 'PAGO' : 'A PAGAR'}
              </span>
            </td>
          </tr>
          `;
        }).join('')}
        <tr class="row-total">
          <td colspan="4" style="text-align: right; text-transform: uppercase;">TOTAL GERAL:</td>
          <td style="text-align: right; color: #065f46;">${formatCurrency(totalGeral)}</td>
          <td style="text-align: center;">-</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>Limpeza Express SP • Controle de Diárias e Repasses</span>
    <span>Documento gerado eletronicamente para simples conferência</span>
  </div>
</body>
</html>
  `;

  executarImpressaoIframe(html);
};
