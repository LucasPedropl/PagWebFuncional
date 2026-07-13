import { useCallback, useEffect, useState } from 'react';
import { Categoria, CategoriaInput } from '../schemas/catalogSchemas';
import { categoriaService } from '../services/categoriaService';

interface UseCategoriasResult {
  categorias: Categoria[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CategoriaInput) => Promise<void>;
  update: (id: number, input: CategoriaInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useCategorias = (): UseCategoriasResult => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCategorias(await categoriaService.listPrivado());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar categorias';
      console.error('[useCategorias]', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CategoriaInput) => {
      await categoriaService.create(input);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (id: number, input: CategoriaInput) => {
      await categoriaService.update(id, input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: number) => {
      await categoriaService.remove(id);
      await refresh();
    },
    [refresh],
  );

  return { categorias, isLoading, error, refresh, create, update, remove };
};
