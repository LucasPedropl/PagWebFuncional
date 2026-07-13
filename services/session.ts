import { AuthResponse } from "../types";

const EMPRESA_OWNER_KEY = "pagweb_empresa_owner";
const TOKEN_CLIENT_KEY = "pagweb_token_client";
const TOKEN_ADMIN_KEY = "pagweb_token_admin";
const ACTIVE_MODE_KEY = "pagweb_active_token_mode";
const API_BASE = "https://lojas.vlks.com.br/api/v1";

export type TokenMode = "client" | "admin";

let switchInFlight: Promise<void> | null = null;

export const sessionService = {
  setSession(data: AuthResponse) {
    localStorage.setItem("pagweb_token", data.token);
    localStorage.setItem("pagweb_user", JSON.stringify(data.user));
  },

  cacheToken(mode: TokenMode, token: string) {
    const key = mode === "client" ? TOKEN_CLIENT_KEY : TOKEN_ADMIN_KEY;
    localStorage.setItem(key, token);
  },

  getCachedToken(mode: TokenMode): string | null {
    return localStorage.getItem(mode === "client" ? TOKEN_CLIENT_KEY : TOKEN_ADMIN_KEY);
  },

  getActiveMode(): TokenMode {
    const mode = localStorage.getItem(ACTIVE_MODE_KEY);
    return mode === "client" ? "client" : "admin";
  },

  activateMode(mode: TokenMode): boolean {
    const cached = this.getCachedToken(mode);
    if (!cached) return false;
    localStorage.setItem(ACTIVE_MODE_KEY, mode);
    localStorage.setItem("pagweb_token", cached);
    return true;
  },

  setEmpresaOwnerFlag(value: boolean) {
    if (value) localStorage.setItem(EMPRESA_OWNER_KEY, "1");
    else localStorage.removeItem(EMPRESA_OWNER_KEY);
  },

  isEmpresaOwner(): boolean {
    return localStorage.getItem(EMPRESA_OWNER_KEY) === "1";
  },

  applyAuthResponse(data: AuthResponse, mode: TokenMode) {
    this.cacheToken(mode, data.token);
    this.setSession(data);
    this.activateMode(mode);
  },

  saveCredentials(email: string, password: string, type: TokenMode) {
    sessionStorage.setItem("pagweb_creds", JSON.stringify({ email, password, type }));
  },

  getCredentials() {
    const creds = sessionStorage.getItem("pagweb_creds");
    return creds ? JSON.parse(creds) : null;
  },

  clearCredentials() {
    sessionStorage.removeItem("pagweb_creds");
  },

  getSession() {
    const token = localStorage.getItem("pagweb_token");
    const userStr = localStorage.getItem("pagweb_user");
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  },

  async fetchClientToken(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/User/login-cliente`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "*/*" },
      body: JSON.stringify({ email, password, mac: "" }),
    });
    if (!response.ok) {
      throw new Error("Falha ao obter sessão de cliente");
    }
    const data: AuthResponse = await response.json();
    if (data.user) {
      if (this.isEmpresaOwner()) {
        data.user.tipo = "Empresa";
      } else if (!data.user.tipo) {
        data.user.tipo = "Cliente";
      }
    }
    return data;
  },

  async fetchAdminToken(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/User/login-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "*/*" },
      body: JSON.stringify({ email, password, mac: "pagweb" }),
    });
    if (!response.ok) {
      throw new Error("Falha ao obter sessão administrativa");
    }
    const data: AuthResponse = await response.json();
    if (data.user) {
      data.user.tipo = "Empresa";
    }
    return data;
  },

  /** Troca o token ativo (cache ou novo login). Serializado para evitar corridas. */
  async switchToMode(mode: TokenMode): Promise<void> {
    if (this.activateMode(mode)) {
      const creds = this.getCredentials();
      if (creds) {
        this.saveCredentials(creds.email, creds.password, mode);
      }
      return;
    }

    if (switchInFlight) {
      await switchInFlight;
      if (this.activateMode(mode)) return;
    }

    const creds = this.getCredentials();
    if (!creds?.email || !creds?.password) {
      throw new Error("Credenciais não encontradas para alternar ambiente");
    }

    switchInFlight = (async () => {
      const data =
        mode === "client"
          ? await this.fetchClientToken(creds.email, creds.password)
          : await this.fetchAdminToken(creds.email, creds.password);

      if (mode === "admin") {
        this.setEmpresaOwnerFlag(true);
      }

      this.applyAuthResponse(data, mode);
      this.saveCredentials(creds.email, creds.password, mode);
    })();

    try {
      await switchInFlight;
    } finally {
      switchInFlight = null;
    }
  },

  /** Pré-carrega o outro token em background (dono de empresa). */
  prefetchAlternateToken(mode: TokenMode) {
    const creds = this.getCredentials();
    if (!creds?.email || !creds?.password) return;

    const alternate: TokenMode = mode === "client" ? "admin" : "client";
    if (this.getCachedToken(alternate)) return;

    const fetcher =
      alternate === "client" ? this.fetchClientToken : this.fetchAdminToken;

    fetcher
      .call(this, creds.email, creds.password)
      .then((data) => {
        if (alternate === "admin") this.setEmpresaOwnerFlag(true);
        this.cacheToken(alternate, data.token);
      })
      .catch(() => {
        /* pré-cache opcional; falha silenciosa */
      });
  },

  logout() {
    const currentHash = window.location.hash;
    const isBusinessRoute = currentHash.includes("/business");

    localStorage.removeItem("pagweb_token");
    localStorage.removeItem("pagweb_user");
    localStorage.removeItem(TOKEN_CLIENT_KEY);
    localStorage.removeItem(TOKEN_ADMIN_KEY);
    localStorage.removeItem(ACTIVE_MODE_KEY);
    localStorage.removeItem(EMPRESA_OWNER_KEY);
    localStorage.removeItem("pagweb_client_address_ok");
    localStorage.removeItem("pagweb_empresa_address_ok");
    this.clearCredentials();

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
    return user?.tipo;
  },
};
