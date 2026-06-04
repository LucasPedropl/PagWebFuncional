import { Building2, CreditCard, Shield, Sparkles, Users, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AuthAudience = 'client' | 'business';

export interface AuthThemeConfig {
  audience: AuthAudience;
  label: string;
  heroTitle: string;
  heroSubtitle: string;
  heroGradient: string;
  accentText: string;
  accentBg: string;
  accentRing: string;
  buttonClass: string;
  linkClass: string;
  badgeClass: string;
  stepActive: string;
  stepDone: string;
  stepIdle: string;
  glowColor: string;
  fileButtonClass: string;
  features: { icon: LucideIcon; title: string; description: string }[];
}

export const getAuthTheme = (audience: AuthAudience): AuthThemeConfig => {
  if (audience === 'business') {
    return {
      audience: 'business',
      label: 'Estabelecimento',
      heroTitle: 'Gerencie assinaturas com precisão',
      heroSubtitle:
        'Painel completo para planos, clientes, cobranças e contratos — tudo em um só lugar.',
      heroGradient: 'from-slate-900 via-slate-800 to-slate-950',
      accentText: 'text-slate-300',
      accentBg: 'bg-slate-700',
      accentRing: 'focus:ring-slate-900/20 focus:border-slate-400',
      buttonClass: 'bg-gray-800 hover:bg-gray-900 shadow-md shadow-slate-900/20',
      linkClass: 'text-slate-700 hover:text-slate-900',
      badgeClass: 'bg-slate-200 text-slate-800',
      stepActive: 'bg-slate-900 border-slate-700 text-white',
      stepDone: 'bg-slate-100 border-slate-900 text-slate-900',
      stepIdle: 'bg-slate-50 border-slate-200 text-slate-400',
      glowColor: 'bg-white/10',
      fileButtonClass: 'file:bg-slate-900 file:hover:bg-slate-800',
      features: [
        {
          icon: Building2,
          title: 'Cadastro da empresa',
          description: 'Configure planos e regras de contrato em minutos.',
        },
        {
          icon: Users,
          title: 'Base de clientes',
          description: 'Acompanhe assinaturas, inadimplência e mensagens.',
        },
        {
          icon: Shield,
          title: 'Contratos digitais',
          description: 'Assinatura com foto e termos integrados ao fluxo.',
        },
      ],
    };
  }

  return {
    audience: 'client',
    label: 'Cliente',
    heroTitle: 'Suas assinaturas, sem complicação',
    heroSubtitle:
      'Descubra planos, assine com segurança e acompanhe faturas em uma experiência fluida.',
    heroGradient: 'from-slate-900 via-slate-800 to-slate-950',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-600',
    accentRing: 'focus:ring-slate-900/20 focus:border-slate-400',
    buttonClass: 'bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20',
    linkClass: 'text-slate-700 hover:text-slate-900',
    badgeClass: 'bg-blue-50 text-blue-700',
    stepActive: 'bg-blue-600 border-blue-500 text-white',
    stepDone: 'bg-blue-50 border-blue-600 text-blue-700',
    stepIdle: 'bg-slate-50 border-slate-200 text-slate-400',
    glowColor: 'bg-blue-500/10',
    fileButtonClass: 'file:bg-slate-900 file:hover:bg-slate-800',
    features: [
      {
        icon: Sparkles,
        title: 'Explorar planos',
        description: 'Compare estabelecimentos e contrate pelo app.',
      },
      {
        icon: CreditCard,
        title: 'Pagamentos centralizados',
        description: 'Veja faturas, métodos e histórico em um painel.',
      },
      {
        icon: Zap,
        title: 'Chat com empresas',
        description: 'Tire dúvidas e solicite assinaturas pelo chat.',
      },
    ],
  };
};
