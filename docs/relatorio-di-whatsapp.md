# Relatório de Erro - Injeção de Dependência no WhatsAppsController

Este relatório descreve o erro de injeção de dependência ocorrido no endpoint do WhatsApp da API, detalhando o comportamento do erro e como corrigi-lo no backend.

---

## 1. Descrição do Erro

Ao tentar acessar o endpoint de verificação do WhatsApp na rota `/business/whatsapp` do frontend, a API retorna um erro HTTP **500 Internal Server Error**.

### Log de Erro no Servidor
```plain
System.InvalidOperationException: Unable to resolve service for type 'PagWebV1.Services.UserService' while attempting to activate 'WhatsAppsController'.
   at Microsoft.Extensions.DependencyInjection.ActivatorUtilities.ThrowHelperUnableToResolveService(Type type, Type requiredBy)
   at lambda_method1200(Closure, IServiceProvider, Object[])
   ...
```

---

## 2. Causa Raiz

No ecossistema ASP.NET Core da aplicação, a classe de serviço `UserService` é registrada no contêiner de Injeção de Dependências (DI) por meio de sua interface `IUserService` (geralmente via `builder.Services.AddScoped<IUserService, UserService>()` em `Program.cs`).

No entanto, no arquivo `WhatsAppController.cs` do backend, o construtor do `WhatsAppsController` exige a injeção da classe concreta `UserService` em vez da interface `IUserService`:

### Trecho Problemático ([WhatsAppController.cs](file:///c:/Users/Pedro/Downloads/PagWebFuncional/api/PagWebV1/Controllers/WhatsAppController.cs#L22-L29))
```csharp
private readonly UserService _UserService ; // Tipo concreto

public WhatsAppsController(AppDbContext context, TokenStorage tokenStorage, UserService userService)
{
    // ...
    _UserService = userService;
}
```

Como o contêiner de DI não possui uma regra para resolver o tipo concreto `UserService` (mas sim a interface `IUserService`), o ASP.NET Core lança uma exceção de ativação do controller, impedindo que qualquer rota do controller de WhatsApp seja executada.

---

## 3. Como Corrigir (no Código do Backend)

Para solucionar o problema definitivamente, altere o arquivo `WhatsAppController.cs` para injetar a interface `IUserService` no lugar da classe concreta `UserService`.

### Alteração Proposta

No arquivo `api/PagWebV1/Controllers/WhatsAppController.cs`:

```diff
-   private readonly UserService _UserService ;
+   private readonly IUserService _userService;

-   public WhatsAppsController(AppDbContext context, TokenStorage tokenStorage, UserService userService)
+   public WhatsAppsController(AppDbContext context, TokenStorage tokenStorage, IUserService userService)
    {
        _httpClient = new HttpClient();
        _context = context;
        _tokenStorage = tokenStorage;
-       _UserService = userService;
+       _userService = userService;
        _httpClient.BaseAddress = new Uri("https://api.bixs.com.br/v1/api/message/");

        var tokenAtual = _tokenStorage.Token;
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenAtual);
    }
```

#### Atualizar também as chamadas internas
A variável privada mudou de `_UserService` para `_userService` (seguindo as convenções de camelCase). É necessário renomear as chamadas onde ela é usada para registrar logs no arquivo. Exemplos:

* **Linha 75:**
  ```diff
  -   _UserService.LogError($"Erro ao verificar status: {ex}");
  +   _userService.LogError($"Erro ao verificar status: {ex}");
  ```

* **Linha 135:**
  ```diff
  -   _UserService.LogError($"Erro ao criar instância: {ex}");
  +   _userService.LogError($"Erro ao criar instância: {ex}");
  ```

* **Linha 184:**
  ```diff
  -   _UserService.LogError($"Erro no fluxo ao verifica/qrcode: {ex}");
  +   _userService.LogError($"Erro no fluxo ao verifica/qrcode: {ex}");
  ```

* **Linha 210:**
  ```diff
  -   _UserService.LogError($"Erro ao verificar status: {ex}");
  +   _userService.LogError($"Erro ao verificar status: {ex}");
  ```

* **Linha 260:**
  ```diff
  -   _UserService.LogError($"Erro no fluxo de criação/qrcode: {ex}");
  +   _userService.LogError($"Erro no fluxo de criação/qrcode: {ex}");
  ```

* **Linha 285:**
  ```diff
  -   _UserService.LogError($"Erro ao desconectar sessão: {ex}");
  +   _userService.LogError($"Erro ao desconectar sessão: {ex}");
  ```
