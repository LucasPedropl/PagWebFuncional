import {
  DayScheduleConfig,
  ServiceScheduleSettings,
  WeekdayKey,
  WEEKDAY_ORDER,
} from '../schemas/scheduleSettingsTypes';

const STORAGE_KEY = 'pagweb_local_service_schedule_settings';

const defaultDay = (enabled: boolean, inicio: string, fim: string): DayScheduleConfig => ({
  enabled,
  inicio,
  fim,
});

const buildDefaultDays = (): Record<WeekdayKey, DayScheduleConfig> => ({
  seg: defaultDay(true, '08:00', '18:00'),
  ter: defaultDay(true, '08:00', '18:00'),
  qua: defaultDay(true, '08:00', '18:00'),
  qui: defaultDay(true, '08:00', '18:00'),
  sex: defaultDay(true, '08:00', '18:00'),
  sab: defaultDay(true, '08:00', '12:00'),
  dom: defaultDay(false, '08:00', '12:00'),
});

const readAll = (): ServiceScheduleSettings[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ServiceScheduleSettings[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (items: ServiceScheduleSettings[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const scheduleSettingsStore = {
  getByEmpresa(idEmpresa: number): ServiceScheduleSettings {
    const existing = readAll().find((s) => s.idEmpresa === idEmpresa);
    if (existing) return existing;

    return {
      idEmpresa,
      intervaloMinutos: 30,
      dias: buildDefaultDays(),
      updatedAt: new Date().toISOString(),
    };
  },

  save(settings: ServiceScheduleSettings): ServiceScheduleSettings {
    const all = readAll();
    const index = all.findIndex((s) => s.idEmpresa === settings.idEmpresa);
    const next: ServiceScheduleSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) all[index] = next;
    else all.push(next);

    writeAll(all);
    return next;
  },

  isTimeWithinSchedule(
    settings: ServiceScheduleSettings,
    dateIso: string,
    horario: string,
  ): boolean {
    const date = new Date(`${dateIso}T12:00:00`);
    const dayIndex = date.getDay();
    const weekdayMap: WeekdayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const key = weekdayMap[dayIndex];
    const day = settings.dias[key];

    if (!day?.enabled) return false;
    return horario >= day.inicio && horario <= day.fim;
  },

  listEnabledWeekdays(settings: ServiceScheduleSettings): WeekdayKey[] {
    return WEEKDAY_ORDER.filter((key) => settings.dias[key].enabled);
  },
};
