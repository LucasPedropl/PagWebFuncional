import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  Building2,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../ui/Button';
import { CompanyBrandAvatar } from '../../ui/CompanyBrandAvatar';
import { mapPublicCompanyToCard } from '../../../utils/publicCompany';
import type { PublicCompanyListItem } from '../../../types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
};

interface LandingDirectoryProps {
  companies: PublicCompanyListItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const LandingDirectory: React.FC<LandingDirectoryProps> = ({
  companies,
  isLoading,
  error,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
    <section id="estabelecimentos" className="py-20 sm:py-24 bg-slate-50/80 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-2">
              Diretório
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Explore estabelecimentos
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Descubra empresas parceiras, conheça planos e serviços antes de assinar.
            </p>
          </div>

          <div className="relative w-full lg:w-[340px]">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar pelo nome..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-900 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-28 bg-white rounded-3xl border border-slate-100 shadow-sm"
            >
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Carregando estabelecimentos...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-28 bg-white rounded-3xl border border-red-100 shadow-sm"
            >
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Erro ao carregar</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">{error}</p>
              <Button variant="outline" className="rounded-full px-6" onClick={() => void onRefresh()}>
                Tentar novamente
              </Button>
            </motion.div>
          ) : filteredCompanies.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-28 bg-white rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhum resultado</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                Não encontramos estabelecimentos com o termo informado.
              </p>
              <Button variant="outline" className="rounded-full px-6" onClick={() => setSearchQuery('')}>
                Limpar busca
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6"
            >
              {filteredCompanies.map((company) => (
                <motion.button
                  key={company.idEmpresa}
                  type="button"
                  variants={itemVariants}
                  onClick={() => navigate(`/empresa/${company.idEmpresa}`)}
                  className="group text-left flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                    <CompanyBrandAvatar
                      name={company.name}
                      logoUrl={company.logoUrl}
                      seed={company.idEmpresa}
                      className="w-24 h-24 rounded-2xl group-hover:scale-105 transition-transform duration-500"
                      textClassName="text-2xl font-black"
                    />
                    <span className="absolute top-4 left-4 inline-flex items-center bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Parceiro
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-2">
                      {company.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-5 line-clamp-2 leading-relaxed flex-1">
                      {company.description}
                    </p>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-semibold">Ver detalhes</span>
                      <span className="text-blue-600 font-bold flex items-center opacity-80 group-hover:opacity-100">
                        Abrir <ArrowRight className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
