import { Chat, ChatMessage, ChatMessageMetadata } from '../types';
import { sessionService } from './session';

const CHATS_KEY = 'pagweb_chats_store';
const MESSAGES_KEY = 'pagweb_chats_messages_store';

// Inicialização de dados simulados padrão caso esteja vazio
const defaultChats: Chat[] = [
  {
    idChat: 1,
    idEmpresa: 1,
    nomeEmpresa: 'FitLife Academia',
    logoEmpresa: null,
    idCliente: 1,
    nomeCliente: 'Lucas Silva',
    fotoCliente: null,
    ultimaMensagem: 'Seja bem-vindo! Como podemos ajudar?',
    ultimaMensagemData: new Date(Date.now() - 3600000 * 2).toISOString(),
    naoLidas: 0,
  },
];

const defaultMessages: ChatMessage[] = [
  {
    idMensagem: 1,
    idChat: 1,
    texto: 'Olá, gostaria de tirar uma dúvida sobre as funcionalidades do plano mensal.',
    tipoRemetente: 'Cliente',
    idRemetente: 1,
    dataEnvio: new Date(Date.now() - 3600000 * 2 - 60000).toISOString(),
    lida: true,
  },
  {
    idMensagem: 2,
    idChat: 1,
    texto: 'Seja bem-vindo! Como podemos ajudar?',
    tipoRemetente: 'Empresa',
    idRemetente: 1,
    dataEnvio: new Date(Date.now() - 3600000 * 2).toISOString(),
    lida: true,
  },
];

const getStoredData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const setStoredData = <T>(key: string, val: T): void => {
  localStorage.setItem(key, JSON.stringify(val));
};

export const chatService = {
  initialize() {
    if (!localStorage.getItem(CHATS_KEY)) {
      setStoredData(CHATS_KEY, defaultChats);
    }
    if (!localStorage.getItem(MESSAGES_KEY)) {
      setStoredData(MESSAGES_KEY, defaultMessages);
    }
  },

  async listChats(): Promise<Chat[]> {
    this.initialize();
    const chats = getStoredData<Chat[]>(CHATS_KEY, []);
    const { user } = sessionService.getSession();
    if (!user) return [];

    const activeView = localStorage.getItem('pagweb_active_view') || 'client';
    if (activeView === 'business') {
      return chats.filter((c) => c.idEmpresa === user.idUser);
    }
    return chats.filter((c) => c.idCliente === user.idUser);
  },

  async getChatMessages(idChat: number): Promise<ChatMessage[]> {
    this.initialize();
    const messages = getStoredData<ChatMessage[]>(MESSAGES_KEY, []);
    return messages.filter((m) => m.idChat === idChat);
  },

  async sendMessage(
    idChat: number,
    text: string,
    metadata?: ChatMessageMetadata
  ): Promise<ChatMessage> {
    this.initialize();
    const { user } = sessionService.getSession();
    if (!user) throw new Error('Usuário não autenticado');

    const activeView = localStorage.getItem('pagweb_active_view') || 'client';
    const isEmpresa = activeView === 'business';

    const newMessage: ChatMessage = {
      idMensagem: Date.now(),
      idChat,
      texto: text,
      tipoRemetente: isEmpresa ? 'Empresa' : 'Cliente',
      idRemetente: user.idUser ?? 1,
      dataEnvio: new Date().toISOString(),
      lida: false,
      metadata,
    };

    const messages = getStoredData<ChatMessage[]>(MESSAGES_KEY, []);
    messages.push(newMessage);
    setStoredData(MESSAGES_KEY, messages);

    const chats = getStoredData<Chat[]>(CHATS_KEY, []);
    const chatIndex = chats.findIndex((c) => c.idChat === idChat);
    if (chatIndex !== -1) {
      chats[chatIndex].ultimaMensagem = text;
      chats[chatIndex].ultimaMensagemData = newMessage.dataEnvio;
      if (isEmpresa) {
        // Incrementa não lidas se o destinatário for o cliente e ele não estiver no chat
        chats[chatIndex].naoLidas += 1;
      }
      setStoredData(CHATS_KEY, chats);
    }

    // Simulação de resposta do Bot após 2 segundos se enviado pelo Cliente
    if (!isEmpresa) {
      setTimeout(() => {
        this.simulateBotResponse(idChat, text, metadata);
      }, 2000);
    }

    return newMessage;
  },

  async createOrGetChat(
    idEmpresa: number,
    nomeEmpresa: string,
    idClienteOpt?: number,
    nomeClienteOpt?: string
  ): Promise<Chat> {
    this.initialize();
    const chats = getStoredData<Chat[]>(CHATS_KEY, []);
    const { user } = sessionService.getSession();
    if (!user) throw new Error('Usuário não autenticado');

    const idCliente = idClienteOpt ?? user.idUser ?? 1;
    const nomeCliente = nomeClienteOpt ?? (idClienteOpt ? 'Cliente' : (user.nome || 'Cliente'));
    let chat = chats.find((c) => c.idEmpresa === idEmpresa && c.idCliente === idCliente);

    if (!chat) {
      chat = {
        idChat: Date.now(),
        idEmpresa,
        nomeEmpresa,
        logoEmpresa: null,
        idCliente,
        nomeCliente,
        fotoCliente: null,
        ultimaMensagem: 'Chat iniciado.',
        ultimaMensagemData: new Date().toISOString(),
        naoLidas: 0,
      };
      chats.push(chat);
      setStoredData(CHATS_KEY, chats);
    }

    return chat;
  },

  async markChatAsRead(idChat: number): Promise<void> {
    this.initialize();
    const chats = getStoredData<Chat[]>(CHATS_KEY, []);
    const idx = chats.findIndex((c) => c.idChat === idChat);
    if (idx !== -1) {
      chats[idx].naoLidas = 0;
      setStoredData(CHATS_KEY, chats);
    }
  },

  simulateBotResponse(idChat: number, text: string, metadata?: ChatMessageMetadata) {
    const chats = getStoredData<Chat[]>(CHATS_KEY, []);
    const chat = chats.find((c) => c.idChat === idChat);
    if (!chat) return;

    let responseText = 'Olá! Recebemos sua mensagem e entraremos em contato em breve.';
    if (metadata?.nomePlano) {
      responseText = `Olá! Recebemos sua intenção de assinar o plano "${metadata.nomePlano}" no valor de R$ ${metadata.valorMensalidade?.toFixed(2).replace('.', ',')}. Um de nossos atendentes irá analisar sua solicitação para liberar o contrato de assinatura!`;
    } else if (text.toLowerCase().includes('olá') || text.toLowerCase().includes('ola')) {
      responseText = `Olá! Bem-vindo ao canal de atendimento da ${chat.nomeEmpresa}. Como posso ajudar você hoje?`;
    }

    const botMessage: ChatMessage = {
      idMensagem: Date.now() + 1,
      idChat,
      texto: responseText,
      tipoRemetente: 'Empresa',
      idRemetente: chat.idEmpresa,
      dataEnvio: new Date().toISOString(),
      lida: false,
    };

    const messages = getStoredData<ChatMessage[]>(MESSAGES_KEY, []);
    messages.push(botMessage);
    setStoredData(MESSAGES_KEY, messages);

    const chatIdx = chats.findIndex((c) => c.idChat === idChat);
    if (chatIdx !== -1) {
      chats[chatIdx].ultimaMensagem = responseText;
      chats[chatIdx].ultimaMensagemData = botMessage.dataEnvio;
      chats[chatIdx].naoLidas += 1;
      setStoredData(CHATS_KEY, chats);
    }

    // Dispara evento customizado para notificar a UI de novas mensagens
    window.dispatchEvent(new CustomEvent('pagweb:new-chat-message', { detail: { idChat } }));
  },
};
