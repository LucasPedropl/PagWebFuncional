import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Loader2, Send, CheckCircle2, Mail, Unplug, AlertTriangle, User as UserIcon, Calendar, CreditCard, MessageSquare, FlaskConical, LogIn } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { User, SubscriptionResponse } from '../../types';
import { useToast } from '../../context/ToastContext';
import { SearchSelect } from '../../components/ui/SearchSelect';

import React, { useState, useEffect } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formSearchInputClass } from '../../components/ui/formStyles';
import { SeedTestClientsModal } from '../../features/test-clients/components/SeedTestClientsModal';
import { isTestClientEmail } from '../../features/test-clients/utils/testClientGenerators';
import { openTestClientDashboardInNewTab } from '../../features/test-clients/utils/openTestClientDashboard';
import { formatPersonFullName } from '../../utils/personDisplayName';

export const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeedTestModalOpen, setIsSeedTestModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Data States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [clientes, setClientes] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Selected Data
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [clientSubscriptions, setClientSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [clientToDelete, setClientToDelete] = useState<{id: number, nome: string} | null>(null);

  // Form State
  const [emailToConnect, setEmailToConnect] = useState('');
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  

  useEffect(() => {
    fetchClients();
  }, []);

  // Reset modal state when closed
  useEffect(() => {
    if (!isModalOpen) {
        setEmailToConnect('');
        setSuccessEmail(null);
    }
  }, [isModalOpen]);

  const handleOpenChat = (client: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/business/chat?clientId=${client.idUser}&clientName=${encodeURIComponent(formatPersonFullName(client.nome, client.sobreNome))}`);
  };

  const handleQuickTestLogin = (client: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      openTestClientDashboardInNewTab(client.email);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível abrir o dashboard do cliente.';
      addToast('error', 'Login rápido', message);
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await businessService.listClients();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao listar clientes", error);
      addToast('error', 'Erro', 'Não foi possível listar os clientes.');
      setClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!emailToConnect) return;
    try {
      setIsSaving(true);
      await businessService.connectClient(emailToConnect);
      await fetchClients();
      setSuccessEmail(emailToConnect);
      addToast('success', 'Convite Enviado', `Solicitação enviada para ${emailToConnect}`);
    } catch (error: any) {
      const msg = error.message || "Erro desconhecido";
      if (msg.includes("sucesso") || msg.includes("convidado")) {
           setSuccessEmail(emailToConnect);
           addToast('success', 'Convite Enviado', `Solicitação enviada para ${emailToConnect}`);
      } else {
           addToast('error', 'Erro ao conectar', msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (id: number, nome: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Previne abrir o modal de detalhes
      setClientToDelete({ id, nome });
      setIsDeleteModalOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!clientToDelete) return;

    try {
        setIsSaving(true);
        await businessService.disconnectClient(clientToDelete.id);
        addToast('success', 'Desvinculado', `${clientToDelete.nome} foi desvinculado com sucesso.`);
        await fetchClients();
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
        setIsDetailsModalOpen(false); // Fecha detalhes se estiver aberto
    } catch (error: any) {
        addToast('error', 'Erro ao desvincular', error.message || "Erro desconhecido.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleClientClick = async (client: User) => {
      setSelectedClient(client);
      setIsDetailsModalOpen(true);
      setClientSubscriptions([]);
      setIsLoadingDetails(true);

      // Gambiarra: Fetch all subs and filter
      if (client.idUser) {
          try {
              const allSubs = await businessService.listSubscriptions();
              
              const userSubs = allSubs.filter(s => {
                  // Verifica diversas possibilidades de nome de propriedade para o ID
                  const subUserId = s.idUser || s.user?.idUser || (s as any).userId || (s as any).UserId;
                  // Compara como string para evitar problemas de tipo (number vs string)
                  return String(subUserId) === String(client.idUser);
              });
              
              setClientSubscriptions(userSubs);
          } catch (error) {
              console.error(error);
              addToast('error', 'Erro', 'Falha ao carregar assinaturas do cliente.');
          }
      }
      setIsLoadingDetails(false);
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return '-';
    try { return new Date(isoString).toLocaleDateString('pt-BR'); } catch { return isoString; }
  };

  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const filteredClients = safeClientes.filter(c => {
    const matchesSearch = (c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <BusinessLayout>
      <div className="flex justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
          <p className="text-gray-500 mt-1">Clientes vinculados ao seu estabelecimento.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSeedTestModalOpen(true)}
            className="border-slate-300"
          >
            <FlaskConical className="w-4 h-4 mr-2" />
            Criar clientes de teste
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Conectar Cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className={formSearchInputClass}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-2 ${showFilters ? 'bg-slate-50 border-slate-300' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <SearchSelect
                  options={[
                    { value: 'Todos', label: 'Todos os status' },
                    { value: 'Ativo', label: 'Ativo' },
                    { value: 'Inativo', label: 'Inativo' },
                    { value: 'Pendente', label: 'Pendente' },
                  ]}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val.toString())}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={() => setStatusFilter('Todos')} 
                 className="text-gray-600"
               >
                 Limpar Filtros
               </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Nome Completo</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex justify-center items-center">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Carregando clientes...
                        </div>
                    </td>
                 </tr>
              ) : filteredClients.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                 </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client.idUser} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleClientClick(client)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 group-hover:text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{client.nome} {client.sobreNome || ''}</span>
                          {isTestClientEmail(client.email) && (
                            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                              Teste
                            </span>
                          )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {client.email}
                    </td>
                    <td className="px-6 py-4">
                      {client.status === 'Pendente' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-500 animate-pulse"></span>
                          Pendente
                        </span>
                      ) : client.status === 'Inativo' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-gray-500"></span>
                          Inativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-600"></span>
                          Ativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isTestClientEmail(client.email) && (
                          <button
                              onClick={(e) => handleQuickTestLogin(client, e)}
                              className="p-1.5 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded transition-colors"
                              title="Login rápido (nova aba)"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                        )}
                        {client.status === 'Ativo' && (
                          <button 
                              onClick={(e) => handleOpenChat(client, e)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Conversar no Chat"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                            onClick={(e) => client.idUser && openDeleteModal(client.idUser, client.nome, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Desvincular Cliente"
                        >
                          <Unplug className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes do Cliente */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes do Cliente"
        size="lg"
        footer={
           <div className="flex justify-between w-full">
               <Button 
                    variant="outline" 
                    className="text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200"
                    onClick={(e) => selectedClient?.idUser && openDeleteModal(selectedClient.idUser, selectedClient.nome, e)}
                 >
                    <Unplug className="w-4 h-4 mr-2" />
                    Desvincular
                 </Button>
               <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Fechar</Button>
           </div>
        }
      >
        <div className="space-y-6">
            {/* Header com Dados */}
            <div className="flex flex-col md:flex-row gap-6 items-start border-b border-gray-100 pb-6">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-8 h-8 text-slate-500" />
                 </div>
                 <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedClient?.nome} {selectedClient?.sobreNome}</h2>
                        <p className="text-gray-500 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> {selectedClient?.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedClient && isTestClientEmail(selectedClient.email) && (
                          <Button
                            variant="outline"
                            className="border-violet-200 text-violet-700 hover:bg-violet-50 flex items-center gap-1.5 text-xs py-1 h-8 shrink-0"
                            onClick={() => handleQuickTestLogin(selectedClient)}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            Login rápido
                          </Button>
                        )}
                        {selectedClient?.status === 'Ativo' && (
                          <Button
                            variant="outline"
                            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 text-xs py-1 h-8 shrink-0"
                            onClick={() => selectedClient && handleOpenChat(selectedClient)}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Conversar
                          </Button>
                        )}
                        {selectedClient?.status === 'Pendente' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-2 h-2 rounded-full mr-2 bg-amber-500 animate-pulse"></span>
                            Pendente de Aceite
                          </span>
                        ) : selectedClient?.status === 'Inativo' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                            <span className="w-2 h-2 rounded-full mr-2 bg-gray-500"></span>
                            Conta Inativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            <span className="w-2 h-2 rounded-full mr-2 bg-green-600"></span>
                            Cliente Ativo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 block">CPF</span>
                            <span className="font-medium text-gray-900">{selectedClient?.cpf || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">ID do Usuário</span>
                            <span className="font-medium text-gray-900">#{selectedClient?.idUser}</span>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Lista de Assinaturas */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Assinaturas Ativas
                </h3>
                
                {isLoadingDetails ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                    </div>
                ) : clientSubscriptions.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                        Este cliente não possui assinaturas ativas com sua empresa.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {clientSubscriptions.map((sub) => (
                            <div key={sub.idAssinatura} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-900">{sub.nomePlano || "Plano Personalizado"}</h4>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center">
                                            <Calendar className="w-3.5 h-3.5 mr-1" />
                                            {formatDateBR(sub.dataInicial)} - {formatDateBR(sub.dataFinal)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-center">
                                    <span className="text-lg font-bold text-slate-900">
                                        R$ {sub.valorComDesconto ? sub.valorComDesconto.toFixed(2).replace('.', ',') : '0,00'}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        sub.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {sub.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </Modal>

      {/* Modal Conectar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={successEmail ? "Convite Enviado" : "Conectar Novo Cliente"}
        size="md"
        onSubmit={!successEmail ? (e) => { e.preventDefault(); handleConnect(); } : undefined}
        footer={
          !successEmail ? (
            <>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" isLoading={isSaving} className="bg-slate-900 hover:bg-slate-800">
                <Send className="w-4 h-4 mr-2" />
                Enviar Convite
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800">
              Entendido
            </Button>
          )
        }
      >
        {successEmail ? (
          <div className="text-center py-4 animate-fadeIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Solicitação enviada!</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Um convite foi enviado para <strong className="text-gray-900">{successEmail}</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-left border border-gray-100">
                <p className="text-gray-600 flex gap-2">
                    <Mail className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                    <span>
                        Se o cliente já possuir conta, ele receberá uma notificação para aceitar.
                        Caso contrário, ele será instruído a criar uma conta gratuita para se conectar à sua empresa.
                    </span>
                </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
              <div className="text-sm text-gray-500">
                  Informe o e-mail do seu cliente para iniciar o vínculo.
              </div>
              <Input 
                  label="E-mail do Cliente" 
                  placeholder="cliente@exemplo.com" 
                  type="email"
                  value={emailToConnect}
                  onChange={(e) => setEmailToConnect(e.target.value)}
                  autoFocus
              />
          </div>
        )}
      </Modal>

      <SeedTestClientsModal
        isOpen={isSeedTestModalOpen}
        onClose={() => setIsSeedTestModalOpen(false)}
        onCreated={fetchClients}
      />

      {/* Modal Confirmar Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Desvincular Cliente"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                onClick={confirmDisconnect} 
                isLoading={isSaving} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Desvinculação
            </Button>
          </>
        }
      >
         <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tem certeza?</h3>
            <p className="text-sm text-gray-500">
                Você está prestes a desvincular <strong>{clientToDelete?.nome}</strong>. 
                O cliente perderá acesso aos planos e benefícios da sua empresa.
            </p>
         </div>
      </Modal>
    </BusinessLayout>
  );
};