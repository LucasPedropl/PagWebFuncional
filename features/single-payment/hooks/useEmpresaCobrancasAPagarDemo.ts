import { useCallback, useEffect, useState } from 'react';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../schemas/cobrancaSchemas';
import { DEMO_COBRANCAS_A_PAGAR_EMPRESA } from '../mocks/demoCobrancasCliente';

const DEMO_PIX_PAYLOAD =
  '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5925PagWeb Demonstracao6009SAO PAULO62070503***6304DEMO';

interface UseEmpresaCobrancasAPagarDemoResult {
  aPagar: Cobranca[];
  isLoading: boolean;
  error: string | null;
  pagarCobranca: (
    idCobranca: number,
    metodo: MetodoPagamento,
  ) => Promise<PagamentoUnicoResponse>;
}

/** Cobranças a pagar pela empresa (fornecedores) — demo até existir endpoint. */
export const useEmpresaCobrancasAPagarDemo = (): UseEmpresaCobrancasAPagarDemoResult => {
  const [aPagar, setAPagar] = useState<Cobranca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!cancelled) {
          setAPagar(DEMO_COBRANCAS_A_PAGAR_EMPRESA.map((c) => ({ ...c })));
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar cobranças';
          console.error('[useEmpresaCobrancasAPagarDemo]', err);
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pagarCobranca = useCallback(
    async (idCobranca: number, metodo: MetodoPagamento): Promise<PagamentoUnicoResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setAPagar((prev) =>
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
          invoiceId: `demo-emp-${idCobranca}`,
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
          invoiceId: `demo-emp-${idCobranca}`,
          status: 'pending',
          paymentType: metodo,
        };
      }

      return {
        pixEmv: null,
        barcode: null,
        digitableLine: null,
        bankSlipUrl: null,
        invoiceId: `demo-emp-${idCobranca}`,
        status: 'processing',
        paymentType: metodo,
      };
    },
    [],
  );

  return { aPagar, isLoading, error, pagarCobranca };
};
