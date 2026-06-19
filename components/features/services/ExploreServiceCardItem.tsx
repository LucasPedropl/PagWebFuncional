import React from 'react';
import { Calendar, Clock, Scissors } from 'lucide-react';
import { Button } from '../../ui/Button';
import { LocalService } from '../../../features/services/schemas/serviceTypes';
import { formatServicePrice } from '../../../features/services/utils/serviceFormatters';

interface ExploreServiceCardItemProps {
  service: LocalService;
  establishmentName: string;
  onSchedule: () => void;
}

export const ExploreServiceCardItem: React.FC<ExploreServiceCardItemProps> = ({
  service,
  establishmentName,
  onSchedule,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{service.nome}</h3>
          <p className="text-xs text-gray-500">{establishmentName}</p>
        </div>
      </div>
      <span className="text-lg font-bold text-slate-900">{formatServicePrice(service.preco)}</span>
    </div>

    {service.descricao && (
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.descricao}</p>
    )}

    {service.duracaoMinutos != null && service.duracaoMinutos > 0 && (
      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        {service.duracaoMinutos} min
      </p>
    )}

    <Button
      onClick={onSchedule}
      className="w-full mt-auto bg-violet-600 hover:bg-violet-700 text-white"
    >
      <Calendar className="w-4 h-4 mr-2" />
      Agendar serviço
    </Button>
  </div>
);
