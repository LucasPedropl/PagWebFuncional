import { useCallback, useEffect, useState } from 'react';
import { Cobranca, CreateCobrancaInput } from '../schemas/cobrancaSchemas';
import { cobrancaService } from '../services/cobrancaService';

interface UseCobrancasResult {
  cobrancas: Cobranca[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createCobranca: (input: CreateCobrancaInput) => Promise<string>;
  cancelCobranca: (id: number) => Promise<void>;
}

/**
 * Hook for the business (admin) view of Cobranças.
 * Fetches from GET /Cobrancas/Empresa and exposes create/cancel actions.
 */
export const useCobrancas = (): UseCobrancasResult => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cobrancaService.listByEmpresa();
      setCobrancas(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar cobranças';
      console.error('[useCobrancas] refresh:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Creates a new cobrança (admin) and refreshes the list. */
  const createCobranca = useCallback(
    async (input: CreateCobrancaInput): Promise<string> => {
      const result = await cobrancaService.create(input);
      await refresh();
      window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
      return result;
    },
    [refresh],
  );

  /** Cancels a cobrança by setting its status to Cancelado. */
  const cancelCobranca = useCallback(
    async (id: number): Promise<void> => {
      await cobrancaService.updateStatus(id, 'Cancelado');
      await refresh();
      window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
    },
    [refresh],
  );

  return { cobrancas, isLoading, error, refresh, createCobranca, cancelCobranca };
};
