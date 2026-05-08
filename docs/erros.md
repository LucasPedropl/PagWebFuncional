# Erros Conhecidos e Bugs

Este documento lista os problemas identificados no sistema que precisam de correção.

## Pendentes

### 1. NullReferenceException na Criação de Assinaturas (Backend)
- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `CreateAssinaturaAsync`
- **Sintoma:** Erro 500 ao tentar cadastrar assinaturas quando o dia de pagamento está próximo (dentro de 7 dias) da data atual.
- **Causa Raiz:** 
    - O código tenta acessar `assinatura.Plano.ValorMensalidade`. Como o objeto `assinatura` foi recém-criado, a propriedade de navegação `Plano` é nula.
    - Existe também um acesso prematuro a `userconfig.Notificacoes` na linha ~1867 antes da verificação de nulidade na linha ~1872.
- **Como Resolver:**
    - Substituir as chamadas de `assinatura.Plano.ValorMensalidade` pela variável local `plano.ValorMensalidade` (que já possui os dados carregados).
    - Mover a lógica das variáveis `deveNotificarGeral`, `deveEnviarEmail` e `deveEnviarWhats` para depois do check `if (userconfig == null)`.

### 2. Funcionalidades do Plano não são salvas (Backend)
- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `CreatePlanoAsync`
- **Sintoma:** Ao criar um plano, a lista de funcionalidades enviada no DTO é ignorada e o plano é salvo com uma lista vazia.
- **Causa Raiz:** O método `CreatePlanoAsync` recebe a lista no DTO, mas não faz a atribuição `plano.Funcionalidades = dto.Funcionalidades` antes de salvar.
- **Como Resolver:** Adicionar a atribuição da lista de funcionalidades ao objeto `Plano` antes do `_context.SaveChangesAsync()`.
