/**
 * Teardown.
 *
 * Por padrão **não apaga nada**: a suíte já cria massa isolada e identificável
 * (prefixo `e2e`, domínio `@pagweb-e2e.test`).
 *
 * Com `E2E_RESET_DB=1`, dispara o wipe total do banco. É destrutivo e
 * irreversível — ver `scripts/reset-database.mjs`.
 */
import { RESET_DB_AFTER_RUN, API_BASE_URL } from './src/config';
import { resetDatabase } from './scripts/reset-database.mjs';

export default async function globalTeardown(): Promise<void> {
  if (!RESET_DB_AFTER_RUN) {
    console.log('[e2e] teardown: reset de banco desligado (defina E2E_RESET_DB=1 para habilitar).');
    return;
  }

  console.warn(`[e2e] ⚠️  RESET TOTAL do banco em ${API_BASE_URL} ...`);
  const result = await resetDatabase();
  console.warn(`[e2e] reset: ${result.status} ${result.text}`);
}
