import React, { useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Search, Filter, Download, Calendar, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Mock Data
const TRANSACTIONS = [
  { id: '#TRX-9821', cliente: 'João da Silva', data: '24/10/2023', metodo: 'Cartão', valor: 'R$ 99,00', status: 'Pago' },
  { id: '#TRX-9822', cliente: 'Maria Oliveira', data: '23/10/2023', metodo: 'Boleto', valor: 'R$ 49,00', status: 'Pendente' },
  { id: '#TRX-9823', cliente: 'Carlos Ferreira', data: '22/10/2023', metodo: 'Cartão', valor: 'R$ 149,00', status: 'Falha' },
  { id: '#TRX-8100', cliente: 'João da Silva', data: '24/09/2023', metodo: 'Cartão', valor: 'R$ 99,00', status: 'Pago' },
  { id: '#TRX-9824', cliente: 'Ana Souza', data: '19/10/2023', metodo: 'Pix', valor: 'R$ 1200,00', status: 'Pago' },
];

export const Pagamentos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <BusinessLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Cobranças</h1>
          <p className="text-gray-500 mt-1">Histórico financeiro e transações.</p>
        </div>
        <Button variant="outline" className="bg-white text-gray-600 border-gray-300">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">Receita Aprovada (Mês)</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">R$ 12.450,00</span>
                <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                </span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">Pendente</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">R$ 1.280,00</span>
                <span className="text-xs text-gray-400">
                    12 transações
                </span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">Falhas / Estornos</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">R$ 340,00</span>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded flex items-center">
                    <ArrowDownRight className="w-3 h-3 mr-1" /> -2%
                </span>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="text-gray-600 bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Status
            </Button>
            <Button variant="outline" className="text-gray-600 bg-white">
            <Calendar className="w-4 h-4 mr-2" />
            Data
            </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Referência</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TRANSACTIONS.map((trx, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{trx.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{trx.cliente}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{trx.data}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{trx.metodo}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{trx.valor}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      trx.status === 'Pago' 
                        ? 'bg-green-100 text-green-700' 
                        : trx.status === 'Pendente' 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                         trx.status === 'Pago' 
                         ? 'bg-green-500' 
                         : trx.status === 'Pendente' 
                             ? 'bg-amber-500'
                             : 'bg-red-500'
                      }`}></span>
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BusinessLayout>
  );
};