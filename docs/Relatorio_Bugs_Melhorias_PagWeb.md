# Relatório Detalhado de Bugs e Melhorias - Plataforma PagWeb

Este documento expande os apontamentos do documento de testes original, detalhando o contexto visual e os comportamentos esperados para facilitar a correção pela equipe de desenvolvimento.

---

## 1. Dashboard do Cliente e Fluxo de Pagamentos

### 1.1. Exibição indevida de elementos no painel do Cliente
* **Contexto:** Ao realizar o login com perfil de "Cliente", a interface está herdando componentes visuais do painel de "Empresa".
* **O que foi observado na imagem:** O menu lateral esquerdo exibe logos e opções completas. O menu superior/direito exibe um dropdown para seleção de "Estabelecimento".
* **Correção Necessária:** 
  * Ocultar/remover a imagem do logo em ambos os menus (esquerdo e direito) para o perfil Cliente.
  * Ocultar a opção de alternância de "Estabelecimento" quando o usuário logado for estritamente um cliente final.

### 1.2. Interatividade ausente no card "Total Pendente"
* **Contexto:** O dashboard possui um card de resumo financeiro chamado "Total Pendente" (exibindo, no teste, R$ 339,70).
* **O que foi observado na imagem:** Abaixo dos cards, há uma listagem de "Pagamento Único". No entanto, o usuário relata que o card resumo não é clicável/interativo.
* **Correção Necessária:** Transformar o card "Total Pendente" em um elemento interativo. Ao clicar sobre ele, a tela deve rolar ou filtrar automaticamente a listagem abaixo para exibir **apenas** os boletos e faturas pendentes que compõem aquele valor total.

### 1.3. Falha na baixa automática de faturas pagas via PIX
* **Contexto:** Na listagem de "Pagamento Único", faturas recentes estão sendo listadas.
* **O que foi observado na imagem:** A fatura referente a "UAI PDV URBANO" no valor de R$ 5,00 consta com o status `• Aberto`.
* **O Problema:** O cliente efetuou o pagamento desta fatura via PIX. O valor já foi compensado e conferido na conta corrente (Banco Cora). O sistema não processou o webhook/retorno bancário para alterar o status.
* **Correção Necessária:** 
  * Investigar a integração com a API do Banco Cora.
  * Garantir que, ao receber o payload de confirmação do PIX, o sistema altere o status da fatura de "Aberto" para "Pago" em tempo real (ou com delay mínimo) na view de Pagamento Único do cliente.

---

## 2. Formulários e Cadastros

### 2.1. Erro ao Salvar Endereço e UX Incompleta
* **Contexto:** Tela de `Configurações > Meu Perfil > Endereço residencial`.
* **O que foi observado na imagem:** O formulário possui os campos CEP, Rua/Logradouro, Número, Bairro, Cidade e Estado. 
* **Os Problemas:**
  1. O botão "Salvar endereço" não está persistindo as informações no banco de dados (ação falha silenciosamente ou retorna erro invisível ao usuário).
  2. Falta um campo crucial para endereços brasileiros.
* **Correção Necessária:**
  * Depurar o endpoint de `PUT/POST` do endereço para garantir a persistência dos dados.
  * **Adicionar novo campo:** Inserir o campo "Complemento" no formulário para permitir o cadastro de detalhes como "Apto", "Casa", "Condomínio", "Bloco", etc.

### 2.2. Modal "Nova Cobrança Avulsa" sem Data de Vencimento
* **Contexto:** Ação realizada com login de "Empresa" ao tentar criar uma cobrança manual.
* **O que foi observado na imagem:** O modal possui campos para Cliente, Serviços, Produtos, Descrição, Valor Total e Observação interna. Não há definição de prazo.
* **Correção Necessária:**
  * **Adicionar novo campo:** É obrigatório incluir um seletor de "Data de Vencimento" no modal de criação de cobrança avulsa.
  * **Regra de Negócio (Status):** Após clicar em "Cadastrar cobrança", o sistema deve categorizar automaticamente essa cobrança na esteira de recebíveis, utilizando os status: `A Pagar` (visão cliente) / `A receber` (visão empresa) e, caso a data passe, alterar para `Atraso`.

---

## 3. Comunicação Transacional (E-mails)

### 3.1. Má formatação do "Código PIX" no E-mail de Cobrança
* **Contexto:** E-mail automático disparado pelo sistema ("Solicitação de Pagamento - PagWeb").
* **O que foi observado na imagem:** O sistema está imprimindo o payload completo do PIX (o código "Copia e Cola" gigantesco, ex: `00020101021226...`) diretamente em texto puro no corpo do e-mail.
* **Correção Necessária (Melhoria de UX):**
  * Ocultar essa string longa de texto puro.
  * Substituir por um **Botão CTA** (ex: "Copiar Código PIX" ou "Validar Pagamento") ou um Link formatado. 
  * Se for botão de cópia, usar script para copiar para a área de transferência, ou direcionar para uma landing page (fatura online) onde o QR Code e o botão de copiar estejam visíveis.
* **Atenção à Regra de Negócio:** Adicionar um aviso claro no e-mail informando que o PIX expira em **15 a 30 minutos** (diferenciando-o da dinâmica de um código de barras de boleto tradicional que dura dias).

---

## 4. Novos Requisitos de Sistema a Implementar

A equipe deve criar uma nova seção de parametrização em `Configurações` chamada **Regras de Cobrança**, contendo:

* **Taxas:** Configuração de taxa padrão.
* **Multa por atraso:** Campo configurável (Sugestão de default: `2,00%`).
* **Juros por atraso:** Campo configurável (Sugestão de default: `1,00%` ao mês).
* **Régua de Cobrança (Notificações):** Checkboxes para ativar e-mails/alertas automatizados:
  * [ ] 5 dias antes do vencimento
  * [ ] 2 dias antes do vencimento
  * [ ] No Vencimento
  * [ ] Avisar sempre, após o vencimento
* **Templates de Mensagem:** Campo de texto (textarea) para definir uma mensagem padrão que acompanhará o corpo dos e-mails e das mensagens de WhatsApp.

### 4.1. Dicas de Arquitetura e Regras de Negócio
1. **Centralização (Visão Cliente):** Todas as modalidades de "Cobrança Única" devem ficar centralizadas no menu "Fatura do Cliente" quando ele estiver logado, permitindo obrigatoriamente a filtragem por Status (Pago, Aberto, Atrasado).
2. **Meios de Pagamento:** O cliente final deve ter, na sua tela de fatura, a opção clara de escolher entre: Código de Barras (Boleto), QR Code PIX ou Código PIX "Copia e Cola".
3. **Cálculo de Inadimplência:** 
   * Quando a cobrança for gerada via Boleto ou PIX e estiver vencida, o sistema já deve injetar a Multa e os Juros no valor final de exibição.
   * Ao solicitar o pagamento via PIX de uma conta atrasada, a taxa/valor final atualizado deve ser recalculada instantaneamente no momento da geração do novo payload/QR Code.
