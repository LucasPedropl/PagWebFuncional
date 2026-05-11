# Problema de CORS: Interceptação por IIS/WebDAV

Este documento explica o motivo do erro de CORS (Cross-Origin Resource Sharing) ao tentar acessar a API em `lojas.vlks.com.br` a partir de `localhost:3000` e fornece a solução técnica.

## 1. O Problema
Ao realizar uma requisição `POST` com `Content-Type: application/json`, o navegador envia automaticamente uma requisição de **Preflight** usando o método `OPTIONS`.

A API em produção está retornando um erro de CORS indicando que o cabeçalho `Access-Control-Allow-Origin` não está presente na resposta ao preflight.

### Diagnóstico Técnico:
- O código da API em ASP.NET Core **está correto**.
- O servidor **IIS (Internet Information Services)** onde a API está hospedada está configurado com o módulo **WebDAV** ou o handler de **OPTIONS** padrão.
- Esses componentes do IIS interceptam a requisição `OPTIONS` antes que ela chegue ao middleware do ASP.NET Core.
- O IIS responde com `240 No Content` diretamente, sem incluir os cabeçalhos de CORS configurados no código.

## 2. Arquivos Envolvidos

### No Projeto da API:
- **Arquivo:** `api/PagWebV1/Program.cs`
- **Trecho de Código:** 
  ```csharp
  builder.Services.AddCors(options =>
  {
      options.AddPolicy("AllowAll", policy =>
      {
          policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
      });
  });
  
  // ...
  app.UseCors("AllowAll");
  ```
  *Nota: O código acima está correto, mas o IIS impede que ele seja executado para o método OPTIONS.*

### No Servidor de Produção:
- **Arquivo Alvo:** `web.config` (localizado na raiz da publicação da API no servidor).

## 3. Como Resolver

Para resolver, é necessário garantir que o IIS não intercepte os verbos necessários. Isso é feito modificando o arquivo `web.config` no servidor de produção.

### Solução Sugerida para o `web.config`:

Adicione ou edite a seção `<system.webServer>` para remover o módulo WebDAV e o handler de OPTIONS:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <modules>
      <!-- Remove o WebDAV para evitar que ele intercepte as requisições OPTIONS -->
      <remove name="WebDAVModule" />
    </modules>
    <handlers>
      <remove name="WebDAV" />
      <remove name="OPTIONSVerbHandler" />
      <remove name="ExtensionlessUrlHandler-Integrated-4.0" />
      <!-- Garante que o handler de URLs sem extensão processe todos os verbos (*) -->
      <add name="ExtensionlessUrlHandler-Integrated-4.0" path="*." verb="*" type="System.Web.Handlers.TransferRequestHandler" preCondition="integratedMode,runtimeVersionv4.0" />
    </handlers>
  </system.webServer>
</configuration>
```

### Por que isso resolve?
Ao remover esses módulos, o IIS deixa de processar a requisição `OPTIONS` por conta própria e a repassa integralmente para o módulo do ASP.NET Core (`AspNetCoreModuleV2`), que então aplicará as regras de CORS definidas no seu `Program.cs`.
