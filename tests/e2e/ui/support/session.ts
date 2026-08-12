/**
 * Injeção de sessão no browser.
 *
 * A maior parte dos testes de UI não quer reexercitar o formulário de login a
 * cada spec — só quer chegar autenticado na tela sob teste. Este helper escreve
 * exatamente as chaves que `services/session.ts` lê, antes de qualquer script da
 * página rodar (`addInitScript`).
 *
 * O fluxo de login pela interface é coberto de propósito em `auth.spec.ts`.
 */
import type { Page } from '@playwright/test';
import { loginAdmin, loginCliente } from '../../src/auth';
import type { SeededUser } from '../../src/state';

interface SessionSeed {
  token: string;
  tokenAdmin?: string;
  tokenClient?: string;
  activeMode: 'admin' | 'client';
  activeView: 'business' | 'client';
  empresaOwner: boolean;
  user: { nome: string; email: string; tipo: 'Empresa' | 'Cliente' };
  credentials: { email: string; password: string; type: 'admin' | 'client' };
}

const injetar = async (page: Page, seed: SessionSeed): Promise<void> => {
  await page.addInitScript((data: SessionSeed) => {
    localStorage.setItem('pagweb_token', data.token);
    localStorage.setItem('pagweb_user', JSON.stringify(data.user));
    localStorage.setItem('pagweb_active_token_mode', data.activeMode);
    localStorage.setItem('pagweb_active_view', data.activeView);
    if (data.tokenAdmin) localStorage.setItem('pagweb_token_admin', data.tokenAdmin);
    if (data.tokenClient) localStorage.setItem('pagweb_token_client', data.tokenClient);
    if (data.empresaOwner) localStorage.setItem('pagweb_empresa_owner', '1');
    sessionStorage.setItem('pagweb_creds', JSON.stringify(data.credentials));
  }, seed);
};

/** Deixa a página autenticada como Admin (dono de estabelecimento). */
export const entrarComoAdmin = async (page: Page, user: SeededUser): Promise<void> => {
  const auth = await loginAdmin(user.email, user.password);
  await injetar(page, {
    token: auth.token,
    tokenAdmin: auth.token,
    activeMode: 'admin',
    activeView: 'business',
    empresaOwner: true,
    user: { nome: auth.nome, email: auth.email, tipo: 'Empresa' },
    credentials: { email: user.email, password: user.password, type: 'admin' },
  });
};

/** Deixa a página autenticada como Cliente final. */
export const entrarComoCliente = async (page: Page, user: SeededUser): Promise<void> => {
  const auth = await loginCliente(user.email, user.password);
  await injetar(page, {
    token: auth.token,
    tokenClient: auth.token,
    activeMode: 'client',
    activeView: 'client',
    empresaOwner: false,
    user: { nome: auth.nome, email: auth.email, tipo: 'Cliente' },
    credentials: { email: user.email, password: user.password, type: 'client' },
  });
};

/**
 * Sessão de identidade dupla: o mesmo usuário é dono de empresa **e** cliente.
 * Ambos os tokens ficam em cache para o `switchToMode` alternar sem novo login.
 */
export const entrarComIdentidadeDupla = async (
  page: Page,
  user: SeededUser,
  viewInicial: 'business' | 'client' = 'business',
): Promise<void> => {
  const [admin, cliente] = await Promise.all([
    loginAdmin(user.email, user.password),
    loginCliente(user.email, user.password),
  ]);

  await injetar(page, {
    token: viewInicial === 'business' ? admin.token : cliente.token,
    tokenAdmin: admin.token,
    tokenClient: cliente.token,
    activeMode: viewInicial === 'business' ? 'admin' : 'client',
    activeView: viewInicial,
    empresaOwner: true,
    user: { nome: admin.nome, email: admin.email, tipo: 'Empresa' },
    credentials: {
      email: user.email,
      password: user.password,
      type: viewInicial === 'business' ? 'admin' : 'client',
    },
  });
};

/** Navega para uma rota do HashRouter e espera o app montar. */
export const irPara = async (page: Page, rota: string): Promise<void> => {
  await page.goto(`/#${rota}`);
  await page.waitForLoadState('domcontentloaded');
};

/**
 * Título da página, restrito ao `<main>`.
 *
 * Os layouts repetem o mesmo texto no cabeçalho fixo, então um `getByRole` solto
 * casa dois elementos e o modo estrito do Playwright falha.
 */
export const tituloDaPagina = (page: Page, nome: string | RegExp) =>
  page.getByRole('main').getByRole('heading', { name: nome });
