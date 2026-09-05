import React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { getImageUrl } from '../../../utils/api';
import { getProfileInitials } from './shellUtils';
import type { ShellAudience } from './shellTypes';
import { getShellAccent, SHELL_POPOVER_GAP, SHELL_R } from './shellTheme';
import { ViewSwitcherPanel } from './ViewSwitcherPanel';

interface ViewSwitcherProfile {
  nome: string;
  fotoPerfilPath: string | null;
}

interface ViewSwitcherCompany {
  nome: string;
  logo: string | null;
}

interface ViewSwitcherProps {
  audience: ShellAudience;
  isCollapsed: boolean;
  activeView: ShellAudience;
  currentAudience: ShellAudience;
  userProfile: ViewSwitcherProfile | null;
  companyProfile: ViewSwitcherCompany | null;
  sessionPhotoPath?: string | null;
  sessionName?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSwitch: (view: ShellAudience) => void;
  businessSubtitle?: string;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  audience,
  isCollapsed,
  activeView,
  currentAudience,
  userProfile,
  companyProfile,
  sessionPhotoPath,
  sessionName,
  isOpen,
  onToggle,
  onClose,
  onSwitch,
  businessSubtitle,
}) => {
  const accent = getShellAccent(audience);
  const isBusinessPanel = currentAudience === 'business';
  const displayName = isBusinessPanel
    ? companyProfile?.nome || 'Estabelecimento'
    : userProfile?.nome || sessionName || 'Conta';
  const displaySubtitle = isBusinessPanel ? 'Estabelecimento' : 'Cliente';

  const avatarContent = isBusinessPanel ? (
    companyProfile?.logo ? (
      <img
        src={getImageUrl(companyProfile.logo)}
        alt=""
        className="w-full h-full object-contain p-0.5 bg-white"
      />
    ) : (
      <span className="text-[11px] font-semibold text-slate-300">
        {getProfileInitials(companyProfile?.nome || userProfile?.nome || sessionName)}
      </span>
    )
  ) : userProfile?.fotoPerfilPath || sessionPhotoPath ? (
    <img
      src={getImageUrl(userProfile?.fotoPerfilPath || sessionPhotoPath)}
      alt=""
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-[11px] font-semibold text-slate-300">
      {getProfileInitials(userProfile?.nome || sessionName)}
    </span>
  );

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={onToggle}
        title="Alternar ambiente"
        className={
          isCollapsed
            ? `w-10 h-10 mx-auto ${SHELL_R} border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden hover:bg-white/10 transition-colors`
            : `w-full flex items-center gap-2.5 p-2 ${SHELL_R} border border-white/10 bg-white/5 hover:bg-white/10 transition-all group text-left`
        }
      >
        <div
          className={`w-8 h-8 ${SHELL_R} bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0`}
        >
          {avatarContent}
        </div>
        {!isCollapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white truncate leading-tight">{displayName}</p>
              <p className={`text-[10px] font-medium truncate leading-tight mt-0.5 ${accent.switcherAccent}`}>
                {displaySubtitle}
              </p>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} aria-hidden />
          <div
            className={`absolute z-[70] bg-white ${SHELL_R} shadow-[0_12px_40px_rgba(15,23,42,0.12)] border border-slate-200/90 overflow-hidden ${
              isCollapsed
                ? `left-full ${SHELL_POPOVER_GAP} top-0 w-[17.5rem]`
                : 'left-0 right-0 top-[calc(100%+8px)]'
            }`}
          >
            <ViewSwitcherPanel
              activeView={activeView}
              userProfile={userProfile}
              companyProfile={companyProfile}
              sessionPhotoPath={sessionPhotoPath}
              sessionName={sessionName}
              onSwitch={onSwitch}
              businessSubtitle={businessSubtitle}
            />
          </div>
        </>
      )}
    </div>
  );
};
