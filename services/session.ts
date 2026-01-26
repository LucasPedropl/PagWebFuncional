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
    localStorage.removeItem("pagweb_token");
    localStorage.removeItem("pagweb_user");
    window.location.hash = "#/login";
  },

  isAuthenticated() {
    return !!localStorage.getItem("pagweb_token");
  }
};