/**
 * Configuração central da suíte E2E.
 *
 * Tudo é dirigido por variáveis de ambiente para que a mesma suíte rode contra
 * homologação, produção ou uma instância local da API sem alterar código.
 */
import { fileURLToPath } from 'node:url';

const bool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'sim', 'on'].includes(value.toLowerCase());
};

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Origem HTTP da API (sem barra final). */
export const API_BASE_URL = (process.env.E2E_API_BASE_URL ?? 'https://lojas.vlks.com.br').replace(/\/$/, '');

/** Origem HTTP do frontend servido para os testes de UI. */
export const WEB_BASE_URL = (process.env.E2E_WEB_BASE_URL ?? 'http://127.0.0.1:4173').replace(/\/$/, '');

/** Porta usada pelo servidor estático embutido quando a UI é servida pela suíte. */
export const WEB_PORT = int(process.env.E2E_WEB_PORT, 4173);

/**
 * Conta "Master" da BixS. No `login-admin` ela é um atalho hardcoded no backend
 * (não é uma linha da tabela User): devolve role `Master` com `IdUser = 0`.
 * Serve apenas para os endpoints `[Authorize(Roles = "Master")]`.
 */
export const MASTER_CREDENTIALS = {
  email: process.env.E2E_MASTER_EMAIL ?? 'Pagweb@vlks.com.br',
  password: process.env.E2E_MASTER_PASSWORD ?? 'Pagweb@@',
} as const;

/** Senha usada em todas as contas criadas pela suíte. */
export const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? 'E2e@Pagweb123';

/**
 * Empresa já existente usada só como âncora do primeiro `register?idEmpresa=`
 * (esse caminho cria o usuário já Ativo, sem depender de e-mail de ativação).
 * Se não for informada, o seed descobre uma via `GET /api/v1/Empresa`.
 */
export const BOOTSTRAP_EMPRESA_ID = process.env.E2E_BOOTSTRAP_EMPRESA_ID
  ? Number.parseInt(process.env.E2E_BOOTSTRAP_EMPRESA_ID, 10)
  : undefined;

/** Caminho do arquivo com o estado semeado, compartilhado entre os workers. */
export const STATE_FILE =
  process.env.E2E_STATE_FILE ?? fileURLToPath(new URL('../.e2e-state.json', import.meta.url));

/**
 * Wipe total do banco no teardown (`DELETE /api/zTemporario/dev/danger-reset-database`).
 * Desligado por padrão: é destrutivo e irreversível.
 */
export const RESET_DB_AFTER_RUN = bool(process.env.E2E_RESET_DB, false);

/** Sobe o servidor estático da UI automaticamente (desligue se já houver um rodando). */
export const MANAGE_WEB_SERVER = bool(process.env.E2E_MANAGE_WEB_SERVER, true);

/** Timeout padrão de cada requisição HTTP da camada de API. */
export const HTTP_TIMEOUT_MS = int(process.env.E2E_HTTP_TIMEOUT_MS, 30_000);

/** Prefixo aplicado a e-mails/nomes gerados, para facilitar limpeza manual. */
export const DATA_PREFIX = process.env.E2E_DATA_PREFIX ?? 'e2e';

/** Domínio dos e-mails sintéticos (nada é enviado de verdade). */
export const EMAIL_DOMAIN = process.env.E2E_EMAIL_DOMAIN ?? 'pagweb-e2e.test';
