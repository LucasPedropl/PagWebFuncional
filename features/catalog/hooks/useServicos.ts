import { useCallback, useEffect, useState } from 'react';
import { CatalogItem, CatalogItemInput } from '../schemas/catalogSchemas';
import { servicoService } from '../services/servicoService';
import { categoriaService } from '../services/categoriaService';

interface UseServicosResult {
  servicos: CatalogItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CatalogItemInput) => Promise<void>;
  update: (id: number, input: CatalogItemInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useServicos = (idEmpresa: number | null): UseServicosResult => {
  const [servicos, setServicos] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!idEmpresa) {
      setServicos([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const cats = await categoriaService.listPrivado();
      const list = await servicoService.listByEmpresa(
        idEmpresa,
        cats.filter((c) => c.ativo !== false).map((c) => c.id),
      );
      setServicos(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar serviços';
      console.error('[useServicos]', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [idEmpresa]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CatalogItemInput) => {
      await servicoService.create(input);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (id: number, input: CatalogItemInput) => {
      await servicoService.update(id, input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: number) => {
      await servicoService.remove(id);
      await refresh();
    },
    [refresh],
  );

  return { servicos, isLoading, error, refresh, create, update, remove };
};
