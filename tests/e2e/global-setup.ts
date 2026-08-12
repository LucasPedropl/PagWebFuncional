/**
 * Semeia o ambiente antes de qualquer spec e grava o estado em disco.
 * Ver `src/seed.ts` para a cadeia de bootstrap e por que ela não depende de e-mail.
 */
import { API_BASE_URL } from './src/config';
import { seedEnvironment } from './src/seed';
import { writeState } from './src/state';

export default async function globalSetup(): Promise<void> {
  const started = Date.now();
  console.log(`[e2e] semeando ambiente em ${API_BASE_URL} ...`);

  const state = await seedEnvironment(API_BASE_URL);
  writeState(state);

  console.log(
    `[e2e] pronto em ${Date.now() - started}ms — ` +
      `empresa principal #${state.primary.idEmpresa} (${state.primary.clientes.length} clientes), ` +
      `empresa rival #${state.secondary.idEmpresa}`,
  );
}
