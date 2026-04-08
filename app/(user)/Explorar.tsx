import React, { useState, useMemo } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Search, MapPin, Star, Filter, Store, CheckCircle2, ChevronRight, CreditCard, ShieldCheck, Zap, LayoutGrid, List, Scissors } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// --- MOCK DATA GENERATOR ---
const CATEGORIES = ['Construção & Obras', 'Manutenção', 'Limpeza', 'Consultoria', 'Software & TI', 'Equipamentos', 'Saúde & Segurança', 'Salão de Beleza', 'Barbearia', 'Estética'];
const ADJECTIVES = ['Prime', 'Pro', 'Tech', 'Smart', 'Global', 'Nacional', 'Líder', 'Express', 'Master', 'Elite', 'Studio', 'Espaço', 'Concept', 'VIP'];
const NOUNS = ['Engenharia', 'Serviços', 'Soluções', 'Sistemas', 'Locações', 'Construtora', 'Consultoria', 'Logística', 'Manutenção', 'Facilities', 'Hair', 'Beauty', 'Barber', 'Estética'];

const generateMockData = () => {
  const establishments = [];
  const allPlans = [];
  let planIdCounter = 1;

  for (let i = 1; i <= 150; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const name = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]} ${i}`;
    const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
    const isConnected = Math.random() > 0.7; // 30% chance of being connected

    const establishment = {
      id: i,
      name,
      category,
      rating,
      reviews: Math.floor(Math.random() * 500) + 10,
      isConnected,
      image: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/400/300`,
      description: `Especialistas em ${category.toLowerCase()} com anos de experiência no mercado. Oferecemos as melhores soluções para o seu dia a dia.`,
      plans: [] as number[],
    };

    // Generate 2 to 4 plans for each establishment
    const numPlans = Math.floor(Math.random() * 3) + 2;
    for (let p = 0; p < numPlans; p++) {
      const planName = p === 0 ? 'Plano Básico' : p === 1 ? 'Plano Pro' : 'Plano Enterprise';
      const plan = {
        id: planIdCounter++,
        establishmentId: i,
        establishmentName: name,
        establishmentImage: establishment.image,
        category: category,
        name: planName,
        price: (Math.random() * 500 + 50).toFixed(2),
        description: `Acesso completo aos nossos serviços de ${category.toLowerCase()} com suporte dedicado e benefícios exclusivos.`,
        features: [
          'Atendimento prioritário',
          'Agendamento flexível',
          p > 0 ? 'Suporte 24/7' : 'Suporte em horário comercial',
          p > 1 ? 'Serviços VIP inclusos' : 'Acesso à plataforma'
        ]
      };
      allPlans.push(plan);
      establishment.plans.push(plan.id);
    }

    establishments.push(establishment);
  }

  return { establishments, allPlans };
};

const { establishments: MOCK_ESTABLISHMENTS, allPlans: MOCK_PLANS } = generateMockData();

export const Explorar: React.FC = () => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'estabelecimentos' | 'planos'>('estabelecimentos');
  
  // Modals
  const [selectedEstablishment, setSelectedEstablishment] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Filtering
  const filteredEstablishments = useMemo(() => {
    return MOCK_ESTABLISHMENTS.filter(est => {
      const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            est.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? est.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const filteredPlans = useMemo(() => {
    return MOCK_PLANS.filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            plan.establishmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            plan.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? plan.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleSubscribe = () => {
    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribing(false);
      setSelectedPlan(null);
      addToast('success', 'Assinatura Confirmada', `Você assinou o ${selectedPlan.name} com sucesso!`);
    }, 1500);
  };

  const handlePlanClick = (plan: any) => {
    const est = MOCK_ESTABLISHMENTS.find(e => e.id === plan.establishmentId);
    setSelectedEstablishment(est);
    setSelectedPlan(plan);
  };

  return (
    <UserLayout>
      {/* Header Section */}
      <div className="mb-6 md:mb-8 bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-48 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Explorar Serviços</h1>
          <p className="text-slate-300 max-w-2xl text-sm md:text-lg mb-6 md:mb-8">
            Descubra centenas de estabelecimentos e encontre os melhores planos de assinatura para você ou seu negócio.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar por nome, categoria ou serviço..." 
                className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-lg text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="py-3 md:py-4 px-6 md:px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg h-auto text-base md:text-lg w-full md:w-auto">
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-px overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('estabelecimentos')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'estabelecimentos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Store className="w-4 h-4" />
          Estabelecimentos
        </button>
        <button
          onClick={() => setActiveTab('planos')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'planos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Zap className="w-4 h-4" />
          Planos de Assinatura
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6 md:mb-8 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 min-w-max pb-2">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
              selectedCategory === null 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-gray-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-gray-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            {activeTab === 'estabelecimentos' ? 'Estabelecimentos em Destaque' : 'Planos Disponíveis'}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Mostrando {activeTab === 'estabelecimentos' ? filteredEstablishments.length : filteredPlans.length} resultados
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 self-start sm:self-auto">
          <Filter className="w-4 h-4" />
          <span>Filtrar</span>
        </div>
      </div>

      {/* Results Grid - Establishments */}
      {activeTab === 'estabelecimentos' && (
        filteredEstablishments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-100 shadow-sm">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhum resultado encontrado</h3>
            <p className="text-gray-500 mt-2 text-sm">Tente ajustar seus filtros ou termo de busca.</p>
            <Button variant="outline" className="mt-6" onClick={() => {setSearchTerm(''); setSelectedCategory(null);}}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredEstablishments.map((est) => (
              <div 
                key={est.id} 
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
                onClick={() => setSelectedEstablishment(est)}
              >
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <img 
                    src={est.image} 
                    alt={est.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className="bg-white/90 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold text-slate-800 shadow-sm">
                      {est.category}
                    </span>
                  </div>
                  {est.isConnected && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> <span className="hidden sm:inline">Conectado</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-base md:text-lg text-gray-900 line-clamp-1" title={est.name}>{est.name}</h3>
                    <div className="flex items-center bg-yellow-50 px-1.5 md:px-2 py-1 rounded text-yellow-700 text-xs font-bold shrink-0">
                      <Star className="w-3 h-3 fill-current mr-1" />
                      {est.rating}
                    </div>
                  </div>
                  
                  <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {est.description}
                  </p>
                  
                  <div className="pt-3 md:pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <span className="text-[10px] md:text-xs text-gray-500 font-medium">
                      {est.plans.length} planos disponíveis
                    </span>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Results Grid - Plans */}
      {activeTab === 'planos' && (
        filteredPlans.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-100 shadow-sm">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhum plano encontrado</h3>
            <p className="text-gray-500 mt-2 text-sm">Tente ajustar seus filtros ou termo de busca.</p>
            <Button variant="outline" className="mt-6" onClick={() => {setSearchTerm(''); setSelectedCategory(null);}}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredPlans.map((plan) => (
              <div 
                key={plan.id} 
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col cursor-pointer"
                onClick={() => handlePlanClick(plan)}
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
                    <span className="text-xs text-gray-500">{plan.category}</span>
                  </div>
                </div>

                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 text-lg">{plan.name}</h4>
                </div>
                <p className="text-xs md:text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-xl md:text-2xl font-extrabold text-gray-900">R$ {plan.price.replace('.', ',')}</span>
                  <span className="text-xs md:text-sm text-gray-500">/mês</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start text-xs md:text-sm text-gray-700">
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-gray-400 italic pl-6">
                      + {plan.features.length - 3} benefícios
                    </li>
                  )}
                </ul>

                <Button 
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 mt-auto border border-slate-200"
                >
                  Ver Detalhes
                </Button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Establishment Details Modal */}
      <Modal
        isOpen={!!selectedEstablishment && !selectedPlan}
        onClose={() => setSelectedEstablishment(null)}
        title="Detalhes do Estabelecimento"
        size="xl"
      >
        {selectedEstablishment && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <img 
                src={selectedEstablishment.image} 
                alt={selectedEstablishment.name} 
                className="w-full md:w-48 h-48 object-cover rounded-xl shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    {selectedEstablishment.category}
                  </span>
                  {selectedEstablishment.isConnected && (
                    <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Conectado
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{selectedEstablishment.name}</h2>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-bold text-gray-900 mr-1">{selectedEstablishment.rating}</span>
                    <span>({selectedEstablishment.reviews} avaliações)</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    Atendimento Nacional
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedEstablishment.description}
                </p>
              </div>
            </div>

            {/* Plans Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Planos de Assinatura
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedEstablishment.plans.map((planId: number) => {
                  const plan = MOCK_PLANS.find(p => p.id === planId);
                  if (!plan) return null;
                  
                  return (
                    <div key={plan.id} className="border border-gray-200 rounded-xl p-4 md:p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 text-base md:text-lg">{plan.name}</h4>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 mb-4 flex-1">{plan.description}</p>
                      
                      <div className="mb-4">
                        <span className="text-xl md:text-2xl font-extrabold text-gray-900">R$ {plan.price.replace('.', ',')}</span>
                        <span className="text-xs md:text-sm text-gray-500">/mês</span>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-xs md:text-sm text-gray-700">
                            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-auto"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        Selecionar Plano
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Subscribe Confirmation Modal */}
      <Modal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title="Confirmar Assinatura"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedPlan(null)} disabled={isSubscribing} className="w-full sm:w-auto">
              Voltar
            </Button>
            <Button 
              onClick={handleSubscribe} 
              isLoading={isSubscribing} 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto mt-2 sm:mt-0"
            >
              Confirmar e Pagar
            </Button>
          </>
        }
      >
        {selectedPlan && selectedEstablishment && (
          <div className="space-y-4 p-1 md:p-2">
            <div className="text-center mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Resumo da Assinatura</h3>
              <p className="text-gray-500 text-xs md:text-sm mt-1">Revise os detalhes antes de confirmar.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-100 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold text-slate-700 text-xs md:text-base">
                    {selectedEstablishment.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="block text-[10px] md:text-xs text-gray-500">Estabelecimento</span>
                    <span className="block font-bold text-gray-900 text-sm md:text-base line-clamp-1">{selectedEstablishment.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div>
                  <span className="block text-[10px] md:text-xs text-gray-500">Plano Selecionado</span>
                  <span className="block font-bold text-gray-900 text-sm md:text-base">{selectedPlan.name}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-gray-900">Total a pagar hoje</span>
                <span className="text-xl md:text-2xl font-black text-blue-600">R$ {selectedPlan.price.replace('.', ',')}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-blue-50 text-blue-800 p-3 md:p-4 rounded-lg text-xs md:text-sm">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 shrink-0 mt-0.5" />
              <p>
                A cobrança será feita no seu cartão de crédito padrão. A renovação ocorrerá automaticamente a cada mês.
              </p>
            </div>
          </div>
        )}
      </Modal>

    </UserLayout>
  );
};

