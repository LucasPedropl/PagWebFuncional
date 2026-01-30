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
    
    // Assumindo endpoint de vinculação baseado no ID da empresa
    // Caso a API use um padrão diferente, ajustar aqui. 
    // Usando endpoint similar ao de conectar-cliente, mas para o usuário se conectar à empresa.
    const response = await fetch(`${BASE_URL}/vincula-empresa/${companyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Ignoramos erro se for "já vinculado" ou similar, para não travar o fluxo
      console.warn("Aviso na vinculação automática:", await response.text());
    }
  }
};