# Relatório de Erros - API PagWebV1

> **Última auditoria:** 13/07/2026  
> **API local:** `apps/PagWebFuncional/api` atualizada para o commit mais recente  
> **API em produção:** `https://lojas.vlks.com.br`  
> **Frontend:** PagWeb rodando em `http://localhost:3000`

---

## Resumo da Auditoria de Erros Pendentes

| Categoria                                               | Status                                                                                            |
| :------------------------------------------------------ | :------------------------------------------------------------------------------------------------ |
| CS8602 — desreferências nulas                           | **Pendente** — 384 warnings restantes na compilação do dotnet                                     |
| Permissões `GET /api/Cobrancas/{id}`                    | **Ainda com bug** — lógica de validação de acesso invertida (vazamento cross-tenant)              |
| NullReferenceException no login de admin                | **Ainda com bug** — operador lógico incorreto na validação de tipo de usuário sem empresa         |
| Exposição de dados cross-tenant em endpoints            | **Ainda com bug** — endpoints de categoria retornam dados globais sem filtro de empresa           |
| Acesso inseguro a claims de identificação no Controller | **Novo erro** — chamada direta a `.Value` em `User.FindFirst()` sem verificar se a claim é nula   |

---

## 1. NullReferenceException no `login-admin` para usuários sem empresa

**Arquivo:** `Controllers/UserAdminController.cs` (linha 46)

```csharp
var tipouser = await _userService.TipoUser(user.IdUser, true);

if (tipouser == null && tipouser.UserTipo != UserTipo.Admin)
    return Unauthorized(new { message = "Usuario não encontrado" });
```

**Problema:** O operador `&&` está incorreto. Quando `tipouser` é `null` (usuário recém-ativado que ainda não possui registro de vínculo na tabela `UserEmpresa`), a primeira expressão avalia como verdadeira (`tipouser == null`), o que força o C# a avaliar a segunda expressão (`tipouser.UserTipo != UserTipo.Admin`). Como o objeto está nulo, isso gera uma exceção `System.NullReferenceException: Object reference not set to an instance of an object` em tempo de execução.

**Correção sugerida:**
Substituir o operador `&&` pelo operador de curto-circuito `||` (OU):
```csharp
if (tipouser == null || tipouser.UserTipo != UserTipo.Admin)
    return Unauthorized(new { message = "Usuário não é administrador ou não possui empresa vinculada." });
```

---

## 2. Bug crítico de permissão invertida em `GET /api/Cobrancas/{id}`

**Arquivo:** `Controllers/CobrancasController.cs` (linhas 159–222)

```csharp
if (vinculo != null && vinculo.UserTipo == UserTipo.Admin && vinculo.IdEmpresa != cobranca.IdEmpresa)
{
    // retorna os dados da cobrança
    return Ok(cobrancaDto);
}
else if (cobranca.IdUser == idAdmin)
{
    return Ok(cobrancaDto);
}
return BadRequest("Você não tem permissão para acessar esta cobrança.");
```

**Problema:** A validação está **invertida**:
1. O administrador da **mesma** empresa da cobrança (`IdEmpresa == cobranca.IdEmpresa`) falha no primeiro `if`, cai no `else if` (onde `idAdmin != cobranca.IdUser` porque a cobrança é de um cliente) e tem seu **acesso negado**.
2. O administrador de **outra** empresa (`IdEmpresa != cobranca.IdEmpresa`) entra no primeiro `if` e recebe acesso total à cobrança, gerando vazamento de dados de cobranças entre tenants.

**Correção sugerida:**
```csharp
bool temPermissao = false;

if (vinculo != null && vinculo.UserTipo == UserTipo.Admin)
{
    if (vinculo.IdEmpresa == cobranca.IdEmpresa)
        temPermissao = true;
}
else if (cobranca.IdUser == idAdmin)
{
    temPermissao = true;
}

if (!temPermissao)
    return BadRequest(new { message = "Você não tem permissão para acessar esta cobrança." });
```

---

## 3. Ordem incorreta de verificação de nulo em `UserService.cs`

**Arquivo:** `Services/UserService.cs` (linhas 712–714)

```csharp
var adminconfig = await _context.UserConfigs.FindAsync(adminEmpresa.IdUser);

if (adminEmpresa != null && adminconfig.Notificacoes == true)
```

**Problema:** O ID de `adminEmpresa` é consultado na linha 712 (`adminEmpresa.IdUser`) antes da verificação condicional na linha 714 de que o objeto não é nulo. Caso o administrador não esteja devidamente mapeado, ocorrerá um erro de desreferência de ponteiro nulo.

**Correção sugerida:**
```csharp
if (adminEmpresa != null)
{
    var adminconfig = await _context.UserConfigs.FindAsync(adminEmpresa.IdUser);
    if (adminconfig?.Notificacoes == true)
    {
        // ...
    }
}
```

---

## 4. Exposição de dados cross-tenant em endpoints de Categorias

**Arquivo:** `Controllers/CategoriasController.cs`

| Endpoint | Atributo | Problema |
| :--- | :--- | :--- |
| `GET /api/Categorias` | `[AllowAnonymous]` | Retorna todas as categorias ativas de todas as empresas registradas. |
| `GET /api/Categorias/{id}` | `[AllowAnonymous]` | Retorna os detalhes de qualquer categoria de qualquer empresa apenas passando o ID na rota. |
| `GET /api/Categorias/empresa-categorias-privado/{idEmpresa}` | `[Authorize(Roles = "Admin")]` | O parâmetro `{idEmpresa}` da rota é ignorado pelo método, que utiliza estritamente o `vinculo.IdEmpresa` extraído do token JWT. |

**Correção sugerida:** Exigir autorização ou filtro por empresa nas consultas públicas de categorias, e garantir que a rota privada valide se o `{idEmpresa}` corresponde ao vínculo da empresa do token do administrador.

---

## 5. NullReferenceException em Claims de Usuário sem Operador Condicional

**Arquivo:** `Controllers/UserAdminController.cs` (linhas 96, 110, 153 e 255)

```csharp
// Exemplo na linha 96:
var idAdmin = User.FindFirst(ClaimTypes.NameIdentifier).Value;

// Exemplo na linha 255:
var idAdmin = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
```

**Problema:** O método `User.FindFirst(ClaimTypes.NameIdentifier)` busca a claim de identificação. Se por alguma razão o usuário estiver sem a claim no contexto (ou ocorrer uma falha de autenticação parcial), o retorno será nulo. O acesso direto a `.Value` provocará um erro de `NullReferenceException`.

**Correção sugerida:** Validar a claim antes de tentar acessar seu valor:
```csharp
var idAdminClaim = User.FindFirst(ClaimTypes.NameIdentifier);
if (idAdminClaim == null)
    return Unauthorized(new { message = "Identificador de usuário ausente no token." });

var idAdmin = int.Parse(idAdminClaim.Value);
```

---

## 6. Warnings CS8602 (desreferência de referência nula) — 384 ocorrências

A compilação limpa do projeto gera **384 avisos de desreferência de nulos** no compilador, concentrados principalmente em:
- Coleções `Produtos`/`Servicos` no mapping `.Select()` de `Controllers/CobrancasController.cs`.
- Navegação de chaves estrangeiras sem null-check em `Controllers/ProdutosController.cs` e `CategoriasController.cs`.
- Validações de claims JWT nos controllers.

**Risco:** Queda e travamentos inesperados com retornos `500 Internal Server Error` se as propriedades relacionadas no banco de dados estiverem parcialmente vazias.
