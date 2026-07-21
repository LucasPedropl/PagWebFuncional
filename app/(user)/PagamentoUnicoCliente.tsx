import React, { useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useClientePagamentoUnicoDemo } from '../../features/single-payment/hooks/useClientePagamentoUnicoDemo';
import { CobrancaStats } from '../../features/single-payment/components/CobrancaStats';
import { CobrancaTable } from '../../features/single-payment/components/CobrancaTable';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../../features/single-payment/schemas/cobrancaSchemas';
import {
  PayCobrancaDialog,
  PaymentResultModal,
} from '../../features/single-payment/components/CobrancaPayDialogs';

/**
 * Visão do cliente espelhando `#/business/pagamento-unico` (cards + tabela).
 * Dados e pagamento simulados até a API de cobranças do usuário estar disponível.
 */
export const PagamentoUnicoCliente: React.FC = () => {
  const { addToast } = useToast();
  const { cobrancas, isLoading, error, pagarCobranca } = useClientePagamentoUnicoDemo();
  const [payingCobranca, setPayingCobranca] = useState<Cobranca | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PagamentoUnicoResponse | null>(null);

  const handlePay = async (metodo: MetodoPagamento) => {
    if (!payingCobranca) return;
    setIsPaying(true);
    try {
      const result = await pagarCobranca(payingCobranca.id, metodo);
      setPayingCobranca(null);
      setPaymentResult(result);
      addToast('success', 'Pagamento simulado', 'Integração real será ativada quando a API estiver pronta.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.';
      console.error('[PagamentoUnicoCliente] pay:', err);
      addToast('error', 'Erro ao pagar', msg);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <UserLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pagamento Único</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cobranças avulsas enviadas pelos estabelecimentos que você utiliza.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-3 rounded-[5px] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <Info className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
        <p>
          <span className="font-semibold">Modo demonstração.</span> Os valores abaixo são fictícios;
          o pagamento apenas simula a experiência. Quando o backend estiver pronto, esta tela passará
          a usar a API de cobranças do cliente.
        </p>
      </div>

      <CobrancaStats cobrancas={cobrancas} variant="client" />

      <div className="w-full">
        <CobrancaTable
          variant="client"
          cobrancas={cobrancas}
          isLoading={isLoading}
          error={error}
          onPay={(c) => setPayingCobranca(c)}
        />
      </div>

      {payingCobranca && (
        <PayCobrancaDialog
          cobranca={payingCobranca}
          onPay={handlePay}
          onClose={() => setPayingCobranca(null)}
          isPaying={isPaying}
        />
      )}

      {paymentResult && (
        <PaymentResultModal result={paymentResult} onClose={() => setPaymentResult(null)} />
      )}
    </UserLayout>
  );
};
