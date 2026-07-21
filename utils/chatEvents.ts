export const CHAT_READ_EVENT = 'pagweb:chat-read';

export interface ChatReadEventDetail {
  idChat: number;
  cleared: number;
}

export const dispatchChatRead = (idChat: number, cleared: number): void => {
  if (cleared <= 0) return;
  window.dispatchEvent(
    new CustomEvent<ChatReadEventDetail>(CHAT_READ_EVENT, {
      detail: { idChat, cleared },
    }),
  );
};
