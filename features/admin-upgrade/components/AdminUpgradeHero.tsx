import React from 'react';
import { Building2, CreditCard, MessageCircle, Sparkles, UserRound } from 'lucide-react';
import type { AdminUpgradeMode } from '../schemas/adminUpgradeSchemas';
import { ADMIN_UPGRADE_PRICING } from '../schemas/adminUpgradeSchemas';

interface AdminUpgradeModePickerProps {
  mode: AdminUpgradeMode | null;
  onSelect: (mode: AdminUpgradeMode) => void;
}

export const AdminUpgradeModePicker: React.FC<AdminUpgradeModePickerProps> = ({
  mode,
  onSelect,
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <ModeCard
      selected={mode === 'pj'}
      onClick={() => onSelect('pj')}
      icon={<Building2 className="w-5 h-5" />}
      title="Empresa (CNPJ)"
      subtitle="Cadastro completo com CNPJ, telefone e logo. Ideal para estabelecimentos."
      price={ADMIN_UPGRADE_PRICING.basePj.priceLabel}
    />
    <ModeCard
      selected={mode === 'pf'}
      onClick={() => onSelect('pf')}
      icon={<UserRound className="w-5 h-5" />}
      title="Pessoal (PF)"
      subtitle="Confirme uma vez e criamos o admin com seus dados de pessoa física."
      price={ADMIN_UPGRADE_PRICING.basePf.priceLabel}
    />
  </div>
);

interface ModeCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  price: string;
}

const ModeCard: React.FC<ModeCardProps> = ({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  price,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left rounded-2xl border p-5 transition-all ${
      selected
        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
    }`}
  >
    <div
      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${
        selected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {icon}
    </div>
    <p className="text-base font-semibold tracking-tight">{title}</p>
    <p className={`mt-1.5 text-sm leading-relaxed ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
      {subtitle}
    </p>
    <p className={`mt-4 text-xs font-semibold uppercase tracking-wider ${selected ? 'text-emerald-300' : 'text-emerald-700'}`}>
      {price}
    </p>
  </button>
);

export const AdminUpgradeHero: React.FC = () => (
  <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-10 md:px-10 md:py-12 text-white">
    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
    <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
    <div className="relative max-w-2xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
        PagWeb Admin
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
        Venda assinaturas. Cobre. Cresça.
      </h1>
      <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed max-w-xl">
        Libere o painel de estabelecimento: planos, clientes, faturas, cobrança única e
        relatórios — no mesmo login que você já usa como cliente.
      </p>
      <ul className="mt-6 flex flex-wrap gap-3 text-xs text-slate-200">
        <li className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
          <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
          Cobranças e planos
        </li>
        <li className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-cyan-300" />
          WhatsApp (add-on)
        </li>
        <li className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
          <Building2 className="w-3.5 h-3.5 text-cyan-300" />
          PJ ou PF
        </li>
      </ul>
    </div>
  </section>
);
