import { useCallback, useEffect, useState } from 'react';
import { chatService, ChatAudience } from '../services/chatService';

const POLL_MS = 5000;

/** Contagem de mensagens não lidas para badge na sidebar. */
export function useUnreadChatCount(enabled: boolean, audience: ChatAudience = 'client'): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    try {
      const total = await chatService.getUnreadTotal(audience);
      setCount(total);
    } catch (err) {
      console.error('[PagWeb] Contagem de chats não lidos:', err);
    }
  }, [enabled, audience]);

  useEffect(() => {
    void refresh();
    if (!enabled) return undefined;

    const interval = window.setInterval(() => void refresh(), POLL_MS);
    const onRefresh = () => void refresh();
    window.addEventListener('pagweb:refresh-chat-counts', onRefresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pagweb:refresh-chat-counts', onRefresh);
    };
  }, [enabled, refresh]);

  return count;
}
