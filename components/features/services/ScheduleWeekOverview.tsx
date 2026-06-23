import React from 'react';
import { CalendarDays, Settings2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import {
  ServiceScheduleSettings,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  WEEKDAY_SHORT,
} from '../../../features/services/schemas/scheduleSettingsTypes';

interface ScheduleWeekOverviewProps {
  settings: ServiceScheduleSettings;
  empresaNome: string;
  onEdit: () => void;
}

export const ScheduleWeekOverview: React.FC<ScheduleWeekOverviewProps> = ({
  settings,
  empresaNome,
  onEdit,
}) => {
  const enabledDays = WEEKDAY_ORDER.filter((day) => settings.dias[day].enabled);
  const enabledCount = enabledDays.length;

  const typicalHours =
    enabledDays.length > 0
      ? `${settings.dias[enabledDays[0]].inicio} – ${settings.dias[enabledDays[0]].fim}`
      : '—';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 mb-5">
          <CalendarDays className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Horários de atendimento
        </h1>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">
          Veja quando {empresaNome || 'sua empresa'} aceita agendamentos de serviços.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-slate-900 tabular-nums">{enabledCount}</p>
          <p className="text-sm text-gray-500 mt-1">Dias ativos por semana</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <p className="text-3xl font-black text-slate-900 tabular-nums">{settings.intervaloMinutos}</p>
          <p className="text-sm text-gray-500 mt-1">Minutos por slot</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-900 tabular-nums">{typicalHours}</p>
          <p className="text-sm text-gray-500 mt-1">Horário principal</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Semana
          </h2>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {enabledCount} de 7 dias
          </span>
        </div>

        <div className="space-y-2.5">
          {WEEKDAY_ORDER.map((weekday) => {
            const day = settings.dias[weekday];
            return (
              <div
                key={weekday}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4 transition-colors ${
                  day.enabled
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-900/10'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <span
                  className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold ${
                    day.enabled ? 'bg-white/10 text-white' : 'bg-gray-200/80 text-gray-500'
                  }`}
                >
                  {WEEKDAY_SHORT[weekday]}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm sm:text-base font-semibold truncate ${
                      day.enabled ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {WEEKDAY_LABELS[weekday]}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {day.enabled ? (
                    <p className="text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap">
                      {day.inicio}
                      <span className="mx-1.5 sm:mx-2 text-slate-500 font-normal">–</span>
                      {day.fim}
                    </p>
                  ) : (
                    <span className="inline-flex text-xs font-medium text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                      Fechado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={onEdit}
          className="bg-slate-900 hover:bg-slate-800 h-12 px-8 rounded-xl font-semibold shadow-md shadow-slate-900/15"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Configurar horários
        </Button>
        <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
          Protótipo local — alterações salvas no navegador
        </p>
      </div>
    </div>
  );
};
