
import React from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Store, MapPin, Phone, MoreHorizontal } from 'lucide-react';

export const Empresas: React.FC = () => {
  // Mock Data
  const companies = [
    // { id: 1, nome: 'Academia SuperFit', endereco: 'Rua das Flores, 123', telefone: '(11) 99999-9999', status: 'Ativo' }
  ];

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
        <p className="text-gray-500 mt-1">Lojas e empresas onde você possui cadastro ou assinaturas.</p>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Store className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-gray-500 max-w-sm mb-6">
                Você ainda não está vinculado a nenhum estabelecimento. Peça para a loja enviar um convite para seu email.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company: any) => (
                <div key={company.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 font-bold text-xl">
                            {company.nome.substring(0,2).toUpperCase()}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{company.nome}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                        <MapPin className="w-3.5 h-3.5 mr-1" /> {company.endereco}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                        <Phone className="w-3.5 h-3.5 mr-1" /> {company.telefone}
                    </div>

                    <div className="mt-auto">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
                            {company.status}
                        </span>
                        <Button variant="outline" className="w-full">Ver Detalhes</Button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </UserLayout>
  );
};
