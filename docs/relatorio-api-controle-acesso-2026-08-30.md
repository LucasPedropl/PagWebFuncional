# `405 Method Not Allowed` ao aprovar/recusar/remover solicitações

> **Data:** 30/08/2026 · **Para:** backend **Ambiente:**
> `https://lojas.vlks.com.br` (IIS 8.5) **Afeta:** painel Master
> (`pagweb-admin`) — botões **Aprovar**, **Recusar** e **Remover**

## Sintoma

`PUT /api/ControleAcessos/{id}` e `DELETE /api/ControleAcessos/{id}` respondem
**405**. `GET` na mesma rota funciona normalmente.

A resposta chega como **página HTML de erro detalhado do IIS**:

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" ...>
<title>IIS 8.5 Detailed Error - 405.0 - Method Not Allowed</title>
```

## Causa

**Não está no C#.** As rotas existem e estão corretas em
`ControleAcessosController.cs`:

| Linha | Atributo                                              |
| ----- | ----------------------------------------------------- |
| 11    | `[Route("api/[controller]")]` → `api/ControleAcessos` |
| 72    | `[HttpPut("{idcontrole}")]`                           |
| 137   | `[HttpDelete("{idcontrole}")]`                        |

O que identifica a origem é **o corpo da resposta**: o 405 do ASP.NET Core vem
**sem corpo**. Uma página HTML de erro do IIS significa que o **IIS recusou
antes de a aplicação rodar** — nenhuma linha de código nosso foi executada, e
por isso não há registro no log da aplicação.

O responsável é o **`WebDAVModule`**, que o IIS registra por padrão e que
intercepta `PUT`, `DELETE`, `PROPFIND`, `MKCOL`, `COPY`, `MOVE`, `LOCK` e
`UNLOCK`, respondendo 405 por conta própria. É exatamente o conjunto que quebra:
`GET` passa, `PUT` e `DELETE` não.

**Por que isso é do repositório e não só do servidor:** o projeto **não tem
`web.config`**. O `dotnet publish` gera um automaticamente, contendo apenas o
handler do AspNetCore — nada remove o WebDAV. Ou seja, qualquer publicação nova
reintroduz o problema.

## Correção

Crie o arquivo **`PagWebV1/web.config`** (o publish mescla este arquivo com o
que ele gera, preservando o handler do AspNetCore):

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <modules>
      <remove name="WebDAVModule" />
    </modules>
    <handlers>
      <remove name="WebDAV" />
    </handlers>
  </system.webServer>
</configuration>
```

E garanta que ele vá para a pasta de publicação, em `PagWebV1.csproj`:

```xml
<ItemGroup>
  <None Update="web.config" CopyToPublishDirectory="Always" />
</ItemGroup>
```

Publique e reinicie o pool da aplicação.

### Alternativa (pior, e por quê)

Desinstalar a feature _WebDAV Publishing_ do IIS pelo Server Manager resolve,
mas a correção não fica versionada: some numa reinstalação do servidor ou numa
nova máquina, e ninguém descobre por que voltou. Prefira o `web.config`.

## Como verificar

Com um token Master:

```bash
curl -i -X PUT "https://lojas.vlks.com.br/api/ControleAcessos/1" \
  -H "Authorization: Bearer <token-master>" \
  -H "Content-Type: application/json" \
  -d '{"IdControle":1,"Payment":1,"Whatsapp":1,"estado":1}'
```

**Correto:** qualquer resposta do ASP.NET — `200`, `400`, `401`, `404` — com
corpo JSON ou texto. **Ainda quebrado:** HTML com `IIS 8.5 Detailed Error`.

## Não confundir com um sósia

`POST /api/ControleAcessos` também devolve 405, mas esse é **legítimo e do
ASP.NET**: o controller tem o comentário `// POST: api/ControleAcesso` e
**nenhuma action de POST** abaixo dele. Resposta sem corpo, não HTML. Se o POST
precisar existir, é outra tarefa — e não é resolvida por este `web.config`.
