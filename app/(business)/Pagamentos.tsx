
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Search, Filter, Download, Calendar, MoreHorizontal, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw, HelpCircle, XCircle } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { Mensalidade } from '../../types';
import { useToast } from '../../context/ToastContext';
import { SearchSelect } from '../../components/ui/SearchSelect';

// Componente de Tooltip Interno (Reutilizado)
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex ml-1.5 align-middle">
    <div className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center cursor-help transition-colors">
      <HelpCircle className="w-2.5 h-2.5" />
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] text-center leading-relaxed font-normal">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

export const Pagamentos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStatusFilter = searchParams.get('status') || 'Todos';

  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const { addToast } = useToast();

  // Cancel Payment Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [paymentToCancel, setPaymentToCancel] = useState<Mensalidade | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    fetchMensalidades();
  }, []);

  const fetchMensalidades = async () => {
    setIsLoading(true);
    try {
        const data = await businessService.listMensalidades();
        
        // Determinar status lógico imediatamente para ordenação
        const processedData = data.map(m => {
            let status = m.status;
            if (m.status === 'Aberto' && parseDate(m.vencimento) < new Date()) {
                status = 'Atrasado';
            }
            return { ...m, _computedStatus: status };
        });

        // Ordenar: Atrasados primeiro, depois por data de vencimento mais recente
        const sorted = processedData.sort((a, b) => {
            if (a._computedStatus === 'Atrasado' && b._computedStatus !== 'Atrasado') return -1;
            if (a._computedStatus !== 'Atrasado' && b._computedStatus === 'Atrasado') return 1;
            
            const dateA = a.vencimento.split('/').reverse().join('-');
            const dateB = b.vencimento.split('/').reverse().join('-');
            return dateB.localeCompare(dateA);
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

    let matchesDate = true;
    if (dateStart || dateEnd) {
        const vDate = parseDate(m.vencimento);
        if (dateStart) {
            const sDate = new Date(dateStart);
            if (vDate < sDate) matchesDate = false;
        }
        if (dateEnd) {
            const eDate = new Date(dateEnd);
            eDate.setHours(23, 59, 59, 999);
            if (vDate > eDate) matchesDate = false;
        }
    }

    let matchesValue = true;
    if (minVal) {
        if (m.valor < Number(minVal)) matchesValue = false;
    }
    if (maxVal) {
        if (m.valor > Number(maxVal)) matchesValue = false;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesValue;
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

  const handleCancelClick = (payment: Mensalidade) => {
    setPaymentToCancel(payment);
    setIsCancelModalOpen(true);
  };

  const confirmCancelPayment = async () => {
    if (!paymentToCancel) return;
    setIsCanceling(true);
    try {
      await businessService.cancelPayment(paymentToCancel.idMensalidade);
      addToast('success', 'Sucesso', 'Pagamento cancelado com sucesso.');
      await fetchMensalidades();
      setIsCancelModalOpen(false);
      setPaymentToCancel(null);
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao cancelar pagamento.');
    } finally {
      setIsCanceling(false);
    }
  };

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
            <div className="mb-2 flex items-center">
                <span className="text-sm font-medium text-gray-500">A Receber (Em dia)</span>
                <InfoTooltip text="Total de faturas já geradas e enviadas que estão em aberto. Difere do faturamento anual projetado pois considera apenas cobranças emitidas." />
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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-2 ${showFilters ? 'bg-slate-50 border-slate-300' : ''}`}
          >
              <Filter className="w-4 h-4" /> Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <SearchSelect
                  options={[
                    { value: 'Todos', label: 'Todos os status' },
                    { value: 'Aberto', label: 'Aberto' },
                    { value: 'Pago', label: 'Pago' },
                    { value: 'Atrasado', label: 'Atrasado' },
                  ]}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val.toString())}
                />
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Vencimento</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="date" 
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                </div>
              </div>

              {/* Value Range */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor (R$)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minVal}
                    onChange={(e) => setMinVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxVal}
                    onChange={(e) => setMaxVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-700" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={() => {
                   setStatusFilter('Todos');
                   setDateStart('');
                   setDateEnd('');
                   setMinVal('');
                   setMaxVal('');
                 }} 
                 className="text-gray-600"
               >
                 Limpar Filtros
               </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                      <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex justify-center items-center text-gray-500">
                              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando cobranças...
                          </div>
                      </td>
                  </tr>
              ) : filtered.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Nenhuma cobrança encontrada com os filtros atuais.
                      </td>
                  </tr>
              ) : (
                filtered.map((trx) => {
                    // Usa o status computado durante o fetch ou calcula se necessário
                    const displayStatus = (trx as any)._computedStatus || (trx.status === 'Aberto' && parseDate(trx.vencimento) < new Date() ? 'Atrasado' : trx.status);

                    return (
                        <tr key={trx.idMensalidade} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900">{trx.nomeCliente}</span>
                                <span className="text-xs text-gray-400">{trx.emailCliente}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{trx.vencimento}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{trx.metodo}</td>
                        <td className="px-6 py-4">
                            <span className={`font-semibold ${
                                displayStatus === 'Atrasado' ? 'text-red-600' : 'text-gray-900'
                            }`}>
                                R$ {trx.valor.toFixed(2).replace('.', ',')}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                displayStatus === 'Pago' || displayStatus === 'Baixado'
                                ? 'bg-green-100 text-green-800' 
                                : displayStatus === 'Atrasado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {displayStatus}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                             <div className="relative group inline-block">
                               <button className="text-gray-400 hover:text-slate-900 focus:outline-none">
                                  <MoreHorizontal className="w-5 h-5" />
                               </button>
                               <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block border border-gray-100">
                                  <div className="py-1">
                                    {displayStatus === 'Aberto' || displayStatus === 'Atrasado' ? (
                                      <button 
                                        onClick={() => handleCancelClick(trx)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" /> Cancelar Pagamento
                                      </button>
                                    ) : (
                                      <div className="px-4 py-2 text-sm text-gray-400 italic">
                                        Nenhuma ação disponível
                                      </div>
                                    )}
                                  </div>
                               </div>
                             </div>
                        </td>
                        </tr>
                    )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Payment Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !isCanceling && setIsCancelModalOpen(false)}
        title="Cancelar Pagamento"
        onSubmit={(e) => { e.preventDefault(); confirmCancelPayment(); }}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCanceling}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={isCanceling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, Cancelar'
              )}
            </Button>
          </>
        }
      >
        <div className="p-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Confirmar Cancelamento</h3>
          <p className="text-sm text-gray-500 text-center mb-2">
            Tem certeza que deseja cancelar o pagamento <strong>#{paymentToCancel?.idMensalidade}</strong> do cliente <strong>{paymentToCancel?.nomeCliente}</strong> no valor de <strong>R$ {paymentToCancel?.valor.toFixed(2).replace('.', ',')}</strong>? 
          </p>
          <p className="text-xs text-red-500 text-center font-medium">Esta ação não pode ser desfeita.</p>
        </div>
      </Modal>

    </BusinessLayout>
  );
};
