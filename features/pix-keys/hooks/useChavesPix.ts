import { useCallback, useEffect, useState } from 'react';
import { ChavePix, ChavePixInput, ChavePixUpdateInput } from '../schemas/chavePixSchemas';
import { chavePixService } from '../services/chavePixService';

interface UseChavesPixResult {
  chaves: ChavePix[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: ChavePixInput) => Promise<void>;
  update: (input: ChavePixUpdateInput) => Promise<void>;
  deactivate: (idChavePix: number) => Promise<void>;
}

export const useChavesPix = (): UseChavesPixResult => {
  const [chaves, setChaves] = useState<ChavePix[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setChaves(await chavePixService.list());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar chaves PIX';
      console.error('[useChavesPix]', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: ChavePixInput) => {
      await chavePixService.create(input);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (input: ChavePixUpdateInput) => {
      await chavePixService.update(input);
      await refresh();
    },
    [refresh],
  );

  const deactivate = useCallback(
    async (idChavePix: number) => {
      await chavePixService.deactivate(idChavePix);
      await refresh();
    },
    [refresh],
  );

  return { chaves, isLoading, error, refresh, create, update, deactivate };
};
