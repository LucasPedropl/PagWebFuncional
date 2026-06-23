import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { SearchSelect } from '../../ui/SearchSelect';
import { Textarea } from '../../ui/Textarea';
import { LocalService } from '../../../features/services/schemas/serviceTypes';
import { User } from '../../../types';
import { formatServicePrice } from '../../../features/services/utils/serviceFormatters';

export interface CreateBusinessAppointmentPayload {
  idUser: number;
  serviceId: string;
  data: string;
  horario: string;
  observacao?: string;
}

interface CreateBusinessAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: User[];
  services: LocalService[];
  isSaving?: boolean;
  onSubmit: (payload: CreateBusinessAppointmentPayload) => void;
}

export const CreateBusinessAppointmentModal: React.FC<CreateBusinessAppointmentModalProps> = ({
  isOpen,
  onClose,
  clients,
  services,
  isSaving = false,
  onSubmit,
}) => {
  const [clientId, setClientId] = useState<string | number>('');
  const [serviceId, setServiceId] = useState<string | number>('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [observacao, setObservacao] = useState('');

  const resetForm = () => {
    setClientId('');
    setServiceId('');
    setData('');
    setHorario('');
    setObservacao('');
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const clientOptions = useMemo(
    () =>
      clients
        .filter((c) => c.idUser != null)
        .map((c) => ({
          value: c.idUser as number,
          label: `${c.nome}${c.sobreNome ? ` ${c.sobreNome}` : ''}`.trim(),
          subLabel: c.email,
        })),
    [clients],
  );

  const serviceOptions = useMemo(
    () =>
      services.map((s) => ({
        value: s.id,
        label: s.nome,
        subLabel: formatServicePrice(s.preco),
      })),
    [services],
  );

  const selectedService = services.find((s) => s.id === serviceId);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !serviceId || !data || !horario) return;

    onSubmit({
      idUser: Number(clientId),
      serviceId: String(serviceId),
      data,
      horario,
      observacao: observacao.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo agendamento"
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            className="bg-slate-900 hover:bg-slate-800"
            disabled={!clientId || !serviceId || !data || !horario}
          >
            Criar agendamento
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SearchSelect
          label="Cliente"
          options={clientOptions}
          value={clientId}
          onChange={setClientId}
          placeholder="Selecione um cliente..."
        />

        <SearchSelect
          label="Serviço"
          options={serviceOptions}
          value={serviceId}
          onChange={setServiceId}
          placeholder="Selecione um serviço..."
        />

        {selectedService && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-sm text-slate-600">
            Valor: <span className="font-semibold text-slate-900">{formatServicePrice(selectedService.preco)}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
          />
          <Input
            label="Horário"
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Observações (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
          placeholder="Informações adicionais sobre o agendamento..."
        />

        {services.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
            Cadastre serviços em Serviços antes de criar um agendamento.
          </p>
        )}
      </div>
    </Modal>
  );
};
