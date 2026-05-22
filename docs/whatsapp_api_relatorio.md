# Relatório de Integração com a API do WhatsApp (Bixs)

Este documento detalha toda a lógica implementada na API backend (`PagWebV1`)
relacionada à integração e envio de mensagens via WhatsApp utilizando a API
externa `api.bixs.com.br`.

## 1. Visão Geral da Integração

O sistema utiliza a plataforma **Bixs API** para gerenciar instâncias do
WhatsApp (sessões conectadas via QR Code) e para realizar o envio de mensagens
transacionais aos clientes finais (notificações de cobrança, pagamentos,
assinaturas, etc).

- **Base URL da API Externa:** `https://api.bixs.com.br/v1/api/message/`
- **Autenticação:** Utiliza-se um Bearer Token gerenciado pela classe
  `TokenStorage`.

---

## 2. Gerenciamento de Sessões e Conexão (Controller)

O gerenciamento da conexão do WhatsApp (vincular o número da empresa ao sistema)
é feito no **`WhatsAppController.cs`**
(`api/PagWebV1/Controllers/WhatsAppController.cs`).

### Principais Endpoints e Fluxos (`WhatsAppController.cs`)

1. **`CriarInstanciaNaApi` (Linha ~80 - Método Interno)**
    - **Objetivo:** Cria uma nova instância/sessão do WhatsApp na API da Bixs
      para uma determinada empresa.
    - **Requisição:** `POST /instances` com o payload `{ "name": "idEmpresa" }`.
    - **Ação Local:** Salva o retorno (ID da instância, status, número de
      telefone) na tabela `WhatsApps` do banco de dados local.

2. **`Verificasessao` (Linha ~43 - Método Interno)**
    - **Objetivo:** Verifica o status atual da instância conectada.
    - **Requisição:** `GET /instances/{codWhats}/status`.
    - **Tratamento de Erro:** Caso a API externa retorne erro ou a instância não
      exista, ele define o status local como
      `"Erro ao verificar sessão na API externa ou função Deletada"` e o
      telefone como `"Erro"`, removendo a instância local em alguns casos.

3. **`ObterQrCodeFluxo` (Linha ~313 - Método Interno)**
    - **Objetivo:** Retorna o QR Code em base64 para que o administrador da
      empresa possa escanear e conectar seu aparelho.
    - **Requisição:** `GET /instances/{codWhats}/qrcode`.

4. **Endpoints Expostos (`api/v1/WhatsApps/`)**:
    - `GET /verificar`: Verifica o status da sessão do usuário logado.
    - `GET /criar`: Inicia o fluxo de criação de instância e retorna o QR Code.
    - `DELETE /desconectar`: Desconecta o aparelho (Requisição
      `DELETE /instances/{codWhats}`) e remove do banco de dados.
    - `GET /qrcode`: Retorna o QR Code de uma sessão existente que ainda não
      está conectada (`connected`).

---

## 3. Envio de Mensagens (Services)

A lógica centralizada de disparos de mensagens fica em **`UserService.cs`**
(`api/PagWebV1/Services/UserService.cs`).

### O Motor de Envio: `WhatsappGenerico` (Linha ~3420)

Este é o método base responsável por fazer a requisição HTTP final de disparo.

```csharp
public async Task<bool> WhatsappGenerico(WhatsappDtos dto)
```

- **Tratamento de Dados:** Antes de enviar, o método formata o número de
  telefone da propriedade `dto.to`. Ele adiciona o prefixo de país do Brasil
  (`55`) e remove parênteses, traços e espaços:
  `dto.to = "55" + dto.to.Replace("(", "").Replace(")", "").Replace("-", "").Replace(" ", "");`
- **Requisição Externa:** Faz um `POST` para
  `https://api.bixs.com.br/v1/api/message/messages/send`.
- **Payload:** O corpo da requisição é um JSON originado da classe
  `WhatsappDtos`, contendo propriedades como `to` (número formatado) e `message`
  (texto a ser enviado).
- **Retorno:** Retorna `true` se o envio tiver sucesso, e `false` caso ocorra
  falha.

---

### Gatilhos de Envio de Mensagem (`UserService.cs`)

O sistema envia mensagens baseando-se em eventos de negócio. **O envio só ocorre
se as configurações do usuário (`userconfig.WhatsApp`) ou as configurações da
assinatura (`assinConfig.WhatsApp`) permitirem**, através da flag lógica
condicional `deveEnviarWhats`.

Aqui estão os pontos exatos onde as mensagens são disparadas:

1. **Nova Assinatura Ativada (Linha ~2090)**
    - **Evento:** Quando um cliente realiza ou tem uma assinatura confirmada com
      sucesso.

2. **Lembrete de Mensalidades Recorrentes em Aberto (Linha ~2551)**
    - **Evento:** Rotina que lista as próximas faturas.

3. **Pagamento Confirmado (Linha ~2851)**
    - **Evento:** Quando a baixa de um pagamento ocorre.

4. **Pagamento Cancelado / Estornado (Linha ~3086 e ~3183)**
    - **Evento:** Quando um pagamento aprovado é posteriormente cancelado ou
      estornado.

5. **Aviso de Fatura Atrasada (Linha ~3410)**
    - **Evento:** Serviço rodando em background que varre mensalidades vencidas.

---

## 4. Erros Críticos e Falhas Pendentes (Ação Necessária)

Apesar das atualizações recentes, os seguintes itens ainda comprometem a
confiabilidade e a experiência do usuário:

### 4.1. Formatação de Mensagens Incorreta (Tags HTML)

- **O Problema:** Em diversos pontos do `UserService.cs` (ex:
  `GerarAssinaturaAsync` e `CancelarPagamentoAsync`), as mensagens enviadas via
  WhatsApp estão sendo montadas com tags HTML (`<h2>`, `<p>`, `<ul>`, `<li>`,
  `<b>`).
- **Impacto:** O WhatsApp não processa HTML. O cliente final recebe o texto
  bruto contendo as tags, tornando a leitura difícil e transmitindo amadorismo.
  Além disso, mensagens com tags HTML podem ser bloqueadas por filtros de
  segurança da API externa.
- **Caso Real:** Na criação de novas assinaturas, o sistema tenta enviar HTML
  puro, o que resultou em falha de entrega confirmada em testes.

### 4.2. Falhas Silenciosas em Blocos Vazios

- **O Problema:** Existem pelo menos 5 ocorrências de blocos
  `if (userconfig == null || assinConfig == null) { }` vazios no
  `UserService.cs`.
- **Impacto:** Se um usuário ou assinatura não possuir registro de configuração,
  o sistema simplesmente ignora o envio de notificações (E-mail e WhatsApp) sem
  registrar o motivo.

### 4.3. Falha na Lógica de Prefixo Telefônico (`55`)

- **O Problema:** No método `WhatsappGenerico`, a condição
  `if (dto.to.Length < 9)` para adicionar o prefixo `55` é insuficiente. Números
  brasileiros com DDD possuem 10 ou 11 dígitos (ex: `4392705677`).
- **Impacto:** Se o número for fornecido sem o `55`, o sistema não o adiciona,
  fazendo com que a API da Bixs rejeite o envio por "Número inválido".
- **Exemplo de Falha:** O número `554392705677` (12 dígitos) não entra na
  condição atual, e se vier sem o prefixo, continuará sem ele.

### 4.4. Instabilidades de Conexão (SSL/TLS)

- **Observação:** Logs recentes em `erros.txt` mostram
  `The SSL connection could not be established`.
- **Status:** O usuário informa que os servidores estão operacionais, porém o
  backend registrou alertas de TLS (InternalError) ao tentar se comunicar com a
  API da Bixs. É necessário monitorar se a biblioteca `HttpClient` está forçando
  uma versão de TLS compatível.

### 4.5. Gargalo de Performance em Lote

- **O Problema:** O processamento de mensalidades atrasadas no
  `MensalidadeAtrasadaWorker.cs` executa envios síncronos dentro de um laço
  `foreach`.
- **Impacto:** Com um grande volume de clientes, o worker pode demorar horas
  para concluir, bloqueando a thread e aumentando o risco de falhas por timeout.
- **Correção Necessária:** Implementar processamento paralelo ou disparar
  tarefas em background para os envios.

---

## 5. Itens Resolvidos (Histórico de Correções)

1.  **Concorrência ao Criar Sessão:** Resolvido com a implementação de
    `VerificaSessaoAPI`, que valida a existência da instância na Bixs antes de
    tentar criar uma nova.
2.  **Omissão de Erros (HTTP):** Adicionado `LogError` no `WhatsappGenerico`
    para capturar `ReasonPhrase` quando a API externa retorna erro.
3.  **Conflict - "Instância já existe":** Tratado via fluxo de verificação
    prévia no `WhatsAppController`.
