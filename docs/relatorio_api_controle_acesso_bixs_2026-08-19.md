# Relatório de auditoria — API PagWebV1: Controle de Acesso e integração Bixs

> **Data:** 2026-08-19 **Repo:** `apps/PagWebFuncional/api` (PagWebV1, .NET 8) —
> repositório git próprio **HEAD analisado:** `c6c7c12` (2026-08-17) · anterior
> `3ed0b44` (2026-08-14) **Fonte de contrato:** doc oficial da Bixs External API
> (`api-docs-documentation.html`, raiz do monorepo) **Natureza:** auditoria
> read-only. **Nenhum arquivo `.cs` foi alterado.** Os patches abaixo são
> propostas prontas para colar.

---

## Sumário

1. [Veredito](#1-veredito)
2. [Mapa de achados](#2-mapa-de-achados)
3. [P0 — bloqueiam o fluxo hoje](#3-p0--bloqueiam-o-fluxo-hoje)
4. [P1 — falha silenciosa e estado inconsistente](#4-p1--falha-silenciosa-e-estado-inconsistente)
5. [P2 — contrato e configuração](#5-p2--contrato-e-configuração)
6. [P3 — segurança fora do fluxo](#6-p3--segurança-fora-do-fluxo)
7. [Patches propostos](#7-patches-propostos)
8. [Ordem de aplicação sugerida](#8-ordem-de-aplicação-sugerida)
9. [Como validar](#9-como-validar)

---

## 1. Veredito

- **Score:** 4/10
- **Status:** Flawed
- **Racional:** as rotas novas (`solicitar-acesso`, `status-acesso`) estão
  corretas e bem desenhadas, mas a camada de integração com a Bixs tem **três
  defeitos que, sozinhos, já impedem o fluxo de ponta a ponta**: header de
  autenticação duplicado, uma capability que a Bixs recusa por contrato, e a
  ausência do endpoint de OTP sem o qual `solicitar-acesso` é inalcançável.
  Some-se a isso o zero logging das respostas da Bixs, que transforma toda falha
  em um `400 "Erro ao criar acesso."` opaco — é por isso que esse bug já rendeu
  três relatórios sem causa raiz fechada.

O que está bom e merece crédito: a separação `Master` (lista/detalhe/aprovação)
× `Admin` (solicita/consulta o próprio status) está correta, e derivar a empresa
do claim do token em vez de confiar no `IdEmpresa` do body é a decisão certa de
segurança.

---

## 2. Mapa de achados

| #   | Severidade | Achado                                                                    | Arquivo                                               |
| --- | ---------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | **P0**     | `X-API-Key` acumula valores no `DefaultRequestHeaders`                    | `Services/ExternalTokenManagerService.cs:408,438,468` |
| 2   | **P0**     | `SolicitarApp(payment\|message)` viola o contrato Bixs → 400 garantido    | `Services/ExternalTokenManagerService.cs:458`         |
| 3   | **P0**     | Não existe endpoint de envio de OTP                                       | `Controllers/UserAdminController.cs`                  |
| 4   | P1         | `AtualizarAcesso` estoura `JsonException` em resposta 204/vazia → 500     | `Services/ExternalTokenManagerService.cs:429`         |
| 5   | P1         | `PUT` sem transação: Bixs muda, banco não                                 | `Controllers/ControleAcessosController.cs:86-116`     |
| 6   | P1         | `CriarAcesso` descarta client já criado quando `status` vem falso/ausente | `Services/ExternalTokenManagerService.cs:396`         |
| 7   | P1         | Admin nunca consegue re-solicitar após recusa                             | `Controllers/UserAdminController.cs:153-157`          |
| 8   | P1         | Zero logging das respostas da Bixs                                        | `Services/ExternalTokenManagerService.cs` (todo)      |
| 9   | P2         | `ControleViewPost.IdEmpresa` é ignorado — campo morto no contrato         | `Dtos/ControleView.cs:9`                              |
| 10  | P2         | `404 "não encontrado"` quando o registro existe mas `IdBixs` é null       | `Controllers/ControleAcessosController.cs:82`         |
| 11  | P2         | `AddScoped` sobrescrito por `AddHttpClient` — registro morto              | `Program.cs:35-36`                                    |
| 12  | P2         | `BixAPI:API-Key` não aparece em nenhum artefato de config do repo         | `Program.cs` / deploy                                 |
| 13  | **P3**     | Chave de assinatura JWT hardcoded e commitada                             | `Program.cs:46`                                       |
| 14  | P3         | CORS reflete qualquer origem com `AllowCredentials`                       | `Program.cs:21-31`                                    |
| 15  | P3         | `UseDeveloperExceptionPage` e Swagger na raiz, incondicionais             | `Program.cs:110-112`                                  |

---

## 3. P0 — bloqueiam o fluxo hoje

### 3.1 `X-API-Key` acumula valores no mesmo `HttpClient`

`ExternalTokenManagerService` é registrado como **typed client**:

```csharp
// Program.cs:35-36
builder.Services.AddScoped<IExternalTokenManagerService, ExternalTokenManagerService>();
builder.Services.AddHttpClient<IExternalTokenManagerService, ExternalTokenManagerService>();
```

O `AddHttpClient` é a última registração, então é ela que vale: o serviço
resolve **uma instância por request**, com **um `HttpClient` próprio**. Os três
métodos machine-to-machine fazem:

```csharp
_httpClient.DefaultRequestHeaders.Add("X-API-Key", _configuration["BixAPI:API-Key"]);
```

`HttpHeaders.Add` em header customizado **não substitui — acumula**. E
`PutControleAcesso` chama, na **mesma instância**, em sequência:

```
AtualizarAcesso(idBixs)          → X-API-Key: <chave>
SolicitarApp(idBixs, "payment")  → X-API-Key: <chave>, <chave>
SolicitarApp(idBixs, "message")  → X-API-Key: <chave>, <chave>, <chave>
```

A partir da segunda chamada o header sai multivalorado (`chave, chave`) e a Bixs
devolve **401**. Ou seja: mesmo corrigindo o achado 3.2, a aprovação do Master
continuaria falhando.

Agrava: `VerificaAcesso` e `CadatrarWebHook` setam
`DefaultRequestHeaders.Authorization` na mesma instância. A doc da Bixs é
explícita para as rotas de directory: _"Não envie Bearer. Use apenas
`X-API-Key`."_ Se as duas coisas coincidirem no mesmo request, a chamada vai com
os dois esquemas.

→ **Patch 1**.

### 3.2 `SolicitarApp` pede uma capability que a Bixs recusa por contrato

```csharp
// ExternalTokenManagerService.cs:458
var requestBody = new { application_code = "external-api", capability_code = app }; // "payment" | "message"
POST /v1/api/directory/clients/{idBixs}/capabilities
```

Doc oficial da Bixs, seção _Conceder Capability_:

> Concede ao client a capability `agent` (processo do agente, não o login do
> client).
>
> - `payment`, `message`, `users` e `media` **não** podem ser concedidos a
>   client.
> - Tentar conceder outra capability que não `agent` retorna **400**.
>
> | Campo              | Obrigatório | Valores        |
> | ------------------ | ----------- | -------------- |
> | `application_code` | sim         | `external-api` |
> | `capability_code`  | sim         | `agent`        |

Isto não é hipótese: `payment` e `message` são capabilities do **member** (a
conta PagWeb), não do client (a empresa). O client herda o acesso via a
aplicação `pag-web`, concedida em `POST .../clients/{id}/applications` — que
`AtualizarAcesso` já faz corretamente.

**Consequência:** todo `PUT /api/ControleAcessos/{id}` com `estado=Ativo` e
qualquer módulo em `Ativo` retorna `400 "Erro ao ativar Pagamento!"` ou
`400 "Erro ao ativar Whatsapp!"`, mesmo com a concessão de `pag-web` tendo dado
certo.

→ **Patch 2**.

### 3.3 Não existe endpoint de envio de OTP

O commit `c6c7c12` tornou `VerificationCode` **required** em `ControleViewPost`,
e `CriarAcesso` repassa esse código como `verification_code` paraR
`POST /v1/api/directory/clients`. Correto pelo contrato da Bixs:

> Antes de criar, chame `POST /v1/api/directory/clients/verification/send-code`.
> O código é enviado ao e-mail do **client**. Expira em 15 minutos e é consumido
> uma vez.

Só que **nenhum endpoint da PagWebV1 dispara esse send-code**. E o frontend não
pode chamar a Bixs direto: o send-code exige `X-API-Key` — credencial de
**member**, com aplicação `external-api` e capability `users`. Colocar isso no
browser vazaria a credencial da PagWeb inteira para qualquer usuário.

**Resultado:** desde `c6c7c12`, `POST /api/v1/User/solicitar-acesso` é
inalcançável na prática. Sem código válido, `CriarAcesso` falha e a API responde
`400 "Erro ao criar acesso."`.

→ **Patch 3** (endpoint proxy `POST /api/v1/User/enviar-codigo-acesso`).

> O frontend **já foi atualizado** contra esse contrato exato e degrada de forma
> limpa enquanto o endpoint não existir (mostra aviso e aceita o código digitado
> à mão). Assim que o patch subir, o fluxo fecha sem tocar no front. Ver
> `apps/PagWebFuncional/docs/`.

---

## 4. P1 — falha silenciosa e estado inconsistente

### 4.1 `AtualizarAcesso` pode derrubar o request com 500

```csharp
// ExternalTokenManagerService.cs:443-452
if (response.IsSuccessStatusCode)
{
    string jsonResponse = await response.Content.ReadAsStringAsync();
    var resultado = JsonSerializer.Deserialize<ConcederAcesso>(jsonResponse);   // ← sem try/catch
    if (resultado != null && resultado.Application_Code == "pag-web") return true;
    return false;
}
```

Dois problemas:

1. A doc da Bixs trata `204 No Content` como resposta válida de
   `POST .../applications` (o script de teste faz
   `if (status === 204) return;`). Com 204, `jsonResponse` é `""` e
   `JsonSerializer.Deserialize` lança **`JsonException`**. O método não tem
   `try/catch`, e o `catch` do `PutControleAcesso` só captura
   `DbUpdateConcurrencyException` → exceção não tratada → **500** (com stack
   trace vazando, por causa do achado 15).
2. Mesmo com 200, o método exige que a resposta ecoe
   `application_code == "pag-web"`. Se a Bixs devolver outro shape (envelope,
   objeto do client, lista de aplicações), cai em `return false` →
   `400 "Erro ao ativar acesso."` mesmo com a concessão tendo sido efetivada.

O achado 2 é exatamente o sintoma registrado nos relatórios de 12/08 e 13/08.

→ **Patch 4**.

### 4.2 `PUT` sem transação: a Bixs muda, o banco não

Em `PutControleAcesso`, `_context.Update` + `SaveChangesAsync` só acontecem
**depois** de todas as chamadas à Bixs. Se `AtualizarAcesso` retorna `true` (a
aplicação `pag-web` **foi concedida** na Bixs) e em seguida `SolicitarApp`
falha, o método faz `return BadRequest(...)` e **nada é persistido**.

Estado resultante: Bixs com `pag-web` concedido, PagWeb com
`estado = Solicitado`. O Master tenta de novo e re-concede. Ninguém percebe até
alguém comparar os dois lados.

→ **Patch 2** resolve na prática (elimina a chamada que falha), mas vale
inverter a ordem: gravar o estado local assim que `AtualizarAcesso` confirmar, e
tratar o resto como best-effort.

### 4.3 `CriarAcesso` joga fora um client que já foi criado

```csharp
// ExternalTokenManagerService.cs:414-423
if (response.IsSuccessStatusCode)
{
    var resultado = JsonSerializer.Deserialize<BixsAcesso>(jsonResponse);
    if (resultado != null && resultado.Status) return resultado;   // ← Status é bool
    return null;
}
```

`BixsAcesso.Status` mapeia `"status"` como `bool`. Se a Bixs devolver `status`
como string (`"active"`), omitir o campo, ou aninhar em envelope, o resultado é
`false` (ou `JsonException`) e o método retorna `null` — **mesmo com HTTP 2xx**,
isto é, **mesmo com o client já criado na Bixs**.

Consequência em cascata, e essa é a pior do relatório:

1. o client existe na Bixs, mas a PagWeb não guarda o `IdBixs`;
2. o OTP foi **consumido** (uso único);
3. o Admin recebe `400 "Erro ao criar acesso."`;
4. ele pede outro código e tenta de novo → a Bixs recusa o e-mail já cadastrado;
5. sobra um client órfão e um Admin travado.

O critério de sucesso deve ser **ter recebido um `id`**, não o campo `status`.

→ **Patch 5**.

### 4.4 Admin nunca consegue re-solicitar após uma recusa

```csharp
// UserAdminController.cs:153-157
var existingControle = await _context.ControleAcessos
    .FirstOrDefaultAsync(c => c.IdEmpresa == empresa.IdEmpresa);
if (existingControle != null)
    return BadRequest("Já existe um controle de acesso para esta empresa.");
```

Quando o Master recusa, `PutControleAcesso` grava `estado = Inativo` — **não
apaga a linha**. A partir daí:

- `solicitar-acesso` responde 400 para sempre;
- o único `DELETE` existente é `[Authorize(Roles = "Master")]`;
- o Admin não tem nenhum caminho de recuperação pela API.

O front hoje só consegue mostrar o status e mandar o usuário falar com o
suporte. Isso deveria ser um caminho de produto, não um beco sem saída.

→ **Patch 6**.

### 4.5 Zero logging das respostas da Bixs

`CriarAcesso`, `AtualizarAcesso` e `SolicitarApp` descartam status e corpo da
resposta em todos os caminhos de erro. Toda falha vira o mesmo `400` genérico no
controller.

Este é o achado de **maior custo-benefício** do relatório: é o motivo de três
relatórios seguidos (12/08, 13/08, 19/08) terem terminado em hipótese em vez de
causa raiz. Com status + corpo no log, os achados 3.1, 3.2 e 4.3 teriam sido
identificados na primeira ocorrência.

→ Incluído nos patches 1, 4 e 5.

---

## 5. P2 — contrato e configuração

**5.1 `IdEmpresa` morto no contrato.** `ControleViewPost.IdEmpresa` existe no
DTO público mas o controller nunca o lê — a empresa vem do claim (`UserEmpresas`
do `idUser`). Decisão de segurança correta; o campo, porém, engana quem lê o
Swagger. Remover do DTO ou documentar como ignorado.

**5.2 `404` enganoso.** `PutControleAcesso` retorna
`NotFound("Controle de acesso não encontrado.")` quando `controle == null`
**ou** `controle.IdBixs == null`. O segundo caso é um registro que existe mas
nunca chegou a criar o client na Bixs (exatamente o cenário do achado 4.3).
Merece mensagem própria — algo como
`409 "Solicitação sem vínculo na Bixs; refaça a solicitação."`.

**5.3 Registro DI morto.** `Program.cs:35` (`AddScoped`) é sobrescrito por
`Program.cs:36` (`AddHttpClient`, transient). A linha 35 pode sair. Vale saber
que o serviço é **transient**, não scoped — é o que torna o achado 3.1
previsível dentro de um request. Ainda em `Program.cs`:
`AddEndpointsApiExplorer()` e `AddSwaggerGen()` aparecem duas vezes (76-77 e
95-96).

**5.4 `BixAPI:API-Key` no ambiente de deploy.** Não há `appsettings.json` na
árvore de trabalho (só `appsettings.Development.json`, que contém apenas
`Logging`). O único artefato de config no repo é
`bin/Debug/net8.0/appsettings.json`, de **2026-07-06** — anterior ao commit que
introduziu a chave — e nele existem apenas `BixAPI:Email` e `BixAPI:Password`,
**sem `BixAPI:API-Key`**.

Isso **não prova** que a chave falta em produção (o artefato é obsoleto e a
config pode vir do ambiente), mas é o único dado disponível e o cenário de falha
é silencioso: com a chave ausente, `_configuration["BixAPI:API-Key"]` devolve
`null`, o header sai vazio e **as três** integrações falham com 401 —
indistinguível dos outros achados nos logs atuais. **Confirmar em
`lojas.vlks.com.br` antes de investigar qualquer outra coisa.** O Patch 1
transforma essa condição em erro explícito em vez de 401 mudo.

---

## 6. P3 — segurança fora do fluxo

Fora do escopo do Controle de Acesso, mas encontrado no caminho e sério demais
para omitir.

**6.1 Chave de assinatura JWT hardcoded e commitada** — `Program.cs:46`. A chave
HMAC de 32 chars que valida **todos** os tokens está literal no código-fonte e
versionada. Quem tiver acesso ao repositório (ou a um dump dele) forja um token
com `Role=Master` e ganha o painel de aprovações inteiro, além de qualquer
endpoint `[Authorize]`. Agrava o fato de existir `JwtSettings:Key` na config —
ou seja, **há uma chave configurável que não está sendo usada**. **Ação:** ler
de `JwtSettings:Key`/variável de ambiente e **rotacionar** a chave atual
(rotacionar invalida as sessões vigentes — combinar janela). Não colar o valor
em chamado, PR ou chat.

**6.2 CORS permissivo com credenciais** — `Program.cs:21-31`.
`SetIsOriginAllowed(origin => true)` + `AllowCredentials()` reflete qualquer
origem. Como o front usa Bearer em `localStorage` (e não cookie), o impacto
direto hoje é menor, mas a política deve virar uma allowlist explícita
(`lojas.vlks.com.br`, domínio do front, `localhost` em dev).

**6.3 Swagger e página de exceção expostos em produção** — `Program.cs:110-112`.
`UseDeveloperExceptionPage()`, `UseSwagger()` e
`UseSwaggerUI(RoutePrefix = string.Empty)` estão **fora** do
`if (app.Environment.IsDevelopment())` das linhas 103-107 — que, por isso, virou
código morto. Em produção: stack traces com detalhes internos em qualquer erro
500 (inclusive o do achado 4.1) e a superfície completa da API na raiz do
domínio. Mover os três para dentro do guard de ambiente, ou proteger o Swagger
por autenticação.

---

## 7. Patches propostos

Prontos para colar. Não foram aplicados nem compilados neste repositório.

### Patch 1 — headers idempotentes para chamadas machine-to-machine

Adicionar em `ExternalTokenManagerService` e substituir os três blocos de header
(linhas ~408-411, ~438-441, ~468-471) por uma chamada a `AplicarApiKey()`:

```csharp
/// <summary>
/// Prepara os headers das rotas de directory da Bixs: X-API-Key idempotente, sem Bearer.
/// Doc Bixs: "Não envie Bearer. Use apenas X-API-Key."
/// </summary>
private void AplicarApiKey()
{
    var apiKey = _configuration["BixAPI:API-Key"];
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        throw new InvalidOperationException(
            "BixAPI:API-Key não configurada — integração Bixs indisponível neste ambiente.");
    }

    // Remove antes de adicionar: HttpHeaders.Add ACUMULA valores em header customizado,
    // e a mesma instância atende várias chamadas dentro do mesmo request.
    _httpClient.DefaultRequestHeaders.Remove("X-API-Key");
    _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
    _httpClient.DefaultRequestHeaders.Authorization = null;

    _httpClient.DefaultRequestHeaders.Accept.Clear();
    _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
}

/// <summary>Log padronizado das respostas da Bixs (status + corpo) para diagnóstico.</summary>
private void LogBixs(string operacao, HttpResponseMessage response, string corpo)
{
    using var scope = _serviceProvider.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<ExternalTokenManagerService>>();
    logger.LogWarning("Bixs {Operacao} → {Status}: {Corpo}", operacao, (int)response.StatusCode, corpo);
}
```

> **Alternativa mais robusta** (elimina o estado compartilhado de vez): trocar
> `DefaultRequestHeaders` por `HttpRequestMessage` com headers por chamada e
> `_httpClient.SendAsync(request)`. Recomendado se houver apetite para o
> refactor.

### Patch 2 — aprovação do Master sem capability inválida

`Controllers/ControleAcessosController.cs`, substituir o bloco
`if (controleacesso.estado == Estado.Ativo)` (linhas 86-107):

```csharp
if (controleacesso.estado == Estado.Ativo)
{
    var acesso = await _apiBixs.AtualizarAcesso(controle.IdBixs);
    if (!acesso) { return BadRequest("Erro ao ativar acesso na Bixs."); }

    controle.estado   = Estado.Ativo;
    controle.Payment  = controleacesso.Payment;
    controle.Whatsapp = controleacesso.Whatsapp;

    // Payment/WhatsApp NÃO são concedidos ao client na Bixs: são capabilities do MEMBER.
    // POST /v1/api/directory/clients/{id}/capabilities só aceita capability_code = "agent";
    // qualquer outro valor retorna 400. O acesso do client vem da aplicação "pag-web",
    // concedida acima por AtualizarAcesso. Os campos abaixo são o estado local de liberação.
}
```

E remover `SolicitarApp` da interface e da implementação — ou mantê-la
**apenas** para `capability_code = "agent"`, se houver caso de uso de agente:

```csharp
Task<bool> SolicitarApp(string idBixs, string capabilityCode = "agent");
```

### Patch 3 — endpoint de envio de OTP

**3a.** `IExternalTokenManagerService`:

```csharp
Task<(bool Enviado, string? Destino, int ExpiraEmSegundos, string? Erro)> EnviarCodigoVerificacao(string email);
```

**3b.** `ExternalTokenManagerService`:

```csharp
public async Task<(bool, string?, int, string?)> EnviarCodigoVerificacao(string email)
{
    try
    {
        AplicarApiKey();
        var content = new StringContent(
            JsonSerializer.Serialize(new { target_email = email, role = "client" }),
            Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(
            "v1/api/directory/clients/verification/send-code", content);
        var corpo = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            LogBixs("send-code", response, corpo);
            return (false, null, 0, corpo);
        }

        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(corpo) ? "{}" : corpo);
        var destino = doc.RootElement.TryGetProperty("sent_to", out var s) ? s.GetString() : email;
        var expira  = doc.RootElement.TryGetProperty("expires_in_seconds", out var e) ? e.GetInt32() : 900;
        return (true, destino, expira, null);
    }
    catch (Exception ex)
    {
        return (false, null, 0, ex.Message);
    }
}
```

**3c.** `Controllers/UserAdminController.cs` (o controller já é
`[Route("api/v1/User")]`, então a rota final é
`POST /api/v1/User/enviar-codigo-acesso` — que é exatamente o contrato contra o
qual o frontend já foi escrito):

```csharp
/// <summary>
/// Dispara o OTP da Bixs para o e-mail do Admin logado. O código é obrigatório em
/// solicitar-acesso (ControleViewPost.VerificationCode). Expira em 15 min, uso único.
/// </summary>
[HttpPost("enviar-codigo-acesso/")]
[Authorize(Roles = "Admin")]
public async Task<ActionResult> EnviarCodigoAcesso()
{
    var idUserClaim = User.FindFirst(ClaimTypes.NameIdentifier);
    if (idUserClaim == null) return Unauthorized();

    var usuario = await _context.User.FindAsync(int.Parse(idUserClaim.Value));
    if (usuario?.Email == null) return BadRequest("Usuário sem e-mail cadastrado.");

    var (enviado, destino, expira, erro) = await _apiBixs.EnviarCodigoVerificacao(usuario.Email);
    if (!enviado)
    {
        _userService.LogError($"Erro ao enviar código de verificação Bixs: {erro}");
        return BadRequest("Não foi possível enviar o código de verificação. Tente novamente.");
    }

    return Ok(new { sent_to = destino, expires_in_seconds = expira });
}
```

### Patch 4 — `AtualizarAcesso` tolerante a 204 e a shapes inesperados

```csharp
public async Task<bool> AtualizarAcesso(string idBixs)
{
    try
    {
        AplicarApiKey();
        var content = new StringContent(
            JsonSerializer.Serialize(new { application_code = "pag-web" }),
            Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(
            $"v1/api/directory/clients/{idBixs}/applications", content);
        var corpo = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            LogBixs("conceder-aplicacao", response, corpo);
            return false;
        }

        // 204 / corpo vazio é resposta válida de sucesso na Bixs.
        if (string.IsNullOrWhiteSpace(corpo)) return true;

        try
        {
            var resultado = JsonSerializer.Deserialize<ConcederAcesso>(corpo);
            // 2xx já significa concessão aceita; só recusa se o eco contradisser explicitamente.
            return resultado?.Application_Code is null or "pag-web";
        }
        catch (JsonException)
        {
            LogBixs("conceder-aplicacao (shape inesperado)", response, corpo);
            return true;
        }
    }
    catch (Exception ex)
    {
        using var scope = _serviceProvider.CreateScope();
        scope.ServiceProvider.GetRequiredService<ILogger<ExternalTokenManagerService>>()
             .LogError(ex, "Falha ao conceder aplicação pag-web na Bixs");
        return false;
    }
}
```

### Patch 5 — `CriarAcesso`: sucesso é ter `id`, não `status`

```csharp
HttpResponseMessage response = await _httpClient.PostAsync("v1/api/directory/clients", content);
string corpo = await response.Content.ReadAsStringAsync();

if (!response.IsSuccessStatusCode)
{
    LogBixs("criar-client", response, corpo);
    return null;
}

try
{
    var resultado = JsonSerializer.Deserialize<BixsAcesso>(corpo);
    // Critério de sucesso é o id. `status` pode vir false/ausente e o client existir —
    // devolver null aqui deixa client órfão na Bixs e queima o OTP (uso único).
    if (!string.IsNullOrWhiteSpace(resultado?.Id)) return resultado;

    LogBixs("criar-client (2xx sem id)", response, corpo);
    return null;
}
catch (JsonException)
{
    LogBixs("criar-client (shape inesperado)", response, corpo);
    return null;
}
```

### Patch 6 — permitir re-solicitação após recusa

`UserAdminController.PostControleAcesso`, no lugar do bloco `existingControle`
(linhas 153-157):

```csharp
var existingControle = await _context.ControleAcessos
    .FirstOrDefaultAsync(c => c.IdEmpresa == empresa.IdEmpresa);

// Só bloqueia se houver solicitação viva. Recusada (Inativo) pode ser refeita.
if (existingControle != null && existingControle.estado != Estado.Inativo)
{
    return BadRequest("Já existe uma solicitação de integração em andamento para esta empresa.");
}
```

E, mais abaixo, reaproveitar a linha existente em vez de inserir uma nova —
**reutilizando o `IdBixs` quando já houver client na Bixs**, para não queimar
OTP nem duplicar client:

```csharp
string? idBixs = existingControle?.IdBixs;

if (string.IsNullOrWhiteSpace(idBixs))
{
    var solicitacao = await _apiBixs.CriarAcesso(usuario, controleacesso.Password, controleacesso.VerificationCode);
    if (solicitacao == null) { return BadRequest("Erro ao criar acesso."); }
    idBixs = solicitacao.Id;
}

if (existingControle != null)
{
    existingControle.Payment    = controleacesso.Payment;
    existingControle.Whatsapp   = controleacesso.Whatsapp;
    existingControle.Solicitado = DateTime.Now;
    existingControle.estado     = Estado.Solicitado;
    existingControle.IdBixs     = idBixs;
    _context.Update(existingControle);
    await _context.SaveChangesAsync();
    return Ok(new { message = "Solicitação reenviada com sucesso.", idcontrole = existingControle.IdControle });
}

var controle = new ControleAcesso
{
    Payment    = controleacesso.Payment,
    Whatsapp   = controleacesso.Whatsapp,
    Solicitado = DateTime.Now,
    estado     = Estado.Solicitado,
    IdEmpresa  = empresa.IdEmpresa,
    IdBixs     = idBixs
};
_context.ControleAcessos.Add(controle);
await _context.SaveChangesAsync();
return Ok(new { message = "Controle de acesso criado com sucesso.", idcontrole = controle.IdControle });
```

> Se o client já existe na Bixs, o `VerificationCode` deixa de ser necessário
> nesse caminho. Vale avaliar tornar o campo opcional (`string?`) e validá-lo só
> quando for criar client novo — o frontend já trata as duas situações.

---

## 8. Ordem de aplicação sugerida

| Ordem | Patch                                      | Por quê                                                      |
| ----- | ------------------------------------------ | ------------------------------------------------------------ |
| 1     | Confirmar `BixAPI:API-Key` no deploy (5.4) | Se faltar, todo o resto continua falhando com 401 mudo       |
| 2     | Patch 1 (headers + logging)                | Desbloqueia o diagnóstico de tudo que vier depois            |
| 3     | Patch 3 (endpoint de OTP)                  | Destrava `solicitar-acesso`; o front já está pronto para ele |
| 4     | Patch 5 (`CriarAcesso`)                    | Evita client órfão + OTP queimado na primeira tentativa real |
| 5     | Patch 2 (`SolicitarApp`)                   | Destrava a aprovação do Master                               |
| 6     | Patch 4 (`AtualizarAcesso`)                | Elimina o 500 e o falso negativo                             |
| 7     | Patch 6 (re-solicitação)                   | Tira o Admin do beco sem saída                               |
| 8     | Achados P3 (13, 14, 15)                    | Independentes do fluxo, mas o 13 é crítico e deve ter data   |

---

## 9. Como validar

Fluxo completo, com Swagger ou com o front já atualizado:

1. **OTP** — `POST /api/v1/User/enviar-codigo-acesso` com token Admin. Esperado:
   `200 { sent_to, expires_in_seconds: 900 }` e e-mail com 6 dígitos na caixa do
   Admin.
2. **Solicitação** — `POST /api/v1/User/solicitar-acesso` com `payment`,
   `whatsapp`, `password` e `verificationCode`. Esperado: `200 { idcontrole }` e
   `IdBixs` preenchido no banco.
3. **Status (Admin)** — `GET /api/v1/User/status-acesso`. Esperado: `200` com
   `estado = Solicitado`. Antes da solicitação: `404`.
4. **Lista (Master)** — `GET /api/ControleAcessos` com token Master. Esperado: a
   empresa na lista.
5. **Aprovação** — `PUT /api/ControleAcessos/{id}` com `estado = Ativo` e os
   módulos. Esperado: `200`. **Este é o passo que hoje falha**; após os patches
   1 e 2 deve passar.
6. **Gate no front** — reabrir Integrações como Admin: status `Ativo`,
   PIX/boleto e WhatsApp liberados.

Casos de borda que valem teste explícito:

- Código expirado (>15 min) ou reutilizado → mensagem específica, não
  `"Erro ao criar acesso."`
- Senha errada → `401 "Senha incorreta"`
- Empresa com solicitação recusada → re-solicitação aceita (Patch 6)
- `BixAPI:API-Key` ausente → erro explícito de configuração (Patch 1), não 401
  silencioso

---

## Referências

- Contrato Bixs External API: `api-docs-documentation.html` (raiz do monorepo),
  seções _Directory → Enviar código para criar Client / Criar Client / Conceder
  Aplicacao / Conceder Capability_
- Relatório de origem:
  `apps/PagWebFuncional/trash/relatorio_api_pagweb_atualizacao_frontend_2026-08-19.md`
- Relatórios anteriores:
  `apps/PagWebFuncional/docs/relatorio_aprovacao_controle_acessos_2026-08-12.md`,
  `apps/PagWebFuncional/docs/relatorio_erro_solicitar_integracao_bixs_2026-08-13.md`
- Mudanças do frontend desta rodada: `apps/PagWebFuncional/docs/` (relatório de
  2026-08-19)
