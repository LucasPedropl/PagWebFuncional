# Auditoria API PagWeb — 06/08/2026

> **Ambiente testado:** `https://lojas.vlks.com.br` (produção/homologação)  
> **Código local:** `apps/PagWebFuncional/api/PagWebV1` (commit sincronizado com
> GitHub)  
> **MCP:** `openapi-pagwebv1` — sync OK (121 endpoints, +10 novos)  
> **Script de testes:** `trash/api-audit-2026-08-06.mjs` (resultado em
> `trash/api-audit-2026-08-06-results.json`)

---

## Resumo executivo

| Categoria                                         | Resultado                                                                                     |
| :------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| **Login Master** (`Pagweb@vlks.com.br`)           | OK — role `Master`, `sub=0`                                                                   |
| **Login Cliente** (conta de teste)                | OK                                                                                            |
| **Login Admin estabelecimento** (conta QA antiga) | **Falhou 401** — usuário não existe mais em prod                                              |
| **ControleAcessos (Master)**                      | GET lista OK (0 registros); POST rejeita Master sem empresa (esperado)                        |
| **ChavesPix**                                     | GET lista OK; **POST falha 400** (bug no backend — ver item 18)                               |
| **PixCaixa (pagamento)**                          | Não testado end-to-end (sem mensalidade/cobrança aberta); **bug crítico no código** (item 19) |
| **Legado (bloqueios, extrato, notificações)**     | OK nos cenários testados                                                                      |

**Resultado dos testes automatizados:** 14 PASS · 2 FAIL · 1 SKIP (de 17)

---

## Novos endpoints — status em produção

### ChavesPix (`/api/ChavesPix`)

| Método | Rota                  | Teste        | HTTP | Status                                       |
| :----- | :-------------------- | :----------- | :--- | :------------------------------------------- |
| GET    | `/api/ChavesPix`      | Master token | 200  | OK — retorna `[]`                            |
| POST   | `/api/ChavesPix`      | Master token | 400  | **FALHA** — `"Erro ao cadastrar chave pix!"` |
| GET    | `/api/ChavesPix/{id}` | —            | —    | Não exercitado (POST falhou)                 |
| PUT    | `/api/ChavesPix/{id}` | —            | —    | Não exercitado                               |
| DELETE | `/api/ChavesPix/{id}` | —            | —    | Não exercitado                               |

> **Nota:** POST com Master (`IdUser=0`) pode falhar por FK. Porém o código
> **não atribui `IdUser`** nem para admin real — ver bug **18**.

### ControleAcessos (`/api/ControleAcessos`)

| Método | Rota                        | Teste  | HTTP | Status                                                   |
| :----- | :-------------------------- | :----- | :--- | :------------------------------------------------------- |
| GET    | `/api/ControleAcessos`      | Master | 200  | OK — lista vazia                                         |
| POST   | `/api/ControleAcessos`      | Master | 400  | OK — `"Usuário não é administrador de nenhuma empresa."` |
| GET    | `/api/ControleAcessos/{id}` | —      | —    | Sem registros para testar                                |
| PUT    | `/api/ControleAcessos/{id}` | —      | —    | Sem registros para testar                                |

> POST com **admin de estabelecimento** não foi testado — conta QA
> (`estabelecimento.mcp.planos.2026@gmail.com`) retorna 401 em prod.

### MetodoPagamento — `PixCaixa` (índice 6)

Enum no código:
`PIX, Cartao, Boleto, Transferencia, Dinheiro, BoletoPix, PixCaixa`.

Smoke test de `POST /api/v1/Pagamento/solicitar` com `Metodo: 6` **não
executado** — cliente de teste sem mensalidades abertas.

---

## Endpoints legados — amostra testada

| Endpoint                                        | Token   | HTTP | Resultado                     |
| :---------------------------------------------- | :------ | :--- | :---------------------------- |
| `GET /api/Cobrancas/Usuario`                    | Cliente | 200  | OK                            |
| `GET /api/UserBloqueio/meus-bloqueios/empresas` | Cliente | 200  | OK                            |
| `GET /api/UserBloqueio/meus-bloqueios/planos`   | Cliente | 200  | OK (claim corrigida em prod)  |
| `GET /api/v1/Pagamento/Extrato`                 | Cliente | 200  | OK                            |
| `GET /api/v1/Notificacao/pegar`                 | Cliente | 200  | OK                            |
| `GET /api/v1/Empresa`                           | Cliente | 200  | OK (1 empresa)                |
| `GET /api/v1/Pagamento/pendentes-repasse`       | Master  | 403  | Esperado (exige role `Admin`) |
| `GET /api/UserBloqueio/meus-bloqueios/planos`   | Anônimo | 401  | OK                            |

---

## Bugs encontrados (para correção)

### 18. `POST /api/ChavesPix` — `IdUser` não é persistido

- **Arquivo:** `Controllers/ChavesPixController.cs` (~linhas 110–116)
- **Problema:** O controller lê `idUser` do token mas **não atribui** ao criar
  `ChavePix`:

```csharp
ChavePix chavepixS = new ChavePix()
{
    Chave = chavepix.Chave,
    TipoChave = chavepix.TipoChave,
    Status = true
    // IdUser = idUser;  ← FALTANDO
};
```

- **Efeito:** `SaveChanges` falha (FK `ChavesPix → User`) ou grava `IdUser=0`.
  Em prod retorna **400** genérico `"Erro ao cadastrar chave pix!"`.
- **Impacto:** **PIX na caixa não funciona** — `PagamentoController` busca chave
  com `IdUser == admin.IdUser && Status == true`.
- **Correção:** `chavepixS.IdUser = idUser;` e
  `chavepixS.Criado = DateTime.UtcNow;`

---

### 19. `PixCaixa` — `return BadRequest` após sucesso (código morto)

- **Arquivo:** `Controllers/PagamentoController.cs`
- **Endpoints afetados:**
    - `POST /api/v1/Pagamento/solicitar` — case `MetodoPagamento.PixCaixa`
      (~linha 158)
    - `POST /api/v1/Pagamento/unico-solicitar` — case `MetodoPagamento.PixCaixa`
      (~linha 302)
- **Problema:** Após montar pagamento e obter `resultado` da Bixs/Caixa, o
  código faz:

```csharp
pagamento.Metodo = MetodoPagamento.PixCaixa;
codigoPagamento = resultado.PixEmv ?? ...;
return BadRequest("Erro ao solicitar pagamento. Tente novamente mais tarde."); // ← SEMPRE FALHA
```

- **Efeito:** Mesmo com chave PIX cadastrada e gateway respondendo, o cliente
  **sempre recebe 400**.
- **Correção:** Remover o `return BadRequest` e deixar cair no fluxo comum
  (`NotificarPagamento`, `SaveChanges`, `return Ok(codigoPagamento)`), como nos
  outros métodos.

---

### 20. `GET /api/ChavesPix/{id}` — sem validação de dono (IDOR)

- **Arquivo:** `Controllers/ChavesPixController.cs` (~linhas 43–54)
- **Problema:** Qualquer usuário autenticado pode ler chave PIX de outro admin
  informando o `idchavepix`.
- **Correção:** Filtrar `Where(c => c.IdChavePix == id && c.IdUser == idUser)`
  como no PUT/DELETE.

---

### 21. `GET /api/ChavesPix` — view montada mas não retornada

- **Arquivo:** `Controllers/ChavesPixController.cs` (~linhas 32–39)
- **Problema:** Monta `chavesPixView` (DTO reduzido) mas retorna `chavesPix`
  (entidade completa com navegação).
- **Correção:** `return Ok(chavesPixView);`

---

### 22. `POST /api/ControleAcessos` — sobrescreve senha com texto puro

- **Arquivo:** `Controllers/ControleAcessosController.cs` (~linha 147)
- **Problema:**

```csharp
usuario.PasswordHash = controleacesso.Password; // texto puro, não hash
await _context.SaveChangesAsync(); // persiste senha em claro
```

- **Efeito:** Após solicitar integração Bixs, a senha do admin fica **em texto
  puro** no banco. Login subsequente pode quebrar.
- **Correção:** Remover essa linha (a senha já foi validada com
  `VerifyHashedPassword` na linha anterior).

---

### 23. `ControleAcessosController` — `usuario.PasswordHash` passado à Bixs?

- **Arquivo:** `Controllers/ControleAcessosController.cs` (~linha 148)
- **Observação:** `CriarAcesso(usuario)` recebe usuário com `PasswordHash`
  corrompido (item 22). Validar se a API Bixs espera senha em claro ou hash —
  pode ser causa do “PixCaixa não deu, pedi pro Bruno olhar”.

---

## Pendências já documentadas (ainda válidas)

Itens do `relatorio_erros_backend.md` que **não foram re-testados** nesta rodada
mas seguem no código:

| Item | Resumo                                                 |
| :--- | :----------------------------------------------------- |
| 1    | `GET /api/Categorias` cross-tenant anônimo             |
| 2    | Claims sem null-check generalizado                     |
| 3    | `UserBloqueioController` sem `[Authorize]` na classe   |
| 6    | IDOR em `Notificacao/{id}/assinatura`                  |
| 7    | `GET /api/v1/Plano/{idPlano}` inacessível para cliente |

---

## Credenciais usadas nos testes

| Papel    | Conta                                       | Resultado                    |
| :------- | :------------------------------------------ | :--------------------------- |
| Master   | `Pagweb@vlks.com.br`                        | Login OK                     |
| Cliente  | `pedrolucasmota2005@gmail.com`              | Login OK                     |
| Admin QA | `estabelecimento.mcp.planos.2026@gmail.com` | **401** — não existe em prod |

> Para testar fluxo completo de **ChavesPix + ControleAcessos POST (admin)**, é
> necessário credencial de **admin com empresa vinculada** em produção.

---

## Recomendações para o backend (prioridade)

1. **P0 — Item 19:** Remover `return BadRequest` no case `PixCaixa`
   (mensalidade + cobrança avulsa).
2. **P0 — Item 18:** Setar `IdUser` no POST de ChavesPix.
3. **P0 — Item 22:** Não sobrescrever `PasswordHash` com senha em claro.
4. **P1 — Item 20:** IDOR no GET ChavesPix por id.
5. **P1 — Item 21:** Retornar view correta no GET lista.
6. **P2:** Fornecer conta admin de homologação para QA automatizado do frontend.

---

## Como reproduzir

```bash
node apps/PagWebFuncional/trash/api-audit-2026-08-06.mjs
```

Atualizar credenciais `ADMIN` no script quando houver conta admin válida em
prod.
