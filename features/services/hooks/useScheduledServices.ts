import { useCallback, useEffect, useState } from 'react';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../schemas/serviceTypes';
import { localServiceStore } from '../services/localServiceStore';

interface UseScheduledServicesFilters {
  idEmpresa?: number;
  idUser?: number;
  status?: ScheduledServiceStatus;
}

/** Agendamentos locais de serviços (sem API). */
export const useScheduledServices = (filters?: UseScheduledServicesFilters) => {
  const [appointments, setAppointments] = useState<ScheduledService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    try {
      setError(null);
      setAppointments(localServiceStore.listAppointments(filters));
    } catch (err) {
      console.error('[useScheduledServices] Erro ao carregar agendamentos:', err);
      setError('Não foi possível carregar os agendamentos.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.idEmpresa, filters?.idUser, filters?.status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const scheduleService = useCallback(
    (input: Omit<ScheduledService, 'id' | 'status' | 'createdAt'>) => {
      const created = localServiceStore.scheduleService(input);
      refresh();
      return created;
    },
    [refresh],
  );

  const updateStatus = useCallback(
    (id: string, status: ScheduledServiceStatus) => {
      const updated = localServiceStore.updateAppointmentStatus(id, status);
      refresh();
      return updated;
    },
    [refresh],
  );

  const cancelAppointment = useCallback(
    (id: string) => {
      const updated = localServiceStore.cancelAppointment(id);
      refresh();
      return updated;
    },
    [refresh],
  );

  return {
    appointments,
    isLoading,
    error,
    refresh,
    scheduleService,
    updateStatus,
    cancelAppointment,
  };
};
