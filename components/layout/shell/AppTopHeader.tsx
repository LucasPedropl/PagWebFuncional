import React from 'react';
import { Menu } from 'lucide-react';
import { AppNotification } from '../../../types';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ShellUserMenu } from './ShellUserMenu';
import { SHELL_HEADER_HEIGHT, SHELL_R } from './shellTheme';
import type { ViewSwitcherPanelProps } from './ViewSwitcherPanel';

interface AppTopHeaderProps {
  pageTitle: string;
  userName: string;
  userSubtitle?: string;
  userPhotoPath: string | null;
  onLogout: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  viewSwitcher?: ViewSwitcherPanelProps;
  notifications: {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    items: AppNotification[];
    loading: boolean;
    unreadCount: number;
    onMarkRead: (id: number) => void;
    onMarkAllRead: () => void;
    onClearAll: () => void;
    onDelete: (e: React.MouseEvent, id: number) => void;
  };
}

export const AppTopHeader: React.FC<AppTopHeaderProps> = ({
  pageTitle,
  userName,
  userSubtitle,
  userPhotoPath,
  onLogout,
  isSidebarCollapsed,
  onToggleSidebar,
  viewSwitcher,
  notifications,
}) => (
  <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 select-none">
    <div className={`${SHELL_HEADER_HEIGHT} flex items-center justify-between gap-3 px-4 md:px-5 lg:px-6`}>
      <div className="min-w-0 flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`hidden md:flex items-center justify-center w-9 h-9 ${SHELL_R} text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 transition-colors shrink-0`}
          title={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-expanded={!isSidebarCollapsed}
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>

        <h1 className="text-[15px] md:text-base font-semibold text-slate-900 tracking-tight truncate leading-tight">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <NotificationsDropdown
          isOpen={notifications.isOpen}
          onToggle={notifications.onToggle}
          onClose={notifications.onClose}
          notifications={notifications.items}
          loading={notifications.loading}
          unreadCount={notifications.unreadCount}
          onMarkRead={notifications.onMarkRead}
          onMarkAllRead={notifications.onMarkAllRead}
          onClearAll={notifications.onClearAll}
          onDelete={notifications.onDelete}
        />

        <div className="hidden md:block h-6 w-px bg-slate-200/90" aria-hidden />

        <div className="hidden md:flex">
          <ShellUserMenu
            userName={userName}
            userSubtitle={userSubtitle}
            userPhotoPath={userPhotoPath}
            onLogout={onLogout}
            viewSwitcher={viewSwitcher}
          />
        </div>

        <div className="md:hidden">
          <ShellUserMenu
            userName={userName}
            userPhotoPath={userPhotoPath}
            onLogout={onLogout}
            viewSwitcher={viewSwitcher}
            compact
          />
        </div>
      </div>
    </div>
  </header>
);
