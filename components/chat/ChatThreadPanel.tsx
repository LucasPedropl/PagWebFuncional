import React, { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from '../../types';
import { ChatAudience, getChatSessionUserId } from '../../services/chatService';
import { useChatMessageScroll } from '../../hooks/useChatMessageScroll';
import { Button } from '../ui/Button';
import { formChatInputClass } from '../ui/formStyles';
import { ChatMessageBubble } from './ChatMessageBubble';
import { SelfChatNotice } from './SelfChatNotice';

export interface ChatThreadPanelProps {
  messages: ChatMessage[];
  activeChatId: number;
  viewerRole: ChatAudience;
  selfChat?: boolean;
  planInterestHeading: string;
  inputPlaceholder: string;
  header: React.ReactNode;
  onSend: (text: string) => Promise<boolean>;
  onSendFailed?: (text: string) => void;
}

export const ChatThreadPanel: React.FC<ChatThreadPanelProps> = ({
  messages,
  activeChatId,
  viewerRole,
  selfChat = false,
  planInterestHeading,
  inputPlaceholder,
  header,
  onSend,
  onSendFailed,
}) => {
  const [newMessageText, setNewMessageText] = useState('');
  const currentUserId = getChatSessionUserId();
  const { containerRef, endRef, handleScroll, scrollToBottom } = useChatMessageScroll(
    messages,
    activeChatId,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    const text = newMessageText;
    setNewMessageText('');
    const ok = await onSend(text);
    if (!ok) {
      setNewMessageText(text);
      onSendFailed?.(text);
      return;
    }
    scrollToBottom('smooth');
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full">
      {header}
      {selfChat ? <SelfChatNotice /> : null}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.idMensagem}
            message={message}
            currentUserId={currentUserId}
            viewerRole={viewerRole}
            threadMessages={messages}
            selfChat={selfChat}
            planInterestHeading={planInterestHeading}
          />
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="p-4 border-t border-gray-200 bg-white flex gap-2 shrink-0">
        <input
          type="text"
          placeholder={inputPlaceholder}
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          className={formChatInputClass}
        />
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800 shrink-0 rounded-xl p-2.5">
          <Send className="w-4 h-4 text-white" />
        </Button>
      </form>
    </div>
  );
};
