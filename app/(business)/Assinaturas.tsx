
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter, Calendar, Loader2, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, AlertTriangle, UserPlus, ChevronsUpDown, Check, Send, Mail, Repeat, FileText, Download, MessageSquare } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { PlanResponse, SubscriptionResponse, User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { InfoTooltip } from '../../components/ui/InfoTooltip';
import { SearchSelect } from '../../components/ui/SearchSelect';
import {
  formFilterInputClass,
  formFilterInputWithIconClass,
  formLabelClass,
  formSearchInputClass,
  formSelectClass,
  formTextareaClass,
  FORM_RADIUS,
} from '../../components/ui/formStyles';
import { TIPO_CONTRATO, TIPO_DESCONTO, getContractUrl } from '../../utils/api';
import { normalizePaymentDay } from '../../utils/formatters';

export const Assinaturas: React.FC = () => {
  const navigate = useNavigate();
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
    diaPagamento: Math.min(new Date().getDate(), 30).toString(),
    desconto: '0',
    tipoDesconto: String(TIPO_DESCONTO.Percentual),
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

  // Plan Combobox State
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [planSearch, setPlanSearch] = useState('');
  const [isPlanListOpen, setIsPlanListOpen] = useState(false);
  const planDropdownRef = useRef<HTMLDivElement>(null);

  // New Plan Modal State
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [currentPlanStep, setCurrentPlanStep] = useState(0);
  const [newPlanFormData, setNewPlanFormData] = useState({
      nome: '',
      valorMensalidade: '',
      percentualMulta: '0',
      percentualJurosMensal: '0',
      funcionalidades: '',
      contrato: null as File | null,
      tipoContrato: String(TIPO_CONTRATO.Nenhum),
      cancelamentoDias: '7',
      assinarPorCliente: true,
  });

  const resetNewPlanForm = () => {
    setNewPlanFormData({ nome: '', valorMensalidade: '', percentualMulta: '0', percentualJurosMensal: '0', funcionalidades: '', contrato: null, tipoContrato: String(TIPO_CONTRATO.Nenhum), cancelamentoDias: '7', assinarPorCliente: true });
    setCurrentPlanStep(0);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Click outside handler for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClientListOpen(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target as Node)) {
        setIsPlanListOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, planDropdownRef]);

  // Lógica para Recorrência: Se for recorrente, período deve ser 0
  useEffect(() => {
      if (isRecurring) {
          setFormData(prev => ({ ...prev, periodo: '0' }));
      } else {
          if (formData.periodo === '0') {
              setFormData(prev => ({ ...prev, periodo: '12' }));
          }
      }
  }, [isRecurring]);

  // Limpa os estados do formulário de criação ao fechar o modal
  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        idUser: '',
        idPlano: '',
        periodo: '12',
        diaPagamento: Math.min(new Date().getDate(), 30).toString(),
        desconto: '0',
        tipoDesconto: String(TIPO_DESCONTO.Percentual),
        observacao: ''
      });
      setIsRecurring(false);
      setClientSearch('');
      setPlanSearch('');
      setIsClientListOpen(false);
      setIsPlanListOpen(false);
    }
  }, [isModalOpen]);

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

  const selectedClient = clients.find(c => String(c.idUser) === String(formData.idUser));
  const isExactClientMatch = selectedClient && (clientSearch === selectedClient.nome || clientSearch === `${selectedClient.nome} ${selectedClient.sobreNome}`);

  const filteredClientsForDropdown = clients.filter(c => 
     isExactClientMatch ? true : (
       c.nome.toLowerCase().includes(clientSearch.toLowerCase()) || 
       c.email.toLowerCase().includes(clientSearch.toLowerCase())
     )
  );

  const selectedPlanObj = plans.find(p => String(p.idPlano) === String(formData.idPlano));
  const isExactPlanMatch = selectedPlanObj && planSearch === selectedPlanObj.nome;

  const filteredPlansForDropdown = plans.filter(p => 
     isExactPlanMatch ? true : p.nome.toLowerCase().includes(planSearch.toLowerCase())
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

  const handleSelectPlan = (plan: PlanResponse) => {
      setFormData(prev => ({ ...prev, idPlano: String(plan.idPlano) }));
      setPlanSearch(plan.nome);
      setIsPlanListOpen(false);
  };

  const handleCreatePlan = async () => {
    try {
        setIsSaving(true);
        const funcionalidadesArray = newPlanFormData.funcionalidades
            .split('\n')
            .map(f => f.trim())
            .filter(f => f !== '');
        
        await businessService.createPlan({
            nome: newPlanFormData.nome,
            valorMensalidade: Number(newPlanFormData.valorMensalidade),
            percentualMulta: Number(newPlanFormData.percentualMulta),
            percentualJurosMensal: Number(newPlanFormData.percentualJurosMensal),
            funcionalidades: funcionalidadesArray,
            arquivoContrato: newPlanFormData.contrato,
            tipoContrato: Number(newPlanFormData.tipoContrato),
            cancelamentoDias: Number(newPlanFormData.cancelamentoDias || '0'),
            assinarPorCliente: newPlanFormData.assinarPorCliente,
        });
        
        addToast('success', 'Plano Criado', 'Novo plano adicionado.');
        const newPlans = await businessService.listPlans();
        setPlans(newPlans);
        setIsNewPlanModalOpen(false);
        resetNewPlanForm();
    } catch (e: any) {
        addToast('error', 'Erro', e.message || 'Erro ao criar plano');
    } finally {
        setIsSaving(false);
    }
  };

  const handleNewPlanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setNewPlanFormData(prev => ({ ...prev, contrato: e.target.files![0] }));
      }
  };

  // --- FIM LOGICA DE CLIENTE ---

  const handleSave = async () => {
    if (!formData.idUser || !formData.idPlano) {
        addToast('error', 'Campos Obrigatórios', 'Selecione um cliente e um plano.');
        return;
    }

    const diaPagamento = normalizePaymentDay(formData.diaPagamento);
    if (!Number.isFinite(parseInt(formData.diaPagamento, 10))) {
        addToast('error', 'Dia inválido', 'Selecione o dia do fechamento entre 1 e 30.');
        return;
    }

    try {
        setIsSaving(true);
        
        await businessService.createSubscription({
            idUser: parseInt(formData.idUser, 10),
            idPlano: parseInt(formData.idPlano, 10),
            periodo: parseInt(formData.periodo, 10),
            diaPagamento,
            desconto: parseFloat(formData.desconto || '0'),
            tipoDesconto: Number(formData.tipoDesconto),
            observacao: formData.observacao + (isRecurring ? ' [Recorrente]' : '')
        });

        addToast('success', 'Sucesso!', 'Assinatura criada com sucesso.');

        setIsModalOpen(false);

        setFormData({
            idUser: '',
            idPlano: '',
            periodo: '12',
            diaPagamento: Math.min(new Date().getDate(), 30).toString(),
            desconto: '0',
            tipoDesconto: String(TIPO_DESCONTO.Percentual),
            observacao: ''
        });
        setIsRecurring(false);
        setClientSearch(''); 
        setPlanSearch('');

        await fetchData(); 

    } catch (error: any) {
        addToast('error', 'Erro ao criar', error.message || "Verifique os dados e tente novamente.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleOpenChat = (sub: SubscriptionResponse) => {
    const clientId = sub.idUser || sub.user?.idUser;
    if (!clientId) {
      addToast('error', 'Erro', 'Não foi possível encontrar o identificador do cliente para abrir o chat.');
      return;
    }
    navigate(`/business/chat?clientId=${clientId}&clientName=${encodeURIComponent(sub.nomeCliente)}`);
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

  const handleDownloadContract = (path: string) => {
    if (!path) {
        addToast('error', 'Indisponível', 'Esta assinatura não possui um contrato anexado.');
        return;
    }
    window.open(getContractUrl(path), '_blank');
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
              setFormData((prev) => ({
                ...prev,
                diaPagamento: Math.min(new Date().getDate(), 30).toString(),
              }));
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
                    { value: 'Ativa', label: 'Ativa' },
                    { value: 'Cancelada', label: 'Cancelada' },
                    { value: 'Pendente', label: 'Pendente' },
                  ]}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val.toString())}
                />
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Data Inicial</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className={formFilterInputClass}
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="date" 
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className={formFilterInputClass}
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
                    className={formFilterInputClass}
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxVal}
                    onChange={(e) => setMaxVal(e.target.value)}
                    className={formFilterInputClass}
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
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {sub.nomePlano || 'Plano Personalizado'}
                                    </span>
                                    {sub.contratoPath && (
                                        <button 
                                            onClick={() => handleDownloadContract(sub.contratoPath as string)}
                                            className="p-1 text-gray-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                            title="Baixar Contrato PDF"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
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
                                {sub.contratoPath && (
                                    <button 
                                        onClick={() => handleDownloadContract(sub.contratoPath as string)}
                                        className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                        title="Baixar Contrato"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleOpenChat(sub)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Conversar no Chat"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
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
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                type="submit"
                className="bg-slate-900 hover:bg-slate-800" 
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
                        className={formFilterInputWithIconClass}
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

            <div className="flex flex-col gap-1.5 relative" ref={planDropdownRef}>
                <label className="text-sm font-medium text-gray-700">Selecionar Plano</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar plano..."
                        className={formFilterInputWithIconClass}
                        value={planSearch}
                        onFocus={() => setIsPlanListOpen(true)}
                        onChange={(e) => {
                            setPlanSearch(e.target.value);
                            setIsPlanListOpen(true);
                            if (formData.idPlano) setFormData(prev => ({ ...prev, idPlano: '' }));
                        }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ChevronsUpDown className="w-4 h-4" />
                    </div>
                </div>

                {isPlanListOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div 
                            className="px-3 py-3 border-b border-gray-100 hover:bg-indigo-50 cursor-pointer flex items-center text-indigo-700 font-medium transition-colors"
                            onClick={() => setIsNewPlanModalOpen(true)}
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                <Plus className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="block text-sm">Cadastrar novo plano</span>
                                <span className="block text-xs text-indigo-500 font-normal">Criar um novo plano disponível</span>
                            </div>
                        </div>
                        {filteredPlansForDropdown.map(p => (
                            <div 
                                key={p.idPlano}
                                className={`px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${formData.idPlano === String(p.idPlano) ? 'bg-gray-50' : ''}`}
                                onClick={() => handleSelectPlan(p)}
                            >
                                <span className="text-sm">{p.nome} - R$ {p.valorMensalidade}</span>
                                {formData.idPlano === String(p.idPlano) && <Check className="w-4 h-4 text-slate-600" />}
                            </div>
                        ))}
                    </div>
                )}
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

          {/* Dia de Pagamento e Desconto */}
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                    Dia do Fechamento
                    <InfoTooltip text="É o dia em que a fatura fecha. O vencimento dela ocorre 7 dias após a data de fechamento." />
                </label>
                <div className="relative">
                    <SearchSelect
                        options={Array.from({ length: 30 }, (_, i) => ({ value: (i + 1).toString(), label: (i + 1).toString() }))}
                        value={formData.diaPagamento}
                        onChange={(val) => setFormData(prev => ({ ...prev, diaPagamento: val.toString() }))}
                    />
                </div>
                {parseInt(formData.diaPagamento) > 28 && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-600 bg-amber-50 p-2 rounded-md animate-in fade-in slide-in-from-top-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Como você selecionou o dia <strong>{formData.diaPagamento}</strong>, em meses que não possuem esse dia (ex: Fevereiro), o fechamento será ajustado automaticamente para o último dia disponível do mês.</span>
                    </div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Desconto</label>
                <div className="relative">
                    <input
                        type="number"
                        name="desconto"
                        value={formData.desconto}
                        onChange={handleInputChange}
                        className={formFilterInputWithIconClass}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {Number(formData.tipoDesconto) === TIPO_DESCONTO.ValorFixo ? 'R$' : '%'}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={formLabelClass}>Tipo de desconto</label>
              <select
                name="tipoDesconto"
                value={formData.tipoDesconto}
                onChange={handleInputChange}
                className={formSelectClass}
              >
                <option value={TIPO_DESCONTO.Percentual}>Percentual (%)</option>
                <option value={TIPO_DESCONTO.ValorFixo}>Valor fixo (R$)</option>
              </select>
            </div>
          </div>
          </div>

          {/* Observação */}
          <div className="flex flex-col gap-1.5">
             <label className={formLabelClass}>Observação</label>
             <textarea 
                name="observacao"
                rows={3}
                className={formTextareaClass}
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
        onSubmit={(e) => { e.preventDefault(); handleConnectClient(); }}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsConnectModalOpen(false)} disabled={isConnecting}>Cancelar</Button>
            <Button type="submit" isLoading={isConnecting} className="bg-slate-900 hover:bg-slate-800">
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
                        className={formSearchInputClass}
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
        onSubmit={(e) => { e.preventDefault(); handleUpdateStatus(); }}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsStatusModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                type="submit"
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
                            type="button"
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
        onSubmit={(e) => { e.preventDefault(); confirmDelete(); }}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button 
                type="submit"
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

      {/* New Plan Modal */}
      <Modal
        isOpen={isNewPlanModalOpen}
        onClose={resetNewPlanForm}
        title="Cadastrar Novo Plano"
        size="lg"
        footer={
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentPlanStep ? 'w-6 bg-slate-900' : 'w-2 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (currentPlanStep === 0) {
                      setIsNewPlanModalOpen(false);
                      resetNewPlanForm();
                    } else {
                      setCurrentPlanStep(prev => prev - 1);
                    }
                  }}
                  disabled={isSaving}
                >
                  {currentPlanStep === 0 ? 'Cancelar' : 'Voltar'}
                </Button>
                {currentPlanStep < 2 ? (
                  <Button
                    type="button"
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={() => {
                      if (currentPlanStep === 0 && !newPlanFormData.nome) {
                        addToast('error', 'Nome Obrigatório', 'Por favor, informe o nome do plano.');
                        return;
                      }
                      if (currentPlanStep === 0 && !newPlanFormData.valorMensalidade) {
                        addToast('error', 'Valor Obrigatório', 'Por favor, informe o valor da mensalidade.');
                        return;
                      }
                      setCurrentPlanStep(prev => prev + 1);
                    }}
                  >
                    Avançar
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    isLoading={isSaving} 
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                    onClick={handleCreatePlan}
                  >
                    Criar Plano
                  </Button>
                )}
              </div>
            </div>
        }
      >
        <div className="space-y-5 py-1">
            {/* Header das etapas */}
            <div className="flex justify-between border-b border-gray-100 pb-4 mb-2">
              <span className={`text-xs font-semibold ${currentPlanStep === 0 ? 'text-slate-900' : 'text-gray-400'}`}>
                1. Informações Básicas
              </span>
              <span className={`text-xs font-semibold ${currentPlanStep === 1 ? 'text-slate-900' : 'text-gray-400'}`}>
                2. Contrato & Multas
              </span>
              <span className={`text-xs font-semibold ${currentPlanStep === 2 ? 'text-slate-900' : 'text-gray-400'}`}>
                3. Funcionalidades
              </span>
            </div>

            {/* Etapa 1: Informações Básicas */}
            {currentPlanStep === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                <Input 
                  label="Nome do Plano" 
                  placeholder="Ex: Plano Individual Premium" 
                  value={newPlanFormData.nome} 
                  onChange={(e) => setNewPlanFormData({...newPlanFormData, nome: e.target.value})} 
                  required
                />
                <Input 
                  label="Valor da Mensalidade" 
                  placeholder="R$ 0,00" 
                  type="number" 
                  value={newPlanFormData.valorMensalidade} 
                  onChange={(e) => setNewPlanFormData({...newPlanFormData, valorMensalidade: e.target.value})} 
                  required
                />
                <div className="flex items-center pt-2">
                     <label className="flex items-center cursor-pointer space-x-2 select-none">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
                            checked={newPlanFormData.assinarPorCliente}
                            onChange={(e) => setNewPlanFormData({...newPlanFormData, assinarPorCliente: e.target.checked})}
                        />
                        <div className="flex items-center text-sm text-gray-700 font-medium">
                            Permitir que o cliente assine sozinho pelo app
                        </div>
                     </label>
                </div>
              </div>
            )}

            {/* Etapa 2: Contrato e Multas */}
            {currentPlanStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Multa por Atraso (%)" 
                      placeholder="Ex: 2.00" 
                      type="number" 
                      value={newPlanFormData.percentualMulta} 
                      onChange={(e) => setNewPlanFormData({...newPlanFormData, percentualMulta: e.target.value})} 
                    />
                    <Input 
                      label="Juros Mensal (%)" 
                      placeholder="Ex: 1.00" 
                      type="number" 
                      value={newPlanFormData.percentualJurosMensal} 
                      onChange={(e) => setNewPlanFormData({...newPlanFormData, percentualJurosMensal: e.target.value})} 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={formLabelClass}>Tipo de Contrato</label>
                    <select
                      value={newPlanFormData.tipoContrato}
                      onChange={(e) => setNewPlanFormData({...newPlanFormData, tipoContrato: e.target.value})}
                      className={formSelectClass}
                    >
                      <option value={TIPO_CONTRATO.Nenhum}>Sem Contrato Requerido</option>
                      <option value={TIPO_CONTRATO.Termo}>Aceitar Termo Digital (Clique de Aceite)</option>
                      <option value={TIPO_CONTRATO.Contrato}>Assinar Contrato (Assinatura na tela + Foto)</option>
                    </select>
                  </div>
                  <Input 
                    label="Prazo para Cancelamento sem Multa (Dias)" 
                    placeholder="Ex: 7" 
                    type="number" 
                    value={newPlanFormData.cancelamentoDias} 
                    onChange={(e) => setNewPlanFormData({...newPlanFormData, cancelamentoDias: e.target.value})} 
                  />
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-sm font-medium text-gray-700">Arquivo do Contrato (PDF)</label>
                    <label className={`border-2 border-dashed border-slate-200 ${FORM_RADIUS} p-5 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50/50`}>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-gray-100">
                            <FileText className="w-5 h-5 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 text-center px-4 truncate max-w-full">
                            {newPlanFormData.contrato ? newPlanFormData.contrato.name : 'Clique para selecionar o PDF do contrato'}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">Apenas arquivos no formato PDF</span>
                        <input type="file" accept=".pdf" className="hidden" onChange={handleNewPlanFileChange} />
                    </label>
                </div>
              </div>
            )}

            {/* Etapa 3: Funcionalidades */}
            {currentPlanStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className={formLabelClass}>Destaques e Funcionalidades do Plano</label>
                  <span className="text-xs text-gray-400">Insira cada diferencial do plano em uma nova linha.</span>
                  <textarea 
                      className={`${formTextareaClass} p-3 text-sm`}
                      placeholder="Exemplo:&#10;Acesso ilimitado ao espaço físico&#10;Suporte VIP via WhatsApp&#10;Desconto de 10% em produtos" 
                      rows={6} 
                      value={newPlanFormData.funcionalidades} 
                      onChange={(e) => setNewPlanFormData({...newPlanFormData, funcionalidades: e.target.value})} 
                  />
                </div>
              </div>
            )}
        </div>
      </Modal>

    </BusinessLayout>
  );
};
