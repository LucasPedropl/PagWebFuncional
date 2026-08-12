# Suíte E2E do PagWeb

273 casos em Playwright cobrindo a API .NET e a interface React. A suíte é
**auto-suficiente**: ela constrói do zero os dois tenants que usa, então roda
logo depois de um reset de banco sem preparo manual.

```bash
cd apps/PagWebFuncional/tests/e2e
npm install
npx playwright install chromium   # só na primeira vez
npm test
```

Última execução completa: **269 passaram, 4 puladas, 0 falhas** (~1 min, 4 workers).

---

## Os dois projects

| Project | O que faz                                                        | Casos |
| :------ | :--------------------------------------------------------------- | ----: |
| `api`   | HTTP direto contra a API, sem browser. Cobre ~100 endpoints.      |   205 |
| `ui`    | Chromium sobre o build de `dist/`, falando com a mesma API.       |    68 |

```bash
npm run test:api      # só API
npm run test:ui       # só interface
npm run test:headed   # UI com browser visível
npm run report        # abre o relatório HTML da última execução
```

A UI precisa do build do frontend:

```bash
cd apps/PagWebFuncional && npm run build
```

O `webServer` do Playwright sobe `scripts/static-server.mjs` na porta 4173. Não
usamos `vite preview` porque o `vite.config.ts` do app escolhe a porta
dinamicamente (`getAvailablePort`), o que impede prever a URL base.

---

## Como o ambiente é semeado

`global-setup.ts` monta dois tenants completos antes de qualquer spec e grava o
resultado em `.e2e-state.json`, lido pelos workers.

```
tenant principal              tenant rival (isolamento)
├── admin  (role Admin)       ├── admin
├── empresa                   ├── empresa
└── 2 clientes conectados     └── 1 cliente conectado
```

A cadeia de bootstrap (`src/seed.ts`) contorna a ativação por e-mail:

1. `POST /User/register?idEmpresa=N` → cria o usuário **já Ativo**
   (`RegisterNovatoAsync` seta `Status = Ativo` e `IsEmailVerified = true`).
2. `POST /login-cliente` → autentica.
3. `POST /Empresa` → cria a empresa e vincula o criador como `UserTipo.Admin`.
4. `POST /login-admin` → agora devolve token com role `Admin`.
5. Novos `register?idEmpresa=<empresa criada>` → clientes já conectados.

O passo 1 precisa de **uma** empresa preexistente como âncora. Se o banco estiver
completamente vazio, crie uma empresa manualmente e informe
`E2E_BOOTSTRAP_EMPRESA_ID`.

---

## Fixtures

Tokens são resolvidos por worker — o JWT dura horas, reautenticar por teste seria
desperdício.

| Fixture        | O que entrega                                          |
| :------------- | :----------------------------------------------------- |
| `world`        | Estado semeado completo                                |
| `tenant`       | Tenant principal                                       |
| `rival`        | Tenant secundário (provas de isolamento)               |
| `admin`        | Token role `Admin` do tenant principal                 |
| `cliente`      | Token role `Cliente` (primeiro cliente)                |
| `cliente2`     | Token role `Cliente` (segundo cliente)                 |
| `rivalAdmin`   | Token role `Admin` do tenant rival                     |
| `rivalCliente` | Token role `Cliente` do tenant rival                   |
| `master`       | Token role `Master` (conta BixS)                       |

> A conta `Pagweb@vlks.com.br` **não** é um estabelecimento: é um atalho
> hardcoded em `UserAdminController.Login` que devolve role `Master` com
> `IdUser = 0`, sem linha na tabela `User`. Ela só serve para os endpoints
> `[Authorize(Roles = "Master")]` — todas as rotas de Admin respondem 403 para
> ela. É por isso que a suíte cria os próprios admins.

---

## Variáveis de ambiente

| Variável                   | Padrão                        | Para quê                                       |
| :------------------------- | :---------------------------- | :--------------------------------------------- |
| `E2E_API_BASE_URL`         | `https://lojas.vlks.com.br`   | Origem da API                                  |
| `E2E_WEB_BASE_URL`         | `http://127.0.0.1:4173`       | Origem do frontend nos testes de UI            |
| `E2E_WEB_PORT`             | `4173`                        | Porta do servidor estático embutido            |
| `E2E_MANAGE_WEB_SERVER`    | `1`                           | `0` se já houver um servidor rodando           |
| `E2E_BOOTSTRAP_EMPRESA_ID` | descoberto via `GET /Empresa` | Âncora do primeiro registro ativo              |
| `E2E_MASTER_EMAIL/PASSWORD`| conta BixS                    | Credenciais de role `Master`                   |
| `E2E_SEED_PASSWORD`        | `E2e@Pagweb123`               | Senha das contas criadas                       |
| `E2E_RESET_DB`             | `0`                           | **Wipe total do banco no teardown** (ver abaixo)|

---

## Reset de banco — leia antes de usar

`E2E_RESET_DB=1` dispara, ao fim da execução,
`DELETE /api/zTemporario/dev/danger-reset-database?confirmacao=SIM`.

Esse endpoint executa `DELETE FROM` em **todas** as tabelas (exceto
`__EFMigrationsHistory`) e faz `DBCC CHECKIDENT ... RESEED, 1`. Não há filtro por
empresa, não há backup e **não há como desfazer**. Ele apaga todos os dados do
ambiente apontado por `E2E_API_BASE_URL`, incluindo o que não foi criado pela
suíte.

Por isso ele vem **desligado**. A suíte não precisa dele: toda a massa nasce
identificável (prefixo `E2E`, e-mails `@pagweb-e2e.test`) e os testes que mutam
estado usam entidades descartáveis criadas no próprio caso.

Para disparar manualmente, fora da suíte:

```bash
node scripts/reset-database.mjs --yes-i-am-sure
```

Depois de um reset, o banco fica sem empresas e o bootstrap perde a âncora do
passo 1 — crie uma empresa e passe `E2E_BOOTSTRAP_EMPRESA_ID` na próxima execução.

---

## Estrutura

```
tests/e2e/
├── playwright.config.ts       # dois projects, webServer, reporters
├── global-setup.ts            # semeia os tenants
├── global-teardown.ts         # reset opcional
├── src/
│   ├── config.ts              # env
│   ├── http.ts                # cliente HTTP — nunca lança em não-2xx
│   ├── data.ts                # CPF/CNPJ com dígito verificador válido
│   ├── auth.ts                # os três papéis do TolkenService
│   ├── seed.ts                # cadeia de bootstrap
│   ├── factories.ts           # planos, catálogo, assinaturas, cobranças
│   ├── state.ts               # estado compartilhado entre workers
│   └── fixtures.ts            # fixtures worker-scoped
├── scripts/
│   ├── static-server.mjs      # serve dist/ em porta fixa
│   └── reset-database.mjs     # wipe destrutivo, opt-in
├── api/
│   ├── auth.spec.ts           # login, registro, ativação, JWT
│   ├── empresa-clientes.spec.ts
│   ├── planos.spec.ts
│   ├── assinaturas.spec.ts    # ciclo Pendente → autorização → suspensão
│   ├── catalogo.spec.ts       # categorias, produtos, serviços
│   ├── financeiro.spec.ts     # mensalidades, cobranças, pagamentos
│   ├── conta-cliente.spec.ts  # endereços, cartões, PIX, notificações, bloqueios
│   ├── comunicacao.spec.ts    # chat, feedback, WhatsApp, controle de acesso
│   └── seguranca.spec.ts      # matriz de authz, cross-tenant, IDOR
└── ui/
    ├── support/session.ts     # injeta sessão via addInitScript
    ├── auth.spec.ts           # login real, guardas, logout
    ├── navegacao.spec.ts      # toda rota monta sem erro de console
    ├── publico.spec.ts        # landing, diretório, cadastro
    ├── business-crud.spec.ts  # o que a tela cria aparece na API
    └── identidade-dupla.spec.ts
```

---

## Bugs conhecidos e `test.fail()`

Os testes de segurança afirmam o comportamento **correto**. Onde a API não o
cumpre hoje, o caso é marcado `test.fail()` com um identificador `BE-xxx`
catalogado em [`docs/auditoria_e2e_2026-08-10.md`](../../docs/auditoria_e2e_2026-08-10.md).

A vantagem sobre um `skip` ou um comentário: quando o backend for corrigido, o
Playwright acusa **"unexpected pass"** e a suíte falha — obrigando a remoção do
marcador. Nenhum achado morre esquecido no relatório.

Contagem atual: **16 `test.fail()`** ativos — 11 confirmando achados já
catalogados (BE-001 a BE-013) e 5 dos achados novos desta auditoria
(BE-014 a BE-018).

Os 4 casos pulados são os de WhatsApp: a API publicada devolve 404 em
`api/v1/WhatsApp/*`. Os testes ficam prontos e voltam a rodar sozinhos quando a
rota existir.

---

## Convenções ao escrever novos casos

- **Nunca mutar o tenant compartilhado.** Renomear a empresa ou conectar
  `tenant.clientes[0]` a outro estabelecimento quebra os testes de isolamento e
  os de UI que conferem nomes. Para casos que mutam, crie a vítima no próprio
  teste (`registerActiveUser`, `seedTenant`).
- **Asserção por id, não por nome.** Nomes podem ser alterados por outro caso;
  ids não.
- **`api.*` não lança em erro HTTP** — quem decide o que é sucesso é o teste.
  Já as `factories.*` lançam: pré-condição quebrada deve estourar como erro de
  setup, não virar asserção confusa no meio do caso.
- **Títulos de página na UI:** use `tituloDaPagina(page, ...)`, que restringe ao
  `<main>`. Os layouts repetem o mesmo texto no cabeçalho fixo e o modo estrito
  do Playwright falha com dois elementos.
