import { ActivatePayload, AuthResponse, LoginPayload, RegisterPayload } from "../types";
import { sessionService } from "./session";
import { parseApiError } from "../utils/formatters";

const BASE_URL = "https://lojas.vlks.com.br/api/v1/User";

export const userService = {
  async register(data: RegisterPayload): Promise<void> {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*"
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao registrar usuário");
    }
  },

  async activate(data: ActivatePayload): Promise<void> {
    const response = await fetch(`${BASE_URL}/activate`, {
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
    const payload: LoginPayload = {
      email,
      password,
    };

    const response = await fetch(`${BASE_URL}/login-cliente`, {
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
    
    // API response user object might not contain 'tipo', inject it for frontend logic
    if (data.user && !data.user.tipo) {
      data.user.tipo = 'Cliente';
    }

    sessionService.setSession(data);
    return data;
  },

  // Vincula o usuário logado a uma empresa (Aceite de convite)
  async linkToCompany(companyId: number): Promise<void> {
    const { token } = sessionService.getSession();
    
    // Endpoint para o cliente se conectar à empresa
    // Payload é o ID da empresa (int) no corpo, similar ao admin/conecta-cliente que envia string no corpo
    const response = await fetch(`${BASE_URL}/conecta-empresa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(companyId)
    });

    if (!response.ok) {
      console.warn("Aviso na vinculação automática:", await response.text());
    }
  }
};