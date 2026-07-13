# Relatório de Erros - API PagWebV1

> **Última auditoria:** 09/07/2026  
> **API local:** `apps/PagWebFuncional/api` atualizada para commit `988d8b9`
> (`correcao injecao paymentservice`)  
> **API em produção (testes MCP):** `https://lojas.vlks.com.br`  
> **Frontend:** PagWeb rodando em `http://localhost:3000` (Simple Browser do
> Cursor)

---

## Resumo da Auditoria

| Categoria                                              | Status                                                                                                |
| :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| CS4014 — chamadas async sem `await`                    | **Resolvido** na versão `988d8b9`                                                                     |
| OPENJSON / `.Contains()` em SQL Server                 | **Resolvido** — filtro em memória nos controllers                                                     |
| Shadow properties `UsuarioIdUser` / `EmpresaIdEmpresa` | **Resolvido** — migration `20260706181006_correcao-cobranca` + mapeamento explícito no `AppDbContext` |
| CS8602 — desreferências nulas                          | **Parcial** — 348 warnings restantes (era ~380)                                                       |
| Permissões `GET /api/Cobrancas/{id}`                   | **Ainda com bug** — lógica invertida                                                                  |
| Novos endpoints (27 rotas)                             | Testados parcialmente via MCP `openapi-pagwebv1`                                                      |

### Testes de integração realizados (MCP + curl)

- `POST /api/v1/User/register` + `activate` + `login-cliente` — **OK**
- `POST /api/v1/Empresa` (com token cliente) — **OK** (empresa `idEmpresa: 34`
  criada)
- `GET /api/Cobrancas/Usuario` (cliente sem cobranças) — **OK** (`[]`)
- `GET /api/Cobrancas/5` (cliente sem vínculo) — **OK** (nega acesso
  corretamente)
- `GET /api/Categorias/empresa-categorias-publico/{idEmpresa}` — **OK**
- `POST /api/v1/User/login-admin` — **Falha** (ver erros 1 e 2 abaixo)
- Endpoints admin (`POST /api/Categorias`, `POST /api/Produtos`,
  `POST /api/Cobrancas`, etc.) — **Não testáveis** sem JWT Admin (bloqueado pelo
  login-admin)

---

## 1. NullReferenceException no `login-admin` para usuários sem empresa

**Arquivo:** `Controllers/UserAdminController.cs` (linha 46)

```csharp
var tipouser = await _userService.TipoUser(user.IdUser, true);

if (tipouser == null && tipouser.UserTipo != UserTipo.Admin)
    return Unauthorized(new { message = "Usuario não encontrado" });
```

**Problema:** O operador `&&` está incorreto. Quando `tipouser` é `null`
(usuário recém-ativado sem empresa vinculada), a segunda parte da condição tenta
acessar `tipouser.UserTipo`, gerando `NullReferenceException` (confirmado em
runtime: HTTP 500).

**Correção sugerida:**

```csharp
if (tipouser == null || tipouser.UserTipo != UserTipo.Admin)
    return Unauthorized(new { message = "Usuário não é administrador ou não possui empresa vinculada." });
```

---

## 2. `login-admin` bloqueado por dependência obrigatória do gateway Bixs

**Arquivo:** `Controllers/UserAdminController.cs` (linhas 49–51) +
`Services/ExternalTokenManagerService.cs`

Após criar empresa e vincular o usuário como admin, o `login-admin` retorna:

```json
{ "message": "Erro ao verificar acesso ao sistema externo." }
```

**Causa:** Todo login administrativo chama `VerificaAcesso()`, que autentica as
mesmas credenciais na API externa `https://api.bixs.com.br/v1/auth/login`.
Usuários PagWeb sem conta correspondente no Bixs (ou com credenciais
divergentes) **nunca conseguem obter JWT Admin**, bloqueando todos os endpoints
`[Authorize(Roles = "Admin")]` — incluindo os 27 novos endpoints de catálogo e
cobranças.

**Impacto:** Impossibilita onboarding de novos estabelecimentos e torna os
testes de regressão dos perfis MCP `estabelecimento` / `estabelecimento_novo`
inviáveis.

**Correção sugerida:** Separar autenticação PagWeb da validação Bixs (tornar
Bixs lazy/opcional no login, ou criar fluxo de provisionamento automático no
Bixs ao criar empresa).

---

## 3. Bug crítico de permissão invertida em `GET /api/Cobrancas/{id}`

**Arquivo:** `Controllers/CobrancasController.cs` (linhas 159–222)

```csharp
if (vinculo != null && vinculo.UserTipo == UserTipo.Admin && vinculo.IdEmpresa != cobranca.IdEmpresa)
{
    // retorna os dados da cobrança
    return Ok(cobrancaDto);
}
else if (cobranca.IdUser == idAdmin)
{
    return Ok(cobrancaDto);
}
return BadRequest("Você não tem permissão para acessar esta cobrança.");
```

**Problema:** A lógica está **invertida**:

1. Admin da **mesma** empresa (`IdEmpresa == cobranca.IdEmpresa`) cai no
   `else if`, falha (pois `idAdmin != cobranca.IdUser`) e recebe **negação de
   acesso**.
2. Admin de **outra** empresa (`IdEmpresa != cobranca.IdEmpresa`) entra no
   primeiro `if` e recebe **acesso indevido** — vazamento de dados entre
   tenants.

**Correção sugerida:**

```csharp
bool temPermissao = false;

if (vinculo != null && vinculo.UserTipo == UserTipo.Admin)
{
    if (vinculo.IdEmpresa == cobranca.IdEmpresa)
        temPermissao = true;
}
else if (cobranca.IdUser == idAdmin)
{
    temPermissao = true;
}

if (!temPermissao)
    return BadRequest(new { message = "Você não tem permissão para acessar esta cobrança." });
```

---

## 4. Ordem incorreta de verificação de nulo em `UserService.cs`

**Arquivo:** `Services/UserService.cs` (linhas 712–714)

```csharp
var adminconfig = await _context.UserConfigs.FindAsync(adminEmpresa.IdUser);

if (adminEmpresa != null && adminconfig.Notificacoes == true)
```

**Problema:** `adminEmpresa.IdUser` é acessado **antes** da verificação
`adminEmpresa != null`. Se a empresa não tiver admin cadastrado, ocorre
`NullReferenceException` em runtime.

**Nota:** O mesmo padrão foi corrigido em outros trechos do arquivo (ex.: linhas
2197–2199), mas este bloco permanece vulnerável.

**Correção sugerida:**

```csharp
if (adminEmpresa != null)
{
    var adminconfig = await _context.UserConfigs.FindAsync(adminEmpresa.IdUser);
    if (adminconfig?.Notificacoes == true)
    {
        // ... fluxo de notificação ...
    }
}
```

---

## 5. Warnings CS8602 (desreferência de referência nula) — 348 ocorrências

A compilação limpa (`dotnet build --no-incremental`) ainda reporta **348
warnings CS8602**, concentrados principalmente em:

- `Controllers/CobrancasController.cs` — coleções `Produtos`/`Servicos`
  possivelmente nulas no `.Select()`
- `Controllers/ProdutosController.cs` e `Controllers/ServicosController.cs` —
  navegação `Categorias` sem null-check
- `Controllers/UserAdminController.cs`, `AssinaturaController.cs`,
  `MensalidadeController.cs` — claims e includes sem verificação

**Risco:** `NullReferenceException` intermitente em produção dependendo dos
dados retornados pelo EF Core.

**Correção sugerida:** Aplicar null-conditional (`?.`), null-coalescing
(`?? []`) e verificações explícitas antes de acessar propriedades de navegação.

---

## 6. Exposição de dados cross-tenant em endpoints de Categorias

**Arquivo:** `Controllers/CategoriasController.cs`

| Endpoint                                                     | Atributo                       | Problema                                                                                |
| :----------------------------------------------------------- | :----------------------------- | :-------------------------------------------------------------------------------------- |
| `GET /api/Categorias`                                        | `[AllowAnonymous]`             | Retorna **todas** as categorias ativas de **todas** as empresas                         |
| `GET /api/Categorias/{id}`                                   | `[AllowAnonymous]`             | Retorna qualquer categoria pelo ID, sem verificar tenant                                |
| `GET /api/Categorias/empresa-categorias-privado/{idEmpresa}` | `[Authorize(Roles = "Admin")]` | Parâmetro `{idEmpresa}` da rota é **ignorado**; usa sempre `vinculo.IdEmpresa` do token |

**Confirmado em teste:** Cliente autenticado (`idUser: 66`) recebeu lista com
categorias da `idEmpresa: 26` ao chamar `GET /api/Categorias`.

**Correção sugerida:** Remover `[AllowAnonymous]` dos endpoints globais ou
filtrar por empresa; validar que `{idEmpresa}` da rota corresponde ao vínculo do
admin.

---

## 7. Migration pendente em ambientes que não aplicaram `correcao-cobranca`

**Arquivo:** `Migrations/20260706181006_correcao-cobranca.cs`

A migration remove colunas shadow (`UsuarioIdUser`, `EmpresaIdEmpresa`) e
consolida FKs em `IdUser`/`IdEmpresa`. Ambientes que ainda não executaram esta
migration continuarão com o erro:

```
SqlException: Cannot insert the value NULL into column 'UsuarioIdUser'
```

**Ação necessária:** Executar `dotnet ef database update` no servidor de
produção após deploy do commit `988d8b9`.

---

## Histórico — Itens resolvidos nesta versão

Os itens abaixo constavam no relatório anterior e foram **corrigidos** no commit
`988d8b9`:

1. **CS4014** — `await` adicionado em `EnviarLembretesMensalidadeAbertoAsync` e
   `EnviarWhatsAppMensalidadeAbertoAsync` (`UserService.cs` linhas 2180, 2191,
   2320).
2. **OPENJSON / `.Contains()`** — Controllers de Produtos, Serviços e Cobranças
   passaram a carregar registros com `.ToListAsync()` e filtrar em memória.
3. **Shadow properties em Cobranca** — Migration `correcao-cobranca` +
   configuração explícita de FK no `AppDbContext`.
4. **Null-check `adminEmpresa`** — Corrigido em vários fluxos de
   `UserService.cs` (ex.: linhas 2197–2208), embora um bloco permaneça (ver item
   4 acima).
