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
  async createPlan(data: PlanPayload): Promise<PlanResponse> {
    const response = await fetch(`${BASE_URL}/Plano`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Falha ao criar plano");
    }
    return response.json();
  },

  async listPlans(): Promise<PlanResponse[]> {
    const response = await fetch(`${BASE_URL}/Plano/empresa`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Falha ao listar planos");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // === CLIENTES (ADMIN) ===
  async connectClient(email: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/User/admin/conecta-cliente`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(email), // Envia a string diretamente como JSON "string"
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || "Falha ao conectar cliente");
    }
  },

  async listClients(): Promise<User[]> {
    const response = await fetch(`${BASE_URL}/User/admin/clientes`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Falha ao listar clientes");
    }
    const data = await response.json();
    // Validação de segurança para garantir que é um array
    return Array.isArray(data) ? data : [];
  },

  // === ASSINATURAS ===
  async createSubscription(data: SubscriptionPayload): Promise<SubscriptionResponse> {
    const response = await fetch(`${BASE_URL}/Assinatura`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Falha ao criar assinatura");
    }
    return response.json();
  },

  async listSubscriptions(): Promise<SubscriptionResponse[]> {
    const response = await fetch(`${BASE_URL}/Assinatura/empresa`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Falha ao listar assinaturas");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
};