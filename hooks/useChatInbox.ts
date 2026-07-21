import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatAudience, chatService } from '../services/chatService';
import { Chat, ChatMessage } from '../types';
import { markChatReadPendingSync } from '../utils/chatCache';
import { dispatchChatRead } from '../utils/chatEvents';

const LIST_POLL_MS = 5000;
const MESSAGE_POLL_MS = 3000;

interface UseChatInboxOptions {
  enabled?: boolean;
  audience?: ChatAudience;
}

/** Lista de chats + mensagens do chat selecionado com polling. */
export function useChatInbox(options?: UseChatInboxOptions) {
  const enabled = options?.enabled ?? true;
  const audience = options?.audience ?? 'client';
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedIdRef = useRef<number | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      const list = await chatService.listChats(audience);
      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.ultimaMensagemData).getTime() -
          new Date(a.ultimaMensagemData).getTime(),
      );
      const activeId = selectedIdRef.current;
      const withActiveRead =
        activeId == null
          ? sorted
          : sorted.map((c) =>
              c.idChat === activeId ? { ...c, naoLidas: 0 } : c,
            );
      setChats(withActiveRead);
      return withActiveRead;
    } catch (err) {
      console.error('[PagWeb] Erro ao carregar chats:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [audience]);

  const loadMessages = useCallback(async (idChat: number, markRead = true) => {
    try {
      const list = await chatService.getChatMessages(idChat);
      setMessages(list);

      const viewing = selectedIdRef.current === idChat;
      const shouldMarkRead = markRead || viewing;

      const mySide: ChatMessage['tipoRemetente'] =
        audience === 'business' ? 'Empresa' : 'Cliente';
      const unread = list.filter((m) => !m.lida && m.tipoRemetente !== mySide).length;

      let clearedForEvent = 0;
      setChats((prev) =>
        prev.map((c) => {
          if (c.idChat !== idChat) return c;
          if (shouldMarkRead && (c.naoLidas ?? 0) > 0) {
            clearedForEvent = c.naoLidas ?? 0;
          }
          return {
            ...c,
            naoLidas: shouldMarkRead ? 0 : unread,
          };
        }),
      );

      if (shouldMarkRead) {
        markChatReadPendingSync(idChat);
        if (clearedForEvent > 0) {
          dispatchChatRead(idChat, clearedForEvent);
        }
        await chatService.markChatAsRead(idChat);
      }
    } catch (err) {
      console.error('[PagWeb] Erro ao carregar mensagens:', err);
    }
  }, [audience]);

  const selectChat = useCallback(
    async (chat: Chat) => {
      selectedIdRef.current = chat.idChat;
      setSelectedChat(chat);
      const unread = Number(chat.naoLidas ?? 0);
      if (unread > 0) {
        dispatchChatRead(chat.idChat, unread);
        markChatReadPendingSync(chat.idChat);
        setChats((prev) =>
          prev.map((c) => (c.idChat === chat.idChat ? { ...c, naoLidas: 0 } : c)),
        );
      }
      await loadMessages(chat.idChat);
    },
    [loadMessages],
  );

  const sendText = useCallback(
    async (text: string, metadata?: ChatMessage['metadata']) => {
      if (!selectedChat || !text.trim()) return false;
      try {
        await chatService.sendMessage(selectedChat.idChat, text.trim(), metadata);
        await loadMessages(selectedChat.idChat, false);
        await fetchChats();
        return true;
      } catch (err) {
        console.error('[PagWeb] Erro ao enviar mensagem:', err);
        return false;
      }
    },
    [selectedChat, loadMessages, fetchChats],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    void fetchChats();
    const listTimer = window.setInterval(() => void fetchChats(), LIST_POLL_MS);
    const onListRefresh = () => void fetchChats();
    window.addEventListener('pagweb:refresh-chat-counts', onListRefresh);
    window.addEventListener('pagweb:new-chat-message', onListRefresh);

    return () => {
      window.clearInterval(listTimer);
      window.removeEventListener('pagweb:refresh-chat-counts', onListRefresh);
      window.removeEventListener('pagweb:new-chat-message', onListRefresh);
    };
  }, [enabled, fetchChats]);

  useEffect(() => {
    if (!enabled || !selectedChat) return undefined;
    const idChat = selectedChat.idChat;
    selectedIdRef.current = idChat;
    const msgTimer = window.setInterval(() => {
      if (selectedIdRef.current === idChat) {
        void loadMessages(idChat, true);
      }
    }, MESSAGE_POLL_MS);

    const onNewMessage = (e: Event) => {
      const eventChatId = (e as CustomEvent<{ idChat?: number }>).detail?.idChat;
      if (!eventChatId || eventChatId === idChat) {
        void loadMessages(idChat, true);
      }
    };
    window.addEventListener('pagweb:new-chat-message', onNewMessage);

    return () => {
      window.clearInterval(msgTimer);
      window.removeEventListener('pagweb:new-chat-message', onNewMessage);
    };
  }, [enabled, selectedChat, loadMessages]);

  return {
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    messages,
    loading,
    fetchChats,
    loadMessages,
    selectChat,
    sendText,
  };
}
