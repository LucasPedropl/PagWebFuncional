# Relatório — Atualização API PagWeb (ago/2026) e impacto no frontend

> **Data:** 2026-08-19  
> **Escopo:** API PagWebV1 (`apps/PagWebFuncional/api`) + frontend PagWeb
> (`apps/PagWebFuncional`)  
> **Commits analisados:** `3ed0b44`, `c6c7c12` (dois últimos em `master`)  
> **OpenAPI:** sincronizado via MCP `openapi-pagwebv1`
> (`sincronizar_endpoints_api`)  
> **Tipo:** Diagnóstico + backlog de correções para implementação no front (e
> gaps na API)

---

## Sumário

1. [Veredito executivo](#1-veredito-executivo)
2. [Sincronização OpenAPI (o que mudou no Swagger)](#2-sincronização-openapi-o-que-mudou-no-swagger)
3. [Commit `3ed0b44` — rotas, UUID, módulos](#3-commit-3ed0b44--rotas-uuid-módulos)
4. [Commit `c6c7c12` — OTP Bixs e X-API-Key](#4-commit-c6c7c12--otp-bixs-e-x-api-key)
5. [Estado atual do frontend](#5-estado-atual-do-frontend)
6. [O que precisa mudar no frontend (obrigatório)](#6-o-que-precisa-mudar-no-frontend-obrigatório)
7. [Gaps na API PagWeb (bloqueiam o fluxo Admin)](#7-gaps-na-api-pagweb-bloqueiam-o-fluxo-admin)
8. [Bug backend Master — aprovação Payment/WhatsApp](#8-bug-backend-master--aprovação-paymentwhatsapp)
9. [O que NÃO precisa mudar](#9-o-que-não-precisa-mudar)
10. [Plano de implementação sugerido (para Claude)](#10-plano-de-implementação-sugerido-para-claude)
11. [Referências de código](#11-referências-de-código)

---

## 1. Veredito executivo

| Item                              | Status                                             |
| --------------------------------- | -------------------------------------------------- |
| POST de solicitação de integração | Front **já migrado** para rota correta             |
| Leitura de status (Admin)         | Front **desatualizado** — usa endpoint Master-only |
| OTP `VerificationCode` no POST    | Front **não envia** — API exige desde `c6c7c12`    |
| Endpoint send-code no PagWeb      | **Não existe** — bloqueio para fluxo completo      |
| Painel Master (lista/aprovar)     | Front ok na rota; backend pode falhar na Bixs      |
| Catálogo / assinar-plano          | Front já nas rotas novas do Swagger                |

**Conclusão:** o frontend precisa de mudanças **obrigatórias** em Controle de
Acesso (Admin). Sem isso, Integrações e gates Payment/WhatsApp quebram
silenciosamente. O OTP exige trabalho conjunto API + front (ou só API se
encapsular o send-code).

---

## 2. Sincronização OpenAPI (o que mudou no Swagger)

**Tool:** `openapi-pagwebv1` → `sincronizar_endpoints_api`  
**Data sync:** 2026-08-19T18:02:49Z  
**Total endpoints Swagger:** 122

O relatório marcou 122 endpoints como "modificados" (diff de parâmetros
idênticos — ruído). **Mudanças materialmente relevantes:**

### Endpoints removidos

| Método | Rota                                                     | Notas                                                     |
| ------ | -------------------------------------------------------- | --------------------------------------------------------- |
| `POST` | `/api/ControleAcessos`                                   | Substituído por `POST /api/v1/User/solicitar-acesso`      |
| `POST` | `/api/v1/Pagamento/confirmar`                            | Removido do Swagger                                       |
| `POST` | `/api/v1/User/assinar-plano/{idPlano}`                   | Substituído por body em `POST /api/v1/User/assinar-plano` |
| `GET`  | `/api/Categorias/empresa-categorias-privado/{idEmpresa}` | Substituído por rota sem `{idEmpresa}`                    |

### Endpoints novos / relevantes (já no Swagger pós-sync)

| Método | Rota                                | Role            | Uso                                            |
| ------ | ----------------------------------- | --------------- | ---------------------------------------------- |
| `POST` | `/api/v1/User/solicitar-acesso`     | Admin           | Criar solicitação ControleAcesso + client Bixs |
| `GET`  | `/api/v1/User/status-acesso`        | Admin           | Ler status da própria empresa (sem id na URL)  |
| `GET`  | `/api/ControleAcessos`              | Master          | Listar solicitações                            |
| `GET`  | `/api/ControleAcessos/{idcontrole}` | **Master only** | Detalhe (Payment, Whatsapp, etc.)              |
| `PUT`  | `/api/ControleAcessos/{idcontrole}` | Master          | Aprovar/recusar                                |

### Schema `ControleViewPost` (body de solicitar-acesso)

```csharp
// PagWebV1/Dtos/ControleView.cs
public class ControleViewPost
{
    public Estado Payment { get; set; }
    public Estado Whatsapp { get; set; }
    public int IdEmpresa { get; set; }
    public required string Password { get; set; }
    public required string VerificationCode { get; set; }  // ← NOVO (c6c7c12)
}
```

Enum `Estado`: `Ativo=0`, `Inativo=1`, `Solicitado=2`.

---

## 3. Commit `3ed0b44` — rotas, UUID, módulos

**Autor:** Alexssandro Borges Quintino  
**Data:** 2026-08-14 16:13 -0300  
**Mensagem:** Correção atualização api bix; conceder acesso app; ids UUID;
Controle de acesso whats e pagamento

### Mudanças principais

| Área                 | Antes                                          | Depois                                                          |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Solicitar acesso     | `POST /api/ControleAcessos` (Master,Admin)     | `POST /api/v1/User/solicitar-acesso` (Admin)                    |
| Status Admin         | `GET /api/ControleAcessos/{id}` (Master,Admin) | `GET /api/v1/User/status-acesso` (Admin)                        |
| Detalhe por id       | Master + Admin                                 | **Somente Master**                                              |
| `IdBixs`             | `int`                                          | `string?` (UUID Bixs)                                           |
| Aprovação Master     | Só `AtualizarAcesso` (pag-web)                 | + `SolicitarApp(idBixs, "payment"\|"message")` se módulos Ativo |
| WhatsApp base URL    | `.../v1/api/message/`                          | `.../v1/api/`                                                   |
| Bixs AtualizarAcesso | `POST .../plans`                               | `POST .../applications`                                         |

### Arquivos tocados

- `PagWebV1/Controllers/ControleAcessosController.cs` — remove POST; PUT com
  SolicitarApp; GET detalhe Master-only
- `PagWebV1/Controllers/UserAdminController.cs` — adiciona `solicitar-acesso` e
  `status-acesso`
- `PagWebV1/Controllers/WhatsAppController.cs` — base URL
- `PagWebV1/Models/ControleAcesso.cs` — `IdBixs` string
- `PagWebV1/Services/ExternalTokenManagerService.cs` — UUID, SolicitarApp,
  applications
- Migration `20260814165811_updatebixid`

---

## 4. Commit `c6c7c12` — OTP Bixs e X-API-Key

**Autor:** Alexssandro Borges Quintino  
**Data:** 2026-08-17 17:18 -0300  
**Mensagem:** Atualização credenciais api bixs e criação de conta na api bixs
(Verificação de email)

### Mudanças principais

| Área                    | Antes                                 | Depois                                          |
| ----------------------- | ------------------------------------- | ----------------------------------------------- |
| Auth Bixs (server-side) | Bearer via `TokenStorage`             | Header `X-API-Key` (`BixAPI:API-Key` em config) |
| Criar client Bixs       | Sem OTP                               | Body inclui `verification_code`                 |
| DTO POST                | Só Password                           | + `VerificationCode` required                   |
| Program.cs              | `TokenStorage` + `TokenRefreshWorker` | Removidos/comentados                            |

### Trecho relevante — `CriarAcesso`

```csharp
// ExternalTokenManagerService.cs
var requestBody = new {
    email = user.Email,
    name = user.Nome + " " + user.SobreNome,
    password = password,
    cellphone = user.Telefone,
    role = "client",
    verification_code = code
};
_httpClient.DefaultRequestHeaders.Add("X-API-Key", _configuration["BixAPI:API-Key"]);
await _httpClient.PostAsync("v1/api/directory/clients", content);
```

### Trecho relevante — `AtualizarAcesso` (aprovação pag-web)

```csharp
var requestBody = new { application_code = "pag-web" };
await _httpClient.PostAsync($"v1/api/directory/clients/{idBixs}/applications", content);
```

**Contrato Bixs External API (directory):** antes de criar client, é necessário
OTP via  
`POST /v1/api/directory/clients/verification/send-code` com `target_email` =
e-mail do client (admin PagWeb). OTP expira em 15 min, uso único.

---

## 5. Estado atual do frontend

### Já alinhado com a API nova

| Feature                     | Arquivo                                                      | Observação                                            |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| POST solicitar acesso       | `features/controle-acesso/services/controleAcessoService.ts` | Usa `POST /api/v1/User/solicitar-acesso`              |
| Admin upgrade módulos       | `features/admin-upgrade/services/adminUpgradeService.ts`     | Chama `controleAcessoService.requestAccess`           |
| Catálogo categorias privado | `features/catalog/services/categoriaService.ts`              | `GET .../empresa-categorias-privado/` (sem idEmpresa) |
| Assinar plano               | `services/userService.ts`                                    | `POST /User/assinar-plano` com body                   |
| Painel Master list/approve  | `features/integracoes/components/IntegracoesPanel.tsx`       | GET lista + PUT ControleAcessos                       |

### Desalinhado / quebrado

| Problema                                        | Arquivo(s)                                              | Sintoma                                               |
| ----------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| Admin lê status via `GET /ControleAcessos/{id}` | `controleAcessoService.getById`, `useControleAcesso.ts` | 403 Admin → form reaparece; gates Inativo             |
| Body sem `VerificationCode`                     | `controleAcessoService.requestAccess`                   | 400 ASP.NET (campo required)                          |
| UI sem campo OTP                                | `IntegracoesPanel.tsx`, `AdminUpgradeAddons.tsx`        | Usuário não consegue completar solicitação            |
| Dependência de `localStorage` id                | `controleAcessoStorage`, `useControleAcesso`            | Id stale + 403 limpa storage → perde estado           |
| `payInvoice` usa rota removida                  | `services/userService.ts` L671-684                      | **Código morto** (nenhuma tela chama) — limpar depois |

### Fluxo Admin quebrado (as-is)

```
Admin abre Integrações
  → useControleAcesso.refresh()
  → listMaster() → 403 (não é Master) → isMaster=false
  → getById(localStorage id) → GET /ControleAcessos/{id} → 403
  → clearStoredId(); myRequest=null
  → UI mostra formulário "Solicitar integração" mesmo com solicitação existente

Admin envia formulário
  → POST /User/solicitar-acesso { payment, whatsapp, password }  // sem VerificationCode
  → 400 Bad Request

Se POST passasse (ex.: backend relaxar validação)
  → getById(id retornado) → 403 de novo
  → useModuleAccess → Payment/WhatsApp sempre Inativo
```

### Fluxo Master (as-is)

```
Master abre Integrações
  → GET /ControleAcessos → lista ok
  → enrichMasterItem → GET /ControleAcessos/{id} → ok
  → Aprovar → PUT com estado Ativo
  → API chama Bixs AtualizarAcesso + SolicitarApp(payment/message)
  → Pode falhar 400 "Erro ao ativar Pagamento/WhatsApp" (ver seção 8)
```

---

## 6. O que precisa mudar no frontend (obrigatório)

### 6.1 — Novo método: `getMyStatus()` (Admin)

**Rota:** `GET /api/v1/User/status-acesso`  
**Auth:** Bearer token Admin  
**Resposta:** mesmo shape do detalhe ControleAcesso (IdControle, Payment,
Whatsapp, estado, NomeEmpresa, DataSolicitado, etc.)

**Onde implementar:**

- `features/controle-acesso/services/controleAcessoService.ts` — adicionar
  `getMyStatus(): Promise<ControleAcessoDetail | null>`
- `features/controle-acesso/hooks/useControleAcesso.ts` — no `refresh()`:
    - Se **não** Master: chamar `getMyStatus()` em vez de `getById(storedId)`
    - Tratar 404 como "sem solicitação" (formulário disponível)
    - Opcional: manter `storedId` só como cache, não como fonte de verdade

**Impacto:** corrige Integrações, `useModuleAccess`, banners de módulo
(`ModuleAccessBanner`), gates PIX/boleto/WhatsApp.

### 6.2 — Campo `verificationCode` no POST

**Rota:** `POST /api/v1/User/solicitar-acesso`  
**Body atual (front):**

```json
{
	"payment": 2,
	"whatsapp": 1,
	"idEmpresa": 0,
	"password": "..."
}
```

**Body exigido (API):**

```json
{
	"Payment": 2,
	"Whatsapp": 1,
	"IdEmpresa": 0,
	"Password": "...",
	"VerificationCode": "123456"
}
```

> Nota: ASP.NET Core geralmente aceita camelCase no JSON; confirmar com teste. O
> C# usa PascalCase nos DTOs.

**Onde implementar:**

- `features/controle-acesso/schemas/controleAcessoSchemas.ts` — adicionar
  `verificationCode` em `ControleAcessoRequestInputSchema`
- `controleAcessoService.requestAccess` — incluir no body
- `IntegracoesPanel.tsx` — input OTP (6 dígitos) + botão "Enviar código"
- `AdminUpgradeAddons.tsx` — mesmo campo se admin-upgrade solicitar módulos

### 6.3 — Fluxo OTP (depende da API)

O front **não pode** inventar o código. Opções:

| Opção     | Quem implementa   | Endpoint sugerido                                                                         |
| --------- | ----------------- | ----------------------------------------------------------------------------------------- |
| A (ideal) | API PagWeb        | `POST /api/v1/User/enviar-codigo-acesso` → proxy Bixs send-code no e-mail do admin logado |
| B         | Front direto Bixs | **Não fazer** — expõe integração Bixs e exige capability users no browser                 |
| C         | Manual temporário | Campo OTP + doc "peça código ao suporte" — só dev/staging                                 |

**Recomendação:** Opção A. Backend usa `X-API-Key` já configurada em
`ExternalTokenManagerService`.

### 6.4 — Ajustes menores

- Mensagens de erro: tratar 400 por `VerificationCode` ausente vs "Erro ao criar
  acesso" (Bixs)
- Após POST ok: refresh via `getMyStatus()` em vez de `getById(id)`
- Considerar remover ou deprecar `controleAcessoStorage` para Admin (Master pode
  manter para nada)

---

## 7. Gaps na API PagWeb (bloqueiam o fluxo Admin)

Estes itens **não são só frontend**. Registrar para Alex/backend se necessário:

1. **Sem endpoint send-code** — Admin não recebe OTP sem nova rota ou e-mail
   manual
2. **`VerificationCode` required** — quebra qualquer client antigo (inclui front
   atual)
3. **Config `BixAPI:API-Key`** — deve estar no ambiente de deploy
   (lojas.vlks.com.br); senão `CriarAcesso`/`AtualizarAcesso` falham sempre

Sugestão de contrato send-code (para backend):

```
POST /api/v1/User/enviar-codigo-acesso
Authorization: Bearer {admin}
Response 200: { "sent_to": "admin@email.com", "expires_in_seconds": 900 }
```

Implementação server-side:
`POST https://api.bixs.com.br/v1/api/directory/clients/verification/send-code`  
Body: `{ "target_email": "<email do User logado>", "role": "client" }`  
Header: `X-API-Key: {BixAPI:API-Key}`

---

## 8. Bug backend Master — aprovação Payment/WhatsApp

No `PUT /api/ControleAcessos/{id}` com `estado=Ativo`, se Payment ou Whatsapp =
Ativo, a API chama:

```csharp
await _apiBixs.SolicitarApp(controle.IdBixs, "payment");  // ou "message"
```

`SolicitarApp` faz:

```csharp
POST /v1/api/directory/clients/{idBixs}/capabilities
{ "application_code": "external-api", "capability_code": "payment" | "message" }
```

**Problema:** na External API Bixs v2, **client só pode receber capability
`agent`**.  
`payment`, `message`, `users`, `media` permanecem no **member**, não no client.

**Sintoma esperado:** PUT retorna 400 `"Erro ao ativar Pagamento!"` ou
`"Erro ao ativar Whatsapp!"` mesmo após `AtualizarAcesso` (pag-web) ok.

**Correção provável (backend):** remover ou repensar `SolicitarApp` para
payment/message; ou conceder capabilities no member dono, não no client PagWeb.
Ver docs Bixs em `api-docs-documentation.html` (folder 02-users/directory).

Relacionado ao relatório anterior:
`docs/relatorio_aprovacao_controle_acessos_2026-08-12.md` (caso PUT 400 "Erro ao
ativar acesso" — causa evoluiu com commits novos).

---

## 9. O que NÃO precisa mudar

| Item                              | Motivo                                       |
| --------------------------------- | -------------------------------------------- |
| Rota POST solicitar-acesso        | Front já usa                                 |
| `categoriaService.listPrivado()`  | Rota nova sem `{idEmpresa}`                  |
| `userService.assinarPlano`        | Body em `/User/assinar-plano`                |
| Painel Master GET lista + PUT     | Rotas corretas                               |
| E2E `empresa-categorias-privado/` | Já na rota nova (confirmar se testes passam) |

### Código morto (limpeza opcional)

- `userService.payInvoice` → `POST /Pagamento/confirmar` **removido** do
  Swagger; nenhum caller no repo

---

## 10. Plano de implementação sugerido (para Claude)

Ordem recomendada para minimizar regressão:

### Fase 1 — Desbloquear leitura Admin (front only)

1. `controleAcessoService.getMyStatus()` → `GET /api/v1/User/status-acesso`
2. Refatorar `useControleAcesso.refresh()`:
    - Master: fluxo atual (list + getById para enrich)
    - Admin: `getMyStatus()`; 404 = sem solicitação
3. Testar Integrações + gates em `/business/*` com conta Admin

**Arquivos:**

- `features/controle-acesso/services/controleAcessoService.ts`
- `features/controle-acesso/hooks/useControleAcesso.ts`
- (opcional) `features/controle-acesso/hooks/useModuleAccess.ts` — sem mudança
  se `myRequest` voltar correto

### Fase 2 — OTP (API + front)

**Se backend expuser send-code:**

4. API: `POST /api/v1/User/enviar-codigo-acesso` (proxy Bixs)
5. Front: `controleAcessoService.sendVerificationCode()`
6. Schema + UI: campo OTP 6 dígitos
7. `requestAccess`: incluir `verificationCode`
8. Telas: `IntegracoesPanel.tsx`, `AdminUpgradeAddons.tsx`

**Se backend NÃO puder agora:**

4. Documentar bloqueio; front Fase 1 ainda vale (mostra status de solicitações
   **já existentes**)
5. Novas solicitações continuam impossíveis até Fase 2

### Fase 3 — Hardening

9. Tratamento de erros específicos (403, 400 VerificationCode, "Erro ao criar
   acesso")
10. Remover dependência de `localStorage` para Admin
11. Limpar `payInvoice` / rota confirmar morta
12. Atualizar testes e2e se houver fluxo ControleAcesso

### Fase 4 — Backend (escopo Alex, não front)

13. Revisar `SolicitarApp(payment|message)` vs contrato Bixs
14. Garantir `BixAPI:API-Key` em produção
15. Migration `IdBixs` string aplicada em prod

---

## 11. Referências de código

### API (commits locais em `apps/PagWebFuncional/api`)

| Arquivo                                             | Responsabilidade                                 |
| --------------------------------------------------- | ------------------------------------------------ |
| `PagWebV1/Dtos/ControleView.cs`                     | DTOs POST/PUT                                    |
| `PagWebV1/Controllers/UserAdminController.cs`       | `solicitar-acesso`, `status-acesso`              |
| `PagWebV1/Controllers/ControleAcessosController.cs` | Master GET/PUT                                   |
| `PagWebV1/Services/ExternalTokenManagerService.cs`  | Bixs: CriarAcesso, AtualizarAcesso, SolicitarApp |

### Frontend

| Arquivo                                                      | Responsabilidade        |
| ------------------------------------------------------------ | ----------------------- |
| `features/controle-acesso/services/controleAcessoService.ts` | HTTP ControleAcesso     |
| `features/controle-acesso/hooks/useControleAcesso.ts`        | Estado + refresh        |
| `features/controle-acesso/hooks/useModuleAccess.ts`          | Gates Payment/WhatsApp  |
| `features/controle-acesso/schemas/controleAcessoSchemas.ts`  | Zod + enums             |
| `features/integracoes/components/IntegracoesPanel.tsx`       | UI solicitação + Master |
| `features/admin-upgrade/services/adminUpgradeService.ts`     | Upgrade + módulos       |
| `features/controle-acesso/components/ModuleAccessBanner.tsx` | Banner bloqueio         |

### Docs relacionados

- `docs/relatorio_aprovacao_controle_acessos_2026-08-12.md`
- `docs/relatorio_erro_solicitar_integracao_bixs_2026-08-13.md`
- Bixs External API: `api-docs-documentation.html` (root monorepo)

### Commits API (hashes completos)

```
c6c7c12c456e96a5dfb06e722e4fdd6ac2bf21c9  (2026-08-17) OTP + X-API-Key
3ed0b44e5f0b775313ed410c136b68f933e4c46c  (2026-08-14) Rotas + UUID + módulos
```

---

## Checklist rápido para quem for implementar

- [ ] Admin usa `GET /api/v1/User/status-acesso` (não
      `GET /ControleAcessos/{id}`)
- [ ] POST inclui `VerificationCode`
- [ ] UI coleta OTP + botão reenviar código
- [ ] API expõe send-code (ou workaround documentado)
- [ ] Testar Integrações como Admin após solicitação existente
- [ ] Testar gates Payment/WhatsApp (`useModuleAccess`)
- [ ] Testar admin-upgrade com módulos opcionais
- [ ] Master: validar PUT aprovar (pode falhar na Bixs — bug backend)
- [ ] Confirmar `BixAPI:API-Key` no ambiente alvo

---

_Relatório gerado para handoff à implementação (Claude). Não inclui alterações
de código — apenas diagnóstico e plano._
