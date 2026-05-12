# Erros Conhecidos e Bugs

Este documento lista os problemas identificados no sistema que precisam de
correção.

## Pendentes

### 1. Falso Sucesso na Ativação de Assinatura (Backend)

- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `UpdateStatusAssinaturaClienteAsync`
- **Sintoma:** Ao tentar ativar uma assinatura pendente via PATCH, a API retorna
  "Status atualizado com sucesso", mas o status permanece "Pendente".
- **Causa Raiz:**
    - Existe uma trava: `if (hojeSete.Date >= dataInicio)`. Se a assinatura
      começa em mais de 7 dias, a condição falha e o status não é alterado.
    - O método não possui um `else` para essa condição e retorna `true` no final
      de qualquer maneira.
- **Como Resolver:** Retornar `false` caso a condição de data não seja atendida,
  ou permitir a ativação imediata ignorando a trava de 7 dias. No Controller,
  tratar o retorno `false` com uma mensagem explicativa (ex: "Assinatura só pode
  ser ativada 7 dias antes do início").

### 2. Data Final Inválida (0001-01-01) em Assinaturas

- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `CreateAssinaturaAsync` / `GetAssinaturasPorClienteAsync`
- **Sintoma:** O GET de assinaturas retorna `"dataFim": "0001-01-01T00:00:00"`.
- **Causa Raiz:**
    - No método de criação, a `DataFim` só é calculada `if (dto.Periodo > 0)`.
    - Se o usuário envia `periodo: 0`, a data permanece como o valor mínimo do
      sistema.
- **Como Resolver:**
    - No `CreateAssinaturaAsync`, definir um comportamento padrão para
      `periodo: 0` (ex: considerar como assinatura contínua e definir uma data
      distante ou nula, se o banco permitir).
    - No `GetAssinaturasPorClienteAsync`, tratar datas mínimas para exibir algo
      amigável no frontend (ex: "Recorrente").

### 3. Impossibilidade de Cancelar Assinatura Pendente (Cliente)

- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `UpdateStatusAssinaturaClienteAsync`
- **Sintoma:** Um cliente não consegue cancelar uma assinatura que ainda está
  com status "Pendente" através do endpoint de toggle.
- **Causa Raiz:** A lógica de cancelamento
  (`assinatura.Status = AssinaturaStatus.Cancelado`) está restrita ao bloco
  `if (assinatura.Status == AssinaturaStatus.Ativo)`. Se o status for
  `Pendente`, o código tenta apenas ativar.
- **Como Resolver:** Expandir a lógica de toggle para permitir que assinaturas
  no estado `Pendente` também possam ser movidas para `Cancelado`.

### 4. Erro na Rota /api/v1/WhatsApps/criar (WhatsApp)

- **Arquivo:** `api/PagWebV1/Controllers/WhatsAppController.cs` /
  `api/PagWebV1/Models/WhatsApp.cs`
- **Sintoma:** Falha intermitente ao criar ou sincronizar sessões do WhatsApp.
- **Causa Raiz:**
    1. **Conflito de Instância (HTTP 409):** O Controller não trata o código 409
       (Conflict) retornado pela API externa quando a instância já existe lá,
       mas não no banco local.
    2. **Restrição de Nulidade (`ntelefone`):** O modelo exige telefone, mas a
       API externa retorna `null` para instâncias novas (antes do QR Code).
    3. **Esquema de Banco Hardcoded:** O comando `SET IDENTITY_INSERT` usa o
       esquema `usu_print` fixo, falhando em outros ambientes (ex: `dbo`).
- **Como Resolver:**
    - No modelo, tornar `ntelefone` opcional (`string?`).
    - No Controller, tratar o status 409 fazendo um GET da instância e
      salvando-a localmente.
    - Usar `_context.Model.FindEntityType` para obter o nome da tabela/esquema
      dinamicamente para o `IDENTITY_INSERT`.
    - Ajustar as verificações `if (status == "Erro")` para usar
      `StartsWith("Erro")`, pois as mensagens reais são mais longas.

### 5. Funcionalidades dos Planos não aparecem nas Assinaturas do Cliente

- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `GetAssinaturasPorClienteAsync`
- **Sintoma:** Ao clicar em "Ver Detalhes" de uma assinatura na área do cliente,
  a lista de "Benefícios do Plano" aparece vazia.
- **Causa Raiz:** A projeção LINQ no método `GetAssinaturasPorClienteAsync`
  retorna um objeto anônimo que não inclui o campo `Funcionalidades` do Plano,
  nem outros detalhes importantes como `EmailEmpresa` ou `CnpjEmpresa`.
- **Como Resolver:**
    - Atualizar a projeção para incluir os campos faltantes:
        ```csharp
        return await query
            .OrderByDescending(a => a.DataInicio)
            .Select(a => new
            {
                // ... campos existentes ...
                Beneficios = a.Plano != null ? a.Plano.Funcionalidades : new List<string>(),
                DescricaoPlano = a.Plano != null ? a.Plano.Nome : "", // Ou outro campo de descrição
                EmailEmpresa = a.Plano != null && a.Plano.Empresa != null ? a.Plano.Empresa.Email : "", // Se houver
                // ... etc
            })
            .ToListAsync();
        ```
    - Nota: O frontend espera o nome `beneficios` (em minúsculo), então a
      projeção deve mapear para esse nome ou o frontend deve ser ajustado.

### 6. NullReferenceException no Cadastro de Cartão

- **Arquivo:** `api/PagWebV1/Controllers/CartaoController.cs` /
  `api/PagWebV1/Services/UserService.cs`
- **Sintoma:** Ao tentar cadastrar um cartão, a API retorna
  `{"message": "Object reference not set to an instance of an object."}`.
- **Causa Raiz:**
    1. No `UserService.CriarCartaoAsync`, a linha
       `string ultimos = dto.NumCartao.Substring(dto.NumCartao.Length - 4);`
       falha se `NumCartao` for nulo ou menor que 4 caracteres.
    2. O `catch` do Service retorna `null`.
    3. O `CartaoController` tenta acessar `novoCartao.IdCartao` sem verificar se
       `novoCartao` é nulo, disparando o erro final.
- **Como Resolver:**
    - No `CartaoController`, adicionar:
      `if (novoCartao == null) return BadRequest(new { message = "Erro ao processar dados do cartão. Verifique os campos." });`
    - No `UserService`, validar se `dto.NumCartao` não é nulo antes do
      `Substring`.

### 7. Instabilidade do Servidor e Erros de CORS (503 Server Shutdown)

- **Sintoma:** Quedas intermitentes da API, erros de "Failed to Fetch", erros de
  CORS e Swagger falhando ao carregar com mensagem de "Server has been
  shutdown".
- **Causa Raiz:**
    1.  **Exceções não tratadas em Workers:** Os serviços
        `MensalidadeNotifierService` e `TokenRefreshWorker` não possuem blocos
        `try-catch` em seus loops de execução. Em .NET, uma exceção não capturada
        em um `BackgroundService` derruba o processo principal da aplicação.
    2.  **CORS Falso-Positivo:** Quando o servidor cai (503), a resposta de erro
        do ambiente de hospedagem não contém os headers de CORS configurados, o
        que faz o navegador reportar um bloqueio de CORS em vez da queda real.
- **Como Resolver:**
    - Envolver a lógica interna dos loops `while` nos Workers com `try/catch`.
    - Revisar o método `GerarMensalidadesRecorrentesAsync` no `UserService` para
      evitar `NullReferenceException` ao acessar configurações de usuários.
