import React from 'react';
import { CheckCheck } from 'lucide-react';

interface ChatMessageTicksProps {
  read: boolean;
  /** Bolha escura (mensagem própria no tema escuro). */
  onDarkBubble?: boolean;
}

/** Confirmação de leitura estilo WhatsApp (dois checks). */
export const ChatMessageTicks: React.FC<ChatMessageTicksProps> = ({
  read,
  onDarkBubble = true,
}) => (
  <CheckCheck
    className={`w-3.5 h-3.5 shrink-0 ${
      read
        ? 'text-sky-400'
        : onDarkBubble
          ? 'text-slate-400'
          : 'text-gray-400'
    }`}
    aria-label={read ? 'Mensagem lida' : 'Mensagem enviada'}
  />
);
