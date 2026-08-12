/**
 * Fixtures compartilhadas.
 *
 * Tokens são resolvidos por worker (`scope: 'worker'`) para não gastar um
 * `/login-*` por teste — o JWT do backend dura horas, então reaproveitar é seguro.
 */
import { test as base } from '@playwright/test';
import { loginAdmin, loginCliente, loginMaster, type AuthResult } from './auth';
import { readState, type E2EState, type SeededTenant, type SeededUser } from './state';

export interface WorkerAuth {
  /** Estado semeado no globalSetup (tenants, usuários, empresas). */
  world: E2EState;
  /** Tenant principal — onde a maior parte dos fluxos roda. */
  tenant: SeededTenant;
  /** Tenant rival — usado para provar isolamento entre empresas. */
  rival: SeededTenant;
  /** Token role=Admin do tenant principal. */
  admin: AuthResult;
  /** Token role=Cliente do primeiro cliente do tenant principal. */
  cliente: AuthResult;
  /** Token role=Cliente do segundo cliente do tenant principal. */
  cliente2: AuthResult;
  /** Token role=Admin do tenant rival. */
  rivalAdmin: AuthResult;
  /** Token role=Cliente do cliente do tenant rival. */
  rivalCliente: AuthResult;
  /** Token role=Master (conta BixS). */
  master: AuthResult;
}

const pick = (users: SeededUser[], index: number): SeededUser => {
  const user = users[index];
  if (!user) throw new Error(`Cliente semeado #${index} não existe. Rode o globalSetup novamente.`);
  return user;
};

/** Sem fixtures por teste — tudo aqui é worker-scoped. */
type SemFixturesDeTeste = Record<never, never>;

export const test = base.extend<SemFixturesDeTeste, WorkerAuth>({
  world: [
    async ({}, use) => {
      await use(readState());
    },
    { scope: 'worker' },
  ],

  tenant: [
    async ({ world }, use) => {
      await use(world.primary);
    },
    { scope: 'worker' },
  ],

  rival: [
    async ({ world }, use) => {
      await use(world.secondary);
    },
    { scope: 'worker' },
  ],

  admin: [
    async ({ tenant }, use) => {
      await use(await loginAdmin(tenant.admin.email, tenant.admin.password));
    },
    { scope: 'worker' },
  ],

  cliente: [
    async ({ tenant }, use) => {
      const user = pick(tenant.clientes, 0);
      await use(await loginCliente(user.email, user.password));
    },
    { scope: 'worker' },
  ],

  cliente2: [
    async ({ tenant }, use) => {
      const user = pick(tenant.clientes, 1);
      await use(await loginCliente(user.email, user.password));
    },
    { scope: 'worker' },
  ],

  rivalAdmin: [
    async ({ rival }, use) => {
      await use(await loginAdmin(rival.admin.email, rival.admin.password));
    },
    { scope: 'worker' },
  ],

  rivalCliente: [
    async ({ rival }, use) => {
      const user = pick(rival.clientes, 0);
      await use(await loginCliente(user.email, user.password));
    },
    { scope: 'worker' },
  ],

  master: [
    async ({}, use) => {
      await use(await loginMaster());
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
