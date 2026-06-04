import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { getImageUrl } from '../../../utils/api';
import { getProfileInitials } from './shellUtils';
import { SHELL_R } from './shellTheme';
import { ViewSwitcherPanel, ViewSwitcherPanelProps } from './ViewSwitcherPanel';

interface ShellUserMenuProps {
  userName: string;
  userSubtitle?: string;
  userPhotoPath: string | null;
  onLogout: () => void;
  compact?: boolean;
  viewSwitcher?: ViewSwitcherPanelProps;
}

export const ShellUserMenu: React.FC<ShellUserMenuProps> = ({
  userName,
  userSubtitle,
  userPhotoPath,
  onLogout,
  compact = false,
  viewSwitcher,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSwitch = (view: Parameters<ViewSwitcherPanelProps['onSwitch']>[0]) => {
    setIsOpen(false);
    viewSwitcher?.onSwitch(view);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex items-center gap-2 ${SHELL_R} border border-slate-200/80 bg-white/90 hover:bg-slate-50 transition-colors ${
          compact ? 'p-1' : 'py-1 pl-1 pr-2'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Menu da conta"
      >
        <div
          className={`w-8 h-8 ${SHELL_R} overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 ring-1 ring-slate-200/60`}
        >
          {userPhotoPath ? (
            <img src={getImageUrl(userPhotoPath)} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11px] font-semibold text-slate-600">{getProfileInitials(userName)}</span>
          )}
        </div>
        {!compact && (
          <div className="hidden lg:block text-left max-w-[9rem] min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{userName}</p>
            {userSubtitle ? (
              <p className="text-[11px] text-slate-500 truncate leading-tight">{userSubtitle}</p>
            ) : null}
          </div>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            compact ? 'mr-0.5' : ''
          }`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-[calc(100%+8px)] z-[70] w-[17.5rem] bg-white ${SHELL_R} shadow-[0_12px_40px_rgba(15,23,42,0.12)] border border-slate-200/90 overflow-hidden`}
          role="menu"
        >
            {viewSwitcher ? (
              <ViewSwitcherPanel
                activeView={viewSwitcher.activeView}
                userProfile={viewSwitcher.userProfile}
                companyProfile={viewSwitcher.companyProfile}
                sessionPhotoPath={viewSwitcher.sessionPhotoPath}
                sessionName={viewSwitcher.sessionName}
                onSwitch={handleSwitch}
              />
            ) : null}

            <div className={viewSwitcher ? 'border-t border-slate-100' : ''}>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                role="menuitem"
              >
                <LogOut size={16} strokeWidth={2} className="text-slate-500 shrink-0" />
                Sair da conta
              </button>
            </div>
        </div>
      )}
    </div>
  );
};
