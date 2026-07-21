import React, { useEffect, useMemo, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Info, Plus } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { useCobrancas } from '../../features/single-payment/hooks/useCobrancas';
import { useEmpresaCobrancasAPagarDemo } from '../../features/single-payment/hooks/useEmpresaCobrancasAPagarDemo';
import { useProdutos } from '../../features/catalog/hooks/useProdutos';
import { useServicos } from '../../features/catalog/hooks/useServicos';
import { User } from '../../types';
import { CobrancaStats } from '../../features/single-payment/components/CobrancaStats';
import { CobrancaForm } from '../../features/single-payment/components/CobrancaForm';
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
import { CobrancaListaScope } from '../../features/single-payment/types/cobrancaListaScope';

export const PagamentoUnico: React.FC = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState<User[]>([]);
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listaScope, setListaScope] = useState<CobrancaListaScope>('criadas');
  const [payingCobranca, setPayingCobranca] = useState<Cobranca | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PagamentoUnicoResponse | null>(null);

  const { cobrancas: criadas, isLoading: isLoadingCriadas, error: errorCriadas, createCobranca, cancelCobranca } =
    useCobrancas();
  const {
    aPagar,
    isLoading: isLoadingAPagar,
    error: errorAPagar,
    pagarCobranca: pagarCobrancaDemo,
  } = useEmpresaCobrancasAPagarDemo();
  const { produtos } = useProdutos();
  const { servicos } = useServicos(idEmpresa);

  useEffect(() => {
    businessService
      .listClients()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('[PagamentoUnico] clientes:', err);
        addToast('error', 'Erro', 'Não foi possível carregar os clientes da empresa.');
      });

    companyService
      .getMyCompany()
      .then((c) => setIdEmpresa(c.idEmpresa))
      .catch((err) => console.warn('[PagamentoUnico] empresa:', err));
  }, [addToast]);

  const cobrancasAtivas = listaScope === 'a_pagar' ? aPagar : criadas;
  const isLoading = listaScope === 'a_pagar' ? isLoadingAPagar : isLoadingCriadas;
  const error = listaScope === 'a_pagar' ? errorAPagar : errorCriadas;

  const handleSubmit = async (data: {
    descricao: string;
    observacao?: string;
    clientId: number;
    valor: number;
    produtoId?: number;
    servicoId?: number;
  }): Promise<boolean> => {
    setIsSaving(true);
    try {
      await createCobranca({
        descricao: data.descricao,
        observacao: data.observacao,
        idUser: data.clientId,
        valorTotal: data.valor,
        produtos: data.produtoId ? [data.produtoId] : undefined,
        servicos: data.servicoId ? [data.servicoId] : undefined,
      });
      addToast('success', 'Cobrança cadastrada', 'A cobrança avulsa foi gerada com sucesso.');
      setIsModalOpen(false);
      setListaScope('criadas');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível criar a cobrança.';
      console.error('[PagamentoUnico] erro ao criar:', err);
      addToast('error', 'Erro ao criar cobrança', msg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelCobranca(id);
      addToast('success', 'Cancelada', 'A cobrança foi cancelada com sucesso.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cancelar.';
      console.error('[PagamentoUnico] cancel:', err);
      addToast('error', 'Erro ao cancelar', msg);
    }
  };

  const handlePay = async (metodo: MetodoPagamento) => {
    if (!payingCobranca) return;
    setIsPaying(true);
    try {
      const result = await pagarCobrancaDemo(payingCobranca.id, metodo);
      setPayingCobranca(null);
      setPaymentResult(result);
      addToast('success', 'Pagamento simulado', 'Lista "Tenho que pagar" usa dados demo até a API existir.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.';
      console.error('[PagamentoUnico] pay demo:', err);
      addToast('error', 'Erro ao pagar', msg);
    } finally {
      setIsPaying(false);
    }
  };

  const statsCobrancas = useMemo(() => cobrancasAtivas, [cobrancasAtivas]);

  return (
    <BusinessLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pagamento Único</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cobranças que você emite para clientes e cobranças que você precisa pagar.
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

      {listaScope === 'a_pagar' ? (
        <div className="mb-6 flex gap-3 rounded-[5px] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <Info className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
          <p>
            A aba <span className="font-semibold">Tenho que pagar</span> usa dados de demonstração.
            A aba <span className="font-semibold">Criei para receber</span> está integrada à API da empresa.
          </p>
        </div>
      ) : null}

      <CobrancaStats cobrancas={statsCobrancas} />

      <div className="w-full">
        <CobrancaTable
          listaScope={listaScope}
          onListaScopeChange={setListaScope}
          cobrancas={cobrancasAtivas}
          isLoading={isLoading}
          error={error}
          onCancel={listaScope === 'criadas' ? handleCancel : undefined}
          onPay={listaScope === 'a_pagar' ? (c) => setPayingCobranca(c) : undefined}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova cobrança avulsa"
        size="lg"
      >
        <CobrancaForm
          clients={clients}
          produtos={produtos}
          servicos={servicos}
          isSaving={isSaving}
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
    </BusinessLayout>
  );
};
