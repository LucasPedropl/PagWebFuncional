import { Chat, ChatMessage } from '../types';

const chatRowKey = (chat: Chat): string =>
  [
    chat.idChat,
    chat.naoLidas,
    chat.ultimaMensagem,
    chat.ultimaMensagemData,
    chat.nomeCliente,
    chat.nomeEmpresa,
  ].join('\u0001');

export const chatListSignature = (chats: Chat[]): string =>
  chats.map(chatRowKey).join('\u0002');

/** Evita re-render da lista quando o polling devolve os mesmos dados. */
export const chatsEqualForList = (a: Chat[], b: Chat[]): boolean =>
  chatListSignature(a) === chatListSignature(b);

const messageRowKey = (m: ChatMessage): string =>
  `${m.idMensagem}:${m.lida}:${m.tipoRemetente}:${m.texto}`;

export const messagesEqualForThread = (
  a: ChatMessage[],
  b: ChatMessage[],
): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (messageRowKey(a[i]) !== messageRowKey(b[i])) return false;
  }
  return true;
};
