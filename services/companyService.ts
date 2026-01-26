import { AuthResponse, CompanyCreationPayload, CompanyLoginPayload, CompanyResponse } from "../types";
import { sessionService } from "./session";

const COMPANY_URL = "https://lojas.vlks.com.br/api/v1/Empresa";
const USER_URL = "https://lojas.vlks.com.br/api/v1/User";

export const companyService = {
  // Agora recebe o token do usuário logado para criar a empresa
  async create(token: string, data: CompanyCreationPayload): Promise<CompanyResponse> {
    const response = await fetch(COMPANY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Falha ao criar empresa");
    }

    return await response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const payload: CompanyLoginPayload = {
      email,
      password,
    };

    const response = await fetch(`${USER_URL}/login-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*"
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Falha ao realizar login administrativo");
    }

    const data = await response.json();
    
    // Garantir que o tipo seja Admin/Empresa
    if (data.user) {
      data.user.tipo = 'Empresa';
    }

    sessionService.setSession(data);
    return data;
  }
};