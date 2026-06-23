import { PlanResponse } from '../../../types';
import { LocalService } from '../../../features/services/schemas/serviceTypes';
import { localServiceStore } from '../../../features/services/services/localServiceStore';
import { extractManualFuncionalidades } from './planFormTypes';

/** Lista unificada de itens para exibição em cards (funcionalidades + serviços locais). */
export const getPlanDisplayFeatures = (
  plan: PlanResponse,
  catalogServices: LocalService[],
): string[] => {
  const manual = extractManualFuncionalidades(plan.funcionalidades)
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  const serviceLines = localServiceStore.benefitsToFuncionalidades(
    localServiceStore.getPlanBenefits(plan.idPlano),
    catalogServices,
  );

  return [...manual, ...serviceLines];
};
