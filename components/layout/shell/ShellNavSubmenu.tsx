import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { ShellNavItem } from './shellTypes';
import { SHELL_R } from './shellTheme';

interface ShellAccentNav {
  navActive: string;
  navInactive: string;
  navIndicator: string;
  navIconActive: string;
  badgeRing: string;
}

interface ShellNavSubmenuProps {
  item: ShellNavItem;
  isCollapsed: boolean;
  currentPath: string;
  accent: ShellAccentNav;
}

export const ShellNavSubmenu: React.FC<ShellNavSubmenuProps> = ({
  item,
  isCollapsed,
  currentPath,
  accent,
}) => {
  const children = item.children ?? [];
  const isChildActive = children.some((child) => child.path === currentPath);
  const [isOpen, setIsOpen] = useState(isChildActive);
  const ItemIcon = item.icon;

  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  if (isCollapsed) {
    return (
      <div className="relative group">
        <button
          type="button"
          className={`relative flex items-center justify-center w-full ${SHELL_R} transition-all duration-200 select-none p-3 ${
            isChildActive ? accent.navActive : accent.navInactive
          }`}
          aria-label={item.label}
        >
          <ItemIcon
            size={20}
            strokeWidth={isChildActive ? 2.25 : 2}
            className={isChildActive ? accent.navIconActive : 'text-slate-500 group-hover:text-slate-300'}
          />
        </button>
        <div
          className="absolute left-full top-0 z-[60] pl-4 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <div
            className={`min-w-[11rem] py-1.5 bg-slate-800 border border-slate-700 ${SHELL_R} shadow-xl`}
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {item.label}
            </p>
            {children.map((child) => {
              const isActive = currentPath === child.path;
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-white/10 text-white font-medium' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {ChildIcon && <ChildIcon size={16} className="shrink-0 opacity-80" />}
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`relative flex items-center w-full ${SHELL_R} transition-all duration-200 gap-3 px-3 py-2.5 ${
          isChildActive ? accent.navActive : accent.navInactive
        }`}
      >
        {isChildActive && (
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-[5px] ${accent.navIndicator}`}
          />
        )}
        <ItemIcon
          size={20}
          strokeWidth={isChildActive ? 2.25 : 2}
          className={isChildActive ? accent.navIconActive : 'text-slate-500'}
        />
        <span className={`flex-1 text-sm truncate text-left ${isChildActive ? 'font-medium' : ''}`}>
          {item.label}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
          {children.map((child) => {
            const isActive = currentPath === child.path;
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.path}
                to={child.path}
                className={`flex items-center gap-2.5 rounded-[5px] px-3 py-2 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white font-medium ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {ChildIcon && (
                  <ChildIcon
                    size={16}
                    strokeWidth={isActive ? 2.25 : 2}
                    className={isActive ? accent.navIconActive : 'text-slate-500'}
                  />
                )}
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
