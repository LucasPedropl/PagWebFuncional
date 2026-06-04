import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Search,
  Filter,
  Store,
  Zap,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { CompanyBrandAvatar } from '../../components/ui/CompanyBrandAvatar';
import { ExploreEstablishmentCardItem } from '../../components/features/explore/ExploreEstablishmentCardItem';
import { ExplorePlanCardItem } from '../../components/features/explore/ExplorePlanCardItem';
import { PlanSubscribeModal } from '../../components/features/subscribe/PlanSubscribeModal';
import { PlanChatRequestModal } from '../../components/features/plans/PlanChatRequestModal';
import { usePublicCompanies } from '../../hooks/usePublicCompanies';
import { usePlanSubscribe } from '../../hooks/usePlanSubscribe';
import { usePlanChatRequestModal } from '../../hooks/usePlanChatRequestModal';
import { mapPublicCompanyToCard } from '../../utils/publicCompany';
import { userService } from '../../services/userService';
import {
  allowsClientSelfSubscribe,
  hasBlockingSubscription,
  needsChatRequestForPlan,
} from '../../utils/planSubscribeEligibility';
import { PlanChatRequestReason } from '../../utils/planChatRequest';
import {
  ClientSubscription,
  ExploreEstablishmentCard,
  ExplorePlanCard,
  PlanResponse,
} from '../../types';

export const Explorar: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { companies, isLoading, error, refresh } = usePublicCompanies();
  const [mySubscriptions, setMySubscriptions] = useState<ClientSubscription[]>([]);
  const subscribe = usePlanSubscribe({
    onSuccess: () => {
      void refreshConnections();
      void refreshSubscriptions();
    },
  });
  const planChatRequest = usePlanChatRequestModal();

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
  const [clientSubscriptions, setClientSubscriptions] = useState<ClientSubscription[]>([]);
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);

  const [selectedEstablishment, setSelectedEstablishment] =
    useState<ExploreEstablishmentCard | null>(null);
  const [establishmentPlans, setEstablishmentPlans] = useState<PlanResponse[]>([]);
  const [isLoadingEstablishmentPlans, setIsLoadingEstablishmentPlans] = useState(false);

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

    userService
      .listClientSubscriptions()
      .then((subs) => {
        setMySubscriptions(subs);
      })
      .catch((err) => console.error('[PagWeb] Erro ao carregar assinaturas:', err));
  }, []);

  const getChatRequestReason = (plan: PlanResponse): PlanChatRequestReason => {
    if (!allowsClientSelfSubscribe(plan)) return 'company_only';
    if (hasBlockingSubscription(plan, mySubscriptions)) return 'already_subscribed';
    return 'interest';
  };

  const openPlanChatRequest = (planCard: ExplorePlanCard) => {
    if (!planCard.plan) return;
    planChatRequest.open({
      idEmpresa: planCard.idEmpresa,
      establishmentName: planCard.establishmentName,
      idPlano: planCard.idPlano,
      planName: planCard.name,
      price: planCard.price,
      reason: getChatRequestReason(planCard.plan),
    });
  };

  const refreshConnections = async () => {
    try {
      const connections = await userService.listConnections();
      setConnectedIds(
        new Set(
          connections
            .filter((c) => c.status === 'Ativo' && c.idEmpresa)
            .map((c) => c.idEmpresa),
        ),
      );
    } catch (err) {
      console.error('[PagWeb] Erro ao carregar conexões:', err);
    }
  };

  const refreshSubscriptions = async () => {
    try {
      const subs = await userService.listClientSubscriptions();
      setMySubscriptions(subs);
    } catch (err) {
      console.error('[PagWeb] Erro ao carregar assinaturas:', err);
    }
  };

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
            establishmentLogoUrl: card.logoUrl,
            name: plan.nome,
            price: plan.valorMensalidade,
            features:
              plan.funcionalidades?.length > 0
                ? plan.funcionalidades
                : ['Plano disponível para contratação'],
            plan,
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
        plan.establishmentName.toLowerCase().includes(query) ||
        plan.features.some((f) => f.toLowerCase().includes(query));
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
      console.error('[PagWeb] Erro ao carregar planos:', err);
      addToast('error', 'Erro', 'Não foi possível carregar os planos deste estabelecimento.');
    } finally {
      setIsLoadingEstablishmentPlans(false);
    }
  };

  const handleSubscribePlan = async (planCard: ExplorePlanCard) => {
    setSubscribingPlanId(planCard.idPlano);
    try {
      await subscribe.openSubscribe({
        plan: planCard.plan,
        idEmpresa: planCard.idEmpresa,
        establishmentName: planCard.establishmentName,
        subscriptions: mySubscriptions,
      });
      setConnectedIds((prev) => new Set(prev).add(planCard.idEmpresa));
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleContactPlan = (planCard: ExplorePlanCard) => {
    if (!planCard.plan) return;
    planChatRequest.open({
      idEmpresa: planCard.idEmpresa,
      establishmentName: planCard.establishmentName,
      idPlano: planCard.idPlano,
      planName: planCard.name,
      price: planCard.price,
      reason: 'questions',
    });
  };

  const isPageLoading = isLoading || (activeTab === 'planos' && isLoadingPlans);

  return (
    <UserLayout>
      <div className="mb-6 md:mb-8 bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Explorar Serviços</h1>
          <p className="text-slate-300 max-w-2xl text-sm md:text-lg mb-6">
            Descubra estabelecimentos e assine planos sem sair desta página.
          </p>
          <div className="flex flex-col md:flex-row gap-3 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome, plano ou funcionalidade..."
                className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </Button>
          </div>
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 max-w-3xl">
              {activeTab === 'estabelecimentos' ? (
                <SearchSelect
                  options={[
                    { value: 'Todos', label: 'Todos' },
                    { value: 'Conectados', label: 'Já Conectados' },
                    { value: 'NaoConectados', label: 'Não Conectados' },
                  ]}
                  value={connectionStatus}
                  onChange={(val) => setConnectionStatus(val.toString())}
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min R$"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max R$"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <TabButton active={activeTab === 'estabelecimentos'} onClick={() => setActiveTab('estabelecimentos')} icon={<Store className="w-4 h-4" />}>
          Estabelecimentos
        </TabButton>
        <TabButton active={activeTab === 'planos'} onClick={() => setActiveTab('planos')} icon={<Zap className="w-4 h-4" />}>
          Planos
        </TabButton>
      </div>

      {isPageLoading ? (
        <StateBox icon={<Loader2 className="w-10 h-10 animate-spin text-blue-600" />} text="Carregando..." />
      ) : error ? (
        <StateBox
          icon={<AlertCircle className="w-10 h-10 text-red-500" />}
          text={error}
          action={<Button variant="outline" onClick={() => void refresh()}>Tentar novamente</Button>}
        />
      ) : activeTab === 'estabelecimentos' ? (
        filteredEstablishments.length === 0 ? (
          <StateBox icon={<Store className="w-12 h-12 text-gray-300" />} text="Nenhum estabelecimento encontrado." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredEstablishments.map((est) => (
              <ExploreEstablishmentCardItem
                key={est.idEmpresa}
                establishment={est}
                onClick={() => void openEstablishment(est)}
              />
            ))}
          </div>
        )
      ) : filteredPlans.length === 0 ? (
        <StateBox icon={<Zap className="w-12 h-12 text-gray-300" />} text="Nenhum plano encontrado." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredPlans.map((plan) => (
            <ExplorePlanCardItem
              key={`${plan.idEmpresa}-${plan.idPlano}`}
              plan={plan}
              isSubscribing={subscribingPlanId === plan.idPlano || subscribe.isConnecting}
              isAlreadySubscribed={
                !!plan.plan && hasBlockingSubscription(plan.plan, mySubscriptions)
              }
              needsChatRequest={
                !!plan.plan && needsChatRequestForPlan(plan.plan, mySubscriptions)
              }
              onRequestViaChat={() => openPlanChatRequest(plan)}
              onSubscribe={() => void handleSubscribePlan(plan)}
              onContact={() => handleContactPlan(plan)}
              onViewEstablishment={() => {
                const est = establishments.find((e) => e.idEmpresa === plan.idEmpresa);
                if (est) void openEstablishment(est);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedEstablishment}
        onClose={() => setSelectedEstablishment(null)}
        title="Detalhes do Estabelecimento"
        size="xl"
      >
        {selectedEstablishment && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <CompanyBrandAvatar
                  name={selectedEstablishment.name}
                  logoUrl={selectedEstablishment.logoUrl}
                  seed={selectedEstablishment.idEmpresa}
                  className="w-20 h-20 rounded-xl shrink-0"
                  textClassName="text-xl font-bold"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEstablishment.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{selectedEstablishment.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 text-xs py-1.5 shrink-0"
                onClick={() => {
                  setSelectedEstablishment(null);
                  navigate(`/chat?companyId=${selectedEstablishment.idEmpresa}&companyName=${encodeURIComponent(selectedEstablishment.name)}`);
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Conversar
              </Button>
            </div>
            {isLoadingEstablishmentPlans ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            ) : establishmentPlans.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum plano disponível.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {establishmentPlans.map((plan) => {
                  const card: ExplorePlanCard = {
                    idPlano: plan.idPlano,
                    idEmpresa: selectedEstablishment.idEmpresa,
                    establishmentName: selectedEstablishment.name,
                    establishmentLogoUrl: selectedEstablishment.logoUrl,
                    name: plan.nome,
                    price: plan.valorMensalidade,
                    features: plan.funcionalidades ?? [],
                    plan,
                  };
                  return (
                    <ExplorePlanCardItem
                      key={plan.idPlano}
                      plan={card}
                      isSubscribing={subscribingPlanId === plan.idPlano}
                      isAlreadySubscribed={hasBlockingSubscription(plan, mySubscriptions)}
                      needsChatRequest={needsChatRequestForPlan(plan, mySubscriptions)}
                      onRequestViaChat={() => openPlanChatRequest(card)}
                      onSubscribe={() => void handleSubscribePlan(card)}
                      onContact={() => handleContactPlan(card)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      <PlanSubscribeModal controller={subscribe} />

      <PlanChatRequestModal
        isOpen={planChatRequest.isOpen}
        onClose={planChatRequest.close}
        onConfirm={planChatRequest.confirm}
        context={planChatRequest.context}
      />
    </UserLayout>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 ${
      active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
    }`}
  >
    {icon}
    {children}
  </button>
);

const StateBox: React.FC<{
  icon: React.ReactNode;
  text: string;
  action?: React.ReactNode;
}> = ({ icon, text, action }) => (
  <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
    <div className="flex justify-center mb-4">{icon}</div>
    <p className="text-gray-500">{text}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
