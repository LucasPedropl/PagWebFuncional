import { useCallback, useEffect, useState } from 'react';
import {
  DayScheduleConfig,
  ServiceScheduleSettings,
  WeekdayKey,
} from '../schemas/scheduleSettingsTypes';
import { scheduleSettingsStore } from '../services/scheduleSettingsStore';

/** Configurações locais de horários de agendamento por estabelecimento. */
export const useServiceScheduleSettings = (idEmpresa?: number) => {
  const [settings, setSettings] = useState<ServiceScheduleSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (idEmpresa == null) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setSettings(scheduleSettingsStore.getByEmpresa(idEmpresa));
    } catch (err) {
      console.error('[useServiceScheduleSettings] Erro ao carregar horários:', err);
      setError('Não foi possível carregar os horários de agendamento.');
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [idEmpresa]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateInterval = useCallback(
    (intervaloMinutos: number) => {
      if (!settings) return null;
      const updated = scheduleSettingsStore.save({ ...settings, intervaloMinutos });
      setSettings(updated);
      return updated;
    },
    [settings],
  );

  const updateDay = useCallback(
    (weekday: WeekdayKey, patch: Partial<DayScheduleConfig>) => {
      if (!settings) return null;
      const updated = scheduleSettingsStore.save({
        ...settings,
        dias: {
          ...settings.dias,
          [weekday]: { ...settings.dias[weekday], ...patch },
        },
      });
      setSettings(updated);
      return updated;
    },
    [settings],
  );

  return {
    settings,
    isLoading,
    error,
    refresh,
    updateInterval,
    updateDay,
  };
};
