# Relatório — Novo Fluxo de Autenticação e Onboarding Admin

> **Data:** 2026-07-09  
> **Escopo:** API PagWebV1 (`apps/PagWebFuncional/api`) + implicações no
> frontend  
> **Repositório da API:** [PagWebV1](https://github.com/UaiPDV/PagWebV1.git)  
> **Tipo:** Especificação técnica / análise de impacto (somente leitura na API
> local)

---

## Sumário

1. [Objetivo](#1-objetivo)
2. [Fluxo desejado](#2-fluxo-desejado)
3. [Fluxo atual (as-is)](#3-fluxo-atual-as-is)
4. [Bloqueadores identificados](#4-bloqueadores-identificados)
5. [Mudanças necessárias na API](#5-mudanças-necessárias-na-api)
6. [Contrato de request (body de login)](#6-contrato-de-request-body-de-login)
7. [Contrato de resposta (login-admin)](#7-contrato-de-resposta-login-admin)
8. [Novo endpoint de setup de empresa](#8-novo-endpoint-de-setup-de-empresa)
9. [JWT e policy de onboarding](#9-jwt-e-policy-de-onboarding)
10. [O que permanece inalterado (clientes)](#10-o-que-permanece-inalterado-clientes)
11. [O que descontinuar](#11-o-que-descontinuar)
12. [Impacto no frontend](#12-impacto-no-frontend)
13. [Migração de dados](#13-migração-de-dados)
14. [Prioridade de implementação](#14-prioridade-de-implementação)
15. [Mapa resumido](#15-mapa-resumido)
16. [Referências de código](#16-referências-de-código)

---

## 1. Objetivo

Redefinir o fluxo de autenticação de **administradores (estabelecimentos)** com
as seguintes regras:

| Regra                  | Descrição                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadastro admin externo | Admins são cadastrados **manualmente no sistema externo (Bixs)** — não há auto-cadastro local de estabelecimento                                   |
| Login único            | Admin faz login **apenas** via `POST /api/v1/User/login-admin` no PagWeb                                                                           |
| Onboarding obrigatório | No **primeiro login**, se não houver empresa local, exibir formulário **obrigatório** de cadastro de empresa — sem avançar no painel até preencher |
| Clientes inalterados   | Manter cadastro local de **usuários clientes** (`register` → `activate` → `login-cliente`)                                                         |

---

## 2. Fluxo desejado

```
(Bixs: cadastro manual do admin)
        │
        ▼
POST /api/v1/User/login-admin
  ├── Credenciais validadas no Bixs
  ├── Se User local não existe → provisionamento JIT (Just-In-Time)
  └── Resposta com requiresCompanySetup: true (se sem empresa)
        │
        ▼
Formulário obrigatório de empresa (frontend)
        │
        ▼
POST /api/v1/Empresa/setup-onboarding
  ├── Cria Empresa + vínculo UserEmpresa (Admin)
  ├── Vincula tokens Bixs na empresa
  └── Retorna token sem flag de onboarding
        │
        ▼
Dashboard business (acesso completo)
```

**Clientes** continuam em fluxo paralelo e independente:

```
POST /register → POST /activate → POST /login-cliente → painel cliente
```

---

## 3. Fluxo atual (as-is)

### 3.1 Admin / Estabelecimento

Não existe endpoint `register-admin`. O onboarding de negócio usa o **mesmo**
`POST /User/register` com fluxo multi-etapa no frontend.

**Frontend (`Register.tsx` + `Activate.tsx`):**

1. `/register?type=business` → 3 passos (dados pessoais, acesso, empresa).
2. `userService.register()` → `POST /User/register` (sem `idEmpresa`).
3. Após ativação (`Activate.tsx`):
    - `userService.login()` → **`login-cliente`** (não `login-admin`).
    - `companyService.create()` → `POST /api/v1/Empresa` com token **Cliente**.
    - `companyService.login()` → **`login-admin`**.

**`POST /api/v1/Empresa`** (`EmpresaController.cs`):

- Exige `[Authorize(Roles = "Cliente")]`.
- Cria `Empresa` + vínculo `UserEmpresa` com `UserTipo.Admin`.
- Empresa nasce via token de **cliente**, mas o usuário vira **admin** da
  empresa.

**`POST /api/v1/User/login-admin`** (`UserAdminController.cs`):

```
AuthenticateAsync(email, password)     → User local
Status != Inativo
TipoUser(id, AdminLogin=true)          → UserEmpresa com UserTipo.Admin
VerificaAcesso(dto, tipouser.IdEmpresa) → Bixs + grava tokens na Empresa
GenerateToken(user, "Admin")           → JWT
```

Resposta atual:

```json
{
	"token": "...",
	"user": { "nome": "...", "email": "..." }
}
```

### 3.2 Cliente

| Etapa    | Endpoint                          | Comportamento                                             |
| -------- | --------------------------------- | --------------------------------------------------------- |
| Registro | `POST /api/v1/User/register`      | Cria `User` com `Status=Pendente`, envia token por e-mail |
| Ativação | `POST /api/v1/User/activate`      | `Status=Ativo`                                            |
| Login    | `POST /api/v1/User/login-cliente` | JWT role `Cliente`                                        |

**Registro via convite** (`POST /register?idEmpresa={id}`): cria usuário já
ativo + vínculo `UserTipo.Cliente`.

### 3.3 Integração Bixs

`ExternalTokenManagerService.VerificaAcesso`:

- `POST https://api.bixs.com.br/v1/auth/login` com as **mesmas** credenciais do
  login PagWeb.
- Em sucesso: busca `Empresa` por `idEmpresa`, grava `ExternalToken`,
  `ExternalTokenPermanent`, `ExternalTokenExpiresAt`, opcionalmente registra
  webhook.
- Falha → retorna `"Erro"` → `login-admin` responde `401`.

---

## 4. Bloqueadores identificados

### 4.1 Bug crítico — `NullReferenceException` no `login-admin`

**Arquivo:** `Controllers/UserAdminController.cs` (linha 46)

```csharp
if (tipouser == null && tipouser.UserTipo != UserTipo.Admin)
    return Unauthorized(new { message = "Usuario não encontrado" });
```

- Operador `&&` incorreto: quando `tipouser == null`, o C# ainda avalia
  `tipouser.UserTipo` → **HTTP 500**.
- Correção mínima: trocar `&&` por `||`.
- Mesmo corrigido, admin sem empresa recebe `401` — não chega ao formulário de
  onboarding.

### 4.2 Admin sem empresa não consegue logar

`TipoUser(true)` (`UserService.cs` L211–212) exige registro em `UserEmpresas`
com `UserTipo.Admin`.

No primeiro login de um admin cadastrado só no Bixs (sem empresa local),
`tipouser` é `null` → fluxo quebra.

**Conflito direto** com o requisito de formulário obrigatório no primeiro login.

### 4.3 Dependência Bixs síncrona e dependente de `idEmpresa`

```csharp
var tokenexterno = await _apiBixs.VerificaAcesso(dto, tipouser.IdEmpresa);
```

- `VerificaAcesso` precisa de `idEmpresa` e de linha em `Empresas` para
  persistir tokens.
- Sem empresa → não há `idEmpresa` → Bixs não pode ser vinculado no login.
- Mesmo com empresa, se credenciais PagWeb ≠ Bixs → login admin falha com
  `"Erro ao verificar acesso ao sistema externo."`.

### 4.4 Não há provisionamento local a partir do Bixs

`AuthenticateAsync` valida **somente** `User` local + `PasswordHash`.

Se o admin existe **apenas** no Bixs:

- `login-admin` falha em `"E-mail ou senha inválidos"`.
- Não há endpoint, worker ou uso de credenciais de serviço `BixAPI` para
  criar/sincronizar `User` local.

### 4.5 Auto-cadastro de admin ainda é o caminho principal

| Camada             | Evidência                                                                              |
| ------------------ | -------------------------------------------------------------------------------------- |
| API                | `POST /User/register` sem distinção de tipo; qualquer um pode registrar                |
| Frontend           | `/register?type=business`, `AccessPathCards.tsx`, link "Criar conta" no login business |
| Onboarding empresa | `EmpresaController.Create` exige role `Cliente`, não `Admin`                           |

### 4.6 `POST /Empresa` incompatível com login admin-first

- Role exigida: `Cliente`.
- Novo fluxo: admin loga com JWT `Admin` **sem** empresa → precisa criar empresa
  com token admin.
- Hoje só funciona no hack: `login-cliente` → `POST Empresa` → `login-admin`.

### 4.7 Outros pontos relevantes

| Item                         | Detalhe                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `TipoUser(true)`             | `FirstOrDefaultAsync` — admin com múltiplas empresas usa só a primeira                     |
| JWT sem estado de onboarding | Frontend não sabe se deve forçar cadastro de empresa                                       |
| `GET minha-empresa`          | Retorna 404 sem vínculo admin — inútil sem token admin válido                              |
| Dual-token no frontend       | `session.ts` alterna `login-cliente` / `login-admin`; onboarding business depende dos dois |

---

## 5. Mudanças necessárias na API

> **Nota:** Alterações devem ser implementadas no repositório
> [PagWebV1](https://github.com/UaiPDV/PagWebV1.git). A cópia em
> `apps/PagWebFuncional/api` é somente referência local.

### 5.1 `POST /api/v1/User/login-admin` — redesenhar

**Arquivo:** `Controllers/UserAdminController.cs`

| #   | Mudança                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------- | --- | ---------------------- |
| 1   | Corrigir condição L46 (`&&` → `                                                                                   |     | `) — mínimo necessário |
| 2   | Separar autenticação PagWeb da validação Bixs                                                                     |
| 3   | Fase 1: validar credenciais (local e/ou Bixs + JIT)                                                               |
| 4   | Fase 2: se **sem** `UserEmpresa` admin → emitir JWT com flag de onboarding; **não** chamar `VerificaAcesso` ainda |
| 5   | Fase 3: se **com** empresa → chamar vinculação Bixs (ou lazy na primeira operação de pagamento)                   |
| 6   | Expandir corpo da resposta (ver [seção 7](#7-contrato-de-resposta-login-admin))                                   |

### 5.2 `UserService` — novos/alterados métodos

**Arquivos:** `Services/UserService.cs`, `Services/IUserService.cs`

| Método                                              | Propósito                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `AuthenticateAdminAsync(email, password)`           | Valida local; se ausente, valida Bixs e faz **JIT provision** de `User` + `UserConfigs` |
| `HasAdminCompanyAsync(idUser)`                      | `AnyAsync` em `UserEmpresas` com `UserTipo.Admin` e `Status=Ativo`                      |
| `GetAdminCompanyVinculoAsync(idUser)`               | Substitui uso cego de `FirstOrDefault` quando multi-empresa importar                    |
| `CreateAdminCompanyAsync(idUser, EmpresaCreateDto)` | Transação: cria `Empresa`, vínculo `UserEmpresa.Admin`, vincula Bixs                    |

**`TipoUser`:** para `AdminLogin=true` com onboarding, retornar `null` sem ser
erro fatal; ou novo método `GetAdminVinculoOrNull`.

### 5.3 `ExternalTokenManagerService` — separar responsabilidades

**Arquivo:** `Services/ExternalTokenManagerService.cs`

| Mudança                                         | Motivo                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `ValidarCredenciaisBixsAsync(dto)`              | Só validar credenciais Bixs no login (retornar tokens temporários ou bool)   |
| `VincularTokensEmpresaAsync(idEmpresa, tokens)` | Gravar tokens + webhook **após** criação da empresa                          |
| Refatorar `VerificaAcesso(dto, idEmpresa)`      | Usar os métodos acima internamente; `idEmpresa` obrigatório só na vinculação |

### 5.4 DTOs — adicionar

**Arquivo sugerido:** `Dtos/UserDtos.cs` ou novo `Dtos/AuthDtos.cs`

```csharp
public class AdminLoginResponseDto
{
    public string Token { get; set; }
    public UserSummaryDto User { get; set; }
    public bool RequiresCompanySetup { get; set; }
    public int? IdEmpresa { get; set; }
    public string? OnboardingStep { get; set; }  // "company_registration"
    public bool BixsAuthenticated { get; set; }
    public bool BixsLinked { get; set; }
}
```

`EmpresaCreateDto` existente permanece adequado para o formulário obrigatório.

---

## 6. Contrato de request (body de login)

Campo `mac` identifica a origem da autenticação perante o sistema externo (Bixs).

| Fluxo | Endpoint | `mac` | Observação |
| ----- | -------- | ----- | ---------- |
| Estabelecimento (`#/login?type=business`) | `POST /api/v1/User/login-admin` | `"pagweb"` | Fixo no frontend; usuário não digita |
| Cliente (`#/login?type=client`) | `POST /api/v1/User/login-cliente` | `""` (vazio) | Permitido omitir ou enviar string vazia |

### Business / admin

```json
{
  "email": "admin@empresa.com",
  "password": "••••••••",
  "mac": "pagweb"
}
```

### Cliente

```json
{
  "email": "cliente@email.com",
  "password": "••••••••",
  "mac": ""
}
```

**Frontend já alinhado:** `companyService.login`, `session.fetchAdminToken` → `mac: "pagweb"`; `userService.login`, `session.fetchClientToken` → `mac: ""`.

**API (cópia local):** `UserLoginDto` em `Dtos/UserDtos.cs` ainda só tem `Email` + `Password`. A API em produção precisa aceitar/propagar `mac` (ex.: refresh Bixs hoje usa `mac` hardcoded `"docs"` em `ExternalTokenManagerService`). Sem alterar a API neste repo — apenas relatório.

---

## 7. Contrato de resposta (login-admin)

### Primeiro login — sem empresa

```json
{
	"token": "eyJ...",
	"user": {
		"idUser": 42,
		"nome": "João",
		"email": "admin@loja.com",
		"tipo": "Admin"
	},
	"requiresCompanySetup": true,
	"onboardingStep": "company_registration",
	"idEmpresa": null,
	"bixsAuthenticated": true,
	"bixsLinked": false
}
```

### Login normal — com empresa

```json
{
	"token": "eyJ...",
	"user": {
		"idUser": 42,
		"nome": "João",
		"email": "admin@loja.com",
		"tipo": "Admin"
	},
	"requiresCompanySetup": false,
	"onboardingStep": null,
	"idEmpresa": 34,
	"bixsAuthenticated": true,
	"bixsLinked": true
}
```

### Claims JWT sugeridas

| Claim                    | Valores                         | Uso                    |
| ------------------------ | ------------------------------- | ---------------------- |
| `requires_company_setup` | `true` / `false`                | Policy de onboarding   |
| `id_empresa`             | int ou ausente                  | Quando vínculo existir |
| `onboarding_step`        | `company_registration` ou vazio | Roteamento no frontend |

---

## 8. Novo endpoint de setup de empresa

### `POST /api/v1/Empresa/setup-onboarding` (recomendado)

Criar endpoint dedicado em vez de alterar o `Create` existente.

| Aspecto      | Especificação                                                                   |
| ------------ | ------------------------------------------------------------------------------- |
| Autorização  | `[Authorize(Roles = "Admin")]`                                                  |
| Pré-condição | `!HasAdminCompanyAsync(idUser)` — só aceita admin **sem** empresa               |
| Body         | `EmpresaCreateDto` (`Nome`, `Cnpj`, `Telefone`, `Logo`) — `multipart/form-data` |
| Ações        | Cria `Empresa` → `UserEmpresa` (Admin, Ativo) → `VincularTokensEmpresaAsync`    |
| Resposta     | Empresa criada + novo JWT com `requiresCompanySetup: false`                     |
| Idempotência | Se admin já tem empresa ativa → `409 Conflict`                                  |

### `POST /api/v1/Empresa` (existente)

| Opção        | Descrição                                                         |
| ------------ | ----------------------------------------------------------------- |
| Manter       | Para compatibilidade temporária com fluxo antigo (`role Cliente`) |
| Descontinuar | Quando frontend remover `/register?type=business`                 |

---

## 9. JWT e policy de onboarding

### Problema

Sem policy, admin sem empresa receberia JWT com role `Admin` plena e poderia
chamar endpoints que falham de forma inconsistente em `TipoUser`.

### Solução recomendada

Policy `AdminOnboardingOnly` quando `requires_company_setup = true`:

**Permitido:**

- `POST /Empresa/setup-onboarding`
- `GET /User/minha-conta`
- `PATCH /User/{id}` (dados pessoais complementares, se necessário)

**Bloqueado:**

- Planos, cobranças, produtos, serviços, categorias
- WhatsApp, pagamentos, relatórios
- Qualquer endpoint que exija `IdEmpresa` via `TipoUser`

---

## 10. O que permanece inalterado (clientes)

| Endpoint                                 | Status                                 |
| ---------------------------------------- | -------------------------------------- |
| `POST /api/v1/User/register`             | Manter — registro livre de cliente     |
| `POST /api/v1/User/register?idEmpresa=X` | Manter — convite do admin para cliente |
| `POST /api/v1/User/activate`             | Manter                                 |
| `POST /api/v1/User/login-cliente`        | Manter                                 |

Opcional na API: rejeitar registro com indicador `isBusiness` se o frontend
ainda enviar — reforço extra, não obrigatório se o frontend remover o fluxo
business.

---

## 11. O que descontinuar

### Produto / UX

| Item                                                                  | Motivo                                        |
| --------------------------------------------------------------------- | --------------------------------------------- |
| `/register?type=business`                                             | Admin não se auto-cadastra mais               |
| Fluxo `Activate` com `companyData` + `login-cliente` + `POST Empresa` | Substituído por `login-admin` → setup empresa |
| Link "Criar conta" para estabelecimento na landing                    | Apontar apenas para login business            |

### API (após migração do frontend)

| Item                                                  | Ação                       |
| ----------------------------------------------------- | -------------------------- |
| `POST /Empresa` com role `Cliente` para onboarding    | Descontinuar ou restringir |
| `POST conecta-admin/{id}` sem `[Authorize]` explícito | Revisar segurança          |

---

## 12. Impacto no frontend

> Implementação no monorepo `apps/PagWebFuncional` (fora do escopo da API
> PagWebV1).

| Arquivo / Área                              | Mudança necessária                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `types.ts` → `AuthResponse`                 | Adicionar `requiresCompanySetup`, `idEmpresa`, `onboardingStep`, `bixsLinked`  |
| `services/session.ts` / `companyService.ts` | Tratar flags no retorno de `login-admin`                                       |
| `App.tsx` → `BusinessRoute`                 | Guard: se `requiresCompanySetup` → bloquear rotas business exceto onboarding   |
| Nova rota                                   | `/business/onboarding/empresa` — formulário bloqueante (sem skip)              |
| `app/(auth)/Register.tsx`                   | Remover fluxo `type=business` e `companyData`                                  |
| `app/(auth)/Activate.tsx`                   | Remover `companyService.create` + `companyService.login` pós-ativação business |
| `app/(auth)/Login.tsx`                      | Após `companyService.login`, redirecionar para onboarding se flag ativa        |
| `AccessPathCards.tsx` / landing             | "Cadastrar estabelecimento" → `/login?type=business` apenas                    |
| `services/companyService.ts`                | Novo método `setupOnboarding()` → `POST /Empresa/setup-onboarding`             |

### Comportamento esperado no frontend

```
login-admin OK + requiresCompanySetup=true
  → salvar token
  → redirect /business/onboarding/empresa
  → usuário NÃO acessa dashboard, planos, etc.

setup-onboarding OK
  → atualizar token (sem flag)
  → redirect /business/dashboard
```

---

## 13. Migração de dados

| Cenário                                                | Tratamento                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| Admins do fluxo antigo (já têm `User` + `UserEmpresa`) | `requiresCompanySetup: false` no login                         |
| Admins só no Bixs (novo modelo)                        | JIT no primeiro `login-admin` bem-sucedido no Bixs             |
| Empresas sem tokens Bixs                               | `VincularTokensEmpresaAsync` no setup preenche retroativamente |
| Clientes existentes                                    | Sem migração                                                   |
| Convites `register?idEmpresa`                          | Sem migração                                                   |

### Campos no JIT (definir com time Bixs)

Ao provisionar `User` local a partir do Bixs, definir origem de:

- `Nome`, `SobreNome`
- `Cpf`, `Telefone`
- `PasswordHash` (espelhar hash ou marcar como autenticação exclusiva Bixs)

---

## 14. Prioridade de implementação

| Ordem | Item                                                             | Responsável    |
| ----- | ---------------------------------------------------------------- | -------------- |
| 1     | `ValidarCredenciaisBixsAsync` + JIT de `User` local              | API (PagWebV1) |
| 2     | Redesenhar `login-admin` — admin sem empresa + flags na resposta | API            |
| 3     | `POST /Empresa/setup-onboarding`                                 | API            |
| 4     | Vincular Bixs após empresa (lazy)                                | API            |
| 5     | Policy JWT de onboarding                                         | API            |
| 6     | Corrigir NRE linha 46 (se não incluído no redesign)              | API            |
| 7     | Frontend — remover register business + guard + formulário        | Frontend       |
| 8     | Testes de regressão — fluxo cliente inalterado                   | QA             |

---

## 15. Mapa resumido

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO ATUAL (business)                   │
├─────────────────────────────────────────────────────────────────┤
│  register → activate → login-cliente → POST Empresa [Cliente]   │
│                                              → login-admin       │
│                                         [exige Admin + Bixs]     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       FLUXO DESEJADO (admin)                    │
├─────────────────────────────────────────────────────────────────┤
│  (Bixs: cadastro manual)                                        │
│       → login-admin [Bixs + JIT User?]                          │
│       → requiresCompanySetup=true                               │
│       → POST Empresa/setup-onboarding [Admin]                   │
│       → Bixs link → requiresCompanySetup=false → dashboard      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO INALTERADO (cliente)                   │
├─────────────────────────────────────────────────────────────────┤
│  register → activate → login-cliente → painel cliente           │
└─────────────────────────────────────────────────────────────────┘
```

### Desacoplamento necessário

Hoje três dependências estão amarradas no mesmo `login-admin`:

1. **Autenticação Bixs** (quem é admin)
2. **Existência de empresa local**
3. **Vínculo de tokens Bixs na empresa**

No novo modelo:

| Dependência                | Quando                                                       |
| -------------------------- | ------------------------------------------------------------ |
| (1) Autenticação Bixs      | No login — obrigatória                                       |
| (2) Empresa local          | No formulário de onboarding — obrigatória antes do dashboard |
| (3) Tokens Bixs na empresa | Após setup da empresa — lazy                                 |

---

## 16. Referências de código

| Arquivo                                   | Relevância                                       |
| ----------------------------------------- | ------------------------------------------------ |
| `Controllers/UserAdminController.cs`      | `login-admin`, bug L46, Bixs síncrono            |
| `Controllers/UserController.cs`           | `register`, `activate`, `login-cliente`          |
| `Controllers/EmpresaController.cs`        | `POST /Empresa` com role `Cliente`               |
| `Services/UserService.cs`                 | `AuthenticateAsync`, `TipoUser`, `RegisterAsync` |
| `Services/ExternalTokenManagerService.cs` | `VerificaAcesso`, integração Bixs                |
| `Services/TolkenService.cs`               | Geração de JWT                                   |
| `Program.cs`                              | Configuração JWT / policies                      |
| `Dtos/EmpresaDtos.cs`                     | `EmpresaCreateDto` para formulário               |
| `app/(auth)/Register.tsx`                 | Fluxo business atual                             |
| `app/(auth)/Activate.tsx`                 | Criação de empresa pós-ativação                  |
| `app/(auth)/Login.tsx`                    | Login business                                   |
| `services/session.ts`                     | Dual-token cliente/admin                         |
| `services/companyService.ts`              | `create`, `login`                                |

---

## Documentos relacionados

- [`relatorio_erros_backend.md`](./relatorio_erros_backend.md) — erros
  conhecidos na API atual (inclui NRE no `login-admin` e bloqueio Bixs)
- [`novos_endpoints.md`](./novos_endpoints.md) — catálogo de endpoints de
  produtos, serviços e cobranças
