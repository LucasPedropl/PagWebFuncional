
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  Layers, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Settings, 
  Bell,
  Wallet,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu as MenuIcon,
  Info,
  MessageCircle
} from 'lucide-react';
import { sessionService } from '../../services/session';
import { userService } from '../../services/userService';
import { AppNotification } from '../../types';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('pagweb_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    localStorage.setItem('pagweb_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Carrega notificações ao montar
  useEffect(() => {
      fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
          // Usa o mesmo serviço (endpoint é compartilhado por token)
          const data = await userService.listNotifications();
          const sorted = data.sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());
          setNotifications(sorted);
      } catch (error) {
          console.error("Erro ao carregar notificações", error);
      } finally {
          setLoadingNotifications(false);
      }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.lida);
    if (unreadNotifications.length === 0) return;

    try {
      // Mark all as read locally first for fast UI
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      
      // Call API for each unread notification
      await Promise.all(unreadNotifications.map(n => userService.markNotificationAsSeen(n.id)));
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas", error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      await userService.markNotificationAsSeen(id);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida", error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await userService.deleteNotification(id);
    } catch (error) {
      console.error("Erro ao deletar notificação", error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      setNotifications([]);
      await userService.clearAllNotifications();
    } catch (error) {
      console.error("Erro ao limpar notificações", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  const formatTimeAgo = (isoString: string) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'agora';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
      return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  };

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutGrid, label: 'Overview', path: '/business/dashboard' },
    { icon: Users, label: 'Clientes', path: '/business/clientes' },
    { icon: Layers, label: 'Planos', path: '/business/planos' },
    { icon: CreditCard, label: 'Assinaturas', path: '/business/assinaturas' },
    { icon: DollarSign, label: 'Gestão de Cobranças', path: '/business/pagamentos' },
    { icon: FileText, label: 'Relatórios', path: '/business/relatorios' },
    { icon: MessageCircle, label: 'WhatsApp', path: '/business/whatsapp' },
  ];

  // Menu items for Mobile Footer (5 items max usually)
  const mobileMenuItems = [
    { icon: LayoutGrid, label: 'Início', path: '/business/dashboard' },
    { icon: Users, label: 'Clientes', path: '/business/clientes' },
    { icon: CreditCard, label: 'Assin.', path: '/business/assinaturas' },
    { icon: DollarSign, label: 'Cobr.', path: '/business/pagamentos' },
    { icon: MenuIcon, label: 'Menu', path: '/business/menu' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar - HIDDEN ON MOBILE (md:flex) */}
      <aside 
        className={`hidden md:flex bg-white border-r border-gray-200 flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-24 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm text-gray-500 hover:text-slate-900 hover:border-slate-300 transition-colors z-50 flex items-center justify-center`}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Section */}
        <div className={`h-24 flex items-center border-b border-gray-100 transition-all duration-300 ${
            isCollapsed ? 'justify-center px-0' : 'px-6'
        }`}>
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 p-2 rounded-lg">
                <Wallet className={`text-white transition-all duration-300 ${isCollapsed ? 'w-6 h-6' : 'w-6 h-6'}`} />
             </div>
             <span className={`text-xl font-bold text-slate-900 overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
             }`}>
                PagWeb
             </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-2 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'}`}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path} className="px-3 relative group">
                <Link
                  to={item.path}
                  className={`flex items-center py-3.5 rounded-lg transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
                >
                  <item.icon 
                    size={20}
                    className={`min-w-[20px] transition-all duration-200 ${
                      isCollapsed ? '' : 'mr-3'
                    } ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} 
                  />
                  
                  <span className={`font-normal text-base whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
                  }`}>
                    {item.label}
                  </span>
                </Link>

                {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] shadow-lg font-medium transition-opacity">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                    </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-100 space-y-1 relative group">
          <Link
            to="/business/configuracoes"
            className={`flex items-center py-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors relative ${
               isCollapsed ? 'justify-center px-0' : 'px-4'
            } ${location.pathname === '/business/configuracoes' ? 'bg-slate-50 text-slate-900 font-medium' : ''}`}
          >
            <Settings 
                size={20} 
                className={`min-w-[20px] ${isCollapsed ? '' : 'mr-3'} text-slate-400 group-hover:text-slate-600`} 
            />
            <span className={`text-base font-normal whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
            }`}>
                Configurações
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content Wrapper - Adjusted margins for mobile */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      } w-full`}>
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center text-sm text-gray-500">
            <span className="hidden md:inline hover:text-gray-900 cursor-pointer transition-colors">Dashboards</span>
            <span className="hidden md:inline mx-2 text-gray-300">/</span>
            <span className="text-gray-900 font-medium text-lg md:text-sm">
               {menuItems.find(i => i.path === location.pathname)?.label || 
                (location.pathname.includes('configuracoes') ? 'Configurações' : 
                 location.pathname.includes('menu') ? 'Menu' : 'Overview')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            
             {/* Notifications Container */}
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full relative transition-colors ${
                      showNotifications ? 'bg-gray-100 text-slate-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                        <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="font-semibold text-gray-900">Notificações</h3>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {loadingNotifications ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        Carregando...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        Você não tem novas notificações.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {notifications.map((notif, index) => (
                                            <div 
                                                key={`${notif.id}-${index}`} 
                                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.lida ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => !notif.lida && handleMarkAsRead(notif.id)}
                                                onContextMenu={(e) => handleDeleteNotification(e, notif.id)}
                                                title="Clique com o botão direito para deletar"
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                        !notif.lida ? 'bg-slate-100 text-slate-600' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        <Info size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <h4 className={`text-sm ${!notif.lida ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                {notif.titulo}
                                                            </h4>
                                                            {!notif.lida && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 ml-2 shrink-0"></span>}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.mensagem}</p>
                                                        <span className="text-[10px] text-gray-400 mt-2 block">{formatTimeAgo(notif.dataCadastro)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {(notifications.length > 0 || unreadCount > 0) && (
                                <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                                            Marcar todas como lidas
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button onClick={handleClearAllNotifications} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors ml-auto">
                                            Limpar todas
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-100 h-8">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">ERP System</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold border border-gray-200 shadow-sm">
                A
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-1"
                title="Sair do sistema"
              >
                  <LogOut size={18} />
              </button>
            </div>
            {/* Mobile Logout (Simple) */}
            <div className="md:hidden">
                 <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                    <LogOut size={20} />
                 </button>
            </div>
          </div>
        </header>

        {/* Page Content - Add padding bottom on mobile for footer menu */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-center px-4 py-2 z-50 shadow-lg">
            {mobileMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link 
                        key={item.path} 
                        to={item.path}
                        className={`flex flex-col items-center justify-center w-full py-1 gap-1 ${
                            isActive ? 'text-slate-900 font-medium' : 'text-gray-400'
                        }`}
                    >
                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px]">{item.label}</span>
                    </Link>
                )
            })}
        </div>
      </div>
    </div>
  );
};
