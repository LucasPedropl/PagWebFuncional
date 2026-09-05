import React from 'react';
import { Check } from 'lucide-react';
import { getImageUrl } from '../../../utils/api';
import { getProfileInitials } from './shellUtils';
import type { ShellAudience } from './shellTypes';
import { SHELL_R } from './shellTheme';

interface ViewSwitcherProfile {
  nome: string;
  fotoPerfilPath: string | null;
}

interface ViewSwitcherCompany {
  nome: string;
  logo: string | null;
}

export interface ViewSwitcherPanelProps {
  activeView: ShellAudience;
  userProfile: ViewSwitcherProfile | null;
  companyProfile: ViewSwitcherCompany | null;
  sessionPhotoPath?: string | null;
  sessionName?: string;
  onSwitch: (view: ShellAudience) => void;
  /** Quando o cliente ainda não tem empresa — CTA de upgrade. */
  businessSubtitle?: string;
}

export const ViewSwitcherPanel: React.FC<ViewSwitcherPanelProps> = ({
  activeView,
  userProfile,
  companyProfile,
  sessionPhotoPath,
  sessionName,
  onSwitch,
  businessSubtitle,
}) => (
  <div>
    <p className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 border-b border-slate-100">
      Ambientes
    </p>
    <SwitcherOption
      tone="business"
      active={activeView === 'business'}
      title="Estabelecimento"
      subtitle={businessSubtitle ?? 'Planos, clientes e cobranças'}
      onClick={() => onSwitch('business')}
      avatar={
        companyProfile?.logo ? (
          <img
            src={getImageUrl(companyProfile.logo)}
            alt=""
            className="w-full h-full object-contain bg-transparent"
          />
        ) : (
          <span className="text-[11px] font-semibold">{getProfileInitials(companyProfile?.nome)}</span>
        )
      }
    />
    <SwitcherOption
      tone="client"
      active={activeView === 'client'}
      title="Cliente"
      subtitle="Assinaturas e faturas"
      onClick={() => onSwitch('client')}
      borderedTop
      avatar={
        userProfile?.fotoPerfilPath || sessionPhotoPath ? (
          <img
            src={getImageUrl(userProfile?.fotoPerfilPath || sessionPhotoPath)}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[11px] font-semibold">
            {getProfileInitials(userProfile?.nome || sessionName)}
          </span>
        )
      }
    />
  </div>
);

const SwitcherOption: React.FC<{
  tone: ShellAudience;
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
  avatar: React.ReactNode;
  borderedTop?: boolean;
}> = ({ tone, active, title, subtitle, onClick, avatar, borderedTop }) => {
  const isClient = tone === 'client';
  const surface = isClient
    ? active
      ? 'bg-blue-100 hover:bg-blue-100 border-l-[3px] border-l-blue-600'
      : 'bg-blue-50 hover:bg-blue-100/80 border-l-[3px] border-l-blue-400'
    : active
      ? 'bg-slate-200 hover:bg-slate-200 border-l-[3px] border-l-slate-800'
      : 'bg-slate-100 hover:bg-slate-200/80 border-l-[3px] border-l-slate-500';
  const avatarRing = isClient
    ? 'border-blue-200 bg-white text-blue-700'
    : 'border-slate-300 bg-white text-slate-700';
  const checkClass = isClient ? 'text-blue-700' : 'text-slate-800';
  const subtitleClass = isClient ? 'text-blue-700/80' : 'text-slate-600';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${
        borderedTop ? 'border-t border-slate-200/80' : ''
      } ${surface}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 ${SHELL_R} flex items-center justify-center border overflow-hidden shrink-0 ${avatarRing}`}
        >
          {avatar}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900 truncate">{title}</p>
          <p className={`text-[11px] truncate ${subtitleClass}`}>{subtitle}</p>
        </div>
      </div>
      {active ? <Check size={15} className={`${checkClass} shrink-0`} strokeWidth={2.5} /> : null}
    </button>
  );
};
