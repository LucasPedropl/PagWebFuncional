
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Store, MapPin, Mail, FileText, Loader2, LogOut, AlertTriangle, Calendar, CreditCard, Filter, Search, Download, Info } from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientConnection, ClientSubscription } from '../../types';
import { useToast } from '../../context/ToastContext';
import { SearchSelect } from '../../components/ui/SearchSelect';

export const Empresas: React.FC = () => {
  const { addToast } = useToast();
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
  const [companyPlans, setCompanyPlans] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'assinaturas' | 'planos'>('assinaturas');

  // Subscribe Modal State
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [isAccepting, setIsAccepting] = useState<number | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const data = await userService.listConnections();
      setCompanies(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
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

  const handleDetailsClick = async (company: ClientConnection) => {
    setSelectedCompany(company);
    setActiveTab('planos'); // Default to plans to encourage subscription
    setIsDetailsModalOpen(true);
    setIsLoadingSubscriptions(true);
    try {
        const [allSubs, plans] = await Promise.all([
          userService.listClientSubscriptions(),
          userService.listCompanyPlans(company.idEmpresa)
        ]);
        
        // Filter subscriptions by company name
        const filtered = allSubs.filter(sub => sub.nomeEmpresa === company.nomeEmpresa);
        setCompanySubscriptions(filtered);
        setCompanyPlans(plans);
    } catch (error) {
        console.error("Erro ao carregar dados", error);
        addToast('error', 'Erro', 'Não foi possível carregar as informações do estabelecimento.');
    } finally {
        setIsLoadingSubscriptions(false);
    }
  };

  const handleSubscribeClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsSubscribeModalOpen(true);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;
    
    setIsSubscribing(true);
    try {
      await userService.assinarPlano(selectedPlan.idPlano);
      addToast('success', 'Assinatura Realizada', `Você assinou o ${selectedPlan?.nome} com sucesso!`);
      setIsSubscribeModalOpen(false);
      
      // Atualiza os dados para refletir a nova assinatura
      if (selectedCompany) {
        const allSubs = await userService.listClientSubscriptions();
        const filtered = allSubs.filter(sub => sub.nomeEmpresa === selectedCompany.nomeEmpresa);
        setCompanySubscriptions(filtered);
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
    const normalizedPath = path.replace(/\\/g, '/');
    const fullUrl = `https://lojas.vlks.com.br/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
    window.open(fullUrl, '_blank');
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
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 font-bold text-xl uppercase">
                            {company.nomeEmpresa.substring(0,2)}
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
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => handleDetailsClick(company)}
                            >
                                Ver Detalhes
                            </Button>
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
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-slate-700 font-bold text-2xl uppercase border border-gray-200 shadow-sm">
                        {selectedCompany.nomeEmpresa.substring(0,2)}
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
                                        
                                        <div className="flex justify-between items-start">
                                            <h5 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{plan.nome}</h5>
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

                                         <div className="mt-auto">
                                            <Button 
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 h-9"
                                                onClick={() => handleSubscribeClick(plan)}
                                            >
                                                Assinar Agora
                                            </Button>
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
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
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

      {/* Modal Confirmar Assinatura */}
      <Modal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        title="Confirmar Assinatura"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSubscribeModalOpen(false)} disabled={isSubscribing}>
                Cancelar
            </Button>
            <Button 
                onClick={confirmSubscription} 
                isLoading={isSubscribing} 
                className="bg-slate-900 hover:bg-slate-800 text-white"
            >
                Confirmar Assinatura
            </Button>
          </>
        }
      >
        {selectedPlan && selectedCompany && (
            <div className="space-y-4 p-2">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Você está quase lá!</h3>
                    <p className="text-gray-500 text-sm mt-1">Confirme os detalhes para assinar o plano.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-sm text-gray-500">Estabelecimento</span>
                        <span className="font-medium text-gray-900">{selectedCompany.nomeEmpresa}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-sm text-gray-500">Plano</span>
                        <span className="font-medium text-gray-900">{selectedPlan.nome}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-semibold text-gray-900">Total Mensal</span>
                        <span className="text-lg font-bold text-slate-900">R$ {(selectedPlan.valorMensalidade || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>

                {selectedPlan.funcionalidades && selectedPlan.funcionalidades.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">O que está incluso:</p>
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {selectedPlan.funcionalidades.map((func: string, idx: number) => (
                                <li key={idx} className="flex items-start text-xs text-gray-600">
                                    <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 mr-2 shrink-0"></div>
                                    <span>{func}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="text-xs text-gray-400 text-center mt-4">
                    Ao confirmar, você concorda com os termos de serviço e autoriza a cobrança recorrente no método de pagamento padrão.
                </p>
            </div>
        )}
      </Modal>

    </UserLayout>
  );
};
