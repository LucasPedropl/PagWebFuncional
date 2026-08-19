import { companyService } from '../../../services/companyService';
import { sessionService } from '../../../services/session';
import type { AdminUpgradeMode, AdminUpgradePjFormValues } from '../schemas/adminUpgradeSchemas';

export interface AdminUpgradeSubmitInput {
  mode: AdminUpgradeMode;
  password: string;
  requestPayment: boolean;
  requestWhatsapp: boolean;
  pjForm?: AdminUpgradePjFormValues;
  logoFile?: File | null;
}

export interface AdminUpgradeSubmitResult {
  wantsModules: boolean;
}

/**
 * Cria empresa (PJ ou PF) e troca a sessão para admin.
 * Não solicita módulos: o POST /api/v1/User/solicitar-acesso exige Role Admin e um
 * código de verificação por e-mail, que só é obtível depois desta troca de sessão.
 * A solicitação é concluída em Integrações.
 */
export async function submitAdminUpgrade(
  input: AdminUpgradeSubmitInput,
): Promise<AdminUpgradeSubmitResult> {
  const { token, user } = sessionService.getSession();
  if (!token || !user?.email) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }
  if (!input.password.trim()) {
    throw new Error('Informe sua senha para confirmar.');
  }

  if (input.mode === 'pj') {
    if (!input.pjForm) {
      throw new Error('Preencha os dados da empresa.');
    }
    await companyService.create(token, {
      nome: input.pjForm.nome.trim(),
      cnpj: input.pjForm.cnpj.replace(/\D/g, ''),
      telefone: input.pjForm.telefone.trim(),
      logo: input.logoFile ?? null,
    });
  } else {
    await companyService.createPf(token);
  }

  await companyService.login(user.email, input.password);

  const wantsModules = input.requestPayment || input.requestWhatsapp;

  sessionService.setActiveView('business');
  return { wantsModules };
}
