
import React from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  CreditCard, 
  Receipt, 
  Settings, 
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { sessionService } from '../../services/session';

export const MenuMobile: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: Store, label: 'Estabelecimentos', path: '/empresas' }, // Atualizado
    { icon: CreditCard, label: 'Minhas Assinaturas', path: '/assinaturas' },
    { icon: Receipt, label: 'Minhas Faturas', path: '/pagamentos' }, 
    { icon: CreditCard, label: 'Métodos de Pagamento', path: '/metodos-pagamento' },
    { icon: Settings, label: 'Configurações da Conta', path: '/configuracoes' },
  ];

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  return (
    <UserLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 bg-slate-900 p-6 rounded-2xl text-white shadow-lg">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
            </div>
            <div>
                <h2 className="font-bold text-lg">Minha Conta</h2>
                <p className="text-slate-300 text-sm">Gerencie seu perfil</p>
            </div>
        </div>

        <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Navegação</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {menuItems.map((page, idx) => (
                    <Link 
                        key={idx}
                        to={page.path}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-slate-500">
                                <page.icon size={20} />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{page.label}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                    </Link>
                ))}
            </div>
        </section>

        <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-700 font-medium rounded-xl border border-red-100 active:bg-red-100 transition-colors"
        >
            <LogOut size={18} />
            Sair do Sistema
        </button>
      </div>
    </UserLayout>
  );
};
