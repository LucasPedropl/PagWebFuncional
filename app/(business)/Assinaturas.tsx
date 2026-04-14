
import React, { useState, useEffect, useRef } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter, Calendar, Loader2, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, AlertTriangle, UserPlus, ChevronsUpDown, Check, Send, Mail, Repeat } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { PlanResponse, SubscriptionResponse, User } from '../../types';
import { useToast } from '../../context/ToastContext';

export const Assinaturas: React.FC = () => {
  const { addToast } = useToast();
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Connect Client Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [emailToConnect, setEmailToConnect] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Search/Filter Main Table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  
  // Data State
  const [subscriptions, setSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit/Delete State
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionResponse | null>(null);
  const [subToDelete, setSubToDelete] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState('Ativo');

  // Form State
  const [formData, setFormData] = useState({
    idUser: '',
    idPlano: '',
    periodo: '12',
    dataInicio: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    dataFim: '',
    desconto: '0',
    observacao: ''
  });

  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);

  // Client Combobox State
  const [clientSearch, setClientSearch] = useState('');
  const [isClientListOpen, setIsClientListOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Ref para o input de data
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Aviso de Data (Warning visual)
  const [dateWarning, setDateWarning] = useState<{ type: 'info' | 'warning' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClientListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Lógica para Recorrência: Se for recorrente, período deve ser 0
  useEffect(() => {
      if (isRecurring) {
          setFormData(prev => ({ ...prev, periodo: '0', dataFim: '' }));
      } else {
          // Se desmarcar e estiver 0, volta para o padrão 12
          if (formData.periodo === '0') {
              setFormData(prev => ({ ...prev, periodo: '12' }));
          }
      }
  }, [isRecurring]);

  // Calcula data fim e valida data inicio
  useEffect(() => {
    // Se não tiver data ou ela for inválida (ex: usuario limpou o campo)
    if (!formData.dataInicio) {
        setFormData(prev => ({ ...prev, dataFim: '' }));
        setDateWarning(null);
        return;
    }

    // 1. Parsing Seguro da Data (YYYY-MM-DD para Data Local)
    const [year, month, day] = formData.dataInicio.split('-').map(Number);
    const checkDate = new Date(year, month - 1, day);

    // Validação de Data Inválida (ex: 30 de Fevereiro)
    if (isNaN(checkDate.getTime()) || checkDate.getMonth() !== month - 1) {
        setDateWarning({ type: 'warning', message: 'Data inválida.' });
        setFormData(prev => ({ ...prev, dataFim: '' }));
        return;
    }

    // 2. Comparações
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar hora para comparar apenas dias

    const diffTime = checkDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Lógica de Aviso
    if (diffDays < 0) {
        setDateWarning({ 
            type: 'error', 
            message: 'A data inicial não pode ser anterior a hoje.' 
        });
    } else if (diffDays > 31) {
        setDateWarning({ 
            type: 'warning', 
            message: 'Atenção: A data selecionada é superior a 31 dias.' 
        });
    } else {
        setDateWarning(null);
    }

    // 3. Calcular Data Fim (Baseado na Data Inicio Validada e Periodo)
    // Se for recorrente (periodo 0), não calcula data fim visualmente (backend trata)
    if (isRecurring || formData.periodo === '0') {
        setFormData(prev => ({ ...prev, dataFim: '' }));
        return;
    }

    const months = parseInt(formData.periodo);
    if (!isNaN(months) && months > 0) {
        const end = new Date(checkDate); // Clone da data inicio validada
        end.setMonth(end.getMonth() + months);
        
        // Verifica se a data final é válida
        if (!isNaN(end.getTime())) {
            setFormData(prev => ({ ...prev, dataFim: end.toISOString().split('T')[0] }));
        }
    }
  }, [formData.dataInicio, formData.periodo, isRecurring]);

  const fetchData = async () => {
    try {
        setIsLoading(true);
        // Promise.all para carregar tudo junto
        const [subsData, clientsData, plansData] = await Promise.all([
            businessService.listSubscriptions(),
            businessService.listClients(),
            businessService.listPlans()
        ]);
        
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
        console.error("Erro ao carregar dados", error);
        addToast('error', 'Erro ao carregar dados', 'Não foi possível buscar as informações do servidor.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LOGICA DE CLIENTE ---

  const filteredClientsForDropdown = clients.filter(c => 
     c.nome.toLowerCase().includes(clientSearch.toLowerCase()) || 
     c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSelectClient = (client: User) => {
      setFormData(prev => ({ ...prev, idUser: String(client.idUser) }));
      setClientSearch(client.nome);
      setIsClientListOpen(false);
  };

  const handleOpenConnectModal = () => {
      setIsClientListOpen(false); // Fecha o dropdown
      setIsConnectModalOpen(true); // Abre o modal de convite
  };

  const handleConnectClient = async () => {
      if (!emailToConnect) return;
      try {
        setIsConnecting(true);
        await businessService.connectClient(emailToConnect);
        
        addToast('success', 'Convite Enviado', `Cliente convidado com sucesso.`);
        
        // Atualiza a lista de clientes para que o novo apareça
        const newClients = await businessService.listClients();
        setClients(newClients);
        
        // Limpa e fecha
        setEmailToConnect('');
        setIsConnectModalOpen(false);

      } catch (error: any) {
        const msg = error.message || "Erro desconhecido";
        // Tratamento se a API retornar sucesso no texto do erro (acontece as vezes)
        if (msg.includes("sucesso") || msg.includes("convidado")) {
             addToast('success', 'Convite Enviado', `Cliente convidado com sucesso.`);
             const newClients = await businessService.listClients();
             setClients(newClients);
             setEmailToConnect('');
             setIsConnectModalOpen(false);
        } else {
             addToast('error', 'Erro ao conectar', msg);
        }
      } finally {
        setIsConnecting(false);
      }
  };

  // --- FIM LOGICA DE CLIENTE ---

  const handleSave = async () => {
    if (!formData.idUser || !formData.idPlano) {
        addToast('error', 'Campos Obrigatórios', 'Selecione um cliente e um plano.');
        return;
    }

    if (!formData.dataInicio) {
        addToast('error', 'Data Obrigatória', 'Informe a data do primeiro pagamento.');
        return;
    }

    // Validação Estrita de Data Passada
    const [y, m, d] = formData.dataInicio.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (selectedDate < today) {
         addToast('error', 'Data Inválida', 'A data inicial não pode ser anterior à data de hoje.');
         return;
    }

    try {
        setIsSaving(true);
        
        // Para envio, convertemos para ISO
        // Re-parsing manual para garantir
        const [year, month, day] = formData.dataInicio.split('-').map(Number);
        const startDateObj = new Date(year, month - 1, day);
        const startIso = startDateObj.toISOString();

        // Data fim
        let endIso = startIso;
        
        if (formData.dataFim && !isRecurring && formData.periodo !== '0') {
             const [endYear, endMonth, endDay] = formData.dataFim.split('-').map(Number);
             endIso = new Date(endYear, endMonth - 1, endDay).toISOString();
        } else if (isRecurring || formData.periodo === '0') {
             // CORREÇÃO: Para assinaturas recorrentes, o backend exige DataFim > DataInicio.
             // Definimos uma data distante (100 anos) para representar "indeterminado".
             const futureDate = new Date(startDateObj);
             futureDate.setFullYear(futureDate.getFullYear() + 100);
             endIso = futureDate.toISOString();
        } else {
             // Fallback caso não seja recorrente e não tenha data fim (segurança)
             const nextDay = new Date(startDateObj);
             nextDay.setDate(nextDay.getDate() + 1);
             endIso = nextDay.toISOString();
        }

        await businessService.createSubscription({
            idUser: parseInt(formData.idUser),
            idPlano: parseInt(formData.idPlano),
            periodo: parseInt(formData.periodo),
            dataInicio: startIso,
            dataFim: endIso,
            desconto: parseFloat(formData.desconto || '0'),
            observacao: formData.observacao + (isRecurring ? ' [Recorrente]' : '')
        });

        addToast('success', 'Sucesso!', 'Assinatura criada com sucesso.');

        // 1. Fecha o modal imediatamente após o sucesso
        setIsModalOpen(false);

        // 2. Limpa o form e o warning
        setFormData({
            idUser: '',
            idPlano: '',
            periodo: '12',
            dataInicio: new Date().toISOString().split('T')[0],
            dataFim: '',
            desconto: '0',
            observacao: ''
        });
        setIsRecurring(false);
        setClientSearch(''); // Limpa busca de cliente
        setDateWarning(null); // Garante que o warning suma

        // 3. Atualiza a lista em background
        await fetchData(); 

    } catch (error: any) {
        addToast('error', 'Erro ao criar', error.message || "Verifique os dados e tente novamente.");
    } finally {
        setIsSaving(false);
    }
  };

  const openDeleteModal = (id: number) => {
    setSubToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!subToDelete) return;
    try {
        setIsSaving(true);
        await businessService.deleteSubscription(subToDelete);
        addToast('success', 'Removido', 'Assinatura excluída com sucesso.');
        await fetchData();
        setIsDeleteModalOpen(false);
        setSubToDelete(null);
    } catch (error: any) {
        addToast('error', 'Erro ao excluir', error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const openStatusModal = (sub: SubscriptionResponse) => {
    setSelectedSubscription(sub);
    setNewStatus(sub.status || 'Ativo');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedSubscription) return;
    try {
        setIsSaving(true);
        await businessService.updateSubscription(selectedSubscription.idAssinatura, newStatus);
        addToast('success', 'Atualizado', `Status alterado para ${newStatus}.`);
        await fetchData();
        setIsStatusModalOpen(false);
        setSelectedSubscription(null);
    } catch (error: any) {
        addToast('error', 'Erro ao atualizar', error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('pt-BR');
    } catch (e) {
      return isoString;
    }
  };

  // Filtragem local
  const filteredSubs = subscriptions.filter(sub => {
    const searchLower = searchTerm.toLowerCase();
    const clienteName = sub.nomeCliente || '';
    const planoName = sub.nomePlano || '';
    const matchesSearch = clienteName.toLowerCase().includes(searchLower) || planoName.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'Todos' || sub.status === statusFilter;

    let matchesDate = true;
    if (dateStart || dateEnd) {
        const vDate = new Date(sub.dataInicial);
        if (dateStart) {
            const sDate = new Date(dateStart);
            if (vDate < sDate) matchesDate = false;
        }
        if (dateEnd) {
            const eDate = new Date(dateEnd);
            eDate.setHours(23, 59, 59, 999);
            if (vDate > eDate) matchesDate = false;
        }
    }

    let matchesValue = true;
    if (minVal) {
        if (sub.valorComDesconto < Number(minVal)) matchesValue = false;
    }
    if (maxVal) {
        if (sub.valorComDesconto > Number(maxVal)) matchesValue = false;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesValue;
  });

  return (
    <BusinessLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
          <p className="text-gray-500 mt-1">Gerencie os planos ativos dos seus clientes.</p>
        </div>
        <Button 
          onClick={() => {
              setIsRecurring(false);
              setIsModalOpen(true);
          }}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Assinatura
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente ou plano..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-gray-900 bg-white"
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700"
                >
                  <option value="Todos">Todos os status</option>
                  <option value="Ativa">Ativa</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Data Inicial</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="date" 
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                </div>
              </div>

              {/* Value Range */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor Mensal (R$)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minVal}
                    onChange={(e) => setMinVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxVal}
                    onChange={(e) => setMaxVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={() => {
                   setStatusFilter('Todos');
                   setDateStart('');
                   setDateEnd('');
                   setMinVal('');
                   setMaxVal('');
                 }} 
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
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Período</th>
                <th className="px-6 py-4">Valor Mensal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex justify-center items-center">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Carregando dados...
                        </div>
                    </td>
                  </tr>
              ) : filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma assinatura encontrada.</td>
                  </tr>
              ) : (
                filteredSubs.map((sub) => {
                    return (
                        <tr key={sub.idAssinatura || Math.random()} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    {sub.nomeCliente || 'Cliente Desconhecido'}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                    {sub.nomePlano || 'Plano Personalizado'}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    {sub.periodo === 0 ? 'Recorrente' : `${sub.periodo} meses`}
                                </div>
                                <span className="text-[11px] text-gray-400 mt-0.5">
                                    {formatDateBR(sub.dataInicial)} → {sub.periodo === 0 ? 'Indefinido' : formatDateBR(sub.dataFinal)}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">
                                    R$ {sub.valorComDesconto ? sub.valorComDesconto.toFixed(2).replace('.', ',') : '0,00'}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sub.status === 'Ativo' 
                                ? 'bg-green-100 text-green-800' 
                                : sub.status === 'Cancelado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    sub.status === 'Ativo' ? 'bg-green-600' : 
                                    sub.status === 'Cancelado' ? 'bg-red-600' : 'bg-gray-600'
                                }`}></span>
                                {sub.status || 'Ativo'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => openStatusModal(sub)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Alterar Status"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => openDeleteModal(sub.idAssinatura)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Excluir Assinatura"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                        </tr>
                    )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Assinatura */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Assinatura"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                className="bg-slate-900 hover:bg-slate-800" 
                onClick={handleSave}
                isLoading={isSaving}
            >
                Criar Assinatura
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Cliente e Plano */}
          <div className="grid grid-cols-2 gap-4">
            {/* Custom Client Combobox */}
            <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                <label className="text-sm font-medium text-gray-700">Selecionar Cliente</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 pr-8"
                        value={clientSearch}
                        onFocus={() => setIsClientListOpen(true)}
                        onChange={(e) => {
                            setClientSearch(e.target.value);
                            setIsClientListOpen(true);
                            // Se o usuário digitar, limpamos o ID selecionado para forçar nova seleção
                            if (formData.idUser) {
                                setFormData(prev => ({ ...prev, idUser: '' }));
                            }
                        }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ChevronsUpDown className="w-4 h-4" />
                    </div>
                </div>

                {isClientListOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Opção Rápida: Convidar */}
                        <div 
                            className="px-3 py-3 border-b border-gray-100 hover:bg-indigo-50 cursor-pointer flex items-center text-indigo-700 font-medium transition-colors"
                            onClick={handleOpenConnectModal}
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                <UserPlus className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-sm">Convidar novo cliente</span>
                                <span className="block text-xs text-indigo-500 font-normal">Enviar convite por e-mail</span>
                            </div>
                        </div>

                        {filteredClientsForDropdown.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                                Nenhum cliente encontrado.
                            </div>
                        ) : (
                            filteredClientsForDropdown.map(client => (
                                <div 
                                    key={client.idUser}
                                    className={`px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                                        String(formData.idUser) === String(client.idUser) ? 'bg-gray-50' : ''
                                    }`}
                                    onClick={() => handleSelectClient(client)}
                                >
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{client.nome} {client.sobreNome}</div>
                                        <div className="text-xs text-gray-500">{client.email}</div>
                                    </div>
                                    {String(formData.idUser) === String(client.idUser) && (
                                        <Check className="w-4 h-4 text-indigo-600" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Selecionar Plano</label>
                <select 
                    name="idPlano" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    value={formData.idPlano}
                    onChange={handleInputChange}
                >
                    <option value="">Selecione...</option>
                    {plans.map(p => (
                        <option key={p.idPlano} value={p.idPlano}>{p.nome} - R$ {p.valorMensalidade}</option>
                    ))}
                </select>
            </div>
          </div>

          {/* Período e Recorrência */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <Input 
                label="Período (Meses)"
                name="periodo"
                type="number"
                value={isRecurring ? "0" : formData.periodo}
                onChange={handleInputChange}
                disabled={isRecurring}
                className={isRecurring ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
            />
            <div className="flex items-center h-[42px] pt-6">
                 <label className="flex items-center cursor-pointer space-x-2 select-none">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    <div className="flex items-center text-sm text-gray-700 font-medium">
                        <Repeat className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        Assinatura Recorrente
                    </div>
                 </label>
            </div>
          </div>

          {/* Datas e Desconto (Combinados) */}
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-gray-700">Primeiro Pagamento</label>
                <div className="relative">
                    <input
                        ref={dateInputRef}
                        type="date"
                        name="dataInicio"
                        value={formData.dataInicio}
                        min={new Date().toISOString().split('T')[0]} // Impede seleção anterior a hoje
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 ${
                            dateWarning?.type === 'error' ? 'border-red-500 focus:ring-red-200' : 
                            dateWarning?.type === 'warning' ? 'border-amber-500 focus:ring-amber-200' : 'border-gray-300'
                        }`}
                    />
                    <Calendar 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                        onClick={() => dateInputRef.current?.showPicker()}
                    />
                </div>
                {/* Date Warnings */}
                {dateWarning && (
                    <div className={`text-xs p-2 rounded flex items-start gap-1.5 ${
                        dateWarning.type === 'error' ? 'bg-red-50 text-red-700' : 
                        dateWarning.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{dateWarning.message}</span>
                    </div>
                )}
             </div>

             <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Desconto (%)</label>
                <div className="relative">
                    <input
                        type="number"
                        name="desconto"
                        value={formData.desconto}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
            </div>
          </div>

          {/* Observação */}
          <div className="flex flex-col gap-1.5">
             <label className="text-sm font-medium text-gray-700">Observação</label>
             <textarea 
                name="observacao"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400 resize-none"
                placeholder="Detalhes adicionais sobre a assinatura..."
                value={formData.observacao}
                onChange={handleInputChange}
             />
          </div>

        </div>
      </Modal>

      {/* Modal Conectar Cliente (Rápido) */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Convidar Cliente"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsConnectModalOpen(false)} disabled={isConnecting}>Cancelar</Button>
            <Button onClick={handleConnectClient} isLoading={isConnecting} className="bg-slate-900 hover:bg-slate-800">
                <Send className="w-4 h-4 mr-2" />
                Enviar Convite
            </Button>
          </>
        }
      >
        <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg flex items-start gap-3">
                <div className="mt-0.5"><UserPlus className="w-5 h-5 text-indigo-600" /></div>
                <div className="text-sm text-indigo-900">
                    <p className="font-medium mb-1">Novo vínculo rápido</p>
                    <p>O cliente receberá um e-mail para se conectar à sua empresa. Após o aceite, você poderá criar assinaturas para ele.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">E-mail do Cliente</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input 
                        type="email"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="cliente@exemplo.com"
                        value={emailToConnect}
                        onChange={(e) => setEmailToConnect(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
        </div>
      </Modal>

      {/* Modal Alterar Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Alterar Status da Assinatura"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                onClick={handleUpdateStatus}
                isLoading={isSaving}
                className="bg-slate-900 hover:bg-slate-800"
            >
                Salvar Status
            </Button>
          </>
        }
      >
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                <p>Alterando status para o cliente: <strong>{selectedSubscription?.nomeCliente}</strong></p>
                <p>Plano atual: <strong>{selectedSubscription?.nomePlano}</strong></p>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Novo Status</label>
                <div className="grid grid-cols-2 gap-3">
                    {['Ativo', 'Cancelado', 'Pendente', 'Suspenso'].map(status => (
                        <button
                            key={status}
                            onClick={() => setNewStatus(status)}
                            className={`flex items-center justify-center p-3 rounded-lg border transition-all ${
                                newStatus === status
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                        >
                            {status === 'Ativo' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                            {status === 'Cancelado' && <XCircle className="w-4 h-4 mr-2" />}
                            {status === 'Pendente' && <AlertCircle className="w-4 h-4 mr-2" />}
                            {status === 'Suspenso' && <AlertCircle className="w-4 h-4 mr-2" />}
                            {status}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Assinatura"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                onClick={confirmDelete} 
                isLoading={isSaving} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Exclusão
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
                Esta ação removerá permanentemente a assinatura. O histórico de pagamentos pode ser mantido, mas o vínculo do plano será encerrado.
            </p>
         </div>
      </Modal>

    </BusinessLayout>
  );
};
