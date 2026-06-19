import { ScheduledServiceStatus } from '../schemas/serviceTypes';

export const STATUS_LABELS: Record<ScheduledServiceStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const STATUS_STYLES: Record<ScheduledServiceStatus, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmado: 'bg-blue-50 text-blue-700 border-blue-200',
  concluido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const formatServicePrice = (preco: number): string =>
  preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatAppointmentDate = (data: string, horario: string): string => {
  const date = new Date(`${data}T${horario}:00`);
  if (Number.isNaN(date.getTime())) return `${data} às ${horario}`;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
