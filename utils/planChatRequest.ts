export type PlanChatRequestReason =
  | 'company_only'
  | 'already_subscribed'
  | 'interest'
  | 'questions';

export interface PlanChatRequestParams {
  idEmpresa: number;
  establishmentName: string;
  idPlano: number;
  planName: string;
  price: number;
  reason: PlanChatRequestReason;
}

export const buildPlanChatRequestMessage = (
  planName: string,
  reason: PlanChatRequestReason,
  establishmentName?: string
): string => {
  const empresa = establishmentName ? ` com ${establishmentName}` : '';

  switch (reason) {
    case 'company_only':
      return `Olá! Gostaria de solicitar a assinatura do plano "${planName}"${empresa}. Este plano é contratado pelo estabelecimento — poderia me orientar sobre os próximos passos?`;
    case 'already_subscribed':
      return `Olá! Já tenho vínculo com o plano "${planName}"${empresa} e gostaria de conversar sobre minha assinatura ou uma nova contratação.`;
    case 'questions':
      return `Olá! Tenho uma dúvida sobre o plano "${planName}"${empresa}.`;
    case 'interest':
    default:
      return `Olá! Tenho interesse em assinar o plano "${planName}"${empresa}.`;
  }
};

export const getPlanChatRequestExplanation = (
  reason: PlanChatRequestReason
): { title: string; paragraphs: string[] } => {
  switch (reason) {
    case 'company_only':
      return {
        title: 'Assinatura pelo estabelecimento',
        paragraphs: [
          'Este plano não pode ser contratado diretamente por você no aplicativo. O estabelecimento precisa criar ou liberar a assinatura no sistema.',
          'Ao continuar, abriremos o chat com a empresa e enviaremos automaticamente a mensagem abaixo para iniciar o pedido.',
        ],
      };
    case 'already_subscribed':
      return {
        title: 'Você já possui este plano',
        paragraphs: [
          'Identificamos que você já tem este plano ativo, pendente ou suspenso neste estabelecimento. Por isso, não é possível assinar novamente por conta própria.',
          'Se precisar de alteração, renovação ou um novo vínculo, converse com a empresa pelo chat. A mensagem abaixo será enviada automaticamente.',
        ],
      };
    case 'questions':
      return {
        title: 'Tirar dúvidas no chat',
        paragraphs: [
          'Você será direcionado ao chat com o estabelecimento. A mensagem abaixo será enviada automaticamente para facilitar o atendimento.',
        ],
      };
    case 'interest':
    default:
      return {
        title: 'Interesse no plano',
        paragraphs: [
          'Ao continuar, abriremos o chat com a empresa e enviaremos a mensagem abaixo automaticamente.',
        ],
      };
  }
};

export const buildPlanChatNavigateUrl = (params: PlanChatRequestParams): string => {
  const query = new URLSearchParams({
    companyId: String(params.idEmpresa),
    companyName: params.establishmentName,
    planId: String(params.idPlano),
    planName: params.planName,
    price: String(params.price),
    reason: params.reason,
  });
  return `/chat?${query.toString()}`;
};
