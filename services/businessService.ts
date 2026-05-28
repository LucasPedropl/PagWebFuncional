
import { PlanPayload, PlanResponse, User, SubscriptionPayload, SubscriptionResponse, Mensalidade } from "../types";
import { sessionService } from "./session";
import { normalizePaymentDay, parseApiError } from "../utils/formatters";
import { resolveContractPath, toAssinaturaStatusCode } from "../utils/api";

const BASE_URL = "https://lojas.vlks.com.br/api/v1";

const buildPlanFormData = (data: PlanPayload): FormData => {
  const formData = new FormData();
  formData.append('Nome', data.nome);
  formData.append('ValorMensalidade', data.valorMensalidade.toString());
  formData.append('PercentualMulta', data.percentualMulta.toString());
  formData.append('PercentualJurosMensal', data.percentualJurosMensal.toString());

  if (data.funcionalidades?.length) {
    data.funcionalidades.forEach((func) => formData.append('Funcionalidades', func));
  }

  if (data.arquivoContrato) {
    formData.append('ArquivoContrato', data.arquivoContrato);
  }

  if (data.tipoContrato != null) {
    formData.append('TipoContrato', data.tipoContrato.toString());
  }

  if (data.cancelamentoDias != null) {
    formData.append('cancelamentoDias', data.cancelamentoDias.toString());
  }

  if (data.assinarPorCliente != null) {
    formData.append('assinarPorCliente', String(data.assinarPorCliente));
  }

  return formData;
};

const buildSubscriptionFormData = (data: SubscriptionPayload): FormData => {
  const formData = new FormData();
  const idUser = typeof data.idUser === 'string' ? parseInt(data.idUser, 10) : data.idUser;
  const idPlano = typeof data.idPlano === 'string' ? parseInt(data.idPlano, 10) : data.idPlano;
  const periodo = typeof data.periodo === 'string' ? parseInt(data.periodo, 10) : data.periodo;
  const diaPagamento = normalizePaymentDay(data.diaPagamento);

  formData.append('IdUser', String(idUser));
  formData.append('IdPlano', String(idPlano));
  formData.append('Periodo', String(periodo));
  formData.append('DiaPagamento', String(diaPagamento));
  formData.append('Desconto', String(data.desconto ?? 0));
  formData.append('TipoDesconto', String(data.tipoDesconto ?? 0));
  if (data.observacao?.trim()) {
    formData.append('Observacao', data.observacao.trim());
  }

  return formData;
};

const normalizePlan = (plan: any): PlanResponse => ({
  ...plan,
  contratoPath: resolveContractPath(plan),
  cancelamentoDias: plan.cancelamentoDias ?? plan.cancelamento ?? plan.Cancelamento,
  tipoContrato: plan.tipoContrato ?? plan.TipoContrato,
  assinarPorCliente: plan.assinarPorCliente ?? plan.AssinarPorCliente,
});

const normalizeSubscription = (sub: any): SubscriptionResponse => ({
  ...sub,
  idAssinatura: sub.idAssinatura ?? sub.IdAssinatura,
  nomeCliente: sub.nomeCliente ?? sub.NomeCliente,
  nomePlano: sub.nomePlano ?? sub.NomePlano,
  idPlano: sub.idPlano ?? sub.IdPlano,
  periodo: sub.periodo ?? sub.Periodo,
  dataInicial: sub.dataInicial ?? sub.DataInicial,
  dataFinal: sub.dataFinal ?? sub.DataFinal,
  valorComDesconto: sub.valorComDesconto ?? sub.ValorComDesconto,
  status: sub.status ?? sub.Status,
  contratoPath: resolveContractPath(sub),
  contrato: resolveContractPath(sub),
});

const isEmpresaDualAccount = (): boolean =>
  sessionService.isEmpresaOwner() || sessionService.getSession().user?.tipo === "Empresa";

// Helper privado para requisições autenticadas com renovação automática
const authRequest = async (endpoint: string, options: RequestInit = {}, isRetry = false): Promise<Response> => {
  let token = sessionService.getSession().token;

  if (isEmpresaDualAccount()) {
    const cachedAdmin = sessionService.getCachedToken("admin");
    if (cachedAdmin) {
      token = cachedAdmin;
    } else if (!isRetry) {
      await sessionService.switchToMode("admin");
      token = sessionService.getSession().token;
    }
  }

  if (!token && !isRetry) {
    sessionService.logout();
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "accept": "*/*",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  // Se o token expirou (401), tentamos renovar usando as credenciais salvas
  if (response.status === 403 && !isRetry && isEmpresaDualAccount()) {
    try {
      await sessionService.switchToMode("admin");
      return authRequest(endpoint, options, true);
    } catch (err) {
      console.error("Erro ao obter token administrativo:", err);
    }
  }

  if (response.status === 401 && !isRetry) {
    const creds = sessionService.getCredentials();
    if (creds) {
      try {
        await sessionService.switchToMode("admin");
        return authRequest(endpoint, options, true);
      } catch (err) {
        console.error("Erro na renovação automática de token:", err);
      }
    }

    sessionService.logout();
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  return response;
};

export const businessService = {
  // === PLANOS ===
  async listPlans(): Promise<PlanResponse[]> {
    const response = await authRequest('/Plano/empresa', { method: 'GET' });
    
    if (!response.ok) {
        // Se der erro 404 ou outro, retornamos array vazio para não quebrar a UI em contas novas
        if (response.status === 404) return [];
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao listar planos");
    }
    try {
        const data = await response.json();
        return Array.isArray(data) ? data.map(normalizePlan) : [];
    } catch {
        return [];
    }
  },

  async createPlan(data: PlanPayload): Promise<PlanResponse> {
    const formData = buildPlanFormData(data);

    let token = sessionService.getSession().token;
    if (isEmpresaDualAccount()) {
      token = sessionService.getCachedToken("admin") || token;
    }

    if (!token) {
      sessionService.logout();
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const response = await fetch(`${BASE_URL}/Plano`, {
      method: 'POST',
      headers: {
        "accept": "*/*",
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao criar plano");
    }
    const json = await response.json();
    return normalizePlan(json);
  },

  async updatePlan(id: number, data: PlanPayload): Promise<void> {
    const formData = buildPlanFormData(data);

    let token = sessionService.getSession().token;
    if (isEmpresaDualAccount()) {
      token = sessionService.getCachedToken("admin") || token;
    }

    if (!token) {
      sessionService.logout();
      throw new Error("Sessão inválida. Faça login novamente.");
    }

    const response = await fetch(`${BASE_URL}/Plano/${id}`, {
      method: 'PATCH',
      headers: {
        "accept": "*/*",
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao atualizar plano");
    }
  },

  async deletePlan(id: number): Promise<void> {
    const response = await authRequest(`/Plano/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao excluir plano");
    }
  },

  // === CLIENTES ===
  async listClients(): Promise<User[]> {
    try {
      const response = await authRequest('/User/admin/clientes', {
         method: 'GET'
      });
      if (!response.ok) return []; 
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  async connectClient(email: string): Promise<void> {
    const response = await authRequest('/User/admin/conecta-cliente', { 
      method: 'POST',
      body: JSON.stringify(email)
    });
    
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao conectar cliente");
    }
  },

  async disconnectClient(id: number): Promise<void> {
    const response = await authRequest(`/User/admin/desconecta-cliente/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao desconectar cliente");
    }
  },

  // === ASSINATURAS ===
  async listSubscriptions(): Promise<SubscriptionResponse[]> {
     const response = await authRequest('/Assinatura/empresa', {
      method: 'GET'
    });
    // API retorna 500 por bug de serialização no backend (tipos anônimos EF) — tratamos sem quebrar a UI
    if (!response.ok) {
      if (response.status >= 500) {
        console.warn(
          "[PagWeb] GET /Assinatura/empresa indisponível (erro no servidor). Métricas de assinatura usarão valores vazios."
        );
      }
      return [];
    }
    try {
        const data = await response.json();
        return Array.isArray(data) ? data.map(normalizeSubscription) : [];
    } catch {
        return [];
    }
  },

  async createSubscription(data: SubscriptionPayload): Promise<void> {
    const formData = buildSubscriptionFormData(data);

    const response = await authRequest('/Assinatura', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao criar assinatura");
    }
  },

  async updateSubscription(id: number, status: string | number): Promise<void> {
    const statusCode = toAssinaturaStatusCode(status);
    const response = await authRequest(`/Assinatura/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(statusCode)
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao atualizar assinatura");
    }
  },

  async deleteSubscription(id: number): Promise<void> {
    const response = await authRequest(`/Assinatura/assinatura/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao excluir assinatura");
    }
  },

  // === MENSALIDADES / COBRANÇAS ===
  async listMensalidades(): Promise<Mensalidade[]> {
    const response = await authRequest('/Mensalidade/empresa', {
      method: 'GET'
    });
    
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  // === PAGAMENTOS ===
  async cancelPayment(idPagamento: number): Promise<void> {
    const response = await authRequest(`/Pagamento/Cancelar?idPagamento=${idPagamento}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao cancelar pagamento");
    }
  },

  // === WHATSAPP ===
  async checkWhatsAppInstance(): Promise<any> {
    const response = await authRequest('/WhatsApps/verificar', {
      method: 'GET'
    });
    
    if (!response.ok) {
        if (response.status === 404) return null;
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao verificar instância do WhatsApp");
    }
    
    const text = await response.text();
    if (!text) return null;
    
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
  },

  async createWhatsAppInstance(): Promise<{ qrCode: string, status: string, instancia: number }> {
    const response = await authRequest('/WhatsApps/criar', {
      method: 'GET'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao criar instância do WhatsApp");
    }
    return await response.json();
  },

  async getWhatsAppQRCode(): Promise<{ qrCode: string, status: string, instancia: number }> {
    const response = await authRequest('/WhatsApps/qrcode', {
      method: 'GET'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao obter QR Code do WhatsApp");
    }
    return await response.json();
  },

  async disconnectWhatsApp(): Promise<void> {
    const response = await authRequest('/WhatsApps/desconectar', {
      method: 'DELETE'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao desconectar WhatsApp");
    }
  }
};
