/**
 * Identidade dupla — o diferencial de arquitetura do PagWeb.
 *
 * Um dono de estabelecimento também é cliente. O `ViewSwitcher` da sidebar chama
 * `sessionService.switchToMode`, que grava `pagweb_active_view`, troca o token
 * ativo (usando as credenciais em `sessionStorage`) e navega — tudo sem logout.
 *
 * A alternância **precisa** passar pelo switcher: os guards de `App.tsx` leem
 * `pagweb_active_view` durante o render, então entrar por URL crua no outro
 * ambiente é rejeitado antes do `useEffect` que ajustaria a flag.
 *
 * Ver README §4.A, `services/session.ts` e `components/layout/shell/ViewSwitcher.tsx`.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../src/fixtures';
import { entrarComIdentidadeDupla, irPara, tituloDaPagina } from './support/session';
import { decodeJwt, ROLE_CLAIM } from '../src/http';

const roleDoTokenAtivo = async (page: Page): Promise<string> => {
  const token = await page.evaluate(() => localStorage.getItem('pagweb_token'));
  expect(token).toBeTruthy();
  return String(decodeJwt(token!)[ROLE_CLAIM]);
};

/**
 * Abre o menu da conta (onde vive o `ViewSwitcherPanel`) e escolhe um ambiente.
 * O painel só aparece para quem tem identidade dupla.
 */
const SUBTITULO_AMBIENTE = {
  Estabelecimento: 'Planos, clientes e cobranças',
  Cliente: 'Assinaturas e faturas',
} as const;

const alternarAmbiente = async (page: Page, destino: 'Estabelecimento' | 'Cliente'): Promise<void> => {
  await page.getByRole('button', { name: 'Menu da conta' }).first().click();
  // O subtítulo é o que distingue as duas opções — o título "Cliente" colide
  // com outros botões da tela.
  await page.getByRole('button').filter({ hasText: SUBTITULO_AMBIENTE[destino] }).first().click();
};

test.describe('Alternância de perfil pelo seletor de ambiente', () => {
  test('do painel para a área de cliente: o token ativo vira Cliente', async ({ page, tenant }) => {
    await entrarComIdentidadeDupla(page, tenant.admin, 'business');
    await irPara(page, '/business/dashboard');
    await expect(tituloDaPagina(page, 'Dashboard Overview')).toBeVisible();
    expect(await roleDoTokenAtivo(page)).toBe('Admin');

    await alternarAmbiente(page, 'Cliente');

    await expect(page).toHaveURL(/#\/dashboard/);
    await expect(tituloDaPagina(page, /Olá,/)).toBeVisible();
    expect(await roleDoTokenAtivo(page)).toBe('Cliente');
  });

  test('da área de cliente para o painel: o token ativo volta a Admin', async ({ page, tenant }) => {
    await entrarComIdentidadeDupla(page, tenant.admin, 'client');
    await irPara(page, '/dashboard');
    await expect(tituloDaPagina(page, /Olá,/)).toBeVisible();
    expect(await roleDoTokenAtivo(page)).toBe('Cliente');

    await alternarAmbiente(page, 'Estabelecimento');

    await expect(page).toHaveURL(/#\/business\/dashboard/);
    await expect(tituloDaPagina(page, 'Dashboard Overview')).toBeVisible();
    expect(await roleDoTokenAtivo(page)).toBe('Admin');
  });

  test('os dois tokens ficam em cache separados após a alternância', async ({ page, tenant }) => {
    await entrarComIdentidadeDupla(page, tenant.admin, 'business');
    await irPara(page, '/business/dashboard');
    await alternarAmbiente(page, 'Cliente');
    await expect(tituloDaPagina(page, /Olá,/)).toBeVisible();

    const cache = await page.evaluate(() => ({
      admin: localStorage.getItem('pagweb_token_admin'),
      client: localStorage.getItem('pagweb_token_client'),
      view: localStorage.getItem('pagweb_active_view'),
      owner: localStorage.getItem('pagweb_empresa_owner'),
    }));

    expect(cache.admin).toBeTruthy();
    expect(cache.client).toBeTruthy();
    expect(cache.admin).not.toBe(cache.client);
    expect(cache.view).toBe('client');
    expect(cache.owner).toBe('1');
    expect(decodeJwt(cache.admin!)[ROLE_CLAIM]).toBe('Admin');
    expect(decodeJwt(cache.client!)[ROLE_CLAIM]).toBe('Cliente');
  });

  test('ida e volta preserva o acesso aos dados de cada ambiente', async ({ page, tenant }) => {
    await entrarComIdentidadeDupla(page, tenant.admin, 'business');
    await irPara(page, '/business/dashboard');

    await alternarAmbiente(page, 'Cliente');
    await expect(tituloDaPagina(page, /Olá,/)).toBeVisible();

    await alternarAmbiente(page, 'Estabelecimento');
    await irPara(page, '/business/clientes');
    await expect(tituloDaPagina(page, 'Gestão de Clientes')).toBeVisible();
    await expect(page.getByText(tenant.clientes[0]!.email, { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('a área de cliente do dono carrega sem erro de runtime', async ({ page, tenant }) => {
    const erros: string[] = [];
    page.on('pageerror', (error) => erros.push(error.message));

    await entrarComIdentidadeDupla(page, tenant.admin, 'client');
    for (const rota of ['/dashboard', '/assinaturas', '/pagamentos', '/empresas']) {
      await irPara(page, rota);
      await expect(page.getByRole('main')).toBeVisible();
    }

    expect(erros).toEqual([]);
  });
});

test.describe('Guardas durante a alternância', () => {
  test('URL crua do outro ambiente é rejeitada enquanto a view não trocou', async ({ page, tenant }) => {
    // Comportamento intencional dos guards em App.tsx: o redirecionamento é
    // decidido no render, antes do efeito que ajustaria `pagweb_active_view`.
    await entrarComIdentidadeDupla(page, tenant.admin, 'business');
    await irPara(page, '/dashboard');
    await expect(page).toHaveURL(/#\/business\/dashboard/);
  });
});
