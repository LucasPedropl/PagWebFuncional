import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Cobranca,
  MetodoPagamento,
  PagamentoUnicoResponse,
} from '../schemas/cobrancaSchemas';
import { DEMO_PAGADORES_CLIENTE } from '../mocks/demoPagadoresCliente';
import {
  DEMO_COBRANCAS_A_PAGAR_CLIENTE,
  DEMO_COBRANCAS_CRIADAS_CLIENTE,
} from '../mocks/demoCobrancasCliente';

interface CreateCobrancaDemoInput {
  descricao: string;
  observacao?: string;
  clientId: number;
  valor: number;
}

interface UseClientePagamentoUnicoDemoResult {
  aPagar: Cobranca[];
  criadas: Cobranca[];
  pagadores: typeof DEMO_PAGADORES_CLIENTE;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createCobranca: (input: CreateCobrancaDemoInput) => Promise<void>;
  cancelCobranca: (id: number) => Promise<void>;
  pagarCobranca: (
    idCobranca: number,
    metodo: MetodoPagamento,
    lista: 'a_pagar' | 'criadas',
  ) => Promise<PagamentoUnicoResponse>;
}

const DEMO_PIX_PAYLOAD =
  '00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5925PagWeb Demonstracao6009SAO PAULO62070503***6304DEMO';

/**
 * Lista, cadastro e pagamento simulados (duas listas) até a API do cliente existir.
 */
export const useClientePagamentoUnicoDemo = (): UseClientePagamentoUnicoDemoResult => {
  const [aPagar, setAPagar] = useState<Cobranca[]>([]);
  const [criadas, setCriadas] = useState<Cobranca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nextIdRef = useRef(9200);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setAPagar(DEMO_COBRANCAS_A_PAGAR_CLIENTE.map((c) => ({ ...c })));
      setCriadas(DEMO_COBRANCAS_CRIADAS_CLIENTE.map((c) => ({ ...c })));
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

  const createCobranca = useCallback(async (input: CreateCobrancaDemoInput) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const pagador = DEMO_PAGADORES_CLIENTE.find((p) => p.idUser === input.clientId);
    const nome =
      pagador != null
        ? `${pagador.nome}${pagador.sobreNome ? ` ${pagador.sobreNome}` : ''}`.trim()
        : 'Pagador';
    nextIdRef.current += 1;
    const nova: Cobranca = {
      id: nextIdRef.current,
      valorTotal: input.valor,
      descricao: input.descricao,
      observacao: input.observacao ?? null,
      status: 'Aberto',
      usuario: {
        idUser: input.clientId,
        nome,
        email: pagador?.email ?? '',
      },
      produtos: [],
      servicos: [],
    };
    setCriadas((prev) => [nova, ...prev]);
  }, []);

  const cancelCobranca = useCallback(async (id: number) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setCriadas((prev) =>
      prev.map((c) =>
        c.id === id && (c.status === 'Aberto' || c.status === 'Atrasado')
          ? { ...c, status: 'Cancelado' as const }
          : c,
      ),
    );
  }, []);

  const pagarCobranca = useCallback(
    async (
      idCobranca: number,
      metodo: MetodoPagamento,
      lista: 'a_pagar' | 'criadas',
    ): Promise<PagamentoUnicoResponse> => {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const markPaid = (setter: typeof setAPagar) => {
        setter((prev) =>
          prev.map((c) =>
            c.id === idCobranca && (c.status === 'Aberto' || c.status === 'Atrasado')
              ? { ...c, status: 'Pago' as const }
              : c,
          ),
        );
      };

      if (lista === 'a_pagar') {
        markPaid(setAPagar);
      }

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

  return {
    aPagar,
    criadas,
    pagadores: DEMO_PAGADORES_CLIENTE,
    isLoading,
    error,
    refresh,
    createCobranca,
    cancelCobranca,
    pagarCobranca,
  };
};
