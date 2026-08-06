# Relatório de Erros - API PagWebV1

> **Última auditoria:** 06/08/2026 (testes HTTP em `https://lojas.vlks.com.br` + análise estática do submodule `api`) — ver **`auditoria_api_2026-08-06.md`** para bugs novos (ChavesPix, PixCaixa, ControleAcessos).  
> **Auditoria anterior:** 21/07/2026 (revisão pós-atualização do submodule
> `apps/PagWebFuncional/api`)  
> **API local:** `apps/PagWebFuncional/api/PagWebV1` — `dotnet build`: 0 erros,
> **419** avisos de nulidade  
> **API em produção/homologação:** `https://lojas.vlks.com.br` (vários fixes do
> repositório **ainda não refletidos** em produção)  
> **Frontend:** PagWeb em `http://localhost:3000` ou localmente  
> **MCP:** `openapi-pagwebv1` — `install_mcp` (`openapi_sync`, server
> `1b701ad2-2d9c-49fb-92f6-2259eb998eda`) executado com sucesso; chamadas via
> `call_mcp_tool` falharam com _Connection closed_ nesta sessão — testes
> complementares via `curl.exe` em homologação.

---

## Resumo

| Categoria / Bug                                               | Status         | Notas                                                                                                                                        |
| :------------------------------------------------------------ | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **CS8602 / avisos de nulidade**                               | **Pendente**   | 419 avisos no build limpo (antes ~384).                                                                                                      |
| **Exposição cross-tenant em Categorias (listagens públicas)** | **Pendente**   | `GET /api/Categorias` e `GET /api/Categorias/{id}` seguem `[AllowAnonymous]` sem filtro de empresa. Rota privada foi corrigida (ver abaixo). |
| **Rota privada de categorias (parâmetro ignorado)**           | **Corrigido**  | Rota alterada para `GET /api/Categorias/empresa-categorias-privado/` usando só o vínculo do token.                                           |
| **Claims sem null-check (generalizado)**                      | **Pendente**   | Padrão `.Value` sem checagem persiste em vários controllers.                                                                                 |
| **`meus-bloqueios/planos` (claim `"id"`)**                    | **Pendente**   | `GetPlanosBloqueados` ainda usa `FindFirst("id")`; `empresas` já usa `NameIdentifier`. Confirmado em homologação (400 + NRE).                |
| **`UserBloqueioController` sem `[Authorize]`**                | **Pendente**   | Controller inteiro sem autorização; anônimo recebe 400/NRE em vez de 401.                                                                    |
| **IDOR em configs de assinatura (autenticado)**               | **Pendente**   | `[Authorize]` no controller remove acesso anônimo, mas GET/PATCH `{id}/assinatura` não validam posse da assinatura.                          |
| **`GET /api/v1/Plano/{idPlano}` para cliente**                | **Pendente**   | Método tem `[Authorize]`, mas a classe exige `Roles = "Admin"` — cliente continua sem acesso.                                                |
| **POST mensagem no chat (cliente)**                           | **Pendente**   | `TipoUser(usuarioId, true)` ainda bloqueia cliente.                                                                                          |
| **Módulo de feedback PagWeb (NOVO)**                          | **Solicitado** | POST para cliente e estabelecimento; GET para app central Bix — item **17**.                                                                 |
| **`POST /api/ChavesPix` — IdUser não persistido**             | **Pendente**   | Item **18** em `auditoria_api_2026-08-06.md` — bloqueia PIX na caixa.                                                                       |
| **`PixCaixa` — return BadRequest após sucesso**                | **Pendente**   | Item **19** — `solicitar` e `unico-solicitar` sempre falham no case PixCaixa.                                                               |
| **`GET /api/ChavesPix/{id}` IDOR**                            | **Pendente**   | Item **20** — qualquer auth lê chave de outro admin.                                                                                         |
| **`POST ControleAcessos` sobrescreve senha em claro**         | **Pendente**   | Item **22** — `usuario.PasswordHash = controleacesso.Password`.                                                                              |
| **Permissão invertida em `GET /api/Cobrancas/{id}`**          | **Corrigido**  | Condição usa `IdEmpresa == cobranca.IdEmpresa`.                                                                                              |
| **Ordem de nulo em `UserService` (adminEmpresa)**             | **Corrigido**  | Checagem `adminEmpresa != null` antes de `FindAsync`.                                                                                        |
| **Validação de status no POST Assinatura**                    | **Corrigido**  | Filtro usa `dto.IdUser`.                                                                                                                     |
| **POST Endereço sem retornar ID**                             | **Corrigido**  | Retorna `Ok(endereco)` com `IdEndereco`.                                                                                                     |
| **NRE `login-admin` (`&&` em tipouser nulo)**                 | **Corrigido**  | Trecho removido com o novo fluxo de login.                                                                                                   |
| **IDOR público em Notificacao (sem login)**                   | **Corrigido**  | `NotificacaoController` com `[Authorize]` na classe.                                                                                         |

---

## 1. Exposição de dados cross-tenant em endpoints de Categorias (parcial)

- **Arquivo:** `Controllers/CategoriasController.cs`
- **Ainda pendente:**
    1. `GET /api/Categorias` e `GET /api/Categorias/{id}` com `[AllowAnonymous]`
       listam categorias de **todas** as empresas (apenas filtro `Ativo`).
- **Corrigido nesta versão:**
    - `GET /api/Categorias/empresa-categorias-privado/` — rota sem `{idEmpresa}`
      ignorado; filtra por `vinculo.IdEmpresa` do admin autenticado.
- **Correção sugerida (restante):** Remover `[AllowAnonymous]` das listagens
  globais ou exigir `idEmpresa` nas rotas públicas
  (`empresa-categorias-publico/{idEmpresa}` já existe).

---

## 2. NullReferenceException em Claims de Usuário (generalizado)

- **Arquivos:** `UserAdminController.cs`, `AssinaturaController.cs`,
  `ChatsController.cs`, `EnderecoController.cs`, `MensalidadeController.cs`,
  `NotificacaoController.cs` (métodos legados), `PagamentoController.cs`,
  `UserBloqueioController.cs`, entre outros.
- **Problema:** `User.FindFirst(ClaimTypes.NameIdentifier).Value` sem verificar
  `null`.
- **Correção sugerida:** Helper `GetUserIdLogado()` com `TryParse` (padrão já
  usado em partes de `CobrancasController` e `PlanoController`).

---

## 3. `UserBloqueioController` — claim errada, sem `[Authorize]`

- **Arquivo:** `Controllers/UserBloqueioController.cs`
- **Endpoints:**
    - `GET /api/UserBloqueio/meus-bloqueios/planos` — **ainda**
      `int.Parse(User.FindFirst("id").Value)` (linha ~93).
    - `GET /api/UserBloqueio/meus-bloqueios/empresas` — corrigido para
      `ClaimTypes.NameIdentifier` + null-check.
- **Problema adicional:** Nenhum `[Authorize]` no controller; requisição anônima
  em planos gera NRE e HTTP 400 (reproduzido em `https://lojas.vlks.com.br`).
- **Correção sugerida:** `[Authorize]` na classe; mesmo padrão de claim que em
  `GetEmpresasBloqueadas`.

---

## 4. Compilação e warnings de nulidade (CS8602)

- **Status:** Build OK, **419** avisos (clean + rebuild).
- **Análise:** Risco de `500` em runtime com dados inconsistentes; volume
  aumentou em relação à auditoria anterior.

---

## 5. IDOR em configurações de assinatura (usuário autenticado)

- **Arquivo:** `Controllers/NotificacaoController.cs` (`GetConfigs`,
  `UpdateConfigs`)
- **Evolução:** Acesso **anônimo** foi corrigido (`[Authorize]` no controller).
- **Problema remanescente:** Qualquer usuário logado pode ler/alterar configs de
  **qualquer** `id` de assinatura; `idUsuario` é lido do token mas **não** usado
  para autorizar o recurso.
- **Correção sugerida:** Validar no serviço se o usuário é dono da assinatura ou
  admin da empresa do plano.

---

## 6. Restrição indevida em `GET /api/v1/Plano/{idPlano}`

- **Arquivo:** `Controllers/PlanoController.cs`
- **Código:** Classe `[Authorize(Roles = "Admin")]`; método `GetPlano` com
  `[Authorize]` (sem `AllowAnonymous`).
- **Problema:** Políticas combinadas ainda exigem role **Admin**; cliente
  autenticado recebe 403 ao visualizar plano para assinatura.
- **Correção sugerida:** `[AllowAnonymous]` ou
  `[Authorize(Roles = "Admin,Cliente")]` apenas neste método.

---

## 7. Cliente não consegue enviar mensagens no chat

- **Arquivo:** `Controllers/ChatsController.cs` — `PostMensagem`
- **Endpoint:** `POST /api/Chats/{id}/Mensagens`
- **Problema:** `TipoUser(usuarioId, true)` retorna `null` para cliente → `401`
  antes de salvar.
- **Correção sugerida:** Separar fluxo Admin/Cliente conforme auditoria anterior
  (validar `chat.IdUsuario` para cliente).

---

## 15. Chat — confirmação de leitura (checks azuis) nas mensagens enviadas

- **Endpoint:** `GET /api/Chats/{id}/Mensagens` (e fluxo `POST .../Ler`)
- **Problema:** Para mensagens **enviadas por mim**, o campo `lida` / `Lida` (ou
  `dataLeitura`) precisa passar a `true` quando o **outro participante** abre o
  chat e chama `POST /Chats/{id}/Ler`. Se a API só marca leitura das mensagens
  **recebidas** pelo usuário que leu, o front nunca exibirá checks azuis no
  remetente.
- **Correção sugerida:** Ao registrar leitura, atualizar `Lida` (ou equivalente)
  nas mensagens do outro participante já entregues, e devolver esse estado no
  GET de mensagens. Garantir serialização JSON (`lida` ou `Lida`) e, se
  aplicável, `idRemetente`/`idUsuario` distinto por remetente real (não repetir
  sempre o `idUsuario` do thread).

---

## 16. Autochat — `Tipo` da mensagem sempre como Admin

- **Arquivo:** `Controllers/ChatsController.cs` — `PostMensagem`
- **Problema:** Quem é dono da empresa e envia pelo perfil **cliente** ainda
  passa em `TipoUser(..., AdminLogin: true)`; se `IdEmpresa` bate, `Tipo` vira
  `Admin` em todas as mensagens. No front, bolhas preto/branco ficam iguais
  (mesmo “lado”).
- **Correção sugerida:** Definir `Tipo` pelo papel do token (`Cliente` vs
  `Admin`) ou pelo vínculo do chat, não só por `IdEmpresa == idEmpresaDoChat`.

---

## 17. Módulo de feedback da plataforma PagWeb (funcionalidade nova)

- **Status:** **Não implementado na API** — frontend PagWeb com **envio** pronto
  (aguardando `POST`).
- **Escopo:** Feedback sobre o **produto PagWeb** (bugs, UX, sugestões) —
  **não** é canal de atendimento cliente ↔ estabelecimento (isso é o chat).
- **Quem envia:** Usuário **cliente** e usuário **estabelecimento (admin)**,
  autenticados no PagWeb.
- **Quem lista:** Aplicação **central Bix** (time de desenvolvimento). **Não**
  há tela de listagem no PagWeb.

### Endpoints propostos

| Método   | Rota               | Auth                                                               | Descrição                                                                                                                                                                                                                                                  |
| :------- | :----------------- | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POST** | `/api/v1/Feedback` | `[Authorize]` — roles **Cliente** e **Admin** (estabelecimento)    | Cria feedback PagWeb. **Body:** `multipart/form-data`: `titulo` (máx. 120), `descricao` (máx. 4000), `arquivos` (0–5: JPEG/PNG/WebP/GIF/PDF, máx. 10 MB cada). Opcional: `tipoPerfil` (`Cliente` / `Empresa`) ou inferir do token. **201:** objeto criado. |
| **GET**  | `/api/v1/Feedback` | Credencial **Bix / backoffice** (não expor ao JWT comum do PagWeb) | Lista feedbacks para o time de dev na **app central Bix**. Paginação: `?page=&pageSize=`, ordenação por data desc. Filtros opcionais: `tipoPerfil`, intervalo de datas. **Não** usar no frontend PagWeb.                                                   |

> **Nota:** Evitar rotas tipo `/Feedback/admin` consumíveis pelo admin de
> estabelecimento no PagWeb — o admin de loja também **envia** feedback, mas
> **não** tria feedback de outros usuários.

### Modelo sugerido (JSON)

```json
{
	"idFeedback": 1,
	"titulo": "Erro ao abrir chat",
	"descricao": "Após F5 o chat não reabre.",
	"dataCriacao": "2026-07-21T14:00:00Z",
	"idUsuario": 42,
	"nomeUsuario": "Maria",
	"emailUsuario": "maria@email.com",
	"tipoPerfil": "Cliente",
	"arquivos": [
		{
			"idArquivo": 10,
			"nomeArquivo": "print.png",
			"urlArquivo": "https://.../uploads/feedback/10.png",
			"tipoMime": "image/png"
		}
	]
}
```

### Regras de negócio sugeridas

- `IdUser` e perfil no momento do envio; sem vínculo com `IdEmpresa` do chat.
- Upload em `wwwroot/uploads/feedback/{idFeedback}/` (padrão anexos do chat).
- Rate limit por usuário (ex.: 10 envios / hora).
- **GET:** autenticação separada (API key, client credentials Bix ou role
  interna) — documentar no contrato da app central Bix.
- **Frontend PagWeb:** `#/feedback` (cliente), `#/business/feedback`
  (estabelecimento) — `features/feedback/services/feedbackService.ts` (somente
  `POST`).

---

## Histórico de correções (removidos deste relatório)

Os itens abaixo foram **corrigidos no código** da pasta `api` auditada em
21/07/2026 e saíram das seções detalhadas:

| Item anterior                                                 | Correção observada                               |
| :------------------------------------------------------------ | :----------------------------------------------- |
| Permissão invertida em `GET /api/Cobrancas/{id}`              | `vinculo.IdEmpresa == cobranca.IdEmpresa`        |
| NRE `login-admin` (`&&` com `tipouser` nulo)                  | Novo fluxo de login sem `TipoUser` nesse ponto   |
| Ordem de nulo `adminEmpresa` / `adminconfig` em `UserService` | `if (adminEmpresa != null)` antes de `FindAsync` |
| Validação de status no POST Assinatura (`idAdmin` vs cliente) | Filtro com `dto.IdUser`                          |
| POST Endereço sem ID                                          | `return Ok(endereco)`                            |
| Rota privada categorias com `{idEmpresa}` ignorado            | Rota sem parâmetro, escopo pelo token            |
| IDOR **público** em `Notificacao` `{id}/assinatura`           | `[Authorize]` no controller                      |
