import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { LocalService } from '../../../features/services/schemas/serviceTypes';
import { formatServicePrice } from '../../../features/services/utils/serviceFormatters';

interface ScheduleServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: LocalService | null;
  establishmentName: string;
  isSaving?: boolean;
  onSubmit: (payload: { data: string; horario: string; observacao?: string }) => void;
}

export const ScheduleServiceModal: React.FC<ScheduleServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  establishmentName,
  isSaving = false,
  onSubmit,
}) => {
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleClose = () => {
    setData('');
    setHorario('');
    setObservacao('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !horario) return;
    onSubmit({ data, horario, observacao: observacao.trim() || undefined });
    handleClose();
  };

  if (!service) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agendar serviço"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving} className="bg-violet-600 hover:bg-violet-700">
            Confirmar agendamento
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
          <p className="text-sm text-violet-700 font-medium">{establishmentName}</p>
          <p className="text-lg font-bold text-gray-900">{service.nome}</p>
          <p className="text-sm text-gray-600">{formatServicePrice(service.preco)}</p>
        </div>

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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Observações (opcional)</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            placeholder="Alguma preferência ou informação extra..."
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
};
