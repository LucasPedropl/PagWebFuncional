import { useCallback, useEffect, useState } from 'react';
import { EmpresaBloqueada, PlanoBloqueado } from '../schemas/bloqueioSchemas';
import { bloqueioService } from '../services/bloqueioService';

interface UseBloqueiosResult {
  empresas: EmpresaBloqueada[];
  planos: PlanoBloqueado[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  bloquearEmpresa: (id: number) => Promise<void>;
  desbloquearEmpresa: (id: number) => Promise<void>;
  bloquearPlano: (id: number) => Promise<void>;
  desbloquearPlano: (id: number) => Promise<void>;
}

/** Hook de bloqueios do cliente logado. */
export const useBloqueios = (busca?: string): UseBloqueiosResult => {
  const [empresas, setEmpresas] = useState<EmpresaBloqueada[]>([]);
  const [planos, setPlanos] = useState<PlanoBloqueado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emps, plans] = await Promise.all([
        bloqueioService.listEmpresas(busca),
        bloqueioService.listPlanos(busca),
      ]);
      setEmpresas(emps);
      setPlanos(plans);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar bloqueios';
      console.error('[useBloqueios]', err);
      setError(msg);
      setEmpresas([]);
      setPlanos([]);
    } finally {
      setIsLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const bloquearEmpresa = async (id: number) => {
    await bloqueioService.bloquearEmpresa(id);
    await refresh();
  };

  const desbloquearEmpresa = async (id: number) => {
    await bloqueioService.desbloquearEmpresa(id);
    await refresh();
  };

  const bloquearPlano = async (id: number) => {
    await bloqueioService.bloquearPlano(id);
    await refresh();
  };

  const desbloquearPlano = async (id: number) => {
    await bloqueioService.desbloquearPlano(id);
    await refresh();
  };

  return {
    empresas,
    planos,
    isLoading,
    error,
    refresh,
    bloquearEmpresa,
    desbloquearEmpresa,
    bloquearPlano,
    desbloquearPlano,
  };
};
