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
      active={activeView === 'business'}
      title="Estabelecimento"
      subtitle={businessSubtitle ?? 'Planos, clientes e cobranças'}
      onClick={() => onSwitch('business')}
      avatar={
        companyProfile?.logo ? (
          <img src={getImageUrl(companyProfile.logo)} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] font-semibold">{getProfileInitials(companyProfile?.nome)}</span>
        )
      }
    />
    <SwitcherOption
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
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
  avatar: React.ReactNode;
  borderedTop?: boolean;
}> = ({ active, title, subtitle, onClick, avatar, borderedTop }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
      borderedTop ? 'border-t border-slate-100' : ''
    } ${active ? 'bg-slate-50' : ''}`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`w-8 h-8 ${SHELL_R} flex items-center justify-center border overflow-hidden shrink-0 ${
          active ? 'border-slate-900 ring-1 ring-slate-900/10 bg-white' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}
      >
        {avatar}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-slate-900 truncate">{title}</p>
        <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
      </div>
    </div>
    {active ? <Check size={15} className="text-slate-900 shrink-0" strokeWidth={2.5} /> : null}
  </button>
);
