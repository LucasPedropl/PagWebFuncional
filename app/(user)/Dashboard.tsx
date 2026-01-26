import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../../services/session';
import { Button } from '../../components/ui/Button';
import { User, LogOut, LayoutDashboard, CreditCard, Settings } from 'lucide-react';
import { User as UserType } from '../../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (!sessionService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const session = sessionService.getSession();
    setUser(session.user);
  }, [navigate]);

  const handleLogout = () => {
    sessionService.logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-600 p-2 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-xl text-gray-900">PagWeb</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user.nome}</span>
                <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                {user.nome.charAt(0).toUpperCase()}
            </div>
            <button 
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Sair"
            >
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
            <p className="text-gray-600">Bem-vindo ao seu painel de controle, {user.nome}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Assinaturas Ativas</h3>
                    <div className="bg-green-100 p-2 rounded-lg">
                        <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500 mt-1">Nenhuma assinatura encontrada</p>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Perfil</h3>
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{user.tipo}</div>
                <p className="text-xs text-gray-500 mt-1">Status da conta: Ativo</p>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Configurações</h3>
                    <div className="bg-gray-100 p-2 rounded-lg">
                        <Settings className="w-5 h-5 text-gray-600" />
                    </div>
                </div>
                <div className="text-sm text-gray-600">
                    Gerencie seus dados e preferências.
                </div>
                <Button variant="outline" className="mt-4 w-full text-sm py-2">
                    Acessar Configurações
                </Button>
            </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Comece Agora</h3>
                <p className="text-gray-500 mb-6">Você ainda não possui assinaturas em estabelecimentos parceiros.</p>
                <Button>
                    Buscar Estabelecimentos
                </Button>
            </div>
        </div>
      </main>
    </div>
  );
};