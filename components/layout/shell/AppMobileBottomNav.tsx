import React from 'react';
import { Link } from 'react-router-dom';
import type { ShellNavItem } from './shellTypes';
import { SHELL_R } from './shellTheme';

interface AppMobileBottomNavProps {
  items: ShellNavItem[];
  currentPath: string;
}

export const AppMobileBottomNav: React.FC<AppMobileBottomNavProps> = ({ items, currentPath }) => (
  <nav
    className="md:hidden fixed z-50 left-3 right-3 pointer-events-none"
    style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    aria-label="Menu principal"
  >
    <div
      className={`pointer-events-auto flex items-stretch gap-0.5 p-1 ${SHELL_R} bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_32px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04]`}
    >
      {items.map((item) => {
        const isActive = currentPath === item.path;
        const ItemIcon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-1 flex-col items-center justify-center py-2 px-0.5 ${SHELL_R} transition-all min-w-0 select-none ${
              isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="relative flex items-center justify-center">
              <ItemIcon size={20} strokeWidth={isActive ? 2.35 : 2} />
              {item.badge != null && item.badge > 0 && (
                <span
                  className={`absolute -top-1 -right-2 flex min-w-[14px] h-[14px] items-center justify-center rounded-full text-[8px] font-bold px-0.5 ${
                    isActive ? 'bg-white text-slate-900 ring-1 ring-slate-900/10' : 'bg-slate-900 text-white ring-2 ring-white'
                  }`}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </span>
            <span
              className={`mt-0.5 text-[9px] truncate max-w-full px-0.5 leading-none ${
                isActive ? 'font-semibold opacity-95' : 'font-medium opacity-80'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  </nav>
);
