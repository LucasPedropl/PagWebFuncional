
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Search, Filter, Download, Calendar, MoreHorizontal, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { Mensalidade } from '../../types';

export const Pagamentos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStatusFilter = searchParams.get('status') || 'Todos';

  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  useEffect(() => {
    fetchMensalidades();
  }, []);

  const fetchMensalidades = async () => {
    setIsLoading(true);
    try {
        const data = await businessService.listMensalidades();
        // Ordenar por vencimento (parse DD/MM/YYYY)
        const sorted = data.sort((a, b) => {
            const dateA = a.vencimento.split('/').reverse().join('-');
            const dateB = b.vencimento.split('/').reverse().join('-');
            return dateB.localeCompare(dateA); // Mais recente primeiro
        });
        setMensalidades(sorted);
    } catch (error) {
        console.error("Erro ao buscar mensalidades", error);
    } finally {
        setIsLoading(false);
    }
  };

  // Helper de parse date
  const parseDate = (dateStr: string) => {
      const parts = dateStr.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  // Lógica de Filtro Aprimorada
  const filtered = mensalidades.filter(m => {
    const matchesSearch = 
        (m.nomeCliente && m.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.idMensalidade.toString().includes(searchTerm));

    let matchesStatus = true;
    
    if (statusFilter !== 'Todos') {
        if (statusFilter === 'Atrasado') {
             // Lógica específica para Atrasado: Status API 'Atrasado' OU (Status 'Aberto' E Data < Hoje)
             const isApiAtrasado = m.status === 'Atrasado';
             const isCalculatedAtrasado = m.status === 'Aberto' && parseDate(m.vencimento) < new Date();
             matchesStatus = isApiAtrasado || isCalculatedAtrasado;
        } else {
             // Filtro exato para outros status
             matchesStatus = m.status === statusFilter;
        }
    }

    return matchesSearch && matchesStatus;
  });

  // Cálculos Rápidos para os Cards Superiores baseados nos dados carregados
  const totalReceita = mensalidades
    .filter(m => m.status === 'Pago' || m.status === 'Baixado')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalPendente = mensalidades
    .filter(m => m.status === 'Aberto' && parseDate(m.vencimento) >= new Date())
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalAtrasado = mensalidades
    .filter(m => m.status === 'Atrasado' || (m.status === 'Aberto' && parseDate(m.vencimento) < new Date()))
    .reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <BusinessLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Cobranças</h1>
          <p className="text-gray-500 mt-1">Histórico financeiro e transações.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchMensalidades} className="bg-white" title="Atualizar Lista">
                <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="bg-white text-gray-600 border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">Receita Total Realizada</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">R$ {totalReceita.toFixed(2).replace('.', ',')}</span>
                <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Recebido
                </span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">A Receber (Em dia)</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">R$ {totalPendente.toFixed(2).replace('.', ',')}</span>
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded flex items-center">
                    Futuro
                </span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="mb-2">
                <span className="text-sm font-medium text-gray-500">Total em Atraso</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">R$ {totalAtrasado.toFixed(2).replace('.', ',')}</span>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded flex items-center">
                    <ArrowDownRight className="w-3 h-3 mr-1" /> Cobrar
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-gray-900 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto">
            {['Todos', 'Aberto', 'Pago', 'Atrasado'].map(status => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        statusFilter === status 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                  <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center text-gray-500">
                              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando cobranças...
                          </div>
                      </td>
                  </tr>
              ) : filtered.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          Nenhuma cobrança encontrada com os filtros atuais.
                      </td>
                  </tr>
              ) : (
                filtered.map((trx) => {
                    // Recalcula status visual se estiver aberto e vencido
                    let displayStatus = trx.status;
                    let isCalculatedLate = false;
                    
                    if (trx.status === 'Aberto') {
                        const d = parseDate(trx.vencimento);
                        if (d < new Date()) {
                            displayStatus = 'Atrasado';
                            isCalculatedLate = true;
                        }
                    }

                    return (
                        <tr key={trx.idMensalidade} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">#{trx.idMensalidade}</td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900">{trx.nomeCliente}</span>
                                <span className="text-xs text-gray-400">{trx.emailCliente}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                            {trx.vencimento}
                            {isCalculatedLate && <span className="ml-2 text-[10px] text-red-500 font-bold">(Vencido)</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{trx.metodo || '-'}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            R$ {trx.valor.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            displayStatus === 'Pago' 
                                ? 'bg-green-100 text-green-700' 
                                : displayStatus === 'Aberto' 
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                displayStatus === 'Pago' 
                                ? 'bg-green-500' 
                                : displayStatus === 'Aberto' 
                                    ? 'bg-blue-500'
                                    : 'bg-red-500'
                            }`}></span>
                            {displayStatus}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                            <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BusinessLayout>
  );
};
