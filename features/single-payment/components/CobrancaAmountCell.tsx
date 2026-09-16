import React from 'react';
import { LateChargeBreakdown } from '../../billing-rules/schemas/billingRulesSchemas';
import { formatCobrancaCurrency } from '../utils/cobrancaPresentation';

interface CobrancaAmountCellProps {
  breakdown: LateChargeBreakdown;
  displayAmount: number;
  isOverdue: boolean;
}

/** Valor original + multa/juros visíveis quando há atraso. Nunca troca o número em silêncio. */
export const CobrancaAmountCell: React.FC<CobrancaAmountCellProps> = ({
  breakdown,
  displayAmount,
  isOverdue,
}) => {
  if (!isOverdue || !breakdown.isAtrasado) {
    return (
      <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">
        {formatCobrancaCurrency(displayAmount)}
      </span>
    );
  }

  return (
    <div className="text-sm whitespace-nowrap">
      <p className="text-[11px] text-slate-400 line-through">
        {formatCobrancaCurrency(breakdown.valorOriginal)}
      </p>
      <p className="font-semibold text-rose-700">{formatCobrancaCurrency(displayAmount)}</p>
      <p className="text-[10px] text-rose-600/90 leading-tight mt-0.5">
        multa {formatCobrancaCurrency(breakdown.multa)} · juros{' '}
        {formatCobrancaCurrency(breakdown.juros)} · {breakdown.diasAtraso}{' '}
        {breakdown.diasAtraso === 1 ? 'dia' : 'dias'}
      </p>
    </div>
  );
};
