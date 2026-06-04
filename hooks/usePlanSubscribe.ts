import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { ClientSubscription, PlanResponse } from '../types';
import {
  getPlanTipoContrato,
  requiresContractAckType,
  requiresSignedContractType,
} from '../utils/api';
import { buildContractPdfWithEvidence, buildSignedContractFile } from '../utils/contractPdf';
import { hasBlockingSubscription } from '../utils/planSubscribeEligibility';

export interface SubscribeFormState {
  periodo: string;
  diaPagamento: string;
  isRecorrente: boolean;
  aceitouTermos: boolean;
  signatureDataUrl: string | null;
  photoDataUrl: string | null;
}

const defaultForm = (): SubscribeFormState => ({
  periodo: '12',
  diaPagamento: Math.min(new Date().getDate(), 30).toString(),
  isRecorrente: true,
  aceitouTermos: false,
  signatureDataUrl: null,
  photoDataUrl: null,
});

interface UsePlanSubscribeOptions {
  onSuccess?: () => void;
}

/** Fluxo de assinatura de plano pelo cliente (conexão automática + multipart). */
export function usePlanSubscribe(options?: UsePlanSubscribeOptions) {
  const { addToast } = useToast();
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [establishmentName, setEstablishmentName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [subscribeStep, setSubscribeStep] = useState(0);
  const [subscribeForm, setSubscribeForm] = useState<SubscribeFormState>(defaultForm);
  const [mergedContractPdfUrl, setMergedContractPdfUrl] = useState<string | null>(null);
  const [mergedContractBlob, setMergedContractBlob] = useState<Blob | null>(null);
  const [isBuildingMergedPdf, setIsBuildingMergedPdf] = useState(false);

  const requiresSignedContract = (p: PlanResponse) =>
    requiresSignedContractType(getPlanTipoContrato(p));

  const requiresContractAck = (p: PlanResponse) =>
    requiresContractAckType(getPlanTipoContrato(p));

  const hasContractStep = (p: PlanResponse) =>
    Boolean(p.contratoPath) || requiresContractAck(p);

  const getSubscribeSteps = useCallback(
    (p: PlanResponse) => {
      const steps = [
        { id: 'plano', label: 'Plano' },
        { id: 'config', label: 'Pagamento' },
      ];
      if (hasContractStep(p)) steps.push({ id: 'contrato', label: 'Contrato' });
      steps.push({ id: 'confirmacao', label: 'Confirmar' });
      return steps;
    },
    [],
  );

  const close = useCallback(() => {
    setMergedContractPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMergedContractBlob(null);
    setIsOpen(false);
    setPlan(null);
    setIdEmpresa(null);
    setEstablishmentName('');
    setSubscribeStep(0);
    setSubscribeForm(defaultForm());
  }, []);

  const openSubscribe = useCallback(
    async (params: {
      plan: PlanResponse;
      idEmpresa: number;
      establishmentName: string;
      subscriptions?: ClientSubscription[];
    }) => {
      if (params.plan.assinarPorCliente === false) {
        addToast(
          'error',
          'Plano indisponível',
          'Este plano só pode ser contratado pelo estabelecimento.',
        );
        return;
      }

      if (hasBlockingSubscription(params.plan, params.subscriptions ?? [])) {
        addToast('error', 'Plano já contratado', 'Você já possui este plano ativo ou pendente.');
        return;
      }

      setIsConnecting(true);
      try {
        await userService.ensureCompanyConnection(params.idEmpresa);
        let connections = await userService.listConnections();
        let conn = connections.find((c) => c.idEmpresa === params.idEmpresa);
        if (conn?.status === 'Pendente') {
          await userService.acceptConnection(params.idEmpresa);
          connections = await userService.listConnections();
          conn = connections.find((c) => c.idEmpresa === params.idEmpresa);
        }
        const isActive =
          conn?.status === 'Ativo' ||
          connections.some(
            (c) =>
              c.idEmpresa === params.idEmpresa &&
              String(c.status).toLowerCase() === 'ativo',
          );
        if (!isActive) {
          throw new Error('Não foi possível ativar a conexão com o estabelecimento.');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Falha ao conectar com o estabelecimento.';
        console.error('[PagWeb] Conexão antes da assinatura:', err);
        addToast('error', 'Conexão', message);
        return;
      } finally {
        setIsConnecting(false);
      }

      setPlan(params.plan);
      setIdEmpresa(params.idEmpresa);
      setEstablishmentName(params.establishmentName);
      setSubscribeForm(defaultForm());
      setSubscribeStep(0);
      setIsOpen(true);
    },
    [addToast],
  );

  const validateSubscribeStep = useCallback((): boolean => {
    if (!plan) return false;
    const steps = getSubscribeSteps(plan);
    const current = steps[subscribeStep];
    if (!current) return false;

    if (current.id === 'config') {
      const dia = Number(subscribeForm.diaPagamento);
      if (dia < 1 || dia > 30) {
        addToast('error', 'Pagamento', 'Dia de pagamento deve ser entre 1 e 30.');
        return false;
      }
      if (!subscribeForm.isRecorrente) {
        const periodo = Number(subscribeForm.periodo);
        if (!periodo || periodo < 1) {
          addToast('error', 'Pagamento', 'Informe um período válido em meses.');
          return false;
        }
      }
    }

    if (current.id === 'contrato') {
      if (requiresSignedContract(plan)) {
        if (!subscribeForm.signatureDataUrl) {
          addToast('error', 'Contrato', 'Desenhe sua assinatura antes de continuar.');
          return false;
        }
        if (!subscribeForm.photoDataUrl) {
          addToast('error', 'Contrato', 'Registre sua foto antes de continuar.');
          return false;
        }
      }
      if (requiresContractAck(plan) && !subscribeForm.aceitouTermos) {
        addToast('error', 'Contrato', 'Aceite os termos antes de continuar.');
        return false;
      }
    }

    return true;
  }, [plan, subscribeStep, subscribeForm, getSubscribeSteps, addToast]);

  const goNext = useCallback(() => {
    if (!validateSubscribeStep() || !plan) return;
    const steps = getSubscribeSteps(plan);
    setSubscribeStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [validateSubscribeStep, plan, getSubscribeSteps]);

  const goPrev = useCallback(() => {
    setSubscribeStep((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    if (!isOpen || !plan) return;
    const steps = getSubscribeSteps(plan);
    const current = steps[subscribeStep];
    if (current?.id !== 'confirmacao' || !requiresSignedContract(plan)) {
      setMergedContractPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMergedContractBlob(null);
      return;
    }

    const hasEvidence =
      subscribeForm.signatureDataUrl || subscribeForm.photoDataUrl;
    if (!hasEvidence && !plan.contratoPath) return;

    let cancelled = false;
    const build = async () => {
      setIsBuildingMergedPdf(true);
      try {
        const blob = await buildContractPdfWithEvidence(
          plan.contratoPath ?? null,
          subscribeForm.signatureDataUrl,
          subscribeForm.photoDataUrl,
        );
        if (cancelled) return;
        setMergedContractBlob(blob);
        setMergedContractPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch (err) {
        console.error('[PagWeb] PDF do contrato:', err);
        if (!cancelled) {
          addToast('error', 'Contrato', 'Não foi possível montar o PDF com assinatura.');
        }
      } finally {
        if (!cancelled) setIsBuildingMergedPdf(false);
      }
    };

    void build();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    plan,
    subscribeStep,
    subscribeForm.signatureDataUrl,
    subscribeForm.photoDataUrl,
    getSubscribeSteps,
    addToast,
  ]);

  const confirmSubscription = useCallback(async () => {
    if (!plan || !idEmpresa) return;

    if (requiresContractAck(plan) && !subscribeForm.aceitouTermos) {
      addToast('error', 'Contrato', 'Aceite os termos antes de assinar.');
      return;
    }

    if (requiresSignedContract(plan)) {
      if (!subscribeForm.signatureDataUrl) {
        addToast('error', 'Contrato', 'Desenhe sua assinatura antes de confirmar.');
        return;
      }
      if (!subscribeForm.photoDataUrl) {
        addToast('error', 'Contrato', 'Registre sua foto antes de confirmar.');
        return;
      }
      if (isBuildingMergedPdf) {
        addToast('error', 'Contrato', 'Aguarde a montagem do PDF com assinatura e foto.');
        return;
      }
      if (!mergedContractBlob) {
        addToast(
          'error',
          'Contrato',
          'O PDF com assinatura e foto ainda não está pronto. Aguarde ou volte à etapa do contrato.',
        );
        return;
      }
    }

    setIsSubscribing(true);
    try {
      const periodo = subscribeForm.isRecorrente
        ? 0
        : Math.max(1, Number(subscribeForm.periodo));

      let contratoFile: File | null = null;
      if (requiresSignedContract(plan)) {
        contratoFile = new File([mergedContractBlob!], 'contrato-assinado.pdf', {
          type: 'application/pdf',
        });
        if (contratoFile.size === 0) {
          throw new Error('O PDF do contrato assinado está vazio.');
        }
      }

      await userService.assinarPlano({
        idPlano: plan.idPlano,
        idEmpresa,
        periodo,
        diaPagamento: Math.min(30, Math.max(1, Number(subscribeForm.diaPagamento))),
        contrato: contratoFile,
        observacao: subscribeForm.isRecorrente ? 'Assinatura recorrente' : undefined,
      });

      addToast('success', 'Assinatura realizada', `Você assinou ${plan.nome} com sucesso.`);
      close();
      window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
      options?.onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao assinar plano.';
      console.error('[PagWeb] assinarPlano:', err);
      addToast('error', 'Erro ao assinar', message);
    } finally {
      setIsSubscribing(false);
    }
  }, [
    plan,
    idEmpresa,
    subscribeForm,
    mergedContractBlob,
    isBuildingMergedPdf,
    close,
    addToast,
    options,
  ]);

  return {
    isOpen,
    isConnecting,
    isSubscribing,
    isBuildingMergedPdf,
    plan,
    idEmpresa,
    establishmentName,
    subscribeStep,
    subscribeForm,
    setSubscribeForm,
    mergedContractPdfUrl,
    mergedContractBlob,
    openSubscribe,
    close,
    goNext,
    goPrev,
    confirmSubscription,
    getSubscribeSteps,
    requiresSignedContract,
    requiresContractAck,
    setSubscribeStep,
  };
}
