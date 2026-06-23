import React from 'react';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { SearchSelect } from '../../ui/SearchSelect';
import { WeekdayScheduleRow } from './WeekdayScheduleRow';
import {
  DayScheduleConfig,
  SCHEDULE_INTERVAL_OPTIONS,
  ServiceScheduleSettings,
  WeekdayKey,
  WEEKDAY_ORDER,
} from '../../../features/services/schemas/scheduleSettingsTypes';

interface ScheduleSettingsEditorProps {
  settings: ServiceScheduleSettings;
  onBack: () => void;
  onIntervalChange: (minutes: number) => void;
  onDayChange: (weekday: WeekdayKey, patch: Partial<DayScheduleConfig>) => void;
}

export const ScheduleSettingsEditor: React.FC<ScheduleSettingsEditorProps> = ({
  settings,
  onBack,
  onIntervalChange,
  onDayChange,
}) => {
  const intervalOptions = SCHEDULE_INTERVAL_OPTIONS.map((minutes) => ({
    value: minutes,
    label: `${minutes} minutos`,
    subLabel: 'Espaçamento entre horários',
  }));

  const enabledCount = WEEKDAY_ORDER.filter((day) => settings.dias[day].enabled).length;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao resumo
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4">
          <Clock3 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Configurar horários</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
          Defina os dias e faixas de horário em que clientes podem agendar serviços.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-6 border-b border-gray-100 bg-gradient-to-b from-slate-50/80 to-white">
          <SearchSelect
            label="Intervalo entre agendamentos"
            options={intervalOptions}
            value={settings.intervaloMinutos}
            onChange={(value) => onIntervalChange(Number(value))}
            placeholder="Selecione o intervalo..."
          />
        </div>

        <div className="px-6 sm:px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Dias da semana</h2>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {enabledCount} ativo{enabledCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {WEEKDAY_ORDER.map((weekday) => (
              <WeekdayScheduleRow
                key={weekday}
                weekday={weekday}
                config={settings.dias[weekday]}
                onChange={(patch) => onDayChange(weekday, patch)}
              />
            ))}
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-slate-50/50 flex justify-center">
          <Button
            type="button"
            onClick={onBack}
            className="bg-slate-900 hover:bg-slate-800 rounded-xl px-8 h-11 font-semibold"
          >
            Concluir
          </Button>
        </div>
      </div>
    </div>
  );
};
