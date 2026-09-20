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
  dadosGrafico = [],
  incluirGrafico = false
}) => {
  const chartImgBase64 = (incluirGrafico && dadosGrafico && dadosGrafico.length > 0)
    ? generateChartImageBase64(dadosGrafico, {
        title: `Evolução dos Pagamentos - ${cliente.nome}`,
        width: 720,
        height: 220
      })
    : null;

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
      <div class="kpi-sub">${agendamentos.length} limpeza(s) registrada(s)</div>
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
  dadosGrafico = [],
  incluirGrafico = false
}) => {
  const chartImgBase64 = (incluirGrafico && dadosGrafico && dadosGrafico.length > 0)
    ? generateChartImageBase64(dadosGrafico, {
        title: `Evolução das Diárias - ${ajudante.nome}`,
        width: 720,
        height: 220
      })
    : null;

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

// ==========================================
// IMPRESSÃO / EXPORTAÇÃO PDF - FLUXO DE CAIXA & BALANÇO
// ==========================================
export const imprimirFluxoCaixa = ({
  lancamentos = [],
  clienteFiltroNome = null,
  totalRecebido = 0,
  totalAReceber = 0,
  totalPagoAjudantes = 0,
  totalAPagarAjudantes = 0,
  lucroRealizado = 0,
  lucroProjetado = 0,
  periodoDesc = 'Extrato Atual'
}) => {
  const dataHoraEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let somaEntradas = 0;
  let somaSaidas = 0;
  lancamentos.forEach(l => {
    const val = Number(l.valor || 0);
    if (l.tipo === 'entrada') somaEntradas += val;
    else somaSaidas += val;
  });
  const saldoLiquido = somaEntradas - somaSaidas;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Fluxo de Caixa - Limpeza Express SP</title>
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
      align-items: center;
      border-bottom: 2px solid #065f46;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand h1 {
      font-size: 17px;
      font-weight: 800;
      color: #065f46;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .brand p {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 1px;
    }
    .report-badge {
      text-align: right;
    }
    .report-badge .tag {
      display: inline-block;
      background: #065f46;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .report-badge .date {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 3px;
    }

    /* Meta Info */
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .meta-item {
      font-size: 11px;
    }
    .meta-item strong {
      color: #334155;
    }

    /* Grid de Resumo Financeiro */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .kpi-card.green { border-left: 3.5px solid #059669; }
    .kpi-card.amber { border-left: 3.5px solid #d97706; }
    .kpi-card.red   { border-left: 3.5px solid #dc2626; }
    .kpi-card.blue  { border-left: 3.5px solid #4f46e5; }
    .kpi-title {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .kpi-val {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }

    /* Tabela de Lançamentos */
    .table-container {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9px;
      padding: 6px 7px;
      text-align: left;
    }
    td {
      padding: 5.5px 7px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .badge-tipo {
      display: inline-block;
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-entrada { background: #dcfce7; color: #15803d; }
    .badge-saida   { background: #fee2e2; color: #b91c1c; }
    .badge-pago    { background: #e0f2fe; color: #0369a1; }
    .badge-pendente{ background: #fef3c7; color: #b45309; }

    .row-total td {
      background: #f1f5f9 !important;
      font-weight: 700;
      border-top: 1.5px solid #0f172a;
      font-size: 10.5px;
      padding: 7px;
    }

    /* Rodapé */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Limpeza Express SP</h1>
      <p>Gestão Profissional de Serviços de Limpeza Residencial & Corporativa</p>
    </div>
    <div class="report-badge">
      <div class="tag">Fluxo de Caixa</div>
      <div class="date">Emissão: ${dataHoraEmissao}</div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <strong>Filtro Aplicado:</strong> ${clienteFiltroNome ? `Cliente: ${clienteFiltroNome}` : 'Todos os Clientes & Operações'}
    </div>
    <div class="meta-item">
      <strong>Período:</strong> ${periodoDesc}
    </div>
    <div class="meta-item">
      <strong>Total de Lançamentos:</strong> ${lancamentos.length} registro(s)
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card green">
      <div class="kpi-title">Entradas Recebidas</div>
      <div class="kpi-val" style="color: #059669;">${formatCurrency(totalRecebido)}</div>
    </div>
    <div class="kpi-card amber">
      <div class="kpi-title">Ainda a Receber</div>
      <div class="kpi-val" style="color: #d97706;">${formatCurrency(totalAReceber)}</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-title">Saídas (Ajudantes)</div>
      <div class="kpi-val" style="color: #dc2626;">${formatCurrency(totalPagoAjudantes)}</div>
    </div>
    <div class="kpi-card blue">
      <div class="kpi-title">Lucro Líquido Realizado</div>
      <div class="kpi-val" style="color: #4f46e5;">${formatCurrency(lucroRealizado)}</div>
    </div>
  </div>

  <div class="table-container">
    <div class="section-title">
      <span>Extrato Analítico de Lançamentos</span>
      <span style="font-size: 9.5px; color: #64748b;">Saldo Líquido do Filtro: <strong>${formatCurrency(saldoLiquido)}</strong></span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Data</th>
          <th style="width: 9%; text-align: center;">Tipo</th>
          <th style="width: 32%;">Descrição / Lançamento</th>
          <th style="width: 21%;">Pessoa (Cliente / Ajudante)</th>
          <th style="width: 8%; text-align: center;">Forma</th>
          <th style="width: 8%; text-align: center;">Status</th>
          <th style="width: 10%; text-align: right;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${lancamentos.map(item => {
          const d = item.data ? new Date(item.data) : new Date();
          const dataStr = d.toLocaleDateString('pt-BR');
          const isEntrada = item.tipo === 'entrada';
          const isPago = item.status === 'pago';
          const valNum = Number(item.valor || 0);

          return `
          <tr>
            <td><strong>${dataStr}</strong></td>
            <td style="text-align: center;">
              <span class="badge-tipo ${isEntrada ? 'badge-entrada' : 'badge-saida'}">
                ${isEntrada ? 'ENTRADA' : 'SAÍDA'}
              </span>
            </td>
            <td>${item.descricao || ''}</td>
            <td>${item.clienteNome || item.origem || 'Geral'}</td>
            <td style="text-align: center;">${item.forma || 'PIX'}</td>
            <td style="text-align: center;">
              <span class="badge-tipo ${isPago ? 'badge-pago' : 'badge-pendente'}">
                ${isPago ? 'PAGO' : 'PENDENTE'}
              </span>
            </td>
            <td style="text-align: right; font-weight: 700; color: ${isEntrada ? '#059669' : '#dc2626'};">
              ${isEntrada ? '+' : '-'} ${formatCurrency(valNum)}
            </td>
          </tr>
          `;
        }).join('')}
        <tr class="row-total">
          <td colspan="6" style="text-align: right; text-transform: uppercase;">Total de Entradas:</td>
          <td style="text-align: right; color: #059669;">+ ${formatCurrency(somaEntradas)}</td>
        </tr>
        <tr class="row-total">
          <td colspan="6" style="text-align: right; text-transform: uppercase;">Total de Saídas (Custos):</td>
          <td style="text-align: right; color: #dc2626;">- ${formatCurrency(somaSaidas)}</td>
        </tr>
        <tr class="row-total" style="background: #e2e8f0 !important;">
          <td colspan="6" style="text-align: right; text-transform: uppercase; font-size: 11px;">SALDO LÍQUIDO APURADO:</td>
          <td style="text-align: right; color: #065f46; font-size: 12px;">${formatCurrency(saldoLiquido)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>Limpeza Express SP • Controle Financeiro de Caixa</span>
    <span>Para salvar em PDF, selecione a impressora "Salvar como PDF" na janela de impressão</span>
  </div>
</body>
</html>
  `;

  executarImpressaoIframe(html);
};

// ==========================================
// IMPRESSÃO A4 / PDF - FECHAMENTO DO MÊS (DRE GERENCIAL)
// ==========================================
export const imprimirFechamentoMes = ({
  mesAno = '2026-09',
  mesNome = 'Setembro de 2026',
  modoDescricao = 'Todos os Lançamentos (com Projeções)',
  isFechado = false,
  fechadoInfo = null,
  dre = {},
  clientesDetalhados = [],
  ajudantesDetalhadas = [],
  impostosDetalhados = [],
  despesasDetalhadas = []
}) => {
  const pctDiarias = dre.receitaBruta > 0 ? ((dre.custoAjudantes / dre.receitaBruta) * 100).toFixed(1) : '0,0';
  const pctMargem = dre.receitaBruta > 0 ? ((dre.margemContribuicao / dre.receitaBruta) * 100).toFixed(1) : '0,0';
  const pctGastos = dre.receitaBruta > 0 ? ((dre.totalGastosOperacionais / dre.receitaBruta) * 100).toFixed(1) : '0,0';
  const pctLucro = dre.receitaBruta > 0 ? ((dre.lucroLiquido / dre.receitaBruta) * 100).toFixed(1) : '0,0';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Fechamento Mensal - ${mesNome} - Limpeza Express SP</title>
  <style>
    @page { size: A4; margin: 12mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #1e293b; background: #fff; margin: 0; padding: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 14px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
    .brand-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #059669; font-weight: 600; margin: 0; }
    .doc-meta { text-align: right; }
    .doc-title { font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; }
    .doc-periodo { font-size: 11px; color: #64748b; margin-top: 2px; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; margin-top: 3px; }
    .badge-fechado { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-aberto { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
    .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; }
    .kpi-value { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .kpi-sub { font-size: 9px; color: #64748b; margin-top: 1px; }

    .secao-titulo { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; background: #f1f5f9; padding: 5px 8px; border-left: 4px solid #059669; margin: 12px 0 6px 0; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
    th { background: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 5px 6px; border-bottom: 1px solid #cbd5e1; font-size: 9px; text-transform: uppercase; }
    td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; }
    .row-total { background: #fef3c7; font-weight: 700; }
    .dre-tabela { width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12px; }
    .dre-tabela td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
    .dre-destaque { background: #ecfdf5; font-weight: 800; color: #065f46; font-size: 11px; }
    .dre-lucro { background: #eff6ff; font-weight: 800; color: #1e3a8a; font-size: 12px; }

    .footer { margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="/logo.jpg" alt="Limpeza Express SP" />
      <div>
        <h1 class="brand-title">Limpeza Express SP</h1>
        <p class="brand-sub">Gestão Profissional de Limpeza Residencial & Comercial</p>
      </div>
    </div>
    <div class="doc-meta">
      <h2 class="doc-title">Fechamento do Mês (DRE)</h2>
      <div class="doc-periodo">${mesNome} • ${modoDescricao}</div>
      <div class="status-badge ${isFechado ? 'badge-fechado' : 'badge-aberto'}">
        ${isFechado ? '🔒 MÊS FECHADO & AUDITADO' : '🔓 MÊS EM ANDAMENTO'}
      </div>
    </div>
  </div>

  <!-- KPIs Executivos -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <span class="kpi-label">Faturamento Bruto</span>
      <div class="kpi-value" style="color: #059669;">${formatCurrency(dre.receitaBruta)}</div>
      <div class="kpi-sub">${dre.totalLimpezas || 0} limpezas</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Diárias da Equipe</span>
      <div class="kpi-value" style="color: #dc2626;">${formatCurrency(dre.custoAjudantes)}</div>
      <div class="kpi-sub">${pctDiarias}% da receita</div>
    </div>
    <div class="kpi-card" style="border-color: #059669; background: #ecfdf5;">
      <span class="kpi-label" style="color: #065f46;">Margem de Contribuição</span>
      <div class="kpi-value" style="color: #059669;">${formatCurrency(dre.margemContribuicao)}</div>
      <div class="kpi-sub" style="color: #047857; font-weight: 700;">${pctMargem}% da receita</div>
    </div>
    <div class="kpi-card" style="border-color: #2563eb; background: #eff6ff;">
      <span class="kpi-label" style="color: #1e40af;">Lucro Líquido Real</span>
      <div class="kpi-value" style="color: #1d4ed8;">${formatCurrency(dre.lucroLiquido)}</div>
      <div class="kpi-sub" style="color: #1e40af; font-weight: 700;">Margem Líquida: ${pctLucro}%</div>
    </div>
  </div>

  <!-- DRE Gerencial em Cascata -->
  <div class="secao-titulo">
    <span>Demonstrativo de Resultado Gerencial (DRE)</span>
    <span>Estrutura Gerencial</span>
  </div>
  <table class="dre-tabela">
    <tbody>
      <tr>
        <td style="width: 60%;"><strong>(+) 1. Receita Bruta Total</strong> (Faturamento dos Serviços)</td>
        <td style="text-align: right; width: 20%; color: #059669; font-weight: 700;">${formatCurrency(dre.receitaBruta)}</td>
        <td style="text-align: right; width: 20%; color: #64748b;">100,0%</td>
      </tr>
      <tr>
        <td><strong>(-) 2. Deduções da Receita</strong> (Simples Nacional, DAS e Taxas)</td>
        <td style="text-align: right; color: #dc2626;">- ${formatCurrency(dre.totalImpostos)}</td>
        <td style="text-align: right; color: #64748b;">${dre.receitaBruta > 0 ? ((dre.totalImpostos / dre.receitaBruta) * 100).toFixed(1) : '0,0'}%</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td><strong>(=) 3. Receita Líquida</strong></td>
        <td style="text-align: right; font-weight: 700;">${formatCurrency(dre.receitaLiquida)}</td>
        <td style="text-align: right; color: #64748b;">${dre.receitaBruta > 0 ? ((dre.receitaLiquida / dre.receitaBruta) * 100).toFixed(1) : '0,0'}%</td>
      </tr>
      <tr>
        <td><strong>(-) 4. Custos Diretos com Serviços</strong> (Diárias das Colaboradoras)</td>
        <td style="text-align: right; color: #dc2626;">- ${formatCurrency(dre.custoAjudantes)}</td>
        <td style="text-align: right; color: #64748b;">${pctDiarias}%</td>
      </tr>
      <tr class="dre-destaque">
        <td><strong>(=) 5. MARGEM DE CONTRIBUIÇÃO</strong> (O que sobra dos serviços para a empresa)</td>
        <td style="text-align: right;">${formatCurrency(dre.margemContribuicao)}</td>
        <td style="text-align: right; font-weight: 800;">${pctMargem}%</td>
      </tr>
      <tr>
        <td><strong>(-) 6. Gastos Operacionais & Insumos de Limpeza</strong> (Álcool, panos, vassouras)</td>
        <td style="text-align: right; color: #dc2626;">- ${formatCurrency(dre.totalInsumos)}</td>
        <td style="text-align: right; color: #64748b;">${dre.receitaBruta > 0 ? ((dre.totalInsumos / dre.receitaBruta) * 100).toFixed(1) : '0,0'}%</td>
      </tr>
      <tr>
        <td><strong>(-) 7. Investimentos em Equipamentos & Ativos</strong> (Aspiradores novos, máquinas)</td>
        <td style="text-align: right; color: #2563eb;">- ${formatCurrency(dre.totalInvestimentos)}</td>
        <td style="text-align: right; color: #64748b;">${dre.receitaBruta > 0 ? ((dre.totalInvestimentos / dre.receitaBruta) * 100).toFixed(1) : '0,0'}%</td>
      </tr>
      <tr class="dre-lucro">
        <td><strong>(=) 8. RESULTADO LÍQUIDO REAL</strong> (Sobra Líquida no Bolso da Administradora)</td>
        <td style="text-align: right; font-size: 13px;">${formatCurrency(dre.lucroLiquido)}</td>
        <td style="text-align: right; font-size: 12px;">${pctLucro}%</td>
      </tr>
    </tbody>
  </table>

  <!-- Tabela de Receitas por Cliente e Condomínio -->
  <div class="secao-titulo">
    <span>Receitas por Cliente e Condomínio</span>
    <span>${clientesDetalhados.length} clientes atendidos</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Cliente</th>
        <th>Condomínio / Prédio</th>
        <th style="text-align: center;">Qtd Limpezas</th>
        <th style="text-align: right;">Total Faturado</th>
      </tr>
    </thead>
    <tbody>
      ${clientesDetalhados.map(c => `
        <tr>
          <td><strong>${c.nome}</strong></td>
          <td>${c.condominio || 'São Paulo'}</td>
          <td style="text-align: center;">${c.qtdLimpezas}</td>
          <td style="text-align: right; font-weight: 700;">${formatCurrency(c.valorTotal)}</td>
        </tr>
      `).join('')}
      <tr class="row-total">
        <td colspan="2">TOTAL DE RECEITAS</td>
        <td style="text-align: center;">${dre.totalLimpezas || 0}</td>
        <td style="text-align: right;">${formatCurrency(dre.receitaBruta)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Tabela de Despesas com Diárias das Ajudantes -->
  <div class="secao-titulo">
    <span>Diárias da Equipe de Limpeza (Ajudantes)</span>
    <span>${ajudantesDetalhadas.length} profissionais escaladas</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Colaboradora</th>
        <th>Locais Atendidos</th>
        <th style="text-align: center;">Qtd Limpezas</th>
        <th style="text-align: right;">Total em Diárias</th>
        <th style="text-align: right;">% da Receita</th>
      </tr>
    </thead>
    <tbody>
      ${ajudantesDetalhadas.map(a => {
        const pctAjud = dre.receitaBruta > 0 ? ((a.totalDiarias / dre.receitaBruta) * 100).toFixed(1) : '0,0';
        return `
        <tr>
          <td><strong>${a.nome}</strong></td>
          <td>${a.predios || 'Diversos'}</td>
          <td style="text-align: center;">${a.qtdLimpezas}</td>
          <td style="text-align: right; font-weight: 700; color: #dc2626;">${formatCurrency(a.totalDiarias)}</td>
          <td style="text-align: right; color: #64748b;">${pctAjud}%</td>
        </tr>
        `;
      }).join('')}
      <tr class="row-total" style="background: #fee2e2;">
        <td colspan="2">TOTAL DE DIÁRIAS PAGAS / A PAGAR</td>
        <td style="text-align: center;">${dre.totalLimpezasEquipe || 0}</td>
        <td style="text-align: right; color: #dc2626;">${formatCurrency(dre.custoAjudantes)}</td>
        <td style="text-align: right; font-weight: 700;">${pctDiarias}%</td>
      </tr>
    </tbody>
  </table>

  <!-- Tabela de Gastos, Insumos e Investimentos -->
  ${(impostosDetalhados.length > 0 || despesasDetalhadas.length > 0) ? `
  <div class="secao-titulo">
    <span>Impostos, Insumos & Investimentos Lançados</span>
    <span>${impostosDetalhados.length + despesasDetalhadas.length} itens</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Categoria</th>
        <th>Descrição</th>
        <th>Forma</th>
        <th style="text-align: right;">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${[...impostosDetalhados, ...despesasDetalhadas].map(d => `
        <tr>
          <td>${d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
          <td><span style="font-weight: 600; font-size: 9px;">${d.categoria || 'Gasto'}</span></td>
          <td>${d.descricao}</td>
          <td>${d.formaPagamento || 'PIX'}</td>
          <td style="text-align: right; font-weight: 700;">${formatCurrency(d.valor)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    <span>Limpeza Express SP • Relatório de Gestão & Fechamento Financeiro</span>
    <span>Documento gerado em ${new Date().toLocaleString('pt-BR')}</span>
  </div>
</body>
</html>
  `;

  executarImpressaoIframe(html);
};

// =========================================================================
// IMPRESSÃO / PDF: COMPARATIVO FINANCEIRO POR PERÍODO
// =========================================================================
export const imprimirComparativoPeriodo = ({
  periodoDesc = 'Período Personalizado',
  meses = [],
  totais = {}
}) => {
  const dataHojeStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalInsumosCalculado = totais.totalInsumos || meses.reduce((s, m) => s + (m.insumos || 0), 0);
  const totalInvestCalculado = totais.totalInvest || meses.reduce((s, m) => s + (m.invest || 0), 0);
  const totalOutrasCalculado = totais.totalAnoGastos - totalInsumosCalculado - totalInvestCalculado;
  const totalDespesasGeral = (totais.totalAnoCustoAj || 0) + (totais.totalAnoImpostos || 0) + (totais.totalAnoGastos || 0);

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comparativo Financeiro - ${periodoDesc} - Limpeza Express SP</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10px;
      line-height: 1.3;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 800;
      color: #065f46;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .badge-periodo {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10px;
    }
    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 8px;
    }
    .kpi-label {
      font-size: 8px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      display: block;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 8px;
      color: #64748b;
    }
    .secao-titulo {
      background: #f1f5f9;
      border-left: 3px solid #059669;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 700;
      color: #1e293b;
      margin: 10px 0 6px 0;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9px;
    }
    th, td {
      padding: 4px 6px;
      border: 1px solid #cbd5e1;
      text-align: right;
    }
    th:first-child, td:first-child {
      text-align: left;
    }
    th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      font-size: 8.5px;
    }
    th.th-total {
      background: #047857;
    }
    .row-highlight-green {
      background: #f0fdf4;
      font-weight: 700;
      color: #15803d;
    }
    .row-highlight-amber {
      background: #fef3c7;
      font-weight: 700;
      color: #92400e;
    }
    .row-highlight-blue {
      background: #dbeafe;
      font-weight: 800;
      color: #1e3a8a;
      font-size: 9.5px;
    }
    .row-highlight-red {
      background: #fee2e2;
      font-weight: 700;
      color: #991b1b;
    }
    .footer {
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">Limpeza Express SP</div>
      <div class="brand-subtitle">Relatório Executivo & Comparativo Financeiro por Período</div>
    </div>
    <div style="text-align: right;">
      <div class="badge-periodo">Período: ${periodoDesc}</div>
      <div style="font-size: 8px; color: #64748b; margin-top: 3px;">Emitido em: ${dataHojeStr}</div>
    </div>
  </div>

  <!-- Cards de KPIs do Período -->
  <div class="kpis-grid">
    <div class="kpi-card" style="border-top: 3px solid #10b981;">
      <span class="kpi-label">Faturamento Total</span>
      <div class="kpi-val" style="color: #047857;">${formatCurrency(totais.totalAnoRecBruta)}</div>
      <span class="kpi-sub">${totais.totalAnoLimpezas || 0} limpezas no período</span>
    </div>

    <div class="kpi-card" style="border-top: 3px solid #ef4444;">
      <span class="kpi-label">Diárias Ajudantes</span>
      <div class="kpi-val" style="color: #dc2626;">${formatCurrency(totais.totalAnoCustoAj)}</div>
      <span class="kpi-sub">${totais.totalAnoRecBruta > 0 ? ((totais.totalAnoCustoAj / totais.totalAnoRecBruta) * 100).toFixed(1) : '0.0'}% da receita</span>
    </div>

    <div class="kpi-card" style="border-top: 3px solid #f59e0b;">
      <span class="kpi-label">Margem Contribuição</span>
      <div class="kpi-val" style="color: #b45309;">${formatCurrency(totais.totalAnoMargemCont)}</div>
      <span class="kpi-sub">Média: ${(totais.totalAnoMargemContPct || 0).toFixed(1)}%</span>
    </div>

    <div class="kpi-card" style="border-top: 3px solid #a855f7;">
      <span class="kpi-label">Total de Despesas</span>
      <div class="kpi-val" style="color: #7e22ce;">${formatCurrency(totalDespesasGeral)}</div>
      <span class="kpi-sub">Insumos, equipe e impostos</span>
    </div>

    <div class="kpi-card" style="border-top: 3px solid #3b82f6; background: #eff6ff;">
      <span class="kpi-label">Lucro Líquido Real</span>
      <div class="kpi-val" style="color: #1d4ed8;">${formatCurrency(totais.totalAnoLucro)}</div>
      <span class="kpi-sub">Margem Líquida: ${(totais.totalAnoLucroPct || 0).toFixed(1)}%</span>
    </div>
  </div>

  <!-- Tabela 1: Matriz de Resultados Financeiros Mês a Mês -->
  <div class="secao-titulo">
    <span>1. Matriz de Resultados Financeiros Mês a Mês</span>
    <span>Valores expressos em Reais (R$)</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Métrica / Conta</th>
        ${meses.map(m => `<th>${m.nomeCurto || m.mesAno}</th>`).join('')}
        <th class="th-total">TOTAL PERÍODO</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Qtd de Limpezas Realizadas</strong></td>
        ${meses.map(m => `<td>${m.totalLimpezas}</td>`).join('')}
        <td style="font-weight: 800; background: #f8fafc;">${totais.totalAnoLimpezas || 0}</td>
      </tr>

      <tr class="row-highlight-green">
        <td>(+) Receita Bruta (Clientes)</td>
        ${meses.map(m => `<td>${m.recBruta > 0 ? formatCurrency(m.recBruta) : '-'}</td>`).join('')}
        <td style="background: #dcfce7; font-weight: 800;">${formatCurrency(totais.totalAnoRecBruta)}</td>
      </tr>

      <tr>
        <td style="color: #dc2626;">(-) Diárias da Equipe (Ajudantes)</td>
        ${meses.map(m => `<td style="color: #dc2626;">${m.custoAj > 0 ? formatCurrency(m.custoAj) : '-'}</td>`).join('')}
        <td style="color: #dc2626; font-weight: 700; background: #fee2e2;">${formatCurrency(totais.totalAnoCustoAj)}</td>
      </tr>

      <tr>
        <td style="color: #b45309;">(-) Impostos & Taxas</td>
        ${meses.map(m => `<td style="color: #b45309;">${m.impostos > 0 ? formatCurrency(m.impostos) : '-'}</td>`).join('')}
        <td style="color: #b45309; font-weight: 700;">${formatCurrency(totais.totalAnoImpostos)}</td>
      </tr>

      <tr class="row-highlight-amber">
        <td>(=) MARGEM DE CONTRIBUIÇÃO</td>
        ${meses.map(m => `<td>${m.margemCont !== 0 ? formatCurrency(m.margemCont) : '-'}</td>`).join('')}
        <td style="background: #fde68a; font-weight: 800;">${formatCurrency(totais.totalAnoMargemCont)}</td>
      </tr>

      <tr style="font-size: 8px; color: #64748b;">
        <td>% Margem de Contribuição</td>
        ${meses.map(m => `<td>${m.recBruta > 0 ? m.margemContPct.toFixed(1) + '%' : '-'}</td>`).join('')}
        <td style="font-weight: 700;">${(totais.totalAnoMargemContPct || 0).toFixed(1)}%</td>
      </tr>

      <tr>
        <td style="color: #7e22ce;">(-) Insumos & Produtos de Limpeza</td>
        ${meses.map(m => `<td style="color: #7e22ce;">${m.insumos > 0 ? formatCurrency(m.insumos) : '-'}</td>`).join('')}
        <td style="color: #7e22ce; font-weight: 700;">${formatCurrency(totalInsumosCalculado)}</td>
      </tr>

      <tr>
        <td style="color: #1d4ed8;">(-) Investimentos / Máquinas (Bens Duráveis)</td>
        ${meses.map(m => `<td style="color: #1d4ed8;">${m.invest > 0 ? formatCurrency(m.invest) : '-'}</td>`).join('')}
        <td style="color: #1d4ed8; font-weight: 700;">${formatCurrency(totalInvestCalculado)}</td>
      </tr>

      <tr>
        <td style="color: #475569;">(-) Custos Fixos & Gerais</td>
        ${meses.map(m => {
          const outras = (m.gastosTotal - (m.insumos || 0) - (m.invest || 0)) || 0;
          return `<td style="color: #475569;">${outras > 0 ? formatCurrency(outras) : '-'}</td>`;
        }).join('')}
        <td style="color: #475569; font-weight: 700;">${formatCurrency(totalOutrasCalculado)}</td>
      </tr>

      <tr class="row-highlight-blue">
        <td>(=) LUCRO LÍQUIDO REAL (SOBRA DE CAIXA)</td>
        ${meses.map(m => `<td>${m.lucro !== 0 ? formatCurrency(m.lucro) : '-'}</td>`).join('')}
        <td style="background: #bfdbfe; font-weight: 900;">${formatCurrency(totais.totalAnoLucro)}</td>
      </tr>

      <tr style="font-size: 8px; color: #1e3a8a; font-weight: 700; background: #eff6ff;">
        <td>% Margem Líquida Real</td>
        ${meses.map(m => `<td>${m.recBruta > 0 ? m.lucroPct.toFixed(1) + '%' : '-'}</td>`).join('')}
        <td style="font-weight: 800;">${(totais.totalAnoLucroPct || 0).toFixed(1)}%</td>
      </tr>
    </tbody>
  </table>

  <!-- Tabela 2: Evolução das Despesas por Categoria -->
  <div class="secao-titulo" style="border-left-color: #ef4444;">
    <span>2. Evolução Detalhada das Despesas por Categoria</span>
    <span>Composição de Custos e Gastos Operacionais</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Categoria de Despesa</th>
        ${meses.map(m => `<th>${m.nomeCurto || m.mesAno}</th>`).join('')}
        <th class="th-total" style="background: #991b1b;">TOTAL PERÍODO</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="color: #dc2626;">Diárias das Ajudantes (Equipe)</td>
        ${meses.map(m => `<td>${m.custoAj > 0 ? formatCurrency(m.custoAj) : '-'}</td>`).join('')}
        <td style="font-weight: 700; color: #dc2626;">${formatCurrency(totais.totalAnoCustoAj)}</td>
      </tr>
      <tr>
        <td style="color: #b45309;">Impostos & Taxas (DAS MEI, Taxas)</td>
        ${meses.map(m => `<td>${m.impostos > 0 ? formatCurrency(m.impostos) : '-'}</td>`).join('')}
        <td style="font-weight: 700; color: #b45309;">${formatCurrency(totais.totalAnoImpostos)}</td>
      </tr>
      <tr>
        <td style="color: #7e22ce;">Insumos & Produtos de Limpeza</td>
        ${meses.map(m => `<td>${m.insumos > 0 ? formatCurrency(m.insumos) : '-'}</td>`).join('')}
        <td style="font-weight: 700; color: #7e22ce;">${formatCurrency(totalInsumosCalculado)}</td>
      </tr>
      <tr>
        <td style="color: #1d4ed8;">Investimentos / Máquinas (ex: Aspirador)</td>
        ${meses.map(m => `<td>${m.invest > 0 ? formatCurrency(m.invest) : '-'}</td>`).join('')}
        <td style="font-weight: 700; color: #1d4ed8;">${formatCurrency(totalInvestCalculado)}</td>
      </tr>
      <tr>
        <td style="color: #475569;">Custos Fixos & Gerais</td>
        ${meses.map(m => {
          const outras = (m.gastosTotal - (m.insumos || 0) - (m.invest || 0)) || 0;
          return `<td>${outras > 0 ? formatCurrency(outras) : '-'}</td>`;
        }).join('')}
        <td style="font-weight: 700; color: #475569;">${formatCurrency(totalOutrasCalculado)}</td>
      </tr>
      <tr class="row-highlight-red">
        <td>TOTAL GERAL DE DESPESAS DO MÊS</td>
        ${meses.map(m => {
          const totMes = (m.custoAj + m.impostos + m.gastosTotal) || 0;
          return `<td>${totMes > 0 ? formatCurrency(totMes) : '-'}</td>`;
        }).join('')}
        <td style="background: #fca5a5; font-weight: 900; color: #7f1d1d;">${formatCurrency(totalDespesasGeral)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <span>Limpeza Express SP • Sistema de Gestão Financeira & Tomada de Decisão</span>
    <span>Documento gerado automaticamente em ${dataHojeStr}</span>
  </div>
</body>
</html>
  `;

  executarImpressaoIframe(html);
};

// Gerar e Imprimir Recibo Oficial de Pagamento de Diárias para Ajudante / Diarista em formato A4 Profissional
export const imprimirReciboPagamentoAjudante = ({
  ajudante,
  itens = [],
  total = 0,
  periodoDesc = 'Período Selecionado'
}) => {
  const dataHojeStr = new Date().toLocaleDateString('pt-BR', {
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
  <title>Recibo de Pagamento - ${ajudante?.nome || 'Colaboradora'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      padding: 12px;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 20px;
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
      font-size: 15px;
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
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      gap: 15px;
    }
    .info-col {
      flex: 1;
    }
    .info-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .info-val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .total-box {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-title {
      font-size: 12px;
      font-weight: 700;
      color: #065f46;
      text-transform: uppercase;
    }
    .total-sub {
      font-size: 10px;
      color: #047857;
      margin-top: 2px;
    }
    .total-amount {
      font-size: 22px;
      font-weight: 900;
      color: #065f46;
    }
    .table-container {
      margin-bottom: 18px;
    }
    .table-title {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      margin-bottom: 8px;
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
      padding: 7px 8px;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 7px 8px;
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
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    .row-total td {
      font-weight: 800;
      font-size: 11.5px;
      background: #f1f5f9 !important;
      border-top: 2px solid #cbd5e1;
      border-bottom: 2px solid #0f172a;
    }
    .signature-section {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      gap: 30px;
      page-break-inside: avoid;
    }
    .signature-box {
      flex: 1;
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      text-align: center;
      font-size: 10px;
      color: #475569;
    }
    .footer {
      margin-top: 20px;
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
      <p class="brand-subtitle">Gestão Operacional & Pagamento de Diárias</p>
    </div>
    <div class="doc-info">
      <h2 class="doc-title">Recibo de Diárias</h2>
      <p class="doc-date">Emissão: ${dataHojeStr}</p>
    </div>
  </div>

  <div class="info-card">
    <div class="info-col">
      <div class="info-label">Colaboradora / Diarista</div>
      <div class="info-val">${ajudante?.nome || 'Colaboradora'}</div>
      <div style="margin-top: 4px; font-size: 10.5px; color: #64748b;">
        Telefone: <strong>${ajudante?.telefone || 'Não informado'}</strong>
      </div>
    </div>
    <div class="info-col">
      <div class="info-label">Dados para Transferência PIX</div>
      <div style="font-size: 12px; font-weight: 700; color: #0284c7;">
        ${ajudante?.chavePix || 'Não cadastrada'}
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
        Tipo: ${ajudante?.tipoPix || 'Chave PIX'}
      </div>
    </div>
    <div class="info-col" style="text-align: right;">
      <div class="info-label">Fechamento / Período</div>
      <div style="font-size: 11.5px; font-weight: 700; color: #059669;">
        ${periodoDesc}
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
        ${itens.length} trabalho(s) discriminado(s)
      </div>
    </div>
  </div>

  <div class="total-box">
    <div>
      <div class="total-title">Valor Total Líquido a Pagar</div>
      <div class="total-sub">Total correspondente a ${itens.length} diária(s) realizada(s)</div>
    </div>
    <div class="total-amount">${formatCurrency(total)}</div>
  </div>

  <div class="table-container">
    <div class="table-title">
      <span>Discriminação dos Serviços Prestados</span>
      <span>Ordem Cronológica (01 ao 31)</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 14%;">Data</th>
          <th style="width: 12%;">Horário</th>
          <th style="width: 25%;">Cliente Atendido</th>
          <th style="width: 24%;">Local / Condomínio</th>
          <th style="width: 10%; text-align: center;">Serviço</th>
          <th style="width: 10%; text-align: right;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${itens.map((d, index) => {
          const dt = new Date(d.dataHora);
          const dataFormatada = dt.toLocaleDateString('pt-BR');
          const horaFormatada = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const stServico = d.statusServico === 'concluido' ? 'CONCLUÍDA' : d.statusServico === 'cancelado' ? 'CANCELADA' : 'AGENDADA';

          return `
          <tr>
            <td style="color: #94a3b8; font-weight: 700;">${index + 1}</td>
            <td><strong>${dataFormatada}</strong></td>
            <td>${horaFormatada}</td>
            <td style="font-weight: 600; color: #0f172a;">${d.clienteNome || 'Cliente'}</td>
            <td>${d.clienteLocal || 'São Paulo - SP'}</td>
            <td style="text-align: center;">
              <span class="badge-status">${stServico}</span>
            </td>
            <td style="text-align: right; font-weight: 700; color: #065f46;">${formatCurrency(d.valor)}</td>
          </tr>
          `;
        }).join('')}
        <tr class="row-total">
          <td colspan="6" style="text-align: right; text-transform: uppercase;">TOTAL GERAL:</td>
          <td style="text-align: right; color: #065f46; font-size: 13px;">${formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <strong>Limpeza Express SP</strong><br>
      Gestão Financeira & Operacional
    </div>
    <div class="signature-box">
      <strong>${ajudante?.nome || 'Colaboradora'}</strong><br>
      Recibo de Quitação de Diárias
    </div>
  </div>

  <div class="footer">
    <span>Limpeza Express SP • Recibo emitido para simples conferência e comprovação de pagamento de diárias</span>
    <span>Gerado em ${dataHojeStr}</span>
  </div>
</body>
</html>
  `;

  executarImpressaoIframe(html);
};


