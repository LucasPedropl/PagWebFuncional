import React, { useState, useMemo } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  Search, MapPin, Star, Filter, Store, CheckCircle2, 
  ChevronRight, CreditCard, ShieldCheck, Zap, Scissors, 
  Wrench, Laptop, HeartPulse, Sparkles, LayoutGrid, List
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// --- MOCK DATA GENERATOR ---
const CATEGORIES = [
  { name: 'Salão de Beleza', icon: Scissors },
  { name: 'Estética & Spa', icon: Sparkles },
  { name: 'Construção & Obras', icon: Wrench },
  { name: 'Software & TI', icon: Laptop },
  { name: 'Saúde & Bem-estar', icon: HeartPulse },
  { name: 'Manutenção', icon: Wrench },
  { name: 'Limpeza', icon: Sparkles },
];

const ADJECTIVES = ['Prime', 'Pro', 'Tech', 'Smart', 'Global', 'Studio', 'Espaço', 'Concept', 'Elite', 'Master'];
const NOUNS = ['Beauty', 'Hair', 'Barber', 'Engenharia', 'Soluções', 'Sistemas', 'Consultoria', 'Logística', 'Design', 'Spa'];

const generateMockData = () => {
  const establishments = [];
  const allPlans = [];
  let planIdCounter = 1;

  for (let i = 1; i <= 120; i++) {
    const catObj = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const name = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]} ${i}`;
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5 to 5.0
    const isConnected = Math.random() > 0.8; 
    const distance = (Math.random() * 15 + 0.5).toFixed(1);

    const establishment = {
      id: i,
      name,
      category: catObj.name,
      rating,
      reviews: Math.floor(Math.random() * 500) + 10,
      isConnected,
      distance,
      image: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/400/300`,
      description: `Especialistas em ${catObj.name.toLowerCase()} com atendimento premium. Transformando a sua experiência com profissionais altamente qualificados.`,
      plans: [] as number[],
    };

    const numPlans = Math.floor(Math.random() * 3) + 1; // 1 to 3 plans
    for (let p = 0; p < numPlans; p++) {
      const planName = p === 0 ? 'Plano Essencial' : p === 1 ? 'Plano Premium' : 'Plano VIP';
      const plan = {
        id: planIdCounter++,
        establishmentId: i,
        establishmentName: name,
        establishmentImage: establishment.image,
        category: catObj.name,
        name: planName,
        price: (Math.random() * 300 + 49.9).toFixed(2),
        description: `Acesso aos melhores serviços de ${catObj.name.toLowerCase()} com benefícios exclusivos.`,
        features: [
          'Atendimento prioritário',
          p > 0 ? 'Descontos em produtos' : 'Agendamento flexível',
          p > 1 ? 'Serviços ilimitados selecionados' : 'Suporte dedicado'
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
  const [viewMode, setViewMode] = useState<'estabelecimentos' | 'planos'>('estabelecimentos');
  
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
                            plan.establishmentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? plan.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleSubscribe = () => {
    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribing(false);
      setSelectedPlan(null);
      setSelectedEstablishment(null);
      addToast('success', 'Assinatura Confirmada', `Você assinou o ${selectedPlan.name} com sucesso!`);
    }, 1500);
  };

  const openPlanDetails = (plan: any) => {
    const est = MOCK_ESTABLISHMENTS.find(e => e.id === plan.establishmentId);
    setSelectedEstablishment(est);
    setSelectedPlan(plan);
  };

  return (
    <UserLayout>
      {/* Header Section */}
      <div className="mb-6 md:mb-8 bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden w-full">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-48 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Explorar Serviços</h1>
          <p className="text-slate-300 max-w-2xl text-sm md:text-lg mb-6 md:mb-8">
            Descubra salões de beleza, clínicas de estética, serviços de TI e muito mais. Assine planos e facilite sua vida.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 max-w-3xl">
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
          </div>
        </div>
      </div>

      {/* Categories Scroller - Fixed for mobile */}
      <div className="mb-6 md:mb-8 w-full">
        <div className="overflow-x-auto pb-3 hide-scrollbar">
          <div className="flex gap-2 md:gap-3 w-max">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-2 ${
                selectedCategory === null 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-gray-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Todos
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat.name 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-gray-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <cat.icon className="w-4 h-4" /> {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-full sm:w-auto overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setViewMode('estabelecimentos')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              viewMode === 'estabelecimentos' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Store className="w-4 h-4" /> Estabelecimentos
          </button>
          <button
            onClick={() => setViewMode('planos')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
              viewMode === 'planos' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" /> Planos Diretos
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filtrar Resultados</span>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'estabelecimentos' ? (
        // ESTABELECIMENTOS VIEW
        filteredEstablishments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-100 shadow-sm">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhum estabelecimento encontrado</h3>
            <p className="text-gray-500 mt-2 text-sm">Tente ajustar seus filtros ou termo de busca.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Destaques Section */}
            {!searchTerm && !selectedCategory && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  Destaques da Semana
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredEstablishments.slice(0, 4).map((est) => (
                    <div 
                      key={`destaque-${est.id}`} 
                      className="bg-white rounded-2xl overflow-hidden border border-blue-100 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col relative"
                      onClick={() => setSelectedEstablishment(est)}
                    >
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 uppercase tracking-wider">
                        Recomendado
                      </div>
                      <div className="relative h-40 md:h-48 overflow-hidden">
                        <img 
                          src={est.image} 
                          alt={est.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold text-slate-800 shadow-sm">
                            {est.category}
                          </span>
                        </div>
                        {est.isConnected && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm flex items-center gap-1 mt-6">
                            <CheckCircle2 className="w-3 h-3" /> Conectado
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 md:p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-bold text-base md:text-lg text-gray-900 line-clamp-1" title={est.name}>{est.name}</h3>
                          <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-yellow-700 text-xs font-bold shrink-0">
                            <Star className="w-3 h-3 fill-current mr-1" />
                            {est.rating}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <MapPin className="w-3 h-3 mr-1" />
                          {est.distance} km de distância
                        </div>
                        
                        <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                          {est.description}
                        </p>
                        
                        <div className="pt-3 md:pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                          <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-md">
                            {est.plans.length} planos disponíveis
                          </span>
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-slate-600" />
                {searchTerm || selectedCategory ? 'Resultados da Busca' : 'Todos os Estabelecimentos'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredEstablishments.slice(searchTerm || selectedCategory ? 0 : 4).map((est) => (
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
                    <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold text-slate-800 shadow-sm">
                      {est.category}
                    </span>
                  </div>
                  {est.isConnected && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Conectado
                    </div>
                  )}
                </div>
                
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-base md:text-lg text-gray-900 line-clamp-1" title={est.name}>{est.name}</h3>
                    <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-yellow-700 text-xs font-bold shrink-0">
                      <Star className="w-3 h-3 fill-current mr-1" />
                      {est.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 mr-1" />
                    {est.distance} km de distância
                  </div>
                  
                  <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {est.description}
                  </p>
                  
                  <div className="pt-3 md:pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-md">
                      {est.plans.length} planos disponíveis
                    </span>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
        )
      ) : (
        // PLANOS VIEW
        filteredPlans.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-100 shadow-sm">
            <List className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhum plano encontrado</h3>
            <p className="text-gray-500 mt-2 text-sm">Tente ajustar seus filtros ou termo de busca.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Planos Populares */}
            {!searchTerm && !selectedCategory && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Planos Populares
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredPlans.slice(0, 4).map((plan) => (
                    <div key={`popular-${plan.id}`} className="bg-white rounded-2xl border-2 border-blue-100 p-4 md:p-5 flex flex-col hover:shadow-xl hover:border-blue-300 transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 uppercase tracking-wider">
                        Mais Assinado
                      </div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 mt-2">
                        <img src={plan.establishmentImage} alt={plan.establishmentName} className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold truncate">{plan.category}</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{plan.establishmentName}</p>
                        </div>
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h4>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8">{plan.description}</p>
                      
                      <div className="mb-4">
                        <span className="text-2xl font-black text-blue-600">R$ {plan.price.replace('.', ',')}</span>
                        <span className="text-xs text-gray-500 font-medium">/mês</span>
                      </div>

                      <ul className="space-y-2 mb-6 flex-1">
                        {plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start text-xs text-gray-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
                            <span className="line-clamp-1" title={feature}>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto text-sm py-2 shadow-md shadow-blue-200"
                        onClick={() => openPlanDetails(plan)}
                      >
                        Assinar Plano
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-slate-600" />
                {searchTerm || selectedCategory ? 'Resultados da Busca' : 'Todos os Planos'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredPlans.slice(searchTerm || selectedCategory ? 0 : 4).map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 flex flex-col hover:shadow-lg transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <img src={plan.establishmentImage} alt={plan.establishmentName} className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold truncate">{plan.category}</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{plan.establishmentName}</p>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h4>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-2xl font-black text-blue-600">R$ {plan.price.replace('.', ',')}</span>
                  <span className="text-xs text-gray-500 font-medium">/mês</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start text-xs text-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span className="line-clamp-1" title={feature}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-auto text-sm py-2"
                  onClick={() => openPlanDetails(plan)}
                >
                  Assinar Plano
                </Button>
              </div>
            ))}
            </div>
          </div>
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
                    {selectedEstablishment.distance} km
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedEstablishment.description}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Planos de Assinatura
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedEstablishment.plans.map((planId: number) => {
                  const plan = MOCK_PLANS.find(p => p.id === planId);
                  if (!plan) return null;
                  
                  return (
                    <div key={plan.id} className="border border-gray-200 rounded-xl p-4 md:p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white flex flex-col">
                      <h4 className="font-bold text-gray-900 text-base md:text-lg mb-1">{plan.name}</h4>
                      <p className="text-xs md:text-sm text-gray-500 mb-4 flex-1">{plan.description}</p>
                      
                      <div className="mb-4">
                        <span className="text-xl md:text-2xl font-extrabold text-gray-900">R$ {plan.price.replace('.', ',')}</span>
                        <span className="text-xs md:text-sm text-gray-500">/mês</span>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start text-xs md:text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
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
        onClose={() => {
          setSelectedPlan(null);
          if (viewMode === 'planos') setSelectedEstablishment(null); // Close fully if came from plans view
        }}
        title="Confirmar Assinatura"
        size="md"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
              setSelectedPlan(null);
              if (viewMode === 'planos') setSelectedEstablishment(null);
            }} disabled={isSubscribing}>
              Voltar
            </Button>
            <Button 
              onClick={handleSubscribe} 
              isLoading={isSubscribing} 
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar e Pagar
            </Button>
          </div>
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

            <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-100 space-y-3 md:space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3 md:pb-4">
                <div className="flex items-center gap-3">
                  <img src={selectedEstablishment.image} alt="Logo" className="w-10 h-10 rounded-lg object-cover shadow-sm" referrerPolicy="no-referrer" />
                  <div>
                    <span className="block text-[10px] md:text-xs text-gray-500">Estabelecimento</span>
                    <span className="block font-bold text-sm md:text-base text-gray-900 line-clamp-1">{selectedEstablishment.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-200 pb-3 md:pb-4">
                <div>
                  <span className="block text-[10px] md:text-xs text-gray-500">Plano Selecionado</span>
                  <span className="block font-bold text-sm md:text-base text-gray-900">{selectedPlan.name}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-1 md:pt-2">
                <span className="text-sm font-bold text-gray-900">Total a pagar hoje</span>
                <span className="text-xl md:text-2xl font-black text-blue-600">R$ {selectedPlan.price.replace('.', ',')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3 bg-blue-50 text-blue-800 p-3 md:p-4 rounded-lg text-xs md:text-sm">
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
