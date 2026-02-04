
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { sessionService } from '../../services/session';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Store, CreditCard, Receipt, ArrowRight, Loader2, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { User, ClientInvoice } from '../../types';
import { useNavigate } from 'react-router-dom';

interface DashboardInvoice extends ClientInvoice {
  isLate: boolean;
  dueDateObj: Date;
}

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // State de Dados
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSubsCount: 0,
    connectedCompaniesCount: 0,
    pendingAmount: 0,
    overdueCount: 0
  });
  const [nextDueInvoice, setNextDueInvoice] = useState<DashboardInvoice | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<DashboardInvoice[]>([]);

  useEffect(() => {
    const session = sessionService.getSession();
    if (session && session.user) {
      setUser(session.user);
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
        setIsLoading(true);
        const [subs, connections, invoices] = await Promise.all([
            userService.listClientSubscriptions(),
            userService.listConnections(),
            userService.listClientInvoices()
        ]);

        // 1. Assinaturas Ativas
        const activeSubsCount = subs.filter(s => s.status === 'Ativo').length;

        // 2. Conexões
        const connectedCompaniesCount = connections.length;

        // 3. Faturas Pendentes (Aberto + Atrasado)
        let pendingTotal = 0;
        let overdueCount = 0;
        const today = new Date();
        today.setHours(0,0,0,0);

        // Processamento de Faturas
        const processedInvoices: DashboardInvoice[] = invoices.map(inv => {
            const parts = inv.vencimento.split('/');
            const dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            
            // Determina se está vencido logicamente, mesmo se API disser 'Aberto'
            const isLate = (inv.status === 'Atrasado') || (inv.status === 'Aberto' && dueDate < today);
            
            if (inv.status === 'Aberto' || inv.status === 'Atrasado') {
                pendingTotal += inv.valor;
                if (isLate) overdueCount++;
            }

            return { ...inv, dueDateObj: dueDate, isLate };
        });

        // Ordenar por data (mais recente primeiro para lista, mais antiga pendente para "Próximo Vencimento")
        const sortedInvoices = [...processedInvoices].sort((a, b) => b.dueDateObj.getTime() - a.dueDateObj.getTime());
        
        // Encontrar a fatura pendente mais antiga (ou mais próxima do vencimento)
        const pendingInvoices = processedInvoices
            .filter(i => i.status === 'Aberto' || i.status === 'Atrasado')
            .sort((a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime()); // Ascendente

        setStats({
            activeSubsCount,
            connectedCompaniesCount,
            pendingAmount: pendingTotal,
            overdueCount
        });
        
        setNextDueInvoice(pendingInvoices.length > 0 ? pendingInvoices[0] : null);
        setRecentInvoices(sortedInvoices.slice(0, 5)); // Pegar as 5 últimas

    } catch (error) {
        console.error("Erro ao carregar dashboard do cliente", error);
    } finally {
        setIsLoading(false);
    }
  };

  if (!user) return null;

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user.nome}!</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao seu painel pessoal.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate('/assinaturas')}
         >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Assinaturas Ativas</h3>
                <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                    <CreditCard className="w-5 h-5 text-green-600" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeSubsCount}</div>
            <p className="text-xs text-gray-400 mt-2 flex items-center">
                Ver planos contratados <ArrowRight className="w-3 h-3 ml-1" />
            </p>
         </div>

         <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate('/empresas')}
         >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Estabelecimentos</h3>
                <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <Store className="w-5 h-5 text-slate-900" />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.connectedCompaniesCount}</div>
            <p className="text-xs text-gray-400 mt-2 flex items-center">
                Gerenciar conexões <ArrowRight className="w-3 h-3 ml-1" />
            </p>
         </div>

         <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => navigate('/pagamentos')}
         >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">Total Pendente</h3>
                <div className={`p-2 rounded-lg transition-colors ${stats.pendingAmount > 0 ? 'bg-orange-100 group-hover:bg-orange-200' : 'bg-gray-100'}`}>
                    <Receipt className={`w-5 h-5 ${stats.pendingAmount > 0 ? 'text-orange-600' : 'text-gray-500'}`} />
                </div>
            </div>
            <div className={`text-2xl font-bold ${stats.pendingAmount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                R$ {stats.pendingAmount.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center">
                {stats.overdueCount > 0 ? (
                    <span className="text-red-500 font-medium flex items-center">
                        {stats.overdueCount} em atraso <AlertTriangle className="w-3 h-3 ml-1" />
                    </span>
                ) : (
                    <span className="flex items-center">Histórico financeiro <ArrowRight className="w-3 h-3 ml-1" /></span>
                )}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Próximo Pagamento e Call to Action */}
        <div className="space-y-6">
            
            {/* Card Próximo Vencimento (Se houver pendência) */}
            {nextDueInvoice ? (
                <div className="bg-white rounded-xl shadow-sm border border-l-4 border-l-orange-500 border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Próximo Vencimento</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {nextDueInvoice.isLate ? "Esta fatura está atrasada!" : "Fique atento ao prazo."}
                    </p>
                    
                    <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500">Valor</p>
                            <p className="text-lg font-bold text-slate-900">R$ {nextDueInvoice.valor.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Vence em</p>
                            <p className={`font-bold ${nextDueInvoice.isLate ? 'text-red-600' : 'text-slate-900'}`}>
                                {nextDueInvoice.vencimento}
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-1">Estabelecimento</p>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Store className="w-4 h-4 text-gray-400" />
                            {nextDueInvoice.nomeEmpresa}
                        </p>
                    </div>

                    <Button 
                        className={`w-full ${nextDueInvoice.isLate ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                        onClick={() => navigate('/pagamentos')}
                    >
                        Pagar Agora <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-green-800">Tudo em dia!</h3>
                    <p className="text-sm text-green-700 mt-1">Você não possui faturas pendentes no momento.</p>
                </div>
            )}

            {/* CTA Conectar */}
            {stats.connectedCompaniesCount === 0 && (
                <div className="bg-slate-900 rounded-xl p-6 text-white text-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Conecte-se a uma Loja</h3>
                    <p className="text-slate-300 text-sm mb-6">
                        Para ver seus planos, você precisa ser convidado por um estabelecimento.
                    </p>
                    <Button variant="outline" className="w-full bg-transparent text-white border-white/20 hover:bg-white/10">
                        Como funciona?
                    </Button>
                </div>
            )}
        </div>

        {/* Coluna Direita: Últimas Movimentações */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Últimas Movimentações</h3>
                    <Button variant="outline" className="text-xs h-8" onClick={() => navigate('/pagamentos')}>
                        Ver todas
                    </Button>
                </div>
                
                {recentInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        Nenhuma movimentação registrada ainda.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentInvoices.map((inv) => (
                            <div key={inv.idMensalidade} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                        inv.status === 'Pago' || inv.status === 'Baixado' 
                                            ? 'bg-green-100 text-green-600' 
                                            : inv.isLate 
                                            ? 'bg-red-100 text-red-600' 
                                            : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {inv.status === 'Pago' || inv.status === 'Baixado' ? <CheckCircle2 size={18} /> : 
                                         inv.isLate ? <AlertTriangle size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{inv.nomeEmpresa}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>Ref: {inv.mesReferencia}</span>
                                            <span>•</span>
                                            <span>Venc: {inv.vencimento}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">R$ {inv.valor.toFixed(2).replace('.', ',')}</p>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                        inv.status === 'Pago' || inv.status === 'Baixado' 
                                            ? 'bg-green-50 text-green-700' 
                                            : inv.isLate 
                                            ? 'bg-red-50 text-red-700' 
                                            : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        {inv.isLate && inv.status === 'Aberto' ? 'Atrasado' : inv.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>
    </UserLayout>
  );
};
