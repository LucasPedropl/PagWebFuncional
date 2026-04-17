import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, ArrowLeft, Star, Tag, MapPin, Building2, ShieldCheck, Mail, ArrowRight, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { mockCompanies, Company } from '../data/mockCompanies';
import { motion } from 'motion/react';

export const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (id) {
      const found = mockCompanies.find(c => c.id === parseInt(id));
      if (found) setCompany(found);
      window.scrollTo(0, 0);
    }
  }, [id]);

  const handleSubscribe = () => {
    navigate('/login?type=client');
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-black text-slate-900 mb-4">Estabelecimento não encontrado</h1>
        <p className="text-slate-500 mb-8 font-medium">O estabelecimento que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/')} className="rounded-full px-8">Voltar para o Início</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-blue-500/30">
      {/* Header Glassmorphism */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <button 
              onClick={() => navigate('/')}
              className="group p-2.5 -ml-3 rounded-full hover:bg-slate-100/80 hover:shadow-sm text-slate-500 hover:text-slate-900 transition-all"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer group hidden md:flex" onClick={() => navigate('/')}>
              <div className="bg-gradient-to-tr from-slate-900 to-slate-700 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-md">
                <CreditCard className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">PagWeb</span>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-auto px-2">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar outras empresas..." 
                onClick={() => navigate('/')}
                className="w-full pl-9 pr-4 py-2 bg-slate-100/50 hover:bg-slate-100 border border-slate-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
             <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-full px-5 text-sm hidden sm:flex" onClick={() => navigate('/login?type=client')}>
              Log in Cliente
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-32">
         {/* Hero Banner with Parallax-like structure */}
         <div className="relative h-[450px] w-full bg-slate-950 overflow-hidden">
            <motion.div 
               initial={{ scale: 1.1, opacity: 0 }}
               animate={{ scale: 1, opacity: 0.6 }}
               transition={{ duration: 0.8 }}
               className="absolute inset-0"
            >
               <img src={company.image} alt={company.name} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
               {/* Accent glow based on brand (using a generic blue glow for now) */}
               <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-blue-600/30 blur-[120px] rounded-full mix-blend-screen"></div>
            </motion.div>

            <div className="absolute bottom-0 inset-x-0 z-10 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-wrap items-center gap-3 mb-5"
                     >
                        <span className="inline-flex items-center bg-blue-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-sm border border-blue-500/50">
                            <Tag className="w-3.5 h-3.5 mr-1.5" />
                            {company.category}
                        </span>
                        <span className="flex items-center text-sm font-bold text-slate-900 bg-white px-3.5 py-1.5 rounded-full shadow-lg">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1.5" />
                            {company.rating} <span className="text-slate-400 ml-1 font-semibold hidden md:inline">• Verificado</span>
                        </span>
                    </motion.div>
                    
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight w-full drop-shadow-xl"
                    >
                        {company.name}
                    </motion.h1>
                </div>
            </div>
         </div>

         {/* Layout Principal (Sidebar Esquerda + Planos Direita) */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* Descrição Esquerda */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-4 lg:-mt-16"
                >
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 sm:p-10 lg:sticky lg:top-28">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-8 shadow-sm">
                           <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-4">Sobre a empresa</h3>
                        <p className="text-slate-600 text-base leading-relaxed mb-8 font-medium">
                            {company.longDescription}
                        </p>
                        
                        <div className="border-t border-slate-100 pt-8 space-y-6">
                            <div className="flex items-start gap-4">
                               <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                                  <MapPin className="w-5 h-5" />
                               </div>
                               <div>
                                  <h4 className="text-sm font-bold text-slate-900 mb-1">Localização</h4>
                                  <p className="text-sm text-slate-600 font-medium">Av. das Nações Unidas, 14401<br/>São Paulo, SP - 04794-000</p>
                               </div>
                            </div>
                            <div className="flex items-start gap-4">
                               <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                                  <Mail className="w-5 h-5" />
                               </div>
                               <div>
                                  <h4 className="text-sm font-bold text-slate-900 mb-1">Contato</h4>
                                  <p className="text-sm text-slate-600 font-medium">contato@empresa.com.br<br/>(11) 3344-5566</p>
                               </div>
                            </div>
                            <div className="flex items-start gap-4">
                               <div className="bg-green-50 p-3 rounded-full text-green-600 shrink-0">
                                  <ShieldCheck className="w-5 h-5" />
                               </div>
                               <div>
                                  <h4 className="text-sm font-bold text-slate-900 mb-1">Selo PagWeb</h4>
                                  <p className="text-sm text-slate-600 font-medium">Empresa verificada e com pagamentos assegurados pela plataforma.</p>
                               </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Planos Direita */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="lg:col-span-8 space-y-8 pt-6 lg:pt-2"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Planos de Assinatura</h2>
                        <span className="text-sm font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">{company.plans.length} opções listadas</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {company.plans.map((plan) => (
                            <div 
                                key={plan.id} 
                                className={`relative p-8 rounded-[2rem] border transition-all h-full flex flex-col group ${
                                plan.isPopular 
                                    ? 'border-transparent bg-slate-950 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden isolate' 
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50'
                                }`}
                            >
                                {plan.isPopular && (
                                   //  Bg gradient glow for the dark card
                                   <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-bl from-blue-600/40 to-indigo-600/0 rounded-full blur-3xl -z-10 mix-blend-screen pointer-events-none"></div>
                                )}
                                
                                {plan.isPopular && (
                                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                                )}

                                {plan.isPopular && (
                                  <div className="mb-6 inline-flex">
                                    <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm">
                                        Mais Assinado pelas pessoas
                                    </span>
                                  </div>
                                )}

                                <h4 className={`text-2xl font-black mb-2 ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h4>
                                <div className="mb-8 flex items-end">
                                    <span className={`text-5xl font-black tracking-tight ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                                    <span className={`font-semibold mb-1 ml-2 ${plan.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feat, idx) => (
                                        <li key={idx} className="flex flex-items-start">
                                            <CheckCircle2 className={`w-5 h-5 mr-3 shrink-0 ${plan.isPopular ? 'text-blue-400' : 'text-blue-600'}`} />
                                            <span className={`text-base font-medium ${plan.isPopular ? 'text-slate-300' : 'text-slate-600'}`}>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button 
                                    className={`w-full mt-auto h-14 text-lg font-bold rounded-2xl flex items-center justify-center transition-all ${
                                        plan.isPopular 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 hover:scale-[1.02]' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                                    }`}
                                    onClick={handleSubscribe}
                                >
                                    Assinar Agora <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                {plan.isPopular && (
                                    <p className="text-center text-[11px] text-slate-400 font-medium mt-4 uppercase tracking-widest">
                                        Renovação automática • Cancele quando quiser
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
         </div>
      </main>
    </div>
  );
};
