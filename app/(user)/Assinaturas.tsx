import React from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { CheckCircle2, Calendar, CreditCard, AlertCircle } from 'lucide-react';

export const Assinaturas: React.FC = () => {
  // Mock Data
  const subscriptions: any[] = [
    // { id: 1, plano: 'Plano Gold', empresa: 'Academia SuperFit', valor: 89.90, vencimento: '20/11/2023', status: 'Ativo' }
  ];

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Assinaturas</h1>
        <p className="text-gray-500 mt-1">Gerencie seus planos e serviços contratados.</p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Você não possui assinaturas ativas</h3>
            <p className="text-gray-500 max-w-sm">
                Assim que você contratar um serviço em um estabelecimento parceiro, ele aparecerá aqui.
            </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub: any) => (
             <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{sub.plano}</h3>
                        <p className="text-sm text-gray-500">{sub.empresa}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="flex items-center text-green-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {sub.status}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">Renova em {sub.vencimento}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="text-2xl font-bold text-gray-900">R$ {sub.valor.toFixed(2).replace('.', ',')}</span>
                    <span className="text-xs text-gray-500">/mês</span>
                </div>
             </div>
          ))}
        </div>
      )}
    </UserLayout>
  );
};