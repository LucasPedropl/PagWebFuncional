import { PlanPayload, PlanResponse, User, SubscriptionPayload, SubscriptionResponse } from "../types";
import { sessionService } from "./session";
import { parseApiError } from "../utils/formatters";

const BASE_URL = "https://lojas.vlks.com.br/api/v1";

// Helper privado para requisições autenticadas com verificação de 401
// Funciona como o identificador de sessão válida
const authRequest = async (endpoint: string, options: RequestInit = {}) => {
  const { token } = sessionService.getSession();
  
  if (!token) {
    sessionService.logout();
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "accept": "*/*",
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });

  // Identificador de sessão expirada ou inválida
  if (response.status === 401) {
    sessionService.logout(); // Redireciona para /login
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  return response;
};

export const businessService = {
  // === PLANOS ===
  async listPlans(): Promise<PlanResponse[]> {
    const response = await authRequest('/Plano/empresa', { method: 'GET' });
    
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao listar planos");
    }
    return await response.json();
  },

  async createPlan(data: PlanPayload): Promise<PlanResponse> {
    const response = await authRequest('/Plano', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao criar plano");
    }
    return await response.json();
  },

  async updatePlan(id: number, data: PlanPayload): Promise<void> {
    const response = await authRequest(`/Plano/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
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
      return await response.json();
    } catch (e) {
      // Se for erro de auth, já foi tratado pelo authRequest. 
      // Se for outro erro, retorna vazio para não quebrar a UI
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
    if (!response.ok) return [];
    return await response.json();
  },

  async createSubscription(data: SubscriptionPayload): Promise<void> {
    const response = await authRequest('/Assinatura', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao criar assinatura");
    }
  },

  async updateSubscription(id: number, status: string): Promise<void> {
    const response = await authRequest(`/Assinatura/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(status) 
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao atualizar assinatura");
    }
  },

  async deleteSubscription(id: number): Promise<void> {
    const response = await authRequest(`/Assinatura/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao excluir assinatura");
    }
  }
};