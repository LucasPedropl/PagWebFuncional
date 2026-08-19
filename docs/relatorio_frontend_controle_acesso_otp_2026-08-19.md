# Relatório — Frontend PagWeb alinhado à API pós-`c6c7c12` (Controle de Acesso + OTP)

> **Data:** 2026-08-19 **Repo:** `apps/PagWebFuncional` (Vite + React 19 + TS +
> Tailwind v4 + zod) **Origem:**
> `trash/relatorio_api_pagweb_atualizacao_frontend_2026-08-19.md` **API de
> referência:** PagWebV1 em `c6c7c12` (repo git separado — **não foi alterado**)
> **Auditoria da API:**
> `apps/PagWebFuncional/docs/relatorio_api_controle_acesso_bixs_2026-08-19.md`

---

## Sumário

1. [Veredito](#1-veredito)
2. [O que estava quebrado](#2-o-que-estava-quebrado)
3. [Mudanças por arquivo](#3-mudanças-por-arquivo)
4. [Fluxo antes × depois](#4-fluxo-antes--depois)
5. [Mudança de fluxo no admin-upgrade](#5-mudança-de-fluxo-no-admin-upgrade)
6. [Bloqueio remanescente: OTP depende do backend](#6-bloqueio-remanescente-otp-depende-do-backend)
7. [Testes e2e corrigidos](#7-testes-e2e-corrigidos)
8. [Gates de qualidade](#8-gates-de-qualidade)
9. [Achado de repositório: `.gitignore` engolindo os specs](#9-achado-de-repositório-gitignore-engolindo-os-specs)
10. [Limitações conhecidas e o que não foi feito](#10-limitações-conhecidas-e-o-que-não-foi-feito)
11. [Como testar](#11-como-testar)

---

## 1. Veredito

- **Score:** 7/10
- **Status:** Solid (com uma dependência externa aberta)
- **Racional:** o frontend saiu de "quebrado silenciosamente" para "correto e
  honesto". A leitura de status do Admin foi corrigida na raiz (rota certa, sem
  `localStorage` como fonte de verdade) e os gates de Payment/WhatsApp voltam a
  funcionar. Não chega a 9 porque **o fluxo de nova solicitação continua
  dependendo de um endpoint que a API ainda não expõe** — o front trata isso com
  degradação explícita, mas o caminho feliz só fecha quando o backend subir o
  proxy de OTP.

O relatório de origem foi bom (8/10) e o diagnóstico dele se confirmou 1:1
contra o código.

---

## 2. O que estava quebrado

Dois defeitos independentes, ambos silenciosos:

**2.1 — Admin lia o status pela rota errada.** O commit `3ed0b44` tornou
`GET /api/ControleAcessos/{id}` **Master-only**. O front continuava chamando
essa rota com um id guardado em `localStorage`. Resultado: 403 → o hook limpava
o storage → `myRequest` virava `null` → a tela mostrava o formulário "Solicitar
integração" mesmo com solicitação existente, e `useModuleAccess` reportava
Payment/WhatsApp como `Inativo` **para sempre**. Os gates de PIX, boleto e
WhatsApp nunca destravavam, mesmo depois de o Master aprovar.

**2.2 — POST sem `VerificationCode`.** O commit `c6c7c12` tornou o campo
`required` em `ControleViewPost`. O front não o enviava → `400` em toda
solicitação.

O `localStorage` como fonte de verdade era o agravante dos dois: mascarava o 403
como "não há solicitação", transformando um erro de contrato em estado
silenciosamente errado.

---

## 3. Mudanças por arquivo

9 arquivos do app + 1 spec e2e. Nenhum arquivo em `api/`, nenhum `.cs`.

| Arquivo                                                      | Mudança                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/controle-acesso/schemas/controleAcessoSchemas.ts`  | `verificationCode` (regex 6 dígitos) no `ControleAcessoRequestInputSchema`; **removidos** `CONTROLE_ID_STORAGE_KEY` e `controleAcessoStorage`; novo `SendVerificationCodeResultSchema`; grafia `cpF_CNPJ` aceita (ver 10.3)                                                           |
| `features/controle-acesso/services/controleAcessoService.ts` | Novos `getMyStatus()` e `sendVerificationCode()`; `VerificationCodeEndpointMissingError`; `requestAccess` agora envia `verificationCode` e retorna `void`; mapa de erros específico; removidos `parseCreatedId`/`getStoredId`/`clearStoredId`; `getById` documentado como Master-only |
| `features/controle-acesso/hooks/useControleAcesso.ts`        | `refresh()` usa `getMyStatus()` para não-Master (Master → `null`); falha de status só loga, não derruba a tela; `requestAccess` recarrega via `getMyStatus()`; expõe `sendVerificationCode`                                                                                           |
| `features/controle-acesso/hooks/useModuleAccess.ts`          | Só JSDoc (apontava para a rota antiga)                                                                                                                                                                                                                                                |
| `features/integracoes/components/IntegracoesPanel.tsx`       | Campo OTP + botão "Enviar código" com cooldown de 60s; aviso persistente quando o endpoint não existe; formulário oculto para Master; card específico para solicitação recusada; validação de 6 dígitos; pré-seleção via `?modulos=`                                                  |
| `features/admin-upgrade/services/adminUpgradeService.ts`     | Removida a solicitação de módulos inline (ver seção 5); resultado virou `{ wantsModules }`                                                                                                                                                                                            |
| `features/admin-upgrade/hooks/useAdminUpgrade.ts`            | Com módulos marcados → redireciona para Integrações com pré-seleção; sem módulos → dashboard                                                                                                                                                                                          |
| `features/admin-upgrade/components/AdminUpgradeAddons.tsx`   | Copy ajustada: a solicitação não é enviada ali                                                                                                                                                                                                                                        |
| `services/userService.ts`                                    | `payInvoice` removido — usava `POST /Pagamento/confirmar`, removido do Swagger, sem nenhum caller                                                                                                                                                                                     |
| `tests/e2e/api/comunicacao.spec.ts`                          | 3 testes corrigidos + 1 novo (ver seção 7)                                                                                                                                                                                                                                            |

### Contratos consumidos

| Ação                      | Rota                                     | Role                         |
| ------------------------- | ---------------------------------------- | ---------------------------- |
| Status da própria empresa | `GET /api/v1/User/status-acesso`         | Admin                        |
| Solicitar módulos         | `POST /api/v1/User/solicitar-acesso`     | Admin                        |
| Enviar OTP                | `POST /api/v1/User/enviar-codigo-acesso` | Admin — **ainda não existe** |
| Listar solicitações       | `GET /api/ControleAcessos`               | Master                       |
| Detalhe                   | `GET /api/ControleAcessos/{id}`          | Master                       |
| Aprovar/recusar           | `PUT /api/ControleAcessos/{id}`          | Master                       |

---

## 4. Fluxo antes × depois

**Antes (Admin):**

```
Integrações → refresh()
  → listMaster() → 403 → isMaster = false
  → getById(id do localStorage) → 403
  → clearStoredId(); myRequest = null
  → UI mostra o formulário mesmo com solicitação existente
  → useModuleAccess: Payment/WhatsApp sempre Inativo → PIX/boleto/WhatsApp travados
```

**Depois (Admin):**

```
Integrações → refresh()
  → listMaster() → 403 → isMaster = false
  → getMyStatus() → GET /api/v1/User/status-acesso
      200 → myRequest preenchido → card de status; gates seguem Payment/Whatsapp reais
      404 → sem solicitação → formulário disponível
  → estado Inativo → card de recusa, sem formulário (a API recusaria o reenvio)
```

O `localStorage` saiu do caminho: a fonte de verdade passou a ser a API. A chave
antiga (`pagweb_controle_acesso_id`) continua existindo no navegador de quem já
usou o painel, como dado morto — nada mais a lê, e não há efeito colateral.

---

## 5. Mudança de fluxo no admin-upgrade

**Esta é a única mudança de comportamento de produto do lote, e foi
deliberada.**

Em `/tornar-estabelecimento` o usuário ainda é **cliente** enquanto preenche o
formulário. Só vira Admin depois de `companyService.create*` +
`companyService.login`. Como o envio do OTP é `[Authorize(Roles = "Admin")]`, é
**impossível** obter o código antes de criar a empresa. Manter a chamada a
`requestAccess` ali dentro produziria `400` em 100% dos casos — antes deste
trabalho ela já falhava, só que mascarada por um `try/catch` que virava um toast
de "módulos extras falharam".

Novo comportamento: os checkboxes viraram **declaração de intenção**. Ao
concluir, o usuário é levado para
`/business/configuracoes?tab=integracoes&modulos=payment,whatsapp` com as opções
pré-marcadas, onde já é Admin e consegue receber o código.

Alternativa descartada: pedir o OTP no meio do fluxo, depois do `login`.
Exigiria um segundo passo modal dentro de um formulário de criação de empresa —
mais superfície, mesma quantidade de requisitos, pior UX.

---

## 6. Bloqueio remanescente: OTP depende do backend

**O front não pode resolver isso sozinho.** O código de verificação é um OTP da
Bixs, e o envio (`POST /v1/api/directory/clients/verification/send-code`) exige
o header `X-API-Key` — credencial de **member**, com aplicação `external-api` e
capability `users`. Colocar essa chave no browser vazaria a credencial da PagWeb
inteira para qualquer usuário. Chamar a Bixs direto do front está descartado por
segurança, não por conveniência.

O front foi escrito contra o contrato proposto para a API:

```
POST /api/v1/User/enviar-codigo-acesso
Authorization: Bearer {admin}
200 → { "sent_to": "...", "expires_in_seconds": 900 }
```

Enquanto esse endpoint não existir, o botão "Enviar código" recebe `404`/`405` e
a UI mostra um aviso específico — não um erro genérico — dizendo que o envio
automático ainda não está disponível e que o código deve ser pedido ao suporte.
**O campo continua editável**, então uma solicitação ainda pode ser concluída
manualmente com um código obtido por fora.

Quando o endpoint subir, o fluxo fecha **sem nenhuma alteração no front**. O
patch está pronto para colar no relatório da API (Patch 3).

---

## 7. Testes e2e corrigidos

`tests/e2e/api/comunicacao.spec.ts` afirmava o contrato **anterior** ao
`3ed0b44` e estava vermelho desde 14/08 — dívida preexistente, não regressão
deste trabalho.

| Teste                                          | Estava                                                 | Ficou                                                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `consulta por id aceita Master e Admin`        | Admin `not.toBe(403)` em `GET /ControleAcessos/1`      | Renomeado para `consulta por id é exclusiva do Master`; Admin → `toBe(403)`                                                                                        |
| —                                              | (não existia)                                          | **Novo:** `status da própria empresa é exclusivo do Admin` — cobre `GET /api/v1/User/status-acesso` (Admin `not.toBe(403)`, aceitando 404; Cliente e Master → 403) |
| `solicitação de acesso recusa senha incorreta` | `POST /api/ControleAcessos` (removido → 405)           | `POST /api/v1/User/solicitar-acesso` + `verificationCode`                                                                                                          |
| `cliente não solicita controle de acesso`      | `POST /api/ControleAcessos` (405 antes da autorização) | `POST /api/v1/User/solicitar-acesso` + `verificationCode`                                                                                                          |

Também foi removida uma referência pendurada: o comentário de aviso citava
`docs/relatorio_erros_backend.md`, que **não existe no repositório**. Foi
reescrito com o motivo real de a suíte só exercitar o ramo de senha inválida (o
caminho feliz cria client na Bixs e consome um OTP de uso único).

> **Ressalva importante:** estas correções foram conferidas contra o
> código-fonte dos controllers (`[Authorize(Roles = ...)]` e rotas), **não foram
> validadas por execução**. Rodar a suíte exige API viva em `lojas.vlks.com.br`
> e credenciais master/admin/cliente, indisponíveis nesta sessão. O typecheck da
> suíte passa limpo.

---

## 8. Gates de qualidade

| Gate                               | Resultado                            |
| ---------------------------------- | ------------------------------------ |
| `npm run build` (vite)             | ✅ verde — `✓ built in 7.25s`        |
| `npx tsc --noEmit` (raiz)          | ⚠️ **14 erros, todos preexistentes** |
| `cd tests/e2e && npx tsc --noEmit` | ✅ limpo, exit 0                     |

Os 14 erros de tsc estão em **10 arquivos que não foram tocados** — nenhum dos 9
arquivos alterados produz erro. Verificado por dupla checagem: (a) a interseção
entre a lista de arquivos com erro e a lista de arquivos modificados é vazia;
(b) as 14 posições (arquivo, linha, coluna) são idênticas antes e depois das
mudanças.

Natureza dos 14: `import.meta.env` sem os tipos do Vite (3), prop `size`
inexistente em `Button` (5), props inválidas em ícones Lucide (2), `Variants` do
motion (1), `label` faltando em `Input` (1), `getNumberOfPages` do jspdf (1),
outro (1).

**`npm run lint` é `tsc --noEmit`, então continua vermelho.** Não é possível
deixá-lo verde sem mexer em 10 arquivos fora do escopo e tomar decisões de
design alheias a este trabalho (a prop `size` do `Button` não existe: criá-la
muda a aparência de 4 telas). Deixado para um passe próprio.

---

## 9. Achado de repositório: `.gitignore` engolindo os specs

`.gitignore` linha 25 contém o padrão **`api`**, solto — sem barra e sem âncora.
Em gitignore, um padrão sem `/` casa com **qualquer diretório de mesmo nome, em
qualquer profundidade**. A intenção era ignorar `apps/PagWebFuncional/api/` (o
repo separado do backend), mas ele também engole `tests/e2e/api/` inteiro:

```
$ git check-ignore -v tests/e2e/api/comunicacao.spec.ts
.gitignore:25:api    tests/e2e/api/comunicacao.spec.ts
```

**Os 9 specs de API da suíte estão fora do controle de versão** (`assinaturas`,
`auth`, `catalogo`, `comunicacao`, `conta-cliente`, `empresa-clientes`,
`financeiro`, `planos`, `seguranca`), enquanto `tests/e2e/ui/auth.spec.ts` é
rastreado normalmente — a assimetria mostra que é acidente, não decisão.

Consequências concretas:

- as correções da seção 7 existem em disco mas **não aparecem em `git diff` nem
  em commit**;
- num clone limpo, metade da suíte e2e não vem junto;
- é por isso que a dívida de 14/08 ficou sem rastro por cinco dias.

**Correção:** trocar `api` por `/api/` na linha 25, ancorando na raiz do repo.
**Não foi aplicada** — mudar isso passa a versionar 9 arquivos novos, e o que
entra no controle de versão é decisão do dono do repositório, não efeito
colateral de uma correção de contrato.

---

## 10. Limitações conhecidas e o que não foi feito

**10.1 — `npm run lint` segue vermelho** (seção 8). 14 erros preexistentes, fora
do escopo.

**10.2 — Pré-seleção via `?modulos=` é frágil na ida e volta.**
`Configuracoes.selectTab` faz `setSearchParams({ tab })`, descartando `modulos`.
O caminho feliz funciona (a leitura é lazy, no primeiro render), mas se o
usuário trocar de aba e voltar, a pré-seleção some e os checkboxes voltam ao
padrão. Degradação silenciosa, sem perda de dados.

**10.3 — Grafia `cpF_CNPJ`.** O schema passou a aceitar `cpf_CNPJ`, `cpF_CNPJ` e
`CPF_CNPJ`. Motivo: a API monta o objeto com `CPF_CNPJ` e a política camelCase
padrão do ASP.NET minúscula a sequência inicial de maiúsculas **enquanto a
seguinte também for maiúscula** — em `CPF_CNPJ` ela para no `F` por causa do
`_`, emitindo `cpF_CNPJ`. Nenhuma das duas grafias antigas cobria isso, e o
CPF/CNPJ aparecia vazio nos cards do painel Master. Aceitar as três é de graça e
imune a erro de análise.

**10.4 — Conta que fosse Master **e** Admin ao mesmo tempo não veria o próprio
status.** O `refresh()` curto-circuita: se `isMaster`, `myRequest` vira `null`.
É o comportamento correto para o modelo atual (Role é único, e a conta Master
não tem empresa), mas fica registrado.

**10.5 — `enrichMasterItem` faz N+1 requisições** — um `getById` por item da
lista do Master. Preexistente, funciona, escala mal. Não tocado.

**10.6 — Sem cache compartilhado entre consumidores de `useModuleAccess`.** Cada
página que usa o hook monta seu próprio `useControleAcesso` e refaz as chamadas.
Preexistente; a contagem de requisições não piorou (era `listMaster` +
`getById`, virou `listMaster` + `getMyStatus`).

**10.7 — `tsconfig.json` não tem `"strict": true`**, apesar de o projeto ser
tratado como TS estrito. Ligar hoje quebraria o repo inteiro. Registrado, não
alterado.

---

## 11. Como testar

**Fase 1 — leitura de status (funciona agora, sem depender do backend):**

1. Login como Admin de uma empresa **que já tenha solicitação registrada**.
2. Abrir `/business/configuracoes?tab=integracoes`. Esperado: card "Solicitação
   registrada" com os três badges (Geral, Pagamentos, WhatsApp) — **não** o
   formulário.
3. Abrir `/business/pagamentos`, `/business/pagamento-unico` e a tela de
   conectar WhatsApp. Esperado: os banners de bloqueio refletem o estado real.
   Com Payment `Ativo`, PIX e boleto liberados; com WhatsApp `Ativo`, a conexão
   liberada.
4. Login como Admin de empresa **sem** solicitação → formulário disponível (404
   tratado).
5. Login como Master → o formulário some, aparece o painel de aprovações.

**Fase 2 — nova solicitação (depende do Patch 3 da API):**

6. Como Admin sem solicitação, clicar em "Enviar código".
    - **Hoje:** aviso de "envio automático indisponível", campo segue editável.
    - **Após o Patch 3:** toast com o e-mail de destino e validade, cooldown de
      60s no botão.
7. Digitar o código de 6 dígitos + senha → "Enviar solicitação". Esperado: `200`
   e o card de status assumindo o lugar do formulário.
8. Casos de erro que devem produzir mensagens **distintas**: senha errada,
   sessão expirada, código inválido/expirado, solicitação já existente.

**Fase 3 — admin-upgrade:**

9. Como cliente, `/tornar-estabelecimento`, marcar os dois módulos e concluir.
   Esperado: redireciona para Integrações com os dois checkboxes já marcados e
   um toast explicando que falta concluir com o código.

---

## Referências

- Auditoria da API (15 achados + patches prontos):
  `apps/PagWebFuncional/docs/relatorio_api_controle_acesso_bixs_2026-08-19.md`
- Relatório de origem:
  `trash/relatorio_api_pagweb_atualizacao_frontend_2026-08-19.md`
- Anteriores: `docs/relatorio_aprovacao_controle_acessos_2026-08-12.md`,
  `docs/relatorio_erro_solicitar_integracao_bixs_2026-08-13.md`
- Contrato Bixs: `api-docs-documentation.html` (raiz do monorepo)
