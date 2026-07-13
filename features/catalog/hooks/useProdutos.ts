import { useCallback, useEffect, useState } from 'react';
import { CatalogItem, CatalogItemInput } from '../schemas/catalogSchemas';
import { produtoService } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';

interface UseProdutosResult {
  produtos: CatalogItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CatalogItemInput) => Promise<void>;
  update: (id: number, input: CatalogItemInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useProdutos = (): UseProdutosResult => {
  const [produtos, setProdutos] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cats = await categoriaService.listPrivado();
      const list = await produtoService.listByEmpresa(
        cats.filter((c) => c.ativo !== false).map((c) => c.id),
      );
      setProdutos(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      console.error('[useProdutos]', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CatalogItemInput) => {
      await produtoService.create(input);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (id: number, input: CatalogItemInput) => {
      await produtoService.update(id, input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: number) => {
      await produtoService.remove(id);
      await refresh();
    },
    [refresh],
  );

  return { produtos, isLoading, error, refresh, create, update, remove };
};
