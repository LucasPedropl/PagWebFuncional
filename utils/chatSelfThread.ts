import { Chat, ChatMessage } from '../types';
import { ChatAudience } from '../services/chatService';
import { sessionService } from '../services/session';

const TIPO_OVERRIDE_KEY = 'pagweb_chat_msg_tipo_v1';
const MAX_OVERRIDES = 400;

type TipoRemetente = ChatMessage['tipoRemetente'];

const readOverrideMap = (): Record<string, TipoRemetente> => {
  try {
    const raw = localStorage.getItem(TIPO_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TipoRemetente>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeOverrideMap = (map: Record<string, TipoRemetente>): void => {
  const keys = Object.keys(map);
  if (keys.length > MAX_OVERRIDES) {
    const trimmed = keys.slice(-MAX_OVERRIDES);
    const next: Record<string, TipoRemetente> = {};
    trimmed.forEach((k) => {
      next[k] = map[k];
    });
    localStorage.setItem(TIPO_OVERRIDE_KEY, JSON.stringify(next));
    return;
  }
  localStorage.setItem(TIPO_OVERRIDE_KEY, JSON.stringify(map));
};

/** Perfil ativo no envio (admin = estabelecimento, client = cliente). */
export const tipoRemetenteForActiveSession = (): TipoRemetente =>
  sessionService.getActiveMode() === 'admin' ? 'Empresa' : 'Cliente';

export const rememberSentMessageTipo = (
  idMensagem: number,
  tipo: TipoRemetente,
): void => {
  if (idMensagem <= 0) return;
  const map = readOverrideMap();
  map[String(idMensagem)] = tipo;
  writeOverrideMap(map);
};

export const applyMessageTipoOverrides = (
  messages: ChatMessage[],
): ChatMessage[] => {
  const map = readOverrideMap();
  if (Object.keys(map).length === 0) return messages;

  return messages.map((message) => {
    const override = map[String(message.idMensagem)];
    if (!override) return message;
    return { ...message, tipoRemetente: override };
  });
};

/** Conversa do usuário com o próprio perfil cliente/estabelecimento. */
export const isSelfChatThread = (
  chat: Chat | null | undefined,
  currentUserId: number,
  audience: ChatAudience,
  myEmpresaId: number,
): boolean => {
  if (!chat || currentUserId <= 0) return false;

  if (audience === 'business') {
    return Number(chat.idCliente) === currentUserId;
  }

  if (!sessionService.isEmpresaOwner()) return false;
  if (myEmpresaId <= 0) return false;

  return (
    Number(chat.idEmpresa) === myEmpresaId &&
    Number(chat.idCliente) === currentUserId
  );
};

export const SELF_CHAT_NOTICE =
  'Esta conversa é com você mesmo (perfil cliente e estabelecimento). Mensagens enviadas como cliente aparecem de um lado; como estabelecimento, do outro.';
