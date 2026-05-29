# Relatório de erro — Chat (`GET /api/Chats`)

## Resumo

O envio de mensagens (`POST /api/Chats/{id}/Mensagens` com
`multipart/form-data`) funciona para cliente e estabelecimento. Porém a
**listagem de conversas** falha em cenários críticos, impedindo que a empresa
veja chats iniciados pelo cliente e que o badge/contador funcione corretamente.

## 1. Estabelecimento — `500 Internal Server Error`

### Endpoint

`GET https://lojas.vlks.com.br/api/Chats`  
Token: `login-admin` (estabelecimento com empresa cadastrada)

### Reprodução

1. Cliente cria chat e envia mensagem (`POST /api/Chats` +
   `POST /api/Chats/1/Mensagens`).
2. Estabelecimento autenticado acessa `GET /api/Chats`.

### Resposta

`500` com
`System.ArgumentNullException: Value cannot be null. (Parameter 'source')` em
`ChatsController.cs` linha ~54, ao executar
`a.Mensagens.OrderByDescending(...)`.

### Causa provável

A query carrega chats com `.Include(c => c.Usuario)` mas **não** inclui
`Mensagens`. A projeção acessa `a.Mensagens` nulo.

### Correção sugerida (backend)

```csharp
var chatsAdmin = await _context.Chats
    .Where(c => c.IdEmpresa == vinculo.IdEmpresa)
    .Include(c => c.Usuario)
    .Include(c => c.Mensagens) // obrigatório
    .ToListAsync();
```

Opcional: usar operador seguro na projeção
(`a.Mensagens?.OrderByDescending(...) ?? Enumerable.Empty<Mensagem>()`).

---

## 2. Cliente — lista vazia incorreta

### Endpoint

`GET /api/Chats`  
Token: `login-cliente` (`pedrolucasmota2005@gmail.com`, idUser 35)

### Resposta observada

Texto: `Não há chats para esta empresa.` (mensagem da branch **Admin**, não da
branch Cliente).

### Contexto

Existe chat válido: `idEmpresa: 23`, `idUsuario: 35`, com mensagens em
`GET /api/Chats/1/Mensagens`.

### Causa provável

`TipoUser` classifica o usuário como `Admin` em vez de `Cliente`, filtrando por
`IdEmpresa` do vínculo administrativo em vez de `IdUsuario == idUser`.

### Correção sugerida (backend)

- Priorizar a role do JWT (`Cliente` vs `Admin`) no `GET /api/Chats`, ou
- Na branch Cliente, filtrar sempre por `IdUsuario == idUser` quando a role do
  token for `Cliente`.

---

## 3. Contrato da API (documentação)

O Swagger define `POST /api/Chats` como `multipart/form-data` (`idEmpresa`,
`idUsuario`). O frontend foi ajustado para esse formato. O controller ainda usa
`[FromBody] ChatDto` — funciona com form-data no servidor atual, mas alinhar
atributo para `[FromForm]` evita ambiguidade.

---

## Impacto no frontend

| Item                                            | Status                                          |
| ----------------------------------------------- | ----------------------------------------------- |
| Envio de mensagens                              | OK                                              |
| Leitura de mensagens por `idChat`               | OK                                              |
| Polling em tempo real (5s lista / 3s mensagens) | Implementado                                    |
| Badge na sidebar                                | Implementado (depende de `GET /Chats` ou cache) |
| Cache local de chats criados                    | Implementado (fallback)                         |
| Lista completa para estabelecimento             | **Bloqueada até correção do item 1**            |

---

## Teste de validação pós-correção

```bash
# Admin — deve retornar JSON array com idChat, nomeUsario, ultimaMensagem, naoLidas
GET /api/Chats  (Bearer token admin empresa 23)

# Cliente — deve retornar chats onde idUsuario = cliente logado
GET /api/Chats  (Bearer token cliente id 35)
```
