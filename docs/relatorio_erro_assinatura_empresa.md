# Relatório de Erro: Endpoint GET `/api/v1/Assinatura/empresa` Quebrado (Internal Server Error)

Este relatório detalha a causa raiz do erro de execução (Internal Server Error 500) que ocorre ao consumir o endpoint `GET /api/v1/Assinatura/empresa`.

## Detalhes da Ocorrência

*   **Endpoint:** `GET https://lojas.vlks.com.br/api/v1/Assinatura/empresa`
*   **Controller:** [AssinaturaController.cs](file:///c:/Users/Pedro/Downloads/PagWebFuncional/api/PagWebV1/Controllers/AssinaturaController.cs#L77)
*   **Método:** `GetByEmpresa`
*   **Erro retornado:**
    ```text
    System.InvalidOperationException: The type 'System.Threading.ExecutionContext&' of property 'Context' on type 'System.Runtime.CompilerServices.AsyncTaskMethodBuilder`1+AsyncStateMachineBox`1[System.Collections.Generic.List`1[...]]' is invalid for serialization or deserialization because it is a pointer type, is a ref struct, or contains generic parameters that have not been replaced by specific types.
       at System.Text.Json.ThrowHelper.ThrowInvalidOperationException_CannotSerializeInvalidType(Type typeToConvert, Type declaringType, MemberInfo memberInfo)
       ...
       at Microsoft.AspNetCore.Mvc.Formatters.SystemTextJsonOutputFormatter.WriteResponseBodyAsync(...)
    ```

---

## Causa Raiz do Problema

O erro ocorre porque a consulta ao banco de dados no método `GetByEmpresa` **não é aguardada** (`await`). 

No arquivo `AssinaturaController.cs`, nas linhas 116-131, a variável `resultado` é atribuída sem a palavra-chave `await`:

```csharp
// Linha 116 a 131 de AssinaturaController.cs
var resultado = query
    .Select(a => new
    {
        IdAssinatura = a.IdAssinatura,
        NomeCliente = a.Usuario.Nome + " " + a.Usuario.SobreNome,
        NomePlano = a.Plano != null ? a.Plano.Nome : "Plano não encontrada!",
        IdPlano = a.IdPlano,
        Periodo = a.Periodo,
        DataInicial = a.DataInicio,
        DataFinal = a.DataFim,
        ValorComDesconto = a.Plano != null ? a.Plano.ValorMensalidade * (1 - (a.Desconto / 100)) : 0,
        Status = a.Status.ToString(),
        Contrato = a.Contrato
    })
    .ToListAsync(); // <-- AQUI: Faltou colocar o 'await' na frente de 'query' ou no início da instrução
```

Devido à ausência do `await`, a variável `resultado` passa a ser do tipo `Task<List<AnonymousType>>` em vez de ser a lista já resolvida `List<AnonymousType>`.

Quando o ASP.NET Core executa `return Ok(resultado);`, ele repassa a própria `Task` inacabada (promessa) para o serializador de JSON do ASP.NET (`System.Text.Json`). O serializador tenta inspecionar todas as propriedades públicas do objeto `Task`, incluindo a máquina de estado assíncrona interna e seu `ExecutionContext`, que contém referências inválidas para serialização (como ponteiros, structs por referência e tipos genéricos indefinidos), quebrando a resposta e disparando o erro `System.InvalidOperationException`.

---

## Correção Proposta (Backend)

> [!IMPORTANT]
> **Atenção:** Nenhuma alteração de código foi efetuada nos arquivos de API em conformidade com as diretrizes do projeto de não modificar a API diretamente.

Para solucionar o problema no backend, basta adicionar a palavra-chave `await` no início da atribuição da variável `resultado` no arquivo [AssinaturaController.cs](file:///c:/Users/Pedro/Downloads/PagWebFuncional/api/PagWebV1/Controllers/AssinaturaController.cs#L116):

```diff
-            var resultado= query
+            var resultado = await query
                 .Select(a => new
                 {
                     IdAssinatura = a.IdAssinatura,
                     NomeCliente = a.Usuario.Nome + " " + a.Usuario.SobreNome,
                     NomePlano = a.Plano != null ? a.Plano.Nome : "Plano não encontrada!",
                     IdPlano = a.IdPlano,
                     Periodo = a.Periodo,
                     DataInicial = a.DataInicio,
                     DataFinal = a.DataFim,
                     ValorComDesconto = a.Plano != null ? a.Plano.ValorMensalidade * (1 - (a.Desconto / 100)) : 0,
                     Status = a.Status.ToString(),
                     Contrato= a.Contrato
                 })
                 .ToListAsync();
```
