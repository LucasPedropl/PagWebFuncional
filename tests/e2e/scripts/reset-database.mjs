/**
 * Wipe total do banco via `DELETE /api/zTemporario/dev/danger-reset-database`.
 *
 * ⚠️  DESTRUTIVO E IRREVERSÍVEL. O endpoint executa `DELETE FROM` em **todas** as
 * tabelas (exceto `__EFMigrationsHistory`) e faz `DBCC CHECKIDENT ... RESEED, 1`.
 * Não há backup, não há filtro por empresa, não há autenticação no endpoint.
 *
 * Por isso este script **exige confirmação explícita**:
 *   node scripts/reset-database.mjs --yes-i-am-sure
 * ou, via suíte:
 *   E2E_RESET_DB=1 npx playwright test
 */
const BASE_URL = (process.env.E2E_API_BASE_URL ?? 'https://lojas.vlks.com.br').replace(/\/$/, '');

export async function resetDatabase() {
  const url = `${BASE_URL}/api/zTemporario/dev/danger-reset-database?confirmacao=SIM`;
  const response = await fetch(url, { method: 'DELETE', headers: { accept: '*/*' } });
  const text = await response.text();
  return { status: response.status, ok: response.ok, text };
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());

if (invokedDirectly) {
  if (!process.argv.includes('--yes-i-am-sure')) {
    console.error(
      'Recusado. Este comando apaga TODOS os dados de %s.\n' +
        'Se é isso mesmo que você quer: node scripts/reset-database.mjs --yes-i-am-sure',
      BASE_URL,
    );
    process.exit(1);
  }
  const result = await resetDatabase();
  console.log(`[reset] ${result.status} ${result.text}`);
  process.exit(result.ok ? 0 : 1);
}
