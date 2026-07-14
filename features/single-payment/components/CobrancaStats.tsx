import React, { useMemo } from 'react';
import { Cobranca } from '../schemas/cobrancaSchemas';
import { InfoTooltip } from '../../../components/ui/InfoTooltip';
import { DollarSign, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface CobrancaStatsProps {
  cobrancas: Cobranca[];
}

export const CobrancaStats: React.FC<CobrancaStatsProps> = ({ cobrancas }) => {
  const stats = useMemo(() => {
    let totalEmitido = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;

    cobrancas.forEach((c) => {
      if (c.status !== 'Cancelado') {
        totalEmitido += c.valorTotal;
      }
      if (c.status === 'Pago' || c.status === 'Repassado') {
        totalPago += c.valorTotal;
      } else if (c.status === 'Aberto') {
        totalPendente += c.valorTotal;
      } else if (c.status === 'Atrasado') {
        totalAtrasado += c.valorTotal;
      }
    });

    return {
      totalEmitido,
      totalPago,
      totalPendente,
      totalAtrasado,
      quantidade: cobrancas.filter((c) => c.status !== 'Cancelado').length,
    };
  }, [cobrancas]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Emitido */}
      <div className="bg-white p-5 rounded-[5px] shadow-sm border border-gray-100 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Emitido</span>
              <InfoTooltip text="Total acumulado de cobranças ativas (exclui canceladas)" popoverRadiusClass="rounded-[5px]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalEmitido)}</h3>
          </div>
          <div className="p-2.5 rounded-[5px] bg-slate-50 text-slate-700 border border-slate-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <span className="font-semibold text-slate-800 mr-1">{stats.quantidade}</span> cobranças emitidas
        </div>
      </div>

      {/* Total Pago */}
      <div className="bg-white p-5 rounded-[5px] shadow-sm border border-gray-100 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</span>
              <InfoTooltip text="Cobranças com status Pago ou Repassado" popoverRadiusClass="rounded-[5px]" />
            </div>
            <h3 className="text-xl font-bold text-emerald-700 mt-2">{formatCurrency(stats.totalPago)}</h3>
          </div>
          <div className="p-2.5 rounded-[5px] bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Faturamento liquidado
        </div>
      </div>

      {/* Em Aberto */}
      <div className="bg-white p-5 rounded-[5px] shadow-sm border border-gray-100 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pendente</span>
              <InfoTooltip text="Cobranças que estão em aberto e no prazo" popoverRadiusClass="rounded-[5px]" />
            </div>
            <h3 className="text-xl font-bold text-indigo-700 mt-2">{formatCurrency(stats.totalPendente)}</h3>
          </div>
          <div className="p-2.5 rounded-[5px] bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-indigo-600 font-medium">
          Aguardando pagamento
        </div>
      </div>

      {/* Atrasado */}
      <div className="bg-white p-5 rounded-[5px] shadow-sm border border-gray-100 transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Atrasado</span>
              <InfoTooltip text="Cobranças vencidas e não pagas" popoverRadiusClass="rounded-[5px]" />
            </div>
            <h3 className="text-xl font-bold text-rose-600 mt-2">{formatCurrency(stats.totalAtrasado)}</h3>
          </div>
          <div className="p-2.5 rounded-[5px] bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 flex items-center text-xs text-rose-600 font-medium">
          Necessita atenção
        </div>
      </div>
    </div>
  );
};
