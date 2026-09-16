import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CobrancaStatusFilter,
  isCobrancaStatusFilter,
} from '../types/cobrancaStatusFilter';

const isListingInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
};

/**
 * Filtro de status compartilhado entre os cards de resumo e a listagem.
 * Lê/grava `?status=` na URL (HashRouter) para o KPI do dashboard chegar filtrado.
 */
export const useCobrancaListingFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const listingRef = useRef<HTMLDivElement>(null);
  const statusFromUrl = searchParams.get('status');
  const [activeFilter, setActiveFilter] = useState<CobrancaStatusFilter>(() =>
    isCobrancaStatusFilter(statusFromUrl) ? statusFromUrl : 'todos',
  );

  useEffect(() => {
    const fromUrl = searchParams.get('status');
    setActiveFilter(isCobrancaStatusFilter(fromUrl) ? fromUrl : 'todos');
  }, [searchParams]);

  const commitFilter = useCallback(
    (next: CobrancaStatusFilter, options?: { toggleIfSame?: boolean; scrollToListing?: boolean }) => {
      const resolved =
        options?.toggleIfSame && activeFilter === next ? 'todos' : next;
      setActiveFilter(resolved);

      const params = new URLSearchParams(searchParams);
      if (resolved === 'todos') params.delete('status');
      else params.set('status', resolved);
      setSearchParams(params, { replace: true });

      if (options?.scrollToListing && resolved !== 'todos') {
        const listing = listingRef.current;
        if (listing && !isListingInViewport(listing)) {
          listing.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [activeFilter, searchParams, setSearchParams],
  );

  return { activeFilter, commitFilter, listingRef };
};
