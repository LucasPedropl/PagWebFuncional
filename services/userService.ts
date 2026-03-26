
import { ActivatePayload, AppNotification, AuthResponse, ClientConnection, ClientInvoice, ClientSubscription, LoginPayload, NotificationSettings, RegisterPayload, SavedCard } from "../types";
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
    const response = await authRequest('/Notificacao/pegar', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async markNotificationAsSeen(id: number): Promise<void> {
    const response = await authRequest(`/Notificacao/${id}/visto`, { method: 'PATCH' });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao marcar notificação como vista.");
    }
  },

  async deleteNotification(id: number): Promise<void> {
    const response = await authRequest(`/Notificacao/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao deletar notificação.");
    }
  },

  async clearAllNotifications(): Promise<void> {
    const response = await authRequest('/Notificacao/limpar-todas', { method: 'DELETE' });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao limpar notificações.");
    }
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await authRequest('/Notificacao/configuracoes/pesquisar', { method: 'GET' });
    if (!response.ok) {
        // Se der 404 ou erro, retorna padrão tudo true (conforme solicitado para implementar mesmo com erro)
        if (response.status === 404) {
            return {
                notificações: true,
                email: true,
                whatsApp: true,
                sms: true
            };
        }
        return {
            notificações: true,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
    try {
        return await response.json();
    } catch {
        return {
            notificações: true,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
  },

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    const response = await authRequest('/Notificacao/configuracoes/editar', {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao atualizar configurações de notificação.");
    }
  },

  // --- NOVOS MÉTODOS DE DADOS DO CLIENTE ---

  async acceptConnection(idEmpresa: number, emailEmpresa: string): Promise<void> {
    const response = await authRequest(`/User/minha-conexao/${idEmpresa}`, {
      method: 'PATCH',
      body: JSON.stringify(emailEmpresa)
    });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao aceitar conexão.");
    }
  },

  async acceptSubscription(idAssinatura: number): Promise<void> {
    const response = await authRequest(`/User/minha-assinatura/${idAssinatura}`, {
      method: 'PATCH',
      body: JSON.stringify("string")
    });
    if (!response.ok) {
      const msg = await parseApiError(response);
      throw new Error(msg || "Falha ao aceitar assinatura.");
    }
  },

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

  async listSavedCards(): Promise<SavedCard[]> {
    const response = await authRequest('/Cartao/meus-cartoes', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async createSavedCard(data: Omit<SavedCard, 'idCartao' | 'idUser'>): Promise<void> {
    const response = await authRequest('/Cartao/cadastrar', {
      method: 'POST',
      body: JSON.stringify({ ...data, idCartao: 0, idUser: 0 })
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao cadastrar cartão.");
    }
  },

  async updateSavedCard(id: number, data: Partial<SavedCard>): Promise<void> {
    const response = await authRequest(`/Cartao/editar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao editar cartão.");
    }
  },

  async deleteSavedCard(id: number): Promise<void> {
    const response = await authRequest(`/Cartao/remover/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao remover cartão.");
    }
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
