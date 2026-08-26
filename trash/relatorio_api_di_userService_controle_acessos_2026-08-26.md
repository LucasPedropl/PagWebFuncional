# Relatório — débitos abertos API PagWebV1 (ControleAcesso / Bixs / DI)

> **Data:** 2026-08-26  
> **Escopo:** API PagWebV1 — **não é bug do frontend**  
> **Referência histórica:**
> `docs/relatorio_api_controle_acesso_bixs_2026-08-19.md`  
> **Commits:** `c6c7c12` → `3ed0b44` → `7c04bf9`  
> **Natureza:** documentação read-only do estado atual do código em
> `apps/PagWebFuncional/api/PagWebV1`. Nenhum `.cs` foi alterado aqui.

---

## 0. Sintoma imediato (DI — P0 operacional)

> **Sintoma:** `pagweb-admin` em `/#/acessos` → `GET /api/ControleAcessos` →
> **500**  
> **Commit origem:** `7c04bf9` (2026-08-25)

### Erro (API)

```text
System.InvalidOperationException: Unable to resolve service for type
'PagWebV1.Services.UserService' while attempting to activate
'ControleAcessosController'.
```

O container DI **não consegue construir** o controller. Qualquer rota dele (GET
lista, GET detalhe, PUT, DELETE) quebra com 500 até corrigir.

### Causa raiz

No `7c04bf9`, o construtor passou a pedir a classe concreta `UserService`:

```csharp
// ControleAcessosController.cs
private readonly UserService _userService;
public ControleAcessosController(
    AppDbContext context,
    IExternalTokenManagerService apiBixs,
    UserService userService)  // ← concreto
```

No `Program.cs` só existe o registro pela **interface**:

```csharp
builder.Services.AddScoped<IUserService, UserService>();
```

ASP.NET Core resolve `IUserService`, **não** `UserService` isolado. Todos os
outros controllers (`UserAdminController`, `WhatsAppsController`, etc.) injetam
`IUserService` corretamente.

`UserService` só é usado no `catch` do PUT (log de erro) — o DI falha **antes**
de qualquer action (na ativação do controller).

### O que NÃO é

| Suspeita                         | Por quê descarta                            |
| -------------------------------- | ------------------------------------------- |
| Bug no pagweb-admin / proxy Vite | O 500 vem do body da API com stack .NET     |
| Auth Master / JWT                | A falha é DI; nem chega a executar a action |
| Front `listEnriched`             | Chamada correta; só propaga o 500           |

### Correção (API — Alex)

**Opção mínima (recomendada):** alinhar ao restante do projeto:

```csharp
private readonly IUserService _userService;
public ControleAcessosController(
    AppDbContext context,
    IExternalTokenManagerService apiBixs,
    IUserService userService)
```

**Alternativa:** registrar também o concreto (pior, duplica padrão):

```csharp
builder.Services.AddScoped<UserService>();
```

Depois de publicar a API, `GET /api/ControleAcessos` com token Master deve
voltar **200**.

### Impacto produto

- Painel Master do **pagweb-admin** (`/#/acessos`) inacessível enquanto a API
  local/prod estiver com esse build.
- Bloco Master embutido no PagWeb Integrações sofre o mesmo 500.
- Front recente (reativar módulos / aviso parcial) **não causa** esse erro; só
  fica inutilizável até o DI ser corrigido.

---

## 1. O que foi corrigido desde a auditoria de 19/08

Cruzamento do mapa de achados do relatório de 19/08 com o código atual
(`7c04bf9` + artefatos locais).

| # (19/08) | Achado original                                             | Status hoje | Evidência                                                                                         |
| --------- | ----------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| 1         | `X-API-Key` acumulava em `DefaultRequestHeaders`            | **FIXED**   | `CriarAcesso` / `AtualizarAcesso` / `SolicitarApp` usam `HttpRequestMessage` + header por request |
| 6         | `CriarAcesso` descartava client se `status` falso/ausente   | **FIXED**   | sucesso por `resultado.Id != null`; + recovery HTTP 409 “E-mail já cadastrado” via `LoginApiBix`  |
| 7         | Admin nunca re-solicitava após recusa                       | **PARTIAL** | reopen quando `estado == Inativo` → `Solicitado` (sem recriar `IdBixs` — ver §3)                  |
| 11        | `AddScoped` sobrescrito por `AddHttpClient` (ExternalToken) | **FIXED**   | só `AddHttpClient<IExternalTokenManagerService, …>` em `Program.cs`                               |
| 12        | `BixAPI:API-Key` ausente nos artefatos de config            | **FIXED\*** | presente em `appsettings.json` (\*segredo commitado — ver N6)                                     |
| 5         | PUT abortava e não persistia se `SolicitarApp` falhasse     | **PARTIAL** | soft-fail: marca módulo `Inativo` e **persiste**; ainda sem transação/compensação                 |
| 10        | `IdBixs` null → 404 “não encontrado”                        | **PARTIAL** | agora `400` com mensagem confusa (ver §3)                                                         |
| 4         | `AtualizarAcesso` → `JsonException` → 500                   | **PARTIAL** | `try/catch` evita 500; 204/vazio ainda vira `false` → 400                                         |

---

## 2. Ainda aberto (auditoria 19/08)

### P0 — bloqueiam fluxo

#### #16 — DI `UserService` concreto (novo no `7c04bf9`)

Ver seção **0**. Painel Master inteiro down.

#### #3 — Não existe endpoint de envio de OTP

`UserAdminController` tem `solicitar-acesso` e `status-acesso`. **Não há**
`POST /api/v1/User/enviar-codigo-acesso` (proxy de
`POST /v1/api/directory/clients/verification/send-code`).

`CriarAcesso` exige `verification_code`. O front já chama o endpoint e degrada
com aviso; sem o proxy, o Admin **não consegue** obter OTP de forma segura (a
chave Bixs não pode ir ao browser).

#### #2 — `SolicitarApp(payment|message)` viola contrato Bixs

Ainda presente:

```csharp
// ControleAcessosController PutControleAcesso
if (!await _apiBixs.SolicitarApp(controle.IdBixs, "payment"))  // …
if (!await _apiBixs.SolicitarApp(controle.IdBixs, "message")) // …
```

```csharp
// ExternalTokenManagerService.SolicitarApp
capability_code = app  // "payment" | "message"
POST .../clients/{id}/capabilities
```

Contrato Bixs: só `capability_code = "agent"` (ou remover a chamada). Payment /
message são capabilities do **member**, não do client. O acesso do client vem da
aplicação `pag-web` via `AtualizarAcesso`.

Combinado com o soft-fail do PUT → **N1** (aprovação “parcial” forçada).

### P1 — falha silenciosa / estado inconsistente

#### #4 — `AtualizarAcesso` e resposta 204/vazia (parcial)

Há `try/catch` (não vaza mais 500 por `JsonException`). Sucesso ainda exige body
JSON com `application_code == "pag-web"`. Se a Bixs responder **204 No Content**
(documentado como válido), cai em `return false` →
`400 "Erro ao ativar acesso."` mesmo com concessão efetiva.

#### #5 — PUT sem transação (parcial)

Falha de `SolicitarApp` não aborta mais o PUT. Se `AtualizarAcesso` = true e
`SaveChanges` falhar depois, Bixs fica com `pag-web` e PagWeb permanece
`Solicitado`. Sem `BeginTransaction` / compensação.

#### #7 — Reopen Inativo incompleto (parcial)

```csharp
if (existingControle != null && existingControle.estado == Estado.Inativo)
{
    existingControle.estado = Estado.Solicitado;
    existingControle.Payment = …;
    existingControle.Whatsapp = …;
    // não chama CriarAcesso; não valida/recria IdBixs; não atualiza Solicitado
    …
}
```

Admin consegue “pedir de novo”, mas registro órfão (`IdBixs == null`) sobe como
`Solicitado` e o PUT Master quebra (ver **N2**).

#### #8 — Zero logging das respostas Bixs

Em falhas HTTP 4xx/5xx, status e corpo são descartados (`return null` /
`return false`). Só `LogError(ex.Message)` em catch. O
`400 "Erro ao criar acesso."` continua opaco — mesmo problema de custo
diagnóstico do relatório de 19/08.

### P2 — contrato e configuração

#### #9 — `ControleViewPost.IdEmpresa` campo morto

Ainda no DTO; empresa vem só do claim / `UserEmpresas`. Correto em segurança;
Swagger continua enganoso.

#### #10 — mensagem quando `IdBixs` é null (parcial)

```csharp
if (string.IsNullOrEmpty(controle.IdBixs))
    return BadRequest("Não é possível atualizar IdBixs do Usuario não encontrado.");
```

Melhor que 404, mas a mensagem não orienta “refaça a solicitação / recriar
client na Bixs”.

### P3 — segurança fora do fluxo ControleAcesso

#### #13 — JWT signing key hardcoded em `Program.cs`

```csharp
var key = Encoding.UTF8.GetBytes("2(7Z*!kgEk6o1Hj)PgjJP(8J)03xX0Ry");
```

Há `JwtSettings:Key` na config — validação **não** usa. Ver **N5**.

#### #14 — CORS reflete qualquer origem + `AllowCredentials`

`SetIsOriginAllowed(origin => true)` + `AllowCredentials()` em `Program.cs`.

#### #15 — `UseDeveloperExceptionPage` e Swagger incondicionais

Há um bloco `if (IsDevelopment())` com Swagger, mas **fora** dele:

```csharp
app.UseDeveloperExceptionPage();
app.UseSwagger();
app.UseSwaggerUI(… RoutePrefix = string.Empty);
```

Stack traces e superfície Swagger na raiz em qualquer ambiente. O guard
Development virou código quase morto.

---

## 3. Bugs novos / agravados (reanálise 26/08)

Achados que **não** estavam no mapa de 19/08, ou mudaram de forma com o
`7c04bf9`.

### N1 — Aprovação “parcial” forçada (P0/P1 produto)

**Causa:** `#2` ainda aberto + soft-fail do PUT.

Master aprova com Payment/Whatsapp `Ativo` → `SolicitarApp` falha por contrato
Bixs → módulos gravados `Inativo`, `estado=Ativo`, HTTP **200** com mensagem do
tipo “Payment - Inativo, Whatsapp - Inativo”.

UI/Master vê “liberação parcial” como se a Bixs tivesse recusado o módulo; a
root cause é capability inválida, não recusa real. O front (pagweb-admin /
Integrações) já trata o 200 parcial — mas **não** resolve o bug da API.

### N2 — Reopen Inativo com `IdBixs == null` (P1)

Reopen (`#7` parcial) não chama `CriarAcesso` nem valida `IdBixs`. Registro
órfão (legado do antigo bug de `status`, ou falha antiga de criação) vira
`Solicitado` e o PUT Master cai no `#10`.

### N5 — Assinatura JWT ≠ validação (P2/P3)

`TolkenService` (ou equivalente) assina com `JwtSettings:Key` da config;
`Program.cs` valida com literal hardcoded. Hoje os valores coincidem —
**rotacionar só a config quebra auth** em todos os clientes.

### N6 — Segredos Bixs versionados em `appsettings.json` (P2 segurança)

Fix do `#12` introduziu `BixAPI:API-Key` (e Email/Password) no repo. Corrige
“chave ausente”; amplia superfície de vazamento se o git vazar.

### N8 — `DefaultRequestHeaders` residual (P2)

`CadatrarWebHook` / `LoginApiBix` ainda mutam `DefaultRequestHeaders`
(`Authorization` / `Accept`). Não reintroduz acumulação de `X-API-Key` nas rotas
directory, mas mantém anti-padrão e risco de Bearer + API-Key no mesmo ciclo de
vida do `HttpClient`.

### N9 — `UserService` + `HttpClient` sem typed client (P2 latente)

```csharp
public UserService(…, HttpClient httpClient, …)
```

Registrado só via `AddScoped<IUserService, UserService>()`, sem
`AddHttpClient<IUserService, UserService>()`. Não é o 500 do `#16`, mas é dívida
de DI frágil se o host não fornecer `HttpClient` de outro jeito.

---

## 4. Mapa resumo (estado 26/08)

| ID       | Severidade | Status  | Título                                                    |
| -------- | ---------- | ------- | --------------------------------------------------------- |
| #16 / §0 | P0         | ABERTO  | DI: `UserService` concreto no `ControleAcessosController` |
| #3       | P0         | ABERTO  | Sem `enviar-codigo-acesso` (OTP)                          |
| #2       | P0         | ABERTO  | `SolicitarApp(payment\|message)` ilegal na Bixs           |
| N1       | P0/P1      | NOVO    | Soft-fail força módulos Inativo com HTTP 200              |
| #4       | P1         | PARCIAL | 204/`AtualizarAcesso` → false → 400                       |
| #5       | P1         | PARCIAL | Sem transação pós-Bixs                                    |
| #7       | P1         | PARCIAL | Reopen Inativo sem `IdBixs`/OTP                           |
| N2       | P1         | NOVO    | Reopen com `IdBixs` null                                  |
| #8       | P1         | ABERTO  | Zero log corpo/status Bixs                                |
| #9       | P2         | ABERTO  | `IdEmpresa` morto no DTO                                  |
| #10      | P2         | PARCIAL | Mensagem 400 confusa                                      |
| N5       | P2/P3      | NOVO    | JWT config ≠ validação hardcoded                          |
| N6       | P2         | NOVO    | Segredos Bixs no git                                      |
| N8       | P2         | NOVO    | DefaultRequestHeaders residual                            |
| N9       | P2         | NOVO    | UserService HttpClient frágil                             |
| #13–#15  | P3         | ABERTO  | JWT hardcoded, CORS aberto, Swagger/exception em prod     |

**Corrigidos desde 19/08:** `#1`, `#6`, `#11`, `#12` (com ressalva N6), base do
`#7`, mitigação parcial de `#5`/`#10`/`#4`.

---

## 5. Prioridade sugerida (Alex)

1. **#16** — injetar `IUserService` (desbloqueia Master / pagweb-admin).
2. **#3** — proxy `POST /api/v1/User/enviar-codigo-acesso` → Bixs
   `verification/send-code`.
3. **#2 + N1** — remover `SolicitarApp(payment|message)` (ou só `agent`);
   módulos Payment/Whatsapp viram só estado local após `AtualizarAcesso`.
4. **#4** — tratar 204 / corpo vazio como sucesso em `AtualizarAcesso`.
5. **#8** — logar status + body Bixs em todos os caminhos de erro.
6. **#7 + N2** — reopen: se `IdBixs` null, recriar client (OTP); atualizar
   `Solicitado`.
7. **#13–#15 + N5/N6** — JWT da config + rotacionar; CORS allowlist;
   Swagger/exception só em Development; tirar segredos do git / usar env.

---

## 6. Veredito

- **Score fluxo ControleAcesso:** ~4/10
- **Status:** Flawed
- **Racional:** headers X-API-Key e `CriarAcesso` (id + 409) melhoraram de
  verdade; reopen Inativo e soft-fail PUT existem. Mas o caminho
  Admin→OTP→solicitação→Master→módulos **ainda não fecha**: DI derruba o painel
  Master, OTP não tem endpoint, e `SolicitarApp(payment|message)` continua
  ilegal — agora mascarado por HTTP 200 com módulos Inativo.
