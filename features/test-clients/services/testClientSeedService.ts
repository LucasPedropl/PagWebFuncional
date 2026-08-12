import { companyService } from '../../../services/companyService';
import { userService } from '../../../services/userService';
import {
  GeneratedTestClientCredentials,
  buildTestClientRegistrationPayload,
} from '../utils/testClientGenerators';

const resolveCompanyId = async (): Promise<number> => {
  const company = await companyService.getMyCompany();
  const id = Number(company.idEmpresa) || 0;
  if (id <= 0) {
    throw new Error('Empresa do administrador não encontrada. Faça login business novamente.');
  }
  return id;
};

export interface SeedTestClientsResult {
  created: GeneratedTestClientCredentials[];
  failed: Array<{ email: string; message: string }>;
}

/**
 * Cria N clientes já Ativos e vinculados à empresa do admin logado
 * via POST /User/register?idEmpresa= (RegisterNovatoAsync — sem e-mail/activate).
 */
export const seedTestClientsForCurrentCompany = async (
  quantity: number,
): Promise<SeedTestClientsResult> => {
  const safeQuantity = Math.min(Math.max(Math.floor(quantity), 1), 50);
  const idEmpresa = await resolveCompanyId();
  const created: GeneratedTestClientCredentials[] = [];
  const failed: Array<{ email: string; message: string }> = [];

  for (let index = 0; index < safeQuantity; index += 1) {
    const payload = buildTestClientRegistrationPayload(created.length + failed.length + 1);
    try {
      await userService.register(payload, idEmpresa);
      created.push(payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao cadastrar cliente de teste';
      failed.push({ email: payload.email, message });
    }
  }

  return { created, failed };
};
