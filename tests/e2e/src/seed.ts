/**
 * Semeadura do ambiente E2E.
 *
 * A suíte não depende de nenhuma conta pré-existente além da âncora inicial:
 * ela constrói dois tenants completos do zero, o que a mantém executável logo
 * após um reset de banco.
 *
 * Cadeia de bootstrap (validada contra a API):
 *   1. `POST /User/register?idEmpresa=N` cria o usuário já **Ativo**
 *      (`RegisterNovatoAsync` seta `Status = Ativo` e `IsEmailVerified = true`),
 *      contornando o token de 6 dígitos enviado por e-mail.
 *   2. `POST /login-cliente` autentica esse usuário.
 *   3. `POST /Empresa` (qualquer autenticado) cria a empresa e vincula o criador
 *      como `UserTipo.Admin`.
 *   4. `POST /login-admin` agora devolve um token com role `Admin`.
 *   5. Novos `register?idEmpresa=<empresa criada>` produzem clientes já conectados.
 */
import { BOOTSTRAP_EMPRESA_ID, SEED_PASSWORD } from './config';
import { generateCnpj, generateCpf, generateEmail, generatePhone, label } from './data';
import { api, toFormData } from './http';
import { loginCliente } from './auth';
import type { E2EState, SeededTenant, SeededUser } from './state';

interface EmpresaListItem {
  idEmpresa: number;
  nome: string;
  status: number;
}

/** Descobre uma empresa existente para ancorar o primeiro registro ativo. */
const resolveBootstrapEmpresa = async (): Promise<number> => {
  if (BOOTSTRAP_EMPRESA_ID) return BOOTSTRAP_EMPRESA_ID;

  const res = await api.get<EmpresaListItem[]>('/api/v1/Empresa');
  if (!res.ok || !Array.isArray(res.body) || res.body.length === 0) {
    throw new Error(
      'Nenhuma empresa disponível para ancorar o bootstrap. ' +
        'Após um reset total do banco, crie uma empresa manualmente e informe E2E_BOOTSTRAP_EMPRESA_ID. ' +
        `Resposta: ${res.status} ${res.text.slice(0, 200)}`,
    );
  }
  const first = res.body[0];
  if (!first) throw new Error('Lista de empresas vazia.');
  return first.idEmpresa;
};

/**
 * Registra um usuário já ativo e vinculado a `idEmpresa` como Cliente.
 * Retorna o usuário com o `idUser` lido do JWT (o register não devolve o id).
 */
export const registerActiveUser = async (role: string, idEmpresa: number): Promise<SeededUser> => {
  const user: Omit<SeededUser, 'idUser'> = {
    nome: 'E2E',
    sobreNome: role,
    email: generateEmail(role),
    password: SEED_PASSWORD,
    cpf: generateCpf(),
    telefone: generatePhone(),
  };

  const res = await api.post(
    '/api/v1/User/register',
    toFormData({
      Nome: user.nome,
      SobreNome: user.sobreNome,
      Cpf: user.cpf,
      Email: user.email,
      Password: user.password,
      Telefone: user.telefone,
    }),
    { query: { idEmpresa } },
  );

  if (!res.ok) {
    throw new Error(`Falha ao registrar usuário ${role}: ${res.status} ${res.text.slice(0, 300)}`);
  }

  const auth = await loginCliente(user.email, user.password);
  return { ...user, idUser: auth.idUser };
};

/** Cria a empresa em nome de `user`, que passa a ser Admin dela. */
export const createEmpresaFor = async (
  user: SeededUser,
): Promise<{ idEmpresa: number; nome: string; cnpj: string }> => {
  const auth = await loginCliente(user.email, user.password);
  const nome = label('Empresa');
  const cnpj = generateCnpj();

  const res = await api.post<{ empresa?: { idEmpresa: number } }>(
    '/api/v1/Empresa',
    toFormData({ Nome: nome, Cnpj: cnpj, Telefone: user.telefone }),
    { token: auth.token },
  );

  const idEmpresa = res.body?.empresa?.idEmpresa;
  if (!res.ok || !idEmpresa) {
    throw new Error(`Falha ao criar empresa: ${res.status} ${res.text.slice(0, 300)}`);
  }
  return { idEmpresa, nome, cnpj };
};

/**
 * Monta um tenant completo: admin + empresa + N clientes conectados.
 *
 * Exportado para os testes que precisam de uma vítima descartável — em especial
 * os de segurança, cujo objeto de ataque não pode ser o tenant compartilhado.
 */
export const seedTenant = async (
  bootstrapEmpresaId: number,
  adminLabel: string,
  clientCount: number,
): Promise<SeededTenant> => {
  const admin = await registerActiveUser(adminLabel, bootstrapEmpresaId);
  const empresa = await createEmpresaFor(admin);

  const clientes: SeededUser[] = [];
  for (let index = 0; index < clientCount; index += 1) {
    clientes.push(await registerActiveUser(`${adminLabel}-cliente${index + 1}`, empresa.idEmpresa));
  }

  return {
    admin,
    idEmpresa: empresa.idEmpresa,
    nomeEmpresa: empresa.nome,
    cnpj: empresa.cnpj,
    clientes,
  };
};

export const seedEnvironment = async (apiBaseUrl: string): Promise<E2EState> => {
  const bootstrapEmpresaId = await resolveBootstrapEmpresa();

  const primary = await seedTenant(bootstrapEmpresaId, 'admin', 2);
  const secondary = await seedTenant(bootstrapEmpresaId, 'rival', 1);

  return {
    createdAt: new Date().toISOString(),
    apiBaseUrl,
    bootstrapEmpresaId,
    primary,
    secondary,
  };
};
