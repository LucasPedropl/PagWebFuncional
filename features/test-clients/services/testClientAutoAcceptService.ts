import { apiV1Url } from '../../../utils/apiOrigin';
import { ASSINATURA_STATUS, toAssinaturaStatusCode } from '../../../utils/api';
import { parseApiError } from '../../../utils/formatters';
import { sessionService } from '../../../services/session';
import {
  isTestClientEmail,
  TEST_CLIENT_DEFAULT_PASSWORD,
} from '../utils/testClientGenerators';
import { buildDummySignedContractPdfFile } from '../utils/buildDummySignedContractPdf';

export interface AutoAcceptForClientResult {
  email: string;
  accepted: number;
  skipped: boolean;
  error?: string;
}

export interface AutoAcceptBatchResult {
  targetsFound: number;
  clientsTouched: number;
  acceptedTotal: number;
  results: AutoAcceptForClientResult[];
}

type ClientMatchSource = {
  idUser?: number;
  nome?: string;
  sobreNome?: string;
  email?: string | null;
};

type SubscriptionMatchSource = {
  idAssinatura: number;
  nomeCliente?: string;
  status?: string | number;
  idUser?: number;
};

const clientDisplayName = (client: ClientMatchSource): string =>
  `${client.nome ?? ''} ${client.sobreNome ?? ''}`.trim().toLowerCase();

const activateSubscriptionAsClient = async (
  clientToken: string,
  idAssinatura: number,
  contrato: File,
): Promise<void> => {
  const formData = new FormData();
  formData.append('Contrato', contrato, contrato.name);

  const response = await fetch(
    `${apiV1Url()}/User/minha-assinatura/${idAssinatura}/${ASSINATURA_STATUS.Ativo}`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${clientToken}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const msg = await parseApiError(response);
    throw new Error(msg || `Falha ao aceitar assinatura #${idAssinatura}.`);
  }
};

/**
 * Aceita assinaturas Pendente específicas (ids conhecidos) com login efêmero.
 * Não lista/varre outras assinaturas do cliente.
 */
export const autoAcceptSpecificSubscriptionsForTestClient = async (
  email: string,
  idAssinaturas: number[],
): Promise<AutoAcceptForClientResult> => {
  if (!isTestClientEmail(email)) {
    return { email, accepted: 0, skipped: true };
  }

  const uniqueIds = [...new Set(idAssinaturas.filter((id) => id > 0))];
  if (uniqueIds.length === 0) {
    return { email, accepted: 0, skipped: false };
  }

  try {
    const auth = await sessionService.fetchClientToken(email, TEST_CLIENT_DEFAULT_PASSWORD);
    const contrato = await buildDummySignedContractPdfFile(email);
    let accepted = 0;

    for (const idAssinatura of uniqueIds) {
      await activateSubscriptionAsClient(auth.token, idAssinatura, contrato);
      accepted += 1;
    }

    return { email, accepted, skipped: false };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha no auto-aceite';
    return { email, accepted: 0, skipped: false, error: message };
  }
};

/**
 * Após criar assinatura para um cliente de teste: aceita só as Pendente
 * desse e-mail (1 login; lista só as dele).
 */
export const autoAcceptPendingSubscriptionsForTestClient = async (
  email: string,
): Promise<AutoAcceptForClientResult> => {
  if (!isTestClientEmail(email)) {
    return { email, accepted: 0, skipped: true };
  }

  try {
    const auth = await sessionService.fetchClientToken(email, TEST_CLIENT_DEFAULT_PASSWORD);
    const response = await fetch(`${apiV1Url()}/User/minhas-assinaturas`, {
      method: 'GET',
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${auth.token}`,
      },
    });

    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || 'Falha ao listar assinaturas do cliente de teste.');
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : [];
    const pendingIds = list
      .map((sub: { idAssinatura?: number; IdAssinatura?: number; status?: string | number; Status?: string | number }) => ({
        id: Number(sub.idAssinatura ?? sub.IdAssinatura ?? 0),
        status: toAssinaturaStatusCode(sub.status ?? sub.Status ?? ASSINATURA_STATUS.Pendente),
      }))
      .filter((sub) => sub.id > 0 && sub.status === ASSINATURA_STATUS.Pendente)
      .map((sub) => sub.id);

    if (pendingIds.length === 0) {
      return { email, accepted: 0, skipped: false };
    }

    const contrato = await buildDummySignedContractPdfFile(email);
    let accepted = 0;
    for (const idAssinatura of pendingIds) {
      await activateSubscriptionAsClient(auth.token, idAssinatura, contrato);
      accepted += 1;
    }

    return { email, accepted, skipped: false };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha no auto-aceite';
    return { email, accepted: 0, skipped: false, error: message };
  }
};

/**
 * Usa a lista de assinaturas do painel: só Pendente cruzada com clientes
 * @pagweb-teste.local. Login apenas nesses clientes, nos ids encontrados.
 */
export const autoAcceptPendingSubscriptionsFromBusinessList = async (
  subscriptions: SubscriptionMatchSource[],
  clients: ClientMatchSource[],
): Promise<AutoAcceptBatchResult> => {
  const testClients = clients.filter((client) => isTestClientEmail(client.email));
  const testByUserId = new Map<number, ClientMatchSource>();
  const testByName = new Map<string, ClientMatchSource>();

  for (const client of testClients) {
    if (client.idUser != null) {
      testByUserId.set(Number(client.idUser), client);
    }
    const name = clientDisplayName(client);
    if (name) {
      testByName.set(name, client);
    }
  }

  const pendingByEmail = new Map<string, number[]>();

  for (const sub of subscriptions) {
    const status = toAssinaturaStatusCode(sub.status ?? ASSINATURA_STATUS.Pendente);
    if (status !== ASSINATURA_STATUS.Pendente || !sub.idAssinatura) {
      continue;
    }

    const matched =
      (sub.idUser != null ? testByUserId.get(Number(sub.idUser)) : undefined) ??
      testByName.get((sub.nomeCliente ?? '').trim().toLowerCase());

    const email = matched?.email;
    if (!email || !isTestClientEmail(email)) {
      continue;
    }

    const current = pendingByEmail.get(email) ?? [];
    current.push(sub.idAssinatura);
    pendingByEmail.set(email, current);
  }

  const results: AutoAcceptForClientResult[] = [];
  let acceptedTotal = 0;
  let targetsFound = 0;

  for (const [email, ids] of pendingByEmail) {
    targetsFound += ids.length;
    const result = await autoAcceptSpecificSubscriptionsForTestClient(email, ids);
    results.push(result);
    acceptedTotal += result.accepted;
  }

  return {
    targetsFound,
    clientsTouched: pendingByEmail.size,
    acceptedTotal,
    results,
  };
};
