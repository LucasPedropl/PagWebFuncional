
import { businessService } from "./businessService";
import { Mensalidade, PlanResponse, SubscriptionResponse } from "../types";

// Helper para converter string DD/MM/YYYY para Date object
const parseDateBR = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    // Mês é 0-indexado no JS
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
};

export const dashboardService = {
    
    async getDashboardData() {
        const [rawMensalidades, rawClientes, rawAssinaturas] = await Promise.all([
            businessService.listMensalidades(),
            businessService.listClients(),
            businessService.listSubscriptions()
        ]);

        // Programação Defensiva: Garante que sejam arrays mesmo que o service falhe
        const mensalidades = Array.isArray(rawMensalidades) ? rawMensalidades : [];
        const clientes = Array.isArray(rawClientes) ? rawClientes : [];
        const assinaturas = Array.isArray(rawAssinaturas) ? rawAssinaturas : [];

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // 1. Faturamento (Mês vs Ano) - Considera "passadas"
        const receitaMes = mensalidades.reduce((acc, m) => {
            const d = parseDateBR(m.vencimento);
            if (d && d.getMonth() === currentMonth && d.getFullYear() === currentYear && d <= today) {
                return acc + m.valor;
            }
            return acc;
        }, 0);

        const receitaAno = mensalidades.reduce((acc, m) => {
            const d = parseDateBR(m.vencimento);
            if (d && d.getFullYear() === currentYear && d <= today) {
                return acc + m.valor;
            }
            return acc;
        }, 0);

        // 2. Clientes Ativos
        const totalClientes = clientes.length;

        // 3. MRR (Receita Recorrente Mensal Estimada)
        // Soma o valor de todas as assinaturas ativas
        const mrr = assinaturas.reduce((acc, sub) => {
            if (sub.status === 'Ativo') {
                return acc + (sub.valorComDesconto || 0);
            }
            return acc;
        }, 0);

        // 4. Atrasados
        // Filtra status explicitamente "Atrasado" ou data passada com status "Aberto"
        const atrasadosCount = mensalidades.filter(m => {
            if (m.status === 'Atrasado') return true;
            if (m.status === 'Pago') return false;
            
            const d = parseDateBR(m.vencimento);
            if (d && d < today && m.status === 'Aberto') return true;
            
            return false;
        }).length;


        // 5. Gráfico Tendência (Próximos 6 meses)
        const trendData: { label: string; value: number }[] = [];
        
        for (let i = 0; i < 6; i++) {
            const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthIdx = futureDate.getMonth();
            const year = futureDate.getFullYear();
            
            const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'short' });
            
            // Soma mensalidades que vencem neste mês específico
            const sum = mensalidades.reduce((acc, m) => {
                const d = parseDateBR(m.vencimento);
                if (d && d.getMonth() === monthIdx && d.getFullYear() === year) {
                    return acc + m.valor;
                }
                return acc;
            }, 0);

            trendData.push({ label: monthName, value: sum });
        }

        // 6. Fontes/Planos (Distribuição)
        const planDistribution: Record<string, number> = {};
        let totalSubs = 0;

        assinaturas.forEach(sub => {
            const name = sub.nomePlano || 'Outros';
            planDistribution[name] = (planDistribution[name] || 0) + 1;
            totalSubs++;
        });

        // Converte para porcentagem e array
        const pieData = Object.entries(planDistribution).map(([name, count]) => ({
            name,
            value: count,
            percentage: totalSubs > 0 ? Math.round((count / totalSubs) * 100) : 0
        })).sort((a, b) => b.value - a.value); // Ordernar do maior para o menor

        return {
            receitaMes,
            receitaAno,
            totalClientes,
            mrr,
            atrasadosCount,
            trendData,
            pieData
        };
    }
};
