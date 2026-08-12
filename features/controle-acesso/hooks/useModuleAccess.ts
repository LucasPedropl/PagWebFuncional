import { useMemo } from 'react';
import { useControleAcesso } from './useControleAcesso';
import { buildModuleAccessSnapshot, ModuleAccessSnapshot } from '../utils/moduleAccess';

export interface UseModuleAccessResult extends ModuleAccessSnapshot {
  isLoading: boolean;
  error: string | null;
  isMaster: boolean;
  refresh: () => Promise<void>;
}

/** Permissões Payment/WhatsApp a partir do GET /ControleAcessos/{id}. */
export function useModuleAccess(): UseModuleAccessResult {
  const { myRequest, isLoading, error, isMaster, refresh } = useControleAcesso();
  const snapshot = useMemo(() => buildModuleAccessSnapshot(myRequest), [myRequest]);

  return {
    ...snapshot,
    isLoading,
    error,
    isMaster,
    refresh,
  };
}
