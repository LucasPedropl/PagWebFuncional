import React, { useMemo } from 'react';
import { Cobranca } from '../schemas/cobrancaSchemas';
import { CobrancaStatusFilter } from '../types/cobrancaStatusFilter';
import { presentCobranca, formatCobrancaCurrency } from '../utils/cobrancaPresentation';
import { matchesCobrancaStatusFilter } from '../utils/deriveCobrancaDisplayStatus';
import { CobrancaStatCard } from './CobrancaStatCard';
import { DollarSign, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface CobrancaStatsProps {
  cobrancas: Cobranca[];
  /** Rótulos e tooltips para visão do cliente (cobranças recebidas). */
  variant?: 'business' | 'client';
  activeFilter?: CobrancaStatusFilter;
  onFilterChange?: (filter: CobrancaStatusFilter) => void;
}

const STATS_COPY = {
  business: {
    emitidoLabel: 'Emitido',
    emitidoTooltip: 'Total acumulado de cobranças ativas (exclui canceladas)',
    emitidoFooter: 'cobranças emitidas',
    pagoTooltip: 'Cobranças com status Pago ou Repassado',
    pagoFooter: 'Faturamento liquidado',
    pendenteTooltip: 'Cobranças em aberto e no prazo. Clique para filtrar a listagem.',
    atrasadoTooltip: 'Cobranças vencidas e não pagas, com multa e juros quando houver vencimento.',
  },
  client: {
    emitidoLabel: 'Total',
    emitidoTooltip: 'Soma das cobranças ativas enviadas pelos estabelecimentos',
    emitidoFooter: 'cobranças recebidas',
    pagoTooltip: 'Valores que você já quitou',
    pagoFooter: 'Pagamentos concluídos',
    pendenteTooltip: 'Cobranças em aberto dentro do prazo. Clique para filtrar a listagem.',
    atrasadoTooltip: 'Cobranças vencidas aguardando pagamento, já com multa e juros.',
  },
} as const;

export const CobrancaStats: React.FC<CobrancaStatsProps> = ({
  cobrancas,
  variant = 'business',
  activeFilter,
  onFilterChange,
}) => {
  const copy = STATS_COPY[variant];
  const view = variant === 'client' ? 'client' : 'business';
  const interactive = typeof onFilterChange === 'function';

  const stats = useMemo(() => {
    let totalEmitido = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;
    let quantidade = 0;

    cobrancas.forEach((cobranca) => {
      const presented = presentCobranca(cobranca, view);
      if (presented.displayStatus.key === 'cancelado') return;
      quantidade += 1;
      totalEmitido += presented.displayAmount;
      if (matchesCobrancaStatusFilter(presented.displayStatus, 'pago')) {
        totalPago += presented.displayAmount;
      } else if (matchesCobrancaStatusFilter(presented.displayStatus, 'pendente')) {
        totalPendente += presented.displayAmount;
      } else if (matchesCobrancaStatusFilter(presented.displayStatus, 'atrasado')) {
        totalAtrasado += presented.displayAmount;
      }
    });

    return { totalEmitido, totalPago, totalPendente, totalAtrasado, quantidade };
  }, [cobrancas, view]);

  const toggle = (filter: CobrancaStatusFilter) => {
    if (!onFilterChange) return;
    onFilterChange(filter);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <CobrancaStatCard
        label={copy.emitidoLabel}
        tooltip={copy.emitidoTooltip}
        amount={formatCobrancaCurrency(stats.totalEmitido)}
        amountClassName="text-gray-900"
        iconWrapClassName="bg-slate-50 text-slate-700 border-slate-100"
        icon={<DollarSign className="w-5 h-5" />}
        footer={
          <span className="text-gray-500">
            <span className="font-semibold text-slate-800 mr-1">{stats.quantidade}</span>
            {copy.emitidoFooter}
          </span>
        }
        interactive={interactive}
        isActive={activeFilter === 'emitido'}
        activeClassName="ring-2 ring-slate-900 border-slate-900"
        onToggle={() => toggle('emitido')}
      />

      <CobrancaStatCard
        label="Pago"
        tooltip={copy.pagoTooltip}
        amount={formatCobrancaCurrency(stats.totalPago)}
        amountClassName="text-emerald-700"
        iconWrapClassName="bg-emerald-50 text-emerald-600 border-emerald-100"
        icon={<TrendingUp className="w-5 h-5" />}
        footer={
          <span className="text-emerald-600 font-medium inline-flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {copy.pagoFooter}
          </span>
        }
        interactive={interactive}
        isActive={activeFilter === 'pago'}
        activeClassName="ring-2 ring-emerald-600 border-emerald-600"
        onToggle={() => toggle('pago')}
      />

      <CobrancaStatCard
        label="Pendente"
        tooltip={copy.pendenteTooltip}
        amount={formatCobrancaCurrency(stats.totalPendente)}
        amountClassName="text-indigo-700"
        iconWrapClassName="bg-indigo-50 text-indigo-600 border-indigo-100"
        icon={<Clock className="w-5 h-5" />}
        footer={<span className="text-indigo-600 font-medium">Aguardando pagamento</span>}
        interactive={interactive}
        isActive={activeFilter === 'pendente'}
        activeClassName="ring-2 ring-indigo-600 border-indigo-600"
        onToggle={() => toggle('pendente')}
      />

      <CobrancaStatCard
        label="Atrasado"
        tooltip={copy.atrasadoTooltip}
        amount={formatCobrancaCurrency(stats.totalAtrasado)}
        amountClassName="text-rose-600"
        iconWrapClassName="bg-rose-50 text-rose-600 border-rose-100"
        icon={<AlertTriangle className="w-5 h-5" />}
        footer={<span className="text-rose-600 font-medium">Necessita atenção</span>}
        interactive={interactive}
        isActive={activeFilter === 'atrasado'}
        activeClassName="ring-2 ring-rose-600 border-rose-600"
        onToggle={() => toggle('atrasado')}
      />
    </div>
  );
};
