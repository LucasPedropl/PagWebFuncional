import { Chat } from '../types';

const CACHE_KEY = 'pagweb_chats_cache';

interface ChatCacheStore {
  chats: Chat[];
}

const readStore = (): ChatCacheStore => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { chats: [] };
    const parsed = JSON.parse(raw) as ChatCacheStore;
    return Array.isArray(parsed.chats) ? parsed : { chats: [] };
  } catch {
    return { chats: [] };
  }
};

const writeStore = (store: ChatCacheStore): void => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(store));
};

/** Persiste/atualiza um chat no cache local (fallback quando GET /Chats falha). */
export const upsertCachedChat = (chat: Chat): void => {
  const store = readStore();
  const index = store.chats.findIndex(
    (c) =>
      c.idChat === chat.idChat ||
      (c.idEmpresa === chat.idEmpresa && c.idCliente === chat.idCliente),
  );
  if (index >= 0) {
    store.chats[index] = { ...store.chats[index], ...chat };
  } else {
    store.chats.push(chat);
  }
  writeStore(store);
};

export const findCachedChatByThread = (
  idEmpresa: number,
  idCliente: number,
): Chat | undefined =>
  readStore().chats.find(
    (c) => c.idEmpresa === idEmpresa && c.idCliente === idCliente,
  );

/** Atualiza prévia da última mensagem após envio. */
export const touchCachedChatMessage = (
  idChat: number,
  ultimaMensagem: string,
  ultimaMensagemData?: string,
): void => {
  const store = readStore();
  const chat = store.chats.find((c) => c.idChat === idChat);
  if (!chat) return;
  chat.ultimaMensagem = ultimaMensagem;
  chat.ultimaMensagemData = ultimaMensagemData ?? new Date().toISOString();
  writeStore(store);
};

export const getCachedChatsForClient = (idCliente: number): Chat[] =>
  readStore().chats.filter((c) => c.idCliente === idCliente);

export const getCachedChatsForBusiness = (idEmpresa: number): Chat[] =>
  readStore().chats.filter((c) => c.idEmpresa === idEmpresa);

export const getCachedUnreadTotal = (
  filter: (chat: Chat) => boolean,
): number =>
  readStore()
    .chats.filter(filter)
    .reduce((sum, chat) => sum + Number(chat.naoLidas ?? 0), 0);
