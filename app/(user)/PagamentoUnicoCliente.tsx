import React, { useMemo, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../../features/single-payment/schemas/cobrancaSchemas';
import { useToast } from '../../context/ToastContext';
import { useUserCobrancas } from '../../features/single-payment/hooks/useUserCobrancas';
import { CobrancaStats } from '../../features/single-payment/components/CobrancaStats';
import { CobrancaTable } from '../../features/single-payment/components/CobrancaTable';
import {
  PayCobrancaDialog,
  PaymentResultModal,
} from '../../features/single-payment/components/CobrancaPayDialogs';

/**
 * Pagamento único do cliente — lista cobranças reais (GET /Cobrancas/Usuario).
 * Emitir cobrança exige Role Admin; no cliente só existe a lista a pagar.
 */
export const PagamentoUnicoCliente: React.FC = () => {
  const { addToast } = useToast();
  const { cobrancas, isLoading, error, pagarCobranca } = useUserCobrancas();

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
      addToast('success', 'Pagamento iniciado', 'Siga as instruções do método escolhido.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.';
      console.error('[PagamentoUnicoCliente] pay:', err);
      addToast('error', 'Erro ao pagar', msg);
    } finally {
      setIsPaying(false);
    }
  };

  const statsCobrancas = useMemo(() => cobrancas, [cobrancas]);

  return (
    <UserLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pagamento Único</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cobranças emitidas por estabelecimentos para a sua conta.
          </p>
        </div>
      </div>

      <CobrancaStats cobrancas={statsCobrancas} variant="client" />

      <div className="w-full">
        <CobrancaTable
          variant="client"
          listaScope="a_pagar"
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
