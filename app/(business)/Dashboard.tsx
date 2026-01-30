
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { DollarSign, Users, TrendingUp, AlertCircle, PieChart, Loader2, ArrowRightLeft, RefreshCcw } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { Button } from '../../components/ui/Button';

const StatCard = ({ title, value, subtitle, icon: Icon, color, isNegative = false, onClick, className }: any) => (
  <div 
    className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200' : ''} ${className}`}
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
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

export const BusinessDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<boolean>(false);
  
  // State para o toggle do Faturamento
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
                <p className="text-gray-500 max-w-sm mb-6">
                    Isso pode acontecer se for seu primeiro acesso ou se houver um problema de conexão.
                </p>
                <Button onClick={loadDashboard}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                </Button>
            </div>
        </BusinessLayout>
    );
  }

  // --- Helpers para Gráficos ---
  
  // Gráfico de Linha (Tendência) - Responsivo
  const maxTrendValue = data?.trendData.reduce((max: number, item: any) => Math.max(max, item.value), 0) || 1;
  
  // Coordenadas lógicas (0 a 100)
  const getTrendY = (val: number) => {
      // Mapeia valor para 0-100 invertido (0 no topo, 100 na base)
      // Deixamos 5% de margem no topo para a bolinha não cortar
      if (maxTrendValue === 0) return 100;
      return 100 - ((val / maxTrendValue) * 95);
  };

  const trendPoints = data?.trendData.map((d: any, i: number) => {
     // X distribuído uniformemente de 0 a 100
     const x = (i / (data.trendData.length - 1)) * 100;
     const y = getTrendY(d.value);
     return `${x},${y}`;
  }).join(' ');

  // Gráfico de Pizza (Cores)
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const conicGradient = data?.pieData.reduce((acc: string, item: any, index: number, arr: any[]) => {
     const prevPerc = arr.slice(0, index).reduce((p, c) => p + c.percentage, 0);
     const currentPerc = prevPerc + item.percentage;
     return `${acc}, ${pieColors[index % pieColors.length]} ${prevPerc}% ${currentPerc}%`;
  }, '').substring(2); // Remove first comma

  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta! Aqui está o resumo do seu negócio.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Faturamento (Alternável) */}
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
          className="relative overflow-hidden"
        />

        {/* Card 2: Clientes Ativos */}
        <StatCard 
          title="Clientes Ativos" 
          value={data.totalClientes} 
          subtitle="Base total cadastrada"
          icon={Users} 
          color="bg-blue-50 text-blue-600"
          onClick={() => navigate('/business/clientes')}
        />

        {/* Card 3: MRR (Substituiu Taxa de Conversão) */}
        <StatCard 
          title="MRR Estimado" 
          value={`R$ ${data.mrr.toFixed(2)}`}
          subtitle="Receita Recorrente Mensal"
          icon={TrendingUp} 
          color="bg-green-50 text-green-600"
          onClick={() => navigate('/business/relatorios')}
        />

        {/* Card 4: Inadimplência */}
        <StatCard 
          title="Mensalidades Atrasadas" 
          value={data.atrasadosCount} 
          subtitle={data.atrasadosCount > 0 ? "⚠ Clique para resolver" : "Tudo em dia!"}
          icon={AlertCircle} 
          color="bg-orange-50 text-orange-600"
          isNegative={data.atrasadosCount > 0}
          onClick={() => navigate('/business/pagamentos?status=Atrasado')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Tendência Futura */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Previsão de Faturamento (Próx. 6 meses)</h3>
            <p className="text-xs text-gray-400">Baseado nas mensalidades geradas no sistema.</p>
          </div>
          
          <div className="h-64 relative w-full">
             {/* Y Axis Labels (Absolute Left) */}
             <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-xs text-gray-400 z-10 bg-white/50">
                <span>R$ {maxTrendValue.toFixed(0)}</span>
                <span>R$ {(maxTrendValue / 2).toFixed(0)}</span>
                <span>R$ 0</span>
             </div>
             
             {/* Chart Area Container (Absolute with offset for labels) */}
             <div className="absolute left-10 right-0 top-0 bottom-6">
                 
                 {/* Camada 1: SVG (Linhas e Preenchimento) - Estica (preserveAspectRatio="none") */}
                 <svg 
                    className="w-full h-full overflow-visible" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                 >
                     {/* Grid Lines */}
                     <line x1="0" y1="5" x2="100" y2="5" stroke="#f1f5f9" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                     <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                     <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f5f9" vectorEffect="non-scaling-stroke" />

                     {/* Area Fill */}
                     <path 
                        d={`M0,100 L${trendPoints.split(' ')[0]} ${trendPoints.substring(trendPoints.indexOf(' '))} L100,100 Z`} 
                        fill="url(#gradient)" 
                        opacity="0.1"
                        vectorEffect="non-scaling-stroke"
                     />

                     {/* The Line */}
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

                 {/* Camada 2: Pontos HTML (Não distorcem com o SVG) */}
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
                                transform: 'translate(-50%, -50%)' // Centraliza o ponto na coordenada
                            }}
                            title={`R$ ${d.value.toFixed(2)}`}
                        />
                     )
                 })}
             </div>

            {/* X Axis Labels (Absolute Bottom) */}
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

        {/* Pie Chart: Preferência de Planos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Planos Preferidos</h3>
            <p className="text-xs text-gray-400">Distribuição da base de assinantes.</p>
          </div>
          
          <div className="flex flex-col items-center justify-center h-48">
             {data.pieData.length > 0 ? (
                 <div className="w-40 h-40 rounded-full relative shadow-inner" style={{
                     background: `conic-gradient(${conicGradient ? conicGradient : '#e2e8f0 0% 100%'})`
                 }}>
                     <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-gray-400">TOTAL</span>
                     </div>
                 </div>
             ) : (
                 <div className="w-40 h-40 rounded-full border-4 border-gray-100 flex items-center justify-center text-gray-300 text-xs">
                     Sem dados
                 </div>
             )}
          </div>

          <div className="mt-6 space-y-3 max-h-40 overflow-y-auto">
             {data.pieData.map((item: any, index: number) => (
                 <div key={index} className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2">
                         <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                         ></span>
                         <span className="text-gray-600 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                     </div>
                     <span className="font-medium text-gray-900">{item.percentage}%</span>
                 </div>
             ))}
             {data.pieData.length === 0 && <p className="text-center text-gray-400 text-sm">Nenhuma assinatura ativa.</p>}
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
};
