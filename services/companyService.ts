import { AuthResponse, CompanyCreationPayload, CompanyLoginPayload, CompanyResponse } from "../types";
import { sessionService } from "./session";
import { parseApiError } from "../utils/formatters";

const COMPANY_URL = "https://lojas.vlks.com.br/api/v1/Empresa";
const USER_URL = "https://lojas.vlks.com.br/api/v1/User";

export const companyService = {
  // Agora recebe o token do usuário logado para criar a empresa
  async create(token: string, data: CompanyCreationPayload): Promise<CompanyResponse> {
    const formData = new FormData();
    formData.append('Nome', data.nome);
    formData.append('Cnpj', data.cnpj);
    formData.append('Telefone', data.telefone);
    if (data.logo) {
      formData.append('Logo', data.logo);
    } else {
      formData.append('Logo', '');
    }

    const response = await fetch(COMPANY_URL, {
      method: "POST",
      headers: {
        "accept": "*/*",
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao criar empresa");
    }

    return await response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('Email', email);
    formData.append('Password', password);

    const response = await fetch(`${USER_URL}/login-admin`, {
      method: "POST",
      headers: {
        "accept": "*/*"
      },
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao realizar login administrativo");
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