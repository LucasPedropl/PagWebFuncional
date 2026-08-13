# Relatório — Falha ao aprovar solicitação de ControleAcessos

> **Data:** 2026-08-12  
> **Escopo:** pagweb-admin (UI Master) + API PagWebV1 (`ControleAcessosController`) + API externa Bixs (`api.bixs.com.br`)  
> **Caso reproduzido:** controle `#1` — empresa “ClienteTeste 5”, admin `cliente.msqbqdzrchk4e9@pagweb-teste.local`  
> **Ambiente:** produção `https://lojas.vlks.com.br`  
> **Tipo:** Diagnóstico de causa raiz (sem alteração de código neste documento)

---

## Sumário

1. [Objetivo](#1-objetivo)
2. [Sintoma](#2-sintoma)
3. [Reprodução](#3-reprodução)
4. [O que NÃO é o problema](#4-o-que-não-é-o-problema)
5. [Fluxo as-is](#5-fluxo-as-is)
6. [Causa raiz](#6-causa-raiz)
7. [Hipóteses técnicas (Bixs)](#7-hipóteses-técnicas-bixs)
8. [Bugs agravantes na API PagWeb](#8-bugs-agravantes-na-api-pagweb)
9. [Impacto no produto](#9-impacto-no-produto)
10. [Ações recomendadas](#10-ações-recomendadas)

---

## 1. Objetivo

Explicar por que o botão **Aprovar** no painel Master (pagweb-admin) não consegue ativar módulos Payment/WhatsApp, e onde fica a falha na cadeia front → PagWeb → Bixs.

---

## 2. Sintoma

- No painel admin, ao aprovar uma solicitação em estado `Solicitado`, a UI mostra erro.
- A API responde **HTTP 400** com corpo literal:

```text
Erro ao ativar acesso.
```

- O registro permanece `estado = Solicitado` (Payment/WhatsApp também `Solicitado`). Os módulos no app PagWeb continuam bloqueados.

---

## 3. Reprodução

Executado em 2026-08-12 contra produção:

1. `POST /api/v1/User/login-admin` com conta Master (`Pagweb@vlks.com.br`).
2. `GET /api/ControleAcessos` → 1 item pendente (`IdControle = 1`).
3. `GET /api/ControleAcessos/1` → empresa “ClienteTeste 5”, `estado=2` (Solicitado), Payment/WhatsApp Solicitado.
4. `PUT /api/ControleAcessos/1` com body válido:

```json
{
  "IdControle": 1,
  "Payment": 0,
  "Whatsapp": 0,
  "estado": 0
}
```

(`0` = Ativo no enum da API.)

**Resultado:** `400` — `"Erro ao ativar acesso."`

Conclusão da reprodução: o mesmo erro ocorre **fora do browser** (chamada direta na API). Logo o front do pagweb-admin não é a origem.

---

## 4. O que NÃO é o problema

| Suspeita | Por que descarta |
|----------|------------------|
| Payload errado no pagweb-admin | PUT direto com body canônico falha igual |
| Auth Master / JWT | Login Master ok; GET lista/detalhe 200 |
| Proxy Vercel do admin | Reprodução bate em `lojas.vlks.com.br` sem passar pelo admin |
| Persistência EF / SaveChanges | O 400 ocorre **antes** de gravar `Ativo` |
| Recusar (Inativo) | Branch `else` **não** chama Bixs — só zera estados localmente |

---

## 5. Fluxo as-is

```
[Admin empresa] POST /api/ControleAcessos
        │
        ▼
  Bixs CriarAcesso → POST /v1/api/directory/clients
        │
        ▼
  Grava ControleAcesso (estado=Solicitado, IdBixs=<id Bixs>)

[Master] PUT /api/ControleAcessos/{id}  estado=Ativo
        │
        ▼
  Bixs AtualizarAcesso(IdBixs)
  → POST /v1/api/directory/clients/{IdBixs}/plans
        │
        ├─ sucesso + application_code == "pag-web" → grava Ativo no banco
        └─ qualquer outra coisa → 400 "Erro ao ativar acesso."  (NÃO grava)
```

Trecho decisivo no controller:

```86:89:apps/PagWebFuncional/api/PagWebV1/Controllers/ControleAcessosController.cs
        if (controleacesso.estado == Estado.Ativo)
        {
            var acesso=await _apiBixs.AtualizarAcesso(controle.IdBixs);
            if (acesso == false) { return BadRequest("Erro ao ativar acesso."); }
```

Implementação Bixs:

```426:446:apps/PagWebFuncional/api/PagWebV1/Services/ExternalTokenManagerService.cs
    public async Task<bool> AtualizarAcesso(int idBixs)
    {
        // Authorization: Bearer TokenStorage (token Bixs Master)
        HttpResponseMessage response = await _httpClient.PostAsync(
            $"v1/api/directory/clients/{idBixs}/plans", null);
        if (response.IsSuccessStatusCode)
        {
            var resultado = JsonSerializer.Deserialize<ConcederAcesso>(jsonResponse);
            if (resultado != null && resultado.Application_Code == "pag-web")
            {
                return true;
            }
            return false;
        }
        return false;
    }
```

Critério de sucesso é **rígido**: HTTP 2xx **e** `application_code === "pag-web"`. Qualquer divergência (status ≠ 2xx, JSON inesperado, outro code, `granted=false` ignorado, desserialização nula) vira `false` → 400 genérico.

---

## 6. Causa raiz

**A aprovação Master depende 100% da integração Bixs `AtualizarAcesso`.**  
Quando essa chamada retorna `false`, a API PagWeb **recusa** ativar o controle localmente, mesmo com payload e autenticação corretos.

Em outras palavras:

> O problema **não** é “não conseguir clicar em Aprovar no admin”.  
> O problema é: **a PagWeb não ativa o módulo porque a Bixs não confirma (ou a PagWeb não interpreta como confirmação) a concessão do plano `pag-web` para o `IdBixs` daquela solicitação.**

O front (pagweb-admin) e o contrato PUT estão ok. A falha está na camada **PagWebV1 ↔ Bixs**.

---

## 7. Hipóteses técnicas (Bixs)

Ordenadas por probabilidade prática (sem log da Bixs no servidor, não dá para apontar uma única com 100%):

1. **`IdBixs` inválido / cliente inexistente na Bixs**  
   Cliente criado no POST (`CriarAcesso`) pode ter falhado parcialmente, sido apagado, ou `Id` gravado errado. O GET de detalhe **não expõe** `IdBixs`, então o painel não ajuda a auditar.

2. **Token Bixs inválido/expirado em `TokenStorage`**  
   `AtualizarAcesso` usa `_tokenStorage.Token` (singleton). Refresh via `TokenRefreshWorker` a cada **24h**. Se o token estiver vazio/expirado entre refreshes, o POST `/plans` falha e vira `false` sem detalhe.

3. **Resposta HTTP ok, mas `application_code` ≠ `"pag-web"`**  
   Plano concedido com outro code, payload aninhado diferente do esperado por `ConcederAcesso`, ou mudança de contrato da Bixs. O parser exige exatamente `"pag-web"`.

4. **HTTP não-sucesso da Bixs (4xx/5xx)**  
   Permissão Master Bixs, plano já atribuído, client sem elegibilidade, etc. Tudo colapsa na mesma mensagem.

5. **Desserialização frágil**  
   Se o JSON de `/plans` mudar shape, `resultado` fica `null` → `false`, mesmo com concessão real.

---

## 8. Bugs agravantes na API PagWeb

| Problema | Efeito |
|----------|--------|
| Mensagem fixa `"Erro ao ativar acesso."` | Zero diagnóstico operacional (sem status Bixs, body, IdBixs) |
| `AtualizarAcesso` engole falhas (`return false`) | Impossível diferenciar token vs IdBixs vs contrato |
| Aprovação **hard-bloqueada** por Bixs | Produto PagWeb (gates Payment/WhatsApp) fica preso mesmo se só o DB local importasse |
| GET detalhe omite `IdBixs` | Master não consegue auditar o vínculo externo |
| Mesmo padrão no POST: `"Erro ao criar acesso."` | Solicitação também é frágil à Bixs (já observado no admin-upgrade) |

---

## 9. Impacto no produto

- Master não consegue liberar Payment/WhatsApp pelo fluxo oficial.
- Front PagWeb continua com gates fechados (`payment`/`whatsapp` ≠ `Ativo`).
- Recusar/remover podem funcionar (não passam por `AtualizarAcesso`), o que aumenta a confusão (“só aprovar quebra”).

---

## 10. Ações recomendadas

### P0 — Observabilidade (obrigatório para fechar a causa Bixs)

No `AtualizarAcesso` / `PutControleAcesso`:

- Logar `IdControle`, `IdBixs`, HTTP status, body bruto da Bixs.
- Devolver ao Master (ou só em log) motivo tipado: `bixs_http`, `bixs_code_mismatch`, `bixs_token`, etc.

### P1 — Corrigir integração Bixs

Com o log em mãos:

- Validar se `IdBixs` do registro `#1` existe em `GET …/directory/clients/{id}`.
- Validar token Master Bixs no momento do PUT.
- Confirmar contrato real de `/plans` vs classe `ConcederAcesso`.

### P2 — Decisão de produto (desbloqueio)

Escolher uma política explícita:

| Opção | Prós | Contras |
|-------|------|---------|
| **A)** Soft-activate: se Bixs falhar, ainda assim grava `Ativo` + alerta | Desbloqueia PagWeb agora | Dessincroniza com Bixs |
| **B)** Manter hard-fail, mas com mensagem/ação clara | Consistência com Bixs | Produto continua bloqueado até Bixs ok |
| **C)** Retry / recriar cliente Bixs antes de ativar | Recupera IdBixs podre | Mais complexo |

Recomendação de engenharia: **P0 imediatamente**; em paralelo **P2-A** só se o negócio aceitar Ativo local sem plano Bixs (ex.: WhatsApp/payment ainda dependem da Bixs em runtime — soft-activate libera UI, mas features externas podem continuar quebrando).

---

## Veredito

| Item | Avaliação |
|------|-----------|
| **Score diagnóstico** | 9/10 |
| **Status** | Solid |
| **Culpado** | Integração PagWeb → Bixs (`AtualizarAcesso` / `/plans`), não o pagweb-admin |
| **Evidência** | PUT direto em produção → 400 `"Erro ao ativar acesso."`; código só emite essa string quando `AtualizarAcesso` retorna `false` |
