import { useCallback, useEffect, useState } from 'react';
import {
  ControleAcessoDetail,
  ControleAcessoListItem,
  ControleAcessoRequestInput,
  ControleAcessoUpdateInput,
  EstadoAcesso,
} from '../schemas/controleAcessoSchemas';
import { controleAcessoService } from '../services/controleAcessoService';

export type ControleAcessoMasterItem = ControleAcessoListItem & {
  payment: EstadoAcesso;
  whatsapp: EstadoAcesso;
};

interface UseControleAcessoResult {
  masterList: ControleAcessoMasterItem[];
  myRequest: ControleAcessoDetail | null;
  isMaster: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  requestAccess: (input: ControleAcessoRequestInput) => Promise<void>;
  updateRequest: (input: ControleAcessoUpdateInput) => Promise<void>;
  removeRequest: (idControle: number) => Promise<void>;
}

const enrichMasterItem = async (
  item: ControleAcessoListItem,
): Promise<ControleAcessoMasterItem> => {
  try {
    const detail = await controleAcessoService.getById(item.idControle);
    return {
      ...item,
      payment: detail?.payment ?? 'Inativo',
      whatsapp: detail?.whatsapp ?? 'Inativo',
      estado: detail?.estado ?? item.estado,
    };
  } catch {
    return { ...item, payment: 'Inativo', whatsapp: 'Inativo' };
  }
};

export const useControleAcesso = (): UseControleAcessoResult => {
  const [masterList, setMasterList] = useState<ControleAcessoMasterItem[]>([]);
  const [myRequest, setMyRequest] = useState<ControleAcessoDetail | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { items, isMaster: masterAccess } = await controleAcessoService.listMaster();
      setIsMaster(masterAccess);

      if (masterAccess && items.length > 0) {
        const enriched = await Promise.all(items.map(enrichMasterItem));
        setMasterList(enriched);
      } else {
        setMasterList([]);
      }

      const storedId = controleAcessoService.getStoredId();
      if (storedId) {
        const detail = await controleAcessoService.getById(storedId);
        setMyRequest(detail);
      } else {
        setMyRequest(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar integrações';
      console.error('[useControleAcesso]', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestAccess = useCallback(async (input: ControleAcessoRequestInput) => {
    const id = await controleAcessoService.requestAccess(input);
    const detail = await controleAcessoService.getById(id);
    setMyRequest(detail);
  }, []);

  const updateRequest = useCallback(
    async (input: ControleAcessoUpdateInput) => {
      await controleAcessoService.update(input);
      await refresh();
    },
    [refresh],
  );

  const removeRequest = useCallback(
    async (idControle: number) => {
      await controleAcessoService.remove(idControle);
      await refresh();
    },
    [refresh],
  );

  return {
    masterList,
    myRequest,
    isMaster,
    isLoading,
    error,
    refresh,
    requestAccess,
    updateRequest,
    removeRequest,
  };
};
