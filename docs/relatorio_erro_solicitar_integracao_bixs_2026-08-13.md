# Relatório — Falha ao solicitar integração Bixs (ControleAcessos)

> **Data:** 2026-08-13  
> **Conta reproduzida:** `katep19265@murkstar.com` (Admin idUser=309)  
> **Escopo:** front PagWeb (Integracoes) + API produção `lojas.vlks.com.br`  
> **Regra:** backend `apps/PagWebFuncional/api/**` é readonly — correção de API no repositório PagWebV1.

---

## 1. Sintoma

Na tela `#/business/configuracoes?tab=integracoes`, ao enviar “Solicitar integração Bixs”, a UI falha.

---

## 2. Achados (produção)

| Chamada | Resultado |
|---------|-----------|
| `POST /api/ControleAcessos` | **405 Method Not Allowed** (`Allow: GET`) |
| `POST /api/v1/User/solicitar-acesso` | **existe** (`Allow: DELETE, PATCH, POST`) |
| Body válido `{ payment:2, whatsapp:1, idEmpresa:0, password }` | **400** texto puro: `Erro ao criar acesso.` |

Login Admin OK (200). Perfil:

- `idUser`: 309  
- email/telefone/cpf preenchidos (`telefone`: `5511950701635`)

---

## 3. Causas

### A) Front (corrigido neste repo)

O service tinha sido apontado para `POST /api/ControleAcessos`. Em produção esse método está desabilitado (405).  
**Correção front:** voltar para `POST /api/v1/User/solicitar-acesso`.

### B) Backend / Bixs (pendente no PagWebV1)

Mesmo no endpoint correto, a API responde `Erro ao criar acesso.` — mensagem tipicamente emitida quando `CriarAcesso` (Bixs `POST v1/api/directory/clients`) retorna `null` (HTTP não-sucesso ou `Status=false`).

Possíveis causas Bixs (sem log detalhado):

1. Token Master Bixs inválido/expirado no `_tokenStorage`
2. E-mail já cadastrado como client na Bixs
3. Formato de `cellphone` rejeitado
4. Mudança de contrato do endpoint `/directory/clients`

---

## 4. Ação pedida ao time da API

1. Publicar/alinhar código local com produção (`solicitar-acesso` não está no tree local `UserAdminController`).
2. Em `CriarAcesso`: logar HTTP status + body bruto da Bixs e devolver motivo tipado ao front (não só `"Erro ao criar acesso."`).
3. Decidir se `POST /api/ControleAcessos` deve voltar a aceitar POST (hoje 405) ou ficar só GET.
4. Reprocessar conta `katep19265@murkstar.com` / empresa do Admin 309 após corrigir Bixs.

---

## 5. Status front

- Service `controleAcessoService.requestAccess` → `POST /api/v1/User/solicitar-acesso`
- Mensagem de UI distingue falha Bixs (“Erro ao criar acesso”) de 405 de endpoint
