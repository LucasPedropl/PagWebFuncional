# PagWeb (PagWebFuncional) - Guia de Desenvolvimento e Arquitetura

Bem-vindo ao **PagWeb**! Este guia serve como o onboarding definitivo para qualquer desenvolvedor ou agente de IA que esteja iniciando no projeto. Ele detalha a arquitetura, as tecnologias utilizadas, as regras de segurança e as restrições estritas do ambiente de desenvolvimento.

---

## 1. Visão Geral do Projeto
O PagWeb é uma plataforma financeira integrada de gestão de mensalidades, faturamento, planos e relacionamento entre estabelecimentos comerciais (Business/Admin) e seus clientes (User/Cliente).

---

## 2. Stack Tecnológica (Frontend)
O frontend está localizado na pasta [apps/PagWebFuncional](file:///C:/codigo/uaipdv/uaipdv/apps/PagWebFuncional) e é composto pelas seguintes tecnologias:

* **Core**: React 19 & TypeScript (Strict Mode).
* **Build Tool**: Vite 6.
* **Estilização**: Tailwind CSS v4, utilizando PostCSS para processamento de estilos.
* **Roteamento**: `react-router-dom` utilizando `HashRouter` (necessário para compatibilidade com o servidor de arquivos estáticos).
* **Animações**: `motion` (Frammer Motion) para transições e micro-interações fluidas.
* **Utilitários de UI**: `lucide-react` para ícones consistentes.
* **Exportação e Mídia**:
  * `jspdf` & `html2canvas` para geração de relatórios e PDFs dinâmicos no cliente.
  * `xlsx` para exportações de dados financeiros para planilhas.
  * `qrcode.react` para renderização dinâmica de QRCodes de pagamento PIX.

---

## 3. Estrutura de Diretórios
O projeto segue uma organização estruturada por responsabilidades e domínios:

```
apps/PagWebFuncional/
├── app/                  # Rotas e Páginas (Smart Components)
│   ├── (auth)/           # Fluxo de Login, Registro e Ativação de conta
│   ├── (business)/       # Painel administrativo do Estabelecimento (Admin)
│   ├── (user)/           # Painel de operações do Cliente final (User)
│   ├── Landing.tsx       # Landing page institucional
│   └── CompanyDetails.tsx# Visualização pública da empresa e seus planos
├── components/           # Componentes de interface (Dumb Components)
│   ├── layout/           # Templates de Layout (AuthLayout, BusinessLayout, UserLayout)
│   └── ui/               # Componentes reutilizáveis (Inputs, Modais, Cards, etc.)
├── context/              # Provedores de estado global (ex: ToastContext)
├── data/                 # Massa de dados estáticos e mocks
├── docs/                 # Documentação e relatórios do projeto
│   └── relatorio_erros_backend.md # Relatório ativo de erros da API
├── services/             # Camada de comunicação com APIs externas
│   ├── api.ts            # Base HTTP e métodos de autenticação padrão
│   ├── session.ts        # Lógica de controle de tokens e transição de identidade
│   └── userService.ts    # Métodos de negócio do cliente final
├── utils/                # Funções de ajuda (formatadores, validadores, etc.)
├── types.ts              # Definições globais de interfaces TypeScript
└── App.tsx               # Roteador principal e injeção de contextos globais
```

---

## 4. Fluxos de Arquitetura Especiais

### A. Sessão com Dupla Identidade (Alternância Dinâmica)
O sistema suporta a transição dinâmica e transparente de papel para usuários que são proprietários de empresas. O usuário pode alternar entre o painel de **Cliente (User)** e o painel **Business (Admin)** sem precisar fazer logout.
* **Cache de Credenciais**: Credenciais de login (e-mail e senha) são mantidas em cache criptografado no `sessionStorage` (`pagweb_creds`).
* **Múltiplos Tokens**: O `localStorage` armazena chaves separadas para cada perfil:
  * `pagweb_token_client`: Token JWT para operações do cliente.
  * `pagweb_token_admin`: Token JWT para operações administrativas do estabelecimento.
* **Swapping Automático (`switchToMode`)**: Ao acessar rotas protegidas que exijam privilégios diferentes do ativo, o sistema intercepta a requisição, recupera as credenciais, executa um login transparente na API do backend correspondente (`/User/login-cliente` ou `/User/login-admin`), atualiza a sessão ativa e prossegue sem interrupção para o usuário.

### B. Componentes Customizados de Alta Fidelidade (Pasta `/components/ui/`)
* **`SearchSelect.tsx`**: Input dropdown com pesquisa local e remota integrada (obrigatório para seleção rápida em listagens extensas de planos e clientes).
* **`CreditCardVisual.tsx`**: Componente visual interativo que simula um cartão de crédito real, respondendo aos inputs de nome, número, validade e CVV.
* **`CameraCaptureModal.tsx`**: Acessa a API MediaDevices do navegador para captura de fotos de documentos através da câmera.
* **`SignaturePadModal.tsx`**: Captura assinaturas digitais desenhadas em tela via HTML5 Canvas.
* **`ToastContainer.tsx`**: Sistema customizado de notificações flutuantes. **É proibido o uso de `alert()` nativo do navegador.**

---

## 5. Regras Cruciais de Desenvolvimento

### 🚨 REGRA DE OURO: O BACKEND É SOMENTE LEITURA (READ-ONLY)

> [!CAUTION]
> **NUNCA, JAMAIS, EM HIPÓTESE ALGUMA modifique o código na pasta [apps/PagWebFuncional/api](file:///C:/codigo/uaipdv/uaipdv/apps/PagWebFuncional/api).**

A pasta `/api` contém uma cópia local do código da API escrita em C# (ASP.NET Core, EF Core, SQL Server). No entanto:
1. **O repositório oficial da API é separado (`PagWebV1`).**
2. **Alterações feitas na pasta local `/api` NÃO serão enviadas para produção nem homologação** (serão descartadas no deploy do frontend).
3. Modificações locais criam divergências perigosas em relação à fonte de verdade da API.

#### Como proceder ao encontrar erros na API/Backend?
Se você identificar falhas de runtime, erros de tratamento de nulos, falhas de segurança (vazamento cross-tenant) ou comportamentos incorretos nos endpoints da API:
1. **Apenas audite e analise** o código da API para entender a falha.
2. **NUNCA altere o código C#.**
3. **Registre a falha e a correção sugerida** no arquivo [apps/PagWebFuncional/docs/relatorio_erros_backend.md](file:///C:/codigo/uaipdv/uaipdv/apps/PagWebFuncional/docs/relatorio_erros_backend.md). Adicione seções detalhadas com o arquivo afetado, trecho problemático e a correção recomendada.

---

## 6. Testes e Auditoria com o Agent OS (MCP Proxy)

> [!TIP]
> O **Agent OS** possui uma integração ativa configurada para o PagWeb através do MCP **`openapi-pagwebv1`**.

* **Ferramenta Proxy**: IAs conectadas ao Agent OS podem invocar as ferramentas deste MCP para realizar chamadas reais à API em homologação, inspecionar o comportamento de rotas, verificar payloads de resposta e auditar segurança diretamente de dentro do chat da IDE.
* **Uso recomendado**: Utilize este MCP para testar as rotas correspondentes ao invés de codificar scripts de teste descartáveis ou usar clientes HTTP externos.

---

## 7. Decisões Importantes do Projeto

Toda decisão arquitetural, mudança de escopo técnica ou regra de negócio crucial deve ser documentada aqui e registrada no **Agent OS** (para que outras IAs tenham acesso imediato no início de suas tarefas).

### Como cadastrar uma nova decisão:
1. **No Agent OS**: Utilize a ferramenta `remember` com o parâmetro `kind="decision"`, especificando o tópico, a escolha e o racional.
2. **Neste README**: Adicione uma nova linha na tabela abaixo detalhando a decisão tomada.

### Histórico de Decisões Ativas:

| Data | Tópico / Título | Escolha Implementada / Diretriz | Racional / Motivação |
| :--- | :--- | :--- | :--- |
| 15/07/2026 | **Somente Leitura em `/api`** | Nenhuma alteração de código permitida em `apps/PagWebFuncional/api`. Apenas análises e logs em `docs/relatorio_erros_backend.md`. | O backend é gerenciado no repositório apartado `PagWebV1` e alterações locais não sobem para produção. |
| 15/07/2026 | **Integração com Agent OS** | Uso do MCP `openapi-pagwebv1` para testes de rotas da API em homologação/produção. | Facilita auditorias e previne a criação de scripts de teste descartáveis e isolados. |
| 13/07/2026 | **Login com MAC** | Login Business envia `mac="pagweb"`. Login Cliente envia `mac=""` (vazio). | Exigência da API/Bixs para identificação correta do tenant/estabelecimento no login. |

