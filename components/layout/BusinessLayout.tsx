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
  ChevronRight
} from 'lucide-react';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Inicializa o estado lendo do localStorage, ou usa false como padrão
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('pagweb_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Salva no localStorage sempre que o estado mudar
  useEffect(() => {
    localStorage.setItem('pagweb_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const menuItems = [
    { icon: LayoutGrid, label: 'Overview', path: '/business/dashboard' },
    { icon: Users, label: 'Clientes', path: '/business/clientes' },
    { icon: Layers, label: 'Planos', path: '/business/planos' },
    { icon: CreditCard, label: 'Assinaturas', path: '/business/assinaturas' },
    { icon: DollarSign, label: 'Gestão de Cobranças', path: '/business/pagamentos' },
    { icon: FileText, label: 'Relatórios', path: '/business/relatorios' },
    // Histórico e Suporte removidos conforme solicitado
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Button - Posicionado exatamente na interseção (top-24 = altura do header do logo) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-24 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors z-50 flex items-center justify-center`}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Section - Altura aumentada para h-24 (96px) para ser maior que o header do site */}
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
        {/* IMPORTANTE: overflow-visible quando colapsado para permitir que o tooltip saia da caixa */}
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
                  
                  {/* Fonte alterada para font-normal (400) */}
                  <span className={`font-normal text-base whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
                  }`}>
                    {item.label}
                  </span>
                </Link>

                {/* Tooltip for collapsed state - Moved outside Link to avoid overflow issues if possible, but mainly relying on nav overflow-visible */}
                {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] shadow-lg font-medium transition-opacity">
                      {item.label}
                      {/* Seta do tooltip */}
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
            {/* Fonte alterada para font-normal (400) */}
            <span className={`text-base font-normal whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
            }`}>
                Configurações
            </span>
          </Link>
           {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] shadow-lg font-medium transition-opacity">
                  Configurações
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                </div>
            )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Top Header - Mantido h-20, menor que a área do logo (h-24) */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center text-sm text-gray-500">
            <span className="hover:text-gray-900 cursor-pointer transition-colors">Dashboards</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-900 font-medium">
               {menuItems.find(i => i.path === location.pathname)?.label || (location.pathname.includes('configuracoes') ? 'Configurações' : 'Overview')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100 h-8">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">ERP System</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold border border-gray-200 shadow-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};