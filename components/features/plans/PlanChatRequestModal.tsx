import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  buildPlanChatRequestMessage,
  getPlanChatRequestExplanation,
  PlanChatRequestParams,
} from '../../../utils/planChatRequest';

interface PlanChatRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  context: PlanChatRequestParams | null;
  isConfirming?: boolean;
}

export const PlanChatRequestModal: React.FC<PlanChatRequestModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  context,
  isConfirming = false,
}) => {
  if (!context) return null;

  const { title, paragraphs } = getPlanChatRequestExplanation(context.reason);
  const previewMessage = buildPlanChatRequestMessage(
    context.planName,
    context.reason,
    context.establishmentName
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Abrir chat e enviar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm text-gray-600 leading-relaxed">
            {paragraph}
          </p>
        ))}

        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
            Mensagem que será enviada
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewMessage}</p>
        </div>

        <p className="text-xs text-gray-500">
          Estabelecimento: <span className="font-medium">{context.establishmentName}</span>
          {' · '}
          Plano: <span className="font-medium">{context.planName}</span>
        </p>
      </div>
    </Modal>
  );
};
