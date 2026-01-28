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

  async connectAdmin(token: string, idEmpresa: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/conecta-admin/${idEmpresa}`, {
      method: "POST",
      headers: {
        "accept": "*/*",
        "Authorization": `Bearer ${token}`
      },
      body: "" // Empty body as per CURL
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao conectar administrador à empresa");
    }
  }
};