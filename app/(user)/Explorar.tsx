import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Search,
  Filter,
  Store,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { usePublicCompanies } from '../../hooks/usePublicCompanies';
import { mapPublicCompanyToCard } from '../../utils/publicCompany';
import { userService } from '../../services/userService';
import {
  ExploreEstablishmentCard,
  ExplorePlanCard,
  PlanResponse,
} from '../../types';

export const Explorar: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { companies, isLoading, error, refresh } = usePublicCompanies();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'estabelecimentos' | 'planos'>('estabelecimentos');
  const [showFilters, setShowFilters] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Todos');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [connectedIds, setConnectedIds] = useState<Set<number>>(new Set());
  const [planCountByCompany, setPlanCountByCompany] = useState<Record<number, number>>({});
  const [allPlans, setAllPlans] = useState<ExplorePlanCard[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const [selectedEstablishment, setSelectedEstablishment] =
    useState<ExploreEstablishmentCard | null>(null);
  const [establishmentPlans, setEstablishmentPlans] = useState<PlanResponse[]>([]);
  const [isLoadingEstablishmentPlans, setIsLoadingEstablishmentPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ExplorePlanCard | null>(null);

  useEffect(() => {
    userService
      .listConnections()
      .then((connections) => {
        const ids = connections
          .filter((c) => c.status === 'Ativo' && c.idEmpresa)
          .map((c) => c.idEmpresa);
        setConnectedIds(new Set(ids));
      })
      .catch((err) => console.error('[PagWeb] Erro ao carregar conexões:', err));
  }, []);

  useEffect(() => {
    if (companies.length === 0) {
      setAllPlans([]);
      setPlanCountByCompany({});
      return;
    }

    let cancelled = false;
    setIsLoadingPlans(true);

    void (async () => {
      const results = await Promise.allSettled(
        companies.map(async (company) => {
          const plans = await userService.listCompanyPlans(company.idEmpresa);
          return { idEmpresa: company.idEmpresa, plans };
        }),
      );

      if (cancelled) return;

      const counts: Record<number, number> = {};
      const aggregated: ExplorePlanCard[] = [];

      results.forEach((result, index) => {
        const company = companies[index];
        const card = mapPublicCompanyToCard(company);

        if (result.status !== 'fulfilled') {
          counts[company.idEmpresa] = 0;
          return;
        }

        counts[company.idEmpresa] = result.value.plans.length;
        result.value.plans.forEach((plan) => {
          aggregated.push({
            idPlano: plan.idPlano,
            idEmpresa: company.idEmpresa,
            establishmentName: card.name,
            establishmentImage: card.image,
            name: plan.nome,
            price: plan.valorMensalidade,
            description: `Mensalidade de R$ ${plan.valorMensalidade.toFixed(2).replace('.', ',')}`,
            features: plan.funcionalidades?.length
              ? plan.funcionalidades
              : ['Plano disponível para contratação'],
          });
        });
      });

      setPlanCountByCompany(counts);
      setAllPlans(aggregated);
      setIsLoadingPlans(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [companies]);

  const establishments = useMemo(
    () =>
      companies.map((company) =>
        mapPublicCompanyToCard(company, {
          isConnected: connectedIds.has(company.idEmpresa),
          planCount: planCountByCompany[company.idEmpresa] ?? 0,
        }),
      ),
    [companies, connectedIds, planCountByCompany],
  );

  const filteredEstablishments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return establishments.filter((est) => {
      const matchesSearch =
        !query ||
        est.name.toLowerCase().includes(query) ||
        est.description.toLowerCase().includes(query);
      const matchesConnection =
        connectionStatus === 'Todos' ||
        (connectionStatus === 'Conectados' && est.isConnected) ||
        (connectionStatus === 'NaoConectados' && !est.isConnected);
      return matchesSearch && matchesConnection;
    });
  }, [establishments, searchTerm, connectionStatus]);

  const filteredPlans = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return allPlans.filter((plan) => {
      const matchesSearch =
        !query ||
        plan.name.toLowerCase().includes(query) ||
        plan.establishmentName.toLowerCase().includes(query);
      const matchesMin = !minPrice || plan.price >= Number(minPrice);
      const matchesMax = !maxPrice || plan.price <= Number(maxPrice);
      return matchesSearch && matchesMin && matchesMax;
    });
  }, [allPlans, searchTerm, minPrice, maxPrice]);

  const openEstablishment = async (est: ExploreEstablishmentCard) => {
    setSelectedEstablishment(est);
    setEstablishmentPlans([]);
    setIsLoadingEstablishmentPlans(true);
    try {
      const plans = await userService.listCompanyPlans(est.idEmpresa);
      setEstablishmentPlans(plans);
    } catch (err) {
      console.error('[PagWeb] Erro ao carregar planos da empresa:', err);
      addToast('error', 'Erro', 'Não foi possível carregar os planos deste estabelecimento.');
    } finally {
      setIsLoadingEstablishmentPlans(false);
    }
  };

  const handlePlanClick = async (plan: ExplorePlanCard) => {
    const est =
      establishments.find((e) => e.idEmpresa === plan.idEmpresa) ??
      mapPublicCompanyToCard(
        companies.find((c) => c.idEmpresa === plan.idEmpresa) ?? {
          idEmpresa: plan.idEmpresa,
          nome: plan.establishmentName,
          cnpj: '',
        },
      );
    setSelectedEstablishment(est);
    setSelectedPlan(plan);
    if (establishmentPlans.length === 0) {
      await openEstablishment(est);
    }
  };

  const handleGoToCompanies = () => {
    navigate('/empresas');
  };

  const isPageLoading = isLoading || (activeTab === 'planos' && isLoadingPlans);

  return (
    <UserLayout>
      <div className="mb-6 md:mb-8 bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Explorar Serviços</h1>
          <p className="text-slate-300 max-w-2xl text-sm md:text-lg mb-6 md:mb-8">
            Descubra estabelecimentos parceiros e encontre planos de assinatura disponíveis.
          </p>
          <div className="flex flex-col md:flex-row gap-3 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-lg text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm flex items-center justify-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'estabelecimentos' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Conexão</label>
                    <SearchSelect
                      options={[
                        { value: 'Todos', label: 'Todos' },
                        { value: 'Conectados', label: 'Já Conectados' },
                        { value: 'NaoConectados', label: 'Não Conectados' },
                      ]}
                      value={connectionStatus}
                      onChange={(val) => setConnectionStatus(val.toString())}
                      className="w-full"
                    />
                  </div>
                )}
                {activeTab === 'planos' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Valor Mensal (R$)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white text-sm"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConnectionStatus('Todos');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-px overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('estabelecimentos')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap ${
            activeTab === 'estabelecimentos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          <Store className="w-4 h-4" />
          Estabelecimentos
        </button>
        <button
          onClick={() => setActiveTab('planos')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap ${
            activeTab === 'planos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Zap className="w-4 h-4" />
          Planos de Assinatura
        </button>
      </div>

      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">
          {activeTab === 'estabelecimentos' ? 'Estabelecimentos' : 'Planos Disponíveis'}
        </h2>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          {activeTab === 'estabelecimentos'
            ? `${filteredEstablishments.length} resultado(s)`
            : `${filteredPlans.length} resultado(s)`}
        </p>
      </div>

      {isPageLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Erro ao carregar</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button variant="outline" onClick={() => void refresh()}>
            Tentar novamente
          </Button>
        </div>
      ) : activeTab === 'estabelecimentos' ? (
        filteredEstablishments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhum resultado encontrado</h3>
            <Button variant="outline" className="mt-6" onClick={() => setSearchTerm('')}>
              Limpar busca
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredEstablishments.map((est) => (
              <div
                key={est.idEmpresa}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col"
                onClick={() => void openEstablishment(est)}
              >
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <img
                    src={est.image}
                    alt={est.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {est.isConnected && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Conectado
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{est.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{est.description}</p>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {est.planCount} plano{est.planCount !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Nenhum plano encontrado</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={`${plan.idEmpresa}-${plan.idPlano}`}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 cursor-pointer flex flex-col"
              onClick={() => void handlePlanClick(plan)}
            >
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                <img
                  src={plan.establishmentImage}
                  alt={plan.establishmentName}
                  className="w-10 h-10 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{plan.establishmentName}</h4>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-2">{plan.name}</h4>
              <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{plan.description}</p>
              <div className="mb-4">
                <span className="text-2xl font-extrabold text-gray-900">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-gray-500">/mês</span>
              </div>
              <Button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200">
                Ver Detalhes
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedEstablishment && !selectedPlan}
        onClose={() => setSelectedEstablishment(null)}
        title="Detalhes do Estabelecimento"
        size="xl"
      >
        {selectedEstablishment && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <img
                src={selectedEstablishment.image}
                alt={selectedEstablishment.name}
                className="w-full md:w-48 h-48 object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEstablishment.name}</h2>
                <p className="text-gray-600 text-sm">{selectedEstablishment.description}</p>
                {selectedEstablishment.isConnected && (
                  <span className="inline-flex mt-3 items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Conectado
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Planos de Assinatura
              </h3>
              {isLoadingEstablishmentPlans ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : establishmentPlans.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum plano disponível no momento.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {establishmentPlans.map((plan) => (
                    <div key={plan.idPlano} className="border border-gray-200 rounded-xl p-4">
                      <h4 className="font-bold text-gray-900">{plan.nome}</h4>
                      <p className="text-2xl font-extrabold text-gray-900 mt-2">
                        R$ {plan.valorMensalidade.toFixed(2).replace('.', ',')}
                        <span className="text-sm text-gray-500 font-normal">/mês</span>
                      </p>
                      <Button
                        className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white"
                        onClick={handleGoToCompanies}
                      >
                        Assinar em Estabelecimentos
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title="Plano selecionado"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedPlan(null)} className="w-full sm:w-auto">
              Voltar
            </Button>
            <Button onClick={handleGoToCompanies} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              Ir para Estabelecimentos
            </Button>
          </>
        }
      >
        {selectedPlan && selectedEstablishment && (
          <div className="space-y-4">
            <div className="text-center">
              <ShieldCheck className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">{selectedPlan.name}</h3>
              <p className="text-gray-500 text-sm">{selectedEstablishment.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Valor mensal</span>
                <span className="text-xl font-black text-blue-600">
                  R$ {selectedPlan.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
              <CreditCard className="w-5 h-5 shrink-0" />
              <p>Para assinar este plano, acesse a área de Estabelecimentos vinculados à sua conta.</p>
            </div>
          </div>
        )}
      </Modal>
    </UserLayout>
  );
};
