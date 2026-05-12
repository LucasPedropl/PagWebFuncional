
import React, { useState, useEffect, useMemo } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  Loader2, 
  Calendar, 
  Minus, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientInvoice, ClientSubscription } from '../../types';
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
  const [isLoading, setIsLoading] = useState(true);
  
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setIsLoading(true);
        const [invData, subData] = await Promise.all([
            userService.listClientInvoices(),
            userService.listClientSubscriptions()
        ]);
        setInvoices(invData);
        setSubscriptions(subData);
    } catch (error) {
        console.error("Erro ao carregar dados", error);
    } finally {
        setIsLoading(false);
    }
  };

  const metrics = useMemo(() => {
      const days = parseInt(dateRange);
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - days);

      const previousPeriodDate = new Date(pastDate);
      previousPeriodDate.setDate(previousPeriodDate.getDate() - days);

      // --- 1. GASTO TOTAL NO PERÍODO ---
      const filterPaidInvoices = (start: Date, end: Date) => {
          return invoices.filter(i => {
              if (i.status !== 'Pago' && i.status !== 'Baixado') return false;
              const d = parseDateBR(i.vencimento); 
              return d >= start && d <= end;
          });
      };

      const currentInvoices = filterPaidInvoices(pastDate, now);
      const previousInvoices = filterPaidInvoices(previousPeriodDate, pastDate);

      const currentSpending = currentInvoices.reduce((acc, curr) => acc + curr.valor, 0);
      const previousSpending = previousInvoices.reduce((acc, curr) => acc + curr.valor, 0);
      
      const spendingDiff = currentSpending - previousSpending;
      const spendingPct = previousSpending > 0 ? (spendingDiff / previousSpending) * 100 : (currentSpending > 0 ? 100 : 0);

      // --- 2. CUSTO FIXO MENSAL (MRR Reverso) ---
      const activeSubs = subscriptions.filter(s => s.status === 'Ativo');
      const monthlyCommitment = activeSubs.reduce((acc, s) => acc + (s.valorMensal || 0), 0);

      // --- 3. FATURAS PENDENTES / ATRASADAS ---
      const pendingInvoices = invoices.filter(i => i.status === 'Aberto' || i.status === 'Atrasado');
      const totalPendingValue = pendingInvoices.reduce((acc, i) => acc + i.valor, 0);
      const overdueCount = pendingInvoices.filter(i => i.status === 'Atrasado').length;

      // --- 4. ECONOMIA ESTIMADA (SIMULADA) ---
      // Aqui poderíamos calcular baseado em descontos se tivéssemos o valor original
      const totalSavings = subscriptions.reduce((acc, s) => {
          // Exemplo: se tivéssemos valor original vs atual
          return acc + 0; 
      }, 0);

      // --- 5. DISTRIBUIÇÃO POR EMPRESA (Gráfico de Rosca) ---
      const companySpending: Record<string, number> = {};
      
      // Se houver faturas pagas, usamos os valores reais
      if (currentSpending > 0) {
          currentInvoices.forEach(i => {
              companySpending[i.nomeEmpresa] = (companySpending[i.nomeEmpresa] || 0) + i.valor;
          });
      } else {
          // GAMBIARRA: Se não houver faturas pagas, usamos o compromisso mensal (assinaturas ativas)
          activeSubs.forEach(s => {
              companySpending[s.nomeEmpresa] = (companySpending[s.nomeEmpresa] || 0) + (s.valorMensal || 0);
          });
      }

      const totalForChart = Object.values(companySpending).reduce((a, b) => a + b, 0);
      const topCompanies = Object.entries(companySpending)
        .map(([name, value]) => ({ 
            name, 
            value, 
            percent: totalForChart > 0 ? (value / totalForChart) * 100 : 0 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // --- 6. EVOLUÇÃO MENSAL (Últimos 6 meses) ---
      const evolutionData: { label: string, value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          
          const monthSpending = invoices.filter(inv => {
              if (inv.status !== 'Pago' && inv.status !== 'Baixado') return false;
              const invDate = parseDateBR(inv.vencimento);
              return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
          }).reduce((acc, curr) => acc + curr.valor, 0);

          evolutionData.push({ label, value: monthSpending });
      }

      return {
          currentSpending, spendingDiff, spendingPct,
          monthlyCommitment,
          totalPendingValue, overdueCount,
          topCompanies,
          totalForChart,
          isUsingCommitmentAsFallback: currentSpending === 0 && totalForChart > 0,
          evolutionData,
          recentPaid: currentInvoices.sort((a, b) => parseDateBR(b.vencimento).getTime() - parseDateBR(a.vencimento).getTime()).slice(0, 5),
          upcomingPayments: invoices.filter(i => {
              if (i.status !== 'Aberto') return false;
              const d = parseDateBR(i.vencimento);
              const fifteenDaysFromNow = new Date(now);
              fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
              return d >= now && d <= fifteenDaysFromNow;
          }).sort((a, b) => parseDateBR(a.vencimento).getTime() - parseDateBR(b.vencimento).getTime()).slice(0, 5),
          activeSubsCount: activeSubs.length
      };

  }, [dateRange, invoices, subscriptions]);

  const renderTrend = (diff: number, pct: number) => {
     if (diff === 0) return <span className="text-gray-400 ml-2 flex items-center"><Minus className="w-3 h-3 mr-1"/> Estável</span>;
     
     const isPositive = diff > 0;
     // Para o cliente, gasto maior (+) é "ruim" (vermelho), gasto menor (-) é "bom" (verde)
     const colorClass = isPositive ? 'text-red-600' : 'text-green-600';
     const Icon = isPositive ? TrendingUp : TrendingDown;
     
     return (
         <span className={`${colorClass} font-medium flex items-center ml-2 text-xs`}>
             <Icon className="w-3 h-3 mr-1" />
             {isPositive ? '+' : '-'}{formatCurrency(Math.abs(diff))} ({Math.abs(pct).toFixed(1)}%)
         </span>
     );
  };

  // Componente de Gráfico de Rosca (Donut) usando SVG
  const DonutChart = ({ data }: { data: { name: string, value: number, percent: number }[] }) => {
      const size = 160;
      const strokeWidth = 22;
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const colors = ['#0f172a', '#3b82f6', '#6366f1', '#a855f7', '#94a3b8'];

      let currentOffset = 0;

      return (
          <div className="flex flex-col items-center">
              <div className="relative" style={{ width: size, height: size }}>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
                      {/* Background circle */}
                      <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth={strokeWidth}
                      />
                      {/* Segments */}
                      {data.map((item, idx) => {
                          const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
                          const strokeDashoffset = -currentOffset;
                          currentOffset += (item.percent / 100) * circumference;

                          return (
                              <circle
                                  key={idx}
                                  cx={size / 2}
                                  cy={size / 2}
                                  r={radius}
                                  fill="transparent"
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth={strokeWidth}
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  className="transition-all duration-1000 ease-out hover:opacity-80 cursor-pointer"
                                  strokeLinecap={item.percent > 1 ? "round" : "butt"}
                              />
                          );
                      })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tighter">Total</span>
                      <span className="text-lg font-bold text-gray-900 leading-none">
                          {metrics.totalForChart > 1000 ? `${(metrics.totalForChart / 1000).toFixed(1)}k` : metrics.totalForChart.toFixed(0)}
                      </span>
                  </div>
              </div>
              
              <div className="mt-8 space-y-3 w-full">
                  {data.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                              <span className="text-xs text-gray-600 font-medium group-hover:text-gray-900 transition-colors truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <div className="text-right">
                              <span className="text-xs font-bold text-gray-900">{item.percent.toFixed(1)}%</span>
                              <p className="text-[10px] text-gray-400">{formatCurrency(item.value)}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  if (isLoading) {
      return (
        <UserLayout>
             <div className="flex items-center justify-center h-full min-h-[400px]">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
              </div>
        </UserLayout>
      );
  }

  return (
    <UserLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Relatórios Financeiros</h1>
          <p className="text-gray-500 mt-1">Visão detalhada dos seus gastos e compromissos mensais.</p>
        </div>
        <select 
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5 cursor-pointer outline-none shadow-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
        >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">Total Gasto</p>
                    <InfoTooltip text="Soma de todos os pagamentos realizados no período selecionado." />
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-slate-900" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.currentSpending)}</h3>
            <div className="mt-4 flex items-center flex-wrap">
                <span className="text-xs text-gray-400">vs. período anterior:</span>
                {renderTrend(metrics.spendingDiff, metrics.spendingPct)}
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">Compromisso Mensal</p>
                    <InfoTooltip text="Soma dos valores de todas as suas assinaturas ativas no momento." />
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.monthlyCommitment)}</h3>
            <p className="text-xs text-gray-400 mt-4 italic">
                {metrics.activeSubsCount} assinaturas ativas
            </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">A pagar</p>
                    <InfoTooltip text="Soma de todas as faturas em aberto ou atrasadas." />
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.totalPendingValue)}</h3>
            <div className="mt-4 flex items-center">
                {metrics.overdueCount > 0 ? (
                    <span className="text-red-500 text-xs font-medium flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" /> {metrics.overdueCount} faturas atrasadas
                    </span>
                ) : (
                    <span className="text-green-600 text-xs font-medium flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Tudo em dia
                    </span>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-500">Diversificação</p>
                    <InfoTooltip text="Número de empresas diferentes das quais você consome serviços." />
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-purple-600" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{metrics.topCompanies.length}</h3>
            <p className="text-xs text-gray-400 mt-4 italic">
                Empresas parceiras
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Evolução de Gastos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                Evolução de Gastos
                <InfoTooltip text="Histórico de quanto você pagou em assinaturas nos últimos 6 meses." />
            </h3>
            
            <div className="h-[250px] flex items-end gap-4 pb-4 border-b border-gray-100">
                {metrics.evolutionData.map((d, i) => {
                    const maxVal = Math.max(...metrics.evolutionData.map(c => c.value), 1);
                    const heightPct = (d.value / maxVal) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                {formatCurrency(d.value)}
                            </div>
                            <div 
                                className={`w-full max-w-[50px] rounded-t-lg transition-all duration-500 ${
                                    d.value === 0 ? 'bg-gray-100 h-1' : 'bg-slate-900 hover:bg-slate-700'
                                }`}
                                style={{ height: d.value === 0 ? '4px' : `${heightPct}%` }}
                            ></div>
                            <span className="text-[10px] text-gray-400 mt-2 font-medium">{d.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Maiores Gastos por Empresa */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Gastos por Empresa
                    <InfoTooltip text="Distribuição percentual de seus gastos entre os diferentes estabelecimentos." />
                </h3>
                {metrics.isUsingCommitmentAsFallback && (
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-amber-100 animate-pulse">
                        <AlertCircle size={10} />
                        Projeção
                    </span>
                )}
            </div>
            
            <div className="flex flex-col items-center">
                {metrics.topCompanies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <PieChart className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">Sem dados de consumo.</p>
                    </div>
                ) : (
                    <DonutChart data={metrics.topCompanies} />
                )}
                
                {metrics.isUsingCommitmentAsFallback && (
                    <p className="text-[10px] text-amber-600 mt-4 text-center italic leading-tight">
                        Exibindo compromisso mensal baseado em assinaturas ativas, pois não há faturas pagas no período.
                    </p>
                )}
            </div>
        </div>
      </div>

      {/* Pagamentos Recentes e Próximos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Próximos Pagamentos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Próximos Pagamentos</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Vencimento</th>
                            <th className="px-6 py-3 font-semibold">Empresa</th>
                            <th className="px-6 py-3 font-semibold text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {metrics.upcomingPayments.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                                    Nenhuma fatura vencendo nos próximos 15 dias.
                                </td>
                            </tr>
                        ) : (
                            metrics.upcomingPayments.map((trx) => (
                                <tr key={trx.idMensalidade} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 text-blue-600 font-bold font-mono text-xs">{trx.vencimento}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-900 font-medium">{trx.nomeEmpresa}</p>
                                        <p className="text-[10px] text-gray-400">{trx.mesReferencia}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-900 font-bold">
                                        {formatCurrency(trx.valor)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Pagamentos Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Pagamentos Recentes</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Data</th>
                            <th className="px-6 py-3 font-semibold">Empresa</th>
                            <th className="px-6 py-3 font-semibold text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {metrics.recentPaid.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                                    Nenhum pagamento identificado no período.
                                </td>
                            </tr>
                        ) : (
                            metrics.recentPaid.map((trx) => (
                                <tr key={trx.idMensalidade} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{trx.vencimento}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-900 font-medium">{trx.nomeEmpresa}</p>
                                        <p className="text-[10px] text-gray-400">{trx.mesReferencia}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-900 font-bold">
                                        {formatCurrency(trx.valor)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </UserLayout>
  );
};
