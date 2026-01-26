import { ActivatePayload, AuthResponse, LoginPayload, RegisterPayload } from "../types";

const BASE_URL = "https://lojas.vlks.com.br/api/v1/User";

export const authService = {
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
      const errorText = await response.text();
      throw new Error(errorText || "Falha ao registrar usuário");
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
      const errorText = await response.text();
      throw new Error(errorText || "Falha ao ativar conta");
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const payload: LoginPayload = {
      email,
      password,
      adminLogin: false,
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
    this.setSession(data);
    return data;
  },

  setSession(data: AuthResponse) {
    localStorage.setItem("pagweb_token", data.token);
    localStorage.setItem("pagweb_user", JSON.stringify(data.user));
  },

  getSession() {
    const token = localStorage.getItem("pagweb_token");
    const userStr = localStorage.getItem("pagweb_user");
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  },

  logout() {
    localStorage.removeItem("pagweb_token");
    localStorage.removeItem("pagweb_user");
    window.location.hash = "#/login";
  },

  isAuthenticated() {
    return !!localStorage.getItem("pagweb_token");
  }
};