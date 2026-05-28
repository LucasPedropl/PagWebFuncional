import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Tag,
  MapPin,
  Building2,
  ShieldCheck,
  Phone,
  ArrowRight,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { usePublicCompanyDetail } from '../hooks/usePublicCompanyDetail';
import {
  buildPublicCompanyAboutText,
  formatPublicCompanyAddress,
} from '../utils/publicCompany';
import { formatPhone } from '../utils/formatters';
import { PlanResponse } from '../types';

const pickPopularPlanId = (plans: PlanResponse[]): number | null => {
  const selfSubscribe = plans.find((p) => p.assinarPorCliente !== false);
  return selfSubscribe?.idPlano ?? plans[0]?.idPlano ?? null;
};

export const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idEmpresa = id ? Number(id) : null;
  const { company, card, plans, isLoading, error, refresh } = usePublicCompanyDetail(idEmpresa);

  const popularPlanId = useMemo(() => pickPopularPlanId(plans), [plans]);
  const addressText = company ? formatPublicCompanyAddress(company.enderecoEmpresa) : null;

  const handleSubscribe = () => {
    navigate('/login?type=client');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Carregando estabelecimento...</p>
      </div>
    );
  }

  if (error || !company || !card) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <h1 className="text-3xl font-black text-slate-900 mb-4">Estabelecimento não encontrado</h1>
        <p className="text-slate-500 mb-8 font-medium text-center max-w-md">
          {error || 'O estabelecimento que você está procurando não existe ou foi removido.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => void refresh()} className="rounded-full px-6">
            Tentar novamente
          </Button>
          <Button onClick={() => navigate('/')} className="rounded-full px-8">
            Voltar para o Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-blue-500/30">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="group p-2.5 -ml-3 rounded-full hover:bg-slate-100/80 text-slate-500 hover:text-slate-900 transition-all"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer group hidden md:flex"
              onClick={() => navigate('/')}
            >
              <div className="bg-gradient-to-tr from-slate-900 to-slate-700 p-2 rounded-xl shadow-md">
                <CreditCard className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">PagWeb</span>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-auto px-2">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar outras empresas..."
                onClick={() => navigate('/')}
                readOnly
                className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border border-slate-200/80 rounded-full text-sm text-slate-900 cursor-pointer"
              />
            </div>
          </div>

          <Button
            variant="outline"
            className="border-slate-200 rounded-full px-5 text-sm hidden sm:flex"
            onClick={() => navigate('/login?type=client')}
          >
            Entrar como Cliente
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-32">
        <div className="relative h-[450px] w-full bg-slate-950 overflow-hidden">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          </motion.div>

          <div className="absolute bottom-0 inset-x-0 z-10 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-3 mb-5"
              >
                <span className="inline-flex items-center bg-blue-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white">
                  <Tag className="w-3.5 h-3.5 mr-1.5" />
                  Estabelecimento
                </span>
                <span className="inline-flex items-center bg-white px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-900 shadow-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600 mr-1.5" />
                  Parceiro PagWeb
                </span>
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-xl"
              >
                {card.name}
              </motion.h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-4 lg:-mt-16"
            >
              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 lg:sticky lg:top-28">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-8">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">Sobre a empresa</h3>
                <p className="text-slate-600 text-base leading-relaxed mb-8 font-medium">
                  {buildPublicCompanyAboutText(company)}
                </p>

                <div className="border-t border-slate-100 pt-8 space-y-6">
                  {addressText && (
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Localização</h4>
                        <p className="text-sm text-slate-600 font-medium whitespace-pre-line">{addressText}</p>
                      </div>
                    </div>
                  )}
                  {company.telefone && (
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Contato</h4>
                        <p className="text-sm text-slate-600 font-medium">{formatPhone(company.telefone)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="bg-green-50 p-3 rounded-full text-green-600 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Selo PagWeb</h4>
                      <p className="text-sm text-slate-600 font-medium">
                        Empresa listada no diretório oficial da plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-8 space-y-8 pt-6 lg:pt-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Planos de Assinatura</h2>
                <span className="text-sm font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">
                  {plans.length} opção{plans.length !== 1 ? 'ões' : ''}
                </span>
              </div>

              {plans.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-10 text-center">
                  <p className="text-slate-500 font-medium">Nenhum plano disponível no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {plans.map((plan) => {
                    const isPopular = plan.idPlano === popularPlanId;
                    const features =
                      plan.funcionalidades?.length > 0
                        ? plan.funcionalidades
                        : ['Plano disponível para contratação'];

                    return (
                      <div
                        key={plan.idPlano}
                        className={`relative p-8 rounded-[2rem] border h-full flex flex-col ${
                          isPopular
                            ? 'border-transparent bg-slate-950 text-white shadow-2xl'
                            : 'border-slate-200 bg-white hover:shadow-xl'
                        }`}
                      >
                        {isPopular && (
                          <div className="mb-6 inline-flex">
                            <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full">
                              Destaque
                            </span>
                          </div>
                        )}

                        <h4 className={`text-2xl font-black mb-2 ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                          {plan.nome}
                        </h4>
                        <div className="mb-8 flex items-end">
                          <span className={`text-5xl font-black ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                            R$ {plan.valorMensalidade.toFixed(2).replace('.', ',')}
                          </span>
                          <span className={`font-semibold mb-1 ml-2 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                            /mês
                          </span>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                          {features.map((feat, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle2
                                className={`w-5 h-5 mr-3 shrink-0 ${isPopular ? 'text-blue-400' : 'text-blue-600'}`}
                              />
                              <span className={`text-base font-medium ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                                {feat}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          className={`w-full h-14 text-lg font-bold rounded-2xl ${
                            isPopular
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                          }`}
                          onClick={handleSubscribe}
                        >
                          Assinar Agora <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};
