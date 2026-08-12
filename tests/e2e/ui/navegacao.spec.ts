/**
 * Varredura de navegação: toda rota autenticada monta, exibe o próprio título e
 * não deixa erro de runtime no console.
 *
 * É a rede de segurança mais barata contra regressão de import/render — uma tela
 * que quebra no boot aparece aqui antes de qualquer teste funcional.
 */
import { test, expect } from '../src/fixtures';
import { entrarComoAdmin, entrarComoCliente, irPara, tituloDaPagina } from './support/session';

/** Erros de console que não indicam defeito da aplicação. */
const RUIDO_ESPERADO = [
  /favicon/i,
  /Failed to load resource/i,
  /net::ERR_/i,
  /ResizeObserver/i,
  /Download the React DevTools/i,
];

const coletarErros = (page: import('@playwright/test').Page): string[] => {
  const erros: string[] = [];
  page.on('pageerror', (error) => erros.push(`pageerror: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const texto = msg.text();
    if (RUIDO_ESPERADO.some((padrao) => padrao.test(texto))) return;
    erros.push(`console: ${texto}`);
  });
  return erros;
};

const rotasBusiness: Array<[string, string | RegExp]> = [
  ['/business/dashboard', 'Dashboard Overview'],
  ['/business/clientes', 'Gestão de Clientes'],
  ['/business/planos', 'Catálogo de Planos'],
  ['/business/categorias', 'Categorias'],
  ['/business/produtos', 'Produtos'],
  ['/business/servicos', 'Catálogo de Serviços'],
  ['/business/assinaturas', 'Assinaturas'],
  ['/business/pagamentos', 'Gestão de Cobranças'],
  ['/business/relatorios', 'Relatórios de Performance'],
  ['/business/configuracoes', 'Configurações'],
];

const rotasCliente: Array<[string, string | RegExp]> = [
  ['/dashboard', /Olá,/],
  ['/empresas', 'Estabelecimentos'],
  ['/assinaturas', 'Minhas Assinaturas'],
  ['/pagamentos', 'Minhas Faturas'],
  ['/metodos-pagamento', 'Métodos de Pagamento'],
  ['/bloqueios', 'Bloqueios'],
  ['/relatorios', 'Meus Relatórios Financeiros'],
  ['/configuracoes', 'Configurações'],
];

test.describe('Painel do estabelecimento', () => {
  for (const [rota, titulo] of rotasBusiness) {
    test(`${rota} monta sem erro de runtime`, async ({ page, tenant }) => {
      const erros = coletarErros(page);
      await entrarComoAdmin(page, tenant.admin);
      await irPara(page, rota);

      await expect(tituloDaPagina(page, titulo)).toBeVisible();
      expect(erros, `Erros de console em ${rota}`).toEqual([]);
    });
  }

  test('rotas sem título fixo ainda renderizam conteúdo', async ({ page, tenant }) => {
    await entrarComoAdmin(page, tenant.admin);
    for (const rota of ['/business/chat', '/business/pagamento-unico', '/business/menu']) {
      await irPara(page, rota);
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('a navegação lateral leva às telas principais', async ({ page, tenant }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/dashboard');

    await page.getByRole('link', { name: 'Clientes', exact: true }).first().click();
    await expect(page).toHaveURL(/#\/business\/clientes/);
    await expect(tituloDaPagina(page, 'Gestão de Clientes')).toBeVisible();

    await page.getByRole('link', { name: 'Planos', exact: true }).first().click();
    await expect(page).toHaveURL(/#\/business\/planos/);
    await expect(tituloDaPagina(page, 'Catálogo de Planos')).toBeVisible();
  });
});

test.describe('Área do cliente', () => {
  for (const [rota, titulo] of rotasCliente) {
    test(`${rota} monta sem erro de runtime`, async ({ page, tenant }) => {
      const erros = coletarErros(page);
      await entrarComoCliente(page, tenant.clientes[0]!);
      await irPara(page, rota);

      await expect(tituloDaPagina(page, titulo)).toBeVisible();
      expect(erros, `Erros de console em ${rota}`).toEqual([]);
    });
  }

  test('rotas sem título fixo ainda renderizam conteúdo', async ({ page, tenant }) => {
    await entrarComoCliente(page, tenant.clientes[0]!);
    for (const rota of ['/chat', '/explorar', '/pagamento-unico', '/feedback', '/menu']) {
      await irPara(page, rota);
      await expect(page.getByRole('main')).toBeVisible();
    }
  });

  test('rotas legadas redirecionam para o destino atual', async ({ page, tenant }) => {
    await entrarComoCliente(page, tenant.clientes[0]!);

    await irPara(page, '/meus-agendamentos');
    await expect(page).toHaveURL(/#\/dashboard/);

    await irPara(page, '/historico-servicos');
    await expect(page).toHaveURL(/#\/pagamento-unico/);
  });
});
