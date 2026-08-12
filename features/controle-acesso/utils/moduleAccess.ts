import type { ControleAcessoDetail, EstadoAcesso } from '../schemas/controleAcessoSchemas';

export const ESTADO_ACESSO_LABEL: Record<EstadoAcesso, string> = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
  Solicitado: 'Aguardando liberação',
};

export const isModuleUnlocked = (estado: EstadoAcesso | null | undefined): boolean =>
  estado === 'Ativo';

export interface ModuleAccessSnapshot {
  paymentStatus: EstadoAcesso;
  whatsappStatus: EstadoAcesso;
  overallStatus: EstadoAcesso | null;
  paymentUnlocked: boolean;
  whatsappUnlocked: boolean;
  hasRequest: boolean;
}

export const buildModuleAccessSnapshot = (
  detail: ControleAcessoDetail | null,
): ModuleAccessSnapshot => {
  const paymentStatus = detail?.payment ?? 'Inativo';
  const whatsappStatus = detail?.whatsapp ?? 'Inativo';
  return {
    paymentStatus,
    whatsappStatus,
    overallStatus: detail?.estado ?? null,
    paymentUnlocked: isModuleUnlocked(paymentStatus),
    whatsappUnlocked: isModuleUnlocked(whatsappStatus),
    hasRequest: detail != null && detail.idControle > 0,
  };
};
