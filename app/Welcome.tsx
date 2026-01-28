import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Bem-vindo ao PagWeb</h1>
        <p className="text-lg text-gray-600 max-w-lg mx-auto">
          Gerencie suas assinaturas de forma simples e eficiente. Escolha como deseja acessar a plataforma.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Card Cliente */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer" onClick={() => navigate('/login?type=client')}>
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-gray-200 transition-colors">
            <User className="w-10 h-10 text-slate-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sou Cliente</h2>
          <p className="text-gray-500 mb-8">
            Quero gerenciar minhas assinaturas, visualizar cobranças e histórico de pagamentos.
          </p>
          <Button 
            variant="outline"
            className="w-full border-gray-200 text-slate-700 hover:bg-gray-50 hover:text-slate-900 hover:border-slate-300 shadow-none"
          >
            Acessar como Cliente <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Card Estabelecimento */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer" onClick={() => navigate('/login?type=business')}>
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-slate-200 transition-colors">
            <Store className="w-10 h-10 text-slate-800" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sou Estabelecimento</h2>
          <p className="text-gray-500 mb-8">
            Quero gerenciar meus planos, acompanhar métricas, faturamento e base de clientes.
          </p>
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
            Acessar Painel Admin <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};