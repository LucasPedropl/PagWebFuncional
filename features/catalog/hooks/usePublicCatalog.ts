import { useCallback, useEffect, useState } from 'react';
import { Categoria, CatalogItem, ExploreCatalogItem } from '../schemas/catalogSchemas';
import { categoriaService } from '../services/categoriaService';
import { produtoService } from '../services/produtoService';
import { servicoService } from '../services/servicoService';

interface PublicCompanyCatalog {
  categorias: Categoria[];
  servicos: CatalogItem[];
  produtos: CatalogItem[];
}

interface UsePublicCompanyCatalogResult extends PublicCompanyCatalog {
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Catálogo público de uma empresa (AllowAnonymous). */
export const usePublicCompanyCatalog = (
  idEmpresa: number | null,
): UsePublicCompanyCatalogResult => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicos, setServicos] = useState<CatalogItem[]>([]);
  const [produtos, setProdutos] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!idEmpresa || Number.isNaN(idEmpresa)) {
      setCategorias([]);
      setServicos([]);
      setProdutos([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const cats = await categoriaService.listPublico(idEmpresa);
      const catIds = cats.map((c) => c.id);
      const [servs, prods] = await Promise.all([
        servicoService.listPublico(idEmpresa, catIds),
        produtoService.listPublico(idEmpresa, catIds),
      ]);
      setCategorias(cats);
      setServicos(servs);
      setProdutos(prods);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar catálogo';
      console.error('[usePublicCompanyCatalog]', err);
      setError(msg);
      setCategorias([]);
      setServicos([]);
      setProdutos([]);
    } finally {
      setIsLoading(false);
    }
  }, [idEmpresa]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categorias, servicos, produtos, isLoading, error, refresh };
};

interface UseExploreCatalogResult {
  items: ExploreCatalogItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Agrega serviços e produtos públicos de várias empresas (aba Explorar). */
export const useExploreCatalog = (empresaIds: number[]): UseExploreCatalogResult => {
  const [items, setItems] = useState<ExploreCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idsKey = empresaIds.slice().sort((a, b) => a - b).join(',');

  const refresh = useCallback(async () => {
    const ids = idsKey
      ? idsKey.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    if (ids.length === 0) {
      setItems([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        ids.map(async (idEmpresa) => {
          const cats = await categoriaService.listPublico(idEmpresa);
          const catIds = cats.map((c) => c.id);
          const [servs, prods] = await Promise.all([
            servicoService.listPublico(idEmpresa, catIds),
            produtoService.listPublico(idEmpresa, catIds),
          ]);
          const mapped: ExploreCatalogItem[] = [
            ...servs.map((s) => ({ ...s, idEmpresa, kind: 'servico' as const })),
            ...prods.map((p) => ({ ...p, idEmpresa, kind: 'produto' as const })),
          ];
          return mapped;
        }),
      );
      const merged: ExploreCatalogItem[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') merged.push(...result.value);
        else console.warn('[useExploreCatalog]', result.reason);
      }
      merged.sort((a, b) => a.nome.localeCompare(b.nome));
      setItems(merged);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar catálogo';
      console.error('[useExploreCatalog]', err);
      setError(msg);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [idsKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, isLoading, error, refresh };
};
