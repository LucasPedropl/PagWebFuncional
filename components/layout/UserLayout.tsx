import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Store, 
  Receipt, 
  Settings, 
  Bell,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu as MenuIcon
} from 'lucide-react';
import { sessionService } from '../../services/session';

interface UserLayoutProps {
  children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('pagweb_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  useEffect(() => {
    localStorage.setItem('pagweb_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: Store, label: 'Minhas Empresas', path: '/empresas' },
    { icon: CreditCard, label: 'Assinaturas', path: '/assinaturas' },
    { icon: Receipt, label: 'Pagamentos', path: '/pagamentos' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  // Mobile Footer Items
  const mobileMenuItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: Store, label: 'Empresas', path: '/empresas' },
    { icon: CreditCard, label: 'Assin.', path: '/assinaturas' },
    { icon: Receipt, label: 'Pag.', path: '/pagamentos' },
    { icon: MenuIcon, label: 'Menu', path: '/menu' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar - HIDDEN ON MOBILE */}
      <aside 
        className={`hidden md:flex bg-white border-r border-gray-200 flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-24 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm text-gray-500 hover:text-slate-900 hover:border-slate-300 transition-colors z-50 flex items-center justify-center`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`h-24 flex items-center border-b border-gray-100 transition-all duration-300 ${
            isCollapsed ? 'justify-center px-0' : 'px-6'
        }`}>
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 p-2 rounded-lg">
                <UserCircle className={`text-white transition-all duration-300 ${isCollapsed ? 'w-6 h-6' : 'w-6 h-6'}`} />
             </div>
             <span className={`text-xl font-bold text-slate-900 overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
             }`}>
                Área do Cliente
             </span>
          </div>
        </div>

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

        <div className="p-3 border-t border-gray-100">
           <button
             onClick={handleLogout}
             className={`w-full flex items-center py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors relative ${
               isCollapsed ? 'justify-center px-0' : 'px-4'
             }`}
           >
             <LogOut size={20} className={`min-w-[20px] ${isCollapsed ? '' : 'mr-3'}`} />
             <span className={`text-base font-normal whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
             }`}>
                Sair
             </span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'md:ml-20' : 'md:ml-64'
      } w-full`}>
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center text-sm text-gray-500">
            <span className="text-gray-900 font-medium text-lg md:text-sm">
               {menuItems.find(i => i.path === location.pathname)?.label || 'PagWeb'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-100 h-8">
               <span className="text-sm font-semibold text-gray-900">Minha Conta</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Footer */}
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