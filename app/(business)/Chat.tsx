import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { chatService } from '../../services/chatService';
import { companyService } from '../../services/companyService';
import { useChatInbox } from '../../hooks/useChatInbox';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, User, MessageSquare } from 'lucide-react';
import { ChatThreadPanel } from '../../components/chat/ChatThreadPanel';

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const {
    chats,
    selectedChat,
    clearSelectedChat,
    messages,
    loading,
    fetchChats,
    selectChat,
    sendText,
    selfChat,
  } = useChatInbox({ audience: 'business' });
  const urlOpenGuardRef = useRef<string | null>(null);

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const clientName = searchParams.get('clientName');
    if (!clientId || !clientName) {
      urlOpenGuardRef.current = null;
      return;
    }

    if (urlOpenGuardRef.current === clientId) return;
    urlOpenGuardRef.current = clientId;

    const handleUrlParams = async () => {
      try {
        const idCliente = parseInt(clientId, 10);
        const company = await companyService.getMyCompany();
        const chat = await chatService.createOrGetChat(
          company.idEmpresa,
          company.nome,
          idCliente,
          clientName,
        );
        await fetchChats();
        await selectChat(chat);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível abrir o chat.';
        console.error('[PagWeb] Erro ao iniciar chat com cliente:', err);
        addToast('error', 'Chat', message);
        urlOpenGuardRef.current = null;
      } finally {
        setSearchParams({});
      }
    };

    void handleUrlParams();
  }, [searchParams, fetchChats, selectChat, addToast, setSearchParams]);

  return (
    <BusinessLayout>
      <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div
          className={`${
            selectedChat ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 border-r border-gray-200 flex-col bg-gray-50 min-h-0`}
        >
          <div className="p-4 border-b border-gray-200 bg-white shrink-0">
            <h2 className="font-bold text-gray-900 text-lg">Mensagens de Clientes</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-gray-300" />
                Nenhum contato iniciado por clientes ainda.
              </div>
            ) : (
              chats.map((c) => (
                <button
                  key={c.idChat}
                  type="button"
                  onClick={() => void selectChat(c)}
                  className={`w-full text-left p-4 hover:bg-gray-100 flex gap-3 transition-colors ${
                    selectedChat?.idChat === c.idChat ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900 text-sm truncate">{c.nomeCliente}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.ultimaMensagemData).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{c.ultimaMensagem}</p>
                  </div>
                  {c.naoLidas > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center shrink-0">
                      {c.naoLidas > 9 ? '9+' : c.naoLidas}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className={`${
            selectedChat ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-white h-full min-h-0`}
        >
          {selectedChat ? (
            <ChatThreadPanel
              messages={messages}
              activeChatId={selectedChat.idChat}
              viewerRole="business"
              selfChat={selfChat}
              planInterestHeading="Interesse em Plano"
              inputPlaceholder="Responder ao cliente..."
              onSend={sendText}
              onSendFailed={() =>
                addToast('error', 'Chat', 'Não foi possível enviar a mensagem.')
              }
              header={
                <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => clearSelectedChat()}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{selectedChat.nomeCliente}</h3>
                    <span className="text-[11px] text-gray-500 font-medium">Cliente Registrado</span>
                  </div>
                </div>
              }
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 bg-gray-50/20">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm">Selecione uma conversa com cliente para começar.</p>
            </div>
          )}
        </div>
      </div>
    </BusinessLayout>
  );
};
