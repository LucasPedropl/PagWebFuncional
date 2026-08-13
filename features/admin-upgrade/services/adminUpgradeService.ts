import { companyService } from '../../../services/companyService';
import { sessionService } from '../../../services/session';
import { controleAcessoService } from '../../controle-acesso/services/controleAcessoService';
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
  modulesRequested: boolean;
  modulesError: string | null;
}

/**
 * Cria empresa (PJ ou PF), troca sessão para admin e opcionalmente
 * solicita módulos via POST /api/v1/User/solicitar-acesso.
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

  let modulesError: string | null = null;
  const wantsModules = input.requestPayment || input.requestWhatsapp;

  if (wantsModules) {
    try {
      await controleAcessoService.requestAccess({
        payment: input.requestPayment ? 'Solicitado' : 'Inativo',
        whatsapp: input.requestWhatsapp ? 'Solicitado' : 'Inativo',
        password: input.password,
      });
    } catch (err) {
      modulesError =
        err instanceof Error
          ? err.message
          : 'Falha ao solicitar módulos (User/solicitar-acesso)';
      console.warn('[admin-upgrade] módulos não solicitados:', modulesError);
    }
  }

  sessionService.setActiveView('business');
  return { modulesRequested: wantsModules && !modulesError, modulesError };
}
