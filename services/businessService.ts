import { PlanPayload, PlanResponse, User, SubscriptionPayload, SubscriptionResponse } from "../types";
import { sessionService } from "./session";
import { parseApiError } from "../utils/formatters";

const BASE_URL = "https://lojas.vlks.com.br/api/v1";

const getHeaders = () => {
  const { token } = sessionService.getSession();
  return {
    "Content-Type": "application/json",
    "accept": "*/*",
    "Authorization": `Bearer ${token}`
  };
};

export const businessService = {
  // === PLANOS ===
  async listPlans(): Promise<PlanResponse[]> {
    const response = await fetch(`${BASE_URL}/Plano/empresa`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao listar planos");
    }
    return await response.json();
  },

  async createPlan(data: PlanPayload): Promise<PlanResponse> {
    const response = await fetch(`${BASE_URL}/Plano`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao criar plano");
    }
    return await response.json();
  },

  async updatePlan(id: number, data: PlanPayload): Promise<void> {
    const response = await fetch(`${BASE_URL}/Plano/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao atualizar plano");
    }
  },

  async deletePlan(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/Plano/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao excluir plano");
    }
  },

  // === CLIENTES ===
  async listClients(): Promise<User[]> {
    try {
      const response = await fetch(`${BASE_URL}/User/admin/clientes`, {
         method: 'GET',
         headers: getHeaders()
      });
      if (!response.ok) return []; 
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  async connectClient(email: string): Promise<void> {
    // Rota correta conforme CURL: POST /User/admin/conecta-cliente
    // Body deve ser apenas a string do email (JSON string), não um objeto { email: ... }
    const response = await fetch(`${BASE_URL}/User/admin/conecta-cliente`, { 
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(email)
    });
    
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao conectar cliente");
    }
  },

  async disconnectClient(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/User/admin/desconecta-cliente/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao desconectar cliente");
    }
  },

  // === ASSINATURAS ===
  async listSubscriptions(): Promise<SubscriptionResponse[]> {
     const response = await fetch(`${BASE_URL}/Assinatura/empresa`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) return [];
    return await response.json();
  },

  async createSubscription(data: SubscriptionPayload): Promise<void> {
    const response = await fetch(`${BASE_URL}/Assinatura`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao criar assinatura");
    }
  },

  async updateSubscription(id: number, status: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/Assinatura/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(status) 
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao atualizar assinatura");
    }
  },

  async deleteSubscription(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/Assinatura/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
        const text = await parseApiError(response);
        throw new Error(text || "Erro ao excluir assinatura");
    }
  }
};