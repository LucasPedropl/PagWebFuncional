import { AuthResponse, CompanyLoginPayload, CompanyRegisterPayload } from "../types";
import { sessionService } from "./session";

const BASE_URL = "https://lojas.vlks.com.br/api/v1/Empresa";

export const companyService = {
  async register(data: CompanyRegisterPayload): Promise<void> {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*"
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Falha ao registrar empresa");
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const payload: CompanyLoginPayload = {
      email,
      password,
    };

    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "*/*"
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Falha ao realizar login");
    }

    const data = await response.json();
    sessionService.setSession(data);
    return data;
  }
};