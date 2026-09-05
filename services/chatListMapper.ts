import { Chat } from '../types';
import { formatPersonFullName, isGenericChatClientLabel } from '../utils/personDisplayName';

export interface ApiChatResponse {
  idChat: number;
  nomeUsario?: string;
  nomeUsuario?: string;
  nome?: string;
  sobreNome?: string;
  sobreNomeUsuario?: string;
  idUsuario?: number;
  fotoUsuario?: string | null;
  idEMpresa?: number;
  idEmpresa?: number;
  nomeEmpresa?: string;
  logoEmpresa?: string | null;
  ultimaMensagem?: string | null;
  dataHora?: string | null;
  naoLidas?: number;
}

const clientNameFromApiChat = (rc: ApiChatResponse): string =>
  formatPersonFullName(
    rc.nomeUsuario || rc.nomeUsario || rc.nome,
    rc.sobreNomeUsuario || rc.sobreNome,
  );

export const mapApiChatsForBusiness = (
  data: ApiChatResponse[],
  idEmpresa: number,
  nomeEmpresa: string,
): Chat[] =>
  data.map((rc) => ({
    idChat: Number(rc.idChat),
    idEmpresa,
    nomeEmpresa,
    logoEmpresa: null,
    idCliente: Number(rc.idUsuario ?? 0),
    nomeCliente: clientNameFromApiChat(rc) || 'Cliente',
    fotoCliente: rc.fotoUsuario || null,
    ultimaMensagem: rc.ultimaMensagem || '',
    ultimaMensagemData: rc.dataHora || new Date().toISOString(),
    naoLidas: Number(rc.naoLidas ?? 0),
  }));

export const mapApiChatsForClient = (
  data: ApiChatResponse[],
  idCliente: number,
  nomeCliente: string,
): Chat[] =>
  data.map((rc) => ({
    idChat: Number(rc.idChat),
    idEmpresa: Number(rc.idEMpresa ?? rc.idEmpresa ?? 0),
    nomeEmpresa: String(rc.nomeEmpresa || 'Empresa'),
    logoEmpresa: rc.logoEmpresa || null,
    idCliente,
    nomeCliente,
    fotoCliente: null,
    ultimaMensagem: rc.ultimaMensagem || '',
    ultimaMensagemData: rc.dataHora || new Date().toISOString(),
    naoLidas: Number(rc.naoLidas ?? 0),
  }));

const threadKey = (chat: Chat): string => `${chat.idEmpresa}:${chat.idCliente}`;

/** Uma conversa por par empresa + cliente (evita duplicatas no cache/API). */
export const dedupeChatsByThread = (chats: Chat[]): Chat[] => {
  const byThread = new Map<string, Chat>();

  for (const chat of chats) {
    const key = threadKey(chat);
    const existing = byThread.get(key);
    if (!existing) {
      byThread.set(key, chat);
      continue;
    }

    const chatTime = new Date(chat.ultimaMensagemData).getTime();
    const existingTime = new Date(existing.ultimaMensagemData).getTime();
    const preferChat =
      chat.idChat > existing.idChat || chatTime >= existingTime;

    const winner = preferChat ? chat : existing;
    const loser = preferChat ? existing : chat;

    byThread.set(key, {
      ...winner,
      naoLidas: Math.max(winner.naoLidas ?? 0, loser.naoLidas ?? 0),
      ultimaMensagem: winner.ultimaMensagem || loser.ultimaMensagem,
      ultimaMensagemData:
        chatTime >= existingTime
          ? winner.ultimaMensagemData
          : existing.ultimaMensagemData,
    });
  }

  return Array.from(byThread.values());
};

export const mergeChatLists = (primary: Chat[], fallback: Chat[]): Chat[] =>
  dedupeChatsByThread([...fallback, ...primary]);

/** Completa o nome do cliente com o cadastro (Nome+SobreNome). O GET /Chats só manda o primeiro nome. */
export const applyDirectoryClientNames = (
  chats: Chat[],
  namesByClientId: Map<number, string>,
): Chat[] =>
  chats.map((chat) => {
    const directoryName = namesByClientId.get(chat.idCliente)?.trim();
    if (!directoryName) return chat;
    if (!isGenericChatClientLabel(chat.nomeCliente) && chat.nomeCliente.trim().length >= directoryName.length) {
      return chat;
    }
    return { ...chat, nomeCliente: directoryName };
  });
