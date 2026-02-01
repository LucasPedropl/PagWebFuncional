
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { sessionService } from '../../services/session';
import { Button } from '../../components/ui/Button';
import { Store, CreditCard, Receipt, ArrowRight } from 'lucide-react';
import { User } from '../../types';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionService.getSession();
    if (session && session.user) {
      setUser(session.user);
    }
  }, []);

  if (!user) return null;

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user.nome}!</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao seu painel pessoal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Assinaturas Ativas</h3>
                <div className="bg-green-100 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <Button variant="outline" className="w-full mt-4 text-xs h-8" onClick={() => navigate('/assinaturas')}>
                Ver Detalhes
            </Button>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Estabelecimentos Conectados</h3>
                <div className="bg-slate-100 p-2 rounded-lg">
                    <Store className="w-5 h-5 text-slate-900" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <Button variant="outline" className="w-full mt-4 text-xs h-8" onClick={() => navigate('/empresas')}>
                Ver Estabelecimentos
            </Button>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Faturas Pendentes</h3>
                <div className="bg-orange-100 p-2 rounded-lg">
                    <Receipt className="w-5 h-5 text-orange-600" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">R$ 0,00</div>
             <Button variant="outline" className="w-full mt-4 text-xs h-8" onClick={() => navigate('/pagamentos')}>
                Histórico
            </Button>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Conectar a um Estabelecimento</h3>
            <p className="text-gray-500 mb-6 text-sm">
                Para ver seus planos e faturas, você precisa ser convidado por um estabelecimento ou escanear o QR Code da loja.
            </p>
            <Button className="bg-slate-900 hover:bg-slate-800 mx-auto">
                Ler QR Code ou Buscar Loja <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </div>
    </UserLayout>
  );
};
