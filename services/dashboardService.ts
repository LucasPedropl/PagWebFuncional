
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

// Helper: Verifica se uma assinatura está ativa num determinado mês/ano
const isSubActiveInDate = (sub: SubscriptionResponse, targetDate: Date) => {
    // Só conta assinaturas que não estão canceladas
    if (sub.status !== 'Ativo') return false;

    // Data de Início da Assinatura
    const start = new Date(sub.dataInicial);
    
    // Normalizar para comparar apenas mês/ano (chave YYYYMM)
    const targetKey = targetDate.getFullYear() * 12 + targetDate.getMonth();
    const startKey = start.getFullYear() * 12 + start.getMonth();

    // Se a data alvo é anterior ao início da assinatura, não conta
    if (targetKey < startKey) return false;

    // Se periodo for 0, é recorrente infinito (enquanto estiver Ativo)
    if (sub.periodo === 0) {
        return true;
    }

    // Se tem período fixo, calcula o fim
    const endKey = startKey + sub.periodo; // Ex: Start Jan (0), Period 12 => End Jan prox ano (12). Ativo em 0...11.
    
    // Está ativo se o alvo for menor que o mês final (exclusive, se considerar que acaba no inicio do mes seguinte)
    // Assumindo que periodo 12 meses inclui o 12º mês na contagem de pagamento se for dia igual? 
    // Simplificação: Periodo N gera N mensalidades. Se startKey=0, period=1, deve gerar pagamento no mes 0. Mes 1 não.
    return targetKey < endKey;
};

export const dashboardService = {
    
    async getDashboardData() {
        const [rawMensalidades, rawClientes] = await Promise.all([
            businessService.listMensalidades(),
            businessService.listClients(),
        ]);

        // Programação Defensiva: Garante que sejam arrays
        const mensalidades = Array.isArray(rawMensalidades) ? rawMensalidades : [];
        const clientes = Array.isArray(rawClientes) ? rawClientes : [];
        // O endpoint /Assinatura/empresa retorna 500 por bug de serialização no backend.
        // Evitamos chamá-lo no dashboard para não gerar erros no console durante o login.
        const assinaturas: SubscriptionResponse[] = [];

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // --- MÉTRICAS BÁSICAS ---

        // 1. Faturamento Mês (Projeção baseada em assinaturas ativas)
        // Soma o valor de todas as assinaturas que estão vigentes no mês atual
        const receitaMes = assinaturas.reduce((acc, sub) => {
            if (isSubActiveInDate(sub, today)) {
                return acc + (sub.valorComDesconto || 0);
            }
            return acc;
        }, 0);

        // 2. Faturamento Ano (Projeção acumulada do ano corrente)
        // Itera mês a mês do ano atual e soma se a assinatura estiver ativa
        let receitaAno = 0;
        for (let m = 0; m < 12; m++) {
            const checkDate = new Date(currentYear, m, 1);
            // Otimização: Se o mês checado for futuro, assumimos que assinaturas ativas continuarão ativas
            // Se for passado, idealmente olhariamos faturas pagas, mas para consistência da projeção usaremos a assinatura
            
            const receitaDoMes = assinaturas.reduce((acc, sub) => {
                if (isSubActiveInDate(sub, checkDate)) {
                    return acc + (sub.valorComDesconto || 0);
                }
                return acc;
            }, 0);
            
            receitaAno += receitaDoMes;
        }

        // 3. Clientes Ativos
        const totalClientes = clientes.length;

        // 4. MRR (Receita Recorrente Mensal Atual)
        // Basicamente igual a receitaMes se todas forem mensais, mas mantém conceito separado
        const mrr = assinaturas.reduce((acc, sub) => {
            if (sub.status === 'Ativo') {
                return acc + (sub.valorComDesconto || 0);
            }
            return acc;
        }, 0);

        // 5. Atrasados (Continua dependendo de Faturas reais geradas)
        const atrasadosCount = mensalidades.filter(m => {
            if (m.status === 'Atrasado') return true;
            if (m.status === 'Pago' || m.status === 'Baixado') return false;
            
            const d = parseDateBR(m.vencimento);
            if (d && d < today && m.status === 'Aberto') return true;
            
            return false;
        }).length;

        // --- MÉTRICAS AVANÇADAS ---

        // Ticket Médio (ARPU)
        const assinaturasAtivas = assinaturas.filter(s => s.status === 'Ativo');
        const arpu = assinaturasAtivas.length > 0 ? mrr / assinaturasAtivas.length : 0;

        // LTV (Lifetime Value) - Receita Total Histórica / Clientes Únicos
        const faturasPagas = mensalidades.filter(m => m.status === 'Pago' || m.status === 'Baixado');
        const receitaTotalHistorica = faturasPagas.reduce((acc, m) => acc + m.valor, 0);
        const clientesPagantesUnicos = new Set(faturasPagas.map(m => m.emailCliente)).size;
        const ltv = clientesPagantesUnicos > 0 ? receitaTotalHistorica / clientesPagantesUnicos : 0;

        // Taxa de Adimplência
        const faturasVencidasOuPagas = mensalidades.filter(m => {
             if (m.status === 'Pago' || m.status === 'Baixado') return true;
             const d = parseDateBR(m.vencimento);
             return d && d <= today;
        });
        const taxaAdimplencia = faturasVencidasOuPagas.length > 0 
            ? (faturasPagas.length / faturasVencidasOuPagas.length) * 100 
            : 0;
            
        const adimplenciaStats = {
            paid: faturasPagas.length,
            total: faturasVencidasOuPagas.length
        };

        // Próximas Renovações (Apenas para assinaturas com fim definido)
        const proximasRenovacoes = assinaturas
            .filter(sub => {
                if (sub.status !== 'Ativo') return false;
                if (sub.periodo === 0) return false; // Recorrente não tem "renovação" de contrato, é contínuo
                if (!sub.dataFinal) return false;
                
                const dataFim = new Date(sub.dataFinal);
                const diffTime = dataFim.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 30;
            })
            .sort((a, b) => new Date(a.dataFinal).getTime() - new Date(b.dataFinal).getTime())
            .slice(0, 5);

        // --- GRÁFICOS (Projeção Futura) ---

        // Tendência: Projeção baseada nas assinaturas ativas para os próximos 6 meses
        const trendData: { label: string; value: number }[] = [];
        for (let i = 0; i < 6; i++) {
            const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'short' });
            
            const projectedRevenue = assinaturas.reduce((acc, sub) => {
                if (isSubActiveInDate(sub, futureDate)) {
                    return acc + (sub.valorComDesconto || 0);
                }
                return acc;
            }, 0);

            trendData.push({ label: monthName, value: projectedRevenue });
        }

        // Planos (Pie Chart)
        const planDistribution: Record<string, number> = {};
        let totalSubs = 0;
        assinaturas.forEach(sub => {
            if (sub.status === 'Ativo') {
                const name = sub.nomePlano || 'Outros';
                planDistribution[name] = (planDistribution[name] || 0) + 1;
                totalSubs++;
            }
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
            arpu,
            ltv,
            taxaAdimplencia,
            adimplenciaStats,
            proximasRenovacoes
        };
    }
};
