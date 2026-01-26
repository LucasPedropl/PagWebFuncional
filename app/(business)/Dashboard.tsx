import React from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { DollarSign, Users, TrendingUp, AlertCircle, PieChart } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color, isNegative = false }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
        {change}
      </span>
      <span className="text-gray-400 ml-1">do último mês</span>
    </div>
  </div>
);

export const BusinessDashboard: React.FC = () => {
  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Bem-vindo de volta! Aqui está o que está acontecendo hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Faturamento Total" 
          value="R$ 328.000" 
          change="↗ +12.5%" 
          icon={DollarSign} 
          color="bg-slate-100 text-slate-600"
        />
        <StatCard 
          title="Clientes Ativos" 
          value="147" 
          change="↗ +8 nesta semana" 
          icon={Users} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Taxa de Conversão" 
          value="15.3%" 
          change="↘ -2.1%" 
          icon={TrendingUp} 
          color="bg-green-50 text-green-600"
          isNegative
        />
        <StatCard 
          title="Mensalidades Atrasadas" 
          value="23" 
          change="⚠ 12 vencidas" 
          icon={AlertCircle} 
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tendência de Faturamento</h3>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 pt-4 relative">
            {/* Simple CSS Line Chart Simulation */}
             <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 pointer-events-none">
                <span>120</span>
                <span>90</span>
                <span>60</span>
                <span>30</span>
                <span>0</span>
             </div>
             
             {/* Chart Line Drawing using SVG */}
             <svg className="absolute inset-0 w-full h-full pl-6 pb-4" preserveAspectRatio="none">
                 <path 
                    d="M0,100 C50,50 100,10 150,10 S250,50 300,50 S400,30 450,30 S550,60 600,80" 
                    fill="none" 
                    stroke="#1e293b" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                 />
                 <path 
                    d="M0,100 C50,50 100,10 150,10 S250,50 300,50 S400,30 450,30 S550,60 600,80 L600,150 L0,150 Z" 
                    fill="url(#gradient)" 
                    opacity="0.05"
                 />
                 <defs>
                   <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" stopColor="#1e293b" />
                     <stop offset="100%" stopColor="white" />
                   </linearGradient>
                 </defs>
             </svg>

            {/* X Axis Labels */}
             <div className="absolute bottom-0 left-6 right-0 flex justify-between text-xs text-gray-400">
                <span>Jan</span>
                <span>Fev</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>Mai</span>
                <span>Jun</span>
             </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Fontes dos Clientes</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center h-48">
             {/* CSS Conic Gradient Donut Chart */}
             <div className="w-40 h-40 rounded-full relative" style={{
                 background: 'conic-gradient(#3b82f6 0% 50%, #10b981 50% 75%, #f59e0b 75% 90%, #ef4444 90% 100%)'
             }}>
                 <div className="absolute inset-4 bg-white rounded-full"></div>
             </div>
          </div>

          <div className="mt-6 space-y-3">
             <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                     <span className="text-gray-600">Website</span>
                 </div>
                 <span className="font-medium text-gray-900">50%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                     <span className="text-gray-600">Indicação</span>
                 </div>
                 <span className="font-medium text-gray-900">25%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                     <span className="text-gray-600">Mídia Social</span>
                 </div>
                 <span className="font-medium text-gray-900">15%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-red-500"></span>
                     <span className="text-gray-600">Outros</span>
                 </div>
                 <span className="font-medium text-gray-900">10%</span>
             </div>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
};