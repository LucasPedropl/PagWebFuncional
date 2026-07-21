import { useCallback, useEffect, useState } from 'react';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../schemas/cobrancaSchemas';
import { DEMO_COBRANCAS_CLIENTE } from '../mocks/demoCobrancasCliente';

interface UseClientePagamentoUnicoDemoResult {
  cobrancas: Cobranca[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  pagarCobranca: (
    idCobranca: number,
    metodo: MetodoPagamento,
  ) => Promise<PagamentoUnicoResponse>;
}

const DEMO_PIX_PAYLOAD =
  '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5925PagWeb Demonstracao6009SAO PAULO62070503***6304DEMO';

/**
 * Lista e pagamento simulados para a tela de Pagamento Único do cliente.
 * Substituir por `useUserCobrancas` quando o backend estiver pronto.
 */
export const useClientePagamentoUnicoDemo = (): UseClientePagamentoUnicoDemoResult => {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setCobrancas(DEMO_COBRANCAS_CLIENTE.map((c) => ({ ...c })));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar cobranças';
      console.error('[useClientePagamentoUnicoDemo] refresh:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pagarCobranca = useCallback(
    async (idCobranca: number, metodo: MetodoPagamento): Promise<PagamentoUnicoResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 600));

      setCobrancas((prev) =>
        prev.map((c) =>
          c.id === idCobranca && (c.status === 'Aberto' || c.status === 'Atrasado')
            ? { ...c, status: 'Pago' as const }
            : c,
        ),
      );

      if (metodo === 'PIX' || metodo === 'BoletoPix') {
        return {
          pixEmv: DEMO_PIX_PAYLOAD,
          barcode: null,
          digitableLine: null,
          bankSlipUrl: null,
          invoiceId: `demo-${idCobranca}`,
          status: 'pending',
          paymentType: metodo,
        };
      }

      if (metodo === 'Boleto') {
        return {
          pixEmv: null,
          barcode: '23793381286008301352856000063307700000018990',
          digitableLine: '23793.38128 60083.013528 56000.063307 7 00000018990',
          bankSlipUrl: null,
          invoiceId: `demo-${idCobranca}`,
          status: 'pending',
          paymentType: metodo,
        };
      }

      return {
        pixEmv: null,
        barcode: null,
        digitableLine: null,
        bankSlipUrl: null,
        invoiceId: `demo-${idCobranca}`,
        status: 'processing',
        paymentType: metodo,
      };
    },
    [],
  );

  return { cobrancas, isLoading, error, refresh, pagarCobranca };
};
