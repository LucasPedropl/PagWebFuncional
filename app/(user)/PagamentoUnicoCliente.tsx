import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useCobrancaListingFilter } from '../../features/single-payment/hooks/useCobrancaListingFilter';
import {
  PayCobrancaDialog,
  PaymentResultModal,
} from '../../features/single-payment/components/CobrancaPayDialogs';
import { RequireAddressDialog } from '../../features/address/components/RequireAddressDialog';
import { useEnsureClientAddress } from '../../features/address/hooks/useEnsureClientAddress';
import { isGenericPaymentRequestFailure } from '../../features/single-payment/services/pagamentoService';
import { Button } from '../../components/ui/Button';
import { MapPin, Send, X } from 'lucide-react';
import { sessionService } from '../../services/session';
import { EmitirCobrancaUpsellDialog } from '../../features/single-payment/components/EmitirCobrancaUpsell';

type PayOutcome =
  | { status: 'ok'; data: PagamentoUnicoResponse }
  | { status: 'needs_address' }
  | { status: 'error'; error: Error }
  | { status: 'idle' };

interface PendingPay {
  cobrancaId: number;
  metodo: MetodoPagamento;
}

/**
 * Pagamento único do cliente — lista cobranças reais (GET /Cobrancas/Usuario).
 * Emitir cobrança exige Role Admin; no cliente só existe a lista a pagar.
 */
export const PagamentoUnicoCliente: React.FC = () => {
  const { addToast } = useToast();
  const { cobrancas, isLoading, error, pagarCobranca } = useUserCobrancas();
  const addressGate = useEnsureClientAddress<PagamentoUnicoResponse>();

  const [payingCobranca, setPayingCobranca] = useState<Cobranca | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PagamentoUnicoResponse | null>(null);
  const [addressFallback, setAddressFallback] = useState<{ message: string } | null>(null);
  const pendingPayRef = useRef<PendingPay | null>(null);
  const { activeFilter, commitFilter, listingRef } = useCobrancaListingFilter();
  const [showEmitirUpsell, setShowEmitirUpsell] = useState(false);
  // Mesmo critério do BusinessRoute (App.tsx): só `tipo === 'Empresa'` entra no
  // painel do estabelecimento; qualquer outro é devolvido para /dashboard.
  const canReachBusinessPanel = sessionService.getSession().user?.tipo === 'Empresa';

  const applyPayResult = (outcome: PayOutcome) => {
    if (outcome.status === 'ok') {
      setPayingCobranca(null);
      setAddressFallback(null);
      pendingPayRef.current = null;
      setPaymentResult(outcome.data);
      addToast('success', 'Pagamento iniciado', 'Siga as instruções do método escolhido.');
      return;
    }
    if (outcome.status === 'needs_address') {
      setAddressFallback(null);
      return;
    }
    if (outcome.status === 'error') {
      console.error('[PagamentoUnicoCliente] pay:', outcome.error);
      addToast('error', 'Erro ao pagar', outcome.error.message);
      if (isGenericPaymentRequestFailure(outcome.error.message)) {
        setAddressFallback({ message: outcome.error.message });
      } else {
        setAddressFallback(null);
      }
    }
  };

  const runPay = async (cobrancaId: number, metodo: MetodoPagamento) => {
    pendingPayRef.current = { cobrancaId, metodo };
    return addressGate.runWithAddressGate(() => pagarCobranca(cobrancaId, metodo));
  };

  const handlePay = async (metodo: MetodoPagamento) => {
    if (!payingCobranca) return;
    setIsPaying(true);
    try {
      const outcome = await runPay(payingCobranca.id, metodo);
      applyPayResult(outcome);
    } finally {
      setIsPaying(false);
    }
  };

  const handleAddressResolved = async () => {
    setIsPaying(true);
    try {
      const gated = await addressGate.resolveAddressAndRetry();
      if (gated.status !== 'idle') {
        applyPayResult(gated);
        return;
      }
      addressGate.setShowDialog(false);
      setAddressFallback(null);
      const pending = pendingPayRef.current;
      if (!pending) return;
      const outcome = await runPay(pending.cobrancaId, pending.metodo);
      applyPayResult(outcome);
    } finally {
      setIsPaying(false);
    }
  };

  const handleFallbackAddress = () => {
    addressGate.setShowDialog(true);
  };

  const statsCobrancas = useMemo(() => cobrancas, [cobrancas]);
  const showPayDialog =
    Boolean(payingCobranca) && !addressGate.showDialog && addressFallback === null;

  return (
    <UserLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pagamento Único</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cobranças emitidas por estabelecimentos para a sua conta.
          </p>
        </div>
        {/*
          Fica visível para todo mundo de propósito: botão escondido de quem
          ainda não pode não ensina que a funcionalidade existe. O diálogo
          explica a condição e entrega o próximo passo.
        */}
        <Button
          type="button"
          onClick={() => setShowEmitirUpsell(true)}
          className="bg-violet-600 hover:bg-violet-700 shrink-0"
        >
          <Send className="w-4 h-4 mr-2" />
          Emitir cobrança
        </Button>
      </div>

      <CobrancaStats
        cobrancas={statsCobrancas}
        variant="client"
        activeFilter={activeFilter}
        onFilterChange={(filter) =>
          commitFilter(filter, { toggleIfSame: true, scrollToListing: true })
        }
      />

      <div className="w-full" ref={listingRef}>
        <CobrancaTable
          variant="client"
          listaScope="a_pagar"
          cobrancas={cobrancas}
          isLoading={isLoading}
          error={error}
          statusFilter={activeFilter}
          onStatusFilterChange={(filter) => commitFilter(filter)}
          onPay={(c) => setPayingCobranca(c)}
        />
      </div>

      {showPayDialog && payingCobranca ? (
        <PayCobrancaDialog
          cobranca={payingCobranca}
          onPay={handlePay}
          onClose={() => setPayingCobranca(null)}
          isPaying={isPaying}
        />
      ) : null}

      {addressGate.showDialog ? (
        <RequireAddressDialog
          onResolved={() => void handleAddressResolved()}
          onCancel={addressGate.clearPending}
        />
      ) : null}

      {addressFallback && !addressGate.showDialog ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Não foi possível iniciar</h2>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                    {addressFallback.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddressFallback(null)}
                aria-label="Fechar"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Se o endereço estiver incompleto, você pode cadastrar agora ou revisar em{' '}
              <Link to="/configuracoes" className="text-violet-700 underline">
                Configurações
              </Link>
              .
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={() => setAddressFallback(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={handleFallbackAddress}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                Cadastrar endereço
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {paymentResult ? (
        <PaymentResultModal result={paymentResult} onClose={() => setPaymentResult(null)} />
      ) : null}

      {showEmitirUpsell ? (
        <EmitirCobrancaUpsellDialog
          canReachBusinessPanel={canReachBusinessPanel}
          onClose={() => setShowEmitirUpsell(false)}
        />
      ) : null}
    </UserLayout>
  );
};
