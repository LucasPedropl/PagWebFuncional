import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import type { ShellAudience, ShellBrand, ShellNavItem } from './shellTypes';
import {
  getShellAccent,
  getShellSidebarBg,
  SHELL_BRAND_HEIGHT,
  SHELL_POPOVER_GAP,
  SHELL_R,
  SHELL_SIDEBAR_WIDTH_COLLAPSED,
  SHELL_SIDEBAR_WIDTH_EXPANDED,
} from './shellTheme';

interface AppSidebarProps {
  audience: ShellAudience;
  isCollapsed: boolean;
  brand: ShellBrand;
  menuItems: ShellNavItem[];
  settingsPath: string;
  currentPath: string;
  topSlot?: React.ReactNode;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  audience,
  isCollapsed,
  brand,
  menuItems,
  settingsPath,
  currentPath,
  topSlot,
}) => {
  const BrandIcon = brand.icon;
  const accent = getShellAccent(audience);
  const sidebarBg = getShellSidebarBg(audience);
  const isSettingsActive = currentPath === settingsPath;

  return (
    <aside
      className={`hidden md:flex fixed inset-y-0 z-50 flex-col overflow-visible select-none border-r ${accent.sidebarBorder} ${sidebarBg} transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isCollapsed ? SHELL_SIDEBAR_WIDTH_COLLAPSED : SHELL_SIDEBAR_WIDTH_EXPANDED
      }`}
    >
      <div
        className={`shrink-0 flex items-center border-b ${accent.sidebarBorder} ${SHELL_BRAND_HEIGHT} ${
          isCollapsed ? 'justify-center px-2' : 'px-3.5 gap-2.5'
        }`}
      >
        <div
          className={`shrink-0 flex items-center justify-center ${SHELL_R} ${accent.brandIcon} ${
            isCollapsed ? 'w-10 h-10' : 'w-11 h-11'
          }`}
        >
          <BrandIcon className={isCollapsed ? 'w-5 h-5' : 'w-[22px] h-[22px]'} strokeWidth={2.2} />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white tracking-tight leading-tight truncate">
              {brand.label}
            </p>
          </div>
        )}
      </div>

      {topSlot ? (
        <div className={`shrink-0 select-none overflow-visible ${isCollapsed ? 'px-2 py-3.5' : 'px-3 py-4'}`}>
          {topSlot}
        </div>
      ) : null}

      <nav
        className={`flex-1 py-2 select-none custom-scrollbar-dark ${
          isCollapsed ? 'overflow-visible px-2 space-y-1.5' : 'overflow-y-auto overflow-x-hidden px-3 space-y-1.5'
        }`}
      >
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          const ItemIcon = item.icon;
          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                className={`relative flex items-center ${SHELL_R} transition-all duration-200 select-none ${
                  isActive ? accent.navActive : accent.navInactive
                } ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}
              >
                {isActive && !isCollapsed && (
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-[5px] ${accent.navIndicator}`}
                  />
                )}
                <span className="relative flex items-center justify-center shrink-0">
                  <ItemIcon
                    size={20}
                    strokeWidth={isActive ? 2.25 : 2}
                    className={
                      isActive
                        ? accent.navIconActive
                        : 'text-slate-500 group-hover:text-slate-300'
                    }
                  />
                  {item.badge != null && item.badge > 0 && isCollapsed && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-0.5 text-[9px] font-semibold text-white ring-2 ${accent.badgeRing}`}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                {!isCollapsed && (
                  <>
                    <span className={`flex-1 text-sm truncate ${isActive ? 'font-medium' : ''}`}>
                      {item.label}
                    </span>
                    {item.badge != null && item.badge > 0 && (
                      <span
                        className={`shrink-0 tabular-nums min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center ${SHELL_R} bg-blue-600 text-[10px] font-semibold text-white`}
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
              {isCollapsed && (
                <div
                  className={`absolute left-full ${SHELL_POPOVER_GAP} top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium ${SHELL_R} opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-[60] shadow-lg transition-opacity select-none`}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={`shrink-0 border-t ${accent.sidebarBorder} p-2 select-none ${isCollapsed ? '' : 'px-3'}`}>
        <Link
          to={settingsPath}
          className={`flex items-center ${SHELL_R} transition-all duration-200 select-none ${
            isSettingsActive ? accent.navActive : accent.navInactive
          } ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}
        >
          <Settings size={20} className="shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
        </Link>
      </div>
    </aside>
  );
};
