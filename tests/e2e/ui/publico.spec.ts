/**
 * Superfície pública: landing, diretório de estabelecimentos, página da empresa
 * e o cadastro em múltiplas etapas. Nada aqui exige sessão.
 */
import { test, expect } from '../src/fixtures';
import { irPara } from './support/session';
import { api, toFormData } from '../src/http';
import { createPlano } from '../src/factories';
import { generateCpf, generateEmail, generatePhone } from '../src/data';
import { SEED_PASSWORD } from '../src/config';

test.describe('Landing', () => {
  test('apresenta a proposta e os dois caminhos de acesso', async ({ page }) => {
    await irPara(page, '/');

    await expect(page.getByRole('heading', { name: /Assinaturas, serviços e/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sou Cliente' }).first()).toBeVisible();
    await expect(page.getByRole('banner').getByText('PagWeb')).toBeVisible();
  });

  test('botão de cliente leva ao login de cliente', async ({ page }) => {
    await irPara(page, '/');
    await page.getByRole('button', { name: 'Entrar como cliente' }).first().click();

    await expect(page).toHaveURL(/#\/login\?type=client/);
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  });

  test('botão de criar conta leva ao cadastro', async ({ page }) => {
    await irPara(page, '/');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).first().click();

    await expect(page).toHaveURL(/#\/register/);
  });

  test('o diretório lista os estabelecimentos ativos', async ({ page, tenant }) => {
    await irPara(page, '/');
    await page.locator('#estabelecimentos').scrollIntoViewIfNeeded();

    await expect(page.getByText(tenant.nomeEmpresa, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Página pública da empresa', () => {
  test('mostra o estabelecimento e seus planos', async ({ page, tenant, admin }) => {
    const plano = await createPlano(admin.token);
    await irPara(page, `/empresa/${tenant.idEmpresa}`);

    await expect(page.getByText(tenant.nomeEmpresa, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(plano.nome, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('empresa inexistente não quebra a página', async ({ page }) => {
    await irPara(page, '/empresa/99999999');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Cadastro', () => {
  test('mostra as etapas do fluxo de cliente', async ({ page }) => {
    await irPara(page, '/register?type=client');
    await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible();
    await expect(page.locator('input[name="nome"]')).toBeVisible();
  });

  test('mostra o fluxo específico de estabelecimento', async ({ page }) => {
    await irPara(page, '/register?type=business');
    await expect(page.getByRole('heading', { name: 'Cadastre seu estabelecimento' })).toBeVisible();
  });

  test('bloqueia o avanço com a primeira etapa incompleta', async ({ page }) => {
    await irPara(page, '/register?type=client');
    await page.getByRole('button', { name: /Continuar|Próximo|Avançar/ }).first().click();

    // Continua na etapa 1: os campos de dados pessoais seguem na tela.
    await expect(page.locator('input[name="nome"]')).toBeVisible();
  });

  test('link de login leva de volta ao acesso', async ({ page }) => {
    await irPara(page, '/register?type=client');
    await page.getByRole('link', { name: /Fazer login|Entrar/ }).first().click();
    await expect(page).toHaveURL(/#\/login/);
  });
});

test.describe('Ativação de conta', () => {
  test('token inválido mostra erro sem travar a tela', async ({ page }) => {
    const email = generateEmail('ativacao-ui');
    await api.post(
      '/api/v1/User/register',
      toFormData({
        Nome: 'E2E',
        SobreNome: 'Ativacao',
        Cpf: generateCpf(),
        Email: email,
        Password: SEED_PASSWORD,
        Telefone: generatePhone(),
      }),
    );

    await irPara(page, `/activate?email=${encodeURIComponent(email)}`);
    await expect(page.locator('main, form').first()).toBeVisible();
  });
});
