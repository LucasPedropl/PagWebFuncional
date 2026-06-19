import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Calendar, Loader2, Compass } from 'lucide-react';
import { sessionService } from '../../services/session';
import { useToast } from '../../context/ToastContext';
import { useScheduledServices } from '../../features/services/hooks/useScheduledServices';
import { ScheduledServiceRow } from '../../components/features/services/ScheduledServiceRow';

export const MeusAgendamentos: React.FC = () => {
  const { addToast } = useToast();
  const { user } = sessionService.getSession();
  const idUser = user?.idUser ?? 0;
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { appointments, isLoading, cancelAppointment } = useScheduledServices(
    idUser > 0 ? { idUser } : undefined,
  );

  const handleCancel = async (id: string) => {
    setUpdatingId(id);
    try {
      cancelAppointment(id);
      addToast('success', 'Cancelado', 'Seu agendamento foi cancelado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = appointments.filter(
    (a) => a.status === 'pendente' || a.status === 'confirmado',
  ).length;

  return (
    <UserLayout>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus agendamentos</h1>
          <p className="text-gray-500 mt-1">
            Serviços que você agendou com estabelecimentos parceiros.
          </p>
          {activeCount > 0 && (
            <p className="text-sm text-violet-700 mt-2 font-medium">
              {activeCount} agendamento{activeCount !== 1 ? 's' : ''} ativo
              {activeCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link to="/explorar">
          <Button variant="outline" className="shrink-0">
            <Compass className="w-4 h-4 mr-2" />
            Explorar serviços
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mt-4">
            Nenhum agendamento ainda
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Na aba Serviços do Explorar você encontra cortes, consultas e outros serviços
            para agendar.
          </p>
          <Link to="/explorar" className="mt-6">
            <Button className="bg-violet-600 hover:bg-violet-700">
              Ir para Explorar
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <ScheduledServiceRow
              key={apt.id}
              appointment={apt}
              mode="client"
              onCancel={handleCancel}
              isUpdating={updatingId === apt.id}
            />
          ))}
        </div>
      )}
    </UserLayout>
  );
};
