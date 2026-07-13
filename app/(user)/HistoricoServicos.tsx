import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Loader2, Receipt, Scissors, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useUserCobrancas } from '../../features/single-payment/hooks/useUserCobrancas';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../../features/single-payment/schemas/cobrancaSchemas';
import {
  PayCobrancaDialog,
  PaymentResultModal,
} from '../../features/single-payment/components/CobrancaPayDialogs';
import { RequireAddressDialog } from '../../features/address/components/RequireAddressDialog';
import { useEnsureClientAddress } from '../../features/address/hooks/useEnsureClientAddress';
import {
  formatServicePrice,
  STATUS_STYLES,
} from '../../features/services/utils/serviceFormatters';

const STATUS_BADGE: Record<string, string> = {
  Aberto: STATUS_STYLES.confirmado,
  Pago: STATUS_STYLES.concluido,
  Repassado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Atrasado: 'bg-red-50 text-red-700 border-red-200',
  Cancelado: 'bg-gray-50 text-gray-500 border-gray-200',
};

const isPayable = (c: Cobranca): boolean =>
  c.status === 'Aberto' || c.status === 'Atrasado';

export const HistoricoServicos: React.FC = () => {
  const { addToast } = useToast();
  const { cobrancas, isLoading, error, pagarCobranca } = useUserCobrancas();
  const addressGate = useEnsureClientAddress<PagamentoUnicoResponse>();
  const [payingCobranca, setPayingCobranca] = useState<Cobranca | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PagamentoUnicoResponse | null>(null);

  const activeCobrancas = cobrancas.filter((c) => c.status !== 'Cancelado');

  const applyPayResult = (
    outcome:
      | { status: 'ok'; data: PagamentoUnicoResponse }
      | { status: 'needs_address' }
      | { status: 'error'; error: Error }
      | { status: 'idle' },
  ) => {
    if (outcome.status === 'ok') {
      setPayingCobranca(null);
      setPaymentResult(outcome.data);
      addToast('success', 'Pagamento iniciado', 'Utilize o código gerado para pagar.');
      return;
    }
    if (outcome.status === 'error') {
      console.error('[HistoricoServicos] Erro ao pagar:', outcome.error);
      addToast('error', 'Erro ao pagar', outcome.error.message);
    }
  };

  const handlePay = async (metodo: MetodoPagamento) => {
    if (!payingCobranca) return;
    setIsPaying(true);
    try {
      const cobrancaId = payingCobranca.id;
      const outcome = await addressGate.runWithAddressGate(() =>
        pagarCobranca(cobrancaId, metodo),
      );
      applyPayResult(outcome);
    } finally {
      setIsPaying(false);
    }
  };

  const handleAddressResolved = async () => {
    setIsPaying(true);
    try {
      const outcome = await addressGate.resolveAddressAndRetry();
      applyPayResult(outcome);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cobranças</h1>
        <p className="text-gray-500 mt-1">
          Visualize e pague as cobranças avulsas das empresas que você utiliza.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 text-center gap-3 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : activeCobrancas.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {activeCobrancas.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                  <Scissors className="w-6 h-6 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{c.descricao}</h3>
                  <p className="text-sm text-gray-500">{c.empresa?.nome ?? '—'}</p>
                  {c.observacao && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.observacao}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[c.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-end md:items-center gap-4 shrink-0">
                <span className="text-2xl font-bold text-gray-900">
                  {formatServicePrice(c.valorTotal)}
                </span>
                {isPayable(c) && (
                  <Button
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={() => setPayingCobranca(c)}
                  >
                    Pagar
                  </Button>
                )}
                {c.status === 'Pago' && (
                  <span className="flex items-center gap-1 text-green-700 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Pago
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {payingCobranca && !addressGate.showDialog && (
        <PayCobrancaDialog
          cobranca={payingCobranca}
          onPay={handlePay}
          onClose={() => setPayingCobranca(null)}
          isPaying={isPaying}
        />
      )}

      {addressGate.showDialog && (
        <RequireAddressDialog
          onResolved={() => void handleAddressResolved()}
          onCancel={addressGate.clearPending}
        />
      )}

      {paymentResult && (
        <PaymentResultModal result={paymentResult} onClose={() => setPaymentResult(null)} />
      )}
    </UserLayout>
  );
};

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
    <Receipt className="w-12 h-12 text-gray-300" />
    <h3 className="text-lg font-semibold text-gray-900 mt-4">Nenhuma cobrança registrada</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">
      Quando um estabelecimento registrar um serviço avulso para você, ele aparecerá aqui.
    </p>
    <Link to="/pagamentos" className="mt-6">
      <Button className="bg-violet-600 hover:bg-violet-700">Ver faturas</Button>
    </Link>
  </div>
);
