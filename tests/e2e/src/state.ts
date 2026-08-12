/**
 * Estado semeado no `globalSetup` e compartilhado entre os workers do Playwright.
 *
 * Playwright roda cada spec em um processo separado, então o estado vai para
 * disco (`.e2e-state.json`) em vez de viver em memória.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { STATE_FILE } from './config';

export interface SeededUser {
  idUser: number;
  nome: string;
  sobreNome: string;
  email: string;
  password: string;
  cpf: string;
  telefone: string;
}

export interface SeededTenant {
  /** Usuário dono da empresa — autentica em `/login-admin` (role Admin). */
  admin: SeededUser;
  idEmpresa: number;
  nomeEmpresa: string;
  cnpj: string;
  /** Clientes já conectados a esta empresa (`UserEmpresa` com status Ativo). */
  clientes: SeededUser[];
}

export interface E2EState {
  createdAt: string;
  apiBaseUrl: string;
  /** Empresa pré-existente usada como âncora do primeiro registro ativo. */
  bootstrapEmpresaId: number;
  /** Tenant principal: onde a maior parte dos fluxos acontece. */
  primary: SeededTenant;
  /** Tenant secundário: existe para provar isolamento entre empresas. */
  secondary: SeededTenant;
}

export const writeState = (state: E2EState): void => {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
};

export const readState = (): E2EState => {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as E2EState;
  } catch (error) {
    throw new Error(
      `Estado E2E não encontrado em ${STATE_FILE}. Rode via "npx playwright test" (o globalSetup semeia o ambiente). Causa: ${String(error)}`,
    );
  }
};
