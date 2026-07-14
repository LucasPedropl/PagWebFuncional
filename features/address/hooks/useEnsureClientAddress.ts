import { useCallback, useState } from 'react';
import { enderecoService } from '../services/enderecoService';
import { isAddressMissingError } from '../schemas/enderecoSchemas';

interface EnsureAddressResult<T> {
  needsAddress: boolean;
  runWithAddressGate: (
    action: () => Promise<T>,
  ) => Promise<{ status: 'ok'; data: T } | { status: 'needs_address' } | { status: 'error'; error: Error }>;
  resolveAddressAndRetry: () => Promise<{ status: 'ok'; data: T } | { status: 'error'; error: Error } | { status: 'idle' }>;
  clearPending: () => void;
  showDialog: boolean;
  setShowDialog: (open: boolean) => void;
}

/**
 * Gate de endereço residencial do cliente antes de chamar endpoints Bixs.
 */
export const useEnsureClientAddress = <T,>(): EnsureAddressResult<T> => {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<T>) | null>(null);

  const clearPending = useCallback(() => {
    setPendingAction(null);
    setShowDialog(false);
  }, []);

  const runWithAddressGate = useCallback(
    async (action: () => Promise<T>) => {
      // Não bloquear por localStorage: o endereço pode existir no backend
      // (cadastro) mesmo sem a flag — a API de pagamento é a fonte da verdade.
      try {
        const data = await action();
        enderecoService.markClientAddressOk();
        return { status: 'ok' as const, data };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro no pagamento');
        if (isAddressMissingError(error.message)) {
          enderecoService.clearClientAddressFlag();
          setPendingAction(() => action);
          setShowDialog(true);
          return { status: 'needs_address' as const };
        }
        return { status: 'error' as const, error };
      }
    },
    [],
  );

  const resolveAddressAndRetry = useCallback(async () => {
    if (!pendingAction) return { status: 'idle' as const };
    const action = pendingAction;
    setShowDialog(false);
    setPendingAction(null);
    try {
      const data = await action();
      return { status: 'ok' as const, data };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro no pagamento');
      return { status: 'error' as const, error };
    }
  }, [pendingAction]);

  return {
    needsAddress: showDialog,
    runWithAddressGate,
    resolveAddressAndRetry,
    clearPending,
    showDialog,
    setShowDialog,
  };
};
