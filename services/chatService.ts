import { Chat, ChatMessage, ChatMessageMetadata } from '../types';
import { sessionService } from './session';
import { companyService } from './companyService';
import { parseApiError } from '../utils/formatters';
import {
  applyReadPendingSync,
  findCachedChatByThread,
  getCachedChatsForBusiness,
  getCachedChatsForClient,
  markChatReadPendingSync,
  touchCachedChatMessage,
  upsertCachedChat,
} from '../utils/chatCache';
import { formatPersonFullName } from '../utils/personDisplayName';
import {
  ApiChatResponse,
  applyDirectoryClientNames,
  dedupeChatsByThread,
  mapApiChatsForBusiness,
  mapApiChatsForClient,
  mergeChatLists,
} from './chatListMapper';
import { businessService } from './businessService';
import { mapApiChatMessage } from '../utils/mapApiChatMessage';
import {
  applyMessageTipoOverrides,
  rememberSentMessageTipo,
  tipoRemetenteForActiveSession,
} from '../utils/chatSelfThread';

const API_BASE = 'https://lojas.vlks.com.br/api';

const chatCreateInFlight = new Map<string, Promise<Chat>>();

let businessClientNamesCache: { at: number; byId: Map<number, string> } | null = null;
const BUSINESS_CLIENT_NAMES_TTL_MS = 60_000;

interface ClientDirectoryRow {
  idUser?: number;
  IdUser?: number;
  nome?: string;
  Nome?: string;
  sobreNome?: string;
  SobreNome?: string;
}

const loadBusinessClientNamesById = async (): Promise<Map<number, string>> => {
  if (
    businessClientNamesCache &&
    Date.now() - businessClientNamesCache.at < BUSINESS_CLIENT_NAMES_TTL_MS
  ) {
    return businessClientNamesCache.byId;
  }

  const clients = await businessService.listClients();
  const byId = new Map<number, string>();
  for (const row of clients as ClientDirectoryRow[]) {
    const id = Number(row.idUser ?? row.IdUser);
    const name = formatPersonFullName(row.nome ?? row.Nome, row.sobreNome ?? row.SobreNome);
    if (id > 0 && name) byId.set(id, name);
  }
  businessClientNamesCache = { at: Date.now(), byId };
  return byId;
};

const buildThreadKey = (idEmpresa: number, idCliente: number): string =>
  `${idEmpresa}:${idCliente}`;

const dispatchChatRefresh = (idChat?: number): void => {
  window.dispatchEvent(new CustomEvent('pagweb:refresh-chat-counts'));
  window.dispatchEvent(
    new CustomEvent('pagweb:new-chat-message', { detail: { idChat } }),
  );
};

const getAuthHeaders = (token: string, withJson = false): HeadersInit => {
  const headers: Record<string, string> = {
    accept: '*/*',
    Authorization: `Bearer ${token}`,
  };
  if (withJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const getUserIdFromToken = (token: string): number => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload) as Record<string, unknown>;

    const nameId =
      payload.nameid ??
      payload.sub ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      payload.id ??
      payload.idUser;

    return nameId ? Number(nameId) : 0;
  } catch (e) {
    console.error('[chatService] Erro ao decodificar token JWT:', e);
    return 0;
  }
};

/** ID do usuário autenticado no chat (JWT ou sessão). */
export const getChatSessionUserId = (): number => {
  const { token, user } = sessionService.getSession();
  const fromToken = token ? getUserIdFromToken(token) : 0;
  return fromToken || Number(user?.idUser ?? 0);
};

export type ChatAudience = 'client' | 'business';

export const chatService = {
  async getUnreadTotal(audience: ChatAudience = 'client'): Promise<number> {
    const chats = await this.listChats(audience);
    return chats.reduce((sum, chat) => sum + Number(chat.naoLidas ?? 0), 0);
  },

  async listChats(audience: ChatAudience = 'client'): Promise<Chat[]> {
    const { token, user } = sessionService.getSession();
    if (!token || !user) return [];

    const currentUserId = getUserIdFromToken(token) || user.idUser || 0;

    let idEmpresaBusiness = 0;
    let nomeEmpresaBusiness = user.nome || 'Empresa';
    if (audience === 'business') {
      try {
        const company = await companyService.getMyCompany();
        idEmpresaBusiness = company.idEmpresa;
        nomeEmpresaBusiness = company.nome;
      } catch (err) {
        console.warn('[chatService] Empresa do estabelecimento indisponível:', err);
        return getCachedChatsForBusiness(idEmpresaBusiness);
      }
    }

    const cachedFallback =
      audience === 'business'
        ? getCachedChatsForBusiness(idEmpresaBusiness)
        : getCachedChatsForClient(currentUserId);

    const response = await fetch(`${API_BASE}/Chats`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      console.warn(
        `[chatService] GET /Chats falhou (${response.status}). Usando cache local.`,
      );
      return dedupeChatsByThread(cachedFallback);
    }

    const text = await response.text();
    const emptyApiMessage =
      !text ||
      text.includes('Não há chats') ||
      text.includes('Você não tem nenhum chat');

    if (emptyApiMessage) {
      return dedupeChatsByThread(cachedFallback);
    }

    let data: ApiChatResponse[];
    try {
      data = JSON.parse(text) as ApiChatResponse[];
    } catch {
      return dedupeChatsByThread(cachedFallback);
    }

    if (!Array.isArray(data)) {
      return dedupeChatsByThread(cachedFallback);
    }

    const mapped =
      audience === 'business'
        ? mapApiChatsForBusiness(data, idEmpresaBusiness, nomeEmpresaBusiness)
        : mapApiChatsForClient(data, currentUserId, user.nome || 'Cliente');

    const merged = applyReadPendingSync(mergeChatLists(mapped, cachedFallback));
    const withDirectoryNames =
      audience === 'business'
        ? applyDirectoryClientNames(merged, await loadBusinessClientNamesById())
        : merged;
    withDirectoryNames.forEach((chat) => upsertCachedChat(chat));
    return withDirectoryNames;
  },

  async getChatMessages(idChat: number): Promise<ChatMessage[]> {
    const { token } = sessionService.getSession();
    if (!token) return [];

    const response = await fetch(`${API_BASE}/Chats/${idChat}/Mensagens`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      return [];
    }

    const text = await response.text();
    if (!text || text.includes('Não há mensagens')) {
      return [];
    }

    let data: unknown[];
    try {
      data = JSON.parse(text) as unknown[];
    } catch {
      return [];
    }

    if (!Array.isArray(data)) return [];

    return applyMessageTipoOverrides(
      data.map((m) => mapApiChatMessage(m, idChat)),
    );
  },

  async sendMessage(
    idChat: number,
    text: string,
    metadata?: ChatMessageMetadata
  ): Promise<ChatMessage> {
    const { token, user } = sessionService.getSession();
    if (!token || !user) throw new Error('Usuário não autenticado');

    const formData = new FormData();
    formData.append('texto', text);
    if (metadata?.idPlano) {
      formData.append('idPlano', String(metadata.idPlano));
    }

    const response = await fetch(`${API_BASE}/Chats/${idChat}/Mensagens`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await parseApiError(response);
      throw new Error(errorText || 'Falha ao enviar mensagem');
    }

    touchCachedChatMessage(idChat, text);
    dispatchChatRefresh(idChat);

    const m = await response.json();
    const mapped = mapApiChatMessage(m, idChat);
    if (metadata) {
      mapped.metadata = metadata;
    }
    if (!mapped.texto) {
      mapped.texto = text;
    }
    if (!mapped.idRemetente) {
      const currentUserId = getUserIdFromToken(token);
      mapped.idRemetente = currentUserId || Number(user.idUser ?? 0);
    }
    const intendedTipo = tipoRemetenteForActiveSession();
    mapped.tipoRemetente = intendedTipo;
    rememberSentMessageTipo(mapped.idMensagem, intendedTipo);
    return mapped;
  },

  async createOrGetChat(
    idEmpresa: number,
    nomeEmpresa: string,
    idClienteOpt?: number,
    nomeClienteOpt?: string
  ): Promise<Chat> {
    const { token, user } = sessionService.getSession();
    if (!token || !user) throw new Error('Usuário não autenticado');

    const currentUserId = getUserIdFromToken(token);
    const idCliente = idClienteOpt || currentUserId || user.idUser || 0;

    if (idEmpresa <= 0 || idCliente <= 0) {
      throw new Error(`Dados incorretos para criar chat: idEmpresa=${idEmpresa}, idCliente=${idCliente}.`);
    }

    const threadKey = buildThreadKey(idEmpresa, idCliente);
    const inFlight = chatCreateInFlight.get(threadKey);
    if (inFlight) return inFlight;

    const task = (async (): Promise<Chat> => {
      const cached = findCachedChatByThread(idEmpresa, idCliente);
      if (cached) {
        const resolved = { ...cached, nomeEmpresa };
        upsertCachedChat(resolved);
        return resolved;
      }

      const existingChats = await this.listChats();
      const found = existingChats.find(
        (c) => c.idEmpresa === idEmpresa && c.idCliente === idCliente,
      );

      if (found) {
        upsertCachedChat(found);
        return found;
      }

      const formData = new FormData();
      formData.append('idEmpresa', String(idEmpresa));
      formData.append('idUsuario', String(idCliente));

      const response = await fetch(`${API_BASE}/Chats`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        const errorText = await parseApiError(response);
        throw new Error(errorText || 'Falha ao criar chat');
      }

      interface ApiChatCreateResponse {
        id: number;
        idChat?: number;
        dataInicio?: string;
      }

      const createdChat = (await response.json()) as ApiChatCreateResponse;

      const chat: Chat = {
        idChat: Number(createdChat.id ?? createdChat.idChat ?? Date.now()),
        idEmpresa,
        nomeEmpresa,
        logoEmpresa: null,
        idCliente,
        nomeCliente: nomeClienteOpt ?? user.nome ?? 'Cliente',
        fotoCliente: null,
        ultimaMensagem: 'Chat iniciado.',
        ultimaMensagemData: createdChat.dataInicio || new Date().toISOString(),
        naoLidas: 0,
      };

      upsertCachedChat(chat);
      dispatchChatRefresh(chat.idChat);
      return chat;
    })();

    chatCreateInFlight.set(threadKey, task);
    try {
      return await task;
    } finally {
      chatCreateInFlight.delete(threadKey);
    }
  },

  async markChatAsRead(idChat: number): Promise<void> {
    const { token } = sessionService.getSession();
    if (!token) return;

    markChatReadPendingSync(idChat);

    await fetch(`${API_BASE}/Chats/${idChat}/Ler`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    dispatchChatRefresh(idChat);
  },
};
