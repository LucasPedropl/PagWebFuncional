import { ChatMessage } from '../types';
import { ChatAudience } from '../services/chatService';

export type ChatViewerRole = ChatAudience;

/** IDs de remetente distintos na thread — dá para confiar em idRemetente. */
export const chatRemetenteIdsLookReliable = (messages: ChatMessage[]): boolean => {
  const ids = new Set(
    messages.map((m) => Number(m.idRemetente)).filter((id) => id > 0),
  );
  return ids.size >= 2;
};

const isOwnByViewerRole = (
  message: ChatMessage,
  viewerRole: ChatViewerRole,
): boolean =>
  viewerRole === 'business'
    ? message.tipoRemetente === 'Empresa'
    : message.tipoRemetente === 'Cliente';

/**
 * Mensagem enviada pelo usuário que está vendo o chat.
 * A API costuma repetir o id do cliente do thread em `idUsuario`; por isso
 * usamos tipo + papel do viewer quando os IDs não distinguem remetentes.
 */
export const isOwnChatMessage = (
  message: ChatMessage,
  currentUserId: number,
  viewerRole: ChatViewerRole,
  threadMessages?: ChatMessage[],
  selfChat = false,
): boolean => {
  if (selfChat) {
    return isOwnByViewerRole(message, viewerRole);
  }

  const idsReliable = threadMessages
    ? chatRemetenteIdsLookReliable(threadMessages)
    : false;

  if (idsReliable && currentUserId > 0 && message.idRemetente > 0) {
    return Number(message.idRemetente) === currentUserId;
  }

  return isOwnByViewerRole(message, viewerRole);
};
