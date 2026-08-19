# Relatório — Upload de PDF do contrato Bixs (WhatsApp)

> **Data:** 2026-08-19 (reteste ~16:48)  
> **App:** `apps/Bixs` (formulário de contrato → PDF → WhatsApp)  
> **API:** `https://api.bixs.com.br`  
> **Rotas:** `POST /v1/api/media/upload` e `POST /v1/api/messages/send`  
> **Tipo:** Diagnóstico + estado após a API passar a aceitar PDF

---

## Sumário

1. [Veredito](#1-veredito)
2. [O que mudou neste reteste](#2-o-que-mudou-neste-reteste)
3. [O que o front envia](#3-o-que-o-front-envia)
4. [Prova ao vivo](#4-prova-ao-vivo)
5. [Causa do 404 no stream](#5-causa-do-404-no-stream)
6. [O que ainda é da API](#6-o-que-ainda-é-da-api)
7. [Como validar o send](#7-como-validar-o-send)

---

## 1. Veredito

| Item | Status |
| --- | --- |
| Login | 200 |
| Upload JPEG | 201 |
| Upload PDF (`application/pdf`) | **201** — `mime_type: application/pdf` |
| CHECK `assets_mime_type_check` | **Corrigido** (antes 500) |
| `url` / `media_url` do PDF | Ainda MinIO interno (`http://media-minio:9000/...`) — **não usar no WhatsApp** |
| Stream `GET /v1/media/{id}` sem `visibility` | **404** `mídia não encontrada` (PDF nasce `private`) |
| Stream com `visibility=public` | **200** `Content-Type: application/pdf` |
| Front | Envia PDF + `document_url` pública + **`visibility=public`** |

O MIME do PDF está ok. O buraco que restou: PDF de `contracts` / `contract_document` grava `visibility: private`. O WhatsApp baixa a URL **sem token**; private = 404.

---

## 2. O que mudou neste reteste

| Quando | Upload PDF | Stream público |
| --- | --- | --- |
| ~16:26 | 500 `assets_mime_type_check` | nem chegou |
| ~16:48 | **201** `application/pdf` | 404 se private; **200** se `visibility=public` |
| JPEG `catalog` / `product_image` | 201 | 200 (já sai público o bastante para o stream) |

JPEG agora serve em `/v1/media/{id}` (antes também 404). PDF só serve se for `public`.

---

## 3. O que o front envia

1. `POST /v1/auth/login` (`source: api_externa`)
2. `POST /v1/api/media/upload` — multipart
3. `GET /v1/api/instances`
4. `POST /v1/api/messages/send` (empresa + cliente) com `document_url`

| Campo | Valor |
| --- | --- |
| `file` | PDF (`application/pdf`) |
| `module` | `contracts` |
| `purpose` | `contract_document` |
| `owner_type` | `user` |
| `owner_id` | `user_id` do login |
| `visibility` | `public` |

`document_url` = `https://api.bixs.com.br/v1/media/{id}` montada a partir de `id` / `media_id`. O front **ignora** `url`/`media_url` se for MinIO / URL assinada AWS.

---

## 4. Prova ao vivo

Reteste 2026-08-19 ~16:48. Login 200. PDF mínimo `%PDF-1.4`.

| Caso | HTTP upload | `visibility` | `GET /v1/media/{id}` |
| --- | --- | --- | --- |
| JPEG `catalog` / `product_image` | 201 | (stream 200) | 200 `image/jpeg` |
| PDF sem campo extra | 201 | `private` | **404** `mídia não encontrada` |
| PDF + `visibility=public` | 201 | `public` | **200** corpo `%PDF-1.4` |
| PDF + `visibility=unlisted` | 201 | `private` (ignorado) | 404 |
| PDF + `public=true` | 201 | `private` (ignorado) | 404 |

Metadado do 201 (PDF private): `status: ready`, `mime_type: application/pdf`. Não é “mídia não pronta”. O stream público simplesmente **não lista private**.

Bearer em `GET /v1/media/{id}` **não** muda o 404. A rota autenticada é `GET /v1/api/media/{id}` (JSON, 200).

---

## 5. Causa do 404 no stream

Não é UUID errado, delay, nem rota `/v1/media/{id}.pdf` (isso dá `invalid UUID length: 40`).

É política de visibilidade:

- stream público `/v1/media/{id}` = só mídia **public**
- contrato default = **private**
- WhatsApp precisa baixar sem JWT → tem que ser public **ou** a API tem que buscar o arquivo com credencial de serviço (hoje não faz: usa a URL que o front manda)

MinIO interno continua inútil para o send: host `media-minio` não existe na internet.

---

## 6. O que ainda é da API

1. Devolver `url`/`media_url` MinIO no 201 do PDF — o front já substitui pelo stream. Ideal: devolver a URL pública quando `visibility=public`.
2. Default `private` em `contracts` impede o WhatsApp sem o campo extra. Se o contrato **não pode** ser público, o message-service precisa baixar com auth, não via URL aberta.
3. Send com `document_url` ainda não foi revalidado ponta a ponta neste reteste (só upload + GET do arquivo).

---

## 7. Como validar o send

1. Upload PDF com `visibility=public` → 201.
2. `GET https://api.bixs.com.br/v1/media/{id}` → 200 + `application/pdf`.
3. `POST /v1/api/messages/send` com `document_url` = essa URL → 2xx e o PDF no WhatsApp.

O app Bixs já faz (1) e monta (2)/(3). Falta um envio real no formulário para fechar o ciclo.
