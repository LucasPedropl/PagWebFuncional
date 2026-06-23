import React from 'react';
import { DayScheduleConfig, WeekdayKey, WEEKDAY_LABELS } from '../../../features/services/schemas/scheduleSettingsTypes';

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
      className={`rounded-xl border p-4 transition-colors ${
        config.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="flex items-center gap-3 sm:w-48 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
          />
          <span className={`text-sm font-semibold ${config.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {WEEKDAY_LABELS[weekday]}
          </span>
        </label>

        <div className="flex flex-1 items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Início</label>
            <input
              type="time"
              value={config.inicio}
              disabled={!config.enabled}
              onChange={(e) => onChange({ inicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
          <span className="text-gray-300 mt-5">—</span>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Fim</label>
            <input
              type="time"
              value={config.fim}
              disabled={!config.enabled}
              onChange={(e) => onChange({ fim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
