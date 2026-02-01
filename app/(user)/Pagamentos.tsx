
import React from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Download, Filter, Search, FileText } from 'lucide-react';

export const Pagamentos: React.FC = () => {
  // Mock Data
  const history: any[] = [];

  return (
    <UserLayout>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Faturas</h1>
          <p className="text-gray-500 mt-1">Histórico de cobranças e comprovantes.</p>
        </div>
        <Button variant="outline" className="bg-white">
            <Download className="w-4 h-4 mr-2" />
            Baixar Comprovantes
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar fatura..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-900 placeholder-gray-400"
          />
        </div>
        <Button variant="outline" className="bg-white text-gray-600">
            <Filter className="w-4 h-4 mr-2" /> Filtros
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-4">Vencimento</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Estabelecimento</th>
                        <th className="px-6 py-4">Método</th>
                        <th className="px-6 py-4">Valor</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {history.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center">
                                    <FileText className="w-10 h-10 text-gray-300 mb-2" />
                                    <p>Nenhuma fatura encontrada.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        history.map((item, idx) => (
                            <tr key={idx}>
                                {/* Map data here */}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </UserLayout>
  );
};
