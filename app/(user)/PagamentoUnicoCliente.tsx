import React, { useMemo, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Info, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useClientePagamentoUnicoDemo } from '../../features/single-payment/hooks/useClientePagamentoUnicoDemo';
import { CobrancaStats } from '../../features/single-payment/components/CobrancaStats';
import { CobrancaTable } from '../../features/single-payment/components/CobrancaTable';
import { CobrancaForm } from '../../features/single-payment/components/CobrancaForm';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../../features/single-payment/schemas/cobrancaSchemas';
import {
  PayCobrancaDialog,
  PaymentResultModal,
} from '../../features/single-payment/components/CobrancaPayDialogs';
import { CobrancaListaScope } from '../../features/single-payment/types/cobrancaListaScope';

/**
 * Pagamento único do cliente — layout espelhado do business, com dados demo.
 */
export const PagamentoUnicoCliente: React.FC = () => {
  const { addToast } = useToast();
  const {
    aPagar,
    criadas,
    pagadores,
    isLoading,
    error,
    createCobranca,
    cancelCobranca,
    pagarCobranca,
  } = useClientePagamentoUnicoDemo();

  const [listaScope, setListaScope] = useState<CobrancaListaScope>('a_pagar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [payingCobranca, setPayingCobranca] = useState<Cobranca | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PagamentoUnicoResponse | null>(null);

  const cobrancasAtivas = listaScope === 'a_pagar' ? aPagar : criadas;

  const handleSubmit = async (data: {
    descricao: string;
    observacao?: string;
    clientId: number;
    valor: number;
  }): Promise<boolean> => {
    setIsSaving(true);
    try {
      await createCobranca({
        descricao: data.descricao,
        observacao: data.observacao,
        clientId: data.clientId,
        valor: data.valor,
      });
      addToast('success', 'Cobrança cadastrada', 'A cobrança foi adicionada à lista (demo).');
      setIsModalOpen(false);
      setListaScope('criadas');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível criar a cobrança.';
      console.error('[PagamentoUnicoCliente] create:', err);
      addToast('error', 'Erro ao criar cobrança', msg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelCobranca(id);
      addToast('success', 'Cancelada', 'A cobrança foi cancelada (demo).');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cancelar.';
      console.error('[PagamentoUnicoCliente] cancel:', err);
      addToast('error', 'Erro ao cancelar', msg);
    }
  };

  const handlePay = async (metodo: MetodoPagamento) => {
    if (!payingCobranca) return;
    setIsPaying(true);
    try {
      const result = await pagarCobranca(payingCobranca.id, metodo, 'a_pagar');
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

  const statsCobrancas = useMemo(() => cobrancasAtivas, [cobrancasAtivas]);

  return (
    <UserLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pagamento Único</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cobranças que você precisa pagar e cobranças que você criou para receber.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Cobrança
        </Button>
      </div>

      <div className="mb-6 flex gap-3 rounded-[5px] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <Info className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
        <p>
          <span className="font-semibold">Modo demonstração.</span> Cadastro, listas e pagamento são
          simulados localmente até o backend do cliente ficar disponível.
        </p>
      </div>

      <CobrancaStats cobrancas={statsCobrancas} variant="client" />

      <div className="w-full">
        <CobrancaTable
          variant="client"
          listaScope={listaScope}
          onListaScopeChange={setListaScope}
          cobrancas={cobrancasAtivas}
          isLoading={isLoading}
          error={error}
          onPay={listaScope === 'a_pagar' ? (c) => setPayingCobranca(c) : undefined}
          onCancel={listaScope === 'criadas' ? handleCancel : undefined}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova cobrança avulsa"
        size="lg"
      >
        <CobrancaForm
          clients={pagadores}
          produtos={[]}
          servicos={[]}
          isSaving={isSaving}
          showCatalogFields={false}
          counterpartyLabel="Quem vai pagar"
          counterpartyPlaceholder="Selecione quem deve pagar..."
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

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
