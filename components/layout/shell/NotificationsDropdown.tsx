import React from 'react';
import { Bell, Info } from 'lucide-react';
import { AppNotification } from '../../../types';
import { formatNotificationTimeAgo } from './shellUtils';
import { SHELL_R } from './shellTheme';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  notifications: AppNotification[];
  loading: boolean;
  unreadCount: number;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onToggle,
  onClose,
  notifications,
  loading,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onDelete,
}) => (
  <div className="relative">
    <button
      type="button"
      onClick={onToggle}
      aria-label="Notificações"
      aria-expanded={isOpen}
      className={`relative flex items-center justify-center w-9 h-9 ${SHELL_R} transition-all ${
        isOpen
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
      }`}
    >
      <Bell className="w-[17px] h-[17px]" strokeWidth={2} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-900 px-1 text-[9px] font-semibold text-white ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>

    {isOpen && (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
        <div className={`absolute right-0 top-[calc(100%+8px)] w-[min(100vw-1.5rem,20rem)] sm:w-[22rem] bg-white ${SHELL_R} shadow-[0_16px_48px_rgba(15,23,42,0.14)] border border-slate-200/90 z-50 overflow-hidden animate-fadeIn`}>
          <div className="px-4 py-3.5 border-b border-slate-100">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[min(52vh,20rem)] overflow-y-auto custom-scrollbar">
            {loading ? (
              <p className="py-10 text-center text-sm text-slate-500">Carregando...</p>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">Tudo em dia</p>
                <p className="text-xs text-slate-500 mt-1">Nenhuma notificação por aqui.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notif, index) => (
                  <li key={`${notif.id}-${index}`}>
                    <button
                      type="button"
                      className={`w-full text-left p-3.5 hover:bg-slate-50/90 transition-colors ${
                        !notif.lida ? 'bg-slate-50/50' : ''
                      }`}
                      onClick={() => !notif.lida && onMarkRead(notif.id)}
                      onContextMenu={(e) => onDelete(e, notif.id)}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 w-8 h-8 ${SHELL_R} flex items-center justify-center shrink-0 ${
                            !notif.lida ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Info size={14} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p
                              className={`text-[13px] truncate flex-1 ${
                                !notif.lida ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                              }`}
                            >
                              {notif.titulo}
                            </p>
                            {!notif.lida && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                            {notif.mensagem}
                          </p>
                          <time className="text-[10px] text-slate-400 mt-1.5 block tabular-nums">
                            {formatNotificationTimeAgo(notif.dataCadastro)}
                          </time>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(notifications.length > 0 || unreadCount > 0) && (
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className={`text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 ${SHELL_R} hover:bg-white transition-colors`}
                >
                  Marcar como lidas
                </button>
              ) : (
                <span />
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className={`text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 ${SHELL_R} hover:bg-white transition-colors`}
                >
                  Limpar
                </button>
              )}
            </div>
          )}
        </div>
      </>
    )}
  </div>
);
