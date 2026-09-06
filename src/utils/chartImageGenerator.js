// Utilitário para gerar imagem PNG do gráfico financeiro em alta definição (Retina 2x)
// Utilizado tanto para embutir nativamente no Microsoft Excel (.xlsx) quanto no relatório de impressão / PDF.

export const generateChartImageBase64 = (dadosGrafico = [], options = {}) => {
  const {
    width = 720,
    height = 260,
    title = 'Evolução dos Pagamentos',
    color = '#059669', // Verde Esmeralda Limpeza Express
    gradientStart = 'rgba(5, 150, 105, 0.22)',
    gradientEnd = 'rgba(5, 150, 105, 0.02)',
    textColor = '#475569',
    gridColor = '#e2e8f0',
    backgroundColor = '#ffffff'
  } = options;

  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const dpr = 2; // Alta resolução para impressão nítida
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Fundo limpo
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Borda suave de enquadramento
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  // Título e Legenda
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12.5px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, 18, 26);

  ctx.fillStyle = '#64748b';
  ctx.font = '10.5px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Eixo X: Data • Eixo Y: R$', width - 18, 26);

  if (!dadosGrafico || dadosGrafico.length === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, -apple-system, sans-serif';
    ctx.fillText('Nenhum lançamento no período selecionado', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }

  // Se tiver apenas 1 ponto, replica para traçar uma linha reta informativa
  const data = dadosGrafico.length === 1
    ? [dadosGrafico[0], dadosGrafico[0]]
    : dadosGrafico;

  const padding = { top: 50, right: 35, bottom: 42, left: 65 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => Number(d.value) || 0);
  const rawMax = Math.max(...values, 0);
  const maxValue = rawMax === 0 ? 100 : Math.ceil(rawMax * 1.18);
  const minValue = 0;

  // Grade horizontal e valores do Eixo Y
  const steps = 4;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '10px Inter, -apple-system, sans-serif';

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const y = padding.top + chartHeight - (ratio * chartHeight);
    const val = Math.round(minValue + ratio * (maxValue - minValue));

    // Linha de grade
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rótulo de Valor
    ctx.fillStyle = textColor;
    ctx.fillText(`R$ ${val}`, padding.left - 8, y);
  }

  // Pontos de coordenadas (X, Y)
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const ratio = maxValue === minValue ? 0.5 : (d.value - minValue) / (maxValue - minValue);
    const y = padding.top + chartHeight - (ratio * chartHeight);
    return { x, y, ...d };
  });

  // Área sombreada sob a curva
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  ctx.lineTo(points[0].x, padding.top + chartHeight);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
  gradient.addColorStop(0, gradientStart);
  gradient.addColorStop(1, gradientEnd);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Linha principal do gráfico
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Pontos e rótulos
  ctx.textAlign = 'center';
  points.forEach((p) => {
    // Ponto circular
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Valor acima do ponto (se não houver muitos pontos)
    if (points.length <= 16) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9.5px Inter, -apple-system, sans-serif';
      ctx.fillText(`R$ ${Math.round(p.value)}`, p.x, p.y - 10);
    }

    // Rótulo do Eixo X (Data)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, -apple-system, sans-serif';
    ctx.fillText(p.label, p.x, padding.top + chartHeight + 16);
  });

  return canvas.toDataURL('image/png');
};
