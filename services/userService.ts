
import { ActivatePayload, AppNotification, AuthResponse, ClientConnection, ClientInvoice, ClientSubscription, LoginPayload, NotificationSettings, RegisterPayload, SavedCard, UserAccountResponse, UserUpdatePayload } from "../types";
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

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : (endpoint.startsWith('/api/') ? `https://lojas.vlks.com.br${endpoint}` : `${BASE_URL}${endpoint}`);

  const response = await fetch(url, {
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

    const formData = new FormData();
    formData.append('Nome', data.nome);
    formData.append('SobreNome', data.sobreNome);
    formData.append('Cpf', data.cpf);
    formData.append('Email', data.email);
    formData.append('Password', data.password);
    formData.append('Telefone', data.telefone);
    if (data.fotoPerfil) {
      formData.append('FotoPerfil', data.fotoPerfil);
    } else {
      formData.append('FotoPerfil', '');
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "*/*"
      },
      body: formData,
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
    const payload = {
      Email: email,
      Password: password,
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

  async getMyAccount(): Promise<UserAccountResponse> {
    const response = await authRequest('/User/minha-conta', {
      method: "GET"
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao obter dados da conta");
    }

    return await response.json();
  },

  async updateAccount(id: number, data: UserUpdatePayload): Promise<void> {
    const formData = new FormData();
    if (data.nome) formData.append('Nome', data.nome);
    if (data.sobreNome) formData.append('SobreNome', data.sobreNome);
    if (data.email) formData.append('Email', data.email);
    if (data.password) formData.append('Password', data.password);
    if (data.telefone) formData.append('Telefone', data.telefone);
    
    if (data.fotoPerfil !== undefined) {
      if (data.fotoPerfil) {
        formData.append('FotoPerfil', data.fotoPerfil);
      } else {
        formData.append('FotoPerfil', '');
      }
    }

    const response = await authRequest(`/User/${id}`, {
      method: "PATCH",
      body: formData
    });

    if (!response.ok) {
      const errorMessage = await parseApiError(response);
      throw new Error(errorMessage || "Falha ao atualizar conta");
    }
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

  async getSubscriptionNotificationSettings(idAssinatura: number): Promise<any> {
    const response = await authRequest(`/Notificacao/${idAssinatura}/assinatura`, { method: 'GET' });
    if (!response.ok) {
        return {
            usarConfigsGerais: true,
            notificacoes: true,
            notificacoesAtraso: 0,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
    try {
        return await response.json();
    } catch {
        return {
            usarConfigsGerais: true,
            notificacoes: true,
            notificacoesAtraso: 0,
            email: true,
            whatsApp: true,
            sms: true
        };
    }
  },

  async updateSubscriptionNotificationSettings(idAssinatura: number, settings: any): Promise<void> {
    const response = await authRequest(`/Notificacao/${idAssinatura}/assinatura`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao atualizar configurações de notificação da assinatura.");
    }
  },

  // --- NOVOS MÉTODOS DE DADOS DO CLIENTE ---

  async acceptConnection(idEmpresa: number): Promise<void> {
    const response = await authRequest(`/User/minha-conexao/${idEmpresa}`, {
      method: 'PATCH'
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

  async listCompanyPlans(idEmpresa: number): Promise<any[]> {
    const response = await authRequest(`/Plano/empresa/${idEmpresa}`, { method: 'GET' });
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
    const response = await authRequest('/api/Cartao/meus-cartoes', { method: 'GET' });
    if (!response.ok) return [];
    try {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
  },

  async createSavedCard(data: {
    nomeNoCartao: string;
    numCartao: string;
    ccv: string;
    bandeira: string;
    mesAnoExpiracao: string;
    isDefault: boolean;
  }): Promise<void> {
    const response = await authRequest('/api/Cartao/cadastrar', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao cadastrar cartão.");
    }
  },

  async updateSavedCard(id: number, data: {
    nomeNoCartao: string;
    numCartao: string;
    ccv: string;
    bandeira: string;
    mesAnoExpiracao: string;
    isDefault: boolean;
  }): Promise<void> {
    const response = await authRequest(`/api/Cartao/editar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        const msg = await parseApiError(response);
        throw new Error(msg || "Falha ao editar cartão.");
    }
  },

  async deleteSavedCard(id: number): Promise<void> {
    const response = await authRequest(`/api/Cartao/remover/${id}`, {
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
