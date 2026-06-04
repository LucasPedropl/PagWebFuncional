import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { chatService } from '../../services/chatService';
import { useChatInbox } from '../../hooks/useChatInbox';
import { useToast } from '../../context/ToastContext';
import { Send, ArrowLeft, Store, MessageSquare, Tag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  buildPlanChatRequestMessage,
  PlanChatRequestReason,
} from '../../utils/planChatRequest';

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const {
    chats,
    selectedChat,
    setSelectedChat,
    messages,
    loading,
    fetchChats,
    selectChat,
    sendText,
  } = useChatInbox();
  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const urlOpenGuardRef = useRef<string | null>(null);

  useEffect(() => {
    const companyId = searchParams.get('companyId');
    const companyName = searchParams.get('companyName');
    if (!companyId || !companyName) {
      urlOpenGuardRef.current = null;
      return;
    }

    const planId = searchParams.get('planId');
    const guardKey = `${companyId}:${planId ?? ''}`;
    if (urlOpenGuardRef.current === guardKey) return;
    urlOpenGuardRef.current = guardKey;

    const handleUrlParams = async () => {
      const planName = searchParams.get('planName');
      const price = searchParams.get('price');

      try {
        const idEmpresa = parseInt(companyId, 10);
        const chat = await chatService.createOrGetChat(idEmpresa, companyName);
        await fetchChats();
        await selectChat(chat);

        if (planId && planName) {
          const reasonParam = searchParams.get('reason');
          const reason: PlanChatRequestReason =
            reasonParam === 'company_only' ||
            reasonParam === 'already_subscribed' ||
            reasonParam === 'questions' ||
            reasonParam === 'interest'
              ? reasonParam
              : 'interest';
          const txt = buildPlanChatRequestMessage(
            planName,
            reason,
            companyName
          );
          await sendText(txt, {
            idPlano: parseInt(planId, 10),
            nomePlano: planName,
            valorMensalidade: price ? parseFloat(price) : 0,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível abrir o chat.';
        console.error('[PagWeb] Erro ao iniciar chat:', err);
        addToast('error', 'Chat', message);
        urlOpenGuardRef.current = null;
      } finally {
        setSearchParams({});
      }
    };

    void handleUrlParams();
  }, [searchParams, fetchChats, selectChat, sendText, addToast, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessageText.trim()) return;
    const text = newMessageText;
    setNewMessageText('');
    const ok = await sendText(text);
    if (!ok) {
      addToast('error', 'Chat', 'Não foi possível enviar a mensagem.');
      setNewMessageText(text);
    }
  };

  return (
    <UserLayout>
      <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div
          className={`${
            selectedChat ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 border-r border-gray-200 flex-col bg-gray-50`}
        >
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="font-bold text-gray-900 text-lg">Conversas</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-gray-300" />
                Nenhuma conversa iniciada. Explore as empresas para tirar dúvidas!
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
                  <div className="w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    <Store className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900 text-sm truncate">{c.nomeEmpresa}</span>
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
          } flex-1 flex-col bg-white h-full`}
        >
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold shrink-0">
                  <Store className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{selectedChat.nomeEmpresa}</h3>
                  <span className="text-[11px] text-green-500 font-medium">Suporte Online</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((m) => {
                  const isMe = m.tipoRemetente === 'Cliente';
                  return (
                    <div key={m.idMensagem} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-xs ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        {m.metadata?.nomePlano && (
                          <div className="mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-gray-900 flex items-start gap-2">
                            <Tag className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-bold text-xs text-indigo-900">Intenção de Assinatura</div>
                              <div className="text-xs font-semibold">{m.metadata.nomePlano}</div>
                              <div className="text-[10px] text-gray-600">
                                R$ {m.metadata.valorMensalidade?.toFixed(2).replace('.', ',')} / mês
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                        <span className="text-[9px] text-gray-400 block text-right mt-1">
                          {new Date(m.dataEnvio).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-gray-900 bg-white"
                />
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 shrink-0 rounded-xl p-2.5">
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 bg-gray-50/20">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm">Selecione uma conversa para começar a conversar.</p>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};
