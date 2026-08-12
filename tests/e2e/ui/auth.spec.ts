/**
 * Autenticação pela interface: login, guardas de rota e logout.
 *
 * Este é o único arquivo que exercita o formulário de login de ponta a ponta —
 * os demais entram autenticados via `ui/support/session.ts`.
 */
import { test, expect } from '../src/fixtures';
import { irPara, entrarComoAdmin, entrarComoCliente, tituloDaPagina } from './support/session';

/** Os campos de login vêm pré-preenchidos com credenciais de desenvolvimento. */
const preencherLogin = async (page: import('@playwright/test').Page, email: string, senha: string) => {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', senha);
};

test.describe('Login', () => {
  test('cliente entra e chega ao próprio dashboard', async ({ page, tenant }) => {
    const cliente = tenant.clientes[0]!;
    await irPara(page, '/login?type=client');

    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
    await preencherLogin(page, cliente.email, cliente.password);
    await page.getByRole('button', { name: 'Entrar na minha conta' }).click();

    await expect(page).toHaveURL(/#\/dashboard/);
    await expect(tituloDaPagina(page, /Olá,/)).toBeVisible();
  });

  test('estabelecimento entra e chega ao painel', async ({ page, tenant }) => {
    await irPara(page, '/login?type=business');

    await expect(page.getByRole('heading', { name: 'Painel do estabelecimento' })).toBeVisible();
    await preencherLogin(page, tenant.admin.email, tenant.admin.password);
    await page.getByRole('button', { name: 'Entrar no painel' }).click();

    await expect(page).toHaveURL(/#\/business\/dashboard/);
    await expect(tituloDaPagina(page, 'Dashboard Overview')).toBeVisible();
  });

  test('senha errada mostra alerta sem sair da tela', async ({ page, tenant }) => {
    await irPara(page, '/login?type=client');
    await preencherLogin(page, tenant.clientes[0]!.email, 'senha-errada-de-proposito');
    await page.getByRole('button', { name: 'Entrar na minha conta' }).click();

    await expect(page.locator('form')).toContainText(/inválid|incorret|não|erro/i);
    await expect(page).toHaveURL(/#\/login/);
  });

  test('cliente comum não entra pelo login de estabelecimento', async ({ page, tenant }) => {
    await irPara(page, '/login?type=business');
    await preencherLogin(page, tenant.clientes[0]!.email, tenant.clientes[0]!.password);
    await page.getByRole('button', { name: 'Entrar no painel' }).click();

    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator('form')).toContainText(/inválid|incorret|não|erro/i);
  });

  test('alterna entre os dois modos de acesso pelos links do rodapé', async ({ page }) => {
    await irPara(page, '/login?type=client');
    await page.getByRole('link', { name: 'Entrar como estabelecimento' }).click();
    await expect(page.getByRole('heading', { name: 'Painel do estabelecimento' })).toBeVisible();

    await page.getByRole('link', { name: 'Entrar como cliente' }).click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  });

  test('a senha fica oculta e o olho revela', async ({ page }) => {
    await irPara(page, '/login?type=client');
    const senha = page.locator('input[name="password"]');
    await expect(senha).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Mostrar senha' }).click();
    await expect(senha).toHaveAttribute('type', 'text');
  });
});

test.describe('Guardas de rota', () => {
  const rotasCliente = ['/dashboard', '/assinaturas', '/pagamentos', '/metodos-pagamento', '/bloqueios'];
  const rotasBusiness = ['/business/dashboard', '/business/clientes', '/business/planos'];

  for (const rota of rotasCliente) {
    test(`visitante em ${rota} é mandado para o login de cliente`, async ({ page }) => {
      await irPara(page, rota);
      await expect(page).toHaveURL(/#\/login\?type=client/);
    });
  }

  for (const rota of rotasBusiness) {
    test(`visitante em ${rota} é mandado para o login de estabelecimento`, async ({ page }) => {
      await irPara(page, rota);
      await expect(page).toHaveURL(/#\/login\?type=business/);
    });
  }

  test('cliente logado é devolvido ao próprio dashboard ao tentar o painel', async ({ page, tenant }) => {
    await entrarComoCliente(page, tenant.clientes[0]!);
    await irPara(page, '/business/dashboard');
    await expect(page).toHaveURL(/#\/dashboard/);
  });

  test('rota business desconhecida cai no dashboard do painel', async ({ page, tenant }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/rota-que-nao-existe');
    await expect(page).toHaveURL(/#\/business\/dashboard/);
  });
});

test.describe('Logout', () => {
  test('encerra a sessão e limpa os tokens do navegador', async ({ page, tenant }) => {
    await entrarComoCliente(page, tenant.clientes[0]!);
    await irPara(page, '/configuracoes');
    await expect(tituloDaPagina(page, 'Configurações')).toBeVisible();

    // "Sair da conta" vive dentro do menu da conta (ShellUserMenu).
    await page.getByRole('button', { name: 'Menu da conta' }).first().click();
    await page.getByRole('button', { name: 'Sair da conta' }).click();

    // Destino é a landing: `handleLogout` chama `navigate('/')` logo após
    // `sessionService.logout()`, que já tinha apontado o hash para `#/login`.
    // O último vence — o redirecionamento interno do service é código morto
    // neste caminho (FE-001 em docs/relatorio_erros_backend.md).
    await expect(page).toHaveURL(/#\/$/);

    const sessao = await page.evaluate(() => ({
      token: localStorage.getItem('pagweb_token'),
      admin: localStorage.getItem('pagweb_token_admin'),
      client: localStorage.getItem('pagweb_token_client'),
      creds: sessionStorage.getItem('pagweb_creds'),
    }));
    expect(sessao.token).toBeNull();
    expect(sessao.admin).toBeNull();
    expect(sessao.client).toBeNull();
    expect(sessao.creds).toBeNull();
  });

  test('depois do logout as rotas protegidas voltam a exigir login', async ({ page, tenant }) => {
    await entrarComoCliente(page, tenant.clientes[0]!);
    await irPara(page, '/configuracoes');
    await page.getByRole('button', { name: 'Menu da conta' }).first().click();
    await page.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(page).toHaveURL(/#\/$/);

    // `addInitScript` reinjetaria a sessão a cada navegação; limpar garante que
    // o teste mede o efeito do logout, não a semeadura do helper.
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/#/dashboard');
    await expect(page).toHaveURL(/#\/login\?type=client/);
  });
});
