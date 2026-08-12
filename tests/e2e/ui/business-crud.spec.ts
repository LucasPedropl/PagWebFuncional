/**
 * CRUD pela interface do painel: o que o admin cria na tela precisa aparecer na
 * API — e vice-versa. É aqui que UI e backend se encontram de verdade.
 */
import { test, expect } from '../src/fixtures';
import { entrarComoAdmin, irPara, tituloDaPagina } from './support/session';
import { api } from '../src/http';
import { createCategoria, createPlano, createProduto } from '../src/factories';
import { label } from '../src/data';

test.describe('Categorias', () => {
  test('cria categoria pela tela e ela chega na API', async ({ page, tenant, admin }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/categorias');
    await expect(tituloDaPagina(page, 'Categorias')).toBeVisible();

    const nome = label('Categoria-UI');
    await page.getByRole('button', { name: 'Nova categoria' }).click();
    await page.getByPlaceholder('Ex: Beleza, Consultoria, Alimentação...').fill(nome);
    await page.getByPlaceholder('Descreva brevemente o propósito desta categoria...').fill('Criada via UI');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText(nome, { exact: false }).first()).toBeVisible({ timeout: 15_000 });

    const naApi = await api.get<Array<{ nome: string }>>('/api/Categorias/empresa-categorias-privado/', {
      token: admin.token,
    });
    expect(naApi.body.some((c) => c.nome === nome)).toBeTruthy();
  });

  test('categoria criada na API aparece na listagem da tela', async ({ page, tenant, admin }) => {
    const categoria = await createCategoria(admin.token);

    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/categorias');

    await expect(page.getByText(categoria.nome, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('cancelar o formulário não cria nada', async ({ page, tenant, admin }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/categorias');

    const nome = label('Categoria-cancelada');
    await page.getByRole('button', { name: 'Nova categoria' }).click();
    await page.getByPlaceholder('Ex: Beleza, Consultoria, Alimentação...').fill(nome);
    await page.getByRole('button', { name: 'Cancelar' }).click();

    const naApi = await api.get<Array<{ nome: string }>>('/api/Categorias/empresa-categorias-privado/', {
      token: admin.token,
    });
    expect(naApi.body.some((c) => c.nome === nome)).toBeFalsy();
  });
});

test.describe('Planos', () => {
  test('plano criado na API aparece no catálogo da tela', async ({ page, tenant, admin }) => {
    const plano = await createPlano(admin.token, { ValorMensalidade: 123.45 });

    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/planos');
    await expect(tituloDaPagina(page, 'Catálogo de Planos')).toBeVisible();

    await expect(page.getByText(plano.nome, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('abre o formulário de novo plano', async ({ page, tenant }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/planos');

    await page.getByRole('button', { name: 'Novo Plano' }).first().click();
    await expect(page.getByText('Nome do Plano')).toBeVisible();
    await expect(page.getByText('Preço Mensal (R$)')).toBeVisible();
  });

  test('abre os detalhes de um plano existente', async ({ page, tenant, admin }) => {
    const plano = await createPlano(admin.token);

    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/planos');
    await page.getByText(plano.nome, { exact: false }).first().click();

    await expect(page.getByText('Detalhes do Plano')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Produtos e clientes', () => {
  test('produto criado na API aparece na tela', async ({ page, tenant, admin }) => {
    // `useProdutos` monta a lista a partir das categorias da empresa — produto
    // sem categoria nunca é exibido, então o vínculo é parte da pré-condição.
    const categoria = await createCategoria(admin.token);
    const produto = await createProduto(admin.token, [categoria.id]);

    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/produtos');
    await expect(tituloDaPagina(page, 'Produtos')).toBeVisible();

    await expect(page.getByText(produto.nome, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('produto sem categoria não entra na listagem da tela', async ({ page, tenant, admin }) => {
    const orfao = await createProduto(admin.token, []);

    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/produtos');
    await expect(tituloDaPagina(page, 'Produtos')).toBeVisible();

    await expect(page.getByText(orfao.nome, { exact: false })).toHaveCount(0);
  });

  test('a carteira de clientes mostra os clientes conectados', async ({ page, tenant }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/clientes');
    await expect(tituloDaPagina(page, 'Gestão de Clientes')).toBeVisible();

    await expect(page.getByText(tenant.clientes[0]!.email, { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('a busca da carteira filtra pelo termo digitado', async ({ page, tenant }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/clientes');
    await expect(page.getByText(tenant.clientes[0]!.email, { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByPlaceholder(/buscar|pesquis/i).first().fill(tenant.clientes[0]!.email);
    await expect(page.getByText(tenant.clientes[1]!.email, { exact: false })).toHaveCount(0);
  });
});

test.describe('Assinaturas no painel', () => {
  test('a tela lista as assinaturas da empresa', async ({ page, tenant }) => {
    await entrarComoAdmin(page, tenant.admin);
    await irPara(page, '/business/assinaturas');

    await expect(tituloDaPagina(page, 'Assinaturas')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });
});
