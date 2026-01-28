import { PlanPayload, PlanResponse, User, SubscriptionPayload, SubscriptionResponse } from "../types";
import { sessionService } from "./session";

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
    const response = await fetch(`${BASE_URL}/Plano`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Erro ao listar planos");
    return await response.json();
  },

  async createPlan(data: PlanPayload): Promise<PlanResponse> {
    const response = await fetch(`${BASE_URL}/Plano`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Erro ao criar plano");
    return await response.json();
  },

  async updatePlan(id: number, data: PlanPayload): Promise<void> {
    const response = await fetch(`${BASE_URL}/Plano/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Erro ao atualizar plano");
  },

  async deletePlan(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/Plano/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error("Erro ao excluir plano");
  },

  // === CLIENTES ===
  async listClients(): Promise<User[]> {
    // Endpoint hipotético baseado no contexto, pois não foi fornecido na documentação parcial
    // Assumindo GET /Cliente retorna lista de usuários vinculados
    try {
      const response = await fetch(`${BASE_URL}/Cliente`, {
         method: 'GET',
         headers: getHeaders()
      });
      // Fallback para array vazio se endpoint não existir ou der 404
      if (!response.ok) return []; 
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  async connectClient(email: string): Promise<void> {
     // Endpoint hipotético de convite
     // Assumindo POST /Cliente/convidar ou similar para vincular por email
     const response = await fetch(`${BASE_URL}/Cliente/convidar`, { 
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email })
    });
    
    // Se a API retornar erro, lançamos para o front tratar
    if (!response.ok) {
        // Ignoramos erro de parsing se não for JSON
        const text = await response.text().catch(() => "Erro ao conectar");
        throw new Error(text || "Erro ao conectar cliente");
    }
  },

  // === ASSINATURAS ===
  async listSubscriptions(): Promise<SubscriptionResponse[]> {
     const response = await fetch(`${BASE_URL}/Assinatura`, {
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
    if (!response.ok) throw new Error("Erro ao criar assinatura");
  }
};