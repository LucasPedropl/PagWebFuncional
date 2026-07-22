import { useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

const NEAR_BOTTOM_PX = 96;

/**
 * Rola para o fim só quando o usuário já está perto do fim ou ao trocar de chat.
 * Evita puxar o scroll para baixo durante polling enquanto lê mensagens antigas.
 */
export function useChatMessageScroll(
  messages: ChatMessage[],
  activeChatId: number | undefined,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const prevLastMessageIdRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_PX;
  }, []);

  useEffect(() => {
    stickToBottomRef.current = true;
    prevLastMessageIdRef.current = null;
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
  }, [activeChatId]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const lastId = last?.idMensagem ?? null;
    if (lastId === prevLastMessageIdRef.current) return;
    prevLastMessageIdRef.current = lastId;

    if (!stickToBottomRef.current) return;

    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    });
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    stickToBottomRef.current = true;
    endRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  return { containerRef, endRef, handleScroll, scrollToBottom };
};
