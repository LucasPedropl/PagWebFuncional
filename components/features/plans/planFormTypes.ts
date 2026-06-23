import type { ChangeEvent } from 'react';
import { PlanServiceBenefit } from '../../../features/services/schemas/serviceTypes';
import { TIPO_CONTRATO } from '../../../utils/api';

export interface PlanFormData {
  nome: string;
  valorMensalidade: string;
  percentualMulta: string;
  percentualJurosMensal: string;
  funcionalidades: string;
  contrato: File | null;
  tipoContrato: string;
  cancelamentoDias: string;
  assinarPorCliente: boolean;
}

export interface PlanFormStepProps {
  formData: PlanFormData;
  onInputChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface PlanFormContentStepProps extends PlanFormStepProps {
  planBenefits: PlanServiceBenefit[];
  onBenefitsChange: (benefits: PlanServiceBenefit[]) => void;
  catalogServices: import('../../../features/services/schemas/serviceTypes').LocalService[];
}

export const PLAN_FORM_STEPS = [
  { id: 1, label: 'Dados básicos' },
  { id: 2, label: 'Contrato' },
  { id: 3, label: 'Benefícios' },
] as const;

export const emptyPlanFormData = (): PlanFormData => ({
  nome: '',
  valorMensalidade: '',
  percentualMulta: '',
  percentualJurosMensal: '',
  funcionalidades: '',
  contrato: null,
  tipoContrato: String(TIPO_CONTRATO.Nenhum),
  cancelamentoDias: '7',
  assinarPorCliente: true,
});

/** Remove linhas geradas automaticamente a partir de serviços do plano. */
export const extractManualFuncionalidades = (items: string[] | undefined): string => {
  if (!items?.length) return '';
  return items
    .filter((f) => !/\(incluso no plano\)\s*$/i.test(f.trim()))
    .join('\n');
};
