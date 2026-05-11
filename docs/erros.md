# Erros Conhecidos e Bugs

Este documento lista os problemas identificados no sistema que precisam de correção.

## Pendentes

### 1. Falso Sucesso na Ativação de Assinatura (Backend)
- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `UpdateStatusAssinaturaClienteAsync`
- **Sintoma:** Ao tentar ativar uma assinatura pendente via PATCH, a API retorna "Status atualizado com sucesso", mas o status permanece "Pendente".
- **Causa Raiz:** 
    - Existe uma trava: `if (hojeSete.Date >= dataInicio)`. Se a assinatura começa em mais de 7 dias, a condição falha e o status não é alterado.
    - O método não possui um `else` para essa condição e retorna `true` no final de qualquer maneira.
- **Como Resolver:** Retornar `false` caso a condição de data não seja atendida, ou permitir a ativação imediata ignorando a trava de 7 dias. No Controller, tratar o retorno `false` com uma mensagem explicativa (ex: "Assinatura só pode ser ativada 7 dias antes do início").

### 2. Data Final Inválida (0001-01-01) em Assinaturas
- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `CreateAssinaturaAsync` / `GetAssinaturasPorClienteAsync`
- **Sintoma:** O GET de assinaturas retorna `"dataFim": "0001-01-01T00:00:00"`.
- **Causa Raiz:** 
    - No método de criação, a `DataFim` só é calculada `if (dto.Periodo > 0)`. 
    - Se o usuário envia `periodo: 0`, a data permanece como o valor mínimo do sistema.
- **Como Resolver:** 
    - No `CreateAssinaturaAsync`, definir um comportamento padrão para `periodo: 0` (ex: considerar como assinatura contínua e definir uma data distante ou nula, se o banco permitir).
    - No `GetAssinaturasPorClienteAsync`, tratar datas mínimas para exibir algo amigável no frontend (ex: "Recorrente").

### 3. Impossibilidade de Cancelar Assinatura Pendente (Cliente)
- **Arquivo:** `api/PagWebV1/Services/UserService.cs`
- **Método:** `UpdateStatusAssinaturaClienteAsync`
- **Sintoma:** Um cliente não consegue cancelar uma assinatura que ainda está com status "Pendente" através do endpoint de toggle.
- **Causa Raiz:** A lógica de cancelamento (`assinatura.Status = AssinaturaStatus.Cancelado`) está restrita ao bloco `if (assinatura.Status == AssinaturaStatus.Ativo)`. Se o status for `Pendente`, o código tenta apenas ativar.
- **Como Resolver:** Expandir a lógica de toggle para permitir que assinaturas no estado `Pendente` também possam ser movidas para `Cancelado`.
