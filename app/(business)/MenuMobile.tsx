import React from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  Layers, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Settings, 
  Plus,
  ChevronRight,
  LogOut,
  MessageCircle,
  Scissors,
  Calendar,
  Clock,
} from 'lucide-react';
import { sessionService } from '../../services/session';

export const MenuMobile: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    { label: 'Novo Cliente', path: '/business/clientes', icon: Users },
    { label: 'Novo Plano', path: '/business/planos', icon: Layers },
    { label: 'Novo Serviço', path: '/business/servicos', icon: Scissors },
  ];

  const allPages = [
    { icon: LayoutGrid, label: 'Overview / Dashboard', path: '/business/dashboard' },
    { icon: Users, label: 'Clientes', path: '/business/clientes' },
    { icon: Layers, label: 'Planos', path: '/business/planos' },
    { icon: Scissors, label: 'Catálogo de Serviços', path: '/business/servicos' },
    { icon: Calendar, label: 'Agendamentos', path: '/business/agendamentos' },
    { icon: Clock, label: 'Horários de Atendimento', path: '/business/horarios-agendamento' },
    { icon: CreditCard, label: 'Assinaturas', path: '/business/assinaturas' },
    { icon: DollarSign, label: 'Gestão de Cobranças', path: '/business/pagamentos' },
    { icon: FileText, label: 'Relatórios', path: '/business/relatorios' },
    { icon: MessageCircle, label: 'WhatsApp', path: '/business/whatsapp' },
    { icon: Settings, label: 'Configurações', path: '/business/configuracoes' },
  ];

  const handleLogout = () => {
    sessionService.logout();
    navigate('/');
  };

  return (
    <BusinessLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu</h1>

        {/* Acesso Rápido */}
        <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Acesso Rápido</h2>
            <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action, idx) => (
                    <Link 
                        key={idx} 
                        to={action.path}
                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 active:bg-gray-50"
                    >
                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-sm">
                            <Plus size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 leading-tight">{action.label}</span>
                    </Link>
                ))}
            </div>
        </section>

        {/* Todas as Páginas */}
        <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Navegação</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {allPages.map((page, idx) => (
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

        {/* Logout Button */}
        <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-700 font-medium rounded-xl border border-red-100 active:bg-red-100 transition-colors"
        >
            <LogOut size={18} />
            Sair do Sistema
        </button>

      </div>
    </BusinessLayout>
  );
};