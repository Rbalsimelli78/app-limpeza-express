import React, { useState } from 'react';

export const LineChart = ({ 
  data = [], 
  height = 220, 
  color = '#10b981', 
  gradientColor = '#06b6d4',
  valuePrefix = 'R$ ',
  emptyMessage = 'Nenhum lançamento no período selecionado'
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        padding: '1rem',
        textAlign: 'center'
      }}>
        <span>📊</span>
        <span style={{ marginTop: '0.5rem' }}>{emptyMessage}</span>
      </div>
    );
  }

  // Se tiver apenas 1 ponto, duplicamos visualmente para traçar uma linha reta informativa
  const chartData = data.length === 1 
    ? [
        { ...data[0], label: `${data[0].label} (Início)` }, 
        { ...data[0], label: `${data[0].label} (Fim)` }
      ]
    : data;

  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const width = 600; // viewBox width fixo para SVG escalável responsivo
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = chartData.map(d => Number(d.value) || 0);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);

  // Arredonda teto do gráfico para múltiplos limpos
  const maxValue = rawMax === 0 ? 100 : Math.ceil(rawMax * 1.15);
  const minValue = 0; // Começa do zero para percepção real de grandeza financeira

  // Gerar coordenadas dos pontos
  const points = chartData.map((d, index) => {
    const x = padding.left + (index / (chartData.length - 1)) * chartWidth;
    const yRatio = maxValue === minValue ? 0.5 : (d.value - minValue) / (maxValue - minValue);
    const y = padding.top + chartHeight - (yRatio * chartHeight);
    return { x, y, ...d };
  });

  // Linha SVG contínua
  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Área sombreada sob a curva
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Linhas de grade horizontais (4 níveis)
  const gridLevels = [0, 0.33, 0.66, 1];

  const formatVal = (val) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={gradientColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Linhas de Grade Horizontais e Etiquetas Y */}
        {gridLevels.map((lvl, i) => {
          const y = padding.top + chartHeight - (lvl * chartHeight);
          const val = Math.round(minValue + lvl * (maxValue - minValue));
          return (
            <g key={i}>
              <line 
                x1={padding.left} 
                y1={y} 
                x2={width - padding.right} 
                y2={y} 
                stroke="var(--border-color)" 
                strokeDasharray="4 4" 
                strokeWidth="1"
              />
              <text 
                x={padding.left - 8} 
                y={y + 4} 
                textAnchor="end" 
                fontSize="10" 
                fill="var(--text-muted)"
                fontFamily="var(--font-sans)"
              >
                {valuePrefix}{formatVal(val)}
              </text>
            </g>
          );
        })}

        {/* Área Sombreada */}
        <path 
          d={areaD} 
          fill={`url(#grad-${color.replace('#', '')})`} 
        />

        {/* Linha Principal */}
        <path 
          d={pathD} 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Pontos Interativos e Etiquetas X */}
        {points.map((pt, i) => (
          <g key={i}>
            {/* Linha vertical do ponto até o chão ao passar o mouse */}
            {hoveredPoint?.index === i && (
              <line 
                x1={pt.x} 
                y1={pt.y} 
                x2={pt.x} 
                y2={padding.top + chartHeight} 
                stroke={color} 
                strokeWidth="1.5" 
                strokeDasharray="2 2"
              />
            )}

            {/* Círculo com halo ao hover */}
            <circle 
              cx={pt.x} 
              cy={pt.y} 
              r={hoveredPoint?.index === i ? 7 : 4.5} 
              fill={hoveredPoint?.index === i ? color : 'var(--bg-card)'} 
              stroke={color} 
              strokeWidth={hoveredPoint?.index === i ? 3 : 2}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoveredPoint({ ...pt, index: i })}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {/* Etiqueta X (Data) */}
            <text 
              x={pt.x} 
              y={padding.top + chartHeight + 18} 
              textAnchor="middle" 
              fontSize="10" 
              fill={hoveredPoint?.index === i ? 'var(--text-primary)' : 'var(--text-muted)'}
              fontWeight={hoveredPoint?.index === i ? '700' : '500'}
              fontFamily="var(--font-sans)"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip Flutuante */}
      {hoveredPoint && (
        <div style={{
          position: 'absolute',
          left: `${(hoveredPoint.x / width) * 100}%`,
          top: `${(hoveredPoint.y / height) * 100}%`,
          transform: 'translate(-50%, -125%)',
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#ffffff',
          padding: '0.4rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          border: `1px solid ${color}`,
          zIndex: 10,
          whiteSpace: 'nowrap'
        }}>
          <div style={{ fontWeight: '700', color: color }}>
            {valuePrefix}{new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(hoveredPoint.value)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {hoveredPoint.tooltip || hoveredPoint.label}
          </div>
        </div>
      )}
    </div>
  );
};
