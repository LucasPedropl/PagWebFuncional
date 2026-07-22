import React from 'react';
import { Tag } from 'lucide-react';
import { ChatMessage } from '../../types';
import { ChatViewerRole, isOwnChatMessage } from '../../utils/chatMessageOwnership';
import { ChatMessageMeta } from './ChatMessageMeta';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  currentUserId: number;
  viewerRole: ChatViewerRole;
  threadMessages: ChatMessage[];
  selfChat?: boolean;
  planInterestHeading: string;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  currentUserId,
  viewerRole,
  threadMessages,
  selfChat = false,
  planInterestHeading,
}) => {
  const isMe = isOwnChatMessage(
    message,
    currentUserId,
    viewerRole,
    threadMessages,
    selfChat,
  );

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-xs ${
          isMe
            ? 'bg-slate-900 text-white rounded-br-none'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {message.metadata?.nomePlano && (
          <div className="mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-gray-900 flex items-start gap-2">
            <Tag className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-xs text-indigo-900">{planInterestHeading}</div>
              <div className="text-xs font-semibold">{message.metadata.nomePlano}</div>
              <div className="text-[10px] text-gray-600">
                R${' '}
                {message.metadata.valorMensalidade?.toFixed(2).replace('.', ',')} / mês
              </div>
            </div>
          </div>
        )}
        <p className="leading-relaxed whitespace-pre-wrap">{message.texto}</p>
        <ChatMessageMeta
          dataEnvio={message.dataEnvio}
          showReadReceipt={isMe}
          read={message.lida}
          onDarkBubble={isMe}
        />
      </div>
    </div>
  );
};
