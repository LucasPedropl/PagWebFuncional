# Auditoria por suíte E2E — 10/08/2026

> **Origem:** execução da suíte `tests/e2e` (Playwright, 273 casos) contra
> `https://lojas.vlks.com.br`.
> **Reproduzir:** `cd apps/PagWebFuncional/tests/e2e && npm install && npm test`.
>
> Cada achado tem um teste automatizado marcado com `test.fail()`. Quando a API
> for corrigida, o teste acusa **"unexpected pass"** e força a remoção do
> marcador — nenhum item se perde por esquecimento no relatório.

---

## 0. Divergência entre a cópia local `/api` e a API publicada

`DIV-001` — **A pasta `api/` não é oráculo confiável do comportamento em
produção.** Diferenças confirmadas por requisição real durante a auditoria:

| Rota                                        | Cópia local `/api`                          | API publicada                          |
| :------------------------------------------ | :------------------------------------------ | :------------------------------------- |
| `api/v1/WhatsApp/*`                         | Controller presente                         | **404 em todas as rotas** (ausente)    |
| `GET /api/ChavesPix/{id}`                   | `FindAsync(id)` sem filtro → IDOR (item 20) | **404** para não dono (seguro)         |
| `DELETE /api/v1/Assinatura/assinatura/{id}` | Só `[Authorize]`, sem checagem de posse     | **403** para terceiros (seguro)        |

Consequência prática: os itens 20 e correlatos do relatório principal **não são
exploráveis em produção hoje**, mas voltam a ser se a cópia local for a base do
próximo deploy. Os testes de WhatsApp entram em `test.skip` automático enquanto a
rota devolver 404 e voltam a rodar sozinhos quando ela existir.

---

## 1. Achados novos

| ID     | Rota / arquivo                       | Severidade  | Resumo                                                            |
| :----- | :----------------------------------- | :---------- | :---------------------------------------------------------------- |
| BE-014 | `UserService.UpdateUserConfigsAsync` | Média       | `NotificacoesAtraso` recebido no DTO e nunca atribuído            |
| BE-015 | `CartaoController.Cadastrar`         | Alta        | Guarda invertida rejeita cartão de 16 dígitos                     |
| BE-016 | `CartaoController.Listar`            | **Crítica** | Devolve PAN completo e CCV em claro; DTO mascarado é código morto |
| BE-017 | `POST /api/UserBloqueio/plano/{id}`  | Alta        | 500 sempre — FK `PlanoIdPlano` (coluna sombra do EF)              |
| BE-018 | Handler global de exceções           | Média       | 500 vaza stack trace, nome do banco e schema                      |

### BE-014 — `NotificacoesAtraso` é descartado silenciosamente

- **Arquivo:** `Services/UserService.cs` (~1189)
- **Sintoma:** `PATCH /api/v1/Notificacao/configuracoes/editar` responde 200 com
  "Configurações atualizadas com sucesso", mas a leitura seguinte devolve o valor
  antigo. O usuário não consegue configurar os dias de aviso de atraso.
- **Causa:** o método copia `Notificacoes`, `Email`, `WhatsApp` e `Sms`, mas
  nunca `config.NotificacoesAtraso = dto.NotificacoesAtraso;`.
- **Correção sugerida:** atribuir o campo junto dos demais.
- **Teste:** `api/conta-cliente.spec.ts` → "dias de aviso de atraso devem ser
  persistidos".

### BE-015 — Cartão de 16 dígitos é sempre recusado

- **Arquivo:** `Controllers/CartaoController.cs:61`
- **Trecho:** `if (!ModelState.IsValid || dto.NumCartao.Length <= 16)`
- **Sintoma:** todo cartão real sem formatação (16 dígitos) recebe 400 —
  "Você digitou algum dado incorretamente". Só passa string com 17+ caracteres.
  O cadastro só funciona hoje porque o frontend envia o número com espaços; um
  cliente de API bem-comportado é rejeitado.
- **Correção sugerida:** validar dígitos, não comprimento bruto:

    ```csharp
    var digitos = new string(dto.NumCartao.Where(char.IsDigit).ToArray());
    if (digitos.Length is < 13 or > 19)
        return BadRequest("Número de cartão inválido.");
    ```

- **Teste:** `api/conta-cliente.spec.ts` → "cartão com 16 dígitos sem formatação
  deve ser aceito".

### BE-016 — Listagem de cartões devolve PAN completo e CCV

- **Arquivo:** `Controllers/CartaoController.cs:23-50`
- **Sintoma:** `GET /api/Cartao/meus-cartoes` responde com a entidade crua:

    ```json
    { "numCartao": "4242 4242 4242 4242", "ccv": "123", "ultimosDigitos": "4242" }
    ```

    O `cartoesDto` construído logo acima — com `"**** **** **** " + UltimosDigitos` —
    é montado, ordenado e **descartado**: o método termina com `return Ok(cartoes);`.
- **Impacto:** dado de cartão em claro trafega até o browser e entra em qualquer
  log ou telemetria do lado do cliente. Armazenar CCV é vedado pelo PCI-DSS
  (requisito 3.2) — o problema não é só da resposta, é da persistência.
- **Correção sugerida:** `return Ok(cartoesDto);` e parar de gravar `CCV` e
  `NumCartao` completos (usar tokenização do gateway).
- **Teste:** `api/conta-cliente.spec.ts` → "listagem não deve expor número
  completo nem CCV".

### BE-017 — Bloqueio de plano quebrado por FK duplicada

- **Rota:** `POST /api/UserBloqueio/plano/{planoId}`
- **Sintoma:** 500 em 100% das chamadas:

    ```
    The INSERT statement conflicted with the FOREIGN KEY constraint
    "FK_PlanosBloqueados_Planos_PlanoIdPlano".
    ```

- **Causa:** `UserPlanoBloqueado` (`Models/Plano.cs`) não declara chave composta
  nem FK no `OnModelCreating`. O EF cria uma coluna sombra `PlanoIdPlano` além de
  `IdPlano` e a insere nula. A funcionalidade nunca funcionou em produção.
- **Correção sugerida:** mapear explicitamente no `AppDbContext`
  (`HasKey(x => new { x.IdUser, x.IdPlano })` e
  `HasOne(x => x.Plano).WithMany().HasForeignKey(x => x.IdPlano)`) e gerar a
  migração que remove a coluna sombra.
- **Teste:** `api/conta-cliente.spec.ts` → "cliente bloqueia e desbloqueia um plano".

### BE-018 — 500 vaza stack trace e metadados do banco

- **Sintoma:** a resposta do BE-017 devolve o `DbUpdateException` completo,
  incluindo `database "uaipdvco_pagweb"`, schema `usu_pweb` e a árvore de chamadas
  do EF Core.
- **Impacto:** entrega o nome do banco, o schema e as versões da stack — trabalho
  de reconhecimento pronto antes de qualquer tentativa de injeção.
- **Correção sugerida:** middleware de exceção que loga o detalhe no servidor e
  devolve payload genérico; garantir `ASPNETCORE_ENVIRONMENT=Production` no
  ambiente publicado.
- **Teste:** `api/conta-cliente.spec.ts` → "erro interno não deve vazar detalhes
  do banco".

---

## 2. Itens já catalogados, agora com teste de regressão

| ID     | Item no relatório principal                       | Teste                                                        |
| :----- | :------------------------------------------------ | :----------------------------------------------------------- |
| BE-001 | `GET /api/v1/Plano/{idPlano}` para cliente (403)  | `api/planos.spec.ts`                                          |
| BE-002 | `EmpresaController.Update` sem checagem de posse  | `api/seguranca.spec.ts` → "renomear a empresa alheia"         |
| BE-004 | `POST ControleAcessos` sobrescreve senha em claro | `api/comunicacao.spec.ts` (só o ramo de senha inválida)       |
| BE-007 | `PATCH /api/v1/Endereco/{id}` `[AllowAnonymous]`  | `api/seguranca.spec.ts` → "reescrever endereço de terceiros"  |
| BE-008 | `PATCH /api/v1/User/{id}` sem `[Authorize]`       | `api/seguranca.spec.ts` → "alterar dados de outro usuário"    |
| BE-009 | `DELETE /api/v1/User/{id}` sem `[Authorize]`      | `api/seguranca.spec.ts` → "inativar outro usuário"            |
| BE-010 | `POST /api/v1/User/conecta-admin/{id}` sem role   | `api/seguranca.spec.ts` → "auto-promover a admin"             |
| BE-011 | `zTemporarioController` inteiro anônimo           | `api/seguranca.spec.ts` → "Endpoints de diagnóstico expostos" |
| BE-012 | `danger-reset-database` sem autenticação          | `api/seguranca.spec.ts` (usa `confirmacao=NAO`, não destrói)  |
| BE-013 | `lista-usuarios` expõe `verificationToken`        | `api/seguranca.spec.ts` → "token de verificação"              |

### BE-012 merece destaque

`DELETE /api/zTemporario/dev/danger-reset-database?confirmacao=SIM` é **anônimo**
e executa `DELETE FROM` em **todas** as tabelas do banco (exceto
`__EFMigrationsHistory`), seguido de `DBCC CHECKIDENT ... RESEED, 1`.

Qualquer pessoa na internet que conheça a URL zera a base inteira. Não há
autenticação, não há rate limit, não há backup no caminho e a confirmação viaja
na query string. É o item de maior severidade em aberto: enquanto o controller
`zTemporario` existir em produção, ele deve no mínimo exigir role `Master` e um
segredo fora da URL — idealmente não existir no build publicado
(`#if DEBUG` ou registro condicionado ao ambiente).

---

## 3. Achado no frontend

`FE-001` — `UserLayout.handleLogout` chama `sessionService.logout()` (que aponta o
hash para `#/login?type=client`) e em seguida `navigate('/')`. A segunda navegação
vence: o usuário sempre cai na landing e o redirecionamento embutido no service é
código morto nesse caminho. A limpeza de tokens funciona corretamente. Se o
destino desejado é a landing, remover o `window.location.hash` de
`sessionService.logout()` elimina a duplicidade.

---

## 4. Comportamentos confirmados (não são bugs — são contrato)

Documentados aqui porque surpreenderam durante a escrita dos testes e agora estão
fixados por asserção:

- **Assinatura criada pelo admin nasce `Pendente`.** O admin não consegue mudar o
  status até o cliente autorizar via
  `PATCH /api/v1/User/minha-assinatura/{id}/{status}`.
- **`POST /api/v1/User/register?idEmpresa=N` cria usuário já `Ativo`** e vinculado,
  sem token de e-mail. É o que torna a suíte auto-suficiente — e também um vetor
  aberto: a rota é `[AllowAnonymous]` e não valida se o chamador tem relação com
  `idEmpresa`.
- **`POST /api/v1/User/admin/conecta-cliente` com e-mail sem conta devolve 200**
  ("Email para formar vinculo criado com sucesso") — é fluxo de convite, não erro.
- **`POST /api/Cobrancas` não devolve id**, apenas o texto
  "Cobrança criada com sucesso." — obriga um GET de listagem para recuperar o registro.
- **`POST /api/FeedBacks` só aceita `multipart/form-data`** (o DTO tem
  `List<IFormFile>`); um POST JSON válido falha na validação de modelo.
- **`useProdutos` monta a lista a partir das categorias da empresa** — produto sem
  categoria nunca aparece na tela de Produtos, embora exista na API.
- **Mensalidades não são geradas na criação da assinatura**; ficam a cargo do
  `MensalidadeAtrasadaWorker` (ciclo de 24h).
