
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { DollarSign, Users, TrendingUp, AlertCircle, PieChart, Loader2, ArrowRightLeft, RefreshCcw, BarChart3, Wallet, Calendar } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { Button } from '../../components/ui/Button';
import { InfoTooltip } from '../../components/ui/InfoTooltip';

const StatCard = ({ title, value, subtitle, icon: Icon, color, isNegative = false, onClick, className, infoText }: any) => (
  <div 
    className={`bg-white p-6 rounded-[5px] shadow-sm border border-gray-100 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200' : ''} ${className}`}
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="flex items-center">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {infoText && <InfoTooltip text={infoText} popoverRadiusClass="rounded-[5px]" />}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-[5px] ${color}`}>
        <Icon className={`w-5 h-5`} />
      </div>
    </div>
    <div className="flex items-center text-xs">
      <span className={`font-medium ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
        {subtitle}
      </span>
    </div>
  </div>
);

// Card Menor para métricas secundárias
const MiniStatCard = ({ title, value, icon: Icon, infoText, subValue }: any) => (
    <div className="bg-white p-4 rounded-[5px] shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <div className="flex items-center mb-0.5">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
                {infoText && <InfoTooltip text={infoText} popoverRadiusClass="rounded-[5px]" />}
            </div>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            {subValue && <p className="text-[10px] text-gray-500">{subValue}</p>}
        </div>
        <div className="bg-gray-50 p-2 rounded-[5px]">
            <Icon className="w-4 h-4 text-gray-500" />
        </div>
    </div>
);

export const BusinessDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<boolean>(false);
  
  const [revenueView, setRevenueView] = useState<'month' | 'year'>('month');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(false);
    try {
        const dashboardData = await dashboardService.getDashboardData();
        setData(dashboardData);
    } catch (error) {
        console.error("Erro ao carregar dashboard", error);
        setError(true);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleRevenue = () => {
    setRevenueView(prev => prev === 'month' ? 'year' : 'month');
  };

  const formatDate = (isoString: string) => {
      try {
          return new Date(isoString).toLocaleDateString('pt-BR');
      } catch {
          return isoString;
      }
  };

  if (isLoading) {
      return (
          <BusinessLayout>
              <div className="flex items-center justify-center h-full min-h-[500px]">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
              </div>
          </BusinessLayout>
      )
  }

  if (error || !data) {
    return (
        <BusinessLayout>
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">Não foi possível carregar os dados</h2>
                <Button onClick={loadDashboard} className="!rounded-[5px]">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                </Button>
            </div>
        </BusinessLayout>
    );
  }

  // --- Helpers para Gráficos ---
  const maxTrendValue = data?.trendData.reduce((max: number, item: any) => Math.max(max, item.value), 0) || 1;
  
  const getTrendY = (val: number) => {
      if (maxTrendValue === 0) return 100;
      return 100 - ((val / maxTrendValue) * 95);
  };

  const trendPoints = data?.trendData.map((d: any, i: number) => {
     const x = (i / (data.trendData.length - 1)) * 100;
     const y = getTrendY(d.value);
     return `${x},${y}`;
  }).join(' ');

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const conicGradient = data?.pieData.reduce((acc: string, item: any, index: number, arr: any[]) => {
     const prevPerc = arr.slice(0, index).reduce((p, c) => p + c.percentage, 0);
     const currentPerc = prevPerc + item.percentage;
     return `${acc}, ${pieColors[index % pieColors.length]} ${prevPerc}% ${currentPerc}%`;
  }, '').substring(2);

  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta! Aqui está o resumo do seu negócio.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          title={revenueView === 'month' ? "Faturamento (Mês)" : "Faturamento (Ano)"}
          value={`R$ ${revenueView === 'month' ? data.receitaMes.toFixed(2) : data.receitaAno.toFixed(2)}`}
          subtitle={
              <span className="flex items-center gap-1 text-slate-500">
                  <ArrowRightLeft className="w-3 h-3" /> Clique para alternar
              </span>
          }
          icon={DollarSign} 
          color="bg-slate-100 text-slate-600"
          onClick={toggleRevenue}
          className="relative"
          infoText="Este cálculo é uma projeção baseada nas assinaturas ativas atuais, assumindo que não haverá cancelamentos futuros."
        />

        <StatCard 
          title="Clientes Ativos" 
          value={data.totalClientes} 
          subtitle="Base total cadastrada"
          icon={Users} 
          color="bg-blue-50 text-blue-600"
          onClick={() => navigate('/business/clientes')}
          infoText="Número total de clientes cadastrados na sua base, incluindo aqueles com e sem assinaturas ativas."
        />

        <StatCard 
          title="MRR Estimado" 
          value={`R$ ${data.mrr.toFixed(2)}`}
          subtitle="Receita Recorrente Mensal"
          icon={TrendingUp} 
          color="bg-green-50 text-green-600"
          onClick={() => navigate('/business/relatorios')}
          infoText="Monthly Recurring Revenue: Soma dos valores de todas as assinaturas com status 'Ativo' neste momento."
        />

        <StatCard 
          title="Mensalidades Atrasadas" 
          value={data.atrasadosCount} 
          subtitle={data.atrasadosCount > 0 ? "⚠ Clique para resolver" : "Tudo em dia!"}
          icon={AlertCircle} 
          color="bg-orange-50 text-orange-600"
          isNegative={data.atrasadosCount > 0}
          onClick={() => navigate('/business/pagamentos?status=Atrasado')}
          infoText="Total de faturas vencidas e ainda não pagas. Clique para ver a lista detalhada e realizar cobranças."
        />
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MiniStatCard 
            title="Ticket Médio (ARPU)" 
            value={`R$ ${data.arpu.toFixed(2)}`}
            icon={BarChart3}
            infoText="Valor médio mensal pago por assinatura ativa (MRR Total / Número de Assinaturas Ativas)."
          />
          <MiniStatCard 
            title="LTV Estimado" 
            value={`R$ ${data.ltv.toFixed(2)}`}
            icon={Wallet}
            infoText="Lifetime Value: Receita total histórica dividida pelo número de clientes únicos pagantes."
          />
          <MiniStatCard 
            title="Taxa de Adimplência" 
            value={`${data.taxaAdimplencia.toFixed(1)}%`}
            subValue={data.adimplenciaStats ? `${data.adimplenciaStats.paid} de ${data.adimplenciaStats.total} pagas` : undefined}
            icon={PieChart}
            infoText="Porcentagem de faturas pagas ou baixadas em relação ao total de faturas já vencidas."
          />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Tendência Futura */}
        <div className="bg-white p-6 rounded-[5px] shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
          <div className="mb-6 flex items-center">
            <div>
                <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Previsão de Faturamento</h3>
                    <InfoTooltip text="Projeção para os próximos 6 meses baseada nos contratos ativos atuais. Não considera cancelamentos futuros." popoverRadiusClass="rounded-[5px]" />
                </div>
                <p className="text-xs text-gray-400">Próximos 6 meses (Cenário sem cancelamentos)</p>
            </div>
          </div>
          
          <div className="h-64 relative w-full flex-1 min-h-[250px]">
             {/* Y Axis Labels */}
             <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-xs text-gray-400 z-10 bg-white/50">
                <span>R$ {maxTrendValue.toFixed(0)}</span>
                <span>R$ {(maxTrendValue / 2).toFixed(0)}</span>
                <span>R$ 0</span>
             </div>
             
             {/* Chart Area */}
             <div className="absolute left-10 right-0 top-0 bottom-6">
                 {/* Camada 1: SVG - Estica (preserveAspectRatio="none") */}
                 <svg 
                    className="w-full h-full overflow-visible" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                 >
                     <line x1="0" y1="5" x2="100" y2="5" stroke="#f1f5f9" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                     <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                     <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f5f9" vectorEffect="non-scaling-stroke" />

                     <path 
                        d={`M0,100 L${trendPoints.split(' ')[0]} ${trendPoints.substring(trendPoints.indexOf(' '))} L100,100 Z`} 
                        fill="url(#gradient)" 
                        opacity="0.1"
                        vectorEffect="non-scaling-stroke"
                     />
                     <path 
                        d={`M${trendPoints}`} 
                        fill="none" 
                        stroke="#0f172a" 
                        strokeWidth="3" 
                        vectorEffect="non-scaling-stroke"
                        className="drop-shadow-sm"
                     />
                     <defs>
                       <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                         <stop offset="0%" stopColor="#0f172a" />
                         <stop offset="100%" stopColor="white" />
                       </linearGradient>
                     </defs>
                 </svg>

                 {/* Camada 2: Pontos HTML (Não distorcem) */}
                 {data.trendData.map((d: any, i: number) => {
                     const x = (i / (data.trendData.length - 1)) * 100;
                     const y = getTrendY(d.value);
                     return (
                        <div 
                            key={i}
                            className="absolute w-3 h-3 bg-white border-2 border-slate-900 rounded-full cursor-pointer hover:scale-125 transition-transform shadow-sm z-10"
                            style={{ 
                                left: `${x}%`, 
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                            title={`R$ ${d.value.toFixed(2)}`}
                        />
                     )
                 })}
             </div>

             {/* X Axis Labels */}
             <div className="absolute left-10 right-0 bottom-0 flex justify-between text-xs text-gray-500 font-medium">
                {data.trendData.map((d: any, i: number) => (
                    <div key={i} style={{ width: `${100 / data.trendData.length}%`, textAlign: 'center' }}>
                         <span className={`${i === 0 ? 'float-left' : i === data.trendData.length - 1 ? 'float-right' : ''}`}>
                             {d.label}
                         </span>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Pie Chart & Renewals */}
        <div className="flex flex-col gap-6">
            
            {/* Pie Chart: Preferência de Planos */}
            <div className="bg-white p-6 rounded-[5px] shadow-sm border border-gray-100 flex-1">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Planos</h3>
                    <p className="text-xs text-gray-400">Distribuição da base.</p>
                </div>
                
                <div className="flex flex-col items-center justify-center h-40">
                    {data.pieData.length > 0 ? (
                        <div className="w-32 h-32 rounded-full relative shadow-inner" style={{
                            background: `conic-gradient(${conicGradient ? conicGradient : '#e2e8f0 0% 100%'})`
                        }}>
                            <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400">TOTAL</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-32 h-32 rounded-full border-4 border-gray-100 flex items-center justify-center text-gray-300 text-xs">
                            Sem dados
                        </div>
                    )}
                </div>

                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {data.pieData.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                                <span 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    style={{ backgroundColor: pieColors[index % pieColors.length] }}
                                ></span>
                                <span className="text-gray-600 truncate max-w-[100px]" title={item.name}>{item.name}</span>
                            </div>
                            <span className="font-medium text-gray-900">{item.percentage}% <span className="text-gray-400 font-normal">({item.value})</span></span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upcoming Renewals List */}
            <div className="bg-white p-6 rounded-[5px] shadow-sm border border-gray-100 flex-1">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> 
                        Expiram em breve
                    </h3>
                </div>
                
                <div className="space-y-3">
                    {data.proximasRenovacoes.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Nenhuma renovação nos próximos 30 dias.</p>
                    ) : (
                        data.proximasRenovacoes.map((sub: any) => (
                            <div key={sub.idAssinatura} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{sub.nomeCliente}</p>
                                    <p className="text-xs text-gray-400">{sub.nomePlano}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-700">{formatDate(sub.dataFinal)}</p>
                                    <p className="text-[10px] text-orange-500 font-medium">Renovar</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </BusinessLayout>
  );
};
