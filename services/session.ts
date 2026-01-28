import { AuthResponse } from "../types";

export const sessionService = {
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
    // Verifica onde o usuário está antes de limpar os dados
    const currentHash = window.location.hash;
    const isBusinessRoute = currentHash.includes('/business');

    localStorage.removeItem("pagweb_token");
    localStorage.removeItem("pagweb_user");
    
    // Redirecionamento contextual
    if (isBusinessRoute) {
        window.location.hash = "#/login?type=business";
    } else {
        window.location.hash = "#/login?type=client";
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem("pagweb_token");
  },

  getUserType() {
    const { user } = this.getSession();
    return user?.tipo; // 'Cliente' ou 'Empresa'
  }
};