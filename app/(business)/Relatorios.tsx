import React, { useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Calendar, PieChart } from 'lucide-react';

export const Relatorios: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');

  return (
    <BusinessLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios de Performance</h1>
          <p className="text-gray-500 mt-1">Análise detalhada de receita, churn e crescimento.</p>
        </div>
        <div className="flex gap-3">
            <select 
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
            >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Último Trimestre</option>
                <option value="365">Este Ano</option>
            </select>
            <Button variant="outline" className="bg-white text-gray-600 border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">MRR (Receita Recorrente)</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">R$ 42.500,00</h3>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-slate-900" />
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +8.2%
                </span>
                <span className="text-gray-400 ml-2">vs. mês anterior</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Churn Rate (Cancelamentos)</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">1.8%</h3>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                    <Users className="w-5 h-5 text-red-600" />
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium flex items-center">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    -0.5%
                </span>
                <span className="text-gray-400 ml-2">vs. mês anterior</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">Ticket Médio (ARPU)</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">R$ 145,00</h3>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                    <PieChart className="w-5 h-5 text-green-600" />
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500 font-medium flex items-center">
                    0.0%
                </span>
                <span className="text-gray-400 ml-2">estável</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Barras Simulado (Crescimento) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Crescimento de Receita</h3>
            <div className="h-64 flex items-end justify-between gap-4">
                {[40, 55, 45, 60, 75, 65, 85, 90, 80, 95, 100, 110].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                        <div 
                            className="w-full bg-slate-100 rounded-t-sm group-hover:bg-slate-800 transition-colors relative" 
                            style={{ height: `${h}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                R$ {h}k
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-gray-400 uppercase font-medium">
                <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
                <span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
            </div>
        </div>

        {/* Top Planos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Planos Mais Vendidos</h3>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="w-3 h-3 bg-slate-900 rounded-full mr-3"></span>
                        <span className="text-gray-700 font-medium">Plano Enterprise</span>
                    </div>
                    <span className="text-gray-900 font-bold">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-slate-900 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="w-3 h-3 bg-blue-400 rounded-full mr-3"></span>
                        <span className="text-gray-700 font-medium">Plano Pro</span>
                    </div>
                    <span className="text-gray-900 font-bold">30%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="w-3 h-3 bg-gray-300 rounded-full mr-3"></span>
                        <span className="text-gray-700 font-medium">Plano Básico</span>
                    </div>
                    <span className="text-gray-900 font-bold">25%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-300 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
            </div>
        </div>
      </div>

      {/* Tabela de Detalhes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Histórico de Transações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Data</th>
                        <th className="px-6 py-3 font-semibold">Descrição</th>
                        <th className="px-6 py-3 font-semibold">Tipo</th>
                        <th className="px-6 py-3 font-semibold text-right">Valor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    <tr>
                        <td className="px-6 py-3 text-gray-500">24/10/2023</td>
                        <td className="px-6 py-3 text-gray-900 font-medium">Renovação - João Silva</td>
                        <td className="px-6 py-3"><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Entrada</span></td>
                        <td className="px-6 py-3 text-right text-gray-900">R$ 99,00</td>
                    </tr>
                    <tr>
                        <td className="px-6 py-3 text-gray-500">23/10/2023</td>
                        <td className="px-6 py-3 text-gray-900 font-medium">Nova Assinatura - Empresa XYZ</td>
                        <td className="px-6 py-3"><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Entrada</span></td>
                        <td className="px-6 py-3 text-right text-gray-900">R$ 299,00</td>
                    </tr>
                    <tr>
                        <td className="px-6 py-3 text-gray-500">22/10/2023</td>
                        <td className="px-6 py-3 text-gray-900 font-medium">Reembolso - Taxa Indevida</td>
                        <td className="px-6 py-3"><span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">Saída</span></td>
                        <td className="px-6 py-3 text-right text-gray-900">- R$ 49,00</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>

    </BusinessLayout>
  );
};