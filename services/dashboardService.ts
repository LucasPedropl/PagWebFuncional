
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

        // Programação Defensiva: Garante que sejam arrays
        const mensalidades = Array.isArray(rawMensalidades) ? rawMensalidades : [];
        const clientes = Array.isArray(rawClientes) ? rawClientes : [];
        const assinaturas = Array.isArray(rawAssinaturas) ? rawAssinaturas : [];

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // --- MÉTRICAS BÁSICAS ---

        // 1. Faturamento (Mês vs Ano)
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
        const mrr = assinaturas.reduce((acc, sub) => {
            if (sub.status === 'Ativo') {
                return acc + (sub.valorComDesconto || 0);
            }
            return acc;
        }, 0);

        // 4. Atrasados
        const atrasadosCount = mensalidades.filter(m => {
            if (m.status === 'Atrasado') return true;
            if (m.status === 'Pago' || m.status === 'Baixado') return false;
            
            const d = parseDateBR(m.vencimento);
            if (d && d < today && m.status === 'Aberto') return true;
            
            return false;
        }).length;

        // --- MÉTRICAS AVANÇADAS (NOVAS) ---

        // 5. Ticket Médio (ARPU) - MRR / Assinaturas Ativas
        const assinaturasAtivas = assinaturas.filter(s => s.status === 'Ativo');
        const arpu = assinaturasAtivas.length > 0 ? mrr / assinaturasAtivas.length : 0;

        // 6. LTV (Lifetime Value) - Total Receita Histórica / Total Clientes Pagantes Únicos
        const faturasPagas = mensalidades.filter(m => m.status === 'Pago' || m.status === 'Baixado');
        const receitaTotalHistorica = faturasPagas.reduce((acc, m) => acc + m.valor, 0);
        const clientesPagantesUnicos = new Set(faturasPagas.map(m => m.emailCliente)).size;
        const ltv = clientesPagantesUnicos > 0 ? receitaTotalHistorica / clientesPagantesUnicos : 0;

        // 7. Taxa de Adimplência (Conversão de Pagamentos)
        // (Faturas Pagas / Total de Faturas Emitidas e Vencidas) * 100
        const faturasVencidasOuPagas = mensalidades.filter(m => {
             if (m.status === 'Pago' || m.status === 'Baixado') return true;
             const d = parseDateBR(m.vencimento);
             return d && d <= today; // Considera apenas o que já venceu
        });
        const taxaAdimplencia = faturasVencidasOuPagas.length > 0 
            ? (faturasPagas.length / faturasVencidasOuPagas.length) * 100 
            : 0;

        // 8. Próximas Renovações (Próximos 30 dias)
        const proximasRenovacoes = assinaturas
            .filter(sub => {
                if (sub.status !== 'Ativo') return false;
                if (!sub.dataFinal) return false;
                const dataFim = new Date(sub.dataFinal); // Assinatura usa ISO format
                const diffTime = dataFim.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 30;
            })
            .sort((a, b) => new Date(a.dataFinal).getTime() - new Date(b.dataFinal).getTime())
            .slice(0, 5); // Top 5

        // --- GRÁFICOS ---

        // 9. Gráfico Tendência
        const trendData: { label: string; value: number }[] = [];
        for (let i = 0; i < 6; i++) {
            const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthIdx = futureDate.getMonth();
            const year = futureDate.getFullYear();
            const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'short' });
            
            const sum = mensalidades.reduce((acc, m) => {
                const d = parseDateBR(m.vencimento);
                if (d && d.getMonth() === monthIdx && d.getFullYear() === year) {
                    return acc + m.valor;
                }
                return acc;
            }, 0);
            trendData.push({ label: monthName, value: sum });
        }

        // 10. Planos (Pie Chart)
        const planDistribution: Record<string, number> = {};
        let totalSubs = 0;
        assinaturas.forEach(sub => {
            const name = sub.nomePlano || 'Outros';
            planDistribution[name] = (planDistribution[name] || 0) + 1;
            totalSubs++;
        });

        const pieData = Object.entries(planDistribution).map(([name, count]) => ({
            name,
            value: count,
            percentage: totalSubs > 0 ? Math.round((count / totalSubs) * 100) : 0
        })).sort((a, b) => b.value - a.value);

        return {
            receitaMes,
            receitaAno,
            totalClientes,
            mrr,
            atrasadosCount,
            trendData,
            pieData,
            // Novos campos
            arpu,
            ltv,
            taxaAdimplencia,
            proximasRenovacoes
        };
    }
};
