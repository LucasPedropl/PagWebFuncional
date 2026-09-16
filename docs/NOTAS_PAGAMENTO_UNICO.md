# Notas — correção da tela `/pagamento-unico` (cliente)

Escopo só no frontend. `api/` não foi alterada.

## O que mudou, arquivo a arquivo

### `features/single-payment/components/CobrancaPayDialogs.tsx`

- **P1.** `SearchSelect` (`components/ui/SearchSelect.tsx`) só tem `SelectOption { value, label, subLabel?, icon? }` — **não há opção desabilitada**. Caminho seguido: **remover** `Cartao` e `Transferencia` de `METODO_OPTIONS`, em vez de deixar visível e quebrado. O enum da API continua existindo; só saíram do dropdown. Texto do modo gateway-bloqueado atualizado: “caixa e dinheiro” (sem transferência).
- **P3.** `PaymentResultModal` renderiza `QRCodeSVG` (`qrcode.react`, mesmo padrão de `app/(business)/ConectarWhatsapp.tsx`) quando há `pixEmv`: fundo branco (`bgColor="#ffffff"` + container branco), 208px, `title` + `figcaption` acessíveis. Código copia e cola permanece. Aviso de expiração **15 a 30 minutos**, contrastando com boleto (dias). Boleto (`barcode` / `digitableLine` / `bankSlipUrl`) **não** ganha QR.

### `features/single-payment/services/pagamentoService.ts`

- **P2.** `formatPaymentGatewayError` reconhece a mensagem genérica `Erro ao solicitar pagamento. Tente novamente mais tarde.` (a que `unico-solicitar` devolve quando `PagamentoCora` retorna `null`). O texto da API **permanece**; acrescenta-se o aviso de que a causa mais comum — não confirmada — é endereço incompleto, com caminho para Configurações. Exporta `isGenericPaymentRequestFailure` para a página.
- **P4.** `parsePaymentResponse` **não** devolve mais o objeto todo-`null` quando o Zod falha. Continua logando `safeParse` no console. Critério abaixo.

### `features/single-payment/schemas/cobrancaSchemas.ts`

- Helpers `emptyPagamentoUnicoResponse` e `hasPagamentoUnicoInstrument` (algum de: `pixEmv`, `barcode`, `digitableLine`, `bankSlipUrl`, `invoiceId`).

### `app/(user)/PagamentoUnicoCliente.tsx`

- **P2.** Mesmo padrão de `Pagamentos.tsx` / `HistoricoServicos.tsx`: `useEnsureClientAddress` + `RequireAddressDialog`, com retentativa depois de salvar.
- Gate continua casando só com `isAddressMissingError` (`/endere[cç]o n[aã]o encontrado/i`) — quando a API passar a falar isso, o diálogo obrigatório abre sozinho.
- Na mensagem genérica atual: toast com o texto da API + hint, e um diálogo acionável (“Cadastrar endereço”) **sem afirmar** que o problema é endereço. Link para `/configuracoes`. Depois de salvar, retenta o POST.

### `docs/NOTAS_PAGAMENTO_UNICO.md`

- Este arquivo.

## Critério do item 4 (`parsePaymentResponse`)

`SolicitarUnico` **não devolve o DTO Bixs**. Devolve `Ok(codigoPagamento)` — uma **string JSON** (`PagamentoController.cs` linha 308). PIX chega como EMV (`000201…`); dinheiro chega como `"Pagamento em dinheiro registrado! Aguarde o repasse."`. O schema de objeto nunca casava; o código antigo transformava isso em “sucesso vazio”.

Critério adotado:

1. HTTP não-OK → lança, passando por `formatPaymentGatewayError` (texto da API visível).
2. Corpo string:
   - vazio ou `N/A` (bug do `?? "N/A"` no controller, linhas 226/240/263) → **erro**.
   - `metodo === 'Dinheiro'` **ou** texto com “pagamento em dinheiro” → sucesso **sem** código (confirmação textual).
   - EMV PIX / URL / linha digitável (47–48 dígitos) / código de barras (44 dígitos) → preenche o campo correspondente.
   - senão, fallback pelo método (`PIX`/`PixCaixa` → `pixEmv`; `Boleto`/`BoletoPix` → boleto).
3. Corpo objeto: `safeParse`; se falhar → `console.warn` + **lança** (não fabrica sucesso).
4. Objeto parseado **sem** nenhum instrumento e **sem** `invoiceId`: sucesso só se `metodo === 'Dinheiro'`; qualquer outro método → **erro**.

Dinheiro válido não vira erro. PIX/boleto sem código deixam de abrir o modal verde vazio.

## O que o backend precisa para fechar de vez

Arquivo: `api/PagWebV1/Controllers/PagamentoController.cs`.

1. **Checagem de endereço em `SolicitarUnico`** (a partir da linha 175), igual a `Solicitar` nas linhas 52–56: consultar `EnderecoUsers` e `return BadRequest("Endereço não encontrado para o usuário.");` **antes** de chamar `PagamentoCora`. Hoje `PagamentoCora` (linhas 610–614) retorna `null` se não há endereço, e as linhas 218–220/233–234/256–257 viram o genérico `Erro ao solicitar pagamento. Tente novamente mais tarde.`
2. **Não devolver `null` silencioso** em `PagamentoCora` linha 613: ou lançar, ou devolver a mesma mensagem de endereço da mensalidade.
3. **Cartão e transferência**: `case MetodoPagamento.Cartao` (linhas 228–229) e `Transferencia` (243–244) — implementar ou `BadRequest` explícito (`"Método não disponível."`), não o genérico. O frontend já tirou os dois do dropdown.
4. **Contrato da resposta** (linha 308 `return Ok(codigoPagamento);`, e o equivalente da mensalidade na 167): devolver o `PaymentResponseDto` (ou `{ pix_emv, barcode, digitable_line, bank_slip_url, cora_invoice_id }`) em vez de uma string. O frontend aceita os dois formatos; o DTO evita o classificador de string.
5. **Bug `?? "N/A"`** nas linhas 226, 240, 263, 299: `"N/A"` nunca é null, então `DigitableLine`/`BankSlipUrl` nunca saem. Trocar por encadeamento real (`PixEmv ?? Barcode ?? DigitableLine ?? BankSlipUrl`).
6. **Dinheiro** (linhas 245–252): pode continuar como texto; o frontend trata. Melhor no longo prazo: `200` com `{ status: "registered", paymentType: "Dinheiro" }` sem fingir código de pagamento.

Enquanto 1 e 4 não existirem, o frontend mitiga (hint de endereço + parse da string), mas o cliente ainda depende de heurística.
