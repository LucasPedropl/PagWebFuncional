import { useCallback, useEffect, useState } from 'react';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../schemas/cobrancaSchemas';
import { cobrancaService } from '../services/cobrancaService';
import { pagamentoService } from '../services/pagamentoService';

interface UseUserCobrancasResult {
  cobrancas: Cobranca[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  pagarCobranca: (
    idCobranca: number,
    metodo: MetodoPagamento,
  ) => Promise<PagamentoUnicoResponse>;
}

/**
 * Hook for the user (client) view of Cobranças.
 * Fetches from GET /Cobrancas/Usuario and exposes a pay action via /unico-solicitar.
 */
export const useUserCobrancas = (): UseUserCobrancasResult => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await cobrancaService.listByUsuario();
      setCobrancas(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar cobranças';
      console.error('[useUserCobrancas] refresh:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pagarCobranca = useCallback(
    async (idCobranca: number, metodo: MetodoPagamento): Promise<PagamentoUnicoResponse> => {
      const result = await pagamentoService.solicitarPagamentoUnico({
        idCobranca,
        metodo,
      });

      await refresh();
      window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
      return result;
    },
    [refresh],
  );

  return { cobrancas, isLoading, error, refresh, pagarCobranca };
};
