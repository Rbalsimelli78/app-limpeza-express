import React from 'react';
import { getAgendamentoStatusPagamento } from '../utils/inadimplencia';
import { formatCurrency } from '../utils/formatters';

/**
 * Componente visual de ícone / badge de status de pagamento:
 * - Pago: Ícone de $ Verde
 * - Pendente: Ícone de $ Amarelo / Laranja (dentro do prazo)
 * - Inadimplente: Ícone de $ Vermelho de alerta (vencido)
 * 
 * Suporta variantes:
 * - 'icon': Ícone compacto ultra-limpo (ideal para as pílulas do calendário mensal)
 * - 'badge': Pílula completa com texto e ícone (ideal para cards de semana, dia e modal)
 */
export const PaymentStatusBadge = ({
  agendamento,
  cliente,
  variant = 'icon',
  onClick = null,
  showValor = false,
  style = {}
}) => {
  if (!agendamento) return null;

  const info = getAgendamentoStatusPagamento(agendamento, cliente);

  // Valor formatado para tooltips e badges
  const valorFormatado = agendamento.valorCliente ? formatCurrency(agendamento.valorCliente) : '';
  const tooltipCompleto = `${info.title}${valorFormatado ? ` • ${valorFormatado}` : ''}`;

  // =========================================================================
  // VARIANTE 1: ÍCONE COMPACTO ($) PARA A GRADE DO CALENDÁRIO MENSAL
  // =========================================================================
  if (variant === 'icon') {
    if (info.status === 'pago') {
      return (
        <span 
          title={tooltipCompleto}
          onClick={onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '13px',
            height: '13px',
            borderRadius: '50%',
            background: '#10b981',
            color: '#ffffff',
            fontSize: '0.62rem',
            fontWeight: '900',
            lineHeight: 1,
            flexShrink: 0,
            cursor: onClick ? 'pointer' : 'default',
            boxShadow: '0 1px 2px rgba(16, 185, 129, 0.45)',
            userSelect: 'none',
            ...style
          }}
        >
          $
        </span>
      );
    }

    if (info.status === 'inadimplente') {
      return (
        <span 
          title={tooltipCompleto}
          onClick={onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '15px',
            height: '13px',
            padding: '0 1.5px',
            borderRadius: '3px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.58rem',
            fontWeight: '900',
            lineHeight: 1,
            flexShrink: 0,
            cursor: onClick ? 'pointer' : 'default',
            border: '1px solid #fee2e2',
            boxShadow: '0 0 5px rgba(239, 68, 68, 0.75)',
            userSelect: 'none',
            ...style
          }}
        >
          $!
        </span>
      );
    }

    if (info.status === 'cancelado') {
      return (
        <span 
          title="Serviço Cancelado"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '13px',
            height: '13px',
            borderRadius: '50%',
            background: 'rgba(148, 163, 184, 0.25)',
            color: '#94a3b8',
            fontSize: '0.55rem',
            fontWeight: '700',
            lineHeight: 1,
            flexShrink: 0,
            ...style
          }}
        >
          ✕
        </span>
      );
    }

    // Pendente no prazo (Amarelo / Dourado)
    return (
      <span 
        title={tooltipCompleto}
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '13px',
          height: '13px',
          borderRadius: '50%',
          background: '#f59e0b',
          color: '#1e293b',
          fontSize: '0.62rem',
          fontWeight: '900',
          lineHeight: 1,
          flexShrink: 0,
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: '0 1px 2px rgba(245, 158, 11, 0.35)',
          userSelect: 'none',
          ...style
        }}
      >
        $
      </span>
    );
  }

  // =========================================================================
  // VARIANTE 2: BADGE COMPLETO COM TEXTO (SEMANA, DIA, LISTA E MODAL)
  // =========================================================================
  return (
    <span 
      title={tooltipCompleto}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: '700',
        background: info.bg,
        border: `1px solid ${info.border}`,
        color: info.corTexto,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'var(--transition)',
        ...style
      }}
    >
      {/* Ícone de $ interno do badge */}
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: info.status === 'inadimplente' ? '15px' : '13px',
          height: '13px',
          borderRadius: info.status === 'inadimplente' ? '3px' : '50%',
          background: info.cor,
          color: info.status === 'pendente' ? '#1e293b' : '#ffffff',
          fontSize: '0.58rem',
          fontWeight: '900',
          lineHeight: 1,
          flexShrink: 0
        }}
      >
        {info.simbolo}
      </span>

      <span>
        {info.status === 'pago' ? 'PAGO' : 
         info.status === 'inadimplente' ? (info.diasAtraso ? `INADIMPLENTE (${info.diasAtraso}d)` : 'INADIMPLENTE') : 
         info.status === 'cancelado' ? 'CANCELADO' : 'PENDENTE'}
      </span>

      {showValor && valorFormatado && (
        <span style={{ opacity: 0.85, fontWeight: '500', marginLeft: '2px' }}>
          • {valorFormatado}
        </span>
      )}
    </span>
  );
};
