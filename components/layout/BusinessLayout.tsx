import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  Layers, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Activity, 
  LifeBuoy, 
  Settings, 
  LogOut,
  Bell,
  Wallet,
  ChevronLeft
} from 'lucide-react';
import { sessionService } from '../../services/session';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

export const BusinessLayout: React.FC<BusinessLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionService.logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutGrid, label: 'Overview', path: '/business/dashboard' },
    { icon: Users, label: 'Clientes', path: '/business/clientes' },
    { icon: Layers, label: 'Planos', path: '/business/planos' },
    { icon: CreditCard, label: 'Assinaturas', path: '/business/assinaturas' },
    { icon: DollarSign, label: 'Pagamentos', path: '/business/pagamentos' },
    { icon: FileText, label: 'Relatórios', path: '/business/relatorios' },
    { icon: Activity, label: 'Histórico', path: '/business/historico' },
    { icon: LifeBuoy, label: 'Suporte', path: '/business/suporte' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Wallet className="w-8 h-8 text-slate-900 mr-2" />
          <span className="text-xl font-bold text-slate-900">PagWeb</span>
          <button className="ml-auto p-1 text-gray-400 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group ${
                  isActive 
                    ? 'bg-slate-900 text-white' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link
            to="/business/configuracoes"
            className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 group"
          >
            <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
            Configurações
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 group"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-500" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center text-sm text-gray-500">
            <span className="hover:text-gray-900 cursor-pointer">Dashboards</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Default</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">ERP System</p>
              </div>
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
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