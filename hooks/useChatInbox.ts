import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatAudience, chatService, getChatSessionUserId } from '../services/chatService';
import { companyService } from '../services/companyService';
import { sessionService } from '../services/session';
import { Chat, ChatMessage } from '../types';
import { markChatReadPendingSync } from '../utils/chatCache';
import { dispatchChatRead } from '../utils/chatEvents';
import { chatsEqualForList, messagesEqualForThread } from '../utils/chatListStable';
import { isOwnChatMessage } from '../utils/chatMessageOwnership';
import { isSelfChatThread } from '../utils/chatSelfThread';

const LIST_POLL_MS = 5000;
const MESSAGE_POLL_MS = 3000;
const LIST_REFRESH_DEBOUNCE_MS = 450;

const selectedChatStorageKey = (audience: ChatAudience): string =>
  `pagweb_selected_chat_${audience}`;

interface UseChatInboxOptions {
  enabled?: boolean;
  audience?: ChatAudience;
}

/** Lista de chats + mensagens do chat selecionado com polling. */
export function useChatInbox(options?: UseChatInboxOptions) {
  const enabled = options?.enabled ?? true;
  const audience = options?.audience ?? 'client';
  const [chats, setChats] = useState<Chat[]>([]);
  const [myEmpresaId, setMyEmpresaId] = useState(0);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedIdRef = useRef<number | null>(null);
  const didRestoreSelectionRef = useRef(false);
  const listRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (audience !== 'client' || !sessionService.isEmpresaOwner()) return undefined;
    let cancelled = false;
    void companyService
      .getMyCompany()
      .then((company) => {
        if (!cancelled) setMyEmpresaId(company.idEmpresa);
      })
      .catch(() => {
        if (!cancelled) setMyEmpresaId(0);
      });
    return () => {
      cancelled = true;
    };
  }, [audience]);

  const selfChat = useMemo(
    () =>
      isSelfChatThread(
        selectedChat,
        getChatSessionUserId(),
        audience,
        myEmpresaId,
      ),
    [selectedChat, audience, myEmpresaId],
  );

  const commitChats = useCallback((next: Chat[]) => {
    setChats((prev) => (chatsEqualForList(prev, next) ? prev : next));
  }, []);

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
      commitChats(withActiveRead);

      if (activeId != null) {
        const refreshed = withActiveRead.find((c) => c.idChat === activeId);
        if (refreshed) {
          setSelectedChat((prev) =>
            prev?.idChat === activeId ? { ...prev, ...refreshed, naoLidas: 0 } : prev,
          );
        }
      }

      return withActiveRead;
    } catch (err) {
      console.error('[PagWeb] Erro ao carregar chats:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [audience, commitChats]);

  const scheduleFetchChats = useCallback(() => {
    if (listRefreshTimerRef.current) {
      clearTimeout(listRefreshTimerRef.current);
    }
    listRefreshTimerRef.current = setTimeout(() => {
      listRefreshTimerRef.current = null;
      void fetchChats();
    }, LIST_REFRESH_DEBOUNCE_MS);
  }, [fetchChats]);

  const loadMessages = useCallback(async (idChat: number, markRead = true) => {
    try {
      const list = await chatService.getChatMessages(idChat);
      setMessages((prev) =>
        messagesEqualForThread(prev, list) ? prev : list,
      );

      const viewing = selectedIdRef.current === idChat;
      const shouldMarkRead = markRead || viewing;

      const currentUserId = getChatSessionUserId();
      const unread = list.filter(
        (m) =>
          !m.lida &&
          !isOwnChatMessage(m, currentUserId, audience, list, selfChat),
      ).length;

      let clearedFromBadge = 0;
      setChats((prev) => {
        const next = prev.map((c) => {
          if (c.idChat !== idChat) return c;
          if (shouldMarkRead) {
            clearedFromBadge = Number(c.naoLidas ?? 0);
          }
          return {
            ...c,
            naoLidas: shouldMarkRead ? 0 : unread,
          };
        });
        return chatsEqualForList(prev, next) ? prev : next;
      });

      if (shouldMarkRead) {
        markChatReadPendingSync(idChat);
        const cleared = Math.max(clearedFromBadge, unread);
        if (cleared > 0) {
          dispatchChatRead(idChat, cleared);
        }
        await chatService.markChatAsRead(idChat);
      }
    } catch (err) {
      console.error('[PagWeb] Erro ao carregar mensagens:', err);
    }
  }, [audience, selfChat]);

  const selectChat = useCallback(
    async (chat: Chat) => {
      selectedIdRef.current = chat.idChat;
      sessionStorage.setItem(selectedChatStorageKey(audience), String(chat.idChat));
      setSelectedChat(chat);
      const unread = Number(chat.naoLidas ?? 0);
      if (unread > 0) {
        markChatReadPendingSync(chat.idChat);
        setChats((prev) => {
          const next = prev.map((c) =>
            c.idChat === chat.idChat ? { ...c, naoLidas: 0 } : c,
          );
          return chatsEqualForList(prev, next) ? prev : next;
        });
      }
      await loadMessages(chat.idChat);
    },
    [loadMessages, audience],
  );

  const clearSelectedChat = useCallback(() => {
    selectedIdRef.current = null;
    sessionStorage.removeItem(selectedChatStorageKey(audience));
    setSelectedChat(null);
    setMessages([]);
  }, [audience]);

  const setSelectedChatSynced = useCallback((chat: Chat | null) => {
    selectedIdRef.current = chat?.idChat ?? null;
    setSelectedChat(chat);
    if (!chat) {
      setMessages([]);
    }
  }, []);

  const sendText = useCallback(
    async (text: string, metadata?: ChatMessage['metadata']) => {
      if (!selectedChat || !text.trim()) return false;
      const trimmed = text.trim();
      try {
        await chatService.sendMessage(selectedChat.idChat, trimmed, metadata);
        const now = new Date().toISOString();
        setChats((prev) => {
          const next = prev.map((c) =>
            c.idChat === selectedChat.idChat
              ? {
                  ...c,
                  ultimaMensagem: trimmed,
                  ultimaMensagemData: now,
                }
              : c,
          );
          return chatsEqualForList(prev, next) ? prev : next;
        });
        await loadMessages(selectedChat.idChat, false);
        scheduleFetchChats();
        return true;
      } catch (err) {
        console.error('[PagWeb] Erro ao enviar mensagem:', err);
        return false;
      }
    },
    [selectedChat, loadMessages, scheduleFetchChats],
  );

  useEffect(() => {
    if (!enabled) return undefined;
    void fetchChats();
    const listTimer = window.setInterval(() => void fetchChats(), LIST_POLL_MS);
    const onListRefresh = () => scheduleFetchChats();
    window.addEventListener('pagweb:refresh-chat-counts', onListRefresh);
    window.addEventListener('pagweb:new-chat-message', onListRefresh);

    return () => {
      window.clearInterval(listTimer);
      if (listRefreshTimerRef.current) {
        clearTimeout(listRefreshTimerRef.current);
      }
      window.removeEventListener('pagweb:refresh-chat-counts', onListRefresh);
      window.removeEventListener('pagweb:new-chat-message', onListRefresh);
    };
  }, [enabled, fetchChats, scheduleFetchChats]);

  useEffect(() => {
    if (!enabled || didRestoreSelectionRef.current) return;
    if (selectedIdRef.current != null) {
      didRestoreSelectionRef.current = true;
      return;
    }

    const raw = sessionStorage.getItem(selectedChatStorageKey(audience));
    const savedId = raw ? Number.parseInt(raw, 10) : Number.NaN;
    if (!Number.isFinite(savedId) || savedId <= 0) {
      didRestoreSelectionRef.current = true;
      return;
    }

    if (loading) return;

    const chat = chats.find((c) => c.idChat === savedId);
    if (chat) {
      didRestoreSelectionRef.current = true;
      void selectChat(chat);
      return;
    }

    if (chats.length > 0) {
      didRestoreSelectionRef.current = true;
    }
  }, [enabled, loading, chats, audience, selectChat]);

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
    setSelectedChat: setSelectedChatSynced,
    clearSelectedChat,
    messages,
    loading,
    fetchChats,
    loadMessages,
    selectChat,
    sendText,
    selfChat,
  };
}
