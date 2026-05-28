import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowRight, Building2, User, Search, LayoutGrid, ChevronDown, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { usePublicCompanies } from '../hooks/usePublicCompanies';
import { CompanyBrandAvatar } from '../components/ui/CompanyBrandAvatar';
import { mapPublicCompanyToCard } from '../utils/publicCompany';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement>(null);
  const { companies, isLoading, error, refresh } = usePublicCompanies();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target as Node)) {
        setIsLoginMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const establishmentCards = useMemo(
    () => companies.map((company) => mapPublicCompanyToCard(company)),
    [companies],
  );

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return establishmentCards;
    return establishmentCards.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        company.description.toLowerCase().includes(query) ||
        company.telefone?.includes(query),
    );
  }, [establishmentCards, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-blue-500/30">
      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-gradient-to-tr from-slate-900 to-slate-700 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-md">
              <CreditCard className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">PagWeb</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#estabelecimentos" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Explorar Estabelecimentos</a>
          </nav>
          <div className="relative" ref={loginMenuRef}>
            <Button 
                className="bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20 rounded-full px-4 sm:px-6 h-10 flex items-center gap-2 group transition-all"
                onClick={() => setIsLoginMenuOpen(!isLoginMenuOpen)}
            >
              <LogIn className="w-4 h-4" />
              <span className="font-bold text-sm tracking-tight text-white">Entrar</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLoginMenuOpen ? 'rotate-180' : ''}`} />
            </Button>

            <AnimatePresence>
              {isLoginMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-60 bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-[100]"
                >
                  <button 
                    onClick={() => { navigate('/login?type=client'); setIsLoginMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-[14px] transition-all text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">Sou Cliente</p>
                      <p className="text-[11px] text-slate-500 leading-tight">Acessar assinaturas e faturas</p>
                    </div>
                  </button>

                  <div className="h-px bg-slate-50 my-1 mx-2" />

                  <button 
                    onClick={() => { navigate('/login?type=business'); setIsLoginMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-[14px] transition-all text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white group-hover:scale-105 transition-all duration-300">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">Sou Empresa</p>
                      <p className="text-[11px] text-slate-500 leading-tight">Painel de controle e gestão</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 pt-20 pb-32 sm:pt-32 sm:pb-40">
        {/* Animated Background gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur-md border border-slate-700/50 text-slate-300 text-sm font-medium mb-8"
          >
            <Building2 className="w-4 h-4 text-blue-400" /> {companies.length > 0 ? `${companies.length} Estabelecimentos` : 'Estabelecimentos Parceiros'}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[5rem] font-black text-white tracking-tight mb-8 leading-[1.1] drop-shadow-sm"
          >
            As melhores assinaturas <br className="hidden md:block" />em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient">único lugar</span>.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Descubra serviços incríveis, assine planos descomplicados e gerencie sua rotina direto pelo PagWeb. Rápido, seguro e transparente.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8 text-lg rounded-full h-14 shadow-xl shadow-blue-500/20 transition-all hover:scale-105 border-none" onClick={() => { document.getElementById('estabelecimentos')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Encontrar Empresas <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Directory Section */}
      <section id="estabelecimentos" className="py-24 bg-slate-50 flex-1 relative">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Diretório Oficial</h2>
              <p className="text-lg text-slate-500 font-medium">
                Explore e assine os melhores serviços locais e digitais.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative min-w-[320px] group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar pelo nome..." 
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm"
              >
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Carregando estabelecimentos...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-32 bg-white rounded-[2rem] border border-red-100 shadow-sm"
              >
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Erro ao carregar</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">{error}</p>
                <Button variant="outline" className="rounded-full px-6 border-slate-200" onClick={() => void refresh()}>
                  Tentar novamente
                </Button>
              </motion.div>
            ) : filteredCompanies.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LayoutGrid className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhum resultado</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Não encontramos estabelecimentos com o termo informado.</p>
                <Button variant="outline" className="rounded-full px-6 border-slate-200" onClick={() => setSearchQuery('')}>
                  Limpar busca
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
              >
                {filteredCompanies.map((company) => (
                  <motion.div 
                    key={company.idEmpresa} 
                    variants={itemVariants}
                    onClick={() => navigate(`/empresa/${company.idEmpresa}`)}
                    className="group flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-100 flex items-center justify-center">
                      <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors duration-300 z-10" />
                      <CompanyBrandAvatar
                        name={company.name}
                        logoUrl={company.logoUrl}
                        seed={company.idEmpresa}
                        className="w-24 h-24 rounded-2xl z-0 group-hover:scale-105 transition-transform duration-500"
                        textClassName="text-2xl font-black"
                      />
                      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                         <span className="inline-flex items-center bg-white/90 backdrop-blur-md shadow-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 self-start">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            Estabelecimento
                         </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h3 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{company.name}</h3>
                      </div>
                      <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                        {company.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm text-slate-500 font-semibold flex items-center bg-slate-50 px-3 py-1 rounded-full">
                          Ver detalhes
                        </div>
                        <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 flex items-center">
                          Ver Detalhes <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-80 hover:opacity-100 transition-opacity cursor-pointer delay-150">
            <div className="bg-slate-800 p-2 rounded-xl">
              <CreditCard className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">PagWeb</span>
          </div>
          <p className="text-slate-400 text-sm mb-8 font-medium max-w-sm mx-auto">
            O hub definitivo de assinaturas e gestão de empresas parceiras. Feito com excelência para simplificar sua vida.
          </p>
          <div className="text-slate-600 text-sm font-semibold flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
            <span>© {new Date().getFullYear()} PagWeb Inc.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a href="#" className="hover:text-slate-400 transition-colors">Termos de Uso</a>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
