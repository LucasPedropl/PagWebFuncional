import React from 'react';
import { Building2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { AccessPathCards } from './AccessPathCards';

interface LandingHeroProps {
  establishmentCount: number;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ establishmentCount }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.18),transparent)] pointer-events-none" />
      <div className="absolute top-20 -left-32 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-24 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20 sm:pb-16">
        <div className="text-center max-w-4xl mx-auto mb-14 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/80 text-slate-600 text-sm font-semibold mb-8 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Hub de assinaturas e gestão
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <Building2 className="w-4 h-4 text-slate-500" />
            {establishmentCount > 0 ? `${establishmentCount} parceiros` : 'Estabelecimentos parceiros'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6"
          >
            Assinaturas, serviços e{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              pagamentos
            </span>{' '}
            em um só lugar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Clientes encontram planos e agendam serviços. Estabelecimentos gerenciam tudo com
            clareza. Escolha seu acesso abaixo.
          </motion.p>
        </div>

        <AccessPathCards />
      </div>
    </section>
  );
};
