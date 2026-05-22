# Diretrizes e Arquitetura do Frontend - PagWeb

Este documento fornece uma análise detalhada e profunda da arquitetura do Frontend do projeto **PagWeb**, documentando suas tecnologias, estrutura, fluxos de autenticação/sessão, componentes principais e padrões de codificação estabelecidos.

---

## 1. Stack Tecnológica
* **Core**: React 19, TypeScript (Strict).
* **Build Tool**: Vite 6.
* **Estilização**: Tailwind CSS v4, com PostCSS para processamento de estilos.
* **Roteamento**: `react-router-dom` (utilizando `HashRouter` para evitar problemas de roteamento no servidor de arquivos estáticos).
* **Ícones**: `lucide-react`.
* **Utilitários Adicionais**:
  * `motion` (para micro-animações fluidas).
  * `jspdf` & `html2canvas` (para geração de PDFs no lado do cliente).
  * `xlsx` (para exportação de planilhas).
  * `qrcode.react` (para geração de QRCodes PIX).

---

## 2. Estrutura de Diretórios e Responsabilidades
O projeto segue uma arquitetura orientada a domínios e separação de responsabilidades (Smart & Dumb Components):

```
/
├── app/                  # Rotas e páginas (Smart Components)
│   ├── (auth)/           # Fluxo de Autenticação (Login, Registro, Ativação)
│   ├── (business)/       # Painel da Empresa/Estabelecimento (Admin)
│   ├── (user)/           # Painel do Usuário Final (Cliente)
│   ├── Landing.tsx       # Página Institucional / Landing Page
│   └── CompanyDetails.tsx# Detalhes públicos da empresa e planos
├── components/           # Componentes de UI e Layout (Dumb Components)
│   ├── layout/           # Layouts comuns (AuthLayout, BusinessLayout, UserLayout)
│   └── ui/               # Componentes de interface reutilizáveis
├── context/              # Provedores de Estado Global (ex: ToastContext)
├── data/                 # Massa de dados estáticos / mocks (países, mock de empresas)
├── services/             # Camada de Integração de API (Serviços e Repositórios)
├── utils/                # Funções utilitárias (formatadores, criadores de PDF, etc.)
├── types.ts              # Definições globais de interfaces TypeScript
└── App.tsx               # Ponto de entrada de rotas e injeção de contextos
```

---

## 3. Fluxo de Sessão e Dupla Identidade (Alternância de Tokens)
Uma das principais inovações de arquitetura do frontend é o suporte a **dupla identidade** para usuários que são proprietários de empresas. O sistema permite transitar dinamicamente entre o painel de **Cliente (User)** e o painel **Business (Admin)** sem necessidade de realizar logout e login novamente.

### Lógica da Sessão (`services/session.ts`):
* **Credenciais em Cache**: Quando o usuário faz login, suas credenciais de e-mail e senha são armazenadas temporariamente em `sessionStorage` (`pagweb_creds`).
* **Tokens Separados**: Existem chaves separadas no `localStorage` para cada modo:
  * `pagweb_token_client`: Token JWT para operações de cliente.
  * `pagweb_token_admin`: Token JWT para operações administrativas.
* **Alternância Automática (`switchToMode`)**:
  * Quando o usuário acessa uma rota protegida por `<ClientRoute>` ou `<BusinessRoute>`, o respectivo guard verifica se o token ativo corresponde ao modo.
  * Se não corresponder, ele invoca `sessionService.switchToMode(mode)`.
  * O serviço recupera as credenciais temporárias, faz uma chamada à API correspondente (`/User/login-cliente` ou `/User/login-admin`) em background (serializado para evitar race conditions), atualiza o token ativo (`pagweb_token`) e redireciona de forma transparente.
* **Pré-carregamento (`prefetchAlternateToken`)**: Em background, após o login bem-sucedido de um administrador, o sistema pré-carrega o token do modo oposto para garantir transições instantâneas.

---

## 4. Componentes UI Especiais e Customizados
Para entregar uma experiência de alta fidelidade e premium, foram criados componentes customizados na pasta `components/ui/`:

1. **`SearchSelect.tsx`**: Input do tipo dropdown/select com pesquisa integrada obrigatória. Permite filtrar dinamicamente listas longas (como seleção de clientes ou planos) diretamente na UI.
2. **`CreditCardVisual.tsx`**: Renderização interativa de um cartão de crédito físico que responde a dados digitados (nome, número, validade, CVV, bandeira).
3. **`CameraCaptureModal.tsx`**: Captura fotos via webcam integrada diretamente no navegador usando a API MediaDevices.
4. **`SignaturePadModal.tsx`**: Painel interativo para captura de assinatura manuscrita digitalizada (via Canvas).
5. **`ToastContainer.tsx` / `ToastContext.tsx`**: Sistema próprio de alertas visuais e toasts flutuantes com animação de entrada/saída. **É terminantemente proibido o uso de `alert()` nativo** no sistema.

---

## 5. Integração com a API Externa
Todas as chamadas externas são mapeadas pela URL base definida em `utils/api.ts` (apontando para `https://lojas.vlks.com.br`).
* **Proxy de Desenvolvimento (`vite.config.ts`)**: Para contornar problemas de CORS durante o desenvolvimento local (rodando em `localhost:3000`), as requisições de arquivos/contratos com prefixo `/api-assets` são roteadas através do proxy do Vite para a URL da API real.
