import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Calendar, Loader2, Plus } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { businessService } from '../../services/businessService';
import { useToast } from '../../context/ToastContext';
import { useScheduledServices } from '../../features/services/hooks/useScheduledServices';
import { useLocalServices } from '../../features/services/hooks/useLocalServices';
import { ScheduledServiceRow } from '../../components/features/services/ScheduledServiceRow';
import {
  CreateBusinessAppointmentModal,
  CreateBusinessAppointmentPayload,
} from '../../components/features/services/CreateBusinessAppointmentModal';
import { ScheduledServiceStatus } from '../../features/services/schemas/serviceTypes';
import { User } from '../../types';

const STATUS_TOAST: Record<ScheduledServiceStatus, string> = {
  pendente: 'Agendamento pendente.',
  confirmado: 'Agendamento confirmado.',
  concluido: 'Serviço marcado como concluído.',
  cancelado: 'Agendamento cancelado.',
};

export const Agendamentos: React.FC = () => {
  const { addToast } = useToast();
  const [idEmpresa, setIdEmpresa] = useState<number | null>(null);
  const [empresaNome, setEmpresaNome] = useState('');
  const [clients, setClients] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { services, isLoading: isLoadingServices } = useLocalServices(idEmpresa ?? undefined);

  const {
    appointments,
    isLoading: isLoadingAppointments,
    scheduleService,
    updateStatus,
  } = useScheduledServices(idEmpresa != null ? { idEmpresa } : undefined);

  useEffect(() => {
    companyService
      .getMyCompany()
      .then((company) => {
        setIdEmpresa(company.idEmpresa);
        setEmpresaNome(company.nome);
      })
      .catch((err) => {
        console.error('[Agendamentos] Erro ao carregar empresa:', err);
        addToast('error', 'Erro', 'Não foi possível identificar sua empresa.');
      });
  }, [addToast]);

  useEffect(() => {
    businessService
      .listClients()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('[Agendamentos] Erro ao carregar clientes:', err);
        addToast('error', 'Erro', 'Não foi possível carregar a lista de clientes.');
      });
  }, [addToast]);

  const handleCreateAppointment = async (payload: CreateBusinessAppointmentPayload) => {
    if (idEmpresa == null) return;

    const client = clients.find((c) => c.idUser === payload.idUser);
    const service = services.find((s) => s.id === payload.serviceId);

    if (!client?.idUser || !service) {
      addToast('error', 'Dados inválidos', 'Selecione um cliente e um serviço válidos.');
      return;
    }

    setIsSaving(true);
    try {
      scheduleService(
        {
          serviceId: service.id,
          serviceNome: service.nome,
          idEmpresa,
          empresaNome,
          idUser: client.idUser,
          userNome: `${client.nome}${client.sobreNome ? ` ${client.sobreNome}` : ''}`.trim(),
          userEmail: client.email,
          preco: service.preco,
          data: payload.data,
          horario: payload.horario,
          observacao: payload.observacao,
        },
        'confirmado',
      );
      addToast('success', 'Agendamento criado', 'O horário foi registrado com sucesso.');
      setIsModalOpen(false);
    } catch (err) {
      console.error('[Agendamentos] Erro ao criar agendamento:', err);
      addToast('error', 'Erro', 'Não foi possível criar o agendamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ScheduledServiceStatus) => {
    setUpdatingId(id);
    try {
      updateStatus(id, status);
      addToast('success', 'Status atualizado', STATUS_TOAST[status]);
    } finally {
      setUpdatingId(null);
    }
  };

  const isLoading = idEmpresa == null || isLoadingServices || isLoadingAppointments;
  const canCreate = services.length > 0 && clients.length > 0;

  return (
    <BusinessLayout>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-500 mt-1">
            Gerencie e crie agendamentos de serviços de {empresaNome || 'sua empresa'}.
          </p>
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-1 rounded">
            Protótipo local — dados salvos no navegador até o backend estar pronto.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 shrink-0"
          disabled={!canCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo agendamento
        </Button>
      </div>

      {!canCreate && !isLoading && (
        <div className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
          {services.length === 0 && (
            <p>
              Cadastre serviços em{' '}
              <Link to="/business/servicos" className="font-medium underline">
                Serviços
              </Link>{' '}
              para poder agendar.
            </p>
          )}
          {clients.length === 0 && (
            <p className={services.length === 0 ? 'mt-1' : ''}>
              Adicione clientes em{' '}
              <Link to="/business/clientes" className="font-medium underline">
                Clientes
              </Link>{' '}
              para criar agendamentos.
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-gray-300" />}
          title="Nenhum agendamento"
          subtitle="Crie um agendamento manualmente ou aguarde solicitações dos clientes."
          action={
            canCreate ? (
              <Button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800">
                Criar primeiro agendamento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <ScheduledServiceRow
              key={apt.id}
              appointment={apt}
              mode="business"
              onUpdateStatus={handleUpdateStatus}
              isUpdating={updatingId === apt.id}
            />
          ))}
        </div>
      )}

      <CreateBusinessAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clients={clients}
        services={services}
        isSaving={isSaving}
        onSubmit={handleCreateAppointment}
      />
    </BusinessLayout>
  );
};

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon}
    <h3 className="text-lg font-semibold text-gray-900 mt-4">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">{subtitle}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
