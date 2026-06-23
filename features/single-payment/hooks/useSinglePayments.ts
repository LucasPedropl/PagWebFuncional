import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateSinglePaymentInput,
  SinglePayment,
  SinglePaymentStatus,
} from '../schemas/singlePaymentTypes';
import { localSinglePaymentStore } from '../services/localSinglePaymentStore';
import { SINGLE_PAYMENT_CHANGED_EVENT } from '../../../utils/sessionUser';

interface UseSinglePaymentsFilters {
  idEmpresa?: number;
  idUser?: number;
  userEmail?: string;
  status?: SinglePaymentStatus;
}

/** Pagamentos únicos locais (sem API). */
export const useSinglePayments = (filters?: UseSinglePaymentsFilters) => {
  const [payments, setPayments] = useState<SinglePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        idEmpresa: filters?.idEmpresa,
        idUser: filters?.idUser,
        userEmail: filters?.userEmail,
        status: filters?.status,
      }),
    [filters?.idEmpresa, filters?.idUser, filters?.userEmail, filters?.status],
  );

  const refresh = useCallback(() => {
    try {
      setPayments(localSinglePaymentStore.listPayments(filters));
      setError(null);
    } catch (err) {
      console.error('[useSinglePayments] Erro ao carregar:', err);
      setError('Não foi possível carregar os pagamentos.');
    } finally {
      setIsLoading(false);
    }
  }, [filterKey, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener(SINGLE_PAYMENT_CHANGED_EVENT, onChanged);
    window.addEventListener('storage', onChanged);
    return () => {
      window.removeEventListener(SINGLE_PAYMENT_CHANGED_EVENT, onChanged);
      window.removeEventListener('storage', onChanged);
    };
  }, [refresh]);

  const createPayment = useCallback(
    (input: CreateSinglePaymentInput) => localSinglePaymentStore.createPayment(input),
    [],
  );

  const markAsPaid = useCallback(
    (id: string) => localSinglePaymentStore.markAsPaid(id),
    [],
  );

  const cancelPayment = useCallback(
    (id: string) => localSinglePaymentStore.cancelPayment(id),
    [],
  );

  const acceptPayment = useCallback(
    (id: string) => localSinglePaymentStore.acceptPayment(id),
    [],
  );

  return {
    payments,
    isLoading,
    error,
    refresh,
    createPayment,
    markAsPaid,
    cancelPayment,
    acceptPayment,
  };
};
