import React, { useEffect, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Loader2 } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { useServiceScheduleSettings } from '../../features/services/hooks/useServiceScheduleSettings';
import { ScheduleWeekOverview } from '../../components/features/services/ScheduleWeekOverview';
import { ScheduleSettingsEditor } from '../../components/features/services/ScheduleSettingsEditor';
import {
  WeekdayKey,
} from '../../features/services/schemas/scheduleSettingsTypes';
import type { DayScheduleConfig } from '../../features/services/schemas/scheduleSettingsTypes';

type ScheduleView = 'overview' | 'edit';

export const HorariosAgendamento: React.FC = () => {
  const { addToast } = useToast();
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [empresaNome, setEmpresaNome] = useState('');
  const [view, setView] = useState<ScheduleView>('overview');

  const { settings, isLoading, updateInterval, updateDay } = useServiceScheduleSettings(
    idEmpresa ?? undefined,
  );

  useEffect(() => {
    companyService
      .getMyCompany()
      .then((company) => {
        setIdEmpresa(company.idEmpresa);
        setEmpresaNome(company.nome);
      })
      .catch((err) => {
        console.error('[HorariosAgendamento] Erro ao carregar empresa:', err);
        addToast('error', 'Erro', 'Não foi possível identificar sua empresa.');
      });
  }, [addToast]);

  const handleDayChange = (weekday: WeekdayKey, patch: Partial<DayScheduleConfig>) => {
    const day = settings?.dias[weekday];
    if (!day) return;

    const nextInicio = patch.inicio ?? day.inicio;
    const nextFim = patch.fim ?? day.fim;
    if (patch.inicio !== undefined || patch.fim !== undefined) {
      if (nextInicio >= nextFim) {
        addToast('error', 'Horário inválido', 'O horário de início deve ser anterior ao fim.');
        return;
      }
    }

    updateDay(weekday, patch);
  };

  const handleIntervalChange = (minutes: number) => {
    updateInterval(minutes);
    addToast('success', 'Intervalo atualizado', 'Preferência salva.');
  };

  const pageLoading = idEmpresa == null || isLoading;

  return (
    <BusinessLayout>
      <div className="py-4 sm:py-8">
        {pageLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
        ) : settings ? (
          view === 'overview' ? (
            <ScheduleWeekOverview
              settings={settings}
              empresaNome={empresaNome}
              onEdit={() => setView('edit')}
            />
          ) : (
            <ScheduleSettingsEditor
              settings={settings}
              onBack={() => setView('overview')}
              onIntervalChange={handleIntervalChange}
              onDayChange={handleDayChange}
            />
          )
        ) : null}
      </div>
    </BusinessLayout>
  );
};
