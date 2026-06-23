import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  ArrowRight,
  Receipt,
  Calendar,
  Compass,
  Users,
  CreditCard,
  Scissors,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../ui/Button';

interface AccessPathCardsProps {
  id?: string;
  title?: string;
  subtitle?: string;
}

export const AccessPathCards: React.FC<AccessPathCardsProps> = ({
  id,
  title = 'Escolha como deseja entrar',
  subtitle = 'Acesso direto ao painel certo para você — sem menus escondidos.',
}) => {
  const navigate = useNavigate();

  return (
    <section id={id} className="relative">
      {(title || subtitle) && (
        <div className="text-center mb-10 max-w-2xl mx-auto">
          {title && (
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">
              {title}
            </h2>
          )}
          {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 lg:gap-6 max-w-4xl mx-auto">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="group relative rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-6 sm:p-8 shadow-[0_20px_60px_-24px_rgba(37,99,235,0.35)] hover:shadow-[0_28px_70px_-20px_rgba(37,99,235,0.45)] transition-shadow"
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 mb-5">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Sou Cliente</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            Assinaturas, faturas, agendamentos e chat com estabelecimentos em um só lugar.
          </p>
          <ul className="space-y-2.5 mb-7">
            {[
              { icon: Compass, text: 'Explorar planos e serviços' },
              { icon: Receipt, text: 'Pagar e acompanhar faturas' },
              { icon: Calendar, text: 'Gerenciar seus agendamentos' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/login?type=client')}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 h-11 font-semibold shadow-md shadow-blue-600/25"
            >
              Entrar como cliente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/register?type=client')}
              className="flex-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 h-11 font-semibold"
            >
              Criar conta
            </Button>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="group relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 sm:p-8 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.25)] hover:shadow-[0_28px_70px_-20px_rgba(15,23,42,0.35)] transition-shadow"
        >
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent" />
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/30 mb-5">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Sou Estabelecimento</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            Painel completo para planos, clientes, cobranças, serviços e agendamentos.
          </p>
          <ul className="space-y-2.5 mb-7">
            {[
              { icon: Users, text: 'Gerenciar base de clientes' },
              { icon: CreditCard, text: 'Assinaturas e cobranças' },
              { icon: Scissors, text: 'Serviços e agenda' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-slate-600">
                <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/login?type=business')}
              className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 h-11 font-semibold shadow-md shadow-slate-900/20"
            >
              Entrar no painel
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/register?type=business')}
              className="flex-1 rounded-xl border-slate-300 text-slate-800 hover:bg-slate-100 h-11 font-semibold"
            >
              Cadastrar empresa
            </Button>
          </div>
        </motion.article>
      </div>
    </section>
  );
};
