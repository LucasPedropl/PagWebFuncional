# Relatório Técnico: Falhas na API de WhatsApp

Este documento detalha os problemas identificados na API de envio de WhatsApp
(`PagWebV1`) e recomendações de correção.

---

## 1. Problemas Identificados na API (Backend)

### Problema A: NullReferenceException no Envio

- **Localização:** `api/PagWebV1/Services/UserService.cs` (aproximadamente na
  linha 2848).
- **Descrição:** O código tenta acessar `pagamento.Usuario.Telefone` antes de
  salvar o pagamento no banco de dados. Como o objeto `Usuario` é uma
  propriedade de navegação e o `pagamento` é uma nova instância,
  `pagamento.Usuario` está nulo.
- **Como Resolver:** Utilizar o objeto `cliente` (já carregado na linha 2811) em
  vez de `pagamento.Usuario`.
    - _Sugestão:_ Mudar para `to = cliente.Telefone`.

### Problema B: Duplicação de DDI (Prefixo 55)

- **Localização:** `api/PagWebV1/Services/UserService.cs` (método
  `WhatsappGenerico`, linha 3422).
- **Descrição:** A API concatena fixamente `"55"` ao início de cada número. Como
  o frontend agora envia números já formatados com DDI (ex: `55479...`), o
  resultado final enviado à API de mensagens é `5555479...`, o que invalida o
  envio.
- **Como Resolver:** Adicionar uma verificação para identificar se o número já
  possui o DDI (ex: 55). Caso o número venha apenas com o DDD e o número (10 ou
  11 dígitos), o sistema deve adicionar o prefixo "55". Se já possuir 12 ou 13
  dígitos e iniciar com o código do país, deve ser enviado como está.
    - _Sugestão:_ `if (dto.to.Length <= 11) { dto.to = "55" + dto.to; }` (ou
      verificar se já inicia com "55").

### Problema C: Falta de `instance_id` no DTO

- **Localização:** `api/PagWebV1/Services/UserService.cs` (linhas 2846-2850).
- **Descrição:** O DTO `WhatsappDtos` requer um `instance_id` para identificar
  por qual sessão de WhatsApp a mensagem deve sair. Atualmente, o ID está sendo
  enviado como `0` (padrão).
- **Como Resolver:** Buscar a instância de WhatsApp da empresa vinculada à
  assinatura e atribuir o `codWhats` ao campo `instance_id`.

### Problema D: Inicialização de Notificações

- **Localização:** `api/PagWebV1/Services/UserService.cs` (linhas 108, 1185,
  1979).
- **Descrição:** As configurações de WhatsApp estão sendo inicializadas como
  `false` em diversas partes do código.
- **Como Resolver:** Alterar a inicialização padrão para `true` para garantir
  que novos usuários e conexões já possuam o recurso ativo, a menos que optem
  por desativar.

---
