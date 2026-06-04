
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CheckCircle2, Calendar, CreditCard, Loader2, XCircle, AlertTriangle, Settings, Bell, Mail, MessageSquare, Smartphone, Search, Filter, FileText, Download, PenLine, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientSubscription, SavedCard } from '../../types';
import { useToast } from '../../context/ToastContext';
import { SearchSelect } from '../../components/ui/SearchSelect';
import {
  getContractUrl,
  getSubscriptionTipoContrato,
  requiresContractAckType,
  requiresSignedContractType,
} from '../../utils/api';
import { SignaturePadModal } from '../../components/ui/SignaturePadModal';
import { CameraCaptureModal } from '../../components/ui/CameraCaptureModal';
import {
  buildContractPdfWithEvidence,
  buildSignedContractFile,
  downloadBlob,
} from '../../utils/contractPdf';

export const Assinaturas: React.FC = () => {
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');

  // Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [subToCancel, setSubToCancel] = useState<ClientSubscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedSubForSettings, setSelectedSubForSettings] = useState<ClientSubscription | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    notifications: {
      usarConfigsGerais: true,
      notificacoes: true,
      notificacoesAtraso: 0,
      email: true,
      sms: false,
      whatsApp: true,
    },
    paymentMethod: 'pix', // 'pix', 'boleto', or card ID
  });

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSubForDetails, setSelectedSubForDetails] = useState<ClientSubscription | null>(null);

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [subToAccept, setSubToAccept] = useState<ClientSubscription | null>(null);
  const [acceptForm, setAcceptForm] = useState({
    aceitouTermos: false,
    signatureDataUrl: null as string | null,
    photoDataUrl: null as string | null,
  });
  const [isAccepting, setIsAccepting] = useState<number | null>(null);
  const [acceptStep, setAcceptStep] = useState(0);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [mergedContractPdfUrl, setMergedContractPdfUrl] = useState<string | null>(null);
  const [mergedContractBlob, setMergedContractBlob] = useState<Blob | null>(null);
  const [isBuildingMergedPdf, setIsBuildingMergedPdf] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subsData, cardsData, connections] = await Promise.all([
        userService.listClientSubscriptions(),
        userService.listSavedCards(),
        userService.listConnections(),
      ]);
      const enrichedSubs = await userService.enrichClientSubscriptions(subsData, connections);
      setSubscriptions(enrichedSubs);
      setSavedCards(cardsData);
    } catch (error) {
      console.error(error);
      addToast('error', 'Erro', 'Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const [subsData, connections] = await Promise.all([
        userService.listClientSubscriptions(),
        userService.listConnections(),
      ]);
      const enrichedSubs = await userService.enrichClientSubscriptions(subsData, connections);
      setSubscriptions(enrichedSubs);
    } catch (error) {
      console.error(error);
    }
  };

  const requiresSignedContract = (sub: ClientSubscription) =>
    requiresSignedContractType(getSubscriptionTipoContrato(sub));

  const requiresContractAck = (sub: ClientSubscription) =>
    requiresContractAckType(getSubscriptionTipoContrato(sub));

  const getPlanContractPathForAccept = (sub: ClientSubscription) =>
    sub.planoContratoPath ?? sub.contratoPath ?? null;

  const handleAcceptClick = (sub: ClientSubscription) => {
    setSubToAccept(sub);
    setAcceptForm({
      aceitouTermos: false,
      signatureDataUrl: null,
      photoDataUrl: null,
    });
    setAcceptStep(0);
    setIsAcceptModalOpen(true);
  };

  const getAcceptSteps = (sub: ClientSubscription | null) => {
    if (!sub) return [];
    const steps = [];
    if (requiresContractAck(sub)) {
      steps.push({ id: 'contrato', label: 'Contrato' });
    }
    steps.push({ id: 'confirmacao', label: 'Confirmar' });
    return steps;
  };

  const validateAcceptStep = (): boolean => {
    if (!subToAccept) return false;

    const steps = getAcceptSteps(subToAccept);
    const current = steps[acceptStep];
    if (!current) return false;

    if (current.id === 'contrato') {
      if (requiresSignedContract(subToAccept)) {
        if (!acceptForm.signatureDataUrl) {
          addToast('error', 'Contrato', 'Desenhe sua assinatura antes de continuar.');
          return false;
        }
        if (!acceptForm.photoDataUrl) {
          addToast('error', 'Contrato', 'Registre sua foto antes de continuar.');
          return false;
        }
      }
      if (requiresContractAck(subToAccept) && !acceptForm.aceitouTermos) {
        addToast('error', 'Contrato', 'Aceite os termos do contrato antes de continuar.');
        return false;
      }
    }

    return true;
  };

  const goNextAcceptStep = () => {
    if (!validateAcceptStep() || !subToAccept) return;
    const steps = getAcceptSteps(subToAccept);
    setAcceptStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goPrevAcceptStep = () => {
    setAcceptStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (!isAcceptModalOpen || !subToAccept) return;

    const steps = getAcceptSteps(subToAccept);
    const current = steps[acceptStep];

    if (current?.id !== 'confirmacao') {
      setMergedContractPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMergedContractBlob(null);
      return;
    }

    if (!requiresSignedContract(subToAccept)) {
      setMergedContractPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMergedContractBlob(null);
      return;
    }

    const hasEvidence =
      acceptForm.signatureDataUrl || acceptForm.photoDataUrl;

    const planContractPath = getPlanContractPathForAccept(subToAccept);

    if (!hasEvidence && !planContractPath) {
      setMergedContractPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMergedContractBlob(null);
      return;
    }

    let cancelled = false;

    const buildMergedPdf = async () => {
      setIsBuildingMergedPdf(true);
      try {
        const blob = await buildContractPdfWithEvidence(
          planContractPath,
          acceptForm.signatureDataUrl,
          acceptForm.photoDataUrl
        );
        if (cancelled) return;

        setMergedContractBlob(blob);
        setMergedContractPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          addToast(
            'error',
            'Contrato',
            'Não foi possível montar o PDF com assinatura e foto. Tente novamente.'
          );
          setMergedContractBlob(null);
          setMergedContractPdfUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } finally {
        if (!cancelled) setIsBuildingMergedPdf(false);
      }
    };

    buildMergedPdf();

    return () => {
      cancelled = true;
    };
  }, [
    isAcceptModalOpen,
    subToAccept,
    acceptStep,
    acceptForm.signatureDataUrl,
    acceptForm.photoDataUrl,
    addToast,
  ]);

  const closeAcceptModal = () => {
    setMergedContractPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMergedContractBlob(null);
    setIsAcceptModalOpen(false);
    setSubToAccept(null);
  };

  const handleAcceptSubscription = async () => {
    if (!subToAccept) return;

    if (requiresContractAck(subToAccept) && !acceptForm.aceitouTermos) {
      addToast('error', 'Contrato', 'Você precisa ler e aceitar o contrato/termo antes de aceitar a assinatura.');
      return;
    }

    if (requiresSignedContract(subToAccept)) {
      if (!acceptForm.signatureDataUrl) {
        addToast('error', 'Contrato', 'Desenhe sua assinatura no contrato antes de continuar.');
        return;
      }
      if (!acceptForm.photoDataUrl) {
        addToast('error', 'Contrato', 'Registre sua foto antes de continuar.');
        return;
      }
    }

    try {
      setIsAccepting(subToAccept.idAssinatura);
      let contratoFile: File | null = null;
      if (requiresSignedContract(subToAccept)) {
        if (isBuildingMergedPdf) {
          addToast('error', 'Contrato', 'Aguarde a montagem do PDF com assinatura e foto.');
          return;
        }
        if (mergedContractBlob) {
          contratoFile = new File([mergedContractBlob], 'contrato-assinado.pdf', {
            type: 'application/pdf',
          });
        } else {
          contratoFile = await buildSignedContractFile(
            getPlanContractPathForAccept(subToAccept),
            acceptForm.signatureDataUrl,
            acceptForm.photoDataUrl,
          );
        }
      }

      await userService.acceptSubscription(subToAccept.idAssinatura, contratoFile);
      addToast('success', 'Sucesso', 'Assinatura aceita com sucesso.');
      
      window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
      
      closeAcceptModal();
      await fetchSubscriptions();
    } catch (error: any) {
      addToast('error', 'Erro', error.message);
    } finally {
      setIsAccepting(null);
    }
  };

  const handleCancelClick = (sub: ClientSubscription) => {
      setSubToCancel(sub);
      setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
      if (!subToCancel) return;
      try {
          setIsProcessing(true);
          await userService.cancelSubscription(subToCancel.idAssinatura);
          addToast('success', 'Assinatura Cancelada', 'Sua assinatura foi cancelada com sucesso.');
          
          // Notificar Sidebar para atualizar badges
          window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
          
          await fetchSubscriptions();
          setIsCancelModalOpen(false);
          setSubToCancel(null);
      } catch (error: any) {
          addToast('error', 'Erro', error.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSettingsClick = async (sub: ClientSubscription) => {
    setSelectedSubForSettings(sub);
    setIsSettingsModalOpen(true);
    
    try {
      const settings = await userService.getSubscriptionNotificationSettings(sub.idAssinatura);
      setSettingsForm(prev => ({
        ...prev,
        notifications: {
          usarConfigsGerais: settings.usarConfigsGerais ?? true,
          notificacoes: settings.notificacoes ?? true,
          notificacoesAtraso: settings.notificacoesAtraso ?? 0,
          email: settings.email ?? true,
          sms: settings.sms ?? false,
          whatsApp: settings.whatsApp ?? true,
        }
      }));
    } catch (error) {
      console.error("Failed to load notification settings", error);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedSubForSettings) return;
    
    setIsSavingSettings(true);
    try {
      await userService.updateSubscriptionNotificationSettings(
        selectedSubForSettings.idAssinatura, 
        settingsForm.notifications
      );
      
      addToast('success', 'Configurações Salvas', 'As configurações da assinatura foram atualizadas.');
      setIsSettingsModalOpen(false);
      setSelectedSubForSettings(null);
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao salvar configurações.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleNotificationToggle = (key: keyof typeof settingsForm.notifications) => {
    setSettingsForm(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleDetailsClick = (sub: ClientSubscription) => {
    setSelectedSubForDetails(sub);
    setIsDetailsModalOpen(true);
  };

  const handleDownloadContract = (path: string) => {
    if (!path) {
        addToast('error', 'Indisponível', 'Este plano não possui um contrato digital anexado.');
        return;
    }
    window.open(getContractUrl(path), '_blank');
  };

  const isPendingStatus = (status: string) =>
    status === 'Pendente' || status === '3';

  const isActiveStatus = (status: string) =>
    status === 'Ativo' || status === 'Ativa' || status === '0';

  const formatDate = (isoStr: string) => {
    try {
        return new Date(isoStr).toLocaleDateString('pt-BR');
    } catch {
        return isoStr;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = searchTerm.toLowerCase();
    const planoName = sub.nomePlano || '';
    const empresaName = sub.nomeEmpresa || '';
    const matchesSearch = planoName.toLowerCase().includes(searchLower) || empresaName.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'Todos' || sub.status === statusFilter
      || (statusFilter === 'Ativo' && isActiveStatus(sub.status))
      || (statusFilter === 'Pendente' && isPendingStatus(sub.status));

    let matchesDate = true;
    if (dateStart || dateEnd) {
        const vDate = new Date(sub.dataInicio);
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
        if (sub.valorMensal < Number(minVal)) matchesValue = false;
    }
    if (maxVal) {
        if (sub.valorMensal > Number(maxVal)) matchesValue = false;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesValue;
  }).sort((a, b) => {
    if (isPendingStatus(a.status) && !isPendingStatus(b.status)) return -1;
    if (isPendingStatus(b.status) && !isPendingStatus(a.status)) return 1;
    return 0;
  });

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Assinaturas</h1>
        <p className="text-gray-500 mt-1">Gerencie seus planos e serviços contratados.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por plano ou empresa..."
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
                <SearchSelect
                  options={[
                    { value: 'Todos', label: 'Todos os status' },
                    { value: 'Ativo', label: 'Ativo' },
                    { value: 'Pendente', label: 'Pendente' },
                    { value: 'Cancelada', label: 'Cancelada' },
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma assinatura encontrada</h3>
            <p className="text-gray-500 max-w-sm">
                Nenhuma assinatura corresponde aos filtros aplicados.
            </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubscriptions.map((sub) => (
             <div 
                key={sub.idAssinatura} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleDetailsClick(sub)}
             >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">{sub.nomePlano}</h3>
                            {sub.contratoPath && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownloadContract(sub.contratoPath as string); }}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                    title="Baixar Contrato PDF"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">{sub.nomeEmpresa}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                            <span className={`flex items-center font-medium ${isActiveStatus(sub.status) ? 'text-green-600' : 'text-gray-600'}`}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {sub.status}
                            </span>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <span className="text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> 
                                {sub.dataFim && sub.dataFim.startsWith('0001-01-01') 
                                    ? 'Assinatura recorrente' 
                                    : `Expira em ${formatDate(sub.dataFim)}`
                                }
                            </span>
                            {/* Ícones de Notificação */}
                            <div className="flex items-center gap-2 ml-auto sm:ml-0 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                <Mail className={`w-3 h-3 ${isActiveStatus(sub.status) ? 'text-blue-500' : 'text-gray-300'}`} title="Notificações por E-mail ativas" />
                                <MessageSquare className={`w-3 h-3 ${isActiveStatus(sub.status) ? 'text-green-500' : 'text-gray-300'}`} title="Notificações por WhatsApp ativas" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-bold text-gray-900">R$ {sub.valorMensal.toFixed(2).replace('.', ',')}</span>
                        <span className="text-xs text-gray-500">/mês</span>
                    </div>
                    {isPendingStatus(sub.status) && (
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAcceptClick(sub)}
                            isLoading={isAccepting === sub.idAssinatura}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Aceitar
                        </Button>
                    )}
                    {isActiveStatus(sub.status) && (
                        <div className="flex gap-2">
                            {sub.contratoPath && (
                                <Button 
                                    variant="outline" 
                                    className="text-slate-600 hover:bg-slate-50 border-gray-200"
                                    onClick={() => handleDownloadContract(sub.contratoPath as string)}
                                    title="Baixar Contrato"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                className="text-slate-600 hover:bg-slate-50 border-gray-200"
                                onClick={() => handleSettingsClick(sub)}
                                title="Configurações da Assinatura"
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                className="text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200"
                                onClick={() => handleCancelClick(sub)}
                                title="Cancelar Assinatura"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
             </div>
          ))}
        </div>
      )}

      {/* Modal Aceitar Assinatura */}
      <Modal
        isOpen={isAcceptModalOpen}
        onClose={closeAcceptModal}
        title={
          subToAccept
            ? `Aceitar Assinatura — etapa ${acceptStep + 1} de ${getAcceptSteps(subToAccept).length}`
            : 'Aceitar Assinatura'
        }
        size="lg"
        footer={
          subToAccept ? (() => {
            const steps = getAcceptSteps(subToAccept);
            const isFirst = acceptStep === 0;
            const isLast = acceptStep === steps.length - 1;

            return (
              <>
                <Button
                  variant="outline"
                  onClick={() => (isFirst ? closeAcceptModal() : goPrevAcceptStep())}
                  disabled={isAccepting !== null}
                >
                  {isFirst ? 'Cancelar' : (
                    <>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </>
                  )}
                </Button>
                {isLast ? (
                  <Button
                    onClick={handleAcceptSubscription}
                    isLoading={isAccepting !== null}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Confirmar Aceite
                  </Button>
                ) : (
                  <Button
                    onClick={goNextAcceptStep}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </>
            );
          })() : undefined
        }
      >
        {subToAccept && (() => {
          const steps = getAcceptSteps(subToAccept);
          const currentStep = steps[acceptStep];

          return (
            <div className="space-y-4">
              {/* Stepper */}
              {steps.length > 1 && (
                <div className="flex items-center justify-between gap-1 px-1">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            index < acceptStep
                              ? 'bg-green-600 text-white'
                              : index === acceptStep
                                ? 'bg-slate-900 text-white'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {index < acceptStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={`text-[10px] mt-1 truncate w-full text-center ${
                          index === acceptStep ? 'text-slate-900 font-medium' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`h-0.5 flex-1 mb-4 ${index < acceptStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* Caso simples sem contrato nem termos (apenas a tela de confirmação direta) */}
                {currentStep.id === 'confirmacao' && !requiresContractAck(subToAccept) && (
                  <div className="space-y-4">
                    <div className="text-center pb-2">
                      <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{subToAccept.nomePlano}</h3>
                      <p className="text-sm text-gray-500">{subToAccept.nomeEmpresa}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        R$ {subToAccept.valorMensal.toFixed(2).replace('.', ',')}
                        <span className="text-sm font-normal text-gray-500">/mês</span>
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      Ao confirmar, você aceita a assinatura do plano e autoriza as cobranças conforme o contrato da empresa.
                    </p>
                  </div>
                )}

                {/* Caso exija contrato/termos - Etapa 1 - Contrato */}
                {currentStep.id === 'contrato' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {requiresSignedContract(subToAccept) ? 'Contrato do plano' : 'Termo de adesão'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {requiresSignedContract(subToAccept)
                          ? 'Leia o contrato, desenhe sua assinatura e registre sua foto.'
                          : 'Leia o termo de adesão e marque que concorda para continuar.'}
                      </p>
                    </div>

                    {getPlanContractPathForAccept(subToAccept) ? (
                      <>
                        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                          <iframe
                            src={getContractUrl(getPlanContractPathForAccept(subToAccept))}
                            title="Contrato do plano"
                            className="w-full h-40"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-sm py-2"
                          onClick={() =>
                            handleDownloadContract(getPlanContractPathForAccept(subToAccept) as string)
                          }
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Abrir contrato em nova aba
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        Este plano exige aceite, mas ainda não possui PDF de contrato cadastrado.
                      </p>
                    )}

                    {requiresSignedContract(subToAccept) && (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-center text-sm py-2"
                          onClick={() => setIsSignatureModalOpen(true)}
                        >
                          <PenLine className="w-4 h-4 mr-2" />
                          Assinar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-center text-sm py-2"
                          onClick={() => setIsCameraModalOpen(true)}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Tirar foto
                        </Button>
                      </div>
                    )}

                    {requiresSignedContract(subToAccept) &&
                      (acceptForm.signatureDataUrl || acceptForm.photoDataUrl) && (
                      <div className="grid grid-cols-2 gap-3">
                        {acceptForm.signatureDataUrl && (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                            <p className="text-[11px] font-medium text-green-800 mb-1 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Assinatura
                            </p>
                            <img
                              src={acceptForm.signatureDataUrl}
                              alt="Assinatura"
                              className="w-full h-14 object-contain bg-white rounded border border-green-100"
                            />
                          </div>
                        )}
                        {acceptForm.photoDataUrl && (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                            <p className="text-[11px] font-medium text-blue-800 mb-1 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Foto
                            </p>
                            <img
                              src={acceptForm.photoDataUrl}
                              alt="Foto do usuário"
                              className="w-full h-14 object-cover bg-white rounded border border-blue-100"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {requiresContractAck(subToAccept) && (
                      <label className="flex items-start gap-2 text-sm text-gray-600 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={acceptForm.aceitouTermos}
                          onChange={(e) => setAcceptForm((prev) => ({ ...prev, aceitouTermos: e.target.checked }))}
                          className="mt-0.5"
                        />
                        Li e concordo com os termos/contrato deste plano.
                      </label>
                    )}
                  </div>
                )}

                {/* Caso exija contrato/termos - Etapa 2 - Confirmação */}
                {currentStep.id === 'confirmacao' && requiresContractAck(subToAccept) && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Revise antes de confirmar</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {requiresSignedContract(subToAccept)
                          ? 'Confira os dados e o contrato com assinatura e foto na última página.'
                          : 'Confira os dados e o termo de adesão antes de confirmar.'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estabelecimento</span>
                        <span className="font-medium text-gray-900 text-right">{subToAccept.nomeEmpresa}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plano</span>
                        <span className="font-medium text-gray-900">{subToAccept.nomePlano}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor mensal</span>
                        <span className="font-bold text-slate-900">
                          R$ {subToAccept.valorMensal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {(mergedContractPdfUrl ||
                      getPlanContractPathForAccept(subToAccept) ||
                      (requiresSignedContract(subToAccept) &&
                        (acceptForm.signatureDataUrl || acceptForm.photoDataUrl))) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {requiresSignedContract(subToAccept)
                              ? 'Contrato final (com anexo)'
                              : 'Termo de adesão'}
                          </p>
                          {mergedContractBlob && (
                            <Button
                              type="button"
                              variant="outline"
                              className="text-xs py-1.5 px-3 shrink-0"
                              onClick={() =>
                                downloadBlob(
                                  mergedContractBlob,
                                  `contrato-${subToAccept.nomePlano?.replace(/\s+/g, '-') ?? 'plano'}.pdf`
                                )
                              }
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              Baixar PDF
                            </Button>
                          )}
                        </div>

                        {isBuildingMergedPdf ? (
                          <div className="flex items-center justify-center h-48 border border-gray-200 rounded-lg bg-white">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                            <span className="ml-2 text-sm text-gray-500">Montando contrato...</span>
                          </div>
                        ) : mergedContractPdfUrl ? (
                          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                            <iframe
                              src={mergedContractPdfUrl}
                              title="Contrato com assinatura e foto"
                              className="w-full h-56"
                            />
                          </div>
                        ) : getPlanContractPathForAccept(subToAccept) ? (
                          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                            <iframe
                              src={getContractUrl(getPlanContractPathForAccept(subToAccept))}
                              title="Contrato do plano"
                              className="w-full h-56"
                            />
                          </div>
                        ) : null}

                        {requiresSignedContract(subToAccept) && (
                          <p className="text-[11px] text-gray-400">
                            A última página do PDF contém sua foto e assinatura registradas neste formulário.
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 text-center">
                      Ao confirmar, você aceita a assinatura do plano e autoriza as cobranças.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal Cancelamento */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Assinatura"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={isProcessing}>Voltar</Button>
            <Button 
                onClick={confirmCancel} 
                isLoading={isProcessing} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Cancelamento
            </Button>
          </>
        }
      >
         <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cancelar {subToCancel?.nomePlano}?</h3>
            <p className="text-sm text-gray-500">
                Você perderá acesso aos benefícios deste plano ao final do ciclo atual. Esta ação não pode ser desfeita.
            </p>
         </div>
      </Modal>

      {/* Modal Configurações da Assinatura */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Configurações da Assinatura"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)} disabled={isSavingSettings}>Cancelar</Button>
            <Button 
                onClick={handleSaveSettings} 
                isLoading={isSavingSettings} 
                className="bg-slate-900 hover:bg-slate-800 text-white"
            >
                Salvar Configurações
            </Button>
          </>
        }
      >
        {selectedSubForSettings && (
          <div className="space-y-8">
            {/* Header Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900">{selectedSubForSettings.nomePlano}</h4>
                <p className="text-sm text-slate-500">{selectedSubForSettings.nomeEmpresa}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">R$ {selectedSubForSettings.valorMensal.toFixed(2).replace('.', ',')}</span>
                <span className="text-xs text-slate-500 block">/mês</span>
              </div>
            </div>

            {/* Notificações */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-slate-500" />
                Preferências de Notificação
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${settingsForm.notifications.usarConfigsGerais ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-400'}`}>
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Usar Configurações Gerais</p>
                      <p className="text-xs text-gray-500">Seguir as configurações globais da sua conta</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${settingsForm.notifications.usarConfigsGerais ? 'bg-slate-900' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settingsForm.notifications.usarConfigsGerais ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={settingsForm.notifications.usarConfigsGerais} onChange={() => handleNotificationToggle('usarConfigsGerais')} />
                </label>

                {!settingsForm.notifications.usarConfigsGerais && (
                  <div className="pl-4 border-l-2 border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${settingsForm.notifications.notificacoes ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Receber Notificações</p>
                          <p className="text-xs text-gray-500">Ativar alertas para esta assinatura</p>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${settingsForm.notifications.notificacoes ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settingsForm.notifications.notificacoes ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={settingsForm.notifications.notificacoes} onChange={() => handleNotificationToggle('notificacoes')} />
                    </label>

                    {settingsForm.notifications.notificacoes && (
                      <>
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${settingsForm.notifications.email ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">E-mail</p>
                              <p className="text-xs text-gray-500">Receber faturas e alertas por email</p>
                            </div>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${settingsForm.notifications.email ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settingsForm.notifications.email ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={settingsForm.notifications.email} onChange={() => handleNotificationToggle('email')} />
                        </label>

                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${settingsForm.notifications.whatsApp ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">WhatsApp</p>
                              <p className="text-xs text-gray-500">Lembretes de vencimento no WhatsApp</p>
                            </div>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${settingsForm.notifications.whatsApp ? 'bg-green-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settingsForm.notifications.whatsApp ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={settingsForm.notifications.whatsApp} onChange={() => handleNotificationToggle('whatsApp')} />
                        </label>

                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${settingsForm.notifications.sms ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">SMS</p>
                              <p className="text-xs text-gray-500">Lembretes de vencimento por SMS</p>
                            </div>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${settingsForm.notifications.sms ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settingsForm.notifications.sms ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input type="checkbox" className="hidden" checked={settingsForm.notifications.sms} onChange={() => handleNotificationToggle('sms')} />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Método de Pagamento */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-slate-500" />
                Método de Pagamento Principal
              </h4>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${settingsForm.paymentMethod === 'pix' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="pix" 
                    checked={settingsForm.paymentMethod === 'pix'}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1 flex justify-between items-center">
                    <span className="font-medium text-gray-900">PIX</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Aprovação Imediata</span>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${settingsForm.paymentMethod === 'boleto' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="boleto" 
                    checked={settingsForm.paymentMethod === 'boleto'}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <span className="font-medium text-gray-900">Boleto Bancário</span>
                  </div>
                </label>

                {savedCards.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cartões Salvos</p>
                    <div className="space-y-3">
                      {savedCards.map(card => (
                        <label key={card.idCartao} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${settingsForm.paymentMethod === card.idCartao.toString() ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={card.idCartao.toString()} 
                            checked={settingsForm.paymentMethod === card.idCartao.toString()}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-[10px] text-white font-bold italic">
                                {card.bandeira || 'Cartão'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">•••• {card.ultimosDigitos}</p>
                                <p className="text-xs text-gray-500">{card.nomeNoCartao}</p>
                              </div>
                            </div>
                            {card.isDefault && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Principal</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {savedCards.length === 0 && (
                  <div className="p-6 border border-dashed border-gray-300 rounded-lg flex flex-col items-center text-center bg-gray-50/50">
                    <p className="text-sm text-gray-500 mb-4">Nenhum cartão de crédito salvo.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = '/#/metodos-pagamento'}
                      className="px-8"
                    >
                      Adicionar Cartão
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes da Assinatura"
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Fechar
            </Button>
          </div>
        }
      >
        {selectedSubForDetails && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedSubForDetails.nomePlano}</h2>
                <p className="text-gray-500">{selectedSubForDetails.nomeEmpresa}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActiveStatus(selectedSubForDetails.status) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedSubForDetails.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Informações do Plano</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Valor Mensal</p>
                    <p className="font-semibold text-gray-900 text-lg">R$ {selectedSubForDetails.valorMensal.toFixed(2).replace('.', ',')}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data de Início</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedSubForDetails.dataInicio)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Data de Fim</p>
                      <p className="font-medium text-gray-900">
                        {selectedSubForDetails.dataFim && selectedSubForDetails.dataFim.startsWith('0001-01-01') 
                          ? 'Recorrente' 
                          : formatDate(selectedSubForDetails.dataFim)}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedSubForDetails.descricaoPlano && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Descrição</p>
                    <p className="text-sm text-gray-700">{selectedSubForDetails.descricaoPlano}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Empresa Responsável</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nome da Empresa</p>
                    <p className="font-medium text-gray-900">{selectedSubForDetails.nomeEmpresa}</p>
                  </div>
                  
                  {selectedSubForDetails.nomeDono && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Responsável</p>
                      <p className="font-medium text-gray-900">{selectedSubForDetails.nomeDono}</p>
                    </div>
                  )}

                  {selectedSubForDetails.cnpjEmpresa && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">CNPJ</p>
                      <p className="font-medium text-gray-900">{selectedSubForDetails.cnpjEmpresa}</p>
                    </div>
                  )}

                  {selectedSubForDetails.emailEmpresa && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">E-mail de Contato</p>
                      <p className="font-medium text-gray-900">{selectedSubForDetails.emailEmpresa}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(selectedSubForDetails.beneficios || (selectedSubForDetails as any).funcionalidades) && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Benefícios do Plano</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(selectedSubForDetails.beneficios || (selectedSubForDetails as any).funcionalidades).map((beneficio: any, idx: number) => (
                    <li key={idx} className="flex items-start text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>{beneficio}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedSubForDetails.contratoPath && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-slate-500" />
                  Contrato do Plano
                </h3>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-slate-700 border-slate-200 hover:bg-slate-50"
                  onClick={() => handleDownloadContract(selectedSubForDetails.contratoPath as string)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Contrato PDF
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        initialSignature={acceptForm.signatureDataUrl}
        onSave={(dataUrl) => setAcceptForm((prev) => ({ ...prev, signatureDataUrl: dataUrl }))}
      />

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        initialPhoto={acceptForm.photoDataUrl}
        onCapture={(dataUrl) => setAcceptForm((prev) => ({ ...prev, photoDataUrl: dataUrl }))}
      />

    </UserLayout>
  );
};
