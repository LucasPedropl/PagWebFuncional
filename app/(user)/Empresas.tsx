
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Store, Mail, FileText, Loader2, LogOut, AlertTriangle, Calendar, CreditCard, Filter, Search, Download, Repeat, PenLine, Camera, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientConnection, ClientSubscription, PlanResponse } from '../../types';
import { useToast } from '../../context/ToastContext';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { formFilterInputClass, formSearchInputClass, resolveFormFieldClass } from '../../components/ui/formStyles';
import { SignaturePadModal } from '../../components/ui/SignaturePadModal';
import { CameraCaptureModal } from '../../components/ui/CameraCaptureModal';
import {
  getContractUrl,
  getImageUrl,
  getPlanTipoContrato,
  requiresContractAckType,
  requiresSignedContractType,
} from '../../utils/api';
import {
  buildContractPdfWithEvidence,
  buildSignedContractFile,
  downloadBlob,
} from '../../utils/contractPdf';
import { PlanChatRequestModal } from '../../components/features/plans/PlanChatRequestModal';
import { PlanSubscribedTag } from '../../components/features/plans/PlanSubscribedTag';
import { usePlanChatRequestModal } from '../../hooks/usePlanChatRequestModal';
import {
  allowsClientSelfSubscribe,
  hasBlockingSubscription,
  needsChatRequestForPlan,
} from '../../utils/planSubscribeEligibility';
import { PlanChatRequestReason } from '../../utils/planChatRequest';

export const Empresas: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const planChatRequest = usePlanChatRequestModal();
  const [companies, setCompanies] = useState<ClientConnection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [companyToUnlink, setCompanyToUnlink] = useState<ClientConnection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ClientConnection | null>(null);
  const [companySubscriptions, setCompanySubscriptions] = useState<ClientSubscription[]>([]);
  const [companyPlans, setCompanyPlans] = useState<PlanResponse[]>([]);
  const [plansByCompanyId, setPlansByCompanyId] = useState<Record<number, PlanResponse[]>>({});
  const [allClientSubscriptions, setAllClientSubscriptions] = useState<ClientSubscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'assinaturas' | 'planos'>('assinaturas');

  // Subscribe Modal State
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeForm, setSubscribeForm] = useState({
    periodo: '12',
    diaPagamento: Math.min(new Date().getDate(), 30).toString(),
    isRecorrente: true,
    aceitouTermos: false,
    signatureDataUrl: null as string | null,
    photoDataUrl: null as string | null,
  });
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [subscribeStep, setSubscribeStep] = useState(0);
  const [mergedContractPdfUrl, setMergedContractPdfUrl] = useState<string | null>(null);
  const [mergedContractBlob, setMergedContractBlob] = useState<Blob | null>(null);
  const [isBuildingMergedPdf, setIsBuildingMergedPdf] = useState(false);

  const [isAccepting, setIsAccepting] = useState<number | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const data = await userService.listConnections();
      setCompanies(data);
      preloadCompanyDetails(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadCompanyDetails = async (connections: ClientConnection[]) => {
    const activeCompanies = connections.filter(
      (c) => c.status !== 'Pendente' && c.idEmpresa
    );

    try {
      const subs = await userService.listClientSubscriptions();
      setAllClientSubscriptions(subs);
    } catch (error) {
      console.error('Erro ao pré-carregar assinaturas', error);
    }

    if (activeCompanies.length === 0) return;

    const results = await Promise.allSettled(
      activeCompanies.map(async (company) => {
        const plans = await userService.listCompanyPlans(company.idEmpresa);
        return { idEmpresa: company.idEmpresa, plans };
      })
    );

    const plansMap: Record<number, PlanResponse[]> = {};
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        plansMap[result.value.idEmpresa] = result.value.plans;
      }
    });
    setPlansByCompanyId((prev) => ({ ...prev, ...plansMap }));
  };

  const refreshCompanyDetails = async (company: ClientConnection) => {
    try {
      const [allSubs, plans] = await Promise.all([
        userService.listClientSubscriptions(),
        userService.listCompanyPlans(company.idEmpresa),
      ]);

      setAllClientSubscriptions(allSubs);
      setPlansByCompanyId((prev) => ({ ...prev, [company.idEmpresa]: plans }));
      setCompanySubscriptions(
        allSubs.filter((sub) => sub.nomeEmpresa === company.nomeEmpresa)
      );
      setCompanyPlans(plans);
    } catch (error) {
      console.error('Erro ao carregar dados', error);
      addToast('error', 'Erro', 'Não foi possível carregar as informações do estabelecimento.');
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleAcceptConnection = async (idEmpresa: number) => {
    try {
      setIsAccepting(idEmpresa);
      await userService.acceptConnection(idEmpresa);
      addToast('success', 'Sucesso', 'Conexão aceita com sucesso.');
      
      // Notificar Sidebar para atualizar badges
      window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
      
      await fetchConnections();
    } catch (error: any) {
      addToast('error', 'Erro', error.message);
    } finally {
      setIsAccepting(null);
    }
  };

  const handleUnlinkClick = (company: ClientConnection) => {
      setCompanyToUnlink(company);
      setIsUnlinkModalOpen(true);
  };

  const handleDetailsClick = (company: ClientConnection) => {
    setSelectedCompany(company);
    setActiveTab('planos');
    setIsDetailsModalOpen(true);

    const cachedPlans = plansByCompanyId[company.idEmpresa];
    const cachedSubs = allClientSubscriptions.filter(
      (sub) => sub.nomeEmpresa === company.nomeEmpresa
    );

    setCompanyPlans(cachedPlans ?? []);
    setCompanySubscriptions(cachedSubs);

    if (cachedPlans !== undefined) {
      setIsLoadingSubscriptions(false);
      refreshCompanyDetails(company);
      return;
    }

    setIsLoadingSubscriptions(true);
    refreshCompanyDetails(company);
  };

  const getPlanChatRequestReason = (plan: PlanResponse): PlanChatRequestReason => {
    if (!allowsClientSelfSubscribe(plan)) return 'company_only';
    if (hasBlockingSubscription(plan, companySubscriptions)) return 'already_subscribed';
    return 'interest';
  };

  const openPlanChatRequest = (company: ClientConnection, plan: PlanResponse) => {
    planChatRequest.open({
      idEmpresa: company.idEmpresa,
      establishmentName: company.nomeEmpresa,
      idPlano: plan.idPlano,
      planName: plan.nome,
      price: plan.valorMensalidade,
      reason: getPlanChatRequestReason(plan),
    });
  };

  const openPlanQuestionsChat = (company: ClientConnection, plan: PlanResponse) => {
    planChatRequest.open({
      idEmpresa: company.idEmpresa,
      establishmentName: company.nomeEmpresa,
      idPlano: plan.idPlano,
      planName: plan.nome,
      price: plan.valorMensalidade,
      reason: 'questions',
    });
  };

  const handleOpenChat = (company: ClientConnection) => {
    navigate(
      `/chat?companyId=${company.idEmpresa}&companyName=${encodeURIComponent(company.nomeEmpresa)}`
    );
  };

  const handleSubscribeClick = (plan: PlanResponse) => {
    if (!selectedCompany) return;

    if (selectedCompany.status !== 'Ativo') {
      addToast(
        'error',
        'Conexão pendente',
        'Aceite ou aguarde a aprovação da conexão com este estabelecimento antes de assinar um plano.'
      );
      return;
    }

    if (needsChatRequestForPlan(plan, companySubscriptions)) {
      openPlanChatRequest(selectedCompany, plan);
      return;
    }

    setSelectedPlan(plan);
    setSubscribeForm({
      periodo: '12',
      diaPagamento: Math.min(new Date().getDate(), 30).toString(),
      isRecorrente: true,
      aceitouTermos: false,
      signatureDataUrl: null,
      photoDataUrl: null,
    });
    setSubscribeStep(0);
    setIsSubscribeModalOpen(true);
  };

  const hasContractStep = (plan: any) =>
    Boolean(plan?.contratoPath) || requiresContractAck(plan);

  const getSubscribeSteps = (plan: any) => {
    const steps = [
      { id: 'plano', label: 'Plano' },
      { id: 'config', label: 'Pagamento' },
    ];
    if (hasContractStep(plan)) {
      steps.push({ id: 'contrato', label: 'Contrato' });
    }
    steps.push({ id: 'confirmacao', label: 'Confirmar' });
    return steps;
  };

  const requiresSignedContract = (plan: { tipoContrato?: number; TipoContrato?: number }) =>
    requiresSignedContractType(getPlanTipoContrato(plan));

  const requiresContractAck = (plan: { tipoContrato?: number; TipoContrato?: number }) =>
    requiresContractAckType(getPlanTipoContrato(plan));

  const validateSubscribeStep = (): boolean => {
    if (!selectedPlan) return false;

    const steps = getSubscribeSteps(selectedPlan);
    const current = steps[subscribeStep];
    if (!current) return false;

    if (current.id === 'config') {
      const dia = Number(subscribeForm.diaPagamento);
      if (dia < 1 || dia > 30) {
        addToast('error', 'Pagamento', 'Dia de pagamento deve ser entre 1 e 30.');
        return false;
      }
      if (!subscribeForm.isRecorrente) {
        const periodo = Number(subscribeForm.periodo);
        if (!periodo || periodo < 1) {
          addToast('error', 'Pagamento', 'Informe um período válido em meses.');
          return false;
        }
      }
    }

    if (current.id === 'contrato') {
      if (requiresSignedContract(selectedPlan)) {
        if (!subscribeForm.signatureDataUrl) {
          addToast('error', 'Contrato', 'Desenhe sua assinatura antes de continuar.');
          return false;
        }
        if (!subscribeForm.photoDataUrl) {
          addToast('error', 'Contrato', 'Registre sua foto antes de continuar.');
          return false;
        }
      }
      if (requiresContractAck(selectedPlan) && !subscribeForm.aceitouTermos) {
        addToast('error', 'Contrato', 'Aceite os termos do contrato antes de continuar.');
        return false;
      }
    }

    return true;
  };

  const goNextSubscribeStep = () => {
    if (!validateSubscribeStep() || !selectedPlan) return;
    const steps = getSubscribeSteps(selectedPlan);
    setSubscribeStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goPrevSubscribeStep = () => {
    setSubscribeStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (!isSubscribeModalOpen || !selectedPlan) return;

    const steps = getSubscribeSteps(selectedPlan);
    const current = steps[subscribeStep];

    if (current?.id !== 'confirmacao') {
      setMergedContractPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMergedContractBlob(null);
      return;
    }

    if (!requiresSignedContract(selectedPlan)) {
      setMergedContractPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMergedContractBlob(null);
      return;
    }

    const hasEvidence =
      subscribeForm.signatureDataUrl || subscribeForm.photoDataUrl;

    if (!hasEvidence && !selectedPlan.contratoPath) {
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
          selectedPlan.contratoPath ?? null,
          subscribeForm.signatureDataUrl,
          subscribeForm.photoDataUrl
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
    isSubscribeModalOpen,
    selectedPlan,
    subscribeStep,
    subscribeForm.signatureDataUrl,
    subscribeForm.photoDataUrl,
    addToast,
  ]);

  const closeSubscribeModal = () => {
    setMergedContractPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMergedContractBlob(null);
    setIsSubscribeModalOpen(false);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;

    if (requiresContractAck(selectedPlan) && !subscribeForm.aceitouTermos) {
      addToast('error', 'Contrato', 'Você precisa ler e aceitar o contrato/termo antes de assinar.');
      return;
    }

    if (requiresSignedContract(selectedPlan)) {
      if (!subscribeForm.signatureDataUrl) {
        addToast('error', 'Contrato', 'Desenhe sua assinatura no contrato antes de continuar.');
        return;
      }
      if (!subscribeForm.photoDataUrl) {
        addToast('error', 'Contrato', 'Registre sua foto antes de continuar.');
        return;
      }
      if (isBuildingMergedPdf) {
        addToast('error', 'Contrato', 'Aguarde a montagem do PDF com assinatura e foto.');
        return;
      }
      if (!mergedContractBlob) {
        addToast(
          'error',
          'Contrato',
          'O PDF com assinatura e foto ainda não está pronto. Aguarde ou volte à etapa do contrato.',
        );
        return;
      }
    }

    setIsSubscribing(true);
    try {
      const periodo = subscribeForm.isRecorrente
        ? 0
        : Math.max(1, Number(subscribeForm.periodo));

      let contratoFile: File | null = null;
      if (requiresSignedContract(selectedPlan)) {
        contratoFile = new File([mergedContractBlob!], 'contrato-assinado.pdf', {
          type: 'application/pdf',
        });
        if (contratoFile.size === 0) {
          throw new Error('O PDF do contrato assinado está vazio.');
        }
      }

      await userService.assinarPlano({
        idPlano: selectedPlan.idPlano,
        idEmpresa: selectedCompany.idEmpresa,
        periodo,
        diaPagamento: Math.min(30, Math.max(1, Number(subscribeForm.diaPagamento))),
        contrato: contratoFile,
        observacao: subscribeForm.isRecorrente ? 'Assinatura recorrente' : undefined,
      });
      addToast('success', 'Assinatura Realizada', `Você assinou o ${selectedPlan?.nome} com sucesso!`);
      closeSubscribeModal();
      
      if (selectedCompany) {
        const allSubs = await userService.listClientSubscriptions();
        setAllClientSubscriptions(allSubs);
        setCompanySubscriptions(
          allSubs.filter((sub) => sub.nomeEmpresa === selectedCompany.nomeEmpresa)
        );
      }
      
      setActiveTab('assinaturas');
    } catch (error: any) {
      addToast('error', 'Erro ao assinar', error.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const confirmUnlink = async () => {
      if (!companyToUnlink || !companyToUnlink.idEmpresa) {
        if (!companyToUnlink?.idEmpresa) {
            addToast('error', 'Erro', 'Identificador da empresa não encontrado.');
            setIsUnlinkModalOpen(false);
            return;
        }
      }
      
      try {
          setIsProcessing(true);
          await userService.unlinkCompany(companyToUnlink.idEmpresa);
          addToast('success', 'Sucesso', 'Vínculo com o estabelecimento removido.');
          
          // Notificar Sidebar para atualizar badges
          window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
          
          await fetchConnections();
          setIsUnlinkModalOpen(false);
          setCompanyToUnlink(null);
      } catch (error: any) {
          addToast('error', 'Erro ao desvincular', error.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDownloadContract = (path: string) => {
    if (!path) {
        addToast('error', 'Indisponível', 'Este plano não possui um contrato digital anexado.');
        return;
    }
    window.open(getContractUrl(path), '_blank');
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = (c.nomeEmpresa && c.nomeEmpresa.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (c.cnpjEmpresa && c.cnpjEmpresa.includes(searchTerm));
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
    if (b.status === 'Pendente' && a.status !== 'Pendente') return 1;
    return 0;
  });

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
        <p className="text-gray-500 mt-1">Lojas e empresas onde você possui cadastro ou assinaturas.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Store className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-gray-500 max-w-sm mb-6">
                Nenhum estabelecimento corresponde aos filtros aplicados.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 font-bold text-xl uppercase overflow-hidden border border-gray-100">
                            {company.logo ? (
                                <img src={getImageUrl(company.logo)} alt="Logo" className="w-full h-full object-contain p-1" />
                            ) : (
                                company.nomeEmpresa.substring(0,2)
                            )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            company.status === 'Ativo' ? 'bg-green-100 text-green-800' : 
                            company.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {company.status}
                        </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{company.nomeEmpresa}</h3>
                    <p className="text-xs text-gray-500 mb-4">Resp: {company.nomeDono}</p>

                    <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Mail className="w-3.5 h-3.5 mr-2" /> {company.emailEmpresa}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                        <FileText className="w-3.5 h-3.5 mr-2" /> {formatCNPJ(company.cnpjEmpresa)}
                    </div>

                    <div className="mt-auto flex gap-2">
                        {company.status === 'Pendente' && (
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAcceptConnection(company.idEmpresa)}
                                isLoading={isAccepting === company.idEmpresa}
                            >
                                Aceitar Conexão
                            </Button>
                        )}
                        {company.status !== 'Pendente' && (
                          <div className="flex gap-2 w-full">
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleDetailsClick(company)}
                            >
                                Ver Detalhes
                            </Button>
                            <Button
                                variant="outline"
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0"
                                title="Conversar no Chat"
                                onClick={() => handleOpenChat(company)}
                            >
                                <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <Button 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50 hover:border-red-200"
                            title="Desvincular do estabelecimento"
                            onClick={() => handleUnlinkClick(company)}
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Modal Confirmar Desvínculo */}
      <Modal
        isOpen={isUnlinkModalOpen}
        onClose={() => setIsUnlinkModalOpen(false)}
        title="Desvincular Estabelecimento"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsUnlinkModalOpen(false)} disabled={isProcessing}>Cancelar</Button>
            <Button 
                onClick={confirmUnlink} 
                isLoading={isProcessing} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Confirmar Saída
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
                Ao se desvincular de <strong>{companyToUnlink?.nomeEmpresa}</strong>, você perderá acesso ao histórico de faturas e suas assinaturas ativas nesta empresa poderão ser canceladas.
            </p>
         </div>
      </Modal>

      {/* Modal Detalhes da Empresa */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes do Estabelecimento"
        size="xl"
        footer={
            <Button onClick={() => setIsDetailsModalOpen(false)}>Fechar</Button>
        }
      >
        {selectedCompany && (
            <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-slate-700 font-bold text-2xl uppercase border border-gray-200 shadow-sm overflow-hidden">
                            {selectedCompany.logo ? (
                                <img src={getImageUrl(selectedCompany.logo)} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                selectedCompany.nomeEmpresa.substring(0,2)
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedCompany.nomeEmpresa}</h3>
                            <p className="text-sm text-gray-500">Responsável: {selectedCompany.nomeDono}</p>
                            <div className="flex flex-wrap gap-4 mt-2">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FileText className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {formatCNPJ(selectedCompany.cnpjEmpresa)}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {selectedCompany.emailEmpresa}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 text-xs py-1.5 shrink-0"
                        onClick={() => {
                            setIsDetailsModalOpen(false);
                            handleOpenChat(selectedCompany);
                        }}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Conversar
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'planos'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveTab('planos')}
                    >
                        Planos Disponíveis
                    </button>
                    <button
                        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'assinaturas'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveTab('assinaturas')}
                    >
                        Minhas Assinaturas
                    </button>
                </div>

                <div className="pt-2">
                    {activeTab === 'planos' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Store className="w-4 h-4 mr-2" />
                                Escolha um plano para assinar
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {companyPlans.map((plan) => (
                                    <div key={plan.idPlano} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden h-[300px]">
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 rounded-bl-full -z-10"></div>
                                        {hasBlockingSubscription(plan, companySubscriptions) && (
                                          <PlanSubscribedTag className="absolute top-3 right-3 z-10 shadow-sm" />
                                        )}

                                        <div
                                          className={`flex justify-between items-start gap-2 ${
                                            hasBlockingSubscription(plan, companySubscriptions) ? 'pr-20' : ''
                                          }`}
                                        >
                                            <h5 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1 min-w-0">{plan.nome}</h5>
                                            {plan.contratoPath && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadContract(plan.contratoPath); }}
                                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                                    title="Baixar Contrato PDF"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-1 mb-2">
                                            <span className="text-lg font-extrabold text-gray-900">R$ {(plan.valorMensalidade || 0).toFixed(2).replace('.', ',')}</span>
                                            <span className="text-[10px] text-gray-500 ml-1">/mês</span>
                                        </div>

                                        <div className="flex-grow overflow-y-auto mb-3 pr-1 custom-scrollbar">
                                            <ul className="space-y-1">
                                                {plan.funcionalidades?.map((func: string, idx: number) => (
                                                    <li key={idx} className="flex items-start text-[12px] text-gray-600 leading-tight">
                                                        <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 mr-2 shrink-0"></div>
                                                        <span>{func}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                          <div className="mt-auto flex gap-2 w-full">
                                             <div className="flex-1">
                                                {selectedCompany &&
                                                needsChatRequestForPlan(plan, companySubscriptions) ? (
                                                  <Button
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 h-9 font-semibold"
                                                    onClick={() => {
                                                      setIsDetailsModalOpen(false);
                                                      openPlanChatRequest(selectedCompany, plan);
                                                    }}
                                                  >
                                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 inline" />
                                                    Solicitar no chat
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 h-9"
                                                    onClick={() => handleSubscribeClick(plan)}
                                                  >
                                                    Assinar Agora
                                                  </Button>
                                                )}
                                             </div>
                                             {!needsChatRequestForPlan(plan, companySubscriptions) && (
                                             <Button
                                               variant="outline"
                                               className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0 p-2.5 h-9"
                                               title="Tirar dúvidas no chat"
                                               onClick={() => {
                                                 setIsDetailsModalOpen(false);
                                                 if (selectedCompany) {
                                                   openPlanQuestionsChat(selectedCompany, plan);
                                                 }
                                               }}
                                             >
                                               <MessageSquare className="w-4 h-4" />
                                             </Button>
                                             )}
                                          </div>
                                    </div>
                                ))}
                                {companyPlans.length === 0 && (
                                    <div className="col-span-full text-center py-6 text-gray-500">
                                        Nenhum plano disponível no momento.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'assinaturas' && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Assinaturas Ativas
                            </h4>
                            
                            {isLoadingSubscriptions ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            ) : companySubscriptions.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center">
                                    <p className="text-gray-500 text-sm mb-4">Você ainda não possui assinaturas neste estabelecimento.</p>
                                    <Button variant="outline" onClick={() => setActiveTab('planos')}>
                                        Ver Planos Disponíveis
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {companySubscriptions.map((sub) => (
                                        <div key={sub.idAssinatura} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h5 className="font-medium text-gray-900">{sub.nomePlano}</h5>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                        <span className="flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            Início: {formatDate(sub.dataInicio)}
                                                        </span>
                                                        {sub.dataFim && (
                                                            <span className="flex items-center">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {sub.dataFim.startsWith('0001-01-01') 
                                                                    ? 'Assinatura recorrente' 
                                                                    : `Fim: ${formatDate(sub.dataFim)}`
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block font-bold text-slate-900">{formatCurrency(sub.valorMensal)}/mês</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${
                                                        sub.status === 'Ativa' ? 'bg-green-100 text-green-800' : 
                                                        sub.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {sub.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
      </Modal>

      {/* Modal Confirmar Assinatura — wizard em etapas */}
      <Modal
        isOpen={isSubscribeModalOpen}
        onClose={closeSubscribeModal}
        title={
          selectedPlan
            ? `Assinar plano — etapa ${subscribeStep + 1} de ${getSubscribeSteps(selectedPlan).length}`
            : 'Assinar plano'
        }
        size="lg"
        footer={
          selectedPlan && selectedCompany ? (() => {
            const steps = getSubscribeSteps(selectedPlan);
            const isFirst = subscribeStep === 0;
            const isLast = subscribeStep === steps.length - 1;

            return (
              <>
                <Button
                  variant="outline"
                  onClick={() => (isFirst ? closeSubscribeModal() : goPrevSubscribeStep())}
                  disabled={isSubscribing}
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
                    onClick={confirmSubscription}
                    isLoading={isSubscribing}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Confirmar Assinatura
                  </Button>
                ) : (
                  <Button
                    onClick={goNextSubscribeStep}
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
        {selectedPlan && selectedCompany && (() => {
          const steps = getSubscribeSteps(selectedPlan);
          const currentStep = steps[subscribeStep];

          return (
            <div className="space-y-4">
              {/* Stepper */}
              <div className="flex items-center justify-between gap-1 px-1">
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          index < subscribeStep
                            ? 'bg-green-600 text-white'
                            : index === subscribeStep
                              ? 'bg-slate-900 text-white'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {index < subscribeStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className={`text-[10px] mt-1 truncate w-full text-center ${
                        index === subscribeStep ? 'text-slate-900 font-medium' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 mb-4 ${index < subscribeStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* Etapa 1 — Plano */}
                {currentStep.id === 'plano' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedPlan.nome}</h3>
                      <p className="text-sm text-gray-500">{selectedCompany.nomeEmpresa}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        R$ {(selectedPlan.valorMensalidade || 0).toFixed(2).replace('.', ',')}
                        <span className="text-sm font-normal text-gray-500">/mês</span>
                      </p>
                    </div>

                    {selectedPlan.funcionalidades?.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Incluso no plano</p>
                        <ul className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                          {selectedPlan.funcionalidades.map((func: string, idx: number) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
                              <span>{func}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Etapa 2 — Pagamento */}
                {currentStep.id === 'config' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Configuração de pagamento</h3>
                      <p className="text-sm text-gray-500 mt-1">Defina o período e o dia de cobrança.</p>
                    </div>

                    <label className="flex items-center cursor-pointer gap-2 select-none p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={subscribeForm.isRecorrente}
                        onChange={(e) => setSubscribeForm((prev) => ({ ...prev, isRecorrente: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-slate-900 accent-slate-900"
                      />
                      <span className="flex items-center text-sm text-gray-700 font-medium">
                        <Repeat className="w-4 h-4 mr-2 text-slate-500" />
                        Assinatura recorrente (sem data de término)
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Período (meses)</label>
                        <input
                          type="number"
                          min={1}
                          value={subscribeForm.periodo}
                          onChange={(e) => setSubscribeForm((prev) => ({ ...prev, periodo: e.target.value }))}
                          disabled={subscribeForm.isRecorrente}
                          className={resolveFormFieldClass({
                            disabled: subscribeForm.isRecorrente,
                            className: 'text-sm',
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Dia de pagamento</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={subscribeForm.diaPagamento}
                          onChange={(e) => setSubscribeForm((prev) => ({ ...prev, diaPagamento: e.target.value }))}
                          className={formFilterInputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Etapa 3 — Contrato */}
                {currentStep.id === 'contrato' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {requiresSignedContract(selectedPlan) ? 'Contrato do plano' : 'Termo de adesão'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {requiresSignedContract(selectedPlan)
                          ? 'Leia o contrato, desenhe sua assinatura e registre sua foto.'
                          : 'Leia o termo de adesão e marque que concorda para continuar.'}
                      </p>
                    </div>

                    {selectedPlan.contratoPath ? (
                      <>
                        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                          <iframe
                            src={getContractUrl(selectedPlan.contratoPath)}
                            title="Contrato do plano"
                            className="w-full h-40"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-sm py-2"
                          onClick={() => handleDownloadContract(selectedPlan.contratoPath)}
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

                    {requiresSignedContract(selectedPlan) && (
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

                    {requiresSignedContract(selectedPlan) &&
                      (subscribeForm.signatureDataUrl || subscribeForm.photoDataUrl) && (
                      <div className="grid grid-cols-2 gap-3">
                        {subscribeForm.signatureDataUrl && (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-2">
                            <p className="text-[11px] font-medium text-green-800 mb-1 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Assinatura
                            </p>
                            <img
                              src={subscribeForm.signatureDataUrl}
                              alt="Assinatura"
                              className="w-full h-14 object-contain bg-white rounded border border-green-100"
                            />
                          </div>
                        )}
                        {subscribeForm.photoDataUrl && (
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                            <p className="text-[11px] font-medium text-blue-800 mb-1 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Foto
                            </p>
                            <img
                              src={subscribeForm.photoDataUrl}
                              alt="Foto do usuário"
                              className="w-full h-14 object-cover bg-white rounded border border-blue-100"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {requiresContractAck(selectedPlan) && (
                      <label className="flex items-start gap-2 text-sm text-gray-600 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={subscribeForm.aceitouTermos}
                          onChange={(e) => setSubscribeForm((prev) => ({ ...prev, aceitouTermos: e.target.checked }))}
                          className="mt-0.5"
                        />
                        Li e concordo com os termos/contrato deste plano.
                      </label>
                    )}
                  </div>
                )}

                {/* Etapa final — Confirmação */}
                {currentStep.id === 'confirmacao' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Revise antes de confirmar</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {requiresSignedContract(selectedPlan)
                          ? 'Confira os dados e o contrato com assinatura e foto na última página.'
                          : 'Confira os dados e o termo de adesão antes de confirmar.'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estabelecimento</span>
                        <span className="font-medium text-gray-900 text-right">{selectedCompany.nomeEmpresa}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plano</span>
                        <span className="font-medium text-gray-900">{selectedPlan.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor mensal</span>
                        <span className="font-bold text-slate-900">
                          R$ {(selectedPlan.valorMensalidade || 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tipo</span>
                        <span className="font-medium text-gray-900">
                          {subscribeForm.isRecorrente ? 'Recorrente' : `${subscribeForm.periodo} meses`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dia de pagamento</span>
                        <span className="font-medium text-gray-900">Dia {subscribeForm.diaPagamento}</span>
                      </div>
                    </div>

                    {(mergedContractPdfUrl ||
                      selectedPlan.contratoPath ||
                      (requiresSignedContract(selectedPlan) &&
                        (subscribeForm.signatureDataUrl || subscribeForm.photoDataUrl))) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {requiresSignedContract(selectedPlan)
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
                                  `contrato-${selectedPlan.nome?.replace(/\s+/g, '-') ?? 'plano'}.pdf`
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
                        ) : selectedPlan.contratoPath ? (
                          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                            <iframe
                              src={getContractUrl(selectedPlan.contratoPath)}
                              title="Contrato do plano"
                              className="w-full h-56"
                            />
                          </div>
                        ) : null}

                        {requiresSignedContract(selectedPlan) && (
                          <p className="text-[11px] text-gray-400">
                            A última página do PDF contém sua foto e assinatura registradas neste formulário.
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 text-center">
                      Ao confirmar, você autoriza a cobrança conforme o plano selecionado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        initialSignature={subscribeForm.signatureDataUrl}
        onSave={(dataUrl) => setSubscribeForm((prev) => ({ ...prev, signatureDataUrl: dataUrl }))}
      />

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        initialPhoto={subscribeForm.photoDataUrl}
        onCapture={(dataUrl) => setSubscribeForm((prev) => ({ ...prev, photoDataUrl: dataUrl }))}
      />

      <PlanChatRequestModal
        isOpen={planChatRequest.isOpen}
        onClose={planChatRequest.close}
        onConfirm={planChatRequest.confirm}
        context={planChatRequest.context}
      />

    </UserLayout>
  );
};
