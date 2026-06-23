import React from 'react';
import { DayScheduleConfig, WeekdayKey, WEEKDAY_LABELS } from '../../../features/services/schemas/scheduleSettingsTypes';
import { Toggle } from '../../ui/Toggle';

interface WeekdayScheduleRowProps {
  weekday: WeekdayKey;
  config: DayScheduleConfig;
  onChange: (patch: Partial<DayScheduleConfig>) => void;
}

export const WeekdayScheduleRow: React.FC<WeekdayScheduleRowProps> = ({
  weekday,
  config,
  onChange,
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        config.enabled
          ? 'bg-white border-gray-200 shadow-sm'
          : 'bg-gray-50/80 border-gray-100'
      }`}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${config.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
              {WEEKDAY_LABELS[weekday]}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {config.enabled ? 'Aceita agendamentos neste dia' : 'Dia indisponível'}
            </p>
          </div>
          <Toggle
            checked={config.enabled}
            onChange={(enabled) => onChange({ enabled })}
            aria-label={`Ativar ${WEEKDAY_LABELS[weekday]}`}
          />
        </div>

        {config.enabled && (
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Início</label>
              <input
                type="time"
                value={config.inicio}
                onChange={(e) => onChange({ inicio: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Fim</label>
              <input
                type="time"
                value={config.fim}
                onChange={(e) => onChange({ fim: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
