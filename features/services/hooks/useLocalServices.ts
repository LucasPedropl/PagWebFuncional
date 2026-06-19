import { useCallback, useEffect, useState } from 'react';
import { LocalService } from '../schemas/serviceTypes';
import { localServiceStore } from '../services/localServiceStore';

/** Catálogo local de serviços por estabelecimento (sem API). */
export const useLocalServices = (idEmpresa?: number) => {
  const [services, setServices] = useState<LocalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setError(null);
      setServices(localServiceStore.listServices(idEmpresa));
    } catch (err) {
      console.error('[useLocalServices] Erro ao carregar serviços:', err);
      setError('Não foi possível carregar os serviços.');
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [idEmpresa]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createService = useCallback(
    (input: Omit<LocalService, 'id' | 'createdAt'>) => {
      const created = localServiceStore.createService(input);
      refresh();
      return created;
    },
    [refresh],
  );

  const updateService = useCallback(
    (
      id: string,
      patch: Partial<Pick<LocalService, 'nome' | 'preco' | 'descricao' | 'duracaoMinutos'>>,
    ) => {
      const updated = localServiceStore.updateService(id, patch);
      refresh();
      return updated;
    },
    [refresh],
  );

  const deleteService = useCallback(
    (id: string) => {
      const ok = localServiceStore.deleteService(id);
      refresh();
      return ok;
    },
    [refresh],
  );

  return {
    services,
    isLoading,
    error,
    refresh,
    createService,
    updateService,
    deleteService,
  };
};
