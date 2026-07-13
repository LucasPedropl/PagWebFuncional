import { ActivatePayload, AppNotification, AuthResponse, ClientConnection, ClientInvoice, ClientSubscription, LoginPayload, NotificationSettings, RegisterPayload, SavedCard, UserAccountResponse, UserUpdatePayload, AssinarPlanoPayload, PlanResponse } from "../types";
import { sessionService } from "./session";
import { parseApiError } from "../utils/formatters";
import {
  ASSINATURA_STATUS,
  getPlanTipoContrato,
  requiresSignedContractType,
  resolveContractPath,
  toAssinaturaStatusCode,
} from "../utils/api";

const BASE_URL = "https://lojas.vlks.com.br/api/v1";

const isEmpresaDualAccount = (): boolean =>
  sessionService.isEmpresaOwner() || sessionService.getSession().user?.tipo === "Empresa";

// Helper privado para requisições autenticadas com renovação automática
const authRequest = async (endpoint: string, options: RequestInit = {}, isRetry = false): Promise<Response> => {
  let token = sessionService.getSession().token;

  if (isEmpresaDualAccount()) {
    const cachedClient = sessionService.getCachedToken("client");
    if (cachedClient) {
      token = cachedClient;
    } else if (!isRetry) {
      await sessionService.switchToMode("client");
      token = sessionService.getSession().token;
    }
  }

  if (!token && !isRetry) {
    sessionService.logout();
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : (endpoint.startsWith('/api/') ? `https://lojas.vlks.com.br${endpoint}` : `${BASE_URL}${endpoint}`);

  const isFormData = options.body instanceof FormData || 
                     (options.body && typeof options.body === 'object' && typeof (options.body as any).append === 'function');
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    "accept": "*/*",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
    if (isFormData) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Se o token expirou (401), tentamos renovar usando as credenciais salvas
  if (response.status === 401 && !isRetry) {
    const creds = sessionService.getCredentials();
    if (creds) {
      try {
        await sessionService.switchToMode("client");
        const refreshed = await sessionService.fetchClientToken(creds.email, creds.password);
        sessionService.applyAuthResponse(refreshed, "client");
        sessionService.saveCredentials(creds.email, creds.password, "client");
        // Tenta a requisição original novamente
        return authRequest(endpoint, options, true);
      } catch (err) {
        console.error("Erro na renovação automática de token:", err);
        sessionService.logout();
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
    }
    sessionService.logout();
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  if (response.status === 403 && !isRetry && isEmpresaDualAccount()) {
    try {
      await sessionService.switchToMode("client");
      return authRequest(endpoint, options, true);
    } catch (err) {
      console.error("Erro ao obter token de cliente:", err);
    }
  }

  return response;
};

export const userService = {
  async register(data: RegisterPayload, companyId?: number): Promise<void> {
    const url = companyId 
      ? `${BASE_URL}/User/register?idEmpresa=${companyId}` 
      : `${BASE_URL}/User/register`;

    const formData = new FormData();
    formData.append('Nome', data.nome);
    formData.append('SobreNome', data.sobreNome);
    formData.append('Cpf', data.cpf);
    formData.append('Email', data.email);
    formData.append('Password', data.password);
    formData.append('Telefone', data.telefone);
    if (data.fotoPerfil instanceof File) {
      formData.append('FotoPerfil', data.fotoPerfil);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "*/*"
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao registrar usuário");
    }
  },

  async activate(data: ActivatePayload): Promise<void> {
    const response = await fetch(`${BASE_URL}/User/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*"
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao ativar conta");
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const payload = {
      email,
      password,
      mac: "",
    };

    const response = await fetch(`${BASE_URL}/User/login-cliente`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*"
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao realizar login");
    }

    const data = await response.json();

    if (data.user) {
      if (sessionService.isEmpresaOwner()) {
        data.user.tipo = "Empresa";
      } else if (!data.user.tipo) {
        data.user.tipo = "Cliente";
      }
    }

    sessionService.applyAuthResponse(data, "client");
    sessionService.saveCredentials(email, password, "client");
    sessionService.prefetchAlternateToken("client");
    return data;
  },

  async getMyAccount(): Promise<UserAccountResponse> {
    const response = await authRequest('/User/minha-conta', {
      method: "GET"
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao obter dados da conta");
    }

    return await response.json();
  },

  async updateAccount(id: number, data: UserUpdatePayload): Promise<void> {
    const formData = new FormData();
    if (data.nome) formData.append('Nome', data.nome);
    if (data.sobreNome) formData.append('SobreNome', data.sobreNome);
    if (data.email) formData.append('Email', data.email);
    if (data.password) formData.append('Password', data.password);
    if (data.telefone) formData.append('Telefone', data.telefone);
    
    if (data.fotoPerfil instanceof File) {
      formData.append('FotoPerfil', data.fotoPerfil);
    }

    const response = await authRequest(`/User/${id}`, {
      method: "PATCH",
      body: formData
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao atualizar conta");
    }
  },

  async linkToCompany(companyId: number): Promise<void> {
    const response = await authRequest(`/User/conectar-empresa/${companyId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const msg = await parseApiError(response);
      const alreadyLinked = /j[aá]\s*existe|already/i.test(msg);
      if (!alreadyLinked) {
        throw new Error(msg || 'Falha ao conectar com o estabelecimento.');
      }
    }
  },

  async ensureCompanyConnection(idEmpresa: number): Promise<void> {
    const connections = await this.listConnections();
    const hasActiveConnection = connections.some(
      (connection) =>
        connection.idEmpresa === idEmpresa &&
        String(connection.status).toLowerCase() === 'ativo'
    );

    if (!hasActiveConnection) {
      await this.linkToCompany(idEmpresa);
    }
  },

  // --- NOTIFICAÇÕES (Compartilhado entre User e Business) ---
  async listNotifications(): Promise<AppNotification[]> {
    const response = await authRequest('/Notificacao/pegar', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async markNotificationAsSeen(id: number): Promise<void> {
    const response = await authRequest(`/Notificacao/${id}/visto`, { method: 'PATCH' });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao marcar notificação como vista.");
    }
  },

  async deleteNotification(id: number): Promise<void> {
    const response = await authRequest(`/Notificacao/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao deletar notificação.");
    }
  },

  async clearAllNotifications(): Promise<void> {
    const response = await authRequest('/Notificacao/limpar-todas', { method: 'DELETE' });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao limpar notificações.");
    }
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await authRequest('/Notificacao/configuracoes/pesquisar', { method: 'GET' });
    if (!response.ok) {
        // Se der 404 ou erro, retorna padrão tudo true (conforme solicitado para implementar mesmo com erro)
        if (response.status === 404) {
            return {
                notificacoes: true,
                email: true,
                whatsApp: true,
                sms: true
            };
        }
        return {
            notificacoes: true,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
    try {
        return await response.json();
    } catch {
        return {
            notificacoes: true,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
  },

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    const response = await authRequest('/Notificacao/configuracoes/editar', {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao atualizar configurações de notificação.");
    }
  },

  async getSubscriptionNotificationSettings(idAssinatura: number): Promise<any> {
    const response = await authRequest(`/Notificacao/${idAssinatura}/assinatura`, { method: 'GET' });
    if (!response.ok) {
        return {
            usarConfigsGerais: true,
            notificacoes: true,
            notificacoesAtraso: 0,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
    try {
        return await response.json();
    } catch {
        return {
            usarConfigsGerais: true,
            notificacoes: true,
            notificacoesAtraso: 0,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
  },

  async updateSubscriptionNotificationSettings(idAssinatura: number, settings: any): Promise<void> {
    const response = await authRequest(`/Notificacao/${idAssinatura}/assinatura`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao atualizar configurações de notificação da assinatura.");
    }
  },

  // --- NOVOS MÉTODOS DE DADOS DO CLIENTE ---

  async acceptConnection(idEmpresa: number): Promise<void> {
    const response = await authRequest(`/User/minha-conexao/${idEmpresa}`, {
      method: 'PATCH'
    });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao aceitar conexão.");
    }
  },

  async updateSubscriptionStatus(
    idAssinatura: number,
    targetStatus: number,
    contrato?: File | null,
  ): Promise<Response> {
    let options: RequestInit = { method: 'PATCH' };
    if (contrato) {
      const formData = new FormData();
      formData.append(
        'Contrato',
        contrato,
        contrato.name || 'contrato-assinado.pdf',
      );
      options.body = formData;
    }
    return authRequest(
      `/User/minha-assinatura/${idAssinatura}/${targetStatus}`,
      options,
    );
  },

  /**
   * Anexa PDF assinado. Pendente → Ativo com Contrato; se já Ativo, reabre via Suspenso/Pendente.
   */
  async attachSignedContractToSubscription(
    idAssinatura: number,
    contrato: File,
  ): Promise<void> {
    const subs = await this.listClientSubscriptions();
    const sub = subs.find((s) => s.idAssinatura === idAssinatura);
    const currentStatus = toAssinaturaStatusCode(
      sub?.status ?? ASSINATURA_STATUS.Pendente,
    );

    const activateWithContract = async (): Promise<boolean> => {
      const response = await this.updateSubscriptionStatus(
        idAssinatura,
        ASSINATURA_STATUS.Ativo,
        contrato,
      );
      return response.ok;
    };

    if (currentStatus === ASSINATURA_STATUS.Pendente) {
      const response = await this.updateSubscriptionStatus(
        idAssinatura,
        ASSINATURA_STATUS.Ativo,
        contrato,
      );
      if (response.ok) return;
      const msg = await parseApiError(response);
      throw new Error(msg || 'Falha ao anexar o contrato assinado.');
    }

    if (currentStatus === ASSINATURA_STATUS.Ativo) {
      for (const interimStatus of [
        ASSINATURA_STATUS.Suspenso,
        ASSINATURA_STATUS.Pendente,
      ]) {
        const interimRes = await this.updateSubscriptionStatus(
          idAssinatura,
          interimStatus,
        );
        if (!interimRes.ok) continue;
        if (await activateWithContract()) return;
      }
      throw new Error(
        'Não foi possível salvar o contrato assinado na assinatura já ativa.',
      );
    }

    const response = await this.updateSubscriptionStatus(
      idAssinatura,
      ASSINATURA_STATUS.Ativo,
      contrato,
    );
    if (response.ok) return;

    const msg = await parseApiError(response);
    throw new Error(msg || 'Falha ao anexar o contrato assinado.');
  },

  async acceptSubscription(idAssinatura: number, contrato?: File | null): Promise<void> {
    if (contrato) {
      await this.attachSignedContractToSubscription(idAssinatura, contrato);
      return;
    }

    const response = await this.updateSubscriptionStatus(
      idAssinatura,
      ASSINATURA_STATUS.Ativo,
    );
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || 'Falha ao aceitar assinatura.');
    }
  },

  async listConnections(): Promise<ClientConnection[]> {
    const response = await authRequest('/User/minhas-conexoes', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async listCompanyPlans(idEmpresa: number): Promise<PlanResponse[]> {
    const response = await authRequest(`/Plano/empresa/${idEmpresa}`, { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.dados) ? data.dados : []);
        return list.map((plan: any) => ({
          ...plan,
          contratoPath: resolveContractPath(plan),
          cancelamentoDias: plan.cancelamentoDias ?? plan.cancelamento ?? plan.Cancelamento,
          tipoContrato: plan.tipoContrato ?? plan.TipoContrato,
          assinarPorCliente: plan.assinarPorCliente ?? plan.AssinarPorCliente,
        }));
    } catch {
        return [];
    }
  },

  async listClientSubscriptions(): Promise<ClientSubscription[]> {
    const response = await authRequest('/User/minhas-assinaturas', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        return list.map((sub: any) => ({
          idAssinatura: sub.idAssinatura ?? sub.IdAssinatura,
          nomePlano: sub.nomePlano ?? sub.NomePlano,
          nomeEmpresa: sub.nomeEmpresa ?? sub.NomeEmpresa,
          dataInicio: sub.dataInicio ?? sub.DataInicio,
          dataFim: sub.dataFim ?? sub.DataFim,
          valorMensal: sub.valorMensal ?? sub.ValorMensal,
          status: sub.status ?? sub.Status,
          periodo: sub.periodo ?? sub.Periodo,
          idPlano: sub.idPlano ?? sub.IdPlano,
          contratoPath: resolveContractPath(sub),
          contrato: resolveContractPath(sub),
        }));
    } catch {
        return [];
    }
  },

  async enrichClientSubscriptions(
    subscriptions: ClientSubscription[],
    connections: ClientConnection[]
  ): Promise<ClientSubscription[]> {
    if (!subscriptions.length) return subscriptions;

    const plansByCompany = new Map<number, PlanResponse[]>();
    const uniqueCompanyIds = [...new Set(connections.map((c) => c.idEmpresa).filter(Boolean))];

    await Promise.all(
      uniqueCompanyIds.map(async (idEmpresa) => {
        const plans = await this.listCompanyPlans(idEmpresa);
        plansByCompany.set(idEmpresa, plans);
      })
    );

    return subscriptions.map((sub) => {
      const connection = connections.find((c) => c.nomeEmpresa === sub.nomeEmpresa);
      const plans = connection ? plansByCompany.get(connection.idEmpresa) ?? [] : [];
      const matchedPlan = plans.find((p) => p.nome === sub.nomePlano);

      if (!matchedPlan) return sub;

      const subscriptionContract = resolveContractPath(sub);
      const planContract = resolveContractPath(matchedPlan);
      const tipoContrato = getPlanTipoContrato(matchedPlan);

      return {
        ...sub,
        idPlano: sub.idPlano ?? matchedPlan.idPlano,
        contratoPath:
          subscriptionContract ??
          (requiresSignedContractType(tipoContrato) ? null : planContract),
        planoContratoPath: planContract,
        tipoContratoPlano: matchedPlan.tipoContrato,
      };
    });
  },

  async listClientInvoices(): Promise<ClientInvoice[]> {
    // Nota: Endpoint é /Mensalidade/cliente, diferente do padrão /User
    const response = await authRequest('/Mensalidade/cliente', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async listSavedCards(): Promise<SavedCard[]> {
    const response = await authRequest('/api/Cartao/meus-cartoes', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async createSavedCard(data: {
    nomeNoCartao: string;
    numCartao: string;
    ccv: string;
    bandeira: string;
    mesAnoExpiracao: string;
    isDefault: boolean;
  }): Promise<void> {
    const response = await authRequest('/api/Cartao/cadastrar', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao cadastrar cartão.");
    }
  },

  async updateSavedCard(id: number, data: {
    nomeNoCartao: string;
    numCartao: string;
    ccv: string;
    bandeira: string;
    mesAnoExpiracao: string;
    isDefault: boolean;
  }): Promise<void> {
    const response = await authRequest(`/api/Cartao/editar/${id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao editar cartão.");
    }
  },

  async deleteSavedCard(id: number): Promise<void> {
    const response = await authRequest(`/api/Cartao/remover/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao remover cartão.");
    }
  },

  // --- AÇÕES DO CLIENTE (Cancelar, Pagar) ---

  async unlinkCompany(idEmpresa: number): Promise<void> {
    const response = await authRequest(`/User/minha-conexao/desconectar/${idEmpresa}`, {
        method: 'PATCH'
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao desvincular empresa.");
    }
  },

  async cancelSubscription(idAssinatura: number): Promise<void> {
    const response = await authRequest(`/User/minha-assinatura/${idAssinatura}/${ASSINATURA_STATUS.Cancelado}`, {
      method: 'PATCH'
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao cancelar assinatura.");
    }
  },

  async payInvoice(idMensalidade: number, metodo: number): Promise<void> {
      // Endpoint correto: /Pagamento/confirmar
      const response = await authRequest(`/Pagamento/confirmar`, {
          method: 'POST',
          body: JSON.stringify({ 
              idMensalidade, 
              metodo // 0: PIX, 1: Cartão, 2: Boleto (exemplo)
          })
      });

      if (!response.ok) {
          const msg = await parseApiError(response);
          throw new Error(msg || "Falha ao processar pagamento.");
      }
  },

  async assinarPlano(payload: AssinarPlanoPayload): Promise<{ idAssinatura?: number; message?: string }> {
    if (payload.idEmpresa) {
      await this.ensureCompanyConnection(payload.idEmpresa);
    }

    const account = await this.getMyAccount();
    const idUser = payload.idUser ?? account.idUser ?? (account as { IdUser?: number }).IdUser;
    if (!idUser) {
      throw new Error('Não foi possível identificar seu usuário. Faça login novamente.');
    }

    const diaPagamento = Math.min(30, Math.max(1, parseInt(String(payload.diaPagamento), 10)));
    const contrato = payload.contrato ?? null;
    const requiresContractFile = Boolean(contrato);

    const enviarComoJson = async () => {
      const jsonPayload = {
        IdUser: idUser,
        IdPlano: payload.idPlano,
        Periodo: payload.periodo,
        DiaPagamento: diaPagamento,
        Desconto: payload.desconto ?? 0,
        TipoDesconto: payload.tipoDesconto ?? 0,
        Observacao: payload.observacao ?? '',
      };
      return authRequest('/User/assinar-plano', {
        method: 'POST',
        body: JSON.stringify(jsonPayload),
      });
    };

    const enviarComoFormData = async (includeContrato = false) => {
      const formData = new FormData();
      formData.append('IdUser', String(idUser));
      formData.append('IdPlano', String(payload.idPlano));
      formData.append('Periodo', String(payload.periodo));
      formData.append('DiaPagamento', String(diaPagamento));
      formData.append('Desconto', String(payload.desconto ?? 0));
      formData.append('TipoDesconto', String(payload.tipoDesconto ?? 0));
      if (payload.observacao) {
        formData.append('Observacao', payload.observacao);
      }
      if (includeContrato && contrato) {
        formData.append('Contrato', contrato, contrato.name || 'contrato-assinado.pdf');
      }
      return authRequest('/User/assinar-plano', {
        method: 'POST',
        body: formData,
      });
    };

    const parseCreateResult = async (
      response: Response,
    ): Promise<{ idAssinatura?: number; IdAssinatura?: number; message?: string }> => {
      try {
        return await response.json();
      } catch {
        return { message: 'Assinatura realizada com sucesso.' };
      }
    };

    const resolveCreatedSubscriptionId = async (
      result: { idAssinatura?: number; IdAssinatura?: number },
    ): Promise<number | undefined> => {
      let idAssinatura = result.idAssinatura ?? result.IdAssinatura;
      if (idAssinatura) return idAssinatura;

      const subs = await this.listClientSubscriptions();
      const matched = subs
        .filter((sub) => sub.idPlano === payload.idPlano)
        .sort((a, b) => (b.idAssinatura ?? 0) - (a.idAssinatura ?? 0))[0];
      return matched?.idAssinatura;
    };

    if (requiresContractFile && contrato) {
      let atomicResponse = await enviarComoFormData(true);
      if (atomicResponse.ok) {
        const result = await parseCreateResult(atomicResponse);
        return {
          idAssinatura: await resolveCreatedSubscriptionId(result),
          message: result.message ?? 'Assinatura realizada com sucesso.',
        };
      }

      if (atomicResponse.status !== 415) {
        const msg = await parseApiError(atomicResponse);
        throw new Error(msg || 'Falha ao enviar assinatura com contrato.');
      }

      console.warn(
        '[userService] assinar-plano rejeitou multipart com Contrato (415). Usando fluxo em duas etapas.',
      );
    }

    let response = await enviarComoJson();
    if (response.status === 415) {
      response = await enviarComoFormData(false);
    }

    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || 'Falha ao realizar assinatura do plano.');
    }

    const result = await parseCreateResult(response);
    let idAssinatura = await resolveCreatedSubscriptionId(result);

    if (requiresContractFile && contrato) {
      if (!idAssinatura) {
        throw new Error(
          'Assinatura criada, mas não foi possível identificar o registro para anexar o contrato.',
        );
      }

      try {
        await this.attachSignedContractToSubscription(idAssinatura, contrato);
      } catch (attachError) {
        try {
          await this.cancelSubscription(idAssinatura);
        } catch (rollbackError) {
          console.error('[PagWeb] Rollback após falha no contrato:', rollbackError);
        }
        const detail =
          attachError instanceof Error
            ? attachError.message
            : 'Falha ao anexar o contrato assinado.';
        throw new Error(
          `${detail} A assinatura foi cancelada porque o PDF com assinatura e foto é obrigatório.`,
        );
      }
    }

    return {
      idAssinatura,
      message: result.message ?? 'Assinatura realizada com sucesso.',
    };
  }
};
