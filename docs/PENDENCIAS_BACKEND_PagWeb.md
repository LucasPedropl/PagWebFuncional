# Pendências de Backend — Relatório de Bugs e Melhorias PagWeb

Complemento de `docs/Relatorio_Bugs_Melhorias_PagWeb.md`.

O frontend foi corrigido no que era corrigível no frontend. Este documento lista o
que **só pode ser resolvido na API** (`api/PagWebV1`, ASP.NET Core), com a
referência exata de arquivo e linha. Todas as afirmações abaixo foram verificadas
lendo o código — não são suposições.

Referências de linha conferidas no estado do repositório em 16/09/2026.

---

## 1. Item 1.3 — Baixa automática de PIX não acontece (CRÍTICO)

O relatório pede "investigar a integração com a API do Banco Cora". A investigação
está feita. **O webhook existe**, mas está quebrado em quatro pontos independentes.

**Onde fica:** `Controllers/PagamentoController.cs:343`

```csharp
[HttpPost("repasse-bixs/{idEmpresa}")]
[AllowAnonymous]
public async Task<IActionResult> GetRepasseBixs(int idEmpresa, PagamentoRepasse repasse)
```

É registrado no gateway em `Services/ExternalTokenManagerService.cs:270`, com o
escopo `invoice.paid` (`CadatrarWebHook`, linha 299). Ou seja: a intenção de
receber a confirmação de pagamento está lá. Ela nunca chega.

### Bug 1.3.a — A URL registrada no gateway não casa com a rota

`ExternalTokenManagerService.cs:269-270`:

```csharp
var webhookSecret = Guid.NewGuid().ToString();
string url = $"{request.Scheme}://{request.Host}" + $"/api/v1/Pagamento/repasse-bixs/{webhookSecret}";
```

O segmento final é preenchido com o **secret (GUID)**, mas a rota declara
`{idEmpresa}` e a action recebe `int idEmpresa`. Um GUID não faz binding para
`int` — a requisição do gateway morre em 400 antes de entrar no método.

**Correção:** decidir qual é o contrato e alinhar os dois lados. O caminho mais
seguro é `repasse-bixs/{idEmpresa:int}` na rota e a URL montada com o
`IdEmpresa` real, validando o `secret` pelo header/body (que é para isso que ele
serve) em vez de expô-lo na URL. Hoje o secret está na URL **e** não é conferido
em lugar nenhum dentro da action — um endpoint `[AllowAnonymous]` sem validação
de origem.

### Bug 1.3.b — A busca do pagamento compara identificadores diferentes

`PagamentoController.cs:355-359`:

```csharp
string transacaoId = repasse.Data.InvoiceId;
var pagamento = await _context.Pagamentos.FirstOrDefaultAsync(p => p.TransacaoId == transacaoId);
if (pagamento == null) { return BadRequest(); }
```

Só que `TransacaoId` é gravado como `resultado.ExternalCode`
(`PagamentoController.cs:79, 93, 116, 152, 222, 236, 259, 295`), e o
`ExternalCode` é um GUID **gerado pelo próprio PagWeb** (`tokenGerado`,
`PagamentoController.cs:202` e `615`) e enviado ao Cora no `PaymentRequestDto`.

`InvoiceId` (id da fatura no Cora) e `ExternalCode` (nosso GUID) são coisas
distintas. A comparação nunca é verdadeira.

**Correção:** persistir o id da fatura devolvido pelo gateway. O
`PaymentResponseDto` já é lido pelo frontend com `cora_invoice_id`
(ver `features/single-payment/schemas/cobrancaSchemas.ts`), então o dado existe
na resposta. Guardar em uma coluna nova (`Pagamento.InvoiceIdGateway`) e buscar
por ela — ou, alternativamente, casar por `ExternalCode` se o webhook do gateway
devolver esse campo também. Não sobrescrever `TransacaoId`: ele é usado na busca
de pagamentos (`UserService.cs:1839`) e no extrato (`PagamentoController.cs:559, 586`).

### Bug 1.3.c — O status aplicado é `Repassado`, não `Pago`

`PagamentoController.cs:378` (mensalidade) e `PagamentoController.cs:443` (cobrança):

```csharp
cobranca.Status = MensalidadeStatus.Repassado;
```

`Repassado` significa "o dinheiro foi repassado ao estabelecimento" — é um evento
de liquidação, diferente de "o cliente pagou". O evento assinado no gateway é
`invoice.paid`. Com a semântica atual, a visão do cliente nunca chega em `Pago`.

**Correção:** `invoice.paid` deve marcar `MensalidadeStatus.Pago`. O repasse ao
estabelecimento é outro momento e já tem endpoint próprio
(`POST /api/v1/Pagamento/{idPagamento}/confirmar-repasse`,
`PagamentoController.cs:321`), que é quem deveria escrever `Repassado`.

### Bug 1.3.d — Todas as falhas são silenciosas

`PagamentoController.cs:349, 353, 359` retornam `BadRequest()` puro: sem corpo,
sem `ErroRegistro.LogError`. Quando o webhook falha — e ele falha sempre hoje —
não sobra rastro nenhum para diagnosticar. Foi por isso que o problema chegou
como "o sistema não processou o webhook" em vez de um erro identificável.

**Correção:** logar toda rejeição com o payload recebido. Considerar responder
`200` em payload desconhecido para não disparar a política de retry do gateway,
reservando `4xx` para erro real de contrato.

---

## 2. Item 3.1 — Payload do PIX impresso cru no e-mail

**Onde fica:** duas ocorrências idênticas.

- `Services/UserService.cs:3244` — método `NotificarPagamentoUnico` (linha 3100), cobrança avulsa
- `Services/UserService.cs:3063` — método `NotificarPagamento` (linha 2923), mensalidade

```csharp
<strong>Código para pagamento {tipoPagamento}:</strong> <span style='...'> {pagamento} </span>
```

`{pagamento}` é o EMV do PIX (ou a linha digitável) interpolado direto no HTML.

**Correção pedida no relatório:**
1. Trocar a string solta por um CTA — botão "Copiar código PIX" ou link para a
   fatura online com QR Code. Note que `EnviarEmailGenerico` já tem o parâmetro
   `string? link` na assinatura (`Services/IUserService.cs:72`) e ele está sendo
   passado como `null` nas duas chamadas.
2. Adicionar o aviso de expiração do PIX (15 a 30 min), diferenciando de boleto.

**Atenção de segurança:** `{tipoPagamento}`, `{pagamento}`, `cobranca.Descricao`,
`empresa.Nome` e os nomes de produtos/serviços são concatenados em HTML sem
escape em todo esse bloco. Descrição de cobrança é texto livre vindo do
estabelecimento — dá para injetar HTML no e-mail de terceiros. Vale encodar.

---

## 3. Item 2.1 — Endereço

O frontend já foi corrigido para não relatar sucesso quando a gravação não
aconteceu, mas a causa raiz é de API.

### 3.a — Não existe GET de endereço

`Controllers/EnderecoController.cs` expõe só `POST /usuario`, `POST /empresa` e
`PATCH /{id}`. Nenhum outro controller devolve o endereço do usuário logado.

Consequência: o frontend só sabe o `IdEndereco` se tiver guardado no
`localStorage` no momento do POST. Em outro navegador, outro dispositivo, ou
depois de limpar o storage, esse id é perdido para sempre e **não há como
recuperá-lo** — o endereço vira ineditável.

**Correção:** `GET /api/v1/Endereco/usuario` e `GET /api/v1/Endereco/empresa`
devolvendo a entidade do vínculo do usuário autenticado. É o conserto de raiz.

### 3.b — O POST duplicado devolve erro genérico

`EnderecoUser` é 1:1 com chave composta (`Data/AppDbContext.cs:107`). Um segundo
`POST /usuario` estoura na constraint, cai no `catch` e vira
`BadRequest("Erro ao criar endereço para o usuário.")` — indistinguível de
qualquer outra falha.

**Correção:** verificar a existência antes do insert e responder `409 Conflict`
com o `IdEndereco` existente. Isso sozinho já resolveria o 3.a na prática.

### 3.c — `POST /empresa` não devolve a entidade

`EnderecoController.cs`, `CreateEndEmpresa` retorna
`Ok("Endereço vinculado à empresa.")`, enquanto `CreateEndUser` retorna
`Ok(endereco)`. O frontend não consegue capturar o `IdEndereco` da empresa.

**Correção:** retornar a entidade, igual ao de usuário.

### 3.d — Falta a coluna `complemento`

`Models/Endereco.cs` não tem `complemento`. O campo foi adicionado no formulário
e já é enviado no payload (ASP.NET ignora propriedade desconhecida), então ele
passa a funcionar sozinho assim que a API acompanhar:

1. Coluna `complemento` (nullable, `MaxLength(120)`) em `Models/Endereco.cs` + migration
2. Campo em `EnderecoInputDto` e `EnderecoUpdateDto` (`Dtos/EnderecoDtos.cs`)
3. Mapeamento nos três handlers do `EnderecoController`
4. Repassar em `CustomerPaymentRequestDto.Address` (`PagamentoController.cs:624`),
   se o gateway aceitar complemento

---

## 4. Item 2.2 — Cobrança avulsa sem data de vencimento

### 4.a — O modelo não tem data nenhuma

`Models/Cobranca.cs` não tem vencimento nem data de criação. `POST /api/Cobrancas`
grava sempre `Status = MensalidadeStatus.Aberto` (`CobrancasController.cs:361`).

Sem isso, "vencido" é indeterminável no servidor — não existe `Atrasado`
automático para cobrança avulsa, só mudança manual de status.

### 4.b — O vencimento enviado ao Cora é fixo em 7 dias

`PagamentoController.cs:639`, dentro de `PagamentoCora`:

```csharp
DueDate = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd"),
```

Para mensalidade o código usa `mensalidade.DataVencimento` (linha 666); para
cobrança avulsa não tem de onde tirar, então cravou 7 dias. O boleto/PIX gerado
vence numa data que ninguém escolheu.

**Correção:**
1. `DataVencimento` (`DateTime`) e `DataCriacao` (`DateTime`) em `Models/Cobranca.cs` + migration
2. `DataVencimento` obrigatório em `CobrancaDtosPost` (`Dtos/CobrancaDtos.cs`) — o frontend já envia
3. Expor `DataVencimento` nas três projeções de leitura do `CobrancasController` (`GetCobranca`, `GetCobrancaUsuario`, `GetCobranca(id)`)
4. Usar `cobra.DataVencimento` na linha 639 em vez do `AddDays(7)`
5. Worker que vire `Aberto → Atrasado` quando a data passar, espelhando o `MensalidadeAtrasadaWorker`

Enquanto isso não existe, o frontend guarda o vencimento localmente e deriva o
status na exibição. É paliativo: não sobrevive a troca de dispositivo e não
alcança o e-mail/WhatsApp disparados pelo servidor.

---

## 5. Item 4 — Regras de Cobrança sem persistência no servidor

A tela existe e funciona, mas grava em `localStorage` por empresa. Para valer de
verdade — sobretudo para a régua de notificações, que é disparada por worker no
servidor — é preciso:

1. Tabela `EmpresaRegrasCobranca`: `IdEmpresa` (PK/FK), `TaxaPadraoPercent`,
   `MultaAtrasoPercent`, `JurosAtrasoMesPercent`, `Notificar5DiasAntes`,
   `Notificar2DiasAntes`, `NotificarNoVencimento`, `NotificarAposVencimento`,
   `TemplateEmail`, `TemplateWhatsapp`
2. `GET` e `PUT /api/v1/Empresa/regras-cobranca` (escopo Admin, empresa do token)
3. `Workers/MensalidadeNotifierService.cs` lendo os gatilhos da régua em vez da
   cadência fixa atual, e injetando `TemplateEmail` / `TemplateWhatsapp` no corpo
4. `Workers/MensalidadeAtrasadaWorker.cs` aplicando multa e juros da empresa

A fórmula usada no frontend está em
`features/billing-rules/utils/lateCharges.ts` e deve ser replicada igual para não
divergir do que o cliente vê: multa percentual única a partir do 1º dia de
atraso, juros ao mês rateados por dia corrido (base 30 dias), ambos sobre o
principal.

---

## 6. Item 4.1.3 — Multa e juros não chegam ao gateway

`POST /api/v1/Pagamento/unico-solicitar` recebe só o id da cobrança e monta o
valor a partir de `cobra.ValorTotal` (`PagamentoController.cs:621`):

```csharp
Amount = (int)(cobra.ValorTotal * 100),
```

O frontend recalcula e exibe o valor atualizado, mas o QR Code / boleto gerado
continua saindo com o valor original. **O cliente paga o valor sem multa.**

**Correção:** aplicar as regras do item 5 no servidor no momento de montar o
`PaymentRequestDto`, usando `DataVencimento` do item 4. Sem os itens 4 e 5, este
não tem como ser feito — é a dependência final da cadeia.

---

## Ordem sugerida

| # | Item | Por quê |
|---|------|---------|
| 1 | 1.3.a + 1.3.b + 1.3.c | Cliente paga e o sistema não registra. É perda de dinheiro rastreável. |
| 2 | 3.a / 3.b | Endereço ineditável bloqueia o cadastro, e endereço inválido faz o gateway recusar o pagamento. |
| 3 | 4.a / 4.b | Destrava vencimento real, status `Atrasado` e o boleto com a data certa. |
| 4 | 3.1 | UX de e-mail + o escape de HTML, que é risco de injeção. |
| 5 | 5 + 6 | Régua e inadimplência de verdade, ponta a ponta. |
| 6 | 3.c / 3.d | Acabamento. |
