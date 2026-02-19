
import { ActivatePayload, AppNotification, AuthResponse, ClientConnection, ClientInvoice, ClientSubscription, LoginPayload, RegisterPayload, SavedCard } from "../types";
import { sessionService } from "./session";
import { parseApiError } from "../utils/formatters";

const BASE_URL = "https://lojas.vlks.com.br/api/v1";

// Helper privado para requisições autenticadas
const authRequest = async (endpoint: string, options: RequestInit = {}) => {
  const { token } = sessionService.getSession();
  
  if (!token) {
    sessionService.logout();
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "accept": "*/*",
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  });

  if (response.status === 401) {
    sessionService.logout();
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  return response;
};

export const userService = {
  async register(data: RegisterPayload, companyId?: number): Promise<void> {
    const url = companyId 
      ? `${BASE_URL}/User/register?idEmpresa=${companyId}` 
      : `${BASE_URL}/User/register`;

    const response = await fetch(url, {
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
    const response = await fetch(`${BASE_URL}/User/activate`, {
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

    const response = await fetch(`${BASE_URL}/User/login-cliente`, {
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
    
    if (data.user && !data.user.tipo) {
      data.user.tipo = 'Cliente';
    }

    sessionService.setSession(data);
    return data;
  },

  async linkToCompany(companyId: number): Promise<void> {
    await authRequest('/User/conecta-empresa', {
      method: "POST",
      body: JSON.stringify(companyId)
    });
  },

  // --- NOTIFICAÇÕES (Compartilhado entre User e Business) ---
  async listNotifications(): Promise<AppNotification[]> {
    const response = await authRequest('/User/minhas-notificacoes', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  // --- NOVOS MÉTODOS DE DADOS DO CLIENTE ---

  async listConnections(): Promise<ClientConnection[]> {
    const response = await authRequest('/User/minhas-conexoes', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async listClientSubscriptions(): Promise<ClientSubscription[]> {
    const response = await authRequest('/User/minhas-assinaturas', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async listClientInvoices(): Promise<ClientInvoice[]> {
    // Nota: Endpoint é /Mensalidade/cliente, diferente do padrão /User
    const response = await authRequest('/Mensalidade/cliente', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  // Mock de cartões salvos (já que não há endpoint oficial documentado)
  async listSavedCards(): Promise<SavedCard[]> {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retorna dados mockados para demonstração
    return [
      { id: 'card_123', last4: '4242', brand: 'visa', holderName: 'PEDRO L MOTA', expiry: '12/28' },
      { id: 'card_456', last4: '8899', brand: 'mastercard', holderName: 'PEDRO L MOTA', expiry: '05/26' }
    ];
  },

  // --- AÇÕES DO CLIENTE (Cancelar, Pagar) ---

  async unlinkCompany(idEmpresa: number): Promise<void> {
    const response = await authRequest(`/User/desconecta-empresa/${idEmpresa}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao desvincular empresa.");
    }
  },

  async cancelSubscription(idAssinatura: number): Promise<void> {
    // Nota: Assumindo endpoint de update status ou delete lógico
    const response = await authRequest(`/Assinatura/${idAssinatura}`, {
        method: 'DELETE' // Ou PATCH se for apenas mudar status
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao cancelar assinatura.");
    }
  },

  async payInvoice(idMensalidade: number, metodo: number): Promise<void> {
      // Endpoint correto: /Pagamento/confirmar
      const response = await authRequest(`/Pagamento/confirmar`, {
          method: 'POST',
          body: JSON.stringify({ 
              idMensalidade, 
              metodo // 0: PIX, 1: Cartão, 2: Boleto (exemplo)
          })
      });

      if (!response.ok) {
          const msg = await parseApiError(response);
          throw new Error(msg || "Falha ao processar pagamento.");
      }
  }
};
