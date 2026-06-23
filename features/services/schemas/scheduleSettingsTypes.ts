export type WeekdayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export interface DayScheduleConfig {
  enabled: boolean;
  inicio: string;
  fim: string;
}

export interface ServiceScheduleSettings {
  idEmpresa: number;
  intervaloMinutos: number;
  dias: Record<WeekdayKey, DayScheduleConfig>;
  updatedAt: string;
}

export const WEEKDAY_ORDER: WeekdayKey[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
};

export const WEEKDAY_SHORT: Record<WeekdayKey, string> = {
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
  dom: 'Dom',
};

export const SCHEDULE_INTERVAL_OPTIONS = [15, 30, 45, 60] as const;
