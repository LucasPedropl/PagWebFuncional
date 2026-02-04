
import React, { useState, useEffect, useMemo } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, PieChart, Loader2, Calendar, Minus, AlertCircle } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { Mensalidade, SubscriptionResponse, PlanResponse } from '../../types';
import { InfoTooltip } from '../../components/ui/InfoTooltip';

// Helper para formatar moeda
const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

// Helper para tratar datas DD/MM/YYYY
const parseDateBR = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
};

export const Relatorios: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [granularity, setGranularity] = useState<'day' | 'month' | 'year'>('month'); // Padrão Mensal
  const [isLoading, setIsLoading] = useState(true);
  
  // Raw Data
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [assinaturas, setAssinaturas] = useState<SubscriptionResponse[]>([]);
  const [planos, setPlanos] = useState<PlanResponse[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setIsLoading(true);
        const [invData, subData, planData] = await Promise.all([
            businessService.listMensalidades(),
            businessService.listSubscriptions(),
            businessService.listPlans()
        ]);
        setMensalidades(invData);
        setAssinaturas(subData);
        setPlanos(planData);
    } catch (error) {
        console.error("Erro ao carregar dados", error);
    } finally {
        setIsLoading(false);
    }
  };

  // --- ENGINE DE CÁLCULO ---
  const metrics = useMemo(() => {
      const days = parseInt(dateRange);
      const now = new Date();
      // Resetar horas para comparação justa
      now.setHours(23, 59, 59, 999);
      
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - days);

      const previousPeriodDate = new Date(pastDate);
      previousPeriodDate.setDate(previousPeriodDate.getDate() - days);

      // --- 1. RECEITA REALIZADA (Faturas Pagas) - KPIs seguem o filtro de data ---
      const filterPaidInvoices = (start: Date, end: Date) => {
          return mensalidades.filter(m => {
              if (m.status !== 'Pago' && m.status !== 'Baixado') return false;
              const d = parseDateBR(m.vencimento); 
              return d >= start && d <= end;
          });
      };

      const currentInvoices = filterPaidInvoices(pastDate, now);
      const previousInvoices = filterPaidInvoices(previousPeriodDate, pastDate);

      const currentRevenue = currentInvoices.reduce((acc, curr) => acc + curr.valor, 0);
      const previousRevenue = previousInvoices.reduce((acc, curr) => acc + curr.valor, 0);
      
      const revenueDiff = currentRevenue - previousRevenue;
      const revenuePct = previousRevenue > 0 ? (revenueDiff / previousRevenue) * 100 : (currentRevenue > 0 ? 100 : 0);

      // --- 2. MRR ---
      const activeSubs = assinaturas.filter(s => s.status === 'Ativo');
      const currentMRR = activeSubs.reduce((acc, s) => acc + (s.valorComDesconto || 0), 0);
      
      const prevActiveSubs = assinaturas.filter(s => {
          const creationDate = new Date(s.dataInicial);
          return creationDate < pastDate && s.status !== 'Cancelado'; 
      });
      const previousMRR = prevActiveSubs.reduce((acc, s) => acc + (s.valorComDesconto || 0), 0);
      
      const mrrDiff = currentMRR - previousMRR;
      const mrrPct = previousMRR > 0 ? (mrrDiff / previousMRR) * 100 : 0;

      // --- 3. CHURN ---
      const cancelledInPeriod = assinaturas.filter(s => {
          if (s.status !== 'Cancelado') return false;
          const d = s.dataFinal ? new Date(s.dataFinal) : new Date(s.dataInicial); 
          return d >= pastDate && d <= now;
      });

      const churnCount = cancelledInPeriod.length;
      const totalBaseStart = prevActiveSubs.length || 1; 
      const churnRate = (churnCount / totalBaseStart) * 100;

      // --- 4. TICKET MÉDIO (ARPU) ---
      const arpu = currentInvoices.length > 0 ? currentRevenue / currentInvoices.length : 0;
      const prevArpu = previousInvoices.length > 0 ? previousRevenue / previousInvoices.length : 0;
      const arpuDiff = arpu - prevArpu;
      const arpuPct = prevArpu > 0 ? (arpuDiff / prevArpu) * 100 : 0;


      // --- 5. GRÁFICO (Agregação Dinâmica e Expandida) ---
      // O gráfico tem uma lógica de tempo própria para garantir visualização cheia
      const chartData: { label: string, value: number, count: number }[] = [];
      let chartStartDate = new Date(now);

      if (granularity === 'day') {
          // Dia segue o filtro de data selecionado (ex: 30 dias)
          const d = parseInt(dateRange);
          chartStartDate.setDate(chartStartDate.getDate() - d);
          
          for (let i = 0; i < d; i++) {
              const dObj = new Date(chartStartDate);
              dObj.setDate(dObj.getDate() + i + 1);
              chartData.push({ 
                  label: dObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
                  value: 0,
                  count: 0
              });
          }
      } else if (granularity === 'month') {
          // Mês mostra sempre os últimos 12 meses para encher o gráfico
          const monthsToShow = 12;
          chartStartDate = new Date(now);
          chartStartDate.setMonth(chartStartDate.getMonth() - monthsToShow);
          chartStartDate.setDate(1); // Inicio do mês

          for (let i = 1; i <= monthsToShow; i++) {
               const dObj = new Date(chartStartDate);
               dObj.setMonth(dObj.getMonth() + i);
               chartData.push({
                   label: dObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                   value: 0,
                   count: 0
               });
          }
      } else if (granularity === 'year') {
          // Ano mostra os últimos 5 anos
          const yearsToShow = 5;
          chartStartDate = new Date(now);
          chartStartDate.setFullYear(chartStartDate.getFullYear() - yearsToShow);
          chartStartDate.setMonth(0, 1);

          for (let i = 1; i <= yearsToShow; i++) {
              const dObj = new Date(chartStartDate);
              dObj.setFullYear(dObj.getFullYear() + i);
              chartData.push({
                  label: dObj.getFullYear().toString(),
                  value: 0,
                  count: 0
              });
          }
      }

      // Popula o gráfico usando TODAS as mensalidades disponíveis que caibam no range do gráfico
      // Não usamos 'currentInvoices' aqui pois ele é limitado pelo filtro de KPI
      mensalidades.forEach(inv => {
          if (inv.status !== 'Pago' && inv.status !== 'Baixado') return;

          const d = parseDateBR(inv.vencimento);
          // Verifica se a data da fatura está dentro da janela do gráfico
          if (d < chartStartDate || d > now) return;

          let index = -1;

          if (granularity === 'day') {
             const dateLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
             index = chartData.findIndex(c => c.label === dateLabel);
          } else if (granularity === 'month') {
             const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
             index = chartData.findIndex(c => c.label === monthLabel);
          } else if (granularity === 'year') {
             const yearLabel = d.getFullYear().toString();
             index = chartData.findIndex(c => c.label === yearLabel);
          }

          if (index !== -1) {
              chartData[index].value += inv.valor;
              chartData[index].count += 1;
          }
      });

      // --- 6. TOP PLANOS ---
      const planStats: Record<string, number> = {};
      
      const activeSubsForPlans = assinaturas.filter(s => s.status === 'Ativo');
      activeSubsForPlans.forEach(s => {
          const name = s.nomePlano || 'Personalizado';
          planStats[name] = (planStats[name] || 0) + 1;
      });
      const totalActive = activeSubsForPlans.length;

      const topPlans = Object.entries(planStats)
        .map(([name, count]) => ({ name, count, percent: totalActive > 0 ? (count / totalActive) * 100 : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      return {
          currentRevenue, revenueDiff, revenuePct,
          currentMRR, mrrDiff, mrrPct,
          churnCount, churnRate,
          arpu, arpuDiff, arpuPct,
          chartData,
          topPlans,
          recentTransactions: currentInvoices.sort((a, b) => parseDateBR(b.vencimento).getTime() - parseDateBR(a.vencimento).getTime()).slice(0, 10)
      };

  }, [dateRange, granularity, mensalidades, assinaturas, planos]);

  // Helper de Renderização de Tendência
  const renderTrend = (diff: number, pct: number, isCurrency = true, inverse = false) => {
     if (diff === 0) return <span className="text-gray-400 ml-2 flex items-center"><Minus className="w-3 h-3 mr-1"/> Estável</span>;
     
     const isPositive = diff > 0;
     const isGood = inverse ? !isPositive : isPositive; 
     
     const ColorClass = isGood ? 'text-green-600' : 'text-red-600';
     const Icon = isPositive ? TrendingUp : TrendingDown;
     
     const valueStr = isCurrency ? formatCurrency(Math.abs(diff)) : Math.abs(diff);

     return (
         <span className={`${ColorClass} font-medium flex items-center ml-2 text-xs`}>
             <Icon className="w-3 h-3 mr-1" />
             {isPositive ? '+' : '-'}{valueStr} ({Math.abs(pct).toFixed(1)}%)
         </span>
     );
  };

  if (isLoading) {
      return (
        <BusinessLayout>
             <div className="flex items-center justify-center h-full min-h-[500px]">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
              </div>
        </BusinessLayout>
      );
  }

  return (
    <BusinessLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios de Performance</h1>
          <p className="text-gray-500 mt-1">Análise detalhada de receita, churn e crescimento.</p>
        </div>
        <div className="flex gap-3">
            <select 
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5 cursor-pointer outline-none shadow-sm"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
            >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Último Trimestre</option>
                <option value="180">Último Semestre</option>
                <option value="365">Este Ano</option>
            </select>
            <Button variant="outline" className="bg-white text-gray-600 border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Receita Realizada */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">Receita Realizada</p>
                    <InfoTooltip text="Soma total de todos os pagamentos identificados como 'Pago' ou 'Baixado' no período selecionado." />
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-slate-900" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.currentRevenue)}</h3>
            <div className="mt-4 flex items-center flex-wrap">
                <span className="text-xs text-gray-400">vs. período anterior:</span>
                {renderTrend(metrics.revenueDiff, metrics.revenuePct)}
            </div>
        </div>

        {/* MRR */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">MRR Ativo</p>
                    <InfoTooltip text="Receita Recorrente Mensal: Soma dos valores de todas as assinaturas com status 'Ativo' neste momento." />
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.currentMRR)}</h3>
            <div className="mt-4 flex items-center flex-wrap">
                <span className="text-xs text-gray-400">crescimento líquido:</span>
                {renderTrend(metrics.mrrDiff, metrics.mrrPct)}
            </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">Churn Rate</p>
                    <InfoTooltip text="Taxa de cancelamento: (Cancelamentos no período / Total de ativos no início do período) * 100." />
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                    <Users className="w-5 h-5 text-red-600" />
                </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-2xl font-bold text-gray-900">{metrics.churnRate.toFixed(1)}%</h3>
                    <span className="text-sm text-gray-500">({metrics.churnCount} ex-assinantes)</span>
            </div>
             <div className="mt-4 flex items-center">
                <span className="text-xs text-gray-400">Neste período</span>
                {metrics.churnCount > 0 && <span className="text-red-500 text-xs ml-2 font-medium flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Atenção</span>}
            </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">Ticket Médio (ARPU)</p>
                    <InfoTooltip text="Average Revenue Per User: Receita total do período dividida pelo número de faturas pagas." />
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                    <PieChart className="w-5 h-5 text-green-600" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.arpu)}</h3>
            <div className="mt-4 flex items-center flex-wrap">
                <span className="text-xs text-gray-400">vs. período anterior:</span>
                {renderTrend(metrics.arpuDiff, metrics.arpuPct)}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
        
        {/* Gráfico de Barras Dinâmico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Evolução de Receita</h3>
                    <InfoTooltip text="Gráfico de barras mostrando o faturamento efetivado (pago). Ao selecionar Mês, mostra os últimos 12 meses. Ao selecionar Ano, mostra os últimos 5 anos." />
                </div>
                {/* Granularity Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                    <button 
                        onClick={() => setGranularity('day')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            granularity === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Dia
                    </button>
                    <button 
                        onClick={() => setGranularity('month')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            granularity === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Mês
                    </button>
                    <button 
                        onClick={() => setGranularity('year')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            granularity === 'year' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Ano
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="min-h-[250px] h-full flex items-end gap-2 md:gap-4 pb-4 border-b border-gray-100 min-w-[300px] lg:min-w-0">
                    {metrics.chartData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            Sem dados para exibir neste período.
                        </div>
                    ) : (
                        metrics.chartData.map((d, i) => {
                            const maxVal = Math.max(...metrics.chartData.map(c => c.value), 1);
                            const heightPct = (d.value / maxVal) * 100;
                            const isZero = d.value === 0;

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[30px]">
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                        <p className="font-bold">{d.label}</p>
                                        <p>{formatCurrency(d.value)}</p>
                                        <p className="text-gray-400 text-[10px]">{d.count} faturas</p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                    
                                    <div 
                                        className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 relative ${
                                            isZero ? 'bg-gray-100 h-1' : 'bg-slate-900 hover:bg-slate-700'
                                        }`}
                                        style={{ height: isZero ? '4px' : `${heightPct}%` }}
                                    >
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-2 truncate w-full text-center block">{d.label}</span>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>

        {/* Top Planos - Layout Corrigido (flex-col, mt-auto) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">Planos Populares</h3>
                <InfoTooltip text="Ranking dos planos com maior número de assinaturas ativas na base atual." />
            </div>
            <p className="text-sm text-gray-500 mb-6">Distribuição da base ativa atual.</p>
            
            <div className="space-y-6 flex-1">
                {metrics.topPlans.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Nenhum plano ativo.</p>
                ) : (
                    metrics.topPlans.map((plan, idx) => {
                        const colors = ['bg-slate-900', 'bg-blue-500', 'bg-indigo-500', 'bg-gray-400'];
                        const color = colors[idx % colors.length];

                        return (
                            <div key={plan.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center">
                                        <span className={`w-2.5 h-2.5 ${color} rounded-full mr-3`}></span>
                                        <span className="text-gray-700 font-medium text-sm">{plan.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-900 font-bold text-sm">{plan.percent.toFixed(1)}%</span>
                                        <span className="text-xs text-gray-400 ml-1">({plan.count})</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${plan.percent}%` }}></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            <div className="mt-auto pt-6 border-t border-gray-50 text-center">
                <Button variant="outline" className="text-xs w-full" onClick={() => window.location.hash = '#/business/assinaturas'}>
                    Ver Detalhes das Assinaturas
                </Button>
            </div>
        </div>
      </div>

      {/* Tabela de Detalhes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Transações no Período</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {metrics.recentTransactions.length} exibidos
            </span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Data</th>
                        <th className="px-6 py-3 font-semibold">Cliente / Empresa</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold text-right">Valor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {metrics.recentTransactions.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                Nenhuma transação encontrada neste período.
                            </td>
                        </tr>
                    ) : (
                        metrics.recentTransactions.map((trx) => (
                            <tr key={trx.idMensalidade} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-gray-500 font-mono text-xs">{trx.vencimento}</td>
                                <td className="px-6 py-3 text-gray-900 font-medium">
                                    {trx.nomeCliente}
                                    <span className="block text-[10px] text-gray-400 font-normal">{trx.emailCliente}</span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        trx.status === 'Pago' || trx.status === 'Baixado' 
                                        ? 'text-green-700 bg-green-50' 
                                        : 'text-gray-600 bg-gray-100'
                                    }`}>
                                        {trx.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right text-gray-900 font-semibold">
                                    {formatCurrency(trx.valor)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </BusinessLayout>
  );
};
