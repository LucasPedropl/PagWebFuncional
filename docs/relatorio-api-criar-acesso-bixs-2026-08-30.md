# `solicitar-acesso` responde 400 e ninguém consegue saber por quê

> **Data:** 30/08/2026 · **Para:** backend **Arquivo:**
> `Services/ExternalTokenManagerService.cs`, método `CriarAcesso` (linha 390)
> **Rota afetada:** `POST /api/v1/User/solicitar-acesso`

## Sintoma

Uma conta consegue solicitar os módulos; outra falha **sempre**, com qualquer
código de verificação, inclusive um recebido segundos antes:

```
POST /api/v1/User/solicitar-acesso → 400  "Erro ao criar acesso."
```

O frontend traduz esse texto para _"código de verificação expirado ou já
utilizado"_ — o palpite mais provável dado que a API não oferece nenhum outro
dado. Isso já custou várias trocas de código atrás de uma causa que não estava
lá.

**Medido em 30/08:**

| Conta                                             | `Telefone` gravado                       | Resultado |
| ------------------------------------------------- | ---------------------------------------- | --------- |
| criada via `curl` direto no `POST /User/register` | `27999990001` (11 dígitos)               | **passa** |
| criada pela tela de cadastro do app               | `55` + 11 dígitos = `5527…` (13 dígitos) | **falha** |

Confirmado com o usuário: o e-mail que falha **não existe na Bixs**. Portanto o
caminho executado é o de **criação**, e é a criação que a Bixs recusa.

---

## Defeito 1 — o corpo do erro da Bixs é lido e jogado fora

**Este é o defeito principal, e o mais barato de corrigir.** Enquanto ele
existir, todo diagnóstico deste fluxo é chute.

```csharp
HttpResponseMessage response = await _httpClient.SendAsync(request);

if (response.IsSuccessStatusCode) { /* ... */ }
else
{
    string erroJson = await response.Content.ReadAsStringAsync();   // ← lido

    if (response.StatusCode == HttpStatusCode.Conflict) { /* ... */ }

    return null;                                                    // ← e descartado
}
```

A Bixs **diz** qual campo recusou. `erroJson` contém essa resposta, e ela é
descartada sem nenhum registro. O `status code` também se perde. O que sobra é
`null`.

**Correção — uma linha, e ela responde a pergunta deste relatório:**

```csharp
else
{
    string erroJson = await response.Content.ReadAsStringAsync();
    _logger.LogWarning(
        "Bixs recusou POST /v1/api/directory/clients para {Email}: {Status} {Corpo}",
        user.Email, (int)response.StatusCode, erroJson);
    // ... resto igual
}
```

O método já tem acesso ao `IServiceProvider` (usado no `catch` para `LogError`)
— dá para usar o mesmo caminho sem trocar a assinatura de nada.

---

## Defeito 2 — `null` é a resposta para tudo, e vira uma frase só

`CriarAcesso` devolve `null` para: Bixs recusando o `cellphone`, Bixs recusando
a senha, código de verificação inválido, provedor fora do ar, 2xx sem `id`,
exceção. O controller transforma todos em `400 "Erro ao criar acesso."`.

**Correção.** Devolver o motivo e repassá-lo. Separar, no mínimo, o que o
usuário pode resolver do que ele não pode:

| Situação                                   | Resposta                                         |
| ------------------------------------------ | ------------------------------------------------ |
| Bixs recusou um campo (400/422)            | `400` com a mensagem da Bixs                     |
| Código inválido/expirado (a Bixs diz isso) | `400` — "Código inválido ou expirado"            |
| Bixs indisponível / 5xx / timeout          | `502` — "Provedor indisponível, tente novamente" |
| 2xx sem `id`                               | `502` — e logar o corpo recebido                 |

Enquanto as quatro forem a mesma frase, o front vai continuar chutando "código
expirado", porque é a única hipótese que ele tem.

---

## Defeito 3 — o `cellphone` enviado tem formato inconsistente

`CriarAcesso` envia o telefone cru, como está no banco:

```csharp
var requestBody = new
{
    email = user.Email,
    name = user.Nome + " " + user.SobreNome,
    password = password,
    cellphone = user.Telefone,        // ← sem normalização
    role = "client",
    verification_code = code
};
```

E o cadastro grava com DDI colado (`Register.tsx:234` —
`telefone: formData.ddi + cleanPhone`, com `ddi` valendo `'55'` por padrão),
enquanto um cadastro feito direto pela API pode gravar 11 dígitos sem DDI. São
dois formatos diferentes na mesma coluna, e o único caso que passou foi o de 11
dígitos.

**Isto é o candidato mais forte, não uma conclusão** — a prova está no
`erroJson` do defeito 1. Corrigido aquele, uma execução responde.

**Correção.** Normalizar no adaptador, imediatamente antes de enviar, no formato
que a Bixs documenta (E.164 com `+`, ou só dígitos nacionais — o que for).
Normalizar aqui, e não no cadastro, é o que também conserta as linhas que já
estão gravadas nos dois formatos.

---

## Defeito 4 — comparação de string exata contra a mensagem de um terceiro

No ramo de 409 (e-mail já cadastrado na Bixs):

```csharp
if (erroBixs?.message == "E-mail já cadastrado")     // linha 438
```

Um ponto final a mais, um acento diferente, ou um 409 por outro motivo
(`"CPF já cadastrado"`) fazem o `if` não entrar, e o método cai direto no
`return null`. A integração passa a depender de a Bixs nunca reescrever uma
frase.

**Não é a causa do caso relatado** (o e-mail em questão não existe na Bixs), mas
é a próxima falha silenciosa da fila.

**Correção.** Ramificar pelo status 409 e, se precisar distinguir motivos, por
um campo estável de código de erro. Nunca pelo texto.

> **Observação sobre o fallback do 409.** Quando o e-mail já existe, o código
> tenta `POST /v1/auth/login` **com a senha do PagWeb** (linha 440), presumindo
> que ela seja a senha da conta Bixs. São cadastros independentes; quando não
> coincidem, o vínculo é impossível e o usuário recebe a mesma frase genérica.
> Vale rever junto com o defeito 2.

---

## Onde a conta Bixs é criada (para não procurar no lugar errado)

| Etapa                | Rota                                 | O que faz na Bixs                                                                               |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Pedir o código       | `GET /api/v1/User/verificationCode/` | `POST /v1/api/directory/clients/verification/send-code` — **só envia o e-mail**, não cria conta |
| Enviar a solicitação | `POST /api/v1/User/solicitar-acesso` | `POST /v1/api/directory/clients` — **é aqui que a conta Bixs é criada**                         |
| Master aprovar       | `PUT /api/ControleAcessos/{id}`      | `AtualizarAcesso(IdBixs)` — **exige a conta já existir**                                        |

Ou seja: não existir na Bixs **antes** de enviar a solicitação é o comportamento
correto. Não existir **depois** de uma solicitação que respondeu 400 também é
coerente — a criação é exatamente o que falhou.

## Como verificar a correção

Aplicado o defeito 1, refazer a solicitação com a conta que falha e ler o log. A
linha vai nomear o campo recusado. Se for o `cellphone`, o defeito 3 é a
correção; se for a senha, é política de senha da Bixs; se for o código, aí sim é
o OTP.
