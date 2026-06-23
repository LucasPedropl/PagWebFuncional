import React, { useEffect, useMemo, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Clock, Loader2 } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { useToast } from '../../context/ToastContext';
import { useServiceScheduleSettings } from '../../features/services/hooks/useServiceScheduleSettings';
import { WeekdayScheduleRow } from '../../components/features/services/WeekdayScheduleRow';
import {
  SCHEDULE_INTERVAL_OPTIONS,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from '../../features/services/schemas/scheduleSettingsTypes';

export const HorariosAgendamento: React.FC = () => {
  const { addToast } = useToast();
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [empresaNome, setEmpresaNome] = useState('');

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

  const intervalOptions = useMemo(
    () =>
      SCHEDULE_INTERVAL_OPTIONS.map((minutes) => ({
        value: minutes,
        label: `${minutes} minutos`,
        subLabel: 'Duração de cada slot de agendamento',
      })),
    [],
  );

  const enabledDaysCount = settings
    ? WEEKDAY_ORDER.filter((day) => settings.dias[day].enabled).length
    : 0;

  const handleDayChange = (weekday: (typeof WEEKDAY_ORDER)[number], patch: Parameters<typeof updateDay>[1]) => {
    const day = settings?.dias[weekday];
    if (!day) return;

    if (patch.inicio && patch.fim && patch.inicio >= patch.fim) {
      addToast('error', 'Horário inválido', 'O horário de início deve ser anterior ao fim.');
      return;
    }

    const nextInicio = patch.inicio ?? day.inicio;
    const nextFim = patch.fim ?? day.fim;
    if (nextInicio >= nextFim) {
      addToast('error', 'Horário inválido', 'O horário de início deve ser anterior ao fim.');
      return;
    }

    updateDay(weekday, patch);
    addToast('success', 'Horário atualizado', `${WEEKDAY_LABELS[weekday]} salvo localmente.`);
  };

  const pageLoading = idEmpresa == null || isLoading;

  return (
    <BusinessLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Horários de atendimento</h1>
        </div>
        <p className="text-gray-500 mt-1">
          Configure os dias e horários disponíveis para agendamento em {empresaNome || 'sua empresa'}.
        </p>
        <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-1 rounded">
          Protótipo local — dados salvos no navegador até o backend estar pronto.
        </p>
      </div>

      {pageLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : settings ? (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <SearchSelect
              label="Intervalo entre agendamentos"
              options={intervalOptions}
              value={settings.intervaloMinutos}
              onChange={(value) => {
                updateInterval(Number(value));
                addToast('success', 'Intervalo atualizado', 'Preferência salva localmente.');
              }}
              placeholder="Selecione o intervalo..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Define o espaçamento mínimo entre horários disponíveis para os clientes.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Dias da semana
              </h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {enabledDaysCount} dia{enabledDaysCount !== 1 ? 's' : ''} ativo{enabledDaysCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {WEEKDAY_ORDER.map((weekday) => (
                <WeekdayScheduleRow
                  key={weekday}
                  weekday={weekday}
                  config={settings.dias[weekday]}
                  onChange={(patch) => handleDayChange(weekday, patch)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </BusinessLayout>
  );
};
