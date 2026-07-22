import React from 'react';
import { ChatMessageTicks } from './ChatMessageTicks';

interface ChatMessageMetaProps {
  dataEnvio: string;
  /** Exibir checks de leitura (mensagens enviadas por mim). */
  showReadReceipt?: boolean;
  read?: boolean;
  onDarkBubble?: boolean;
}

export const ChatMessageMeta: React.FC<ChatMessageMetaProps> = ({
  dataEnvio,
  showReadReceipt = false,
  read = false,
  onDarkBubble = true,
}) => (
  <span
    className={`text-[9px] block text-right mt-1 flex items-center justify-end gap-1 ${
      showReadReceipt ? 'text-slate-400' : 'text-gray-400'
    }`}
  >
    {showReadReceipt && (
      <ChatMessageTicks read={read} onDarkBubble={onDarkBubble} />
    )}
    {new Date(dataEnvio).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}
  </span>
);
