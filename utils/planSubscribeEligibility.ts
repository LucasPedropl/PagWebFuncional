import { ClientSubscription, PlanResponse } from '../types';

export const SUBSCRIPTION_BLOCKING_STATUSES = new Set([
  'Ativo',
  'Ativa',
  'Pendente',
  'Suspenso',
  'Suspensa',
]);

export const allowsClientSelfSubscribe = (plan: PlanResponse) =>
  plan.assinarPorCliente !== false;

export const hasBlockingSubscription = (
  plan: PlanResponse,
  subscriptions: ClientSubscription[]
) =>
  subscriptions.some(
    (sub) =>
      SUBSCRIPTION_BLOCKING_STATUSES.has(String(sub.status)) &&
      (sub.idPlano === plan.idPlano || sub.nomePlano === plan.nome)
  );

/** Plano exige contato com a empresa em vez de autoassinatura. */
export const needsChatRequestForPlan = (
  plan: PlanResponse,
  subscriptions: ClientSubscription[]
) =>
  !allowsClientSelfSubscribe(plan) || hasBlockingSubscription(plan, subscriptions);
