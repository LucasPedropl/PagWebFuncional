import React from 'react';
import { Calendar, User, Building2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '../../../features/services/schemas/serviceTypes';
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatAppointmentDate,
  formatServicePrice,
} from '../../../features/services/utils/serviceFormatters';

interface ScheduledServiceRowProps {
  appointment: ScheduledService;
  mode: 'client' | 'business';
  onCancel?: (id: string) => void;
  onUpdateStatus?: (id: string, status: ScheduledServiceStatus) => void;
  isUpdating?: boolean;
}

export const ScheduledServiceRow: React.FC<ScheduledServiceRowProps> = ({
  appointment,
  mode,
  onCancel,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const canCancel =
    mode === 'client' &&
    (appointment.status === 'pendente' || appointment.status === 'confirmado');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-gray-900">{appointment.serviceNome}</h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[appointment.status]}`}
          >
            {STATUS_LABELS[appointment.status]}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            {formatAppointmentDate(appointment.data, appointment.horario)}
          </span>
          <span className="font-medium text-slate-900">
            {formatServicePrice(appointment.preco)}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {mode === 'client' ? (
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {appointment.empresaNome}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {appointment.userNome} · {appointment.userEmail}
            </span>
          )}
          {appointment.observacao && (
            <span className="italic">Obs: {appointment.observacao}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 shrink-0">
        {mode === 'business' && onUpdateStatus && appointment.status === 'pendente' && (
          <Button
            onClick={() => onUpdateStatus(appointment.id, 'confirmado')}
            isLoading={isUpdating}
            className="h-9 px-3 text-sm bg-blue-600 hover:bg-blue-700"
          >
            Confirmar
          </Button>
        )}
        {mode === 'business' && onUpdateStatus && appointment.status === 'confirmado' && (
          <Button
            onClick={() => onUpdateStatus(appointment.id, 'concluido')}
            isLoading={isUpdating}
            className="h-9 px-3 text-sm bg-emerald-600 hover:bg-emerald-700"
          >
            Concluir
          </Button>
        )}
        {canCancel && onCancel && (
          <Button
            variant="outline"
            onClick={() => onCancel(appointment.id)}
            isLoading={isUpdating}
            className="h-9 px-3 text-sm text-red-600 border-red-200 hover:bg-red-50"
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
};
