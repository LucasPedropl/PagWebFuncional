import { businessService } from '../../../services/businessService';
import { PlanPayload, PlanResponse } from '../../../types';
import { TIPO_CONTRATO } from '../../../utils/api';
import { buildDummyPlanContractPdfFile } from '../utils/buildDummyPlanContractPdf';

export interface SeedTestPlansResult {
  created: PlanResponse[];
  failed: Array<{ nome: string; message: string }>;
}

const buildSuffix = (): string => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}${mm}${ss}`;
};

/**
 * Cria exatamente 3 planos — um por TipoContrato (Nenhum, Termo, Contrato).
 * Só o tipo Contrato envia PDF modelo ao servidor.
 */
export const seedTestPlansForCurrentCompany = async (): Promise<SeedTestPlansResult> => {
  const suffix = buildSuffix();
  const baseValor = 49.9;
  const created: PlanResponse[] = [];
  const failed: Array<{ nome: string; message: string }> = [];

  const specs: Array<{
    nome: string;
    tipoContrato: number;
    withPdf: boolean;
    valorOffset: number;
  }> = [
    {
      nome: `WiFi Premium — sem contrato (${suffix})`,
      tipoContrato: TIPO_CONTRATO.Nenhum,
      withPdf: false,
      valorOffset: 0,
    },
    {
      nome: `WiFi Premium — termo de aceite (${suffix})`,
      tipoContrato: TIPO_CONTRATO.Termo,
      withPdf: false,
      valorOffset: 10,
    },
    {
      nome: `WiFi Premium — contrato PDF (${suffix})`,
      tipoContrato: TIPO_CONTRATO.Contrato,
      withPdf: true,
      valorOffset: 20,
    },
  ];

  for (const spec of specs) {
    try {
      const payload: PlanPayload = {
        nome: spec.nome,
        valorMensalidade: Number((baseValor + spec.valorOffset).toFixed(2)),
        percentualMulta: 2,
        percentualJurosMensal: 1,
        funcionalidades: [
          'Plano gerado automaticamente para testes',
          `TipoContrato=${spec.tipoContrato}`,
          'Suporte padrão PagWeb',
        ],
        tipoContrato: spec.tipoContrato,
        cancelamentoDias: 7,
        assinarPorCliente: true,
        arquivoContrato: spec.withPdf
          ? await buildDummyPlanContractPdfFile(spec.nome)
          : null,
      };

      const plan = await businessService.createPlan(payload);
      created.push(plan);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao criar plano de teste';
      failed.push({ nome: spec.nome, message });
    }
  }

  return { created, failed };
};
